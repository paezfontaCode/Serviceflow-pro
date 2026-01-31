from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.customer import Customer
from ...models.repair import Repair
from ...models.sale import Sale
from ...schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate, CustomerProfile
from ..deps import get_current_active_user
from ...utils.pdf_generator import PDFGenerator
from reportlab.platypus import Paragraph, Spacer, Table
from reportlab.lib.units import inch
from ...models.finance import AccountReceivable, CustomerPayment
import pandas as pd

router = APIRouter(tags=["customers"])

@router.get("/", response_model=List[CustomerRead])
def read_customers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    search: str = None
):
    query = db.query(Customer)
    
    # Search by name, phone, or email
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.phone.ilike(search_filter)) |
            (Customer.email.ilike(search_filter)) |
            (Customer.dni.ilike(search_filter))
        )
    
    return query.offset(skip).limit(limit).all()

@router.get("/search", response_model=List[CustomerRead])
def search_customers(
    q: str = "",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Quick search endpoint for customer autocomplete"""
    if not q or len(q) < 2:
        return []
    
    search_filter = f"%{q}%"
    customers = db.query(Customer).filter(
        (Customer.name.ilike(search_filter)) |
        (Customer.phone.ilike(search_filter)) |
        (Customer.dni.ilike(search_filter))
    ).limit(10).all()
    
    return customers

@router.post("/", response_model=CustomerRead)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    try:
        # Check if email/dni/phone exists to provide better error messages
        if customer_in.email:
             existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
             if existing:
                 raise HTTPException(status_code=400, detail="Este email ya está registrado.")
        
        if customer_in.dni:
             existing = db.query(Customer).filter(Customer.dni == customer_in.dni).first()
             if existing:
                 raise HTTPException(status_code=400, detail="Esta cédula/RIF ya está registrada.")
        
        db_customer = Customer(**customer_in.model_dump())
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating customer: {e}")
        raise HTTPException(status_code=400, detail=f"Error al crear cliente: {str(e)}")

@router.get("/{customer_id}", response_model=CustomerRead)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/{customer_id}/profile", response_model=CustomerProfile)
def read_customer_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Fetch Related Data
    
    # 1. Repairs
    repairs = db.query(Repair).filter(Repair.customer_id == customer_id).order_by(Repair.created_at.desc()).all()
    active_repairs = [r for r in repairs if r.status in ['received', 'technical_review', 'pending_approval', 'in_progress', 'ready']]
    repair_history = [r for r in repairs if r.status in ['delivered', 'cancelled']][:5]
    
    # 2. Sales & Spending
    sales = db.query(Sale).filter(Sale.customer_id == customer_id).order_by(Sale.created_at.desc()).all()
    recent_sales = sales[:5]
    
    total_spent = sum(sale.total_usd for sale in sales)
    last_purchase_date = sales[0].created_at.date() if sales else None
    
    # 3. Financial Transactions (Ledger)
    from ...models.finance import AccountReceivable, CustomerPayment
    
    # Charges (Debts)
    charges = db.query(AccountReceivable).filter(AccountReceivable.customer_id == customer_id).all()
    transaction_list = []
    
    for charge in charges:
        transaction_list.append({
            "id": charge.id,
            "date": charge.created_at,
            "type": "CHARGE",
            "amount": charge.total_amount,
            "reference": f"Credit Sale #{charge.sale_id}" if charge.sale_id else f"Repair #{charge.repair_id}",
            "description": charge.notes or "Cargo a cuenta"
        })
        
    # Payments (Abonos)
    payments = db.query(CustomerPayment).filter(CustomerPayment.customer_id == customer_id).all()
    for payment in payments:
        transaction_list.append({
            "id": payment.id,
            "date": payment.payment_date,
            "type": "PAYMENT",
            "amount": payment.amount_usd,
            "reference": payment.reference,
            "description": f"Abono ({payment.payment_method})"
        })
        
    # Sort transactions by date desc
    transaction_list.sort(key=lambda x: x["date"], reverse=True)
    
    # Construct profile
    profile_data = {
        **customer.__dict__,
        "total_spent": total_spent,
        "last_purchase_date": last_purchase_date,
        "active_repairs": active_repairs,
        "repair_history": repair_history,
        "recent_sales": recent_sales,
        "transactions": transaction_list
    }
    
    return profile_data

@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has sales or repairs
    # For now, we'll allow deletion (could add soft delete later)
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

@router.get("/export-csv")
def export_customers_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "name", "dni", "email", "phone", "address", 
        "current_debt", "payment_terms"
    ])
    
    customers = db.query(Customer).all()
    
    for c in customers:
        writer.writerow([
            c.name, c.dni or "", c.email or "", 
            c.phone or "", c.address or "",
            float(c.current_debt or 0), c.payment_terms or 30
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers.csv"}
    )

@router.post("/import-csv")
async def import_customers_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")
    
    contents = await file.read()
    try:
        decoded = contents.decode('utf-8')
    except UnicodeDecodeError:
        decoded = contents.decode('latin-1')
        
    delimiter = ','
    if ';' in decoded and decoded.count(';') > decoded.count(','):
        delimiter = ';'
        
    input_file = io.StringIO(decoded)
    reader = csv.DictReader(input_file, delimiter=delimiter)
    
    # Normalize headers
    if reader.fieldnames:
        reader.fieldnames = [field.strip().lower().replace('ï»¿', '') for field in reader.fieldnames]
    
    # Validation: Check for required columns
    required_cols = {'name'} # DNI is recommended but name is absolute min
    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        missing = required_cols - set(reader.fieldnames if reader.fieldnames else [])
        raise HTTPException(
            status_code=400, 
            detail=f"Faltan columnas requeridas: {', '.join(missing)}."
        )
    
    stats = {"created": 0, "updated": 0, "errors": 0}
    
    for row in reader:
        try:
            row = {k: v for k, v in row.items() if k}
            name = row.get("name")
            dni = row.get("dni")
            
            if not name:
                continue
                
            # Check if customer exists by DNI
            existing = None
            if dni:
                existing = db.query(Customer).filter(Customer.dni == dni).first()
            
            if existing:
                # Update
                existing.name = name
                existing.email = row.get("email", existing.email)
                existing.phone = row.get("phone", existing.phone)
                existing.address = row.get("address", existing.address)
                if row.get("payment_terms"):
                    try:
                        existing.payment_terms = int(row.get("payment_terms"))
                    except: pass
                stats["updated"] += 1
            else:
                # Create
                new_customer = Customer(
                    name=name,
                    dni=dni,
                    email=row.get("email"),
                    phone=row.get("phone"),
                    address=row.get("address")
                )
                if row.get("payment_terms"):
                    try:
                        new_customer.payment_terms = int(row.get("payment_terms"))
                    except: pass
                db.add(new_customer)
                stats["created"] += 1
                
        except Exception as e:
            print(f"Error importing customer row {row}: {e}")
            stats["errors"] += 1
            continue
            
    db.commit()
    return stats

@router.get("/{customer_id}/export-history")
def export_customer_history(
    customer_id: int,
    format: str = "pdf",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Export all transactions (Sales, Repairs, Payments) for a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    # Gather Data (Similar to Profile endpoint)
    repairs = db.query(Repair).filter(Repair.customer_id == customer_id).order_by(Repair.created_at.desc()).all()
    sales = db.query(Sale).filter(Sale.customer_id == customer_id).order_by(Sale.created_at.desc()).all()
    charges = db.query(AccountReceivable).filter(AccountReceivable.customer_id == customer_id).all()
    payments = db.query(CustomerPayment).filter(CustomerPayment.customer_id == customer_id).all()
    
    # Unified transaction list
    data_list = []
    for s in sales:
        data_list.append({"date": s.created_at, "type": "VENTA", "ref": f"#{s.id}", "amount": float(s.total_usd)})
    for r in repairs:
        total = (r.labor_cost_usd or 0) + (r.parts_cost_usd or 0)
        data_list.append({"date": r.created_at, "type": "REPARACIÓN", "ref": f"#{r.id} ({r.device_model})", "amount": float(total)})
    for p in payments:
        data_list.append({"date": p.payment_date, "type": "PAGO/ABONO", "ref": p.reference or "N/A", "amount": -float(p.amount_usd)})
    
    data_list.sort(key=lambda x: x["date"], reverse=True)

    if format == "pdf":
        pdf = PDFGenerator(filename_prefix=f"historial_{customer_id}")
        elements = pdf.create_standard_header(db, f"ESTADO DE CUENTA: {customer.name}")
        
        # Summary
        debt = float(customer.current_debt or 0)
        elements.append(Paragraph(f"DNI/RIF: {customer.dni or 'N/A'}", pdf.styles['Normal']))
        elements.append(Paragraph(f"Saldo Pendiente: ${debt}", pdf.styles['Normal']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Table
        table_data = [["Fecha", "Tipo", "Referencia", "Monto (USD)"]]
        for item in data_list:
            table_data.append([
                item["date"].strftime("%d/%m/%Y"),
                item["type"],
                item["ref"],
                f"${item['amount']}"
            ])
            
        t = Table(table_data, colWidths=[1.2*inch, 1.2*inch, 2.8*inch, 1.3*inch])
        t.setStyle(pdf.get_table_style())
        elements.append(t)
        
        buffer = pdf.generate_streaming_response(elements)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={pdf.filename}"}
        )
        
    elif format == "excel":
        df = pd.DataFrame(data_list)
        if not df.empty:
            df['date'] = df['date'].dt.strftime('%Y-%m-%d %H:%M')
            
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Historial')
            
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=historial_cliente_{customer_id}.xlsx"}
        )
    
    raise HTTPException(status_code=400, detail="Formato no soportado")

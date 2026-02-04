from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.repair import Repair, RepairLog, RepairItem
from ...models.inventory import Product, Inventory
from ...models.finance import CashSession
from ...schemas.repair import RepairCreate, RepairRead, RepairUpdate, RepairItemCreate, RepairItemRead, RepairPaymentCreate
from ..deps import get_current_active_user
from ...utils.pdf_generator import PDFGenerator
from ...services.whatsapp_service import WhatsAppService
from reportlab.platypus import Paragraph, Spacer, Table, KeepTogether
from reportlab.lib.units import inch
from reportlab.lib import colors

router = APIRouter(tags=["repairs"])

@router.get("/export-csv")
def export_repairs_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "id", "date", "customer", "equipment", "brand", 
        "model", "status", "labor_cost", "parts_cost", 
        "total_cost", "paid_amount"
    ])
    
    repairs = db.query(Repair).order_by(Repair.created_at.desc()).all()
    
    for r in repairs:
        customer_name = r.customer.name if r.customer else "N/A"
        total_cost = (r.labor_cost_usd or 0) + (r.parts_cost_usd or 0)
        writer.writerow([
            r.id, r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            customer_name, r.device_model or "", "",
            "", r.status,
            float(r.labor_cost_usd or 0), float(r.parts_cost_usd or 0),
            float(total_cost), float(r.paid_amount_usd or 0)
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=repairs_history.csv"}
    )

@router.get("/export-pdf")
def export_repairs_pdf(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Export repair history as PDF."""
    repairs = db.query(Repair).order_by(Repair.created_at.desc()).all()
    
    pdf = PDFGenerator(filename_prefix="historial_reparaciones")
    elements = pdf.create_standard_header(db, "HISTORIAL DE REPARACIONES")
    
    data = [["ID", "Fecha", "Cliente", "Equipo", "Estado", "Total"]]
    for r in repairs:
        total = r.total_cost_usd or 0
        data.append([
            str(r.id),
            r.created_at.strftime("%d/%m/%Y"),
            (r.customer.name[:15] if r.customer else "N/A"),
            (r.device_model[:20] or "N/A"),
            r.status.upper(),
            f"${total}"
        ])
    
    t = Table(data, colWidths=[0.5*inch, 1*inch, 1.5*inch, 1.7*inch, 1*inch, 0.8*inch])
    t.setStyle(pdf.get_table_style())
    elements.append(t)
    
    buffer = pdf.generate_streaming_response(elements)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={pdf.filename}"}
    )

@router.post("/", response_model=RepairRead)
def create_repair(
    repair_in: RepairCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Extract items_to_consume before creating repair
    items_to_consume = repair_in.items_to_consume or []
    repair_data = repair_in.model_dump(exclude={"items_to_consume"})
    
    # Create repair record
    try:
        db_repair = Repair(**repair_data, status="received", created_by_id=current_user.id)
        db.add(db_repair)
        db.flush()  # Get repair ID without committing
        
        # Calculate parts cost from DB values
        total_parts_cost = Decimal(0)

        for item in items_to_consume:
            # Fetch product with lock for update if possible, or just strict check
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Producto con ID {item.product_id} no encontrado")
            
            # Check inventory
            inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
            if not inventory or inventory.quantity < item.quantity:
                available = inventory.quantity if inventory else 0
                raise HTTPException(
                    status_code=400, 
                    detail=f"No hay suficiente stock de '{product.name}' (disponible: {available}, solicitado: {item.quantity})"
                )
            
            # Deduct stock
            inventory.quantity -= item.quantity
            
            # Use database price for security (ignore frontend price)
            item_price = product.price_usd 
            total_parts_cost += item_price * item.quantity

            # Create RepairItem
            repair_item = RepairItem(
                repair_id=db_repair.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_cost_usd=item_price # Storing transaction price
            )
            db.add(repair_item)
        
        # Total parts cost is calculated dynamically by the Repair model property
        # db_repair.parts_cost_usd = total_parts_cost (Removed: property has no setter)
        
        # Log initial status
        log = RepairLog(repair_id=db_repair.id, user_id=current_user.id, status_to="received", notes="Reparación recibida")
        db.add(log)
        
        db.commit()
        db.refresh(db_repair)
        return db_repair

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear la orden: {str(e)}")


@router.put("/{repair_id}", response_model=RepairRead)
def update_repair(
    repair_id: int,
    repair_in: RepairUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    db_repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    
    old_status = db_repair.status
    update_data = repair_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_repair, field, value)
    
    if "status" in update_data and update_data["status"] != old_status:
        log = RepairLog(
            repair_id=db_repair.id, 
            user_id=current_user.id, 
            status_from=old_status, 
            status_to=update_data["status"],
            notes=repair_in.notes
        )
        db.add(log)
    
    db.commit()
    db.refresh(db_repair)
    return db_repair

@router.get("/", response_model=List[RepairRead])
def read_repairs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    status: str = None
):
    query = db.query(Repair)
    if status:
        query = query.filter(Repair.status == status)
    return query.all()

@router.get("/{repair_id}", response_model=RepairRead)
def read_repair(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    return repair

@router.patch("/{repair_id}/status", response_model=RepairRead)
def update_repair_status(
    repair_id: int,
    status_in: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    db_repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    
    old_status = db_repair.status
    new_status = status_in.get("status")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
        
    db_repair.status = new_status
    
    log = RepairLog(
        repair_id=db_repair.id, 
        user_id=current_user.id, 
        status_from=old_status, 
        status_to=new_status,
        notes="Estado actualizado desde el listado"
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_repair)
    return db_repair

# --- Repair Items (Parts) Endpoints ---

@router.post("/{repair_id}/items", response_model=RepairItemRead)
def add_repair_item(
    repair_id: int,
    item_in: RepairItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Add a part/product to a repair order and deduct from inventory"""
    # Verify repair exists
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Check inventory
    inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
    if not inventory or inventory.quantity < item_in.quantity:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
    
    # Deduct from inventory
    inventory.quantity -= item_in.quantity
    
    # Create repair item
    db_item = RepairItem(
        repair_id=repair_id,
        product_id=product.id,
        quantity=item_in.quantity,
        unit_cost_usd=product.price_usd
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Return with product name for frontend
    return RepairItemRead(
        id=db_item.id,
        product_id=db_item.product_id,
        product_name=product.name,
        quantity=db_item.quantity,
        unit_cost_usd=db_item.unit_cost_usd,
        subtotal_usd=db_item.unit_cost_usd * db_item.quantity if db_item.unit_cost_usd else None
    )

@router.delete("/{repair_id}/items/{item_id}")
def remove_repair_item(
    repair_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Remove a part from repair and return to inventory"""
    item = db.query(RepairItem).filter(
        RepairItem.id == item_id,
        RepairItem.repair_id == repair_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # Return to inventory
    inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
    if inventory:
        inventory.quantity += item.quantity
    
    db.delete(item)
    db.commit()
    
    return {"message": "Repuesto eliminado y devuelto al inventario"}

@router.get("/{repair_id}/items", response_model=List[RepairItemRead])
def get_repair_items(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all parts used in a repair"""
    items = db.query(RepairItem).filter(RepairItem.repair_id == repair_id).all()
    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        result.append(RepairItemRead(
            id=item.id,
            product_id=item.product_id,
            product_name=product.name if product else "Producto eliminado",
            quantity=item.quantity,
            unit_cost_usd=item.unit_cost_usd,
            subtotal_usd=item.unit_cost_usd * item.quantity if item.unit_cost_usd else None
        ))
    return result

# --- Repair Payments Endpoint ---

@router.post("/{repair_id}/payments", response_model=RepairRead)
def record_repair_payment(
    repair_id: int,
    payment_in: RepairPaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Record a payment for a repair (full or partial)"""
    # Verify repair exists
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    
    # Validate amount
    amount = Decimal(str(payment_in.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")
    
    # Update paid amount
    current_paid = Decimal(str(repair.paid_amount_usd or 0))
    repair.paid_amount_usd = current_paid + amount
    
    # Check if an open CashSession exists and record income
    open_session = db.query(CashSession).filter(
        CashSession.status == "open"
    ).first()
    
    if open_session:
        # Add to expected amount in USD
        open_session.expected_amount = Decimal(str(open_session.expected_amount or 0)) + amount
    
    # Log the payment
    log = RepairLog(
        repair_id=repair.id,
        user_id=current_user.id,
        status_from=repair.status,
        status_to=repair.status,
        notes=f"Pago registrado: ${amount} ({payment_in.payment_method}). {payment_in.notes or ''}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(repair)
    
    return repair


@router.get("/{repair_id}/receipt")
def get_repair_receipt(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Generate a technical service receipt in PDF format."""
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    
    pdf = PDFGenerator(filename_prefix=f"recibo_rep_{repair_id}")
    elements = pdf.create_standard_header(db, f"RECIBO DE SERVICIO TÉCNICO #{repair_id}")
    
    # Customer and Device Info
    data = [
        ["CLIENTE:", repair.customer.name if repair.customer else "N/A", "TLF:", repair.customer.phone if repair.customer else "N/A"],
        ["EQUIPO:", repair.device_model, "SERIAL/IMEI:", repair.device_imei or "N/A"],
        ["SÍNTOMA:", Paragraph(repair.problem_description, pdf.styles['Normal']), "", ""],
        ["ESTADO:", repair.status.upper(), "TIPO:", (repair.service_type or "SERVICIO").upper()]
    ]
    
    t = Table(data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 1.3*inch])
    t.setStyle(pdf.get_table_style())
    elements.append(t)
    elements.append(Spacer(1, 0.4 * inch))
    
    # Parts Used
    if repair.items:
        elements.append(Paragraph("REPUESTOS UTILIZADOS", pdf.styles['Heading3']))
        parts_data = [["Descripción", "Cant.", "Precio Unit.", "Subtotal"]]
        for item in repair.items:
            parts_data.append([
                item.product.name if item.product else "N/A",
                str(item.quantity),
                f"${item.unit_cost_usd}",
                f"${item.unit_cost_usd * item.quantity}"
            ])
        
        pt = Table(parts_data, colWidths=[3*inch, 0.7*inch, 1.25*inch, 1.25*inch])
        pt.setStyle(pdf.get_table_style())
        elements.append(pt)
        elements.append(Spacer(1, 0.2 * inch))

    # Costs
    elements.append(Paragraph("RESUMEN DE COSTOS", pdf.styles['Heading3']))
    total = repair.total_cost_usd or 0
    costs_data = [
        ["Mano de Obra:", f"${repair.labor_cost_usd or 0}"],
        ["Repuestos:", f"${repair.parts_cost_usd or 0}"],
        ["TOTAL:", f"${total}"],
        ["PAGADO:", f"${repair.paid_amount_usd or 0}"],
        ["BALANCE:", f"${total - (repair.paid_amount_usd or 0)}"]
    ]
    ct = Table(costs_data, colWidths=[4.7*inch, 1.5*inch])
    ct.setStyle(pdf.get_table_style())
    elements.append(KeepTogether(ct))
    
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph("Condiciones: Garantía válida por 30 días solo en el servicio realizado. No incluye daños por humedad o golpes.", pdf.styles['Normal']))

    buffer = pdf.generate_streaming_response(elements)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={pdf.filename}"}
    )

@router.post("/{repair_id}/send-whatsapp")
def send_repair_whatsapp(
    repair_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Sends a repair status update via WhatsApp."""
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Reparación no encontrada")
    
    customer = repair.customer
    if not customer or not customer.phone:
        raise HTTPException(status_code=400, detail="El cliente no tiene un número de teléfono registrado.")
    
    success = WhatsAppService.send_repair_status_notification(
        db,
        customer.phone,
        customer.name,
        repair.device_model,
        repair.status,
        repair.id
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Error al enviar mensaje de WhatsApp. Verifique la configuración en Ajustes.")
    
    return {"message": "WhatsApp enviado correctamente"}




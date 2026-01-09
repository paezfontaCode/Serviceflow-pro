from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy.orm import Session
from decimal import Decimal
from ...core.database import get_db
from ...models.sale import Sale, SaleItem
from ...models.inventory import Product, Inventory
from ...models.finance import ExchangeRate, CashSession, Payment, CashTransaction
from ...schemas.sale import SaleCreate, SaleRead, SaleReturnCreate, SaleReturnRead
from ..deps import get_current_active_user
from datetime import date, timedelta
from ...models.finance import AccountReceivable
from ...models.customer import Customer

router = APIRouter(tags=["sales"])

@router.post("/", response_model=SaleRead)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # 1. Verificar sesión de caja abierta
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Debes abrir una sesión de caja antes de realizar ventas.")

    # 2. Obtener tasa de cambio activa
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).order_by(ExchangeRate.effective_date.desc()).first()
    if not rate:
        raise HTTPException(status_code=400, detail="No hay una tasa de cambio activa. Por favor, configúrela primero.")
    
    total_usd = Decimal(0)
    db_items = []
    
    # 3. Procesar items con bloqueo de stock (SELECT FOR UPDATE)
    try:
        with db.begin_nested(): # Inicia una sub-transacción para el control de stock
            for item_in in sale_in.items:
                # CORRECCIÓN CRÍTICA 1: .with_for_update() bloquea la fila del producto en BD
                product = db.query(Product).filter(Product.id == item_in.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Producto {item_in.product_id} no encontrado")
                
                # Check stock
                inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
                if not inventory or inventory.quantity < item_in.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
                
                item_total_usd = product.price_usd * item_in.quantity
                total_usd += item_total_usd
                
                db_items.append(SaleItem(
                    product_id=product.id,
                    quantity=item_in.quantity,
                    unit_price_usd=product.price_usd,
                    unit_cost_usd=product.cost_usd,
                    subtotal_usd=item_total_usd
                ))
                
                # Deduct stock
                inventory.quantity -= item_in.quantity

        total_ves = total_usd * rate.rate

        # 4. Crear venta
        db_sale = Sale(
            customer_id=sale_in.customer_id,
            user_id=current_user.id,
            total_usd=total_usd,
            total_ves=total_ves,
            exchange_rate=rate.rate, # Tasa de referencia
            exchange_rate_at_time=rate.rate,
            payment_method=sale_in.payment_method,
            payment_status="paid" if sale_in.payment_method != "credit" else "pending",
            notes=sale_in.notes,
            items=db_items
        )
        
        db.add(db_sale)
        db.flush() # Get ID

        # 5. Lógica de Pagos y Finanzas
        if sale_in.payment_method != "credit":
            # Crear Payment
            db_payment = Payment(
                sale_id=db_sale.id,
                session_id=session.id,
                amount_usd=total_usd,
                amount_ves=total_ves,
                exchange_rate=rate.rate, # Tasa del momento
                payment_method=sale_in.payment_method,
                currency=sale_in.payment_currency
            )
            db.add(db_payment)

            # Crear Cash Transaction
            db_transaction = CashTransaction(
                session_id=session.id,
                transaction_type="sale",
                amount_usd=total_usd,
                amount_ves=total_ves,
                exchange_rate=rate.rate,
                currency=sale_in.payment_currency,
                description=f"Venta #{db_sale.id} ({sale_in.payment_currency})",
                reference_id=db_sale.id
            )
            db.add(db_transaction)

            # Update Session Balance
            if sale_in.payment_currency == "VES":
                session.expected_amount_ves += total_ves
            else:
                session.expected_amount += total_usd
        
        else:
            # --- Handle Credit Sale (Account Receivable) ---
            customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
            if not customer:
                 raise HTTPException(status_code=400, detail="Venta a crédito requiere un cliente registrado.")

            # Update Customer Debt
            customer.current_debt = (customer.current_debt or 0) + total_usd
            
            # Create Account Receivable
            db_ar = AccountReceivable(
                customer_id=customer.id,
                sale_id=db_sale.id,
                total_amount=total_usd,
                paid_amount=0,
                due_date=date.today() + timedelta(days=customer.payment_terms or 30),
                status="pending",
                notes=f"Venta a Crédito #{db_sale.id}",
                created_by=current_user.id
            )
            db.add(db_ar)

        db.commit()
        db.refresh(db_sale)
        return db_sale

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la venta: {str(e)}")


@router.get("/", response_model=List[SaleRead])
def read_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    from sqlalchemy.orm import joinedload
    return db.query(Sale).options(
        joinedload(Sale.items).joinedload(SaleItem.product)
    ).offset(skip).limit(limit).all()

@router.get("/{sale_id}", response_model=SaleRead)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from sqlalchemy.orm import joinedload
    sale = db.query(Sale).options(
        joinedload(Sale.items).joinedload(SaleItem.product)
    ).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.get("/export-csv")
def export_sales_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "sale_id", "date", "customer", "payment_method", 
        "total_usd", "total_ves", "exchange_rate", "notes"
    ])
    
    sales = db.query(Sale).order_by(Sale.created_at.desc()).all()
    
    for s in sales:
        customer_name = s.customer.name if s.customer else "Cliente Ocasional"
        writer.writerow([
            s.id, s.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            customer_name, s.payment_method,
            float(s.total_usd), float(s.total_ves),
            float(s.exchange_rate), s.notes or ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_history.csv"}
    )

@router.post("/{sale_id}/return", response_model=SaleReturnRead)
def return_sale(
    sale_id: int,
    return_in: SaleReturnCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...models.sale import SaleReturn, SaleReturnItem
    
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    total_return_usd = Decimal(0)
    return_items = []
    
    for item_in in return_in.items:
        # Check if item exists in sale
        sale_item = db.query(SaleItem).filter(
            SaleItem.sale_id == sale_id,
            SaleItem.product_id == item_in.product_id
        ).first()
        
        if not sale_item:
            raise HTTPException(status_code=400, detail=f"El producto {item_in.product_id} no pertenece a esta venta")
        
        if item_in.quantity > sale_item.quantity:
            raise HTTPException(status_code=400, detail=f"La cantidad a devolver de {item_in.product_id} excede lo vendido")
        
        item_total_usd = sale_item.unit_price_usd * item_in.quantity
        total_return_usd += item_total_usd
        
        return_items.append(SaleReturnItem(
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            unit_price_usd=sale_item.unit_price_usd
        ))
        
        # Increase stock
        inventory = db.query(Inventory).filter(Inventory.product_id == item_in.product_id).first()
        if inventory:
            inventory.quantity += item_in.quantity
            
    db_return = SaleReturn(
        sale_id=sale_id,
        user_id=current_user.id,
        total_amount_usd=total_return_usd,
        reason=return_in.reason,
        items=return_items
    )
    db.add(db_return)
    
    # Handle financial reversal
    if sale.payment_method == "credit":
        # Decrease AR
        ar = db.query(AccountReceivable).filter(AccountReceivable.sale_id == sale_id).first()
        if ar:
            ar.total_amount -= total_return_usd
            if ar.total_amount <= ar.paid_amount:
                ar.status = "paid"
            # Update customer debt
            if sale.customer_id:
                customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
                if customer:
                    customer.current_debt = max(0, (customer.current_debt or 0) - total_return_usd)
    else:
        # If paid, record a refund transaction in cash session if open
        session = db.query(CashSession).filter(
            CashSession.user_id == current_user.id,
            CashSession.status == "open"
        ).first()
        if session:
            rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).order_by(ExchangeRate.effective_date.desc()).first()
            current_rate = rate.rate if rate else sale.exchange_rate
            
            transaction = CashTransaction(
                session_id=session.id,
                transaction_type="refund",
                amount_usd=total_return_usd,
                amount_ves=total_return_usd * current_rate,
                exchange_rate=current_rate,
                description=f"Devolución Venta #{sale_id}",
                reference_id=db_return.id
            )
            db.add(transaction)
            session.expected_amount -= total_return_usd

    db.commit()
    db.refresh(db_return)
    return db_return

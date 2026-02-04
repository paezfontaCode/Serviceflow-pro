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
from ...models.repair import Repair, RepairLog
from ...schemas.sale import SaleCreate, SaleRead, SaleReturnCreate, SaleReturnRead
from ..deps import get_current_active_user
from datetime import date, timedelta, datetime, timezone
from ...models.finance import AccountReceivable
from ...models.customer import Customer
from ...models.sale_repair import SaleRepair
from ...core.utils import calculate_warranty_expiration
from ...services.whatsapp_service import WhatsAppService

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
    repair_total_usd = Decimal(0)
    db_items = []
    processed_repairs = []
    
    # 3. Procesar items de productos con bloqueo de stock
    try:
        with db.begin_nested():
            for item_in in sale_in.items:
                product = db.query(Product).filter(Product.id == item_in.product_id).with_for_update().first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Producto {item_in.product_id} no encontrado")
                
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
                
                inventory.quantity -= item_in.quantity

            # 4. Procesar órdenes de reparación (servicios)
            if sale_in.repair_ids:
                for repair_id in sale_in.repair_ids:
                    repair = db.query(Repair).filter(Repair.id == repair_id).with_for_update().first()
                    if not repair:
                        raise HTTPException(status_code=404, detail=f"Reparación #{repair_id} no encontrada")
                    
                    # Calcular saldo pendiente usando la propiedad unificada
                    total_cost = Decimal(str(repair.total_cost_usd or 0))
                    paid_amount = Decimal(str(repair.paid_amount_usd or 0))
                    remaining = total_cost - paid_amount
                    
                    if remaining > 0:
                        repair_total_usd += remaining
                        processed_repairs.append(repair)

            # Add repair totals to grand total
            total_usd += repair_total_usd

        total_ves = total_usd * rate.rate

        # 5. Calcular monto pagado y deuda
        amount_paid_usd = Decimal(str(sale_in.amount_paid)) if sale_in.amount_paid is not None else total_usd
        pending_debt_usd = max(Decimal(0), total_usd - amount_paid_usd)
        
        # Determinar estado de pago
        if pending_debt_usd > Decimal('0.01'):
            payment_status = "partial"
        else:
            payment_status = "paid"
            pending_debt_usd = Decimal(0)

        # 6. Validar cliente para pagos parciales
        if pending_debt_usd > 0 and not sale_in.customer_id:
            raise HTTPException(status_code=400, detail="Pagos parciales requieren un cliente registrado.")

        # 7. Crear venta
        db_sale = Sale(
            customer_id=sale_in.customer_id,
            user_id=current_user.id,
            total_usd=total_usd,
            total_ves=total_ves,
            exchange_rate=rate.rate,
            exchange_rate_at_time=rate.rate,
            payment_method=sale_in.payment_method,
            payment_status=payment_status,
            notes=sale_in.notes,
            items=db_items
        )
        
        db.add(db_sale)
        db.flush()

        # 8. Crear Payment y Cash Transaction para el monto pagado
        if amount_paid_usd > 0:
            amount_paid_ves = amount_paid_usd * rate.rate
            
            db_payment = Payment(
                sale_id=db_sale.id,
                session_id=session.id,
                amount_usd=amount_paid_usd,
                amount_ves=amount_paid_ves,
                exchange_rate=rate.rate,
                payment_method=sale_in.payment_method,
                currency=sale_in.payment_currency
            )
            db.add(db_payment)

            db_transaction = CashTransaction(
                session_id=session.id,
                transaction_type="sale",
                amount_usd=amount_paid_usd,
                amount_ves=amount_paid_ves,
                exchange_rate=rate.rate,
                currency=sale_in.payment_currency,
                description=f"Venta #{db_sale.id} ({sale_in.payment_currency})" + (f" - Abono" if pending_debt_usd > 0 else ""),
                reference_id=db_sale.id
            )
            db.add(db_transaction)

            if sale_in.payment_currency == "VES":
                session.expected_amount_ves += amount_paid_ves
            else:
                session.expected_amount += amount_paid_usd

        # 9. Crear Account Receivable para deuda pendiente
        if pending_debt_usd > Decimal('0.01'):
            customer = db.query(Customer).filter(Customer.id == sale_in.customer_id).first()
            if customer:
                customer.current_debt = (customer.current_debt or 0) + pending_debt_usd
                
                db_ar = AccountReceivable(
                    customer_id=customer.id,
                    sale_id=db_sale.id,
                    total_amount=total_usd,
                    paid_amount=amount_paid_usd,
                    due_date=date.today() + timedelta(days=customer.payment_terms or 30),
                    status="partial" if amount_paid_usd > 0 else "pending",
                    notes=f"Venta #{db_sale.id} - Abono: ${amount_paid_usd:.2f}",
                    created_by=current_user.id
                )
                db.add(db_ar)

        # 10. Actualizar reparaciones: marcar como entregadas y registrar pago
        for repair in processed_repairs:
            total_cost = Decimal(str(repair.total_cost_usd or 0))
            paid_before = Decimal(str(repair.paid_amount_usd or 0))
            remaining = total_cost - paid_before
            
            old_status = repair.status
            
            # Determine how much is paid FOR THIS REPAIR
            if pending_debt_usd == 0:
                # Full payment for the entire sale: fully pay this repair
                # (Assuming sale covers full repair cost if included in total logic above)
                paid_now = remaining
            else:
                # Partial payment: Distribute amount_paid_usd to this repair
                paid_now = min(remaining, amount_paid_usd)
                amount_paid_usd -= paid_now # Decrease available cash for next repair
            
            # Apply payment
            repair.paid_amount_usd = paid_before + paid_now
            
            # Create Link in Pivot Table
            if paid_now > 0:
                sale_repair_link = SaleRepair(
                    sale_id=db_sale.id,
                    repair_id=repair.id,
                    amount_allocated_usd=paid_now
                )
                db.add(sale_repair_link)

            # Trigger Delivery and Warranty IF Fully Paid via this transaction
            if repair.paid_amount_usd >= total_cost and total_cost > 0:
                repair.status = "delivered"
                repair.delivered_at = datetime.now(timezone.utc)
                repair.warranty_expiration = calculate_warranty_expiration(datetime.now(timezone.utc), 7)
                
                log = RepairLog(
                    repair_id=repair.id,
                    user_id=current_user.id,
                    status_from=old_status,
                    status_to="delivered",
                    notes=f"Entregado via Venta POS #{db_sale.id} (Garantía hasta {repair.warranty_expiration.strftime('%Y-%m-%d')})"
                )
                db.add(log)

        db.commit()
        db.refresh(db_sale)
        return db_sale

    except HTTPException:
        db.rollback()
        raise
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
    sales = db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleRead)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale

@router.get("/export/csv")
def export_sales_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    sales = db.query(Sale).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "ID", "Fecha", "Cliente ID", "Total USD", "Total VES", 
        "Tasa", "Método Pago", "Estado", "Notas"
    ])
    
    for sale in sales:
        writer.writerow([
            sale.id,
            sale.created_at.isoformat(),
            sale.customer_id or "General",
            float(sale.total_usd),
            float(sale.total_ves),
            float(sale.exchange_rate),
            sale.payment_method,
            sale.payment_status,
            sale.notes or ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ventas.csv"}
    )


# --- Sale Returns ---
from ...models.sale import SaleReturn, SaleReturnItem

@router.post("/{sale_id}/returns", response_model=SaleReturnRead)
def return_sale(
    sale_id: int,
    return_in: SaleReturnCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify sale exists
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Verify open cash session
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Debes abrir una sesión de caja para procesar devoluciones.")
    
    # Get exchange rate
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    if not rate:
        raise HTTPException(status_code=400, detail="No hay tasa de cambio activa.")
    
    total_return_usd = Decimal(0)
    return_items = []
    
    try:
        with db.begin_nested():
            for item_in in return_in.items:
                # Find original sale item
                sale_item = db.query(SaleItem).filter(
                    SaleItem.sale_id == sale_id,
                    SaleItem.product_id == item_in.product_id
                ).first()
                
                if not sale_item:
                    raise HTTPException(status_code=404, detail=f"Producto {item_in.product_id} no está en esta venta")
                
                if item_in.quantity > sale_item.quantity:
                    raise HTTPException(status_code=400, detail=f"No puedes devolver más de {sale_item.quantity} unidades")
                
                item_return_usd = sale_item.unit_price_usd * item_in.quantity
                total_return_usd += item_return_usd
                
                return_items.append(SaleReturnItem(
                    product_id=item_in.product_id,
                    quantity=item_in.quantity,
                    unit_price_usd=sale_item.unit_price_usd
                ))
                
                # Restore inventory
                inventory = db.query(Inventory).filter(Inventory.product_id == item_in.product_id).first()
                if inventory:
                    inventory.quantity += item_in.quantity
        
        total_return_ves = total_return_usd * rate.rate
        
        # Create return record
        db_return = SaleReturn(
            sale_id=sale_id,
            user_id=current_user.id,
            total_amount_usd=total_return_usd,
            total_amount_ves=total_return_ves,
            exchange_rate=rate.rate,
            reason=return_in.reason,
            items=return_items
        )
        db.add(db_return)
        db.flush()
        
        # Create negative cash transaction
        db_transaction = CashTransaction(
            session_id=session.id,
            transaction_type="refund",
            amount_usd=-total_return_usd,
            amount_ves=-total_return_ves,
            exchange_rate=rate.rate,
            currency="USD",
            description=f"Devolución Venta #{sale_id}",
            reference_id=db_return.id
        )
        db.add(db_transaction)
        
        # Update session balance
        session.expected_amount -= total_return_usd
        
        db.commit()
        db.refresh(db_return)
        return db_return
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la devolución: {str(e)}")

@router.post("/{sale_id}/send-whatsapp")
def send_sale_whatsapp(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Sends a sale ticket via WhatsApp to the customer."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    if not sale.customer_id:
         raise HTTPException(status_code=400, detail="Esta venta no tiene un cliente asociado.")
    
    customer = sale.customer
    if not customer or not customer.phone:
        raise HTTPException(status_code=400, detail="El cliente no tiene un número de teléfono registrado.")
    
    success = WhatsAppService.send_ticket_notification(
        db, 
        customer.phone, 
        customer.name, 
        float(sale.total_usd), 
        f"V-{sale.id}"
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Error al enviar mensaje de WhatsApp. Verifique la configuración en Ajustes.")
    
    return {"message": "WhatsApp enviado correctamente"}

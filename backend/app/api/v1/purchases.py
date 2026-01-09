from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from ...core.database import get_db
from ...models.purchase import Supplier, PurchaseOrder, PurchaseItem
from ...models.inventory import Product, Inventory
from ...models.user import User
from ...schemas.purchase import (
    SupplierCreate, SupplierRead, SupplierUpdate,
    PurchaseOrderCreate, PurchaseOrderRead, PurchaseItemRead
)
from ..deps import get_current_active_user

router = APIRouter()

# --- Suppliers Endpoints ---

@router.post("/suppliers", response_model=SupplierRead, tags=["suppliers"])
def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    supplier = Supplier(**supplier_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/suppliers", response_model=List[SupplierRead], tags=["suppliers"])
def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Supplier)
    if active_only:
        query = query.filter(Supplier.is_active == True)
    return query.offset(skip).limit(limit).all()

@router.put("/suppliers/{supplier_id}", response_model=SupplierRead, tags=["suppliers"])
def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    update_data = supplier_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
        
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["suppliers"])
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    # Check if supplier has purchases
    if db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).first():
        # Soft delete or deactivate instead of hard delete if there are records
        supplier.is_active = False
        db.commit()
        return
        
    db.delete(supplier)
    db.commit()
    return

# --- Purchases Endpoints ---

@router.post("/purchases", response_model=PurchaseOrderRead, tags=["purchases"])
def create_purchase_order(
    purchase_in: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify supplier
    supplier = db.query(Supplier).filter(Supplier.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    total_amount = Decimal(0)
    db_items = []
    
    for item_in in purchase_in.items:
        # Verify product
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item_in.product_id} no encontrado")
            
        subtotal = item_in.unit_cost_usd * item_in.quantity
        total_amount += subtotal
        
        db_items.append(PurchaseItem(
            product_id=product.id,
            quantity=item_in.quantity,
            unit_cost_usd=item_in.unit_cost_usd,
            subtotal_usd=subtotal
        ))
    
    purchase = PurchaseOrder(
        supplier_id=purchase_in.supplier_id,
        user_id=current_user.id,
        expected_date=purchase_in.expected_date,
        notes=purchase_in.notes,
        status="draft", # Starts as draft/ordered
        total_amount_usd=total_amount,
        items=db_items
    )
    
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    
    # Construct response manually to include names
    return PurchaseOrderRead(
        id=purchase.id,
        supplier_id=purchase.supplier_id,
        supplier_name=supplier.name,
        user_id=purchase.user_id,
        username=current_user.username,
        status=purchase.status,
        total_amount_usd=purchase.total_amount_usd,
        expected_date=purchase.expected_date,
        received_date=purchase.received_date,
        notes=purchase.notes,
        created_at=purchase.created_at,
        items=[
            PurchaseItemRead(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_cost_usd=item.unit_cost_usd,
                subtotal_usd=item.subtotal_usd
            ) for item in purchase.items
        ]
    )

@router.get("/purchases", response_model=List[PurchaseOrderRead], tags=["purchases"])
def read_purchases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    purchases = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()
    # Pydantic via from_attributes often fails on nested relationships if not loaded or if structure differs slightly
    # But let's try direct return relying on lazy loading, or we might need explicit join/construction
    # For safety, let's construct list
    result = []
    for p in purchases:
        result.append(PurchaseOrderRead(
            id=p.id,
            supplier_id=p.supplier_id,
            supplier_name=p.supplier.name,
            user_id=p.user_id,
            username=p.user.username,
            status=p.status,
            total_amount_usd=p.total_amount_usd,
            expected_date=p.expected_date,
            received_date=p.received_date,
            notes=p.notes,
            created_at=p.created_at,
            items=[] # List items not needed for summary list usually, but schema has it. 
                     # Using empty list for list view efficiency unless crucial
        ))
    return result

@router.get("/purchases/{purchase_id}", response_model=PurchaseOrderRead, tags=["purchases"])
def read_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    p = db.query(PurchaseOrder).filter(PurchaseOrder.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
        
    return PurchaseOrderRead(
        id=p.id,
        supplier_id=p.supplier_id,
        supplier_name=p.supplier.name,
        user_id=p.user_id,
        username=p.user.username,
        status=p.status,
        total_amount_usd=p.total_amount_usd,
        expected_date=p.expected_date,
        received_date=p.received_date,
        notes=p.notes,
        created_at=p.created_at,
        items=[
            PurchaseItemRead(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_cost_usd=item.unit_cost_usd,
                subtotal_usd=item.subtotal_usd
            ) for item in p.items
        ]
    )

@router.post("/purchases/{purchase_id}/receive", response_model=PurchaseOrderRead, tags=["purchases"])
def receive_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Mark order as received and update inventory"""
    purchase = db.query(PurchaseOrder).filter(PurchaseOrder.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    
    if purchase.status == "received":
        raise HTTPException(status_code=400, detail="Esta orden ya fue recibida")
        
    # Update inventory for each item
    for item in purchase.items:
        inventory = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
        if inventory:
            inventory.quantity += item.quantity
        else:
            # Should exist if product exists, but safety check
             pass
             
        # Optional: Update product cost price with new cost? 
        # For now let's keep it simple or maybe update if it's different?
        # Let's LEAVE product price alone for now to avoid accidental price changes without user approval
        
    purchase.status = "received"
    purchase.received_date = datetime.now()
    
    # Create Accounts Payable (AP)
    from ...models.finance import AccountsPayable
    from datetime import date, timedelta
    
    due_date = date.today() + timedelta(days=purchase.supplier.payment_terms or 0)
    
    db_ap = AccountsPayable(
        supplier_id=purchase.supplier_id,
        purchase_order_id=purchase.id,
        total_amount=purchase.total_amount_usd,
        due_date=due_date,
        status="pending"
    )
    db.add(db_ap)

    db.commit()
    db.refresh(purchase)
    
    return read_purchase(purchase_id, db, current_user)
    
@router.post("/purchases/{purchase_id}/cancel", response_model=PurchaseOrderRead, tags=["purchases"])
def cancel_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Cancel a purchase order if not already received"""
    purchase = db.query(PurchaseOrder).filter(PurchaseOrder.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    
    if purchase.status == "received":
        raise HTTPException(status_code=400, detail="No se puede cancelar una orden que ya ha sido recibida")
        
    if purchase.status == "cancelled":
        raise HTTPException(status_code=400, detail="Esta orden ya está cancelada")
        
    purchase.status = "cancelled"
    db.commit()
    db.refresh(purchase)
    
    return read_purchase(purchase_id, db, current_user)

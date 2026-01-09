from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.repair import Repair, RepairLog, RepairItem
from ...models.inventory import Product, Inventory
from ...schemas.repair import RepairCreate, RepairRead, RepairUpdate, RepairItemCreate, RepairItemRead
from ..deps import get_current_active_user

router = APIRouter(tags=["repairs"])

@router.post("/", response_model=RepairRead)
def create_repair(
    repair_in: RepairCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    db_repair = Repair(**repair_in.model_dump(), status="received")
    db.add(db_repair)
    db.commit()
    db.refresh(db_repair)
    
    # Log initial status
    log = RepairLog(repair_id=db_repair.id, user_id=current_user.id, status_to="received", notes="Reparación recibida")
    db.add(log)
    db.commit()
    
    return db_repair

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


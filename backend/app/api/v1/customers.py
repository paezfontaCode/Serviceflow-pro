from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.customer import Customer
from ...schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from ..deps import get_current_active_user

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

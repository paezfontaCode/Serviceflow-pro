from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List

# --- Supplier Schemas ---

class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class SupplierRead(SupplierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# --- Purchase Schemas ---

class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost_usd: Decimal

class PurchaseItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str # Added for frontend convenience
    quantity: int
    unit_cost_usd: Decimal
    subtotal_usd: Decimal
    
    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseItemCreate]

class PurchaseOrderRead(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str # Added for frontend convenience
    user_id: int
    username: str # Added
    status: str
    total_amount_usd: Decimal
    expected_date: Optional[date]
    received_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    items: List[PurchaseItemRead] = []
    
    class Config:
        from_attributes = True

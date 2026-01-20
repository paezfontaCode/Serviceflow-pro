from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from .repair import RepairRead
from .sale import SaleRead

class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = ""
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Venezuela"
    dni: Optional[str] = None
    dni_type: Optional[str] = "V"  # V, J, E, P
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    dni: Optional[str] = None
    dni_type: Optional[str] = None
    notes: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    credit_status: Optional[str] = None

class CustomerRead(CustomerBase):
    id: int
    loyalty_points: Optional[int] = 0
    credit_limit: Optional[Decimal] = 0
    current_debt: Optional[Decimal] = 0
    payment_terms: Optional[int] = 30
    credit_status: Optional[str] = "active"
    credit_score: Optional[int] = 100
    last_payment_date: Optional[date] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountTransaction(BaseModel):
    id: int
    date: datetime
    type: str # 'CHARGE' or 'PAYMENT'
    amount: Decimal
    reference: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class CustomerProfile(CustomerRead):
    total_spent: Decimal = 0
    last_purchase_date: Optional[date] = None
    
    recent_sales: List["SaleRead"] = []
    active_repairs: List["RepairRead"] = []
    repair_history: List["RepairRead"] = []
    transactions: List[AccountTransaction] = []
    
    class Config:
        from_attributes = True

CustomerProfile.model_rebuild()

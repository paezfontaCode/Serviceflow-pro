from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class SaleItemBase(BaseModel):
    product_id: int
    quantity: int

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemRead(SaleItemBase):
    id: int
    unit_price_usd: Decimal
    subtotal_usd: Decimal
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    customer_id: Optional[int] = None
    payment_method: str
    payment_currency: str = "USD" # 'USD' or 'VES'
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    repair_ids: Optional[List[int]] = []
    amount_paid: Optional[Decimal] = None  # Para pagos parciales

class SaleRead(SaleBase):
    id: int
    user_id: int
    total_usd: Decimal
    total_ves: Decimal
    exchange_rate: Decimal
    exchange_rate_at_time: Optional[Decimal]
    payment_status: str
    created_at: datetime
    items: List[SaleItemRead]
    
    # Derived fields
    paid_amount: Optional[Decimal] = None
    pending_amount: Optional[Decimal] = None
    customer_name: Optional[str] = None
    
    class Config:
        from_attributes = True
class SaleReturnItemRead(BaseModel):
    product_id: int
    quantity: int
    unit_price_usd: Decimal
    class Config:
        from_attributes = True

class SaleReturnRead(BaseModel):
    id: int
    sale_id: int
    total_amount_usd: Decimal
    reason: Optional[str]
    created_at: datetime
    items: List[SaleReturnItemRead]
    class Config:
        from_attributes = True

class SaleReturnCreate(BaseModel):
    reason: str
    items: List[SaleItemCreate] # Reusing SaleItemCreate for simple product_id/quantity

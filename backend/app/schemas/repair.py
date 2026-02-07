from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class RepairLogRead(BaseModel):
    id: int
    status_from: Optional[str] = None
    status_to: str
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Repair Item Schemas
class RepairItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class RepairItemRead(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_cost_usd: Optional[Decimal] = None
    subtotal_usd: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class RepairBase(BaseModel):
    customer_id: int
    device_model: str
    device_imei: Optional[str] = None
    problem_description: str
    service_type: str = "SERVICE"
    quick_service_tag: Optional[str] = None
    repair_type: str = "service"
    estimated_cost_usd: Optional[Decimal] = None
    labor_cost_usd: Optional[Decimal] = 0
    missing_part_note: Optional[str] = None

# Schema for parts to consume during creation
class ItemToConsume(BaseModel):
    product_id: int
    quantity: int = 1

class RepairCreate(RepairBase):
    items_to_consume: Optional[List["ItemToConsume"]] = []


class RepairUpdate(BaseModel):
    status: Optional[str] = None
    repair_type: Optional[str] = None
    technical_report: Optional[str] = None
    estimated_cost_usd: Optional[Decimal] = None
    labor_cost_usd: Optional[Decimal] = None
    final_cost_usd: Optional[Decimal] = None
    notes: Optional[str] = None
    missing_part_note: Optional[str] = None

# Repair Payment Schema
class RepairPaymentCreate(BaseModel):
    amount: Decimal
    payment_method: str
    notes: Optional[str] = None

class RepairRead(RepairBase):
    id: int
    user_id: Optional[int] = None
    created_by_id: Optional[int] = None
    status: str
    technical_report: Optional[str] = None
    final_cost_usd: Optional[Decimal] = None
    paid_amount_usd: Decimal
    parts_cost_usd: Optional[Decimal] = None
    total_cost_usd: Optional[Decimal] = None
    customer_name: Optional[str] = None
    customer_dni: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    warranty_expiration: Optional[datetime] = None
    is_warranty_active: bool = False
    is_recurring: bool = False
    previous_repair_id: Optional[int] = None
    logs: List[RepairLogRead] = []
    items: List[RepairItemRead] = []
    
    class Config:
        from_attributes = True



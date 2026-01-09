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
    repair_type: str = "service"
    estimated_cost_usd: Optional[Decimal] = None
    labor_cost_usd: Optional[Decimal] = 0

class RepairCreate(RepairBase):
    pass

class RepairUpdate(BaseModel):
    status: Optional[str] = None
    repair_type: Optional[str] = None
    technical_report: Optional[str] = None
    estimated_cost_usd: Optional[Decimal] = None
    labor_cost_usd: Optional[Decimal] = None
    final_cost_usd: Optional[Decimal] = None
    notes: Optional[str] = None

class RepairRead(RepairBase):
    id: int
    user_id: Optional[int] = None
    status: str
    technical_report: Optional[str] = None
    final_cost_usd: Optional[Decimal] = None
    paid_amount_usd: Decimal
    parts_cost_usd: Optional[Decimal] = None
    customer_name: Optional[str] = None
    customer_dni: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    logs: List[RepairLogRead] = []
    items: List[RepairItemRead] = []
    
    class Config:
        from_attributes = True


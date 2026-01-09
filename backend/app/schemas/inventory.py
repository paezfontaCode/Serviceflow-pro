from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryRead(CategoryBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    price_usd: Decimal
    cost_usd: Decimal
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None

class ProductCreate(ProductBase):
    initial_stock: int = 0

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price_usd: Optional[Decimal] = None
    cost_usd: Optional[Decimal] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    is_active: Optional[bool] = None

class ProductRead(ProductBase):
    id: int
    is_active: bool
    category: Optional[CategoryRead] = None
    inventory_quantity: Optional[int] = None
    in_stock: Optional[bool] = None
    
    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    quantity: int
    reason: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    min_stock: int
    max_stock: Optional[int] = None
    location: Optional[str] = None
    last_updated: Optional[datetime] = None
    
    class Config:
        from_attributes = True

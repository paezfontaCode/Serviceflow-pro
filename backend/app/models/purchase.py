from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_name = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    tax_id = Column(String(50)) # RIF/NIT/VAT ID
    payment_terms = Column(Integer, default=0) # Days to pay
    
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    purchases = relationship("PurchaseOrder", back_populates="supplier")



class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status: 'draft', 'ordered', 'received', 'cancelled'
    status = Column(String(20), default="draft", index=True)
    
    total_amount_usd = Column(DECIMAL(10, 2), default=0)
    
    expected_date = Column(Date)
    received_date = Column(DateTime(timezone=True))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="purchases")
    user = relationship("User") # Created by
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    unit_cost_usd = Column(DECIMAL(10, 2), nullable=False)
    subtotal_usd = Column(DECIMAL(10, 2), nullable=False)
    
    received_quantity = Column(Integer, default=0) # For partial receiving logic if needed later
    
    purchase = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

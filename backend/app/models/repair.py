from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Repair(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))  # Técnico asignado
    created_by_id = Column(Integer, ForeignKey("users.id")) # Cajero/Usuario que registró
    
    device_model = Column(String(100), nullable=False)
    device_imei = Column(String(50))
    problem_description = Column(Text, nullable=False)
    technical_report = Column(Text)
    
    status = Column(String(20), default="RECEIVED")  # 'RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'
    
    # Enhanced Service Info
    service_type = Column(String(20), default="SERVICE") # 'SOFTWARE', 'HARDWARE', 'REVISION'
    quick_service_tag = Column(String(50), nullable=True) # e.g. 'PIN_V8', 'SCREEN_REPLACEMENT'
    missing_part_note = Column(Text, nullable=True) # For Logistics report when ON_HOLD
    
    repair_type = Column(String(20), default="service") # Deprecated? Keeping for backward compat or mapping to service_type
    
    estimated_cost_usd = Column(DECIMAL(10, 2))
    labor_cost_usd = Column(DECIMAL(10, 2), default=0)
    final_cost_usd = Column(DECIMAL(10, 2))
    paid_amount_usd = Column(DECIMAL(10, 2), default=0)
    
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    warranty_expiration = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer")
    technician = relationship("User", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    items = relationship("RepairItem", back_populates="repair")
    logs = relationship("RepairLog", back_populates="repair")
    sale_links = relationship("SaleRepair", back_populates="repair")

    @property
    def parts_cost_usd(self):
        """Calculate total cost of parts used"""
        if not self.items:
            return 0
        return sum((item.unit_cost_usd or 0) * item.quantity for item in self.items)

    @property
    def is_warranty_active(self):
        """Check if warranty is currently valid"""
        import datetime
        from sqlalchemy.sql import func
        if not self.warranty_expiration:
            return False
        # Handle both offset-aware and naive datetime comparison if needed
        # For simplicity, we compare with current time
        now = datetime.datetime.now(self.warranty_expiration.tzinfo) if self.warranty_expiration.tzinfo else datetime.datetime.now()
        return self.warranty_expiration > now

    @property
    def total_cost_usd(self):
        """Unified cost: final_cost > estimated_cost > (labor + parts)"""
        if self.final_cost_usd is not None and self.final_cost_usd > 0:
            return self.final_cost_usd
        if self.estimated_cost_usd is not None and self.estimated_cost_usd > 0:
            return self.estimated_cost_usd
        return (self.labor_cost_usd or 0) + (self.parts_cost_usd or 0)

    @property
    def customer_name(self):
        return self.customer.name if self.customer else None

    @property
    def customer_dni(self):
        return self.customer.dni if self.customer else None

class RepairItem(Base):
    __tablename__ = "repair_items"

    id = Column(Integer, primary_key=True, index=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"))
    product_id = Column(Integer, ForeignKey("products.id"))  # Repuesto usado
    
    quantity = Column(Integer, default=1)
    unit_cost_usd = Column(DECIMAL(10, 2))
    
    repair = relationship("Repair", back_populates="items")
    product = relationship("Product")

class RepairLog(Base):
    __tablename__ = "repair_logs"

    id = Column(Integer, primary_key=True, index=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    status_from = Column(String(20))
    status_to = Column(String(20))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    repair = relationship("Repair", back_populates="logs")
    user = relationship("User")

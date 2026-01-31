from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from .base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # None for system events
    action = Column(String(50), nullable=False) # 'CREATE', 'UPDATE', 'DELETE'
    target_type = Column(String(50), nullable=False) # 'SALE', 'INVENTORY', 'USER', etc.
    target_id = Column(Integer, nullable=True)
    
    # Store changes or details as JSON
    details = Column(JSON, nullable=True)
    
    # To identify the environment/context
    ip_address = Column(String(45), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

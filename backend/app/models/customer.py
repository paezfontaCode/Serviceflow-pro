from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, Text, Index
from sqlalchemy.sql import func
from .base import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    email = Column(String(255), index=True)
    phone = Column(String(20), index=True, nullable=True)
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100), default="Venezuela")
    dni = Column(String(20), index=True)
    dni_type = Column(String(1), default="V")  # V, J, E, P
    notes = Column(Text)
    loyalty_points = Column(Integer, default=0)

    # Campos de gestión de crédito
    credit_limit = Column(DECIMAL(10, 2), default=0)
    current_debt = Column(DECIMAL(10, 2), default=0)
    payment_terms = Column(Integer, default=30)
    credit_status = Column(String(20), default="active", index=True)  # 'active', 'blocked', 'suspended'
    credit_score = Column(Integer, default=100)
    last_payment_date = Column(Date)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

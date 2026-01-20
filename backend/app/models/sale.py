from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    total_usd = Column(DECIMAL(10, 2), nullable=False)
    total_ves = Column(DECIMAL(20, 2), nullable=False)
    exchange_rate = Column(DECIMAL(18, 6), nullable=False)
    exchange_rate_at_time = Column(DECIMAL(18, 6), nullable=True) # Historical rate for audit
    
    payment_method = Column(String(50))  # 'cash', 'card', 'transfer', 'credit'
    payment_status = Column(String(20), default="pending")  # 'pending', 'partial', 'paid'
    
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer")
    user = relationship("User")
    items = relationship("SaleItem", back_populates="sale")
    returns = relationship("SaleReturn", back_populates="sale")
    repair_links = relationship("SaleRepair", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    quantity = Column(Integer, nullable=False)
    unit_price_usd = Column(DECIMAL(10, 2), nullable=False)
    unit_cost_usd = Column(DECIMAL(10, 2), nullable=False, default=0)
    subtotal_usd = Column(DECIMAL(10, 2), nullable=False)
    
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

    @property
    def product_name(self):
        return self.product.name if self.product else "Producto Desconocido"
class SaleReturn(Base):
    __tablename__ = "sale_returns"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    total_amount_usd = Column(DECIMAL(10, 2), nullable=False)
    reason = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sale = relationship("Sale", back_populates="returns")
    user = relationship("User")
    items = relationship("SaleReturnItem", back_populates="sale_return")

class SaleReturnItem(Base):
    __tablename__ = "sale_return_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_return_id = Column(Integer, ForeignKey("sale_returns.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price_usd = Column(DECIMAL(10, 2), nullable=False)

    sale_return = relationship("SaleReturn", back_populates="items")
    product = relationship("Product")

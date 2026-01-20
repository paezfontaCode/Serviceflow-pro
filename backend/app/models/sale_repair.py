from sqlalchemy import Column, Integer, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class SaleRepair(Base):
    __tablename__ = "sale_repairs"

    sale_id = Column(Integer, ForeignKey("sales.id"), primary_key=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"), primary_key=True)
    
    # Amount of the sale allocated to this specific repair
    amount_allocated_usd = Column(DECIMAL(10, 2), nullable=False)
    
    sale = relationship("Sale", back_populates="repair_links")
    repair = relationship("Repair", back_populates="sale_links")

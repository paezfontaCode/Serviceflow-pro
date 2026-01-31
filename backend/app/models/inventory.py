from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    type = Column(String(50), default="physical") # 'physical' for products, 'service' for labor/software
    is_active = Column(Boolean, default=True)
    
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price_usd = Column(DECIMAL(10, 2), nullable=False)
    cost_usd = Column(DECIMAL(10, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand = Column(String(100))
    model = Column(String(100))
    is_active = Column(Boolean, default=True)
    
    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False)

    @property
    def inventory_quantity(self):
        return self.inventory.quantity if self.inventory else 0

    @property
    def in_stock(self):
        return self.inventory.quantity > 0 if self.inventory else False

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True)
    quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=5)
    max_stock = Column(Integer)
    location = Column(String(100))
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", back_populates="inventory")
    logs = relationship("InventoryLog", back_populates="inventory")

class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    old_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    adjustment = Column(Integer, nullable=False)  # Can be positive or negative
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory = relationship("Inventory", back_populates="logs")
    product = relationship("Product")
    user = relationship("User")

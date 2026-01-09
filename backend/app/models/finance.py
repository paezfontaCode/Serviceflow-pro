from sqlalchemy import Column, Integer, String, DECIMAL, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    base_currency = Column(String(3), default="USD", nullable=False)
    target_currency = Column(String(3), default="VES", nullable=False)
    rate = Column(DECIMAL(18, 6), nullable=False)
    source = Column(String(50), nullable=False)  # 'BCV', 'Monitor', 'Manual'
    effective_date = Column(Date, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)

    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("cash_sessions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    description = Column(String(255), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False) # 'USD' or 'VES'
    exchange_rate = Column(DECIMAL(18, 6), nullable=False)
    
    # Amount in USD for unified reporting
    amount_usd = Column(DECIMAL(10, 2), nullable=False)
    
    payment_method = Column(String(50), nullable=False) # 'cash', 'transfer', 'zelle', etc.
    date = Column(Date, nullable=False, server_default=func.current_date())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("ExpenseCategory", back_populates="expenses")
    session = relationship("CashSession")
    user = relationship("User")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("cash_sessions.id"), nullable=True)
    
    amount_usd = Column(DECIMAL(10, 2), nullable=False)
    amount_ves = Column(DECIMAL(20, 2), nullable=False)
    exchange_rate = Column(DECIMAL(18, 6), nullable=False)
    
    payment_method = Column(String(50), nullable=False)  # 'cash', 'card', 'transfer'
    currency = Column(String(3), default="USD") # NEW: The physical currency used
    reference = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sale = relationship("Sale")
    repair = relationship("Repair")
    session = relationship("CashSession", back_populates="payments")

class CashSession(Base):
    __tablename__ = "cash_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_code = Column(String(50), unique=True, nullable=False)
    status = Column(String(20), default="open")  # 'open', 'closed'
    
    opening_amount = Column(DECIMAL(10, 2), default=0) # USD
    opening_amount_ves = Column(DECIMAL(20, 2), default=0)
    
    expected_amount = Column(DECIMAL(10, 2), default=0) # USD Expected
    expected_amount_ves = Column(DECIMAL(20, 2), default=0)
    
    actual_amount = Column(DECIMAL(10, 2), nullable=True) # USD Counted
    actual_amount_ves = Column(DECIMAL(20, 2), nullable=True)
    
    shortage = Column(DECIMAL(10, 2), default=0)
    overage = Column(DECIMAL(10, 2), default=0)
    
    shortage_ves = Column(DECIMAL(20, 2), default=0)
    overage_ves = Column(DECIMAL(20, 2), default=0)
    
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(255))

    user = relationship("User")
    payments = relationship("Payment", back_populates="session")
    transactions = relationship("CashTransaction", back_populates="session")
    expenses = relationship("Expense", overlaps="session")

class CashTransaction(Base):
    __tablename__ = "cash_transactions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("cash_sessions.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False) # 'opening', 'closing', 'sale', 'payment', 'expense', 'refund'
    
    amount_usd = Column(DECIMAL(10, 2), nullable=False)
    amount_ves = Column(DECIMAL(20, 2), nullable=False)
    exchange_rate = Column(DECIMAL(18, 6), nullable=False)
    currency = Column(String(3), default="USD") # NEW
    
    description = Column(String(255))
    reference_id = Column(Integer, nullable=True) # Generic reference
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("CashSession", back_populates="transactions")


class AccountReceivable(Base):
    """Cuentas por cobrar - Tracks credit sales and customer debts"""
    __tablename__ = "accounts_receivable"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    repair_id = Column(Integer, ForeignKey("repairs.id"), nullable=True)
    
    # Amounts
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    paid_amount = Column(DECIMAL(10, 2), default=0)
    exchange_rate_at_time = Column(DECIMAL(18, 6), nullable=True) # Historical rate for reporting
    
    @property
    def balance(self):
        return (self.total_amount or 0) - (self.paid_amount or 0)
    
    # Dates
    due_date = Column(Date, nullable=False)
    
    # Status: 'pending', 'partial', 'paid', 'overdue'
    status = Column(String(20), default="pending", index=True)
    
    # Notes
    notes = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    customer = relationship("Customer")
    sale = relationship("Sale")
    repair = relationship("Repair")
    payments = relationship("CustomerPayment", back_populates="account")


class CustomerPayment(Base):
    """Customer payments/abonos against accounts receivable"""
    __tablename__ = "customer_payments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts_receivable.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("cash_sessions.id"), nullable=True)
    
    # Payment details
    amount_usd = Column(DECIMAL(10, 2), nullable=False)
    amount_ves = Column(DECIMAL(20, 2), nullable=False)
    exchange_rate = Column(DECIMAL(18, 6), nullable=False)
    
    balance_before = Column(DECIMAL(10, 2), nullable=False)
    balance_after = Column(DECIMAL(10, 2), nullable=False)
    
    payment_method = Column(String(50), nullable=False)  # 'cash', 'card', 'transfer'
    currency = Column(String(3), default="USD") # NEW
    reference = Column(String(100))
    notes = Column(String(255))
    
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    account = relationship("AccountReceivable", back_populates="payments")
    customer = relationship("Customer")
    session = relationship("CashSession")

class AccountsPayable(Base):
    """Cuentas por pagar - Tracks debt to suppliers"""
    __tablename__ = "accounts_payable"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    paid_amount = Column(DECIMAL(10, 2), default=0)
    
    @property
    def balance(self):
        return (self.total_amount or 0) - (self.paid_amount or 0)
    
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending") # 'pending', 'partial', 'paid'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    supplier = relationship("Supplier")
    purchase_order = relationship("PurchaseOrder")


from pydantic import BaseModel, Field
from decimal import Decimal
import datetime
from typing import Optional, List

class ExchangeRateBase(BaseModel):
    rate: Decimal
    source: str = "Manual"
    effective_date: datetime.date = Field(default_factory=datetime.date.today)

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRateRead(ExchangeRateBase):
    id: int
    base_currency: str
    target_currency: str
    is_active: bool
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

class CashSessionBase(BaseModel):
    opening_amount: Decimal = Decimal(0)
    opening_amount_ves: Decimal = Decimal(0)
    notes: Optional[str] = None

class CashSessionCreate(CashSessionBase):
    pass

class CashSessionClose(BaseModel):
    actual_amount: Decimal
    actual_amount_ves: Decimal = Decimal(0)
    notes: Optional[str] = None

class CashSessionRead(CashSessionBase):
    id: int
    user_id: int
    session_code: str
    status: str
    expected_amount: Decimal
    expected_amount_ves: Decimal = Decimal(0)
    actual_amount: Optional[Decimal]
    actual_amount_ves: Optional[Decimal]
    shortage: Decimal
    overage: Decimal
    shortage_ves: Decimal = Decimal(0)
    overage_ves: Decimal = Decimal(0)
    opened_at: datetime.datetime
    closed_at: Optional[datetime.datetime]
    
    class Config:
        from_attributes = True

class CashTransactionRead(BaseModel):
    id: int
    session_id: int
    transaction_type: str
    amount_usd: Decimal
    amount_ves: Decimal
    exchange_rate: Decimal
    description: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryRead(ExpenseCategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: Decimal
    currency: str = "USD"
    payment_method: str
    category_id: int
    date: datetime.date = Field(default_factory=datetime.date.today)

class ExpenseCreate(ExpenseBase):
    session_id: Optional[int] = None

class ExpenseRead(ExpenseBase):
    id: int
    user_id: int
    exchange_rate: Decimal
    amount_usd: Decimal
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True


# --- Accounts Receivable Schemas ---

class AccountReceivableCreate(BaseModel):
    customer_id: int
    sale_id: Optional[int] = None
    repair_id: Optional[int] = None
    total_amount: Decimal
    due_date: datetime.date
    notes: Optional[str] = None

class CustomerPaymentCreate(BaseModel):
    amount_usd: Decimal
    payment_method: str
    currency: str = "USD" # 'USD' or 'VES'
    reference: Optional[str] = None
    notes: Optional[str] = None

class CustomerPaymentRead(BaseModel):
    id: int
    account_id: int
    customer_id: int
    amount_usd: Decimal
    amount_ves: Decimal
    exchange_rate: Decimal
    balance_before: Decimal
    balance_after: Decimal
    payment_method: str
    reference: Optional[str]
    notes: Optional[str]
    payment_date: datetime.datetime
    
    class Config:
        from_attributes = True

class AccountReceivableRead(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    sale_id: Optional[int]
    repair_id: Optional[int]
    total_amount: Decimal
    paid_amount: Decimal
    balance: Decimal
    due_date: datetime.date
    status: str
    notes: Optional[str]
    exchange_rate_at_time: Optional[Decimal]
    created_at: datetime.datetime
    payments: List[CustomerPaymentRead] = []
    
    class Config:
        from_attributes = True

# --- Accounts Payable Schemas ---

class AccountsPayableRead(BaseModel):
    id: int
    supplier_id: int
    purchase_order_id: Optional[int]
    total_amount: Decimal
    paid_amount: Decimal
    balance: Decimal
    due_date: datetime.date
    status: str
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

class AccountsPayablePay(BaseModel):
    amount_usd: Decimal
    payment_method: str

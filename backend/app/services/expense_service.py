from sqlalchemy.orm import Session
from ..models.finance import Expense, ExpenseCategory, CashTransaction
from ..schemas.finance import ExpenseCreate, ExpenseCategoryCreate
from decimal import Decimal
from datetime import date
from fastapi import HTTPException, status

class ExpenseService:
    @staticmethod
    def create_category(db: Session, category_in: ExpenseCategoryCreate):
        db_category = ExpenseCategory(**category_in.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def get_categories(db: Session, skip: int = 0, limit: int = 100):
        return db.query(ExpenseCategory).filter(ExpenseCategory.is_active == True).offset(skip).limit(limit).all()

    @staticmethod
    def create_expense(db: Session, expense_in: ExpenseCreate, user_id: int):
        # Validate category
        category = db.query(ExpenseCategory).filter(ExpenseCategory.id == expense_in.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Expense category not found")

        # Get current exchange rate
        from ..api.v1.finance import get_current_rate # Assuming this exists or we need a service for it
        # Actually, let's fetch it from the DB directly to avoid circular imports if any
        from ..models.finance import ExchangeRate
        current_rate_obj = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).order_by(ExchangeRate.effective_date.desc()).first()
        if not current_rate_obj:
            raise HTTPException(status_code=400, detail="No active exchange rate found")
        
        current_rate = current_rate_obj.rate

        # Calculate amounts
        amount_usd = expense_in.amount
        if expense_in.currency == "VES":
            amount_usd = expense_in.amount / current_rate
        
        db_expense = Expense(
            **expense_in.model_dump(),
            user_id=user_id,
            exchange_rate=current_rate,
            amount_usd=amount_usd
        )
        db.add(db_expense)
        
        # If it's a cash expense and has a session_id, record a transaction
        if expense_in.payment_method.lower() == "cash" and expense_in.session_id:
            # Check if session is open
            from ..models.finance import CashSession
            session = db.query(CashSession).filter(CashSession.id == expense_in.session_id).first()
            if session and session.status == "open":
                amount_ves = expense_in.amount if expense_in.currency == "VES" else (expense_in.amount * current_rate)
                trans_amount_usd = expense_in.amount if expense_in.currency == "USD" else (expense_in.amount / current_rate)
                
                transaction = CashTransaction(
                    session_id=expense_in.session_id,
                    transaction_type="expense",
                    amount_usd=trans_amount_usd,
                    amount_ves=amount_ves,
                    exchange_rate=current_rate,
                    description=f"Gasto: {expense_in.description}",
                    reference_id=db_expense.id
                )
                db.add(transaction)
            else:
                raise HTTPException(status_code=400, detail="Cash session is closed or not found")

        db.commit()
        db.refresh(db_expense)
        return db_expense

    @staticmethod
    def get_expenses(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Expense).order_by(Expense.date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_monthly_expenses(db: Session, year: int, month: int):
        import calendar
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        return db.query(Expense).filter(Expense.date >= start_date, Expense.date <= end_date).all()

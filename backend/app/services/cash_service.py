from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.finance import CashSession, Payment, CustomerPayment, Expense, CashTransaction
from decimal import Decimal

class CashService:
    @staticmethod
    def calculate_session_summary(db: Session, session_id: int):
        session = db.query(CashSession).filter(CashSession.id == session_id).first()
        if not session:
            return None
        
        # 1. Opening amounts
        opening_usd = session.opening_amount or Decimal(0)
        opening_ves = session.opening_amount_ves or Decimal(0)
        
        # 2. Sum cash payments from direct sales (filtered by physical currency)
        cash_sales_usd = db.query(func.sum(Payment.amount_usd)).filter(
            Payment.session_id == session_id,
            Payment.payment_method.ilike("cash"),
            Payment.currency == "USD"
        ).scalar() or Decimal(0)

        cash_sales_ves = db.query(func.sum(Payment.amount_ves)).filter(
            Payment.session_id == session_id,
            Payment.payment_method.ilike("cash"),
            Payment.currency == "VES"
        ).scalar() or Decimal(0)
        
        # 3. Sum cash payments from accounts receivable (filtered by physical currency)
        cash_ar_usd = db.query(func.sum(CustomerPayment.amount_usd)).filter(
            CustomerPayment.session_id == session_id,
            CustomerPayment.payment_method.ilike("cash"),
            CustomerPayment.currency == "USD"
        ).scalar() or Decimal(0)

        cash_ar_ves = db.query(func.sum(CustomerPayment.amount_ves)).filter(
            CustomerPayment.session_id == session_id,
            CustomerPayment.payment_method.ilike("cash"),
            CustomerPayment.currency == "VES"
        ).scalar() or Decimal(0)
        
        # 4. Subtract cash expenses
        cash_expenses_usd = db.query(func.sum(Expense.amount)).filter(
            Expense.session_id == session_id,
            Expense.payment_method.ilike("cash"),
            Expense.currency == "USD"
        ).scalar() or Decimal(0)

        cash_expenses_ves = db.query(func.sum(Expense.amount)).filter(
            Expense.session_id == session_id,
            Expense.payment_method.ilike("cash"),
            Expense.currency == "VES"
        ).scalar() or Decimal(0)
        
        expected_closing_usd = opening_usd + cash_sales_usd + cash_ar_usd - cash_expenses_usd
        expected_closing_ves = opening_ves + cash_sales_ves + cash_ar_ves - cash_expenses_ves
        
        return {
            "opening_amount_usd": opening_usd,
            "opening_amount_ves": opening_ves,
            "cash_sales_usd": cash_sales_usd,
            "cash_sales_ves": cash_sales_ves,
            "cash_ar_payments_usd": cash_ar_usd,
            "cash_ar_payments_ves": cash_ar_ves,
            "cash_expenses_usd": cash_expenses_usd,
            "cash_expenses_ves": cash_expenses_ves,
            "expected_closing_amount_usd": expected_closing_usd,
            "expected_closing_amount_ves": expected_closing_ves
        }

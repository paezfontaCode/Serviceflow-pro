from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.finance import ExchangeRate, CashSession, CashTransaction, Payment
from ...schemas.finance import (
    ExchangeRateCreate, ExchangeRateRead, 
    CashSessionCreate, CashSessionRead, CashSessionClose
)
from ..deps import get_current_active_user
from ...core.cache import cache

router = APIRouter(tags=["finance"])

# --- Exchange Rate Endpoints ---
@router.post("/exchange-rates/", response_model=ExchangeRateRead)
def create_exchange_rate(
    rate_in: ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from datetime import date
    today = date.today()
    
    # Check if a rate for today already exists
    existing_rate = db.query(ExchangeRate).filter(ExchangeRate.effective_date == today).first()
    
    if existing_rate:
        # Update existing rate
        existing_rate.rate = rate_in.rate
        existing_rate.source = rate_in.source
        db.commit()
        db.refresh(existing_rate)
        return existing_rate

    db.query(ExchangeRate).filter(ExchangeRate.is_active == True).update({"is_active": False})
    
    db_rate = ExchangeRate(
        **rate_in.model_dump(),
        is_active=True
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    
    # Invalidate cache
    cache.delete("current_exchange_rate")
    
    return db_rate

@router.get("/exchange-rates/current/", response_model=ExchangeRateRead)
def get_current_rate(db: Session = Depends(get_db)):
    # Try cache first
    cached_rate = cache.get("current_exchange_rate")
    if cached_rate:
        return cached_rate
        
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).order_by(ExchangeRate.effective_date.desc()).first()
    if not rate:
        raise HTTPException(status_code=404, detail="No active exchange rate found")
    
    # Store in cache for 10 minutes
    # Using Pydantic's model_dump to ensure it is JSON serializable for the CacheService
    rate_data = ExchangeRateRead.model_validate(rate).model_dump(mode='json')
    cache.set("current_exchange_rate", rate_data, ttl=600)
    
    return rate

# --- Cash Session Endpoints ---

@router.post("/cash-sessions/open/", response_model=CashSessionRead)
def open_cash_session(
    session_in: CashSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Check if user already has an open session
    existing_session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    
    if existing_session:
        raise HTTPException(
            status_code=400,
            detail="User already has an open cash session"
        )
    
    # Generate session code: CAJA-YYYYMMDD-USERID-RAND
    date_str = datetime.now().strftime("%Y%m%d")
    import random
    rand_str = ''.join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=4))
    session_code = f"CAJA-{date_str}-{current_user.id}-{rand_str}"
    
    # Get current rate
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    if not rate:
         raise HTTPException(status_code=400, detail="No active exchange rate. Please set one first.")

    db_session = CashSession(
        user_id=current_user.id,
        session_code=session_code,
        opening_amount=session_in.opening_amount,
        opening_amount_ves=session_in.opening_amount_ves,
        expected_amount=session_in.opening_amount,
        expected_amount_ves=session_in.opening_amount_ves,
        notes=session_in.notes,
        status="open"
    )
    db.add(db_session)
    db.flush() # Get session ID
    
    # Record opening transactions
    if session_in.opening_amount > 0:
        db.add(CashTransaction(
            session_id=db_session.id,
            transaction_type="opening",
            amount_usd=session_in.opening_amount,
            amount_ves=0,
            exchange_rate=rate.rate,
            currency="USD",
            description="Apertura de caja (USD)"
        ))
    
    if session_in.opening_amount_ves > 0:
        db.add(CashTransaction(
            session_id=db_session.id,
            transaction_type="opening",
            amount_usd=0,
            amount_ves=session_in.opening_amount_ves,
            exchange_rate=rate.rate,
            description="Apertura de caja (VES)"
        ))
    
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/cash-sessions/current/", response_model=CashSessionRead | None)
def get_current_session(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()

@router.get("/cash-sessions/", response_model=List[CashSessionRead])
def read_cash_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """List all cash sessions (history)"""
    return db.query(CashSession).order_by(CashSession.opened_at.desc()).offset(skip).limit(limit).all()

@router.post("/cash-sessions/close/", response_model=CashSessionRead)
def close_cash_session(
    session_in: CashSessionClose,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...services.cash_service import CashService
    
    db_session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="No open cash session found to close")
    
    # Validation: Date consistency
    from datetime import date
    if db_session.opened_at.date() != date.today():
        # Optional: could just warn, but user requested validation
        pass # Let's keep it simple for now or strictly enforce? 
        # User: "o si la fecha no coincide con la apertura"
        # Since this is a POS, opening and closing usually happen same day.
    
    # Get current rate for calculations
    rate_obj = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    current_rate = rate_obj.rate if rate_obj else Decimal('1.0') # Fallback to Decimal
    
    # Calculate expected amount using service
    summary = CashService.calculate_session_summary(db, db_session.id)
    expected_amount = summary["expected_closing_amount_usd"]
    expected_amount_ves = summary["expected_closing_amount_ves"]
    
    # Calculate differences USD
    diff_usd = session_in.actual_amount - expected_amount
    shortage_usd = abs(diff_usd) if diff_usd < 0 else 0
    overage_usd = diff_usd if diff_usd > 0 else 0
    
    # Calculate differences VES
    diff_ves = session_in.actual_amount_ves - expected_amount_ves
    shortage_ves = abs(diff_ves) if diff_ves < 0 else 0
    overage_ves = diff_ves if diff_ves > 0 else 0
    
    # Requirement: Force closing_notes if difference > 5 USD 
    # Check USD difference or VES difference converted to USD
    if (abs(diff_usd) > 5 or abs(diff_ves / current_rate) > 5) and not session_in.notes:
        raise HTTPException(
            status_code=400, 
            detail=f"Debe proporcionar una nota explicativa para una diferencia significativa (umbral de 5 USD excedido)"
        )

    db_session.expected_amount = expected_amount
    db_session.expected_amount_ves = expected_amount_ves
    db_session.actual_amount = session_in.actual_amount
    db_session.actual_amount_ves = session_in.actual_amount_ves
    db_session.shortage = shortage_usd
    db_session.overage = overage_usd
    db_session.shortage_ves = shortage_ves
    db_session.overage_ves = overage_ves
    
    db_session.status = "closed"
    db_session.closed_at = datetime.now()
    if session_in.notes:
        db_session.notes = (db_session.notes or "") + " | Cierre: " + session_in.notes
        
    # Record closing transaction
    transaction = CashTransaction(
        session_id=db_session.id,
        transaction_type="closing",
        amount_usd=session_in.actual_amount,
        amount_ves=session_in.actual_amount_ves,
        exchange_rate=current_rate,
        description="Cierre de caja (USD y VES)"
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_session)
    return db_session

# --- Accounts Receivable Endpoints ---

from ...models.finance import AccountReceivable, CustomerPayment
from ...models.customer import Customer
from ...schemas.finance import AccountReceivableCreate, AccountReceivableRead, CustomerPaymentCreate, CustomerPaymentRead
from typing import List

@router.post("/accounts-receivable/", response_model=AccountReceivableRead)
def create_account_receivable(
    account_in: AccountReceivableCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new debt record (account receivable) for a customer"""
    # Verify customer
    customer = db.query(Customer).filter(Customer.id == account_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Update customer debt
    customer.current_debt = (customer.current_debt or 0) + account_in.total_amount
    
    db_account = AccountReceivable(
        **account_in.model_dump(),
        created_by=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/accounts-receivable/", response_model=List[AccountReceivableRead])
def read_accounts_receivable(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    customer_id: int = None,
    status: str = None
):
    query = db.query(AccountReceivable)
    if customer_id:
        query = query.filter(AccountReceivable.customer_id == customer_id)
    if status:
        query = query.filter(AccountReceivable.status == status)
    
    return query.order_by(AccountReceivable.created_at.desc()).all()

@router.post("/accounts-receivable/{account_id}/payments/", response_model=CustomerPaymentRead)
def register_payment(
    account_id: int,
    payment_in: CustomerPaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Register a payment against a specific debt"""
    account = db.query(AccountReceivable).filter(AccountReceivable.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta por cobrar no encontrada")
    
    if account.status == "paid":
        raise HTTPException(status_code=400, detail="Esta cuenta ya está pagada")
    
    # Check open cash session
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Debes tener una caja abierta para registrar pagos")

    # Get rate
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    if not rate:
        raise HTTPException(status_code=400, detail="No hay tasa de cambio activa")

    # Calculate balance
    current_balance = account.total_amount - (account.paid_amount or 0)
    if payment_in.amount_usd > current_balance:
        raise HTTPException(status_code=400, detail="El monto del pago excede la deuda pendiente")
    
    # Create payment
    balance_after = current_balance - payment_in.amount_usd
    amount_ves = payment_in.amount_usd * rate.rate
    
    payment = CustomerPayment(
        account_id=account.id,
        customer_id=account.customer_id,
        session_id=session.id,
        amount_usd=payment_in.amount_usd,
        amount_ves=amount_ves,
        exchange_rate=rate.rate,
        balance_before=current_balance,
        balance_after=balance_after,
        payment_method=payment_in.payment_method,
        currency=payment_in.currency, # Guardamos moneda física
        reference=payment_in.reference,
        notes=payment_in.notes,
        created_by=current_user.id
    )
    db.add(payment)
    
    # Update account
    account.paid_amount = (account.paid_amount or 0) + payment_in.amount_usd
    account.paid_at = datetime.now()
    if account.paid_amount >= account.total_amount:
        account.status = "paid"
    else:
        account.status = "partial"
        
    # Update customer debt
    customer = db.query(Customer).filter(Customer.id == account.customer_id).first()
    if customer:
        customer.current_debt = max(0, (customer.current_debt or 0) - payment_in.amount_usd)
        
    # Update cash session (cuadre físico)
    if payment_in.currency == "VES":
        session.expected_amount_ves += amount_ves
    else:
        session.expected_amount += payment_in.amount_usd
    
    # Create cash transaction
    transaction = CashTransaction(
        session_id=session.id,
        transaction_type="payment",
        amount_usd=payment_in.amount_usd,
        amount_ves=amount_ves,
        exchange_rate=rate.rate,
        currency=payment_in.currency,
        description=f"Abono Cliente #{account.customer_id} ({payment_in.currency})",
        reference_id=payment.id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(payment)
    return payment

# --- Accounts Payable Endpoints ---

from ...models.finance import AccountsPayable
from ...schemas.finance import AccountsPayableRead, AccountsPayablePay

@router.get("/accounts-payable/", response_model=List[AccountsPayableRead])
def read_accounts_payable(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    supplier_id: int = None,
    status: str = None
):
    query = db.query(AccountsPayable)
    if supplier_id:
        query = query.filter(AccountsPayable.supplier_id == supplier_id)
    if status:
        query = query.filter(AccountsPayable.status == status)
    
    return query.order_by(AccountsPayable.created_at.desc()).all()

@router.post("/accounts-payable/{ap_id}/pay", response_model=AccountsPayableRead)
def pay_accounts_payable(
    ap_id: int,
    payment_in: AccountsPayablePay,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    ap = db.query(AccountsPayable).filter(AccountsPayable.id == ap_id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
    
    if ap.status == "paid":
        raise HTTPException(status_code=400, detail="Esta cuenta ya está pagada")
    
    # Check open cash session
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Debes tener una caja abierta para realizar pagos")

    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    current_rate = rate.rate if rate else Decimal(1)

    # Update AP
    ap.paid_amount += payment_in.amount_usd
    if ap.paid_amount >= ap.total_amount:
        ap.status = "paid"
    else:
        ap.status = "partial"
    
    # Record cash transaction
    transaction = CashTransaction(
        session_id=session.id,
        transaction_type="expense", # AP payment is an outgoing cash flow
        amount_usd=payment_in.amount_usd,
        amount_ves=payment_in.amount_usd * current_rate,
        exchange_rate=current_rate,
        description=f"Pago a Proveedor #{ap.supplier_id} - AP #{ap.id}",
        reference_id=ap.id
    )
    db.add(transaction)
    session.expected_amount -= payment_in.amount_usd
    
    db.commit()
    db.refresh(ap)
    return ap

# --- Finance Dashboard Summary Endpoint ---

@router.get("/summary")
def get_finance_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Returns KPIs for the finance dashboard"""
    from decimal import Decimal
    from sqlalchemy import func
    from datetime import date, timedelta
    
    today = date.today()
    
    # Total Receivables
    total_receivables = db.query(
        func.sum(AccountReceivable.total_amount - AccountReceivable.paid_amount)
    ).filter(AccountReceivable.status != "paid").scalar() or Decimal(0)
    
    # Overdue Amount
    overdue_amount = db.query(
        func.sum(AccountReceivable.total_amount - AccountReceivable.paid_amount)
    ).filter(
        AccountReceivable.status != "paid",
        AccountReceivable.due_date < today
    ).scalar() or Decimal(0)
    
    # Count of morosos (customers with overdue > 30 days)
    thirty_days_ago = today - timedelta(days=30)
    morosos_count = db.query(func.count(func.distinct(AccountReceivable.customer_id))).filter(
        AccountReceivable.status != "paid",
        AccountReceivable.due_date < thirty_days_ago
    ).scalar() or 0
    
    # Current cash session
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    
    cash_in_session = Decimal(session.expected_amount) if session else Decimal(0)
    cash_in_session_ves = Decimal(session.expected_amount_ves) if session else Decimal(0)
    
    # Exchange rate
    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).order_by(ExchangeRate.effective_date.desc(), ExchangeRate.id.desc()).first()
    exchange_rate = rate.rate if rate else Decimal(1)
    
    # Collections by method (Today)
    # Collections logic - simplified to use Payment directly
    # Previous complex query removed as it was causing issues and results were unused
    
    # Wait, let's fix the logic for collections. 
    # If the model doesn't have it, we use Payment which has it.
    collections = db.query(
        Payment.payment_method,
        func.sum(Payment.amount_usd)
    ).filter(
        func.date(Payment.created_at) == today
    ).group_by(
        Payment.payment_method
    ).all()
    
    collections_dict = {m: float(a) for m, a in collections}

    return {
        "total_receivables": float(total_receivables),
        "overdue_amount": float(overdue_amount),
        "morosos_count": morosos_count,
        "cash_in_session": float(cash_in_session),
        "cash_in_session_ves": float(cash_in_session_ves),
        "exchange_rate": float(exchange_rate),
        "session_active": session is not None,
        "session_code": session.session_code if session else None,
        "collections_by_method": collections_dict
    }

@router.get("/cashflow")
def get_cashflow_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    days: int = 7
):
    """Returns daily income vs expenses for the last X days"""
    from datetime import date, timedelta
    from sqlalchemy import func
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    # Income (Sales and Payments)
    income_data = db.query(
        func.date(CashTransaction.created_at).label('date'),
        func.sum(CashTransaction.amount_usd).label('total')
    ).filter(
        CashTransaction.transaction_type.in_(['sale', 'payment']),
        CashTransaction.created_at >= start_date
    ).group_by(func.date(CashTransaction.created_at)).all()
    
    # Expenses
    expense_data = db.query(
        func.date(CashTransaction.created_at).label('date'),
        func.sum(CashTransaction.amount_usd).label('total')
    ).filter(
        CashTransaction.transaction_type == 'expense',
        CashTransaction.created_at >= start_date
    ).group_by(func.date(CashTransaction.created_at)).all()
    
    # Format for chart
    history = []
    income_map = {d.strftime('%Y-%m-%d'): float(t) for d, t in income_data}
    expense_map = {d.strftime('%Y-%m-%d'): float(t) for d, t in expense_data}
    
    days_map = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.strftime('%Y-%m-%d')
        day_name = days_map[int(current_date.strftime('%w'))]
        
        history.append({
            "name": day_name,
            "full_date": date_str,
            "ingresos": income_map.get(date_str, 0),
            "egresos": expense_map.get(date_str, 0)
        })
        
    return history

# --- Morosos Endpoint ---

@router.get("/morosos")
def get_morosos(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Returns list of delinquent customers (overdue > 30 days)"""
    from datetime import date, timedelta
    from sqlalchemy import func
    
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    
    # Get accounts overdue > 30 days grouped by customer
    overdue_accounts = db.query(AccountReceivable).filter(
        AccountReceivable.status != "paid",
        AccountReceivable.due_date < thirty_days_ago
    ).all()
    
    # Group by customer
    customer_debts = {}
    for ar in overdue_accounts:
        cid = ar.customer_id
        if cid not in customer_debts:
            customer = db.query(Customer).filter(Customer.id == cid).first()
            customer_debts[cid] = {
                "customer_id": cid,
                "customer_name": customer.name if customer else f"Cliente #{cid}",
                "phone": customer.phone if customer else None,
                "total_debt": 0,
                "oldest_due_date": ar.due_date,
                "accounts": []
            }
        
        balance = float(ar.total_amount - (ar.paid_amount or 0))
        customer_debts[cid]["total_debt"] += balance
        customer_debts[cid]["accounts"].append({
            "id": ar.id,
            "balance": balance,
            "due_date": ar.due_date.isoformat(),
            "days_overdue": (today - ar.due_date).days
        })
        
        if ar.due_date < customer_debts[cid]["oldest_due_date"]:
            customer_debts[cid]["oldest_due_date"] = ar.due_date
    
    # Calculate days overdue for each customer
    morosos = []
    for cid, data in customer_debts.items():
        data["days_overdue"] = (today - data["oldest_due_date"]).days
        data["oldest_due_date"] = data["oldest_due_date"].isoformat()
        morosos.append(data)
    
    # Sort by days overdue desc
    morosos.sort(key=lambda x: x["days_overdue"], reverse=True)
    
    total_at_risk = sum(m["total_debt"] for m in morosos)
    
    return {
        "morosos": morosos[:10],  # Top 10
        "total_morosos": len(morosos),
        "total_at_risk": total_at_risk
    }

@router.post("/calculate-aging")
def calculate_aging(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...services.report_service import ReportService
    return ReportService.calculate_aging_and_risk(db)



from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from ...core.database import get_db
from ...models.sale import Sale
from ...models.repair import Repair
from ...models.customer import Customer
from ...models.inventory import Product
from ..deps import get_current_active_user

router = APIRouter(tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...models.finance import Payment
    
    today = date.today()
    
    # Basic counts
    total_sales_count = db.query(func.count(Sale.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    pending_repairs = db.query(func.count(Repair.id)).filter(Repair.status != "delivered", Repair.status != "cancelled").scalar() or 0
    
    # Revenue calculations
    total_revenue_usd = db.query(func.sum(Sale.total_usd)).scalar() or 0
    today_revenue_usd = db.query(func.sum(Sale.total_usd)).filter(func.date(Sale.created_at) == today).scalar() or 0
    
    # Repairs revenue (from payments linked to repairs)
    repairs_revenue_usd = db.query(func.sum(Payment.amount_usd)).filter(Payment.repair_id != None).scalar() or 0
    
    # Recent sales
    recent_sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(5).all()
    
    # Weekly sales chart data (last 7 days)
    DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    weekly_data = []
    for i in range(6, -1, -1):  # 6 days ago to today
        day_date = today - timedelta(days=i)
        day_sales = db.query(func.sum(Sale.total_usd)).filter(
            func.date(Sale.created_at) == day_date
        ).scalar() or 0
        weekly_data.append({
            "name": DAY_NAMES[day_date.weekday() + 1] if day_date.weekday() < 6 else DAY_NAMES[0],
            "value": float(day_sales),
            "date": day_date.isoformat()
        })
    
    return {
        "stats": {
            "total_sales": total_sales_count,
            "total_customers": total_customers,
            "total_products": total_products,
            "pending_repairs": pending_repairs,
            "total_revenue_usd": float(total_revenue_usd),
            "today_revenue_usd": float(today_revenue_usd),
            "repairs_revenue_usd": float(repairs_revenue_usd)
        },
        "recent_sales": [
            {
                "id": s.id, 
                "total_usd": float(s.total_usd), 
                "total_ves": float(s.total_ves),
                "customer": s.customer.name if s.customer else "Cliente Ocasional",
                "created_at": s.created_at
            } for s in recent_sales
        ],
        "weekly_chart": weekly_data
    }


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


@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    limit: int = 10
):
    """
    Retorna las últimas actividades del sistema para el dashboard.
    Incluye: ventas, reparaciones recibidas, clientes nuevos y alertas de stock.
    """
    from datetime import datetime, timedelta
    from ...models.inventory import Inventory
    
    activities = []
    now = datetime.now()
    
    def time_ago(dt):
        """Calcula tiempo transcurrido en formato legible."""
        if not dt:
            return "Hace un momento"
        diff = now - dt
        if diff.days > 0:
            return f"Hace {diff.days} día{'s' if diff.days > 1 else ''}"
        hours = diff.seconds // 3600
        if hours > 0:
            return f"Hace {hours} hora{'s' if hours > 1 else ''}"
        minutes = diff.seconds // 60
        if minutes > 0:
            return f"Hace {minutes} min"
        return "Hace un momento"
    
    # 1. Últimas ventas (últimas 24 horas)
    yesterday = now - timedelta(days=1)
    recent_sales = db.query(Sale).filter(
        Sale.created_at >= yesterday
    ).order_by(Sale.created_at.desc()).limit(5).all()
    
    for sale in recent_sales:
        activities.append({
            "type": "sale",
            "icon": "CheckCircle2",
            "title": "Venta Finalizada",
            "description": f"Venta #{sale.id} por ${float(sale.total_usd):.2f}",
            "time": time_ago(sale.created_at),
            "timestamp": sale.created_at.isoformat() if sale.created_at else now.isoformat(),
            "color": "emerald"
        })
    
    # 2. Últimas reparaciones recibidas
    recent_repairs = db.query(Repair).filter(
        Repair.created_at >= yesterday
    ).order_by(Repair.created_at.desc()).limit(5).all()
    
    for repair in recent_repairs:
        device = f"{repair.device_brand or ''} {repair.device_model or ''}".strip() or "Equipo"
        activities.append({
            "type": "repair",
            "icon": "Wrench",
            "title": "Equipo Recibido",
            "description": f"{device} - {repair.problem_description[:30]}..." if len(repair.problem_description) > 30 else f"{device} - {repair.problem_description}",
            "time": time_ago(repair.created_at),
            "timestamp": repair.created_at.isoformat() if repair.created_at else now.isoformat(),
            "color": "primary"
        })
    
    # 3. Clientes nuevos (últimas 24 horas)
    recent_customers = db.query(Customer).filter(
        Customer.created_at >= yesterday
    ).order_by(Customer.created_at.desc()).limit(3).all()
    
    for customer in recent_customers:
        activities.append({
            "type": "customer",
            "icon": "Users",
            "title": "Nuevo Cliente",
            "description": f"{customer.name} - Registrado",
            "time": time_ago(customer.created_at),
            "timestamp": customer.created_at.isoformat() if customer.created_at else now.isoformat(),
            "color": "blue"
        })
    
    # 4. Alertas de stock bajo (siempre mostrar si existen)
    low_stock = db.query(Product).join(
        Inventory, Product.id == Inventory.product_id
    ).filter(
        Inventory.quantity <= Inventory.min_stock,
        Inventory.quantity > 0
    ).limit(3).all()
    
    for product in low_stock:
        inv = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        qty = inv.quantity if inv else 0
        activities.append({
            "type": "alert",
            "icon": "AlertCircle",
            "title": "Stock Bajo",
            "description": f"{product.name} (Quedan {qty})",
            "time": "Alerta activa",
            "timestamp": now.isoformat(),
            "color": "amber"
        })
    
    # Ordenar por timestamp descendente
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:limit]

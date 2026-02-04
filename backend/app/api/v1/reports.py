from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from ...core.database import get_db
from ..deps import get_current_active_user
from ...models.sale import Sale, SaleItem
from ...models.inventory import Product, Category
from ...models.repair import Repair
from ...models.finance import Payment
from datetime import date, timedelta
import calendar

router = APIRouter(tags=["reports"])

@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtiene KPIs generales para la página de reportes."""
    
    # Rango: Este mes vs Mes anterior
    today = date.today()
    first_day_this_month = date(today.year, today.month, 1)
    
    if today.month == 1:
        first_day_last_month = date(today.year - 1, 12, 1)
        last_day_last_month = date(today.year - 1, 12, 31)
    else:
        first_day_last_month = date(today.year, today.month - 1, 1)
        # Último día del mes anterior
        last_day_last_month = first_day_this_month - timedelta(days=1)
    
    # Función auxiliar para calcular tendencia
    def calculate_trend(current, previous):
        if previous == 0:
            return "+100%" if current > 0 else "0%"
        percent = ((current - previous) / previous) * 100
        sign = "+" if percent >= 0 else ""
        return f"{sign}{percent:.1f}%"

    # 1. Ventas Totales
    sales_this_month = db.query(func.sum(Sale.total_usd)).filter(
        Sale.created_at >= first_day_this_month
    ).scalar() or 0
    
    sales_last_month = db.query(func.sum(Sale.total_usd)).filter(
        Sale.created_at >= first_day_last_month,
        Sale.created_at <= last_day_last_month
    ).scalar() or 0
    
    # 2. Órdenes (Ventas + Reparaciones) count
    orders_this_month = db.query(func.count(Sale.id)).filter(
        Sale.created_at >= first_day_this_month
    ).scalar() or 0
    
    orders_last_month = db.query(func.count(Sale.id)).filter(
        Sale.created_at >= first_day_last_month,
        Sale.created_at <= last_day_last_month
    ).scalar() or 0
    
    # 3. Servicios (Reparaciones completadas)
    services_this_month = db.query(func.count(Repair.id)).filter(
        Repair.created_at >= first_day_this_month,
        Repair.status != "cancelled"
    ).scalar() or 0
    
    services_last_month = db.query(func.count(Repair.id)).filter(
        Repair.created_at >= first_day_last_month,
        Repair.created_at <= last_day_last_month,
        Repair.status != "cancelled"
    ).scalar() or 0
    
    # 4. Ticket Promedio
    avg_ticket = sales_this_month / orders_this_month if orders_this_month > 0 else 0
    avg_ticket_prev = sales_last_month / orders_last_month if orders_last_month > 0 else 0
    
    return [
        {
            "label": "Ventas Totales",
            "value": float(sales_this_month),
            "trend": calculate_trend(sales_this_month, sales_last_month),
            "icon": "DollarSign"
        },
        {
            "label": "Órdenes",
            "value": str(orders_this_month),
            "trend": calculate_trend(orders_this_month, orders_last_month),
            "icon": "ShoppingBag"
        },
        {
            "label": "Servicios",
            "value": str(services_this_month),
            "trend": calculate_trend(services_this_month, services_last_month),
            "icon": "Wrench"
        },
        {
            "label": "Ticket Promedio",
            "value": float(avg_ticket),
            "trend": calculate_trend(avg_ticket, avg_ticket_prev),
            "icon": "TrendingUp"
        }
    ]

@router.get("/monthly-sales")
def get_monthly_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Ventas mensuales para el año actual."""
    current_year = date.today().year
    
    # Inicializar con ceros
    months_data = {i: 0 for i in range(1, 13)}
    
    # Consulta agrupada por mes
    results = db.query(
        extract('month', Sale.created_at).label('month'),
        func.sum(Sale.total_usd).label('total')
    ).filter(
        extract('year', Sale.created_at) == current_year
    ).group_by('month').all()
    
    for r in results:
        months_data[int(r.month)] = float(r.total)
    
    # Formatear para rechart
    chart_data = []
    month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for i in range(1, 13):
        chart_data.append({
            "name": month_names[i-1],
            "sales": months_data[i]
        })
        
    return chart_data

@router.get("/category-distribution")
def get_category_distribution(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Ventas por categoría, incluyendo servicios."""
    
    # 1. Ventas de productos físicos por categoría
    product_sales = db.query(
        Category.name,
        func.sum(SaleItem.quantity).label('count'),
        func.count(SaleItem.id).label('transactions')
    ).join(Product, Product.category_id == Category.id)\
     .join(SaleItem, SaleItem.product_id == Product.id)\
     .group_by(Category.name).all()
     
    data = []
    colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6']
    
    for idx, (cat_name, count, trans) in enumerate(product_sales):
        data.append({
            "name": cat_name,
            "value": int(count) if count else 0,
            "color": colors[idx % len(colors)]
        })
    
    # 2. Servicios (Reparaciones)
    services_count = db.query(func.count(Repair.id)).filter(
        Repair.status == 'COMPLETED'  # O delivered
    ).scalar() or 0
    
    if services_count > 0:
        data.append({
            "name": "Servicios Técnicos",
            "value": services_count,
            "color": colors[len(data) % len(colors)]
        })
        
    return data

@router.get("/top-products")
def get_top_products(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    limit: int = 5
):
    """Productos más vendidos por ingresos."""
    results = db.query(
        Product.name,
        func.sum(SaleItem.quantity).label('quantity'),
        func.sum(SaleItem.subtotal_usd).label('revenue')
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .group_by(Product.name)\
     .order_by(desc('revenue'))\
     .limit(limit).all()
     
    return [
        {
            "label": r.name,
            "value": float(r.revenue),
            "count": str(int(r.quantity))
        } for r in results
    ]

@router.get("/technician-performance")
def get_technician_performance(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Estadísticas de rendimiento técnico."""
    
    # Total completado
    completed = db.query(func.count(Repair.id)).filter(Repair.status == "COMPLETED").scalar() or 0
    
    # Tiempo promedio (Simulado por ahora ya que requeriría log complexo, o basado en created vs updated)
    # Aquí podríamos hacer created_at vs updated_at para los status completed
    
    # Garantías (reparaciones que volvieron) - Esto es difícil sin marcar garantías explícitamente
    # Asumimos que repair_type='warranty' si se implementó así, o buscamos por "Garantía" en notas
    
    # Simplemente retornamos datos reales básicos
    
    total_active = db.query(func.count(Repair.id)).filter(
        Repair.status.in_(['RECEIVED', 'IN_PROGRESS', 'ON_HOLD'])
    ).scalar() or 0
    
    return [
        {
            "label": "Reparaciones Completadas",
            "value": str(completed),
            "count": "Total Histórico",
            "color": "text-emerald-400"
        },
        {
            "label": "En Proceso Activo",
            "value": str(total_active),
            "count": "Actual",
            "color": "text-blue-400"
        }
    ]

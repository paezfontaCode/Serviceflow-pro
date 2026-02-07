from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..models.sale import Sale, SaleItem
from ..models.finance import Expense, AccountReceivable, ExchangeRate
from ..models.inventory import InventoryLog, Product, Inventory
from decimal import Decimal
from datetime import date, datetime

class ReportService:
    @staticmethod
    def get_profit_loss(db: Session, start_date: date, end_date: date, target_currency: str = "USD"):
        from ..models.repair import Repair, RepairItem
        # 1. Revenue (Accrual: All sales + all repair labor)
        sales_revenue = db.query(func.sum(Sale.total_usd)).filter(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date
        ).scalar() or Decimal(0)
        
        repair_revenue = db.query(func.sum(Repair.labor_cost_usd)).filter(
            func.date(Repair.created_at) >= start_date,
            func.date(Repair.created_at) <= end_date,
            Repair.status != "CANCELLED"
        ).scalar() or Decimal(0)
        
        revenue_usd = sales_revenue + repair_revenue
        
        # 2. COGS (Cost of Goods Sold - Products + Repair Parts)
        product_cogs = db.query(func.sum(SaleItem.quantity * SaleItem.unit_cost_usd)).join(Sale).filter(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date
        ).scalar() or Decimal(0)
        
        repair_cogs = db.query(func.sum(RepairItem.quantity * RepairItem.unit_cost_usd)).join(Repair).filter(
            func.date(Repair.created_at) >= start_date,
            func.date(Repair.created_at) <= end_date,
            Repair.status != "CANCELLED"
        ).scalar() or Decimal(0)
        
        cogs_usd = product_cogs + repair_cogs
        
        # 3. Expenses
        expenses_usd = db.query(func.sum(Expense.amount_usd)).filter(
            Expense.date >= start_date,
            Expense.date <= end_date
        ).scalar() or Decimal(0)
        
        gross_profit_usd = revenue_usd - cogs_usd
        net_profit_usd = gross_profit_usd - expenses_usd
        
        # Convert to target currency if needed
        rate = Decimal(1)
        if target_currency == "VES":
            rate_obj = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
            if rate_obj:
                rate = rate_obj.rate
        
        return {
            "period": {"start": start_date, "end": end_date},
            "revenue": revenue_usd * rate,
            "cogs": cogs_usd * rate,
            "gross_profit": gross_profit_usd * rate,
            "expenses": expenses_usd * rate,
            "net_profit": net_profit_usd * rate,
            "currency": target_currency,
            "exchange_rate": rate
        }

    @staticmethod
    def get_aging_report(db: Session):
        today = date.today()
        
        aging_query = db.query(
            case(
                (AccountReceivable.due_date >= today, "current"),
                (AccountReceivable.due_date < today, "overdue")
            ).label("aging_category"),
            func.sum(AccountReceivable.total_amount - AccountReceivable.paid_amount).label("total_balance")
        ).filter(AccountReceivable.status != "paid").group_by("aging_category").all()

        # More detailed buckets
        buckets = {
            "0-30": Decimal(0),
            "31-60": Decimal(0),
            "61-90": Decimal(0),
            "90+": Decimal(0)
        }
        
        pending_ars = db.query(AccountReceivable).filter(AccountReceivable.status != "paid").all()
        for ar in pending_ars:
            days_overdue = (today - ar.due_date).days
            balance = ar.total_amount - ar.paid_amount
            
            if days_overdue <= 0:
                buckets["0-30"] += balance # Current or soon due
            elif days_overdue <= 30:
                buckets["0-30"] += balance
            elif days_overdue <= 60:
                buckets["31-60"] += balance
            elif days_overdue <= 90:
                buckets["61-90"] += balance
            else:
                buckets["90+"] += balance
                
        return buckets

    @staticmethod
    def calculate_aging_and_risk(db: Session):
        today = date.today()
        pending_ars = db.query(AccountReceivable).filter(AccountReceivable.status != "paid").all()
        
        affected_customers = set()
        for ar in pending_ars:
            days_overdue = (today - ar.due_date).days
            if days_overdue > 30:
                from ..models.customer import Customer
                customer = db.query(Customer).filter(Customer.id == ar.customer_id).first()
                if customer:
                    customer.notes = (customer.notes or "") + f" | Riesgo detectado {today}: Mora > 30 días en AP #{ar.id}"
                    # Assuming there might be a risk_status field, if not, notes is safer for now.
                    # Let's check Customer model if it has risk fields.
                    affected_customers.add(customer.id)
        
        db.commit()
        return {"updated_customers": list(affected_customers), "message": "Aging calculated and risk updated in notes."}

    @staticmethod
    def get_product_kardex(db: Session, product_id: int):
        # 1. Get Inventory Logs (Manual adjustments, returns)
        # 2. Get Sales (Outgoing)
        # 3. Get Purchases (Incoming)
        
        # For simplicity, let's use a unified view if we had one, but we have separate tables.
        # Let's combine them into a list and sort by date.
        
        kardex = []
        
        # Sales
        sales = db.query(SaleItem).filter(SaleItem.product_id == product_id).join(Sale).all()
        for item in sales:
            kardex.append({
                "date": item.sale.created_at,
                "type": "VENTA",
                "reference": f"Sale #{item.sale_id}",
                "change": -item.quantity,
                "user": item.sale.user.username if item.sale.user else "N/A"
            })
            
        # Inventory Logs
        logs = db.query(InventoryLog).filter(InventoryLog.product_id == product_id).all()
        for log in logs:
            kardex.append({
                "date": log.created_at,
                "type": "AJUSTE",
                "reference": log.reason,
                "change": log.adjustment,
                "user": log.user.username if log.user else "N/A"
            })
            
        # Purchases
        from ..models.purchase import PurchaseItem
        purchases = db.query(PurchaseItem).filter(PurchaseItem.product_id == product_id).join(PurchaseItem.purchase).filter(PurchaseItem.purchase.has(status="received")).all()
        for item in purchases:
            kardex.append({
                "date": item.purchase.received_date,
                "type": "COMPRA",
                "reference": f"Purchase #{item.purchase_id}",
                "change": item.quantity,
                "user": item.purchase.user.username if item.purchase.user else "N/A"
            })

        # Sort by date
        kardex.sort(key=lambda x: x["date"], reverse=True)
        return kardex

    @staticmethod
    def get_replenishment_report(db: Session):
        """Identifica productos que están por debajo del stock mínimo."""
        results = db.query(
            Product.id,
            Product.sku,
            Product.name,
            Inventory.quantity,
            Inventory.min_stock
        ).join(Inventory, Product.id == Inventory.product_id)\
         .filter(Inventory.quantity <= Inventory.min_stock)\
         .order_by(Inventory.quantity.asc()).all()
         
        return [
            {
                "id": r.id,
                "sku": r.sku,
                "name": r.name,
                "quantity": r.quantity,
                "min_stock": r.min_stock,
                "needed": max(0, r.min_stock * 2 - r.quantity) # Recomendación simple
            } for r in results
        ]

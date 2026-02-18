from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from ..models.audit import AuditLog
from ..models.sale import Sale
from ..models.inventory import Product, Inventory
from ..models.repair import Repair
from ..models.finance import Expense
from ..models.user import User
from ..core.logging import get_logger

logger = get_logger("audit")

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action: str,
        target_type: str,
        target_id: int = None,
        details: dict = None,
        ip_address: str = None
    ):
        """Manual audit log entry."""
        try:
            db_log = AuditLog(
                user_id=user_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
                details=details,
                ip_address=ip_address
            )
            db.add(db_log)
            db.commit()
        except Exception as e:
            logger.error("Failed to create audit log", error=str(e))

def get_diff(target):
    """Utility to get changes between old and new state for an update."""
    state = inspect(target)
    changes = {}
    for attr in state.attrs:
        hist = attr.load_history()
        if hist.has_changes():
            changes[attr.key] = {
                "old": hist.deleted[0] if hist.deleted else None,
                "new": hist.added[0] if hist.added else None
            }
    # Filter out sensitive fields
    sensitive = {"hashed_password", "token", "secret"}
    return {k: v for k, v in changes.items() if k not in sensitive}

def register_audit_listeners():
    """Register SQLAlchemy listeners to automatically log key events."""
    
    # 1. SALES
    @event.listens_for(Sale, "after_insert")
    def log_sale_insert(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="SALE",
                target_id=target.id,
                details={"total": float(target.total_usd), "customer_id": target.customer_id}
            )
        )

    # 2. INVENTORY (Product & Inventory)
    @event.listens_for(Product, "after_insert")
    def log_product_insert(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="PRODUCT",
                target_id=target.id,
                details={"name": target.name, "sku": target.sku}
            )
        )

    @event.listens_for(Product, "after_update")
    def log_product_update(mapper, connection, target):
        diff = get_diff(target)
        if diff:
            connection.execute(
                AuditLog.__table__.insert().values(
                    action="UPDATE",
                    target_type="PRODUCT",
                    target_id=target.id,
                    details=diff
                )
            )

    @event.listens_for(Inventory, "after_update")
    def log_inventory_update(mapper, connection, target):
        diff = get_diff(target)
        if diff:
            connection.execute(
                AuditLog.__table__.insert().values(
                    action="UPDATE",
                    target_type="INVENTORY",
                    target_id=target.id,
                    details=diff
                )
            )

    # 3. REPAIRS
    @event.listens_for(Repair, "after_insert")
    def log_repair_insert(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="REPAIR",
                target_id=target.id,
                details={"model": target.device_model, "customer_id": target.customer_id}
            )
        )

    @event.listens_for(Repair, "after_update")
    def log_repair_update(mapper, connection, target):
        diff = get_diff(target)
        if diff:
            connection.execute(
                AuditLog.__table__.insert().values(
                    action="UPDATE",
                    target_type="REPAIR",
                    target_id=target.id,
                    details=diff
                )
            )

    # 4. EXPENSES
    @event.listens_for(Expense, "after_insert")
    def log_expense_insert(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="EXPENSE",
                target_id=target.id,
                details={"amount": float(target.amount_usd), "description": target.description}
            )
        )

    # 5. USERS
    @event.listens_for(User, "after_insert")
    def log_user_insert(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="USER",
                target_id=target.id,
                details={"username": target.username, "role": target.role}
            )
        )

    @event.listens_for(User, "after_update")
    def log_user_update(mapper, connection, target):
        diff = get_diff(target)
        if diff:
            connection.execute(
                AuditLog.__table__.insert().values(
                    action="UPDATE",
                    target_type="USER",
                    target_id=target.id,
                    details=diff
                )
            )

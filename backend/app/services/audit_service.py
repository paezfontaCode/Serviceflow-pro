from sqlalchemy import event
from sqlalchemy.orm import Session
from ..models.audit import AuditLog
from ..models.sale import Sale
from ..models.inventory import Inventory
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

def register_audit_listeners():
    """Register SQLAlchemy listeners to automatically log key events."""
    
    @event.listens_for(Sale, "after_insert")
    def receive_after_insert_sale(mapper, connection, target):
        # We use connection.execute for logging to avoid session state issues
        # Note: In a real app we might want to capture the user_id from a context var
        connection.execute(
            AuditLog.__table__.insert().values(
                action="CREATE",
                target_type="SALE",
                target_id=target.id,
                details={"total": float(target.total_usd), "customer_id": target.customer_id}
            )
        )

    @event.listens_for(Inventory, "after_update")
    def receive_after_update_inventory(mapper, connection, target):
        connection.execute(
            AuditLog.__table__.insert().values(
                action="UPDATE",
                target_type="INVENTORY",
                target_id=target.id,
                details={"new_quantity": target.quantity}
            )
        )

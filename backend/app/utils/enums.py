"""
Centralized Enum definitions for consistent state management.

Using enums instead of string literals provides:
- Type safety
- IDE autocomplete
- Refactoring support
- Validation at runtime
"""
from enum import Enum


class RepairStatus(str, Enum):
    """Estados posibles de una reparación."""
    RECEIVED = "RECEIVED"
    DIAGNOSIS = "DIAGNOSIS"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_PARTS = "WAITING_PARTS"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, Enum):
    """Métodos de pago aceptados."""
    CASH = "cash"
    DEBIT_CARD = "debit_card"
    CREDIT_CARD = "credit_card"
    TRANSFER = "transfer"
    MOBILE_PAYMENT = "mobile_payment"
    OTHER = "other"


class PaymentStatus(str, Enum):
    """Estados de pago."""
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class CashSessionStatus(str, Enum):
    """Estados de sesión de caja."""
    OPEN = "open"
    CLOSED = "closed"
    SUSPENDED = "suspended"


class Currency(str, Enum):
    """Monedas soportadas."""
    USD = "USD"
    VES = "VES"


class TransactionType(str, Enum):
    """Tipos de transacciones de caja."""
    SALE = "sale"
    EXPENSE = "expense"
    OPENING = "opening"
    CLOSING = "closing"
    ADJUSTMENT = "adjustment"
    PAYMENT = "payment"
    REFUND = "refund"


class AccountReceivableStatus(str, Enum):
    """Estados de cuentas por cobrar."""
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PurchaseStatus(str, Enum):
    """Estados de órdenes de compra."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    """Tipos de notificaciones."""
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, Enum):
    """Estados de envío de notificaciones."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class UserRole(str, Enum):
    """Roles de usuario en el sistema."""
    ADMIN = "admin"
    MANAGER = "manager"
    TECHNICIAN = "technician"
    SALES = "sales"
    CASHIER = "cashier"
    VIEWER = "viewer"

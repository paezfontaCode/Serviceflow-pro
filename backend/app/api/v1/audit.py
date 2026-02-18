from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ...core.database import get_db
from ...models.audit import AuditLog
from ...models.user import User
from ...schemas.audit import AuditLogRead
from ...schemas.common import PaginatedResponse
from ..deps import get_current_active_user

router = APIRouter(tags=["audit"])

@router.get("/", response_model=PaginatedResponse[AuditLogRead])
def read_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Fetch audit logs with server-side pagination and filters.
    Only accessible by admins.
    """
    # Simple RBAC check (could be refined with PermissionGuard style)
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = db.query(
        AuditLog.id,
        AuditLog.user_id,
        AuditLog.action,
        AuditLog.target_type,
        AuditLog.target_id,
        AuditLog.details,
        AuditLog.ip_address,
        AuditLog.created_at,
        User.username.label("username")
    ).outerjoin(User, AuditLog.user_id == User.id)

    if action:
        query = query.filter(AuditLog.action == action)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    pages = (total + size - 1) // size
    skip = (page - 1) * size

    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(size).all()

    return PaginatedResponse(
        items=logs,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

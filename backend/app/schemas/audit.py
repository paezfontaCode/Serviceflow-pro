from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel

class AuditLogBase(BaseModel):
    action: str
    target_type: str
    target_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

class AuditLogRead(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

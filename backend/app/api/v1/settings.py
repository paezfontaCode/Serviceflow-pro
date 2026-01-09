from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.settings import SystemSetting
from ...schemas.settings import SystemSettingUpdate, SystemSettingRead
from ..deps import get_current_active_user

router = APIRouter(tags=["settings"])

@router.get("/", response_model=SystemSettingRead)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).first()
    if not settings:
        # Create default settings if not exists
        settings = SystemSetting()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=SystemSettingRead)
def update_settings(
    settings_in: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    settings = db.query(SystemSetting).first()
    if not settings:
        settings = SystemSetting()
        db.add(settings)
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings

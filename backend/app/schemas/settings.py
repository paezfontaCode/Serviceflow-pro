from pydantic import BaseModel
from typing import Optional

class SystemSettingBase(BaseModel):
    company_name: Optional[str] = "Serviceflow Pro"
    company_tax_id: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_logo_url: Optional[str] = None
    receipt_header: Optional[str] = None
    receipt_footer: Optional[str] = None
    receipt_show_tax: Optional[bool] = True
    default_currency: Optional[str] = "USD"
    # Integrations
    whatsapp_api_url: Optional[str] = None
    whatsapp_token: Optional[str] = None
    telegram_token: Optional[str] = None
    google_drive_folder_id: Optional[str] = None

class SystemSettingUpdate(SystemSettingBase):
    pass

class SystemSettingRead(SystemSettingBase):
    id: int

    class Config:
        from_attributes = True

from sqlalchemy import Column, Integer, String, Text, Boolean
from .base import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Company Info
    company_name = Column(String(200), default="Serviceflow Pro")
    company_tax_id = Column(String(50))
    company_address = Column(Text)
    company_phone = Column(String(50))
    company_email = Column(String(100))
    company_logo_url = Column(Text) # Base64 or URL
    
    # Receipt / Invoice Configuration
    receipt_header = Column(Text)
    receipt_footer = Column(Text)
    receipt_show_tax = Column(Boolean, default=True)
    
    # Currency Settings
    default_currency = Column(String(3), default="USD")
    
    # Integrations
    whatsapp_api_url = Column(Text)
    whatsapp_token = Column(Text)
    telegram_token = Column(Text)
    google_drive_folder_id = Column(String(100))
    
    # Other settings can be added here
    is_active = Column(Boolean, default=True)

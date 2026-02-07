import httpx
import re
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from ..models.finance import ExchangeRate
from ..core.cache import cache
import logging

logger = logging.getLogger(__name__)

class CurrencyService:
    BCV_URL = "https://www.bcv.org.ve/"
    
    @classmethod
    async def fetch_bcv_rate(cls) -> Decimal:
        """Fetch the official USD/VES rate from BCV website."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                response = await client.get(cls.BCV_URL)
                response.raise_for_status()
                
                # Regex to find the dollar rate in the BCV page
                # The BCV page has something like: <div id="dolar"> <strong> 36,5432 </strong> </div>
                match = re.search(r'id="dolar".*?<strong>\s*([\d,.]+)\s*</strong>', response.text, re.DOTALL)
                if match:
                    rate_str = match.group(1).replace(',', '.')
                    return Decimal(rate_str)
                
                logger.error("Could not find dollar rate in BCV response")
                return None
        except Exception as e:
            logger.error(f"Error fetching BCV rate: {e}")
            return None

    @classmethod
    async def update_official_rate(cls, db: Session):
        """Fetch and update the official rate in the database."""
        rate = await cls.fetch_bcv_rate()
        if not rate:
            return None
        
        today = date.today()
        # Check if rate for today exists
        existing = db.query(ExchangeRate).filter(ExchangeRate.effective_date == today).first()
        
        if existing:
            existing.rate = rate
            existing.source = "BCV (Auto)"
        else:
            # Deactivate current
            db.query(ExchangeRate).filter(ExchangeRate.is_active == True).update({"is_active": False})
            
            new_rate = ExchangeRate(
                rate=rate,
                source="BCV (Auto)",
                effective_date=today,
                is_active=True
            )
            db.add(new_rate)
        
        db.commit()
        # Clear cache
        cache.delete("current_exchange_rate")
        return rate


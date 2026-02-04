from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    commands = [
        # Columns for cash_sessions
        "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS opening_amount_ves DECIMAL(20, 2) DEFAULT 0",
        "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS expected_amount_ves DECIMAL(20, 2) DEFAULT 0",
        "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS actual_amount_ves DECIMAL(20, 2)",
        "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS shortage_ves DECIMAL(20, 2) DEFAULT 0",
        "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS overage_ves DECIMAL(20, 2) DEFAULT 0",
        
        # Currency columns for various tables
        "ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'",
        "ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'",
        "ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'"
    ]
    
    with engine.connect() as conn:
        for cmd in commands:
            try:
                logger.info(f"Executing: {cmd}")
                conn.execute(text(cmd))
                conn.commit()
                logger.info("Success")
            except Exception as e:
                logger.error(f"Failed: {e}")
                conn.rollback()

if __name__ == "__main__":
    migrate()

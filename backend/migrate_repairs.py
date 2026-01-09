from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    commands = [
        # Columns for repairs
        "ALTER TABLE repairs ADD COLUMN repair_type VARCHAR(20) DEFAULT 'service'",
        "ALTER TABLE repairs ADD COLUMN labor_cost_usd DECIMAL(10, 2) DEFAULT 0",
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

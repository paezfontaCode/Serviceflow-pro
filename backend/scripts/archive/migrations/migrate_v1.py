from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    commands = [
        "ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_rate_at_time DECIMAL(18, 6)",
        "ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS exchange_rate_at_time DECIMAL(18, 6)",
        "ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS unit_cost_usd DECIMAL(10, 2) DEFAULT 0",
    ]
    
    with engine.connect() as conn:
        print("Checking for new columns...")
        for cmd in commands:
            try:
                logger.info(f"Executing: {cmd}")
                conn.execute(text(cmd))
                conn.commit()
            except Exception as e:
                logger.error(f"Failed to execute {cmd}: {e}")
                conn.rollback()

        # Update unit_cost_usd from products if it was just added or is 0
        try:
            logger.info("Updating unit_cost_usd from products...")
            conn.execute(text("""
                UPDATE sale_items 
                SET unit_cost_usd = products.cost_usd 
                FROM products 
                WHERE products.id = sale_items.product_id 
                AND (sale_items.unit_cost_usd = 0 OR sale_items.unit_cost_usd IS NULL)
            """))
            conn.commit()
        except Exception as e:
            logger.error(f"Failed to update unit_cost_usd: {e}")
            conn.rollback()

        # Note: Historical rate updates for a clean DB will do nothing, 
        # but the logic is kept for future-proofing or if data exists.
        
        print("Updating historical rates for sales...")
        try:
            # Postgres compatible version of the historical update
            # This is complex to do in pure SQL for all cases, but we can do a simplified version
            conn.execute(text("""
                UPDATE sales 
                SET exchange_rate_at_time = er.rate 
                FROM exchange_rates er 
                WHERE sales.exchange_rate_at_time IS NULL 
                AND er.effective_date <= CAST(sales.created_at AS DATE)
                AND er.id = (
                    SELECT id FROM exchange_rates 
                    WHERE effective_date <= CAST(sales.created_at AS DATE) 
                    ORDER BY effective_date DESC LIMIT 1
                )
            """))
            conn.commit()
        except Exception as e:
            logger.error(f"Failed to update historical rates for sales: {e}")
            conn.rollback()

    print("Migration completed.")

if __name__ == "__main__":
    migrate()

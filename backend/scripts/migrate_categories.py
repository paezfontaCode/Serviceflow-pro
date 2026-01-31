from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    print("Migrating categories...")
    with engine.connect() as conn:
        try:
            # 1. Add column if not exists
            logger.info("Adding 'type' column to categories table...")
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'physical'"))
            conn.commit()
            
            # 2. Update existing categories
            logger.info("Updating existing categories...")
            
            # Service categories
            service_cats = ['Software', 'Hardware', 'Servicios']
            for cat in service_cats:
                conn.execute(text(f"UPDATE categories SET type = 'service' WHERE name = '{cat}'"))
            
            # Physical categories (just to be sure, though default is physical)
            physical_cats = ['Accesorios', 'Repuestos']
            for cat in physical_cats:
                conn.execute(text(f"UPDATE categories SET type = 'physical' WHERE name = '{cat}'"))
                
            conn.commit()
            print("Categories migrated successfully.")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()

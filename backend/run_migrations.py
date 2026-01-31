import logging
import sys
import os

# Add the root app directory to path if needed (PYTHONPATH should handle this in Docker)
# but for local execution flexibility:
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scripts import init_db, migrate_v1, migrate_db, migrate_repairs

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run_migrations")

def run_all():
    logger.info("🚀 Starting database maintenance sequence...")
    
    tasks = [
        ("Base Structure (init_db)", init_db.init_db),
        ("Migration v1 (Postgres)", migrate_v1.migrate),
        ("Migration Finance (migrate_db)", migrate_db.migrate),
        ("Migration Repairs (migrate_repairs)", migrate_repairs.migrate)
    ]
    
    for name, func in tasks:
        try:
            logger.info(f"Running: {name}")
            func()
            logger.info(f"Successfully completed: {name}")
        except Exception as e:
            logger.error(f"❌ Error in {name}: {e}")
            # Continue with next tasks as requested for robustness
            continue

    logger.info("✅ Database maintenance complete.")

if __name__ == "__main__":
    run_all()

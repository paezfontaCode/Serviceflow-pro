"""
ServiceFlow Pro - Run Migrations Script

Este script es el punto de entrada para ejecutar todas las operaciones
de base de datos: creación de tablas, migraciones y datos iniciales.

Uso: python run_migrations.py

Nota: Este script ahora usa el script unificado setup_database.py
"""

import logging
import sys
import os

# Add the root app directory to path for local execution
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run_migrations")


def run_all():
    """Ejecuta el script unificado de setup de base de datos."""
    logger.info("🚀 Iniciando mantenimiento de base de datos...")
    
    try:
        from scripts.setup_database import main as setup_database
        setup_database()
        logger.info("✅ Mantenimiento de base de datos completado.")
    except Exception as e:
        logger.error(f"❌ Error en setup de base de datos: {e}")
        raise


if __name__ == "__main__":
    run_all()

"""
ServiceFlow Pro - Script Unificado de Setup de Base de Datos

Este script realiza las siguientes operaciones de forma idempotente:
1. Crea todas las tablas del modelo SQLAlchemy
2. Ejecuta migraciones (ALTER TABLE IF NOT EXISTS)
3. Crea datos iniciales (roles, admin, categorías, tasa de cambio)

Uso: python scripts/setup_database.py

Nota: Este script consolida los anteriores:
- init_db.py
- init_admin.py
- migrate_db.py
- migrate_v1.py
- migrate_categories.py
- migrate_repairs.py
"""

import sys
import os

# Agregar el directorio padre al path para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.models import *  # Importa todos los modelos
from sqlalchemy import text
from passlib.context import CryptContext
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# MIGRACIONES - ALTER TABLE IF NOT EXISTS
# Todas las migraciones históricas consolidadas
# ============================================
MIGRATIONS = [
    # === Cash Sessions - soporte dual USD/VES ===
    "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS opening_amount_ves DECIMAL(20, 2) DEFAULT 0",
    "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS expected_amount_ves DECIMAL(20, 2) DEFAULT 0",
    "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS actual_amount_ves DECIMAL(20, 2)",
    "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS shortage_ves DECIMAL(20, 2) DEFAULT 0",
    "ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS overage_ves DECIMAL(20, 2) DEFAULT 0",
    
    # === Payments - currency support ===
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'",
    "ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'",
    "ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD'",
    
    # === Categories - type column for physical/service ===
    "ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'physical'",
    
    # === Repairs - type and labor cost ===
    "ALTER TABLE repairs ADD COLUMN IF NOT EXISTS repair_type VARCHAR(20) DEFAULT 'service'",
    "ALTER TABLE repairs ADD COLUMN IF NOT EXISTS labor_cost_usd DECIMAL(10, 2) DEFAULT 0",
    
    # === Sales - historical exchange rate tracking ===
    "ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_rate_at_time DECIMAL(18, 6)",
    "ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS exchange_rate_at_time DECIMAL(18, 6)",
    "ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS unit_cost_usd DECIMAL(10, 2) DEFAULT 0",
]

# Migraciones de datos (UPDATE statements)
DATA_MIGRATIONS = [
    # Actualizar categorías existentes con su tipo correcto
    ("UPDATE categories SET type = 'service' WHERE name IN ('Software', 'Hardware', 'Servicios')", "Categorías de servicio"),
    ("UPDATE categories SET type = 'physical' WHERE name IN ('Accesorios', 'Repuestos')", "Categorías físicas"),
]


def run_schema_migrations():
    """Ejecuta todas las migraciones de esquema de forma idempotente."""
    logger.info("=" * 60)
    logger.info("EJECUTANDO MIGRACIONES DE ESQUEMA")
    logger.info("=" * 60)
    
    success_count = 0
    skip_count = 0
    
    with engine.connect() as conn:
        for migration in MIGRATIONS:
            try:
                conn.execute(text(migration))
                conn.commit()
                logger.info(f"✓ {migration[:70]}...")
                success_count += 1
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    skip_count += 1
                else:
                    logger.warning(f"⚠ Migración falló: {e}")
                conn.rollback()
    
    logger.info(f"Migraciones: {success_count} aplicadas, {skip_count} ya existían")


def run_data_migrations():
    """Ejecuta migraciones de datos."""
    logger.info("=" * 60)
    logger.info("EJECUTANDO MIGRACIONES DE DATOS")
    logger.info("=" * 60)
    
    with engine.connect() as conn:
        for sql, description in DATA_MIGRATIONS:
            try:
                result = conn.execute(text(sql))
                conn.commit()
                logger.info(f"✓ {description}: {result.rowcount} filas actualizadas")
            except Exception as e:
                logger.warning(f"⚠ {description} falló: {e}")
                conn.rollback()
        
        # Migración especial: actualizar unit_cost_usd desde productos
        try:
            result = conn.execute(text("""
                UPDATE sale_items 
                SET unit_cost_usd = products.cost_usd 
                FROM products 
                WHERE products.id = sale_items.product_id 
                AND (sale_items.unit_cost_usd = 0 OR sale_items.unit_cost_usd IS NULL)
            """))
            conn.commit()
            logger.info(f"✓ unit_cost_usd actualizado: {result.rowcount} items")
        except Exception as e:
            logger.warning(f"⚠ Actualización de unit_cost_usd falló: {e}")
            conn.rollback()


def create_initial_data():
    """Crea datos iniciales si no existen."""
    from app.models.user import User, Role
    from app.models.finance import ExchangeRate
    from app.models.settings import SystemSetting
    from app.models.inventory import Category
    from datetime import date
    
    logger.info("=" * 60)
    logger.info("CREANDO DATOS INICIALES")
    logger.info("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. Roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            roles = [
                Role(name="admin", description="Administrador con acceso completo"),
                Role(name="vendedor", description="Personal de ventas"),
                Role(name="tecnico", description="Técnico de reparaciones"),
                Role(name="gerente", description="Gerente de tienda"),
            ]
            db.add_all(roles)
            db.commit()
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            logger.info("✓ Roles creados: admin, vendedor, tecnico, gerente")
        else:
            logger.info("→ Roles ya existen")
        
        # 2. Usuario Admin
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                email="admin@serviceflow.com",
                hashed_password=pwd_context.hash("admin123"),
                full_name="System Administrator",
                is_active=True
            )
            admin.roles.append(admin_role)
            db.add(admin)
            db.commit()
            logger.info("✓ Usuario admin creado (admin / admin123)")
        else:
            logger.info("→ Usuario admin ya existe")
        
        # 3. Configuración del Sistema
        if not db.query(SystemSetting).first():
            settings = SystemSetting(
                company_name="Serviceflow Pro",
                receipt_header="RIF J-00000000-0\nCalle Principal #123\nCiudad, País",
                receipt_footer="Gracias por su visita.\nGarantía de 30 días en reparaciones."
            )
            db.add(settings)
            db.commit()
            logger.info("✓ Configuración del sistema creada")
        else:
            logger.info("→ Configuración ya existe")
        
        # 4. Tasa de Cambio por defecto
        if not db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first():
            rate = ExchangeRate(
                base_currency="USD",
                target_currency="VES",
                rate=50.00,
                source="Manual",
                effective_date=date.today(),
                is_active=True
            )
            db.add(rate)
            db.commit()
            logger.info("✓ Tasa de cambio por defecto creada (1 USD = 50 VES)")
        else:
            logger.info("→ Tasa de cambio ya existe")
        
        # 5. Categorías por defecto
        if db.query(Category).count() == 0:
            categories = [
                Category(name="Repuestos", description="Componentes y partes para reparación", type="physical"),
                Category(name="Accesorios", description="Complementos para equipos y periféricos", type="physical"),
                Category(name="Software", description="Licencias y programas", type="service"),
                Category(name="Hardware", description="Equipos completos y componentes mayores", type="physical"),
                Category(name="Servicios", description="Mano de obra y servicios técnicos", type="service"),
            ]
            db.add_all(categories)
            db.commit()
            logger.info("✓ Categorías por defecto creadas (5 categorías)")
        else:
            logger.info(f"→ Categorías ya existen ({db.query(Category).count()} encontradas)")
            
    except Exception as e:
        logger.error(f"Error creando datos iniciales: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """Punto de entrada principal."""
    logger.info("")
    logger.info("=" * 60)
    logger.info("   SERVICEFLOW PRO - SETUP DE BASE DE DATOS")
    logger.info("=" * 60)
    logger.info("")
    
    try:
        # 1. Crear tablas
        logger.info("PASO 1/4: Creando tablas...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tablas creadas/verificadas")
        
        # 2. Ejecutar migraciones de esquema
        logger.info("")
        logger.info("PASO 2/4: Ejecutando migraciones de esquema...")
        run_schema_migrations()
        
        # 3. Ejecutar migraciones de datos
        logger.info("")
        logger.info("PASO 3/4: Ejecutando migraciones de datos...")
        run_data_migrations()
        
        # 4. Crear datos iniciales
        logger.info("")
        logger.info("PASO 4/4: Creando datos iniciales...")
        create_initial_data()
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("   ✅ SETUP COMPLETADO EXITOSAMENTE")
        logger.info("=" * 60)
        logger.info("")
        
    except Exception as e:
        logger.error("")
        logger.error("=" * 60)
        logger.error(f"   ❌ ERROR EN SETUP: {e}")
        logger.error("=" * 60)
        raise


if __name__ == "__main__":
    main()

from app.core.database import engine, Base, SessionLocal
from app.models import User, Role
from app.models.finance import ExchangeRate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrator with full access")
            db.add(admin_role)
            db.add(Role(name="vendedor", description="Sales personnel"))
            db.add(Role(name="tecnico", description="Repair technician"))
            db.add(Role(name="gerente", description="Store manager"))
            db.commit()
            print("Default roles created.")

        # Create admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@serviceflow.com",
                hashed_password=pwd_context.hash("admin123"),
                full_name="System Administrator",
                is_active=True
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            print("Admin user created (admin / admin123).")

        # Create default system settings
        from app.models.settings import SystemSetting
        settings = db.query(SystemSetting).first()
        if not settings:
            settings = SystemSetting(
                company_name="Serviceflow Pro",
                receipt_header="RIF J-00000000-0\nCalle Principal #123\nCiudad, Pais",
                receipt_footer="Gracias por su visita.\nGarantía de 30 días en reparaciones."
            )
            db.add(settings)
            db.commit()
            print("Default system settings created.")

        # Create default exchange rate
        default_rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
        if not default_rate:
            from datetime import date
            default_rate = ExchangeRate(
                base_currency="USD",
                target_currency="VES",
                rate=36.00,
                source="Manual",
                effective_date=date.today(),
                is_active=True
            )
            db.add(default_rate)
            db.commit()
            print("Default exchange rate created (36.00).")

        # Create default categories
        from app.models.inventory import Category
        category_count = db.query(Category).count()
        if category_count == 0:
            default_categories = [
                Category(name="Repuestos", description="Componentes y partes para reparación"),
                Category(name="Accesorios", description="Complementos para equipos y periféricos"),
                Category(name="Software", description="Licencias y programas"),
                Category(name="Hardware", description="Equipos completos y componentes mayores"),
                Category(name="Servicios", description="Mano de obra y servicios técnicos")
            ]
            db.add_all(default_categories)
            db.commit()
            print("Default categories created.")
            
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

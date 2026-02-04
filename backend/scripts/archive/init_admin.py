import sys
import os

# Add the app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, Role
from app.core.security import get_password_hash
from app.core.config import settings

def init_admin():
    db = SessionLocal()
    try:
        # 1. Ensure Admin Role Exists
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Full system access")
            db.add(admin_role)
            db.flush()
            print("Created 'admin' role.")

        # 2. Check if admin user exists
        admin_email = "admin@miempresa.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        if not admin_user:
            # We generate a random temporary password or use a default one 
            # (User should change it immediately)
            default_password = "Admin123!" 
            
            admin_user = User(
                username="admin",
                email=admin_email,
                full_name="System Administrator",
                hashed_password=get_password_hash(default_password),
                is_active=True
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            print(f"User '{admin_email}' created successfully.")
            print(f"Temporary password: {default_password}")
        else:
            print(f"User '{admin_email}' already exists.")
            
    except Exception as e:
        print(f"Error initializing admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()

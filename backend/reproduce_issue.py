
import sys
import os
import traceback
from sqlalchemy import text

# Add backend to path
sys.path.append("c:\\Users\\Usuario\\Desktop\\Serviceflow-pro\\backend")

# Force localhost for DB URL since we are running locally
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/serviceflow"
os.environ["POSTGRES_USER"] = "postgres"
os.environ["POSTGRES_PASSWORD"] = "postgres"
os.environ["POSTGRES_DB"] = "serviceflow"

from app.core.database import SessionLocal
from app.api.v1.inventory import create_product
from app.schemas.inventory import ProductCreate

def mock_get_current_active_user():
    return type('User', (), {'id': 1, 'is_active': True, 'role': 'admin'})

def reproduce():
    print(f"Connecting to DB: {os.environ['DATABASE_URL']}")
    db = SessionLocal()
    try:
        # Test connection
        db.execute(text("SELECT 1"))
        print("DB Connection successful.")
    except Exception as e:
        print(f"Failed to connect to DB: {e}")
        db.close()
        return

    try:
        current_user = mock_get_current_active_user()
        
        # Scenario: "accesorios"
        from app.models.inventory import Category
        # Check if category exists or create it
        cat = db.query(Category).filter(Category.name.ilike("%accesorios%")).first()
        if cat:
            print(f"Found category: {cat.name} ID: {cat.id}")
            cat_id = cat.id
        else:
            print("Category 'accesorios' not found. Creating one...")
            new_cat = Category(name="Accesorios")
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)
            cat_id = new_cat.id
            print(f"Created category ID: {cat_id}")

        # Unique SKU
        import uuid
        sku = f"ACC-{uuid.uuid4().hex[:6]}"
        
        product_in = ProductCreate(
            sku=sku,
            name="Producto Test Accesorios",
            price_usd=10.0,
            cost_usd=5.0,
            category_id=cat_id,
            inventory_quantity=10,
            brand="Generic",
            model="Model X"
        )
        
        print(f"Attempting to create product with SKU {sku}...")
        result = create_product(product_in=product_in, db=db, current_user=current_user)
        print("Success:", result.id, result.name)

    except Exception as e:
        print("\n!!! CAUGHT EXCEPTION !!!")
        traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    reproduce()

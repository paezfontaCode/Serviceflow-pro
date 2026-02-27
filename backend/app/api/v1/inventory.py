from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List
import csv
import io
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from ...core.database import get_db
from ...models.inventory import Product, Category, Inventory
from ...schemas.inventory import (
    ProductCreate, ProductRead, ProductUpdate,
    CategoryRead, CategoryCreate, CategoryUpdate,
    InventoryRead, StockAdjustment
)
from ..deps import get_current_active_user
from ...services.audit_service import AuditService

router = APIRouter(tags=["inventory"])

from ...schemas.common import PaginatedResponse

@router.get("/products", response_model=PaginatedResponse[ProductRead])
def read_products(
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    search: str = None,
    category_id: int = None,
    in_stock: bool = None
):
    query = db.query(Product).options(joinedload(Product.inventory)).filter(Product.is_active == True)
    
    # Search by name, sku, brand, or model
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_filter)) |
            (Product.sku.ilike(search_filter)) |
            (Product.brand.ilike(search_filter)) |
            (Product.model.ilike(search_filter))
        )
    
    # Filter by category
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    # Filter by stock availability
    if in_stock is not None:
        query = query.join(Inventory)
        if in_stock:
            query = query.filter(Inventory.quantity > 0)
        else:
            query = query.filter(Inventory.quantity == 0)
    
    total = query.count()
    pages = (total + size - 1) // size
    skip = (page - 1) * size
    
    products = query.offset(skip).limit(size).all()
    
    return PaginatedResponse(
        items=products,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.post("/products", response_model=ProductRead)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    print(f"DEBUG: Starting create_product with: {product_in}")
    # Check if SKU exists
    if product_in.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="Un producto con este SKU ya existe.")

    # Extract inventory_quantity separately as it's not a field on the Product model
    product_data = product_in.model_dump()
    
    # Logic to determine initial stock: 
    # 1. 'inventory_quantity' (from frontend payload)
    # 2. 'initial_stock' (from schema default or direct use)
    inv_qty = product_data.pop("inventory_quantity", None)
    init_stock = product_data.pop("initial_stock", 0)
    
    # Use inventory_quantity if provided (and not None), otherwise fallback to initial_stock
    # Note: frontend sends 0 when empty/default, which is falsy but valid stock. 
    # But product_in default for inventory_quantity is None.
    inventory_quantity = inv_qty if inv_qty is not None else init_stock
        
    print(f"DEBUG: product_data keys after pop: {product_data.keys()}")

    # Create product
    try:
        if product_in.category_id:
             category = db.query(Category).filter(Category.id == product_in.category_id).first()
             if not category:
                 raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

        # Ensure empty SKU is treated as None to avoid unique constraint violation on empty strings
        if "sku" in product_data and not product_data["sku"]:
            product_data["sku"] = None

        db_product = Product(**product_data)
        db.add(db_product)
        db.flush() # Get product ID
        
        # Automatically create inventory record
        db_inventory = Inventory(product_id=db_product.id, quantity=inventory_quantity)
        db.add(db_inventory)
        
        db.commit()
        db.refresh(db_product)
        return db_product
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        import traceback
        tb_str = traceback.format_exc()
        print(f"DEBUG: 500 Error Traceback: {tb_str}")
        raise HTTPException(status_code=500, detail=f"Error al crear producto: {str(e)} | Details: {tb_str[:200]}")

@router.get("/categories", response_model=List[CategoryRead])
def read_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    type: str = "physical" # Filter by type, default to physical for inventory context
):
    query = db.query(Category).filter(Category.is_active == True)
    if type:
        query = query.filter(Category.type == type)
    return query.all()

@router.get("/products/{product_id}", response_model=ProductRead)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar SKU único si cambió
    if product_in.sku and product_in.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este SKU ya está en uso.")
    
    # 1. Separar la cantidad del resto de los datos
    update_data = product_in.model_dump(exclude_unset=True)
    inventory_quantity = update_data.pop("inventory_quantity", None)
    
    # 2. Actualizar datos básicos del producto (nombre, precio, etc.)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    # 3. ACTUALIZAR EL STOCK (La parte que faltaba)
    if inventory_quantity is not None:
        inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if inventory:
            inventory.quantity = inventory_quantity
        else:
            # Si por algún error el producto no tenía registro de inventario, lo creamos
            new_inventory = Inventory(product_id=product.id, quantity=inventory_quantity)
            db.add(new_inventory)
    
    # Audit logging for cost/price changes
    details = {}
    if product_in.cost_usd is not None:
        details["cost_usd"] = float(product_in.cost_usd)
    if product_in.price_usd is not None:
        details["price_usd"] = float(product_in.price_usd)
    
    if details:
        AuditService.log_action(
            db, 
            user_id=current_user.id, 
            action="UPDATE_COST_PRICE",
            target_type="PRODUCT",
            target_id=product.id,
            details=details
        )

    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Soft delete by setting is_active to False
    product.is_active = False
    
    AuditService.log_action(
        db,
        user_id=current_user.id,
        action="DELETE_PRODUCT",
        target_type="PRODUCT",
        target_id=product_id,
        details={"name": product.name, "sku": product.sku}
    )
    
    db.commit()
    return {"message": "Producto desactivado correctamente"}

@router.post("/products/{product_id}/adjust-stock")
def adjust_stock(
    product_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...schemas.inventory import StockAdjustment
    from ...models.inventory import InventoryLog
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    
    # Store old quantity for logging
    old_quantity = inventory.quantity
    
    # Adjust quantity
    new_quantity = inventory.quantity + adjustment.quantity
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    inventory.quantity = new_quantity
    
    # Create inventory log for audit trail
    log = InventoryLog(
        inventory_id=inventory.id,
        product_id=product_id,
        user_id=current_user.id,
        old_quantity=old_quantity,
        new_quantity=new_quantity,
        adjustment=adjustment.quantity,
        reason=adjustment.reason
    )
    db.add(log)
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "message": "Stock adjusted successfully",
        "product_id": product_id,
        "old_quantity": old_quantity,
        "new_quantity": new_quantity,
        "adjustment": adjustment.quantity,
        "logged": True
    }

@router.post("/categories", response_model=CategoryRead)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...schemas.inventory import CategoryCreate
    
    db_category = Category(**category_in.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ...schemas.inventory import CategoryUpdate
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category

@router.get("/export-csv")
def export_products_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "sku", "name", "price_usd", "cost_usd", 
        "brand", "model", "category", "quantity"
    ])
    
    products = db.query(Product).filter(Product.is_active == True).all()
    
    for p in products:
        inventory = db.query(Inventory).filter(Inventory.product_id == p.id).first()
        quantity = inventory.quantity if inventory else 0
        category_name = p.category.name if p.category else ""
        
        writer.writerow([
            p.sku or "", p.name, 
            float(p.price_usd), float(p.cost_usd),
            p.brand or "", p.model or "", category_name, quantity
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"}
    )

@router.post("/import-csv")
async def import_products_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    import pandas as pd
    
    # Check extension
    is_excel = file.filename.endswith(('.xlsx', '.xls'))
    is_csv = file.filename.endswith('.csv')
    
    if not (is_excel or is_csv):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV o Excel (.xlsx)")
    
    contents = await file.read()
    
    try:
        if is_excel:
            df = pd.read_excel(io.BytesIO(contents))
        else:
            # Handle CSV with potential encoding issues
            try:
                decoded = contents.decode('utf-8')
            except UnicodeDecodeError:
                decoded = contents.decode('latin-1')
            
            # Detect delimiter
            delimiter = ','
            if ';' in decoded and decoded.count(';') > decoded.count(','):
                delimiter = ';'
            
            df = pd.read_csv(io.StringIO(decoded), sep=delimiter)
        
        # Clean columns: strip, lower, remove BOM
        df.columns = [
            str(c).strip().lower().replace('ï»¿', '') 
            for c in df.columns
        ]
        
        # Check requirements
        required_cols = {'sku', 'name'}
        if not required_cols.issubset(set(df.columns)):
            missing = required_cols - set(df.columns)
            raise HTTPException(
                status_code=400, 
                detail=f"Faltan columnas requeridas: {', '.join(missing)}. Columnas encontradas: {list(df.columns)}"
            )
            
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=f"Error al procesar el archivo: {str(e)}")

    stats = {"created": 0, "updated": 0, "errors": 0}
    
    # Iterate through dataframe
    for _, row in df.iterrows():
        try:
            # Basic validation
            sku_raw = str(row.get('sku', '')).strip()
            sku = sku_raw if sku_raw and sku_raw.lower() != 'nan' else None
            
            name = str(row.get('name', '')).strip()
            if not name or name.lower() == 'nan':
                if not sku: continue # Empty row
                
            # Helper to safely parse numbers from pandas
            def safe_float(val, default=0.0):
                try:
                    if pd.isna(val): return default
                    return float(val)
                except:
                    return default

            price_usd = Decimal(str(safe_float(row.get('price_usd', 0.0))))
            cost_usd = Decimal(str(safe_float(row.get('cost_usd', 0.0))))
            quantity = int(safe_float(row.get('quantity', 0.0)))
            
            with db.begin_nested():
                # Category logic
                category_id = None
                cat_name = str(row.get('category', '')).strip()
                if cat_name and cat_name.lower() != 'nan':
                    category = db.query(Category).filter(Category.name.ilike(cat_name)).first()
                    if not category:
                        category = Category(name=cat_name)
                        db.add(category)
                        db.flush()
                    category_id = category.id

                # Find product
                existing_product = None
                if sku:
                    existing_product = db.query(Product).filter(Product.sku == sku).first()
                
                if existing_product:
                    # Update
                    if name and name.lower() != 'nan':
                        existing_product.name = name
                    existing_product.price_usd = price_usd
                    existing_product.cost_usd = cost_usd
                    
                    brand = str(row.get('brand', '')).strip()
                    if brand and brand.lower() != 'nan':
                        existing_product.brand = brand
                        
                    model = str(row.get('model', '')).strip()
                    if model and model.lower() != 'nan':
                        existing_product.model = model
                        
                    if category_id:
                        existing_product.category_id = category_id
                    existing_product.is_active = True
                    
                    # Inventory
                    inv_record = db.query(Inventory).filter(Inventory.product_id == existing_product.id).first()
                    if inv_record:
                        inv_record.quantity = quantity
                    stats["updated"] += 1
                elif name and name.lower() != 'nan':
                    # Create
                    new_product = Product(
                        sku=sku,
                        name=name,
                        price_usd=price_usd,
                        cost_usd=cost_usd,
                        brand=str(row.get('brand', '')).strip() if str(row.get('brand', '')).lower() != 'nan' else None,
                        model=str(row.get('model', '')).strip() if str(row.get('model', '')).lower() != 'nan' else None,
                        category_id=category_id
                    )
                    db.add(new_product)
                    db.flush()
                    
                    new_inventory = Inventory(product_id=new_product.id, quantity=quantity)
                    db.add(new_inventory)
                    stats["created"] += 1
                else:
                    stats["errors"] += 1
                    
        except Exception as e:
            print(f"Error importing row: {e}")
            stats["errors"] += 1
            db.rollback()
            continue
            
    db.commit()
    return stats

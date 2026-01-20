import sqlite3
from datetime import datetime
import os

def migrate():
    db_path = "backend/serviceflow.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Checking for new columns...")
    
    # Add exchange_rate_at_time to sales
    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN exchange_rate_at_time DECIMAL(18, 6)")
        print("Added exchange_rate_at_time to sales table.")
    except sqlite3.OperationalError:
        print("Column exchange_rate_at_time already exists in sales table.")

    # Add exchange_rate_at_time to accounts_receivable
    try:
        cursor.execute("ALTER TABLE accounts_receivable ADD COLUMN exchange_rate_at_time DECIMAL(18, 6)")
        print("Added exchange_rate_at_time to accounts_receivable table.")
    except sqlite3.OperationalError:
        print("Column exchange_rate_at_time already exists in accounts_receivable table.")

    # Add unit_cost_usd to sale_items
    try:
        cursor.execute("ALTER TABLE sale_items ADD COLUMN unit_cost_usd DECIMAL(10, 2) DEFAULT 0")
        print("Added unit_cost_usd to sale_items table.")
        
        # Populate with current costs from products as fallback
        cursor.execute("""
            UPDATE sale_items 
            SET unit_cost_usd = (SELECT cost_usd FROM products WHERE products.id = sale_items.product_id)
            WHERE unit_cost_usd = 0 OR unit_cost_usd IS NULL
        """)
    except sqlite3.OperationalError:
        print("Column unit_cost_usd already exists in sale_items table.")

    # Create expense tables if they don't exist
    # Note: Base.metadata.create_all from init_db.py could also do this, but let's be safe
    
    print("Updating historical rates for sales...")
    cursor.execute("SELECT id, created_at, exchange_rate FROM sales WHERE exchange_rate_at_time IS NULL")
    sales = cursor.fetchall()
    
    for sale_id, created_at, current_rate in sales:
        # Try to find the rate for that date
        sale_date = created_at.split(' ')[0] if created_at else None
        if sale_date:
            cursor.execute("SELECT rate FROM exchange_rates WHERE effective_date <= ? ORDER BY effective_date DESC LIMIT 1", (sale_date,))
            rate_row = cursor.fetchone()
            if rate_row:
                historical_rate = rate_row[0]
                cursor.execute("UPDATE sales SET exchange_rate_at_time = ? WHERE id = ?", (historical_rate, sale_id))
            else:
                # If no historical rate found, use the current one in the sale as fallback
                cursor.execute("UPDATE sales SET exchange_rate_at_time = ? WHERE id = ?", (current_rate, sale_id))

    print("Updating historical rates for accounts_receivable...")
    cursor.execute("SELECT id, created_at FROM accounts_receivable WHERE exchange_rate_at_time IS NULL")
    ars = cursor.fetchall()
    
    for ar_id, created_at in ars:
        ar_date = created_at.split(' ')[0] if created_at else None
        if ar_date:
            cursor.execute("SELECT rate FROM exchange_rates WHERE effective_date <= ? ORDER BY effective_date DESC LIMIT 1", (ar_date,))
            rate_row = cursor.fetchone()
            if rate_row:
                historical_rate = rate_row[0]
                cursor.execute("UPDATE accounts_receivable SET exchange_rate_at_time = ? WHERE id = ?", (historical_rate, ar_id))
            else:
                # Fallback to current rate from latest exchange_rates
                cursor.execute("SELECT rate FROM exchange_rates WHERE is_active = 1 ORDER BY effective_date DESC LIMIT 1")
                rate_row = cursor.fetchone()
                if rate_row:
                    cursor.execute("UPDATE accounts_receivable SET exchange_rate_at_time = ? WHERE id = ?", (rate_row[0], ar_id))

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()

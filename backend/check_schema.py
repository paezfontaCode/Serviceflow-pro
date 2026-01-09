from app.core.database import engine
from sqlalchemy import inspect
import json

def check_schema():
    inspector = inspect(engine)
    schema = {}
    for table_name in inspector.get_table_names():
        schema[table_name] = [c['name'] for c in inspector.get_columns(table_name)]
    
    with open("schema_dump.json", "w") as f:
        json.dump(schema, f, indent=2)

if __name__ == "__main__":
    check_schema()

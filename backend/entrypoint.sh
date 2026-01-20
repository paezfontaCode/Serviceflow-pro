#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
# Assuming we use init_db.py for initial setup if needed or alembic if configured.
# Given the user has init_db.py and migrate_db.py, we should ensure the DB is ready.
# init_db.py uses create_all() which scares me for production if tables exist, but SQLAlchemy handles that gracefully usually.
# However, migrate_db.py handles manual alters.

# For now, let's run init_db.py to ensure tables exist
python init_db.py

# And migrate_db.py for the specific column additions
python migrate_db.py

# Start the server
echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

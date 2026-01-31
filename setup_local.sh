#!/bin/bash

# ServiceFlow Pro - Local Setup Script
# This script sets up the local development environment for Backend and Frontend.

set -e  # Exit immediately if a command exits with a non-zero status.

echo "🚀 Starting ServiceFlow Pro Local Setup..."

# --- Configuration ---
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# --- 1. Environment Configuration ---
echo ""
echo "🔧 Configuring Environment Variables..."
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "   Creating .env file from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    
    # Update DATABASE_URL for local execution (replace 'db' with 'localhost')
    # We use a temporary file for compatibility with different sed versions
    sed 's/@db:5432/@localhost:5432/g' "$PROJECT_ROOT/.env" > "$PROJECT_ROOT/.env.tmp" && mv "$PROJECT_ROOT/.env.tmp" "$PROJECT_ROOT/.env"
    
    echo "   ✅ .env created and configured for local use (localhost)."
else
    echo "   ℹ️  .env file already exists. Skipping creation."
fi

# --- 2. Backend Setup ---
echo ""
echo "🐍 Setting up Backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

echo "   Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "   Running database migrations..."
# Check if Postgres is running locally (basic check)
if ! pg_isready -h localhost > /dev/null 2>&1; then
    echo "   ⚠️  WARNING: PostgreSQL does not seem to be running on localhost:5432."
    echo "       Please ensure your local Postgres database is started."
else
    # Run the migration script
    python run_migrations.py
fi

deactivate
cd "$PROJECT_ROOT"
echo "   ✅ Backend setup complete."

# --- 3. Frontend Setup ---
echo ""
echo "⚛️  Setting up Frontend..."
cd "$FRONTEND_DIR"

echo "   Installing Node.js dependencies..."
npm install

cd "$PROJECT_ROOT"
echo "   ✅ Frontend setup complete."

echo ""
echo "🎉 Setup Finished Successfully!"
echo "To start the application, run: ./start_local.sh"

#!/bin/bash

# ServiceFlow Pro - Local Run Script
# Starts both Backend and Frontend servers.

# Function to kill child processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT

PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Starting ServiceFlow Pro Locally..."

# Check env
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ .env file missing! Please run ./setup_local.sh first."
    exit 1
fi

# Start Backend
echo "🐍 Starting Backend Server (http://localhost:8000)..."
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Start Frontend
echo "⚛️  Starting Frontend Server..."
cd "$FRONTEND_DIR"
npm run dev -- --host &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

echo ""
echo "✅ servers are running!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   Press Ctrl+C to stop both."
echo ""

# Wait for processes
wait

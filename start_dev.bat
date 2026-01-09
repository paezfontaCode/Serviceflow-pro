@echo off
echo ===================================================
echo   ServiceFlow Pro - Starting Local Environment
echo ===================================================

echo [1/2] Launching Backend Server (Port 8000)...
start "ServiceFlow Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend Server (Port 3000)...
start "ServiceFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Success! Both servers are starting in new windows.
echo - Backend API: http://localhost:8000/docs
echo - Frontend App: http://localhost:3000
echo.
pause

@echo off
echo ========================================
echo   Sentinel Shield - Starting Services
echo ========================================
echo.

echo [1/2] Starting Backend Server (Flask)...
start "Sentinel Shield Backend" cmd /k "cd backend && python app.py"

timeout /t 3 >nul

echo [2/2] Starting Frontend Server (Vite)...
start "Sentinel Shield Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both services are starting...
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq Sentinel Shield Backend*" /T /F
taskkill /FI "WindowTitle eq Sentinel Shield Frontend*" /T /F

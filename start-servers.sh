#!/bin/bash

echo "========================================"
echo "  Sentinel Shield - Starting Services"
echo "========================================"
echo ""

echo "[1/2] Starting Backend Server (Flask)..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

sleep 3

echo "[2/2] Starting Frontend Server (Vite)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Both services are running..."
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services..."

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait

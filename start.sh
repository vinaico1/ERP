#!/bin/bash
# Script para iniciar o ERP

echo "========================================="
echo "  Iniciando ERP Corporativo"
echo "========================================="

# Start backend in background
echo ""
echo "[1/2] Iniciando Backend (porta 3001)..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "[2/2] Iniciando Frontend (porta 5173)..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  ERP rodando!"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "  Login: admin@erp.com / admin123"
echo "========================================="
echo ""
echo "Pressione Ctrl+C para parar..."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Parando servidores...'; exit" INT TERM
wait

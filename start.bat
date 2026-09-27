@echo off
echo Starting SHMAGH Backend (FastAPI)...
start cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo Starting SHMAGH Frontend (HTTP Server)...
start cmd /k "cd frontend && python -m http.server 3000"

echo Both servers are starting! 
echo Frontend will be available at http://localhost:3000
echo Backend will be available at http://localhost:8000

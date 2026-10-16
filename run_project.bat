@echo off
title AI-Powered Humanoid Virtual Interviewer Launcher
echo ======================================================================
echo    AI-POWERED HUMANOID VIRTUAL INTERVIEWER
echo    Autonomous Candidate Assessment Platform
echo ======================================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
echo       (Automatically launches Cloudflare Public HTTPS Tunnel in background!)
start "AI Interviewer Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting React + Vite Frontend on http://localhost:5174 ...
start "AI Interviewer Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5174"

echo.
echo Both servers are launching!
echo - Localhost Frontend: http://localhost:5174
echo - Backend API Docs:   http://127.0.0.1:8000/docs
echo - Cloudflare Public:  Automatically generated from localhost! (Saved to tunnel_url.txt)
echo.
echo Demo Accounts:
echo - Candidate: candidate@interviewer.ai / Candidate@12345
echo - Admin: admin@interviewer.ai / Admin@12345
echo.
pause

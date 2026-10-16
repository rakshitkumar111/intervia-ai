@echo off
title AI Interviewer - Cloudflare Public HTTPS Tunnel
echo ======================================================================
echo    AI INTERVIEWER - PUBLIC HTTPS TUNNEL FOR MOBILE / REMOTE DEVICES
echo ======================================================================
echo.
echo Starting secure Cloudflare Tunnel for http://localhost:5174 ...
echo Once started, copy the generated https://*.trycloudflare.com link.
echo That HTTPS link can be opened on ANY mobile phone, tablet, or PC worldwide!
echo.
echo Press Ctrl+C anytime to stop the tunnel.
echo ======================================================================
echo.

if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --protocol http2 --url http://localhost:5174
) else (
    cloudflared tunnel --protocol http2 --url http://localhost:5174
)

pause

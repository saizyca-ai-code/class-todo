@echo off
title MEGA CLONE - 2D Web Game Launcher
cd /d "%~dp0"

echo ========================================================
echo   Starting MEGA CLONE 2D Web Game Server...
echo ========================================================
echo.
echo [1/2] Opening browser at http://localhost:3000 ...
timeout /t 1 /nobreak >nul
start http://localhost:3000

echo [2/2] Running local web server (npx serve)...
echo Press Ctrl+C in this window to stop the server.
echo.

npx serve -l 3000 .
pause

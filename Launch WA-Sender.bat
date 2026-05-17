@echo off
title WA-Sender
cd /d "%~dp0"
echo Starting WA-Sender...
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies, please wait...
    call npm install
    echo.
)

:: Start the backend server in background
echo Starting backend server...
start /b node server/server.cjs

:: Wait a moment for server to start
timeout /t 2 /nobreak >nul

:: Start the Electron app
echo Launching WA-Sender...
call npx electron .

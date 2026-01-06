@echo off
echo ========================================
echo   Alpaca Trading Bot
echo ========================================
echo.
echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.
echo Starting trading bot...
echo.
npm start

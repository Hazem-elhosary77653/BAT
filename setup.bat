@echo off
REM Business Analyst Assistant Tool - Quick Start Script (Windows)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Business Analyst Assistant Tool - Quick Start             ║
echo ║  SQLite Edition (No Docker Required)                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Backend Setup
echo ═══════════════════════════════════════════════════════════════
echo 📦 Setting up Backend...
echo ═══════════════════════════════════════════════════════════════

cd backend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📥 Installing backend dependencies... ^(this may take a minute^)
    call npm install
    if errorlevel 1 (
        echo ❌ Backend installation failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed
)

REM Check if database exists
if not exist "database.db" (
    echo 🗄️  Creating SQLite database...
    call npm run migrate-sqlite
    if errorlevel 1 (
        echo ❌ Database migration failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Database already exists
)

echo ✅ Backend ready!
echo.

REM Frontend Setup
echo ═══════════════════════════════════════════════════════════════
echo 📦 Setting up Frontend...
echo ═══════════════════════════════════════════════════════════════

cd ..\frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📥 Installing frontend dependencies... ^(this may take a minute^)
    call npm install
    if errorlevel 1 (
        echo ❌ Frontend installation failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)

echo ✅ Frontend ready!
echo.

REM Display startup instructions
echo ═══════════════════════════════════════════════════════════════
echo 🚀 Ready to Start!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Run these commands in separate terminals:
echo.
echo 📍 Terminal 1 - Backend Server:
echo    cd backend
echo    npm run dev
echo.
echo 📍 Terminal 2 - Frontend Server:
echo    cd frontend
echo    npm run dev
echo.
echo 📍 Terminal 3 - Open Browser:
echo    http://localhost:3000
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🔐 Test Credentials:
echo    Email: admin@example.com
echo    Password: password123
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo ✨ Setup complete! Your database is: backend\database.db
echo.
pause

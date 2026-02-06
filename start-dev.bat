@echo off
REM ========================================
REM Business Analyst Tool - Quick Start
REM ========================================

echo.
echo 🚀 Business Analyst Assistant Tool - Launcher
echo.

REM Colors
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

REM Check if Node.js is installed
echo %YELLOW%Checking for Node.js...%NC%
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Node.js is not installed!%NC%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo %GREEN%✅ Node.js found: %
node --version
echo.

REM Kill existing node processes
echo %YELLOW%Stopping any existing processes...%NC%
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 >nul

REM Check if backend dependencies are installed
echo %YELLOW%Checking backend dependencies...%NC%
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)
echo %GREEN%✅ Backend dependencies ready%NC%
echo.

REM Check if frontend dependencies are installed
echo %YELLOW%Checking frontend dependencies...%NC%
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)
echo %GREEN%✅ Frontend dependencies ready%NC%
echo.

REM Start services
echo %YELLOW%Starting services...%NC%
echo.

echo %GREEN%📱 Opening new terminals for services...%NC%
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && npm run dev"
echo %GREEN%✅ Backend starting on http://localhost:3001%NC%

REM Wait a bit for backend to start
timeout /t 3 >nul

REM Start frontend in new window
start "Frontend App" cmd /k "cd frontend && npm run dev"
echo %GREEN%✅ Frontend starting on http://localhost:3000%NC%

echo.
echo %GREEN%================================================%NC%
echo %GREEN%✅ Services are starting!%NC%
echo %GREEN%================================================%NC%
echo.
echo 📍 Backend:  http://localhost:3001
echo 📍 Frontend: http://localhost:3000
echo 📡 WebSocket: ws://localhost:3001/socket.io/
echo.
echo 💡 You can close the launcher window now.
echo 💡 Both services will continue running in separate windows.
echo.
pause

#!/usr/bin/env pwsh

#========================================
# Business Analyst Tool - Quick Start
#========================================

Write-Host ""
Write-Host "🚀 Business Analyst Assistant Tool - Launcher" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Kill existing node processes
Write-Host "Stopping any existing processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Write-Host ""

# Check if backend dependencies are installed
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}
Write-Host "✅ Backend dependencies ready" -ForegroundColor Green
Write-Host ""

# Check if frontend dependencies are installed
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}
Write-Host "✅ Frontend dependencies ready" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 Opening new terminals for services..." -ForegroundColor Green
Write-Host ""

# Function to start a service in a new PowerShell window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Directory,
        [string]$Command,
        [string]$Url
    )
    
    $PSScriptBlock = {
        param($Dir, $Cmd)
        Set-Location $Dir
        Invoke-Expression $Cmd
    }
    
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$Directory'; $Command" -WindowStyle Normal
    Write-Host "✅ $ServiceName starting on $Url" -ForegroundColor Green
}

# Start backend
Start-Service -ServiceName "Backend Server" -Directory "$PSScriptRoot/backend" -Command "npm run dev" -Url "http://localhost:3001"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
Start-Service -ServiceName "Frontend App" -Directory "$PSScriptRoot/frontend" -Command "npm run dev" -Url "http://localhost:3000"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Services are starting!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📡 WebSocket: ws://localhost:3001/socket.io/" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 You can close this window now." -ForegroundColor Yellow
Write-Host "💡 Both services will continue running in separate windows." -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"

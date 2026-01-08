#!/bin/bash

# Business Analyst Assistant Tool - Quick Start Script
# This script sets up and runs the entire application

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Business Analyst Assistant Tool - Quick Start             ║"
echo "║  SQLite Edition (No Docker Required)                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"
echo ""

# Backend Setup
echo "═══════════════════════════════════════════════════════════════"
echo "📦 Setting up Backend..."
echo "═══════════════════════════════════════════════════════════════"

cd backend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies... (this may take a minute)"
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Backend installation failed"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi

# Check if database exists
if [ ! -f "database.db" ]; then
    echo "🗄️  Creating SQLite database..."
    npm run migrate-sqlite
    if [ $? -ne 0 ]; then
        echo "❌ Database migration failed"
        exit 1
    fi
else
    echo "✅ Database already exists"
fi

echo "✅ Backend ready!"
echo ""

# Frontend Setup
echo "═══════════════════════════════════════════════════════════════"
echo "📦 Setting up Frontend..."
echo "═══════════════════════════════════════════════════════════════"

cd ../frontend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies... (this may take a minute)"
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Frontend installation failed"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi

echo "✅ Frontend ready!"
echo ""

# Display startup instructions
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 Ready to Start!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Run these commands in separate terminals:"
echo ""
echo "📍 Terminal 1 - Backend Server:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "📍 Terminal 2 - Frontend Server:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "📍 Terminal 3 - Open Browser:"
echo "   http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔐 Test Credentials:"
echo "   Email: admin@example.com"
echo "   Password: password123"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✨ Setup complete! Your database is: backend/database.db"
echo ""

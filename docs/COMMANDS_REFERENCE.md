# Command Reference Guide

## 🚀 Quick Commands

### Start Backend (Development)
```bash
cd backend
npm install        # First time only
npm run migrate    # First time only (creates database)
npm run dev        # Runs on http://localhost:3001
```

### Start Frontend (Development)
```bash
cd frontend
npm install        # First time only
npm run dev        # Runs on http://localhost:3000
```

### Start with Docker Compose
```bash
# From root directory
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build
```

---

## 🗄️ Database Commands

### Create Database Tables
```bash
cd backend
npm run migrate
```

### Seed Test Data (Optional)
```bash
cd backend
npm run seed
```

### Access PostgreSQL CLI
```bash
# Local PostgreSQL
psql -U postgres -h localhost -d business_analyst_db

# Docker PostgreSQL
docker exec -it business-db psql -U postgres -d business_analyst_db
```

### Common SQL Queries
```sql
-- List all users
SELECT * FROM users;

-- List all user stories
SELECT * FROM user_stories;

-- List all BRDs
SELECT * FROM brds;

-- View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC;

-- Reset all data (WARNING!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## 🔧 Backend Commands

### Development
```bash
npm run dev        # Start with hot-reload
npm start          # Start normally
npm run migrate    # Run migrations
npm run seed       # Seed database
```

### Production
```bash
npm install --production
npm run build
npm start
NODE_ENV=production npm start
```

---

## 🎨 Frontend Commands

### Development
```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run lint       # Check code quality
```

### Production Build
```bash
npm run build      # Create optimized build
npm start          # Start production server
npm run lint       # Check for issues
```

---

## 🐳 Docker Commands

### Build Images
```bash
# Backend
docker build -t business-analyst-backend ./backend

# Frontend
docker build -t business-analyst-frontend ./frontend
```

### Run Containers
```bash
# Backend
docker run -p 3001:3001 --env-file backend/.env business-analyst-backend

# Frontend
docker run -p 3000:3000 business-analyst-frontend

# With compose
docker-compose up -d
docker-compose down
```

### Database Container
```bash
# PostgreSQL
docker run --name business-db \
  -e POSTGRES_DB=business_analyst_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14-alpine

# View logs
docker logs business-db

# Stop
docker stop business-db

# Remove
docker rm business-db
```

---

## 📡 API Testing

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "username":"user",
    "password":"password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "credential":"user@example.com",
    "password":"password123"
  }'
```

**Get Current User (with token):**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create User Story:**
```bash
curl -X POST http://localhost:3001/api/user-stories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"New Feature",
    "description":"Description here",
    "priority":"High"
  }'
```

### Using Postman

1. Import API collection (create from endpoints)
2. Set BASE_URL variable: `http://localhost:3001/api`
3. Set TOKEN variable from login response
4. Test endpoints

---

## 🔍 Debugging

### Backend Debugging
```bash
# With verbose logging
DEBUG=* npm run dev

# Node inspector
node --inspect src/server.js

# Chrome DevTools
chrome://inspect
```

### Frontend Debugging
```bash
# Browser Console (F12)
# Next.js Debug Mode
NODE_OPTIONS='--inspect' npm run dev

# React DevTools
# Install: Chrome/Firefox extension
```

### Common Port Issues
```bash
# Port 3000 in use
kill -9 $(lsof -t -i:3000)

# Port 3001 in use
kill -9 $(lsof -t -i:3001)

# Port 5432 (PostgreSQL) in use
kill -9 $(lsof -t -i:5432)

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📁 File Operations

### Create `.env` from template
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd frontend
cp .env.local .env.local
```

### Clear node_modules
```bash
# Remove
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Clear cache
```bash
npm cache clean --force
npm ci  # Clean install
```

---

## 📊 Monitoring

### Check Process
```bash
# Backend running?
curl http://localhost:3001/health

# Frontend running?
curl http://localhost:3000
```

### View Logs
```bash
# Docker logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow logs
docker-compose logs -f backend

# Specific service
docker-compose logs --tail=100 backend
```

### Performance Check
```bash
# Check Node processes
ps aux | grep node

# Monitor resources
top
htop

# Network connections
netstat -tlnp | grep node
```

---

## 🔐 Security Commands

### Generate JWT Secret
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# bash
head -c 32 /dev/urandom | xxd -p
```

### Hash Password (Local)
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password', 10))"
```

---

## 🚀 Deployment Commands

### Build for Production
```bash
# Backend
cd backend
npm install --production
NODE_ENV=production npm start

# Frontend
cd frontend
npm run build
npm start
```

### Deploy to Heroku
```bash
# Backend
heroku create business-analyst-backend
heroku config:set -a business-analyst-backend \
  JWT_SECRET=your_secret \
  OPENAI_API_KEY=your_key
git push heroku main

# Frontend (Vercel)
npm i -g vercel
vercel
```

### Deploy with Docker
```bash
# Build images
docker build -t business-analyst-backend ./backend
docker build -t business-analyst-frontend ./frontend

# Push to registry
docker push your-registry/business-analyst-backend
docker push your-registry/business-analyst-frontend

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Performance Optimization

### Frontend
```bash
npm run build     # Production build
npm run lint      # Code quality check
```

### Backend
```bash
# Enable compression
npm install compression

# Add caching
npm install redis

# Database optimization
# Create indexes on frequently queried columns
```

---

## 🧪 Testing Commands

### Backend Tests (When available)
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Tests (When available)
```bash
npm test
npm run test -- --watch
npm run test -- --coverage
```

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=business_analyst_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_secret
OPENAI_API_KEY=your_key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🆘 Troubleshooting Commands

### Check Dependencies
```bash
npm list
npm outdated
npm audit
```

### Fix Issues
```bash
npm install
npm ci
npm cache clean --force
```

### Verify Installation
```bash
node --version
npm --version
psql --version
docker --version
```

---

## 🔄 Useful Aliases (Add to .bashrc or .zshrc)

```bash
alias backend='cd backend && npm run dev'
alias frontend='cd frontend && npm run dev'
alias db='docker run --name business-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14'
alias docker-start='docker-compose up --build -d'
alias docker-stop='docker-compose down'
alias docker-logs='docker-compose logs -f'
```

---

## 💾 Backup Commands

### PostgreSQL Backup
```bash
# Full backup
pg_dump -U postgres -h localhost business_analyst_db > backup.sql

# Restore
psql -U postgres -h localhost business_analyst_db < backup.sql
```

### Docker Volume Backup
```bash
docker cp business-db:/var/lib/postgresql/data ./backup_data
```

---

**Last Updated**: January 2, 2026

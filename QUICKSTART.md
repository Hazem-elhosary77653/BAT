# Quick Start Guide for Business Analyst Assistant Tool

## 🚀 Fast Setup (5 minutes)

### Option 1: Using SQLite (Recommended - No Docker Needed!)

#### Prerequisites
- Node.js 18+ installed
- **NO Docker or PostgreSQL needed!**

#### 1. Backend Setup
```bash
cd backend
npm install
npm run migrate-sqlite
npm run dev
```
✅ Backend runs on http://localhost:3001
✅ Database created automatically (database.db)

#### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on http://localhost:3000

#### 3. Open Browser
Navigate to: **http://localhost:3000**

#### 4. Create Account & Login
- Email: test@example.com
- Username: testuser
- Mobile: +1234567890
- Password: password123

**Benefits:**
- ✅ Zero external dependencies
- ✅ Instant setup (no database server needed)
- ✅ Perfect for development & testing
- ✅ Single database.db file

---

### Option 2: Using PostgreSQL with Node.js

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally (or use Docker)

#### 1. Start PostgreSQL with Docker (Optional)
```bash
docker run --name business-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
```

#### 2. Backend Setup
```bash
cd backend
npm install
npm run migrate
npm run dev
```
✅ Backend runs on http://localhost:3001

#### 3. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on http://localhost:3000

---

### Option 3: Using Docker Compose (Production-like)

#### Prerequisites
- Docker & Docker Compose installed

#### 1. Set Environment Variables
```bash
export OPENAI_API_KEY=your_key_here
export AZURE_DEVOPS_PAT=your_pat_here
```

#### 2. Start All Services
```bash
docker-compose up --build
```

#### 3. Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 📋 Available Accounts

### Pre-created Test Users
After migration, the following test users are available:

| Email | Username | Mobile | Password |
|-------|----------|--------|----------|
| admin@example.com | admin | +1111111111 | password123 |
| analyst@example.com | analyst | +1222222222 | password123 |
| viewer@example.com | viewer | +1333333333 | password123 |

---

## 🔧 Configuration

### Backend (.env)

**For SQLite (Default - Recommended):**
```env
# Database - SQLite (no external dependencies)
DB_TYPE=sqlite
DB_PATH=./database.db

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=change-me-in-production

# OpenAI (Get key from platform.openai.com)
OPENAI_API_KEY=sk-...

# Azure DevOps (Optional)
AZURE_DEVOPS_PAT=your-pat-token
```

**For PostgreSQL:**
```env
# Database - PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=business_analyst_db
DB_USER=postgres
DB_PASSWORD=password

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=change-me-in-production

# OpenAI (Get key from platform.openai.com)
OPENAI_API_KEY=sk-...

# Azure DevOps (Optional)
AZURE_DEVOPS_PAT=your-pat-token
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 📚 Available Features

### ✅ Fully Implemented
- ✅ User Authentication (Email/Username/Mobile)
- ✅ Dashboard with Statistics
- ✅ User Stories Management (CRUD)
- ✅ BRD Generation with AI (OpenAI)
- ✅ BRD Management with Comments
- ✅ Templates System
- ✅ Documents Management
- ✅ Diagrams & Workflows
- ✅ Reports & Analytics
- ✅ AI Configuration
- ✅ Azure DevOps Integration
- ✅ System Settings & Audit Logs
- ✅ Role-Based Access Control

### 🚀 Backend APIs
All 10 modules with complete CRUD operations:
1. Auth (Register, Login, Profile)
2. User Stories (Full CRUD + Filtering)
3. BRDs (Generate, CRUD, Comments)
4. Templates (CRUD + Public/Private)
5. Documents (Upload, CRUD)
6. Diagrams (CRUD)
7. Reports (Generate, Export)
8. AI Configuration (Setup & Configure)
9. Azure DevOps (Connect & Sync)
10. Settings (Users, Roles, Audit)

### 🎨 Frontend Pages
- Authentication Pages (Login/Register)
- Dashboard (with charts and stats)
- User Stories Module
- BRD Module (with AI Generation)
- Templates Module (stub)
- Documents Module (stub)
- Diagrams Module (stub)
- Reports Module (stub)
- AI Configuration Module (stub)
- Azure DevOps Module (stub)
- Settings Module (stub)

---

## 🧪 Testing the Application

### 1. Create a User Story
1. Login to the application
2. Navigate to "User Stories"
3. Click "New Story"
4. Fill in details and submit

### 2. Generate BRD with AI
1. Go to "BRDs"
2. Click "New BRD"
3. Select "Generate from User Story (AI)"
4. Choose a user story
5. Click "Generate with AI"
6. Wait for OpenAI to generate content

### 3. View Dashboard
- Real-time statistics
- Charts showing user stories by status
- Recent activity log

---

## 🔍 Common Issues & Fixes

### Backend Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001
kill -9 <PID>

# Check database connection
psql -U postgres -h localhost -d business_analyst_db
```

### Frontend Won't Start
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Check port 3000
kill -9 $(lsof -t -i:3000)
```

### Database Connection Error
```bash
# Make sure PostgreSQL is running
sudo systemctl start postgresql

# Or restart Docker container
docker-compose restart postgres
```

### OpenAI API Error
- Verify API key is correct
- Check account has available credits
- Ensure proper format: sk-...

---

## 📈 API Testing

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "user@example.com",
    "password": "password123"
  }'
```

### Create User Story
```bash
curl -X POST http://localhost:3001/api/user-stories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "User Story Title",
    "description": "Description...",
    "acceptanceCriteria": "Criteria...",
    "priority": "High"
  }'
```

---

## 🎯 Next Steps

1. **Configure OpenAI** (if not done)
   - Get API key from https://platform.openai.com/api-keys
   - Add to backend/.env

2. **Configure Azure DevOps** (optional)
   - Create PAT in Azure DevOps
   - Navigate to Azure DevOps settings

3. **Customize AI Prompts**
   - Go to AI Configuration module
   - Set custom prompts and parameters

4. **Import Data**
   - Use Documents module to upload files
   - Create templates for your organization

---

## 📞 Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review API documentation in the README
3. Check browser console for frontend errors
4. Check backend logs: `npm run dev`

---

**Version**: 1.0.0
**Last Updated**: January 2026

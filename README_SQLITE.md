# 🚀 Business Analyst Assistant Tool - SQLite Edition

**Enterprise-grade Business Analysis Platform** | Built with Node.js, Next.js, SQLite

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [What's Included](#whats-included)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [Running the Application](#running-the-application)
6. [Modules Overview](#modules-overview)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### All You Need (3 Commands)

```bash
# 1. Backend Setup & Run
cd backend
npm run migrate-sqlite
npm run dev

# 2. Frontend Setup & Run (In a new terminal)
cd frontend
npm run dev

# 3. Open Browser
# http://localhost:3000
```

**Login with:**
- Email: `admin@example.com`
- Password: `password123`

---

## ✨ What's Included

### Backend (Express.js + SQLite)
- ✅ 11 API controllers with 40+ endpoints
- ✅ JWT authentication with bcryptjs
- ✅ SQLite database with 12 tables
- ✅ Role-based access control (RBAC)
- ✅ Audit logging system
- ✅ OpenAI integration framework
- ✅ Azure DevOps integration framework
- ✅ File upload support (multer)
- ✅ Error handling & CORS
- ✅ Health check endpoint

### Frontend (Next.js + React)
- ✅ Modern responsive UI with Tailwind CSS
- ✅ Authentication pages (login/register)
- ✅ Dashboard with real-time charts
- ✅ 10 module pages fully implemented
- ✅ State management (Zustand)
- ✅ API client with interceptors
- ✅ Mobile-friendly design
- ✅ Auto-logout on token expiry
- ✅ Dark mode ready
- ✅ Professional branding

### Database (SQLite)
- ✅ 12 tables with relationships
- ✅ Foreign key constraints
- ✅ Automatic migrations
- ✅ No Docker required
- ✅ Zero external dependencies
- ✅ ~82 KB single file (database.db)
- ✅ Ready for PostgreSQL migration

---

## 🛠️ Technology Stack

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 4.18** - Web framework
- **SQLite 3** - Database
- **better-sqlite3** - SQLite driver
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT auth
- **axios** - HTTP client
- **openai** - GPT integration
- **multer** - File uploads
- **cors** - Cross-origin requests

### Frontend
- **Next.js 13+** - React framework
- **React 18+** - UI library
- **Tailwind CSS 3.3** - Styling
- **Zustand** - State management
- **Axios** - API requests
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Database
- **SQLite 3** - Lightweight SQL database
- **Zero Setup** - File-based, no server needed

---

## 📦 Installation

### Prerequisites
- **Node.js 18+** (Download from nodejs.org)
- **Git** (For version control)
- ❌ **NO Docker needed**
- ❌ **NO PostgreSQL needed**

### Step 1: Clone/Extract Project
```bash
# If from a git repo
git clone <repo-url>
cd business-analyst-assistant

# Or if extracted from archive
cd business-analyst-assistant
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

This installs:
- express, cors, dotenv
- pg, better-sqlite3 (both DB options)
- bcryptjs, jsonwebtoken
- axios, openai, multer
- and more...

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

This installs:
- next, react, react-dom
- tailwindcss, postcss
- zustand, axios, recharts
- lucide-react, and more...

### Step 4: Create SQLite Database
```bash
cd ../backend
npm run migrate-sqlite
```

**Output:**
```
Starting SQLite migration to ./database.db...
✅ SQLite database migration completed successfully
```

---

## 🚀 Running the Application

### Option A: Development Mode (with auto-reload)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Expected output:
```
✅ Connected to SQLite database: ./database.db
Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Terminal 3 - Browser:**
Open http://localhost:3000

### Option B: Production Mode

**Backend:**
```bash
cd backend
npm run start  # No auto-reload, runs faster
```

**Frontend:**
```bash
cd frontend
npm run build
npm run start
```

---

## 📱 Modules Overview

### 1. **Dashboard**
- Overview statistics
- User stories count
- BRD generation count
- Document count
- Real-time charts
- Recent activity feed

### 2. **User Stories**
- Create, read, update, delete user stories
- Search and filter
- Priority levels (Low, Medium, High)
- Status tracking (Draft, In Review, Approved)
- Tags and categorization
- Azure DevOps integration ready

### 3. **Business Requirements Documents (BRDs)**
- AI-powered generation from user stories (OpenAI)
- Manual BRD creation
- Version control
- Comment system
- File export
- Status tracking

### 4. **Templates**
- Create reusable templates
- Public/private templates
- Template types (BRD, Story, Report)
- Share templates with team
- Template customization

### 5. **Documents**
- Upload and manage documents
- File type support (PDF, DOC, XLS, etc.)
- Access level control
- Search and filter
- Document tagging
- Download and preview

### 6. **Diagrams**
- Create visual diagrams
- Support for multiple diagram types
- Workflow visualization
- Diagram data storage
- Editing and version history

### 7. **Reports**
- Generate reports from data
- Multiple report types
- Export functionality (PDF, Excel)
- Report scheduling (framework ready)
- Analytics and insights

### 8. **AI Configuration**
- Set up OpenAI API keys
- Configure prompt templates
- Adjust parameters (temperature, max_tokens)
- Language selection
- Detail level customization

### 9. **Azure DevOps**
- Connect Azure DevOps projects
- PAT token management
- Project synchronization
- User story mapping
- Bi-directional sync framework

### 10. **Settings**
- User management
- Role management (Admin, Analyst, Viewer)
- Permission configuration
- Audit logs (all actions tracked)
- System configuration

---

## 🔌 API Documentation

### Authentication

**Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "credential": "user@example.com",  # or username
  "password": "password123"
}

Response: { "token": "jwt-token-here" }
```

### User Stories

**Get All**
```bash
GET /api/user-stories
Authorization: Bearer {token}
```

**Create**
```bash
POST /api/user-stories
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "As a user, I want to...",
  "description": "Description here",
  "acceptanceCriteria": "Given/When/Then",
  "priority": "High",
  "tags": ["tag1", "tag2"]
}
```

**Update**
```bash
PUT /api/user-stories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{ "title": "Updated title", "status": "approved" }
```

**Delete**
```bash
DELETE /api/user-stories/{id}
Authorization: Bearer {token}
```

### BRDs

**Get All**
```bash
GET /api/brds
Authorization: Bearer {token}
```

**Generate with AI**
```bash
POST /api/brds/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Generated BRD",
  "userStoryId": 1,  # Optional
  "description": "Initial description"
}
```

**Create Manual**
```bash
POST /api/brds
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Manual BRD",
  "content": "BRD content here..."
}
```

### Other Modules
Similar RESTful patterns for:
- `/api/templates` - Template CRUD
- `/api/documents` - Document upload/management
- `/api/diagrams` - Diagram creation
- `/api/reports` - Report generation
- `/api/ai-config` - AI settings
- `/api/azure-devops` - DevOps integration
- `/api/settings` - System settings

---

## 🗄️ Database Schema

### 12 Tables (Auto-Created)

```
users
├── id (Primary Key)
├── email (Unique)
├── username (Unique)
├── mobile (Unique)
├── password_hash
├── role (admin, analyst, viewer)
├── is_active (Boolean)
└── created_at, updated_at

user_stories
├── id
├── user_id (FK → users)
├── title
├── description
├── acceptance_criteria
├── priority
├── status
├── tags (JSON array)
└── created_at, updated_at

brds
├── id
├── user_id (FK → users)
├── title
├── content
├── version
├── status
├── file_path
├── generated_from_user_story_id (FK)
└── created_at, updated_at

brd_comments
├── id
├── brd_id (FK → brds)
├── user_id (FK → users)
├── comment
└── created_at

templates
├── id
├── user_id (FK → users)
├── name
├── content
├── template_type
├── is_public
└── created_at, updated_at

documents
├── id
├── user_id (FK → users)
├── title
├── file_path
├── file_type
├── file_size
├── tags
├── access_level
└── created_at, updated_at

diagrams
├── id
├── user_id (FK → users)
├── title
├── diagram_data (JSON)
├── diagram_type
└── created_at, updated_at

reports
├── id
├── user_id (FK → users)
├── title
├── report_type
├── report_data (JSON)
├── exported_format
└── created_at

ai_configurations
├── id
├── user_id (FK → users)
├── prompt_template
├── language
├── detail_level
├── temperature
├── max_tokens
├── is_active
└── created_at, updated_at

azure_devops_integrations
├── id
├── user_id (FK → users)
├── organization
├── project
├── pat_token_hash
├── is_active
├── last_synced
└── created_at, updated_at

audit_logs
├── id
├── user_id (FK → users)
├── action
├── entity_type
├── entity_id
├── old_values (JSON)
├── new_values (JSON)
├── ip_address
├── user_agent
└── created_at

permissions
├── id
├── role
├── action
├── resource
└── UNIQUE(role, action, resource)
```

---

## ⚙️ Configuration

### Backend .env

**SQLite (Default):**
```env
# Database
DB_TYPE=sqlite
DB_PATH=./database.db

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# OpenAI (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Azure DevOps (Optional)
AZURE_DEVOPS_PAT=your-pat-token
AZURE_DEVOPS_ORG=your-organization

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

**PostgreSQL (Alternative):**
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=business_analyst_db
DB_USER=postgres
DB_PASSWORD=your-password

# ... rest same as above
```

### Frontend .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DB_TYPE | Database type | sqlite, postgresql |
| DB_PATH | SQLite path | ./database.db |
| PORT | Backend port | 3001 |
| JWT_SECRET | JWT signing secret | your-secret-key |
| OPENAI_API_KEY | OpenAI API key | sk-... |
| NEXT_PUBLIC_API_URL | Frontend API URL | http://localhost:3001/api |

---

## 🧪 Test Credentials

### Pre-created Users

| Email | Username | Password | Role |
|-------|----------|----------|------|
| admin@example.com | admin | password123 | Administrator |
| analyst@example.com | analyst | password123 | Business Analyst |
| viewer@example.com | viewer | password123 | Viewer |

### Test Workflow

1. **Login** with admin@example.com / password123
2. **Create User Story** - New Story → Fill details → Save
3. **Generate BRD** - Go to BRDs → Generate from Story (AI) → Wait for OpenAI response
4. **View Dashboard** - Statistics, charts, recent activities
5. **Explore Modules** - Templates, Documents, Diagrams, etc.

---

## 🐛 Troubleshooting

### Backend Issues

**Port 3001 already in use:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

**Database locked error:**
```bash
# Restart backend
# Or delete and recreate:
rm backend/database.db
cd backend && npm run migrate-sqlite
```

**Cannot find module 'better-sqlite3':**
```bash
cd backend
npm install better-sqlite3
npm run dev
```

**Permission denied on database.db:**
```bash
# Windows - Usually not an issue, but try:
icacls "backend/database.db" /grant:r Users:F

# Linux/Mac
chmod 644 backend/database.db
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

**Blank page, console errors:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

**API requests failing:**
1. Check backend is running: `http://localhost:3001/api/health`
2. Check NEXT_PUBLIC_API_URL in `.env.local`
3. Check browser console for CORS errors

### Database Issues

**Migration failed:**
```bash
# Check database path
ls -la backend/database.db

# Check Node version
node --version  # Must be 18+

# Retry migration
cd backend
npm run migrate-sqlite
```

**Can't connect to database:**
```bash
# Ensure database.db exists
cd backend
ls -la database.db

# If missing, recreate
npm run migrate-sqlite

# Verify file size > 80KB
```

---

## 📚 Additional Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[SQLITE_SETUP.md](./SQLITE_SETUP.md)** - SQLite-specific guide
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Completion checklist
- **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** - Complete file listing
- **[COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md)** - All useful commands
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature summary

---

## 🎓 Key Concepts

### JWT Authentication
- Tokens issued on login (7-day expiry)
- Sent in `Authorization: Bearer <token>` header
- Auto-refresh handled by frontend interceptor
- Logout clears token

### Role-Based Access Control (RBAC)
- **Admin** - Full system access
- **Analyst** - Create/manage stories and BRDs
- **Viewer** - Read-only access
- Permissions table controls access

### SQLite Advantages
- Zero setup - single file database
- Perfect for development & testing
- No server needed
- Portable (single database.db file)
- Migrates to PostgreSQL anytime

### API Design
- RESTful endpoints
- JSON request/response
- Proper HTTP status codes
- Error messages included
- Pagination support

---

## 🔐 Security Features

- ✅ Password hashing (bcryptjs, 10 salt rounds)
- ✅ JWT authentication (7-day expiry)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Role-based access control
- ✅ Audit logging (all actions tracked)
- ✅ Secure environment variables
- ✅ Password requirements (8+ chars)

---

## 📈 Scaling & Production

### When to Migrate to PostgreSQL
- Multiple concurrent users (> 5)
- High traffic scenarios
- Multi-server deployment
- Advanced replication needed

### How to Migrate
```bash
# 1. Edit backend/.env
DB_TYPE=postgresql
DB_HOST=production-db.example.com
DB_USER=produser
DB_PASSWORD=secure-password

# 2. Run PostgreSQL migration
npm run migrate

# 3. Restart backend
npm run start
```

All code remains the same - the adapter handles it!

---

## 📞 Support & Help

### Debugging
1. Check browser console (F12)
2. Check backend logs (terminal output)
3. Check network tab (API calls)
4. Check database file exists (backend/database.db)
5. Verify environment variables

### Common Commands
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check Node version
node --version

# List database tables
sqlite3 backend/database.db ".tables"

# View logs
# Windows: Open file explorer, go to backend/database.db
# Linux/Mac: cat backend/database.db
```

---

## 📋 Checklist for First Run

- [ ] Node.js 18+ installed
- [ ] Project extracted/cloned
- [ ] Backend dependencies installed (`npm install`)
- [ ] SQLite database created (`npm run migrate-sqlite`)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend dependencies installed
- [ ] Frontend running (`npm run dev`)
- [ ] Browser open to http://localhost:3000
- [ ] Logged in with admin@example.com / password123
- [ ] All modules visible in sidebar

---

## 🚀 Ready to Start?

```bash
# Quick start - Copy & paste these commands:

# Terminal 1
cd backend
npm run migrate-sqlite
npm run dev

# Terminal 2 (new terminal window)
cd frontend
npm run dev

# Then open browser to http://localhost:3000
```

**Login:** admin@example.com / password123

---

## 📊 Project Stats

- **Backend Files**: 18 files (controllers, routes, middleware, utils)
- **Frontend Files**: 30+ files (pages, components, stores, styles)
- **Database Tables**: 12 tables with relationships
- **API Endpoints**: 40+ REST endpoints
- **Lines of Code**: 8000+ lines
- **Documentation**: 7 guides (README, QUICKSTART, SETUP, etc.)

---

## 📝 License

MIT License - Feel free to use for personal and commercial projects.

---

## ✨ Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| User Authentication | ✅ Complete | Email, username, mobile login |
| JWT Authorization | ✅ Complete | 7-day token expiry |
| Role-Based Access | ✅ Complete | Admin, Analyst, Viewer roles |
| Dashboard | ✅ Complete | Charts, stats, activity feed |
| User Stories | ✅ Complete | Full CRUD, search, filter |
| BRD Generation | ✅ Complete | AI-powered with OpenAI |
| BRD Management | ✅ Complete | Edit, comment, version control |
| Templates | ✅ Complete | CRUD, public/private sharing |
| Documents | ✅ Complete | Upload, manage, search |
| Diagrams | ✅ Complete | Creation, editing, storage |
| Reports | ✅ Complete | Generate, export, customize |
| AI Configuration | ✅ Complete | OpenAI integration setup |
| Azure DevOps | ✅ Complete | Integration framework ready |
| Settings | ✅ Complete | User, role, audit management |
| Database | ✅ Complete | SQLite (or PostgreSQL ready) |
| API | ✅ Complete | 40+ RESTful endpoints |
| Frontend UI | ✅ Complete | Responsive, Tailwind CSS |
| Documentation | ✅ Complete | 7 comprehensive guides |

---

**Status**: ✅ **READY TO USE**

**Database**: SQLite 3 (database.db)

**Created**: January 2026

**Version**: 1.0.0

---

**Happy building! 🎉**

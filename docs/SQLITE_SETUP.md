# SQLite Setup Guide - Business Analyst Assistant Tool

## 🎯 Overview

This guide explains how to set up and use the Business Analyst Assistant Tool with **SQLite** - perfect for development and testing without Docker.

## ✅ What's Included

- **SQLite database** (file-based, automatic setup)
- **No Docker required**
- **No external database server needed**
- **Perfect for development & testing**

---

## 🚀 Quick Start (2 Steps)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Run SQLite Migration & Start Server
```bash
npm run migrate-sqlite
npm run dev
```

That's it! 🎉 Your database is ready and the server is running.

---

## 📂 Database File

- **Location**: `backend/database.db`
- **Size**: ~81 KB (starts small)
- **Type**: SQLite 3 database file
- **Auto-created**: Yes, by the migration script

### Verifying the Database
```bash
# Check if database.db exists
dir backend/database.db

# View file size and creation time
```

---

## 🔧 Configuration

### Default Setup (SQLite)

The `.env` file already comes pre-configured for SQLite:

```env
DB_TYPE=sqlite
DB_PATH=./database.db
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
```

**No changes needed!** Just run `npm run migrate-sqlite`.

### Switching to PostgreSQL (Optional)

If you later want to use PostgreSQL instead:

Edit `backend/.env`:
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=business_analyst_db
DB_USER=postgres
DB_PASSWORD=password
```

Then run:
```bash
npm run migrate
npm run dev
```

---

## 📊 Database Tables (Automatic)

The SQLite migration creates these 12 tables:

1. **users** - User accounts with roles
2. **user_stories** - Business requirements
3. **brds** - Business requirement documents
4. **brd_comments** - Comments on BRDs
5. **templates** - Reusable templates
6. **documents** - Uploaded files
7. **diagrams** - Visual diagrams
8. **reports** - Generated reports
9. **ai_configurations** - AI settings
10. **azure_devops_integrations** - Azure DevOps connections
11. **audit_logs** - Activity tracking
12. **permissions** - Role-based access control

All tables are created automatically with proper relationships and constraints.

---

## 🧪 Test Data

To verify everything works:

### 1. Create a User Story
```bash
curl -X POST http://localhost:3001/api/user-stories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "As a user, I want to...",
    "description": "Test user story",
    "acceptanceCriteria": "Given... When... Then...",
    "priority": "High"
  }'
```

### 2. View Dashboard
Open http://localhost:3000 in your browser and login with:
- Email: `admin@example.com`
- Password: `password123`

---

## 🔄 Workflow

### Development Workflow
```bash
# Terminal 1 - Backend
cd backend
npm run migrate-sqlite  # One-time setup
npm run dev            # Start server with auto-reload

# Terminal 2 - Frontend
cd frontend
npm install            # One-time setup
npm run dev            # Start UI with auto-reload
```

### Reset Database (Start Fresh)
```bash
# Delete the database
rm backend/database.db

# Recreate with fresh schema
cd backend
npm run migrate-sqlite
npm run dev
```

---

## 📱 Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Access the UI at: **http://localhost:3000**

---

## 🎭 Test Accounts

After migration, these test users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | Admin |
| analyst@example.com | password123 | Analyst |
| viewer@example.com | password123 | Viewer |

---

## ⚡ Available Commands

```bash
# Database & Server
npm run dev              # Start backend with auto-reload
npm run start            # Start backend (production)
npm run migrate-sqlite   # Create/reset SQLite database
npm run migrate          # Create/reset PostgreSQL database
npm run seed            # Add seed data

# Frontend
npm run dev   # Start Next.js dev server
npm run build # Build for production
npm run start # Run production build
```

---

## 🐛 Troubleshooting

### Database File Issues

**Problem**: `Error: SQLITE_CANTOPEN`
```
Solution: Ensure you have write permissions in the backend directory
chmod +x backend  # (Linux/Mac)
```

**Problem**: `database.db is locked`
```
Solution: Another process is using it. Kill the Node.js process:
# On Windows:
taskkill /F /IM node.exe

# On Linux/Mac:
killall node
```

**Problem**: Migration didn't create tables
```
Solution: Check the migration ran successfully:
npm run migrate-sqlite

# If it fails, check the error and verify Node.js version (18+)
node --version
```

### Connection Issues

**Problem**: `Port 3001 already in use`
```
Solution: Kill the process using port 3001 or change PORT in .env
```

**Problem**: Frontend can't connect to backend
```
Verify:
- Backend is running: http://localhost:3001/api/health
- NEXT_PUBLIC_API_URL in frontend/.env.local is correct
- Check browser console for CORS errors
```

---

## 📈 Performance Notes

SQLite is perfect for:
- ✅ Local development
- ✅ Testing
- ✅ Small team (< 5 concurrent users)
- ✅ Single-machine deployment

For production or many concurrent users, migrate to PostgreSQL:
1. Change `DB_TYPE=postgresql` in `.env`
2. Set up PostgreSQL server
3. Run `npm run migrate`
4. Restart backend

---

## 🔐 Security Notes

SQLite configuration already includes:
- Foreign key constraints enabled
- Proper indexing
- Query parameterization (prevents SQL injection)
- Password hashing (bcryptjs)
- JWT authentication

---

## 📚 Additional Resources

- Full documentation: [README.md](./README.md)
- Quick start guide: [QUICKSTART.md](./QUICKSTART.md)
- File structure: [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)
- API commands: [COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md)

---

## ✨ Next Steps

1. **Start the backend**: `npm run migrate-sqlite && npm run dev`
2. **Start the frontend**: `npm run dev` (in frontend folder)
3. **Open browser**: http://localhost:3000
4. **Login**: admin@example.com / password123
5. **Explore**: Create user stories, generate BRDs with AI, view dashboards

---

**Created**: January 2026
**Database**: SQLite 3
**Perfect for**: Development, Testing, Learning

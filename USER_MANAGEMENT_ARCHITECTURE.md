# User Management System - Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js Application (Port 3000)              │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  ┌──────────────────┐        ┌──────────────────────────┐ │ │
│  │  │  Login Page      │        │  Admin Dashboard         │ │ │
│  │  │  /login          │ ─────→ │  /dashboard              │ │ │
│  │  └──────────────────┘        └──────────────────────────┘ │ │
│  │                                            ↓               │ │
│  │                              ┌──────────────────────────┐ │ │
│  │                              │ Admin Menu (if admin)    │ │ │
│  │                              │ - Users                  │ │ │
│  │                              │ - Permissions            │ │ │
│  │                              └──────────────────────────┘ │ │
│  │                                            ↓               │ │
│  │                              ┌──────────────────────────┐ │ │
│  │                              │ User Management Page     │ │ │
│  │                              │ /admin/users             │ │ │
│  │                              │                          │ │ │
│  │                              │ ┌─────────────────────┐ │ │
│  │                              │ │ Search Bar          │ │ │
│  │                              │ └─────────────────────┘ │ │
│  │                              │ ┌─────────────────────┐ │ │
│  │                              │ │ [Add User] Button   │ │ │
│  │                              │ └─────────────────────┘ │ │
│  │                              │ ┌─────────────────────┐ │ │
│  │                              │ │ Users Table         │ │ │
│  │                              │ │ - Name, Email       │ │ │
│  │                              │ │ - Role, Status      │ │ │
│  │                              │ │ - Edit/Delete       │ │ │
│  │                              │ └─────────────────────┘ │ │
│  │                              └──────────────────────────┘ │ │
│  │                                            ↓               │ │
│  │                              ┌──────────────────────────┐ │ │
│  │                              │ Create User Modal        │ │ │
│  │                              │                          │ │ │
│  │                              │ ┌──────────────────────┐ │ │
│  │                              │ │ Email (required)     │ │ │
│  │                              │ │ Username (required)  │ │ │
│  │                              │ │ Password (required)  │ │ │
│  │                              │ │ Role (dropdown)      │ │ │
│  │                              │ │ [Create User]        │ │ │
│  │                              │ └──────────────────────┘ │ │
│  │                              └──────────────────────────┘ │ │
│  │                                            ↓               │ │
│  │                              HTTP Request                 │ │
│  │                              (axios/api.js)              │ │
│  │                                            ↓               │ │
│  └────────────────────────────────────────────┼──────────────┘ │
│                                               │                 │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                │
                                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Network (HTTP/HTTPS)                            │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/users                                                 │
│  {                                                               │
│    email: "user@example.com",                                   │
│    username: "username",                                        │
│    firstName: "John",                                           │
│    lastName: "Doe",                                             │
│    password: "SecurePass123",                                   │
│    role: "analyst"                                              │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Express.js Server (Port 3001)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              userManagementRoutes.js                       │ │
│  │  POST /api/users ──→ authMiddleware ──→ createUser()      │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│                             ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          userManagementController.js                       │ │
│  │                                                              │ │
│  │  createUser(req, res) {                                    │ │
│  │    1. Check admin authorization                           │ │
│  │    2. Validate email uniqueness                           │ │
│  │    3. Validate username uniqueness                        │ │
│  │    4. Hash password with bcryptjs                         │ │
│  │    5. Insert into database                                │ │
│  │    6. Log audit action                                    │ │
│  │    7. Return created user                                 │ │
│  │  }                                                           │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│                             ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Database (SQLite)                               │ │
│  │                                                              │ │
│  │  users table:                                              │ │
│  │  ├─ id (PK)                                                │ │
│  │  ├─ email (UNIQUE)                                         │ │
│  │  ├─ username (UNIQUE)                                      │ │
│  │  ├─ password_hash (bcryptjs)                               │ │
│  │  ├─ first_name                                             │ │
│  │  ├─ last_name                                              │ │
│  │  ├─ role (admin|analyst|viewer)                            │ │
│  │  ├─ is_active (boolean)                                    │ │
│  │  ├─ created_at (timestamp)                                 │ │
│  │  └─ updated_at (timestamp)                                 │ │
│  │                                                              │ │
│  │  INSERT INTO users (                                       │ │
│  │    email, username, password_hash,                         │ │
│  │    first_name, last_name, role, is_active                 │ │
│  │  ) VALUES (...)                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Audit Logging (utils/audit.js)                  │ │
│  │                                                              │ │
│  │  logAuditAction({                                          │ │
│  │    action: 'CREATE_USER',                                 │ │
│  │    adminId: current_user.id,                              │ │
│  │    targetId: new_user.id,                                 │ │
│  │    details: { email, role },                              │ │
│  │    timestamp: now()                                       │ │
│  │  })                                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## User Creation Flow Sequence

```
Admin User                Frontend            Backend             Database
    │                         │                  │                   │
    │──Click "Add User"──────→│                  │                   │
    │                         │                  │                   │
    │←─Modal Opens (Create)───│                  │                   │
    │                         │                  │                   │
    │──Fill Form Data─────────│                  │                   │
    │                         │                  │                   │
    │──Click "Create User"────│                  │                   │
    │                         │                  │                   │
    │                    POST /api/users         │                   │
    │                         │──────────────────→│                  │
    │                         │   JWT Token +     │                  │
    │                         │   User Data       │                  │
    │                         │                  │                   │
    │                         │            authMiddleware            │
    │                         │            (verify JWT)              │
    │                         │                  │                   │
    │                         │            Validate Admin            │
    │                         │                  │                   │
    │                         │            Check Email Unique        │
    │                         │                  │──Check─────────────→│
    │                         │                  │←─OK────────────────│
    │                         │                  │                   │
    │                         │            Check Username Unique     │
    │                         │                  │──Check─────────────→│
    │                         │                  │←─OK────────────────│
    │                         │                  │                   │
    │                         │            Hash Password (bcryptjs)  │
    │                         │                  │                   │
    │                         │            INSERT User               │
    │                         │                  │──INSERT───────────→│
    │                         │                  │                   │
    │                         │                  │         INSERT OK  │
    │                         │                  │←──Return ID───────│
    │                         │                  │                   │
    │                         │            Log Audit Event           │
    │                         │                  │                   │
    │                    200 OK Response        │                   │
    │                         │←──────────────────│                   │
    │                         │   {               │                   │
    │                         │    id: 5,         │                   │
    │                         │    email: ...,    │                   │
    │                         │    role: ...      │                   │
    │                         │   }               │                   │
    │                         │                  │                   │
    │←─Success Message────────│                  │                   │
    │                         │                  │                   │
    │←─Refresh User List──────│                  │                   │
    │                         │                  │                   │
    │                    GET /api/users          │                   │
    │                         │──────────────────→│                  │
    │                         │                  │──QUERY────────────→│
    │                         │                  │←─All Users────────│
    │                         │←──200 OK──────────│                   │
    │                         │   [users...]      │                   │
    │                         │                  │                   │
    │←─New User in Table──────│                  │                   │
    │                         │                  │                   │
```

## Role Permission Matrix

```
┌──────────────┬────────┬──────────┬────────┐
│ Permission   │ Admin  │ Analyst  │ Viewer │
├──────────────┼────────┼──────────┼────────┤
│ CREATE USER  │   ✓    │    ✗     │   ✗    │
│ READ USER    │   ✓    │    ✗     │   ✗    │
│ UPDATE USER  │   ✓    │    ✗     │   ✗    │
│ DELETE USER  │   ✓    │    ✗     │   ✗    │
│ MANAGE ROLES │   ✓    │    ✗     │   ✗    │
│              │        │          │        │
│ CREATE STORY │   ✓    │    ✓     │   ✗    │
│ READ STORY   │   ✓    │    ✓     │   ✓    │
│ UPDATE STORY │   ✓    │    ✓     │   ✗    │
│ DELETE STORY │   ✓    │    ✓     │   ✗    │
│              │        │          │        │
│ CREATE BRD   │   ✓    │    ✓     │   ✗    │
│ READ BRD     │   ✓    │    ✓     │   ✓    │
│ UPDATE BRD   │   ✓    │    ✓     │   ✗    │
│ DELETE BRD   │   ✓    │    ✓     │   ✗    │
│              │        │          │        │
│ CREATE DOC   │   ✓    │    ✓     │   ✗    │
│ READ DOC     │   ✓    │    ✓     │   ✓    │
│ UPDATE DOC   │   ✓    │    ✓     │   ✗    │
│ DELETE DOC   │   ✓    │    ✓     │   ✗    │
│              │        │          │        │
│ CREATE TEMP  │   ✓    │    ✓     │   ✗    │
│ READ TEMP    │   ✓    │    ✓     │   ✓    │
│ UPDATE TEMP  │   ✓    │    ✓     │   ✗    │
│ DELETE TEMP  │   ✓    │    ✓     │   ✗    │
│              │        │          │        │
│ AUDIT LOGS   │   ✓    │    ✗     │   ✗    │
│ ADMIN PANEL  │   ✓    │    ✗     │   ✗    │
└──────────────┴────────┴──────────┴────────┘

Total: Admin (22) | Analyst (13) | Viewer (5)
```

## User Creation Request/Response

```
HTTP POST /api/users

REQUEST:
{
  "email": "john.smith@example.com",
  "username": "johnsmith",
  "firstName": "John",
  "lastName": "Smith",
  "password": "SecurePassword123",
  "role": "analyst"
}

REQUEST HEADERS:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

VALIDATION:
┌─────────────────────────────────────────┐
│ Check 1: Admin Role Verification        │
│ ✓ JWT decoded, role = 'admin'          │
├─────────────────────────────────────────┤
│ Check 2: Required Fields                │
│ ✓ email present                         │
│ ✓ username present                      │
│ ✓ password present (min 6 chars)        │
│ ✓ role in [admin, analyst, viewer]      │
├─────────────────────────────────────────┤
│ Check 3: Uniqueness Validation          │
│ ✓ Email not in users table              │
│ ✓ Username not in users table           │
├─────────────────────────────────────────┤
│ Check 4: Data Integrity                 │
│ ✓ Email format valid                    │
│ ✓ Password meets security requirements  │
└─────────────────────────────────────────┘

PROCESSING:
1. Hash password: SecurePassword123 → $2a$10$x2q...
2. Insert into users table:
   INSERT INTO users (
     email, username, password_hash, 
     first_name, last_name, role, is_active,
     created_at, updated_at
   ) VALUES (
     'john.smith@example.com', 'johnsmith',
     '$2a$10$x2q...', 'John', 'Smith',
     'analyst', 1, NOW(), NOW()
   )
3. Get returned user ID (5)
4. Log audit action:
   ACTION: CREATE_USER
   ADMIN: 1 (logged-in admin)
   TARGET: 5 (new user)
   TIME: NOW()

RESPONSE (201 Created):
{
  "success": true,
  "data": {
    "id": 5,
    "email": "john.smith@example.com",
    "username": "johnsmith",
    "first_name": "John",
    "last_name": "Smith",
    "role": "analyst",
    "is_active": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}

FRONTEND REACTION:
1. Show success message: "User created successfully"
2. Call GET /api/users to refresh list
3. Display new user in table
4. Clear modal form
5. Close modal
```

## Data Flow Diagram

```
User Input (Form)
      ↓
┌─────────────────────────────┐
│   Frontend Validation       │
│ - Required fields check     │
│ - Email format check        │
│ - Password length check     │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   HTTP POST Request         │
│ /api/users (with JWT Token) │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   Backend Validation        │
│ - JWT token verification    │
│ - Admin role check          │
│ - Email uniqueness          │
│ - Username uniqueness       │
│ - Password validation       │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   Password Security         │
│ - Salt generation           │
│ - bcryptjs hashing          │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   Database Operations       │
│ - INSERT user record        │
│ - Get auto-increment ID     │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   Audit Logging             │
│ - Log CREATE_USER action    │
│ - Record admin ID           │
│ - Record target user ID     │
│ - Store timestamp           │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   HTTP Response             │
│ - 201 Created Status        │
│ - User JSON in response     │
└─────────────────────────────┘
      ↓
┌─────────────────────────────┐
│   Frontend Handling         │
│ - Show success message      │
│ - Refresh user list         │
│ - Update UI                 │
│ - Close modal               │
└─────────────────────────────┘
```

## File Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ Frontend: app/dashboard/admin/users/page.jsx                  │
├────────────────────────────────────────────────────────────────┤
│ - State: formData, showModal, isCreating                       │
│ - Functions: openCreateModal(), handleSaveUser()              │
│ - API Calls: api.post('/users', {...})                        │
│ - Renders: Table, Modal, Form                                 │
└────────────────┬─────────────────────────────────────────────┘
                 │ uses lib/api.js (axios wrapper)
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│ HTTP Request (axios)                                           │
│ POST http://localhost:3001/api/users                          │
│ Headers: Authorization: Bearer JWT_TOKEN                       │
│ Body: { email, username, password, role, ... }               │
└────────────────┬─────────────────────────────────────────────┘
                 │ Network
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│ Backend: src/routes/userManagementRoutes.js                   │
├────────────────────────────────────────────────────────────────┤
│ router.post('/', authMiddleware, createUser)                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│ Backend: src/middleware/authMiddleware.js                      │
├────────────────────────────────────────────────────────────────┤
│ - Verify JWT token                                             │
│ - Extract user info                                            │
│ - Check admin role                                             │
│ - Pass to next middleware                                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│ Backend: src/controllers/userManagementController.js           │
├────────────────────────────────────────────────────────────────┤
│ const createUser = async (req, res) => {                       │
│   - Validate admin authorization                              │
│   - Check email uniqueness (query DB)                         │
│   - Check username uniqueness (query DB)                      │
│   - Hash password with hashPassword()                          │
│   - Insert into database                                      │
│   - Call logAuditAction()                                     │
│   - Return 201 with user data                                 │
│ }                                                               │
└────────────────┬──────────┬──────────────────────────────────┘
                 │          │
                 │uses      │uses
                 │          │
      ┌──────────┴──┐  ┌────┴──────────┐
      │             │  │               │
      ↓             ↓  ↓               ↓
    DB            utils/auth.js    utils/audit.js
  (SQLite)      hashPassword()    logAuditAction()
                 (bcryptjs)
                 
    ↓
  users table INSERT
```

## Complete Component Hierarchy

```
UserManagementPage
├── Sidebar (navigation)
├── Header (page header)
└── Main Content
    ├── Title & Description
    ├── Search Bar + Add User Button
    ├── Loading Spinner (conditional)
    └── Users Table
        ├── Table Headers
        └── Table Rows (filtered)
            ├── User Name & Username
            ├── Email
            ├── Role (dropdown selector)
            ├── Status (button toggle)
            ├── Created Date
            └── Actions (Edit/Delete buttons)
            
CreateUserModal
├── Modal Header
│   └── Title: "Create New User"
├── Form
│   ├── First Name Input
│   ├── Last Name Input
│   ├── Email Input (required)
│   ├── Username Input (create only)
│   ├── Password Input (create only)
│   ├── Role Select (dropdown)
│   └── Status Select (edit only)
├── Form Actions
│   ├── Cancel Button
│   └── Create/Save Button
└── Form Submission
    └── handleSaveUser()
        ├── Validate fields
        ├── api.post/put()
        ├── Refresh user list
        ├── Show notification
        └── Close modal
```

---

This comprehensive diagram shows how all components work together to create a seamless user management experience!

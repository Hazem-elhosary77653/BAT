# User Management Guide

## Overview
The user management system provides comprehensive admin controls for creating, updating, and managing user accounts with role-based access control (RBAC).

## Quick Start

### 1. Seed Demo Users
```bash
cd backend
node seed-users.js
```

**Demo Users Created:**
- **Admin**: admin@example.com / Admin@123
- **Analyst**: analyst@example.com / Analyst@123  
- **Viewer**: viewer@example.com / Viewer@123
- **John Doe**: john.doe@example.com / John@123
- **Jane Smith**: jane.smith@example.com / Jane@123

### 2. Access User Management
1. Login as admin user
2. Navigate to Admin → Users from sidebar
3. View all users, edit, or create new ones

## User Roles & Permissions

### Admin Role (22 permissions)
Full system access - can manage users, roles, permissions, and all features.

**Permissions:**
- User Management: create_user, read_user, update_user, delete_user
- User Stories: create_user_story, read_user_story, update_user_story, delete_user_story
- BRDs: create_brd, read_brd, update_brd, delete_brd
- Documents: create_document, read_document, update_document, delete_document
- Templates: create_template, read_template, update_template, delete_template
- Admin: manage_users, manage_roles, view_audit_logs, access_admin_panel

### Analyst Role (13 permissions)
Can create and manage content (user stories, BRDs, documents, templates).

**Permissions:**
- User Stories: create_user_story, read_user_story, update_user_story, delete_user_story
- BRDs: create_brd, read_brd, update_brd, delete_brd
- Documents: create_document, read_document, update_document, delete_document
- Templates: create_template, read_template

### Viewer Role (5 permissions)
Read-only access to view content without modification.

**Permissions:**
- User Stories: read_user_story
- BRDs: read_brd
- Documents: read_document
- Templates: read_template
- Dashboard: access_dashboard

## Creating Users

### Via Admin UI
1. Go to Admin → Users
2. Click "Add User" button
3. Fill in form:
   - First Name (optional)
   - Last Name (optional)
   - Email (required, must be unique)
   - Username (required, must be unique)
   - Password (required, minimum 6 characters)
   - Role (admin/analyst/viewer)
4. Click "Create User"

### Via API
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "firstName": "First",
    "lastName": "Last",
    "password": "SecurePassword123",
    "role": "analyst"
  }'
```

## Managing Users

### Edit User
1. Go to Admin → Users
2. Click the edit icon (pencil) for the user
3. Update fields (name, email, role, status)
4. Click "Save Changes"

### Change User Role
1. Open user edit modal
2. Select new role from dropdown (admin/analyst/viewer)
3. Save changes
4. User's permissions update immediately

### Deactivate/Activate User
1. Open user edit modal
2. Change Status dropdown
3. Save changes
4. Deactivated users cannot login

### Delete User (Soft Delete)
1. Find user in list
2. Click delete icon (trash)
3. User is marked inactive (soft deleted)
4. Can be reactivated by editing and changing status

## User Management Endpoints

### Create User
```
POST /api/users
Authorization: Bearer JWT (admin only)
Body: {
  email: string (required, unique),
  username: string (required, unique),
  firstName: string,
  lastName: string,
  password: string (required, min 6 chars),
  role: string (admin|analyst|viewer)
}
```

### Get All Users
```
GET /api/users
Authorization: Bearer JWT (admin only)
```

### Get User by ID
```
GET /api/users/:userId
Authorization: Bearer JWT (admin or self)
```

### Update User
```
PUT /api/users/:userId
Authorization: Bearer JWT (admin or self)
Body: {
  firstName: string,
  lastName: string,
  email: string,
  role: string (admin only),
  isActive: boolean (admin only)
}
```

### Change User Role
```
PATCH /api/users/:userId/role
Authorization: Bearer JWT (admin only, cannot change own)
Body: {
  role: string (admin|analyst|viewer)
}
```

### Toggle User Status
```
PATCH /api/users/:userId/status
Authorization: Bearer JWT (admin only)
Body: {
  isActive: boolean
}
```

### Delete User (Soft)
```
DELETE /api/users/:userId
Authorization: Bearer JWT (admin only, cannot delete self)
```

### Get Role Permissions
```
GET /api/users/permissions/:role
Authorization: Bearer JWT
Response: array of permissions for role
```

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'analyst',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Audit Logging

All user management actions are automatically logged:
- User creation
- Role changes
- Status toggles
- Deletions
- Permission access

Check `utils/audit.js` for audit log functions.

## Troubleshooting

### "User with this email already exists"
The email address is already registered. Use a different email or update existing user.

### "Username is already taken"
The username is already in use. Choose a different username.

### "Invalid role"
Role must be one of: admin, analyst, viewer

### "Password must be at least 6 characters"
Passwords require minimum 6 characters for security.

### User can't login after creation
1. Check user status is "Active" 
2. Verify credentials are correct
3. Check password was set during creation
4. Ensure user's role is valid

## Scripts

### Seed Users (populate demo data)
```bash
node seed-users.js
```

### Clear All Users
```bash
node clear-users.js
```
⚠️ **Warning:** This deletes all users from database. Use with caution in development only.

## Security Notes

- Passwords are hashed using bcryptjs (10-salt rounds)
- Admin users cannot be deleted or have role changed to non-admin
- Soft deletes preserve audit trail (user marked inactive, not removed)
- All user management operations require admin JWT token
- Password fields are never returned in API responses
- Audit logs track all user management operations

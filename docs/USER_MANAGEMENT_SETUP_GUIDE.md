# User Management Features - Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install the new dependencies:
- `speakeasy` - TOTP/2FA generation
- `qrcode` - QR code generation

### Step 2: Run Database Migration

```bash
cd backend
npm run migrate-sqlite
```

This will create all new tables:
- `activity_logs`
- `password_reset_tokens`
- `user_sessions`
- `user_2fa`
- `user_groups`
- `user_group_members`

### Step 3: Start Backend

```bash
cd backend
npm run dev
```

Backend runs on: http://localhost:3001

### Step 4: Start Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:3000

---

## 📖 Feature Overview

### 1. User Profile Management
**Access**: Authenticated users
**Route**: `http://localhost:3000/dashboard/profile`

**Features**:
- View profile information
- Edit first name, last name, email, mobile
- Change password with current password verification

**API Endpoints**:
```
GET  /api/profile/me
PUT  /api/profile/me
POST /api/profile/change-password
```

---

### 2. Security Settings (2FA)
**Access**: Authenticated users
**Route**: `http://localhost:3000/dashboard/security`

**Features**:
- Enable/disable 2FA
- QR code scanning with authenticator apps
- Backup codes for account recovery
- 2FA status display

**Compatible Apps**:
- Google Authenticator
- Microsoft Authenticator
- Authy
- LastPass
- 1Password

**API Endpoints**:
```
GET  /api/2fa/setup
POST /api/2fa/enable
POST /api/2fa/disable
POST /api/2fa/verify
GET  /api/2fa/status
```

---

### 3. Activity & Login History
**Access**: Authenticated users (admin sees all)
**Route**: `http://localhost:3000/dashboard/activity`

**Features**:
- View all account activities
- Login history with IP addresses
- Activity summary (last 30 days)
- Action type filtering

**API Endpoints**:
```
GET /api/activity/my-activity
GET /api/activity/my-login-history
GET /api/activity/my-summary
GET /api/activity/all (admin only)
GET /api/activity/user/:userId (admin only)
```

---

### 4. User Groups Management
**Access**: Admin users only
**Route**: `http://localhost:3000/dashboard/groups`

**Features**:
- Create/edit/delete user groups
- Add/remove group members
- Assign member roles (member, admin)
- View all groups and user's groups

**API Endpoints**:
```
POST   /api/groups
GET    /api/groups
GET    /api/groups/:groupId
PUT    /api/groups/:groupId
DELETE /api/groups/:groupId
POST   /api/groups/:groupId/members
DELETE /api/groups/:groupId/members/:userId
GET    /api/groups/:groupId/members
GET    /api/groups/my-groups
```

---

### 5. Permission-Based UI
**Access**: All authenticated users
**Implementation**: usePermissions hook

**Features**:
- Role-based feature access
- Dynamic UI element visibility
- Permission validation on API calls

**Usage Example**:
```jsx
import { usePermissions } from '@/hooks/usePermissions';

export default function Component() {
  const { hasPermission, canAccessResource } = usePermissions();

  if (!hasPermission('user_stories', 'create')) {
    return <div>You don't have permission to create user stories</div>;
  }

  return <div>Create User Story Button</div>;
}
```

---

### 6. Password Reset
**Access**: Public (no auth required)

**API Endpoints**:
```
POST /api/password-reset/request
GET  /api/password-reset/verify/:token
POST /api/password-reset/reset
```

**Flow**:
1. User requests reset via `/password-reset/request`
2. System sends email with reset link (in development, returns token)
3. User verifies token via `/password-reset/verify/:token`
4. User resets password via `/password-reset/reset`

---

## 🧪 Testing with Demo Users

### Admin Account
```
Email: admin@example.com
Password: Admin@123
Role: Admin
```
- Can create/manage users
- Can view all activities
- Can manage groups
- Full access to all features

### Analyst Account
```
Email: analyst@example.com
Password: Analyst@123
Role: Analyst
```
- Can create content
- Can view own activities
- Limited group access
- Can edit own profile

### Viewer Account
```
Email: viewer@example.com
Password: Viewer@123
Role: Viewer
```
- Read-only access
- Can view own activities
- Can edit own profile
- No admin features

---

## 🔍 Testing Individual Features

### Test 2FA Setup
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/2fa/setup
```

### Test Profile Update
```bash
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com"
  }' \
  http://localhost:3001/api/profile/me
```

### Test Password Reset Request
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}' \
  http://localhost:3001/api/password-reset/request
```

### Test Get Activities
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/activity/my-activity
```

### Test Create Group (Admin)
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Engineering",
    "description":"Engineering team"
  }' \
  http://localhost:3001/api/groups
```

---

## 📊 Database Schema

### activity_logs
```sql
id, user_id, action_type, description, ip_address, 
user_agent, resource_type, resource_id, created_at
```

### password_reset_tokens
```sql
id, user_id, token, expires_at, used_at, created_at
```

### user_sessions
```sql
id, user_id, token, ip_address, user_agent, 
last_activity, expires_at, created_at
```

### user_2fa
```sql
id, user_id, secret, is_enabled, backup_codes, 
created_at, updated_at
```

### user_groups
```sql
id, name, description, created_by, created_at, updated_at
```

### user_group_members
```sql
id, group_id, user_id, role, added_at
```

---

## 🐛 Troubleshooting

### 2FA QR Code Not Showing
- Ensure `qrcode` package is installed: `npm install qrcode`
- Clear browser cache and reload
- Check browser console for errors

### Password Reset Token Expired
- Tokens expire after 1 hour
- Request a new reset token
- Use `cleanup-tokens` endpoint to remove expired tokens

### Activity Not Logging
- Ensure activity routes are registered in `server.js`
- Check if user is authenticated
- Verify database connection

### Group Creation Error
- Only admins can create groups
- Group name must be unique
- Check user role in profile

### 2FA Not Disabling
- Try with different browser
- Check database for orphaned 2FA records
- Verify user authentication token

---

## 📚 Documentation Files

- `USER_MANAGEMENT_ADVANCED_FEATURES.md` - Feature documentation
- `USER_MANAGEMENT_READY.md` - Previous implementation
- `USER_MANAGEMENT_COMPLETE_GUIDE.md` - Complete guide

---

## ✅ Verification Checklist

- [ ] Backend dependencies installed
- [ ] Database migration successful
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can login with demo credentials
- [ ] Profile page loads and is editable
- [ ] Security page shows 2FA setup
- [ ] Activity page displays login history
- [ ] Groups page visible for admin
- [ ] No console errors in browser dev tools

---

## 🎯 Next: Backend Integration

To fully activate these features, you need to:

1. **Update Auth Controller** - Log login/logout activities
2. **Add Activity Logging** - Log all user actions in controllers
3. **Integrate Session Management** - Use session tokens in login
4. **Add Email Service** - Send password reset/2FA emails

---

**Ready to use!** Start the servers and navigate to your dashboard.

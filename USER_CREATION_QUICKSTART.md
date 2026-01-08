# User Creation & Management - Quick Start

## 🎯 What Was Added

### Frontend Features
✅ **"Add User" Button** - Added to Admin → Users page  
✅ **Create User Form Modal** - New user creation interface  
✅ **Role Selection** - Choose from Admin/Analyst/Viewer roles  
✅ **Password Input** - Secure password creation  
✅ **Edit User Form** - Updated to distinguish create vs edit modes  

### Backend Features
✅ **createUser Endpoint** - POST /api/users  
✅ **Input Validation** - Email/username uniqueness, required fields  
✅ **Password Hashing** - Secure bcryptjs hashing  
✅ **Audit Logging** - Automatic logging of user creation  
✅ **Admin-Only Access** - Only admins can create users  

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

### Step 2: Start the Frontend  
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

### Step 3: Seed Demo Users (Optional)
```bash
cd backend
node seed-users.js
```

**Demo Credentials:**
- Email: admin@example.com
- Password: Admin@123

### Step 4: Login as Admin
1. Go to http://localhost:3000
2. Login page (redirect)
3. Enter: admin@example.com / Admin@123

### Step 5: Create New User
1. Click "Admin" in sidebar (visible only to admins)
2. Select "Users"
3. Click blue "Add User" button
4. Fill form:
   - First Name: John
   - Last Name: Smith
   - Email: john.smith@example.com ⭐
   - Username: johnsmith ⭐
   - Password: SecurePass123 ⭐
   - Role: Analyst
5. Click "Create User"

## 📋 Form Fields Explained

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | Text | No | Display name |
| Last Name | Text | No | Display name |
| Email | Email | Yes | Must be unique |
| Username | Text | Yes (create only) | Must be unique, for API/CLI access |
| Password | Password | Yes (create only) | Min 6 characters, hashed with bcryptjs |
| Role | Select | Yes | admin / analyst / viewer |
| Status | Select | No (edit only) | Active or Inactive |

## 🔐 Role Permissions

**Admin (22 permissions)**
- Full system access
- Manage all users and content
- View audit logs

**Analyst (13 permissions)**  
- Create/edit user stories, BRDs, documents, templates
- Cannot manage users

**Viewer (5 permissions)**
- Read-only access to content
- No creation/editing

## 🧪 Testing User Creation

### Via Frontend (Recommended)
```
1. Login as admin
2. Go to Admin → Users
3. Click "Add User"
4. Fill form and submit
```

### Via API (Testing)
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPass123",
    "role": "analyst"
  }'
```

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can login as admin@example.com
- [ ] Admin section visible in sidebar
- [ ] "Add User" button appears on Users page
- [ ] Form modal opens when clicking button
- [ ] Can fill form and submit
- [ ] New user appears in users table
- [ ] Can edit newly created user
- [ ] Can change user role
- [ ] Can deactivate user
- [ ] Can see permissions page with role breakdowns

## 🐛 Troubleshooting

### "Email already exists"
- Email must be unique
- Use different email or delete old user

### "Username already taken"
- Username must be unique  
- Try different username

### "Password must be at least 6 characters"
- Use password with 6+ characters

### Button doesn't appear
- Check you're logged in as admin
- Admin user must have role='admin' in database
- Clear browser cache and refresh

### Form won't submit
- Check all required fields are filled
- Check browser console for errors
- Check backend logs for error messages

## 📂 Files Modified

### Frontend
- `frontend/app/dashboard/admin/users/page.jsx` - Added create user modal and form

### Backend (Already Done)
- `backend/src/controllers/userManagementController.js` - Added createUser function
- `backend/src/routes/userManagementRoutes.js` - Added POST /api/users route

### New Utilities
- `backend/seed-users.js` - Populate demo users
- `backend/clear-users.js` - Clear all users (dev only)
- `USER_MANAGEMENT_GUIDE.md` - Comprehensive documentation

## 🔗 Related Documentation

- [User Management Guide](./USER_MANAGEMENT_GUIDE.md) - Full API reference
- [RBAC Configuration](./IMPLEMENTATION_SUMMARY.md) - Role definitions
- [Database Schema](./SQLITE_SETUP.md) - Table structure

## 💡 Pro Tips

1. **First User**: If no users exist, run seed-users.js to create demo accounts
2. **Bulk Operations**: Use seed script instead of creating one-by-one
3. **Testing**: Use analyst/viewer accounts to test role-based features
4. **Audit Trail**: All user operations are logged automatically
5. **Security**: Passwords are hashed - never store plaintext

## 🎓 Next Steps

1. ✅ Backend endpoint created
2. ✅ Frontend form added  
3. ✅ Seed script provided
4. Now: Test the full flow
5. Then: Consider adding user import/export
6. Future: User profile pages, password reset, 2FA

---

**Status**: ✅ User creation feature is complete and ready to use!

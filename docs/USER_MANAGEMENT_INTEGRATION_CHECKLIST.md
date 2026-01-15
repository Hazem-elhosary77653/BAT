# Integration Checklist & Next Steps

**Date**: January 3, 2026  
**Status**: Features Implemented, Ready for Integration

---

## 🔧 Required Integration Steps

### 1. Update Authentication Flow
**File**: `backend/src/controllers/authController.js`

**What needs to be done**:
- Import session service: `const { createSession } = require('../services/sessionService');`
- Import activity service: `const { logUserActivity } = require('../services/activityService');`
- On successful login:
  - Create session record
  - Log LOGIN_SUCCESS activity
  - Return session info in response
- On logout:
  - Invalidate session token
  - Log LOGOUT activity

**Code template**:
```javascript
// In login function after successful auth
const session = await createSession(user.id, token, req.ip, req.headers['user-agent']);
await logUserActivity(user.id, 'LOGIN_SUCCESS', 'User logged in successfully', {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

---

### 2. Auto-Activity Logging
**Affected Files**: All controllers in `backend/src/controllers/`

**What needs to be done**:
- Add activity logging to key operations:
  - User creation (USER_CREATED)
  - User updates (USER_UPDATED)
  - User deletion (USER_DELETED)
  - Document uploads (DOCUMENT_UPLOADED)
  - Report generation (REPORT_GENERATED)
  - Settings changes (SETTINGS_CHANGED)

**Pattern**:
```javascript
const { logUserActivity } = require('../services/activityService');

// In your controller function
await logUserActivity(
  req.user.id,
  'ACTION_TYPE',
  'Description of action',
  {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    resourceType: 'document',
    resourceId: documentId
  }
);
```

---

### 3. Session Token Integration
**File**: `backend/src/middleware/authMiddleware.js`

**What needs to be done**:
- Verify token exists in user_sessions table
- Check session expiration
- Update last_activity timestamp
- Validate IP address (optional)

**Code template**:
```javascript
const { getSession, updateSessionActivity } = require('../services/sessionService');

// In authenticate middleware
const session = await getSession(token);
if (!session || new Date(session.expires_at) < new Date()) {
  return res.status(401).json({ error: 'Session expired or invalid' });
}
await updateSessionActivity(token);
```

---

### 4. Email Service Setup
**New Service**: `backend/src/services/emailService.js`

**What needs to be done**:
- Setup email provider (Nodemailer, SendGrid, Mailgun)
- Create email templates for:
  - Password reset email
  - 2FA verification email
  - Security alerts

**File to create**:
```javascript
// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  // Implementation
};

const send2FAEmail = async (email, code) => {
  // Implementation
};

module.exports = {
  sendPasswordResetEmail,
  send2FAEmail
};
```

**Update**: `backend/src/controllers/passwordResetController.js`
- Line ~32: Call emailService to send reset email

---

### 5. Frontend Navigation Updates
**Files to update**:
- `frontend/components/Sidebar.jsx` - Add links to new pages
- `frontend/app/layout.jsx` - Include navigation

**Links to add**:
```
Dashboard Links:
- Profile (/dashboard/profile)
- Security (/dashboard/security)
- Activity (/dashboard/activity)
- Groups (/dashboard/groups) - admin only
```

---

### 6. Fix Small Frontend Issues

**Issue 1**: usePermissions hook has typo
**File**: `frontend/hooks/usePermissions.js`
**Line 9**: Change `accessible Resources` to `accessibleResources`
**Line 10**: Change `setAccessible Resources` to `setAccessibleResources`

**Issue 2**: Profile page missing UI imports
**File**: `frontend/app/dashboard/profile/page.jsx`
**Add**: Import Button and form components from your UI library

**Issue 3**: Activity page icon mapping could be expanded
**File**: `frontend/app/dashboard/activity/page.jsx`
**Add**: More action types as they get used

---

### 7. Update Backend Server Registration
**File**: Already done in `backend/src/server.js`
✅ Routes already registered - No action needed

---

## 📋 Testing Checklist

### Backend Testing
- [ ] Test profile update API
  ```bash
  curl -X PUT -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test"}' \
    http://localhost:3001/api/profile/me
  ```

- [ ] Test 2FA setup
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/api/2fa/setup
  ```

- [ ] Test activity logging
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/api/activity/my-activity
  ```

- [ ] Test group creation (admin)
  ```bash
  curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"TestGroup"}' \
    http://localhost:3001/api/groups
  ```

### Frontend Testing
- [ ] Login and navigate to /dashboard/profile
- [ ] Update profile information
- [ ] Change password
- [ ] Navigate to /dashboard/security
- [ ] Setup 2FA (will need authenticator app)
- [ ] Navigate to /dashboard/activity
- [ ] View login history
- [ ] (Admin) Navigate to /dashboard/groups
- [ ] (Admin) Create new group

### Database Testing
- [ ] Verify new tables created
  ```sql
  sqlite3 database.db ".tables"
  ```

- [ ] Check activity logs
  ```sql
  SELECT COUNT(*) FROM activity_logs;
  ```

- [ ] Check user sessions
  ```sql
  SELECT * FROM user_sessions LIMIT 5;
  ```

---

## 🚨 Known Issues & Limitations

### 1. Email Functionality Not Implemented
- Password reset emails are not sent
- In development mode, tokens are returned in response
- Need to configure email service

### 2. 2FA Not Integrated in Login Flow
- 2FA can be enabled/disabled but not enforced at login
- Need to add 2FA verification step in authentication

### 3. Activity Logging Not Auto-Enabled
- Need to manually add logging to all controllers
- Logging calls won't work until authController is updated

### 4. Session Management Not Enforced
- Sessions are created but not validated
- Need to update authMiddleware

### 5. Frontend UI Components
- Assumes existence of Card, Input, Button components
- May need to adjust imports based on your UI library

---

## 🔄 Implementation Order (Recommended)

### Phase 1: Core Functionality (Day 1)
1. Fix migration to add new tables
2. Run database migration
3. Install dependencies (npm install)
4. Test backend API endpoints manually
5. Verify no console errors

### Phase 2: Frontend Integration (Day 2)
1. Fix usePermissions hook (typo)
2. Add sidebar navigation links
3. Test profile page
4. Test security page
5. Test activity page
6. Test groups page (admin)

### Phase 3: Backend Integration (Day 3)
1. Update authController for activity logging
2. Add session creation on login
3. Add session validation in middleware
4. Test login/logout flow
5. Verify activities are logged

### Phase 4: Email & 2FA (Day 4-5)
1. Setup email service (optional but recommended)
2. Integrate 2FA into login flow
3. Send password reset emails
4. Test complete flows
5. Security audit

---

## 📞 Troubleshooting

### Issue: "Cannot find module 'speakeasy'"
**Solution**:
```bash
cd backend
npm install speakeasy qrcode
```

### Issue: "Table does not exist" errors
**Solution**:
```bash
cd backend
npm run migrate-sqlite
```

### Issue: Profile page shows 404
**Solution**:
- Check if route is registered in server.js
- Ensure authMiddleware is applied
- Check console for import errors

### Issue: 2FA QR code not displaying
**Solution**:
- Ensure qrcode package installed
- Clear browser cache
- Check browser console for errors
- Try different browser

### Issue: Activity logs not showing
**Solution**:
- Verify activity table exists: `sqlite3 database.db "SELECT COUNT(*) FROM activity_logs;"`
- Ensure logUserActivity calls are added to controllers
- Check if authController updated

---

## 📊 Files Dependency Map

```
server.js
├── userProfileRoutes.js
│   └── userProfileController.js
│       └── userProfileService.js
├── activityRoutes.js
│   └── activityController.js
│       └── activityService.js
├── passwordResetRoutes.js
│   └── passwordResetController.js
│       └── passwordResetService.js
├── twoFARoutes.js
│   └── twoFAController.js
│       └── twoFAService.js
├── groupRoutes.js
│   └── groupController.js
│       └── groupService.js
└── permissionsRoutes.js
    └── permissionsController.js
        └── permissionChecker.js

Frontend
├── hooks/usePermissions.js
├── app/dashboard/profile/page.jsx
├── app/dashboard/security/page.jsx
├── app/dashboard/activity/page.jsx
└── app/dashboard/groups/page.jsx
```

---

## 💾 Database Backup

Before running migration:
```bash
# Backup current database
cp backend/database.db backend/database.db.backup

# Run migration
cd backend && npm run migrate-sqlite

# If issues, restore from backup
cp backend/database.db.backup backend/database.db
```

---

## 📈 Performance Considerations

- Activity logs can grow large - consider archiving old logs
- Index on user_id in activity_logs for faster queries
- Consider pagination limit for activity retrieval (currently 50-500)
- Session cleanup should run periodically (daily or weekly)

---

## 🎯 Success Criteria

When all integration steps are complete:
- ✅ All 8 features working end-to-end
- ✅ No console errors or warnings
- ✅ Database migration successful
- ✅ All new endpoints responding correctly
- ✅ Frontend pages loading and functional
- ✅ Activities being logged automatically
- ✅ Sessions tracking properly
- ✅ 2FA setup working

---

**Next**: Start with Phase 1 integration steps
**Estimated Time**: 4-5 hours for full integration
**Difficulty**: Moderate - mostly adding integration code

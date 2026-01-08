# 🚀 Deployment Checklist - Settings & Reports

**Project:** User Settings & Reports Analytics  
**Version:** 1.0  
**Date:** January 3, 2026  
**Status:** Ready for Production

---

## ✅ Pre-Deployment Verification

### Code Review
- [ ] Settings controller reviewed (`userSettingsController.js`)
- [ ] Settings routes reviewed (`userSettingsRoutes.js`)
- [ ] Settings page frontend reviewed (`settings/page.jsx`)
- [ ] Reports page frontend reviewed (`reports/page.jsx`)
- [ ] No console errors on either page
- [ ] No TypeScript errors
- [ ] Code formatting consistent
- [ ] Comments clear and helpful
- [ ] No hardcoded credentials or secrets
- [ ] No console.log() left in production code

### Security Review
- [ ] JWT authentication required on all endpoints ✅
- [ ] User data isolation verified ✅
- [ ] Password validation rules enforced ✅
- [ ] SQL injection prevention ✅
- [ ] CORS properly configured ✅
- [ ] Environment variables not exposed ✅
- [ ] Error messages don't leak sensitive info ✅
- [ ] Activity logging enabled ✅

### Database
- [ ] Migration script tested locally ✅
- [ ] Migration creates `settings` column ✅
- [ ] Default settings initialized ✅
- [ ] No data loss on migration ✅
- [ ] Backup created before production run ✅

### API Endpoints
- [ ] `GET /api/user-settings` tested ✅
- [ ] `PUT /api/user-settings` tested ✅
- [ ] `POST /api/user-settings/reset` tested ✅
- [ ] `POST /api/profile/change-password` tested ✅
- [ ] All endpoints return correct status codes ✅
- [ ] Error responses formatted correctly ✅
- [ ] Response time acceptable (< 1s) ✅

### Frontend
- [ ] Settings page loads without errors ✅
- [ ] All 5 tabs functional ✅
- [ ] Save functionality works ✅
- [ ] Reset functionality works ✅
- [ ] Password change modal functional ✅
- [ ] Toast notifications appear ✅
- [ ] Mobile responsive ✅
- [ ] Accessibility features working ✅

### Reports
- [ ] Date range filtering works ✅
- [ ] Charts update on date change ✅
- [ ] Summary cards recalculate ✅
- [ ] CSV export respects filters ✅
- [ ] Responsive on mobile ✅
- [ ] No performance issues ✅

---

## 📋 Deployment Steps

### Step 1: Database Migration (5 minutes)
**Time Window:** Off-peak hours recommended

```bash
# 1. Backup database
cp database.db database.db.backup

# 2. Run migration
cd backend
node migrate-add-settings.js

# 3. Verify output
# Expected: "✅ Settings column added successfully"
#           "🎉 Migration completed successfully!"

# 4. Check no errors
# Output should show number of users initialized
```

**Validation:**
```bash
# Verify column exists
sqlite3 database.db "PRAGMA table_info(users);"
# Should show: settings | TEXT | 0 | | NULL | 0
```

✅ **When complete:** Proceed to Step 2

---

### Step 2: Backend Deployment (5 minutes)

```bash
# 1. Stop current backend
npm stop

# 2. Pull latest changes
git pull origin main
# or if no git, copy files manually

# 3. Verify new files exist
ls backend/src/controllers/userSettingsController.js
ls backend/src/routes/userSettingsRoutes.js

# 4. Verify server.js updated
grep "user-settings" backend/src/server.js

# 5. Clear any cache
rm -rf node_modules/.cache

# 6. Start backend fresh
npm start

# 7. Check logs
# Expected: No errors, server listening on 3001
```

**Validation:**
```bash
# Test endpoint is available
curl -X GET http://localhost:3001/api/user-settings \
  -H "Authorization: Bearer TEST_TOKEN"
# Should return: 401 (unauthorized) or user settings
# NOT: 404 (endpoint not found)
```

✅ **When complete:** Proceed to Step 3

---

### Step 3: Frontend Deployment (5 minutes)

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Check for errors
# Output should show: "✓ Compiled successfully"

# 3. Deploy to production
# If using Vercel: git push will auto-deploy
# If using custom server: copy build/ to server

# 4. Clear browser cache
# Users should do Ctrl+Shift+Delete to clear cache

# 5. Test in incognito mode
# Open http://yourserver/dashboard/settings
# Should not have cached JavaScript
```

✅ **When complete:** Proceed to Step 4

---

### Step 4: Smoke Tests (10 minutes)

#### Test 4a: Settings Page Loads
1. Open `http://yourserver/dashboard`
2. Click Settings in sidebar
3. Page should load with all 5 tabs visible
4. ✅ No 404 or error messages
5. ✅ Console shows no errors (F12)

#### Test 4b: Get Settings
1. Open browser DevTools (F12)
2. Go to Network tab
3. Open Settings page (if not already)
4. Look for request: `GET /api/user-settings`
5. ✅ Status should be 200
6. ✅ Response contains `notifications`, `display`, etc.
7. ✅ Page displays default values

#### Test 4c: Save Settings
1. Go to Display tab
2. Change theme to "Dark"
3. Click "Save Changes"
4. ✅ Toast appears: "Settings saved successfully!"
5. ✅ PUT request shows 200 status
6. Refresh page
7. ✅ Theme is still "Dark" (persisted)

#### Test 4d: Change Password
1. Go to Security tab
2. Click "Change Password"
3. Modal appears
4. ✅ Modal displays correctly
5. Enter current password
6. Enter new password (8+ chars)
7. Confirm password (same as new)
8. Click "Change Password"
9. ✅ Success toast appears
10. ✅ Modal closes

#### Test 4e: Reports Page
1. Click Reports in sidebar
2. ✅ Page loads with charts
3. Change date range
4. ✅ Charts update
5. ✅ Summary cards change

#### Test 4f: Activity Logging
1. Backend logs tab (if available)
2. Look for recent logs
3. ✅ Should see `SETTINGS_UPDATE` activities
4. ✅ Should see `PASSWORD_CHANGE` activities

✅ **If all pass:** Proceed to Step 5

---

## 🆘 Rollback Plan

If issues occur during deployment:

### Quick Rollback (< 5 minutes)

```bash
# 1. Stop backend
npm stop

# 2. Restore database backup
cp database.db.backup database.db

# 3. Restore previous backend code
git checkout HEAD~1 backend/
# OR manually remove userSettingsRoutes.js from server.js

# 4. Restart backend
npm start

# 5. Restore previous frontend code
git checkout HEAD~1 frontend/
# OR rebuild from previous version
npm run build
```

### Database Rollback

```bash
# If migration failed:
sqlite3 database.db
# Remove column if added
ALTER TABLE users DROP COLUMN settings;
# Or restore from backup
.quit
cp database.db.backup database.db
```

---

## 📊 Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error logs every 4 hours
- [ ] Check user reports of Settings page issues
- [ ] Monitor API response times
- [ ] Watch for database size growth
- [ ] Track user activity logging volume

### Key Metrics to Watch

```
✅ API Response Time: Should be < 500ms
✅ Error Rate: Should be < 0.1%
✅ Database Query Time: Should be < 100ms
✅ Settings Load Time: Should be < 1s
✅ User Activity Logs: Should be recorded for all changes
```

### Error Logs to Check

```bash
# Backend logs
# Should NOT see:
#   - 500 Internal Server Error
#   - Database connection errors
#   - Undefined routes
#   - ENOENT (file not found)
#   - ECONNREFUSED (connection refused)

# Frontend logs (browser console)
# Should NOT see:
#   - 404 responses
#   - undefined is not a function
#   - Network errors
#   - CORS errors
```

---

## 📈 Performance Baseline

Record these before and after deployment:

```
Metric                          Target      Current
────────────────────────────────────────────────────
Settings Page Load              < 2s        ___
Settings Save Response          < 1s        ___
Reports Page Load               < 2s        ___
Charts Update Speed             < 500ms     ___
Database Query Time             < 100ms     ___
API Response (avg)              < 500ms     ___
Error Rate                      < 0.1%      ___
Uptime                          99.9%       ___
```

---

## 🔍 Common Issues & Fixes

### Issue: 404 on /api/user-settings

**Cause:** Route not added to server.js

**Fix:**
```javascript
// In backend/src/server.js, add:
app.use('/api/user-settings', require('./routes/userSettingsRoutes'));
// Then restart backend: npm stop && npm start
```

---

### Issue: "Cannot GET /dashboard/settings"

**Cause:** Frontend not deployed or route not found

**Fix:**
1. Verify frontend build completed successfully
2. Check settings page file exists: `frontend/app/dashboard/settings/page.jsx`
3. Clear browser cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R

---

### Issue: Settings not saving (timeout)

**Cause:** Database query too slow or connection issue

**Fix:**
1. Check database is not locked by another process
2. Verify migration completed successfully
3. Check database size (PRAGMA page_count)
4. Restart backend to reset connections

---

### Issue: Password change fails with "Current password incorrect"

**Cause:** Password hash verification failing

**Fix:**
1. Verify user knows their current password (test login)
2. Check `/api/profile/change-password` endpoint exists
3. Verify `userProfileController.js` has password verification logic
4. Check password hashing algorithm matches login logic

---

### Issue: Modal doesn't appear for password change

**Cause:** React state or modal component issue

**Fix:**
1. Check browser console for JavaScript errors
2. Clear browser cache
3. Verify `useState` hook includes `showPasswordModal` state
4. Check click handler calls `setShowPasswordModal(true)`

---

### Issue: Reports charts don't update on date change

**Cause:** useEffect dependencies missing dateRange

**Fix:**
```javascript
// In frontend/app/dashboard/reports/page.jsx, verify:
useEffect(() => {
  // ... code
}, [user, router, dateRange, reportType]);  // ← includes dateRange
```

---

## ✅ Sign-Off Checklist

Before considering deployment complete:

### Developer Sign-Off
- [ ] All code reviewed and approved
- [ ] No TODOs or FIXMEs left
- [ ] Tests pass locally
- [ ] Smoke tests pass on staging

### QA Sign-Off
- [ ] Functional tests completed
- [ ] Regression tests passed
- [ ] Mobile testing completed
- [ ] Accessibility testing passed
- [ ] Performance benchmarks met

### DevOps Sign-Off
- [ ] Database migration tested
- [ ] Backup created and verified
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alerts configured

### Product Sign-Off
- [ ] User requirements met
- [ ] Documentation accurate
- [ ] Feature complete
- [ ] Ready for users

---

## 📞 Support Escalation

If critical issue occurs:

**Level 1 (15 min):** Developer on-call troubleshoots

**Level 2 (30 min):** Database admin reviews migration

**Level 3 (45 min):** Rollback initiated if not resolved

**Contact:** [emergency-contact-info]

---

## 📝 Post-Deployment Notes

```
Deployment Date: _______________
Deployed By: ____________________
Approval: ______________________
Duration: _____ minutes
Issues: ________________________
________________________________________
Resolution: _____________________________
________________________________________

First User Report: ___________________
Date/Time: _____________________________
Issue: __________________________________
Resolution: _____________________________
```

---

## 🎉 Success Criteria

Deployment is successful when:

✅ Database migration completed without errors  
✅ All 3 new API endpoints respond 200 OK  
✅ Settings page loads and displays correctly  
✅ Save functionality works end-to-end  
✅ Password change functionality works  
✅ Reports page still works correctly  
✅ No errors in production logs  
✅ Performance within acceptable limits  
✅ Mobile responsive works  
✅ Users can access their settings  

---

**Deployment Status:** Ready  
**Last Updated:** January 3, 2026  
**Version:** 1.0


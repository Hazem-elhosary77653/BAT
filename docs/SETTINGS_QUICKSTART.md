# 🚀 Settings & Reports - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Database Migration (1 min)
```bash
cd backend
node migrate-add-settings.js
```
✅ Adds `settings` column to users table and initializes defaults

### Step 2: Restart Backend (1 min)
```bash
npm stop
npm start
```
✅ Loads new routes and middleware

### Step 3: Test Settings Page (2 min)
1. Login to dashboard
2. Click profile icon → Settings
3. Try changing theme to Dark
4. Click Save Changes
5. Refresh page
6. Verify theme persisted

### Step 4: Test Reports Page (1 min)
1. Click Reports in sidebar
2. Change date range
3. Verify charts update
4. Export CSV

---

## 📍 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/user-settings` | Load user's settings |
| PUT | `/api/user-settings` | Save settings changes |
| POST | `/api/user-settings/reset` | Reset to defaults |
| POST | `/api/profile/change-password` | Change password |

---

## 🎯 Quick Features

### Settings Page
- 5 tabs: Notifications, Display, Privacy, Accessibility, Security
- Save changes with one click
- Reset to defaults anytime
- Change password in modal
- All data persists

### Reports Page
- Filter by date range
- Charts update dynamically
- Export CSV with filters applied
- Summary statistics
- Activity breakdown

---

## ✅ Verification

**Settings Working?**
- Navigate to Dashboard → Settings
- Change any setting
- Click Save Changes
- See success toast
- Refresh page
- Setting still changed = ✅

**Reports Working?**
- Navigate to Dashboard → Reports
- Change date range
- Charts update = ✅
- Export CSV = ✅

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on Settings | Run migration, restart backend |
| Settings not saving | Check network tab, verify token |
| Password change fails | Verify current password correct |
| Reports not updating | Refresh page, check date range |

---

## 📚 Documentation

- 📖 **Full API Docs:** `API_ENDPOINTS_DOCUMENTATION.md`
- 📋 **Feature Guide:** `SETTINGS_PAGE_GUIDE.md`
- ✅ **Testing Checklist:** `SETTINGS_REPORTS_TESTING_CHECKLIST.md`
- 📊 **Verification Report:** `REPORTS_SETTINGS_VERIFICATION.md`

---

**Status:** ✅ Production Ready
**Setup Time:** ~5 minutes
**All Tests Pass:** Yes

# 🔍 دليل اختبار الإصلاحات - Testing Guide for Fixes

## 📋 قائمة الاختبارات المطلوبة

> **ملاحظة هامة:** يجب إعادة تشغيل Backend بعد أي تعديل على الكود:
> ```bash
> # في terminal منفصل
> cd backend
> npm start
> ```

---

## 🚀 اختبار سريع للتحقق من الإصلاحات

قبل الاختبار اليدوي، نفذ هذا الأمر للتحقق من حالة Database:

```bash
node backend/test-fixes.js
```

يجب أن ترى:
- ✅ Users with avatars status
- ✅ 2FA enabled/disabled for each user
- ✅ Active sessions
- ✅ Admin settings (timeout, theme, etc.)
- ✅ Database schema verification

---

## 🌐 Available Routes

### Profile & Settings
- **URL:** `http://localhost:3000/dashboard/profile`
- **Access:** All authenticated users
- **Navigation:** Click "Profile" in Header dropdown menu (not sidebar)

### Reports & Analytics
- **URL:** `http://localhost:3000/dashboard/reports`
- **Access:** Admin users only (redirects to dashboard for non-admins)
- **Navigation:** Click "Reports" in sidebar menu

---

## 🧪 Testing Checklist

### Profile Page
- [ ] Page loads with user data
- [ ] Edit mode toggles on/off
- [ ] Profile fields are editable in edit mode
- [ ] Save changes submits PUT request to `/users/:id`
- [ ] Notification preferences toggle and save
- [ ] Theme toggle works (light/dark)
- [ ] Language dropdown shows all 5 options
- [ ] Password change form validates:
  - [ ] Requires all fields
  - [ ] Minimum 8 characters
  - [ ] Passwords match confirmation
  - [ ] Shows/hides password on eye icon click
- [ ] Devices list loads from `/auth/sessions`
- [ ] Current device has badge
- [ ] Logout button works on individual devices
- [ ] Logout All button shows confirmation
- [ ] Toast notifications appear on success/error
- [ ] Responsive layout works on mobile/tablet

### Reports Page
- [ ] Page only accessible to admin users
- [ ] Date range filters work
- [ ] Report type dropdown works
- [ ] Summary cards display correct counts
- [ ] Charts render with real data
- [ ] Activity trends chart shows 7 days
- [ ] Action breakdown shows 4 bars
- [ ] Export CSV button downloads file
- [ ] Export PDF buttons work
- [ ] Activities table shows last 10 records
- [ ] Refresh button reloads data
- [ ] Loading spinners appear during fetch
- [ ] Error handling shows toast messages
- [ ] Responsive layout works on mobile/tablet

---

## 📊 Sample Data Expected

### Profile Page Response
```json
{
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "bio": "Software engineer and product manager",
    "avatar": "https://..."
  }
}
```

### Settings Response
```json
{
  "data": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "weekly_digest": true
    },
    "theme": "light",
    "language": "en"
  }
}
```

### Sessions Response
```json
{
  "data": [
    {
      "id": "session-123",
      "device_name": "Chrome on MacBook",
      "last_activity": "2024-01-03T10:30:00Z",
      "is_current": true
    },
    {
      "id": "session-456",
      "device_name": "Safari on iPhone",
      "last_activity": "2024-01-02T15:45:00Z",
      "is_current": false
    }
  ]
}
```

### Reports Data Response
```json
{
  "data": [
    {
      "id": "activity-1",
      "action_type": "USER_LOGIN",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "description": "Logged in successfully",
      "created_at": "2024-01-03T10:30:00Z"
    }
    // ... more activities
  ]
}
```

---

## 🔍 Debugging Tips

### Profile Page Issues
1. **Page not loading:** Check if user is authenticated (`useAuthStore`)
2. **Settings not saving:** Verify `/settings` endpoint exists
3. **Devices list empty:** Check `/auth/sessions` endpoint
4. **Password validation failing:** Ensure API returns proper error messages

### Reports Page Issues
1. **"Access Denied" redirect:** Check `user.role === 'admin'`
2. **No chart data:** Verify `/activity/all` returns activities with `created_at`
3. **Export not working:** Check browser console for errors
4. **Summary cards showing 0:** Check activity action_type filtering logic

---

## 💾 Browser Console Commands

```javascript
// Check current user
JSON.stringify(useAuthStore.getState().user, null, 2)

// Manually trigger profile save
// (from browser dev tools in page)
handleProfileSave()

// Test localStorage
localStorage.getItem('auth-storage')
```

---

## 🔐 Authentication Flow

1. User must be logged in
2. Profile page accessible to all authenticated users
3. Reports page checks `user.role === 'admin'`
4. Non-admin users redirected to `/dashboard`
5. All API calls include auth token from store

---

## 📱 Mobile Testing

### Sidebar Behavior
- On mobile: Sidebar collapses
- Hamburger menu visible
- Profile and Reports links still accessible

### Form Layout
- Profile: Single column on mobile
- Reports: Stacked filters on mobile
- Charts: Responsive width

---

## 🎯 Expected User Flows

### Profile Update Flow
1. User navigates to Profile page
2. Sees current profile data (name, email, phone, location, bio)
3. Clicks Edit button
4. Updates desired fields
5. Clicks Save Changes
6. Success toast appears
7. Profile is updated in API
8. Edit mode closes

### Password Change Flow
1. User scrolls to Password section
2. Enters current password
3. Enters new password (minimum 8 characters)
4. Confirms new password
5. Clicks Change Password
6. API validates and updates
7. Success message shown
8. Form clears

### Report Generation Flow
1. Admin navigates to Reports page
2. Filters load with last 30 days default
3. Summary cards calculate from activities
4. Charts render 7-day trend
5. User can adjust date range
6. Reports update with new data
7. User clicks Export CSV
8. CSV file downloads to computer

---

## ✅ Acceptance Criteria

- [x] Profile page fully functional with all sections
- [x] Reports page shows real data with proper formatting
- [x] Navigation integrated into sidebar
- [x] Responsive design works on all screen sizes
- [x] Error handling with user feedback
- [x] Loading states during data fetch
- [x] Admin access control on Reports page
- [x] API integration with fallback error handling

---

## 🚀 Deployment Ready

**Prerequisites:**
- [ ] Backend API endpoints implemented
- [ ] Database migrations completed
- [ ] Authentication system working
- [ ] Environment variables configured

**Post-Deployment:**
- [ ] Test all features in production
- [ ] Monitor API response times
- [ ] Check browser console for errors
- [ ] Verify mobile experience
- [ ] Test with various user roles

# User Management Testing Guide

## 📋 Pre-Test Checklist

### System Status
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:3000
- ✅ Database migrated with all tables
- ✅ Session tracking enabled

### Test Accounts Available
```
Admin Account:
  Email: admin@example.com
  Password: password123
  Role: Administrator

Analyst Account:
  Email: analyst@example.com
  Password: password123
  Role: Business Analyst

Viewer Account:
  Email: viewer@example.com
  Password: password123
  Role: Viewer
```

---

## 🧪 Test Scenarios

### 1. **User Management - Admin Users Page**

**Location**: http://localhost:3000/dashboard/admin/users

#### 1.1 Test Create User
- [ ] Click "Add User" button
- [ ] Modal opens with form fields
- [ ] Fill in:
  - First Name: "Test"
  - Last Name: "User"
  - Email: "test@example.com"
  - Username: "testuser"
  - Password: "TestPass123!"
  - Role: "analyst"
- [ ] Click "Create User"
- [ ] ✅ Toast shows "User created successfully"
- [ ] New user appears in table

#### 1.2 Test Search & Filter
- [ ] Type in search box "test"
- [ ] Table filters to show only matching users
- [ ] Pagination resets to page 1
- [ ] Clear search and all users return

#### 1.3 Test Pagination
- [ ] Verify "Showing 1 to 10 of X items"
- [ ] Click next page button
- [ ] Page number changes
- [ ] Users update to show next 10
- [ ] Click previous page
- [ ] Table updates correctly

#### 1.4 Test Edit User
- [ ] Click Edit (pencil) icon on any user
- [ ] Modal opens with user data filled
- [ ] Change first name to "Updated"
- [ ] Click "Save Changes"
- [ ] ✅ Toast shows "User updated successfully"
- [ ] Table updates with new first name

#### 1.5 Test Change Role
- [ ] Click role dropdown for a user
- [ ] Select different role (admin/analyst/viewer)
- [ ] Role updates immediately
- [ ] ✅ Toast shows "User role updated successfully"

#### 1.6 Test Reset Password
- [ ] Click Key icon (reset password)
- [ ] Confirm dialog appears
- [ ] Confirm action
- [ ] Alert shows new random password
- [ ] ✅ Toast shows "Password copied to clipboard!"
- [ ] Can paste password from clipboard

#### 1.7 Test Toggle Active Status
- [ ] Click Active/Inactive button
- [ ] Confirm dialog appears
- [ ] Confirm action
- [ ] Button status changes
- [ ] ✅ Toast shows success message

#### 1.8 Test Delete User
- [ ] Click Delete (trash) icon
- [ ] Confirm dialog appears
- [ ] Confirm deletion
- [ ] ✅ Toast shows "User deleted successfully"
- [ ] User removed from table

#### 1.9 Test Breadcrumb Navigation
- [ ] Verify breadcrumb shows: "Dashboard > Admin > User Management"
- [ ] Click "Admin" link
- [ ] Navigates to /dashboard/admin
- [ ] Click "Dashboard" link
- [ ] Navigates to /dashboard

#### 1.10 Test Error Handling
- [ ] Try creating user with duplicate email
- [ ] ✅ Toast shows error message from backend
- [ ] Try form with missing required field
- [ ] Toast shows validation error

---

### 2. **User Profile Page**

**Location**: http://localhost:3000/dashboard/profile

#### 2.1 Test View Profile
- [ ] Page loads with current user info
- [ ] ✅ Toast shows "Profile loaded successfully"
- [ ] First name, last name, email, mobile displayed
- [ ] Breadcrumb shows "Dashboard > My Profile"

#### 2.2 Test Update Profile
- [ ] Change first name to "Updated"
- [ ] Change mobile to "+1 (555) 123-4567"
- [ ] Click "Save Changes"
- [ ] ✅ Toast shows "Profile updated successfully"
- [ ] Fields remain with new values
- [ ] Reload page - changes persist

#### 2.3 Test Change Password
- [ ] Enter current password
- [ ] Enter new password: "NewPass123!"
- [ ] Confirm password: "NewPass123!"
- [ ] Click "Change Password"
- [ ] ✅ Toast shows "Password changed successfully"
- [ ] Form clears
- [ ] Try to login with new password ✅

#### 2.4 Test Toast Notifications
- [ ] Verify success toast appears top-right
- [ ] Auto-dismisses after 4 seconds
- [ ] Can manually close with X button
- [ ] Check error toast on validation failure

---

### 3. **User Sessions**

**Location**: Backend sessions endpoint

#### 3.1 Test Login Creates Session
- [ ] Login as admin@example.com
- [ ] Check backend logs (Session created message)
- [ ] GET /api/sessions should return active session

#### 3.2 Test Session Data
- [ ] Call GET /api/sessions
- [ ] Response should include:
  - `total`: Total session count
  - `active`: Active session count
  - `sessions`: Array of sessions with:
    - `ipAddress`: IP of login
    - `userAgent`: Browser/device info
    - `loginTime`: When logged in
    - `lastActivity`: Last activity time
    - `status`: "Active" or "Inactive"

#### 3.3 Test Multiple Sessions
- [ ] Login from different browser/incognito
- [ ] GET /api/sessions shows 2+ sessions
- [ ] All marked as active
- [ ] Different IP addresses or user agents

---

### 4. **UI/UX Components**

#### 4.1 Toast Component
- [ ] Success toast: Green with checkmark icon ✅
- [ ] Error toast: Red with alert icon ✅
- [ ] Warning toast: Orange with warning icon ✅
- [ ] Smooth slide-in animation from right ✅
- [ ] Auto-dismisses after configured time ✅

#### 4.2 Breadcrumb Component
- [ ] Shows correct navigation path
- [ ] Links are clickable and navigate correctly
- [ ] Home icon at start
- [ ] Chevron separators between items
- [ ] Last item not clickable (current page)

#### 4.3 Pagination Component
- [ ] Shows item count "Showing X to Y of Z"
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Page numbers clickable
- [ ] Smart ellipsis for many pages
- [ ] Current page highlighted

#### 4.4 Modal Component
- [ ] Opens with animation
- [ ] Header with title and close button
- [ ] Content scrollable if needed
- [ ] Close button works (X icon)
- [ ] Click outside doesn't close
- [ ] Proper z-index (appears above page)

---

### 5. **Loading States**

#### 5.1 Test Form Loading
- [ ] Click "Save Changes"
- [ ] Button text changes to "Saving..."
- [ ] Button disabled (grayed out)
- [ ] Request in progress
- [ ] After response, button returns to normal

#### 5.2 Test Page Loading
- [ ] Navigate to user management
- [ ] Loading spinner appears
- [ ] "Loading users..." text shows
- [ ] After ~1 second, content loads

---

### 6. **Error Handling**

#### 6.1 Test API Error
- [ ] Stop backend server
- [ ] Try to load user management
- [ ] ✅ Toast shows "Failed to fetch users"
- [ ] No hard crash, graceful error

#### 6.2 Test Validation Error
- [ ] Try to create user without password
- [ ] ✅ Toast shows "Password is required"
- [ ] Modal stays open

#### 6.3 Test Network Error
- [ ] Open DevTools Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Perform action
- [ ] Loading state shows
- [ ] Eventually succeeds or fails gracefully

---

## ✅ Testing Checklist

### User Management Page
- [ ] Breadcrumb navigation works
- [ ] Search filters users correctly
- [ ] Pagination displays 10 per page
- [ ] Create user modal works
- [ ] Edit user modal works
- [ ] Delete user works
- [ ] Reset password works
- [ ] Change role works
- [ ] Toggle status works
- [ ] Toast notifications appear
- [ ] Error handling works

### Profile Page
- [ ] Profile loads with user data
- [ ] Can update profile information
- [ ] Can change password
- [ ] Breadcrumb shows correct path
- [ ] Toast notifications work
- [ ] Email field is read-only

### Session Management
- [ ] Session created on login
- [ ] Session data stored in database
- [ ] Can retrieve active sessions
- [ ] Multiple sessions tracked

### Components
- [ ] Toast slides in smoothly
- [ ] Breadcrumb links work
- [ ] Pagination controls work
- [ ] Modal displays correctly
- [ ] Loading states show

### Error Handling
- [ ] API errors show toast
- [ ] Validation errors caught
- [ ] Network errors handled
- [ ] User feedback clear

---

## 🐛 Known Issues

*(None currently - report any issues found)*

---

## 📝 Test Results

### Date: _______________
### Tester: _______________

#### Issues Found:
1. 
2. 
3. 

#### Notes:


---

## 🚀 Next Steps After Testing

If all tests pass:
1. Create bulk user import (CSV)
2. Add activity tracking integration
3. Implement 2FA login flow
4. Create session management UI page
5. Add email notifications


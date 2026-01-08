# 2FA & Email Integration - Quick Testing Checklist

**Status**: Ready for Testing  
**Last Updated**: January 3, 2026

---

## 🧪 Quick Start Testing

### **Prerequisites**
- Backend running on port 3001
- Frontend running on port 3000
- User accounts seeded (admin@example.com, analyst@example.com, etc.)
- 2FA already configured in database (migration ran)

### **Step 1: Verify Backend Started Successfully**

```bash
Backend logs should show:
✅ Connected to SQLite database
✅ OpenAI client initialized
✅ Email service initialized (or warning if not configured)
✅ Server running on port 3001
```

### **Step 2: Test 2FA Setup**

1. **Open browser**: http://localhost:3000
2. **Login**: admin@example.com / Admin@123
3. **Navigate**: Dashboard → Profile → Security
4. **Enable 2FA**:
   - [ ] Click "Enable 2FA"
   - [ ] See QR code
   - [ ] Scan with authenticator app (Google Authenticator/Authy)
   - [ ] Enter 6-digit code
   - [ ] See backup codes
   - [ ] Copy and save backup codes
   - [ ] See success message

### **Step 3: Test 2FA Login**

1. **Logout**: Click Logout button
2. **Navigate**: http://localhost:3000/login
3. **Enter credentials**:
   - Email: admin@example.com
   - Password: Admin@123
   - [ ] Click Sign In
4. **2FA Modal appears**:
   - [ ] Modal shows "Two-Factor Authentication"
   - [ ] Tab options: Authenticator, Backup Code
5. **Verify with TOTP**:
   - [ ] Get 6-digit code from authenticator app
   - [ ] Enter in modal
   - [ ] Click "Verify Code"
   - [ ] See success message
   - [ ] Redirected to dashboard
6. **Verify Success**:
   - [ ] Logged in successfully
   - [ ] Can access user management

### **Step 4: Test Backup Code Login**

1. **Logout**: Click Logout button
2. **Login with credentials**: admin@example.com / Admin@123
3. **2FA Modal**: Click "Backup Code" tab
4. **Enter Backup Code**:
   - [ ] Get one saved backup code
   - [ ] Enter in field
   - [ ] Click "Verify Code"
   - [ ] See success message
   - [ ] Redirected to dashboard
5. **Verify Used Code**:
   - [ ] Backup code should not work again
   - [ ] Try same code → should fail

### **Step 5: Test Invalid 2FA Code**

1. **Login attempt**: admin@example.com / Admin@123
2. **2FA Modal**: Enter invalid code (e.g., 000000)
3. **Expected**:
   - [ ] Error message: "Invalid verification code"
   - [ ] Can retry with correct code

### **Step 6: Test 2FA Disable**

1. **Login**: With 2FA enabled account
2. **Navigate**: Dashboard → Profile → Security
3. **Disable 2FA**:
   - [ ] Click "Disable 2FA"
   - [ ] Confirm action
   - [ ] See success message
4. **Verify Disabled**:
   - [ ] Logout
   - [ ] Login again
   - [ ] [ ] NO 2FA modal appears
   - [ ] [ ] Direct login to dashboard

### **Step 7: Test Email Notifications** (If Configured)

#### **Without Email Service** (Development Mode)
- Emails logged to backend console
- Check terminal for email content

#### **With Email Service** (Production)
- Configure `.env` with email settings
- Restart backend

#### **Test User Creation Email**
1. **Login as Admin**: admin@example.com / Admin@123
2. **Navigate**: Admin → User Management
3. **Create User**:
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Username: testuser
   - Password: Test@123
   - Role: Analyst
   - [ ] Click Save
4. **Check Email**:
   - [ ] (Dev) Check backend console for email
   - [ ] (Prod) Check testuser@example.com inbox
   - [ ] Email contains: login link, temp password
5. **Verify Email Content**:
   - [ ] Subject: "Welcome to Business Analyst Assistant"
   - [ ] Contains: Email address, temporary password
   - [ ] Contains: Login link
   - [ ] Professional HTML template

---

## ✅ Advanced Testing

### **Test 2FA + Force Logout**

1. **Open 2 browser tabs**: Tab A, Tab B
2. **Tab A**: Login as admin (with 2FA)
3. **Tab B**: Login as analyst
4. **Tab B**: Navigate to Admin → User Management
5. **Tab B**: Find admin user, click Force Logout (purple Power icon)
6. **Tab A**: Should be logged out, redirected to login
7. **Expected**:
   - [ ] Tab A: "You've been logged out"
   - [ ] Tab B: Success message
   - [ ] Session terminated for all devices

### **Test Activity Tracking with 2FA**

1. **Login**: With 2FA enabled
2. **Navigate**: Admin → Activity Tracking
3. **Check Activities**:
   - [ ] Should see "USER_LOGIN" for your login
   - [ ] Should see "ROLE_CHANGED" if role was changed
   - [ ] Should see timestamps and details
4. **Search Activities**:
   - [ ] Filter by action type
   - [ ] Filter by date
   - [ ] Search by user email
   - [ ] Pagination works

### **Test Multiple Users with Different 2FA States**

1. **admin@example.com**: Has 2FA enabled ✅
2. **analyst@example.com**: No 2FA enabled ❌
3. **viewer@example.com**: Setup 2FA
4. **johndoe@example.com**: Setup and test both methods

**Test Flow**:
- [ ] admin login → requires 2FA
- [ ] analyst login → no 2FA modal
- [ ] viewer login → requires 2FA
- [ ] johndoe → can login with TOTP or backup code

---

## 📊 Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| 2FA Setup | ✅/❌ | Enable QR scan and verification |
| 2FA Login (TOTP) | ✅/❌ | Enter 6-digit code |
| 2FA Login (Backup) | ✅/❌ | Enter saved backup code |
| Invalid Code Error | ✅/❌ | Shows error message |
| 2FA Disable | ✅/❌ | Disables modal on next login |
| Force Logout | ✅/❌ | Logs out from all devices |
| User Creation Email | ✅/❌ | Sent with temp password |
| Email Template | ✅/❌ | HTML formatted, professional |
| Activity Tracking | ✅/❌ | Shows 2FA logins |

---

## 🐛 Common Issues & Solutions

### **2FA Issues**

**Problem**: "2FA is not enabled for this user"
- **Cause**: User hasn't enabled 2FA
- **Solution**: Enable in Profile → Security first

**Problem**: "Invalid verification code"
- **Cause**: Wrong code, expired, or time sync issue
- **Solution**: Regenerate code, check device clock

**Problem**: QR code not scanning
- **Cause**: Camera issues or app problem
- **Solution**: Try manual entry of secret key

### **Email Issues**

**Problem**: "Email service not configured" (warning)
- **Cause**: `.env` missing email settings
- **Solution**: Add EMAIL_USER and EMAIL_PASSWORD to `.env`
- **Note**: This is normal in development; emails logged instead

**Problem**: Emails not arriving
- **Cause**: Wrong credentials, SMTP blocked, spam folder
- **Solution**: 
  - Check `.env` EMAIL_USER and EMAIL_PASSWORD
  - For Gmail: Use App Passwords, not regular password
  - Check spam/promotions folder

**Problem**: "Invalid credentials" SMTP error
- **Cause**: Wrong password or service
- **Solution**: 
  - Gmail: Generate new App Password
  - Other services: Check SMTP settings

---

## 🚀 Next Steps After Testing

**After all tests pass**:
1. [ ] Create production `.env` with email settings
2. [ ] Test with real email (not console)
3. [ ] Configure email templates
4. [ ] Set up email backups/redundancy
5. [ ] Monitor email delivery rates
6. [ ] Test edge cases (bulk operations, errors)

---

**Ready for testing!** 🎯

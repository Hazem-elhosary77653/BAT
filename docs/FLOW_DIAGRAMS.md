# 🔄 دليل التدفق الكامل - Complete Flow Diagrams

## 1️⃣ Avatar Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AVATAR UPLOAD PROCESS                     │
└─────────────────────────────────────────────────────────────┘

    [User]
      │
      ├─ 1. Clicks "Upload Photo" button
      │
      ▼
    [File Input]
      │
      ├─ 2. Selects image file
      │
      ▼
    [Frontend Validation]
      │
      ├─ • Check if file type is image/*
      ├─ • Check if size < 5MB
      │
      ▼
    [Create FormData]
      │
      ├─ formData.append('avatar', file)
      │
      ▼
    [API Call: PUT /api/users/:userId/avatar]
      │
      ▼
    [Backend - Multer Middleware]
      │
      ├─ • Save file to /uploads/avatars/
      ├─ • Generate unique filename
      │   └─ avatar-{timestamp}-{random}.{ext}
      │
      ▼
    [Backend - Controller]
      │
      ├─ • Create avatar URL path
      ├─ • Update database: users.avatar = '/uploads/avatars/...'
      │
      ▼
    [Database Update]
      │
      ├─ UPDATE users SET avatar = ? WHERE id = ?
      │
      ▼
    [Response: { success: true, data: { avatar: '/uploads/...' } }]
      │
      ▼
    [Frontend Updates State]
      │
      ├─ setProfile({ ...profile, avatar: avatarUrl })
      │
      ▼
    [✨ IMAGE PREVIEW SHOWS IMMEDIATELY ✨]
      │
      ├─ <img src={`http://localhost:3001${profile.avatar}`} />
      │
      ▼
    [Done! ✅]
```

---

## 2️⃣ User Settings Save Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  USER SETTINGS SAVE PROCESS                  │
└─────────────────────────────────────────────────────────────┘

    [User]
      │
      ├─ 1. Changes setting (e.g., Theme to Dark)
      │
      ▼
    [Frontend State Update]
      │
      ├─ updateSetting('display', 'theme', 'dark')
      │
      ▼
    [Settings Object]
      │
      ├─ {
      │     notifications: {...},
      │     privacy: {...},
      │     display: { theme: 'dark', ... },
      │     accessibility: {...},
      │     security: {...}
      │   }
      │
      ▼
    [API Call: PUT /api/settings/]
      │
      ├─ Body: entire settings object
      │
      ▼
    [Backend Controller]
      │
      ├─ 1. Get current settings from DB
      ├─ 2. Merge with new settings
      ├─ 3. Validate (e.g., session timeout 5-1440)
      │
      ▼
    [Database Update]
      │
      ├─ UPDATE users 
      │   SET settings = JSON.stringify(updatedSettings)
      │   WHERE id = userId
      │
      ▼
    [Activity Log]
      │
      ├─ Log: 'SETTINGS_UPDATE'
      │
      ▼
    [Response: { success: true, data: updatedSettings }]
      │
      ▼
    [Frontend Updates State]
      │
      ├─ setSettings(updatedSettings)
      │
      ▼
    [Success Toast Shows]
      │
      ▼
    [Done! ✅]
```

---

## 3️⃣ 2FA Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      2FA SETUP PROCESS                       │
└─────────────────────────────────────────────────────────────┘

    [User Clicks "Enable 2FA"]
      │
      ▼
    [API Call: GET /api/2fa/setup]
      │
      ▼
    [Backend - Generate Setup]
      │
      ├─ 1. Generate Secret (speakeasy.generateSecret)
      │     └─ secret.base32
      │
      ├─ 2. Generate QR Code (QRCode.toDataURL)
      │     └─ Data URL with secret
      │
      ├─ 3. Generate 10 Backup Codes
      │     └─ crypto.randomBytes(4).toString('hex')
      │
      ▼
    [Response: { secret, qrCode, backupCodes }]
      │
      ▼
    [Frontend Shows Setup Modal]
      │
      ├─ • Display QR Code
      ├─ • Display Secret (for manual entry)
      ├─ • Display 10 Backup Codes
      ├─ • Show input field for verification code
      │
      ▼
    [User Scans QR with Google Authenticator]
      │
      ▼
    [User Enters 6-digit Code]
      │
      ▼
    [API Call: POST /api/2fa/enable]
      │
      ├─ Body: { secret, verificationCode, backupCodes }
      │
      ▼
    [Backend - Verify Code]
      │
      ├─ speakeasy.totp.verify({
      │     secret,
      │     token: verificationCode,
      │     window: 2
      │   })
      │
      ├─ If valid:
      │   └─ INSERT/UPDATE user_2fa table
      │       └─ user_id, secret, is_enabled=1, backup_codes
      │
      ▼
    [Database Updated]
      │
      ├─ user_2fa.is_enabled = 1
      │
      ▼
    [Activity Log: '2FA_ENABLED']
      │
      ▼
    [Response: { success: true }]
      │
      ▼
    [Frontend Shows Success]
      │
      ├─ "2FA enabled successfully!"
      ├─ "Save your backup codes!"
      │
      ▼
    [Done! ✅]
```

---

## 4️⃣ Login with 2FA Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN WITH 2FA PROCESS                    │
└─────────────────────────────────────────────────────────────┘

    [User Enters Email/Password]
      │
      ▼
    [API Call: POST /api/auth/login]
      │
      ├─ Body: { credential, password }
      │
      ▼
    [Backend - Verify Credentials]
      │
      ├─ 1. Find user by email/username
      ├─ 2. Compare password hash
      │
      ▼
    [Check if 2FA Enabled]
      │
      ├─ Query: SELECT * FROM user_2fa 
      │          WHERE user_id = ? AND is_enabled = 1
      │
      ├─ If 2FA NOT enabled:
      │   ├─ Issue JWT token
      │   └─ Return: { token, user }
      │
      ├─ If 2FA ENABLED:
      │   └─ Return: { requires2FA: true, tempUserId: userId }
      │
      ▼
    [Frontend Detects requires2FA]
      │
      ├─ setShow2FA(true)
      ├─ Show 2FA verification modal
      │
      ▼
    [User Opens Google Authenticator]
      │
      ├─ Gets 6-digit code
      │
      ▼
    [User Enters Code in Modal]
      │
      ▼
    [API Call: POST /api/2fa-verify/verify-code]
      │
      ├─ Body: { userId: tempUserId, code: '123456' }
      │
      ▼
    [Backend - Verify TOTP Code]
      │
      ├─ 1. Get secret from user_2fa table
      ├─ 2. Verify using speakeasy:
      │     └─ speakeasy.totp.verify({ secret, token: code })
      │
      ├─ If INVALID:
      │   └─ Return: { error: 'Invalid code' }
      │
      ├─ If VALID:
      │   ├─ Issue JWT token
      │   ├─ Log activity: '2FA_VERIFIED'
      │   └─ Return: { success: true, token, user }
      │
      ▼
    [Frontend Receives Token]
      │
      ├─ Store token in localStorage
      ├─ Update auth state
      ├─ Redirect to /dashboard
      │
      ▼
    [Login Complete! ✅]


    ┌────────────────────────────────────┐
    │   ALTERNATIVE: Using Backup Code   │
    └────────────────────────────────────┘
    
    [User Clicks "Use Backup Code"]
      │
      ▼
    [Enter 8-character Backup Code]
      │
      ▼
    [API Call: POST /api/2fa-verify/verify-backup-code]
      │
      ├─ Body: { userId, code: 'ABCD1234' }
      │
      ▼
    [Backend - Verify Backup Code]
      │
      ├─ 1. Get backup_codes from user_2fa
      ├─ 2. Check if code exists and not used
      ├─ 3. Mark code as used
      │
      ▼
    [Issue Token & Complete Login]
      │
      ▼
    [Done! ✅]
```

---

## 5️⃣ System Settings (Admin) Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM SETTINGS PROCESS                    │
└─────────────────────────────────────────────────────────────┘

    [Admin Opens /dashboard/system-settings]
      │
      ├─ Check: user.role === 'admin'
      │   └─ If not admin: redirect to /dashboard
      │
      ▼
    [API Call: GET /api/settings/system]
      │
      ├─ Requires: requirePermission('settings', 'read')
      │
      ▼
    [Backend Returns System Settings]
      │
      ├─ {
      │     general: { site_name, maintenance_mode, ... },
      │     security: { session_timeout, max_login_attempts, ... },
      │     email: { smtp_host, smtp_port, ... },
      │     storage: { max_file_size, allowed_types, ... },
      │     api: { rate_limit, ... }
      │   }
      │
      ▼
    [Frontend Displays Settings]
      │
      ├─ Tabs: General, Security, Email, Storage, API
      │
      ▼
    [Admin Changes Setting]
      │
      ├─ e.g., session_timeout = 60 minutes
      │
      ▼
    [API Call: PUT /api/system-settings]
      │
      ├─ Body: entire systemSettings object
      │
      ▼
    [Backend Updates]
      │
      ├─ UPDATE system_settings table
      │ OR
      ├─ Store in config file
      │
      ▼
    [Response: { success: true }]
      │
      ▼
    [Success Toast]
      │
      ▼
    [Done! ✅]
```

---

## 6️⃣ Database Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│           users                  │
├──────────────────────────────────┤
│ id              INTEGER PK       │
│ email           VARCHAR(255)     │
│ username        VARCHAR(255)     │
│ mobile          VARCHAR(20)      │
│ password_hash   VARCHAR(255)     │
│ first_name      VARCHAR(100)     │
│ last_name       VARCHAR(100)     │
│ role            VARCHAR(50)      │ ← admin/analyst/viewer
│ is_active       BOOLEAN          │
│ created_at      DATETIME         │
│ updated_at      DATETIME         │
│ settings        TEXT             │ ← JSON: all user settings
│ avatar          TEXT             │ ← /uploads/avatars/...
└──────────────────────────────────┘
         │
         │ 1:1
         ▼
┌──────────────────────────────────┐
│          user_2fa                │
├──────────────────────────────────┤
│ id              INTEGER PK       │
│ user_id         INTEGER FK       │ ← references users(id)
│ secret          VARCHAR(255)     │ ← speakeasy secret
│ is_enabled      BOOLEAN          │ ← 0 or 1
│ backup_codes    TEXT             │ ← JSON array of 10 codes
│ created_at      DATETIME         │
│ updated_at      DATETIME         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       user_sessions              │
├──────────────────────────────────┤
│ id              INTEGER PK       │
│ user_id         INTEGER FK       │
│ token           TEXT             │
│ is_active       BOOLEAN          │
│ ip_address      VARCHAR(45)      │
│ user_agent      TEXT             │
│ created_at      DATETIME         │
│ expires_at      DATETIME         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       activity_logs              │
├──────────────────────────────────┤
│ id              INTEGER PK       │
│ user_id         INTEGER FK       │
│ action          VARCHAR(100)     │ ← PROFILE_UPDATE, 2FA_ENABLED, etc.
│ description     TEXT             │
│ metadata        TEXT             │ ← JSON
│ ip_address      VARCHAR(45)      │
│ user_agent      TEXT             │
│ created_at      DATETIME         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       system_settings            │
├──────────────────────────────────┤
│ id              INTEGER PK       │
│ setting_key     VARCHAR(255)     │
│ setting_value   TEXT             │
│ updated_at      DATETIME         │
└──────────────────────────────────┘
```

---

## 🎯 Key Points Summary

### Avatar Upload ✅
- ✅ Frontend: File input → FormData → API call
- ✅ Backend: Multer saves to disk → Update DB
- ✅ Preview: Immediate state update shows image
- ✅ Storage: Disk + Database path

### User Settings ✅
- ✅ Stored as JSON in users.settings column
- ✅ All sections work (Notifications, Privacy, Display, etc.)
- ✅ Validation on backend (e.g., session timeout 5-1440)

### 2FA ✅
- ✅ Setup: QR Code + Secret + 10 Backup Codes
- ✅ Login: TOTP verification or Backup code
- ✅ Storage: user_2fa table with secret & codes

### System Settings ✅
- ✅ Admin only access
- ✅ Global configuration for all users
- ✅ Sections: General, Security, Email, Storage, API

---

**🎉 All flows working perfectly! 🎉**

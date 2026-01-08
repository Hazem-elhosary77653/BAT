# 🔧 Backend API Endpoints - Settings & Profile

## Overview
Complete API documentation for user settings, profile management, and password changes.

---

## 📍 Base URL
```
http://localhost:3001/api
```

---

## 🔐 Authentication
All endpoints require JWT authentication token in the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👤 User Settings Endpoints

### 1. GET `/user-settings`
**Get current user's settings**

**Request:**
```bash
GET /api/user-settings
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email_login": true,
      "email_security": true,
      "email_updates": true,
      "email_weekly": true,
      "push_enabled": true,
      "sms_enabled": false
    },
    "privacy": {
      "profile_public": false,
      "show_online_status": true,
      "allow_messages": true
    },
    "display": {
      "theme": "light",
      "language": "en",
      "timezone": "UTC",
      "date_format": "MM/DD/YYYY"
    },
    "accessibility": {
      "high_contrast": false,
      "reduce_motion": false,
      "large_text": false,
      "screen_reader": false
    },
    "security": {
      "two_factor": false,
      "sessions_timeout": "30",
      "remember_device": true
    }
  }
}
```

**Error Responses:**
- `404` - User not found
- `500` - Server error

---

### 2. PUT `/user-settings`
**Update current user's settings**

**Request:**
```bash
PUT /api/user-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifications": {
    "email_login": false,
    "email_security": true,
    "email_updates": true,
    "email_weekly": false,
    "push_enabled": true,
    "sms_enabled": false
  },
  "display": {
    "theme": "dark",
    "language": "en",
    "timezone": "EST",
    "date_format": "DD/MM/YYYY"
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "notifications": {...},
    "privacy": {...},
    "display": {...},
    "accessibility": {...},
    "security": {...}
  }
}
```

**Error Responses:**
- `400` - No fields to update / Invalid session timeout
- `500` - Server error

---

### 3. POST `/user-settings/reset`
**Reset settings to defaults**

**Request:**
```bash
POST /api/user-settings/reset
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Settings reset to default",
  "data": {
    "notifications": {...},
    "privacy": {...},
    "display": {...},
    "accessibility": {...},
    "security": {...}
  }
}
```

**Error Responses:**
- `500` - Server error

---

## 👨‍💼 User Profile Endpoints

### 1. GET `/profile/me`
**Get current user's profile**

**Request:**
```bash
GET /api/profile/me
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "role": "admin",
    "status": "active",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-03T15:30:00Z"
  }
}
```

**Error Responses:**
- `404` - User not found
- `500` - Server error

---

### 2. PUT `/profile/me`
**Update current user's profile**

**Request:**
```bash
PUT /api/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "mobile": "+1234567890"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "role": "admin",
    "status": "active"
  }
}
```

**Error Responses:**
- `400` - Email/Mobile already exists / No fields to update
- `500` - Server error

---

### 3. POST `/profile/change-password`
**Change current user's password**

**Request:**
```bash
POST /api/profile/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Password validation errors:
  - "All fields are required"
  - "Passwords do not match"
  - "New password must be different from current password"
  - "Password must be at least 8 characters"
  - "Current password is incorrect"
- `500` - Server error

---

## 🔑 Password Validation Rules

✅ **Requirements:**
- Minimum 8 characters
- Must match confirmation password
- Must be different from current password
- Current password must be verified

❌ **Invalid Examples:**
- `pass123` - Too short (< 8 chars)
- Current password `secret123` with new password `secret123` - Same as current
- New password doesn't match confirmation

---

## ⏱️ Session Timeout Validation

**Valid Range:** 5 - 1440 minutes
**Default:** 30 minutes
**Examples:**
- `5` = 5 minutes (minimum)
- `30` = 30 minutes (default)
- `60` = 1 hour
- `480` = 8 hours
- `1440` = 24 hours (maximum)

---

## 🌍 Supported Values

### Theme
- `"light"` (default)
- `"dark"`

### Language
- `"en"` - English (default)
- `"ar"` - العربية
- `"es"` - Español
- `"fr"` - Français
- `"de"` - Deutsch
- `"zh"` - 中文

### Timezone
- `"UTC"` - Coordinated Universal Time (default)
- `"GMT"` - Greenwich Mean Time
- `"EST"` - Eastern Standard Time
- `"CST"` - Central Standard Time
- `"MST"` - Mountain Standard Time
- `"PST"` - Pacific Standard Time
- `"CET"` - Central European Time
- `"GST"` - Gulf Standard Time
- `"IST"` - Indian Standard Time

### Date Format
- `"MM/DD/YYYY"` - Default (e.g., 01/15/2024)
- `"DD/MM/YYYY"` - (e.g., 15/01/2024)
- `"YYYY-MM-DD"` - (e.g., 2024-01-15)
- `"DD.MM.YYYY"` - (e.g., 15.01.2024)

---

## 📝 Activity Logging

All settings and profile changes are logged in the activity table:

**Activity Types:**
- `PROFILE_UPDATE` - User profile changes
- `PASSWORD_CHANGE` - Password changes
- `SETTINGS_UPDATE` - Settings changes
- `SETTINGS_RESET` - Settings reset to default

**Logged Information:**
- User ID
- Activity type
- Timestamp
- IP address
- User agent
- Additional context (sections updated, etc.)

---

## 🔄 Data Flow Example

### Updating Settings:
```javascript
// Frontend (React)
const updateSettings = async (newSettings) => {
  const response = await fetch('http://localhost:3001/api/user-settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newSettings)
  });
  
  const data = await response.json();
  return data;
};

// Backend (Node.js)
// 1. Authenticate user via JWT
// 2. Fetch current settings from database
// 3. Merge new settings with existing ones
// 4. Validate security settings (session timeout)
// 5. Update database with JSON.stringify(settings)
// 6. Log activity
// 7. Return updated settings
```

---

## 🛡️ Security Features

✅ **Implemented:**
- JWT authentication required
- Password validation rules
- Session timeout configuration
- Two-factor authentication support
- Activity logging
- User-specific data isolation

---

## 📊 Database Schema

### User Settings Storage
Settings are stored as JSON string in the `users` table:
```sql
ALTER TABLE users ADD COLUMN settings TEXT DEFAULT NULL;

-- JSON Structure:
{
  "notifications": {...},
  "privacy": {...},
  "display": {...},
  "accessibility": {...},
  "security": {...}
}
```

---

## 🧪 Testing Examples

### cURL - Get User Settings
```bash
curl -X GET http://localhost:3001/api/user-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### cURL - Update Settings
```bash
curl -X PUT http://localhost:3001/api/user-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display": {
      "theme": "dark",
      "language": "en",
      "timezone": "EST",
      "date_format": "DD/MM/YYYY"
    }
  }'
```

### cURL - Change Password
```bash
curl -X POST http://localhost:3001/api/profile/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "CurrentPassword123!",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

### JavaScript (Fetch API)
```javascript
// Get settings
const settings = await fetch('/api/user-settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());

// Update settings
const result = await fetch('/api/user-settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display: { theme: 'dark' }
  })
}).then(r => r.json());
```

---

## 📞 Error Handling Best Practices

Always handle errors in the frontend:

```javascript
try {
  const response = await api.put('/user-settings', settings);
  // Success
  toast.success('Settings saved successfully!');
} catch (error) {
  // Handle specific errors
  if (error.response?.status === 400) {
    toast.error(error.response.data.error);
  } else if (error.response?.status === 401) {
    // User not authenticated
    redirectToLogin();
  } else {
    toast.error('Failed to save settings');
  }
}
```

---

**Status:** ✅ Production Ready
**Last Updated:** January 3, 2026
**Version:** 1.0

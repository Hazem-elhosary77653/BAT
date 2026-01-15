# نظام التحكم بالصلاحيات في واجهة المستخدم
# Permission-Based UI Control System

## نظرة عامة | Overview

تم تطبيق نظام شامل لإخفاء/إظهار الأزرار والإجراءات في واجهة المستخدم بناءً على صلاحيات كل مستخدم. هذا يضمن أن المستخدمين يرون فقط الإجراءات التي لديهم صلاحية لتنفيذها.

A comprehensive system has been implemented to hide/show buttons and actions in the UI based on each user's permissions. This ensures users only see actions they have permission to perform.

---

## الميزات المطبقة | Implemented Features

### 1. جلب صلاحيات المستخدم | Fetch User Permissions
عند تحميل صفحة إدارة المستخدمين، يتم جلب صلاحيات المستخدم الحالي من API:

When the User Management page loads, it fetches the current user's permissions from the API:

```javascript
const fetchUserPermissions = async () => {
  try {
    const response = await api.get('/permissions/accessible');
    const resources = response.data?.data?.resources || [];
    const actions = response.data?.data?.actions || {};
    setUserPermissions({ resources, actions });
  } catch (err) {
    console.error('Error fetching user permissions:', err);
    setUserPermissions({ resources: [], actions: {} });
  }
};
```

### 2. فحص الصلاحيات | Permission Check Function
دالة مساعدة للتحقق من صلاحية معينة:

Helper function to check for a specific permission:

```javascript
const hasPermission = (resource, action) => {
  if (!userPermissions) return true; // Loading state
  if (user?.role === 'admin') return true; // Admin has all permissions
  const resourceActions = userPermissions.actions[resource] || [];
  return resourceActions.includes(action);
};
```

---

## الأزرار المتحكم بها | Controlled Buttons

### 1. ✅ زر إضافة مستخدم | Add User Button
**الصلاحية المطلوبة | Required Permission:** `users:create`

```jsx
{hasPermission('users', 'create') && (
  <button onClick={openCreateModal}>
    <Plus size={20} />
    Add User
  </button>
)}
```

**السلوك | Behavior:**
- يظهر فقط للمستخدمين الذين لديهم صلاحية `users:create`
- Only visible to users with `users:create` permission
- مخفي تماماً لمن لا يملك الصلاحية
- Completely hidden for users without permission

---

### 2. ✏️ زر التعديل | Edit Button
**الصلاحية المطلوبة | Required Permission:** `users:update`

```jsx
{hasPermission('users', 'update') && (
  <button onClick={() => openEditModal(userData)}>
    <Edit2 size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يظهر في عمود الإجراءات لكل مستخدم
- Appears in the actions column for each user
- يسمح بتعديل بيانات المستخدمين
- Allows editing user data

---

### 3. 🗑️ زر الحذف | Delete Button
**الصلاحية المطلوبة | Required Permission:** `users:delete`

```jsx
{hasPermission('users', 'delete') && (
  <button onClick={() => setDeleteModal({ open: true, user: userData })}>
    <Trash2 size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يظهر فقط لمن لديه صلاحية حذف المستخدمين
- Only visible to users with delete permission
- مخفي تلقائياً للمستخدم نفسه (لا يمكن حذف نفسك)
- Automatically hidden for self (cannot delete yourself)

---

### 4. 🔑 زر إعادة تعيين كلمة المرور | Reset Password Button
**الصلاحية المطلوبة | Required Permission:** `users:reset_password`

```jsx
{hasPermission('users', 'reset_password') && (
  <button onClick={() => handleResetPassword(userData.id, userData.email)}>
    <Key size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يسمح بإنشاء كلمة مرور جديدة للمستخدم
- Allows generating a new password for the user
- يتم نسخ كلمة المرور تلقائياً
- Password is automatically copied to clipboard

---

### 5. 🔴 زر تسجيل الخروج القسري | Force Logout Button
**الصلاحية المطلوبة | Required Permission:** `sessions:terminate`

```jsx
{hasPermission('sessions', 'terminate') && (
  <button onClick={() => handleForceLogout(userData.id, userData.name)}>
    <Power size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يقوم بتسجيل خروج المستخدم من جميع الأجهزة
- Logs out user from all devices
- مخفي للمستخدم نفسه
- Hidden for self

---

### 6. 🛡️ زر عرض السجلات | Audit Highlights Button
**الصلاحية المطلوبة | Required Permission:** `users:read`

```jsx
{hasPermission('users', 'read') && (
  <button onClick={() => openAuditModal(userData)}>
    <Shield size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يعرض ملخص نشاطات المستخدم
- Displays user activity summary
- آخر تسجيل دخول، آخر تغيير كلمة مرور، إلخ
- Last login, last password change, etc.

---

### 7. 👥 زر عرض الجلسات | View Sessions Button
**الصلاحية المطلوبة | Required Permission:** `sessions:read`

```jsx
{hasPermission('sessions', 'read') && (
  <button onClick={() => openSessionsModal(userData)}>
    <Users size={16} />
  </button>
)}
```

**السلوك | Behavior:**
- يعرض جميع الجلسات النشطة للمستخدم
- Shows all active sessions for the user
- يعرض معلومات الجهاز والمتصفح
- Displays device and browser information

---

### 8. 🎭 قائمة تغيير الدور | Role Dropdown
**الصلاحية المطلوبة | Required Permission:** `users:manage_roles`

```jsx
{hasPermission('users', 'manage_roles') ? (
  <select
    value={userData.role}
    onChange={(e) => handleChangeRole(userData.id, e.target.value)}
  >
    {roleOptions.map(role => <option value={role}>{role}</option>)}
  </select>
) : (
  <span>{userData.role}</span>
)}
```

**السلوك | Behavior:**
- إذا كان لديه الصلاحية: يظهر dropdown قابل للتعديل
- With permission: Shows editable dropdown
- بدون الصلاحية: يظهر النص فقط (للقراءة فقط)
- Without permission: Shows text only (read-only)

---

### 9. 🟢 زر تغيير الحالة | Status Toggle Button
**الصلاحية المطلوبة | Required Permission:** `users:manage_status`

```jsx
{hasPermission('users', 'manage_status') ? (
  <button onClick={() => handleToggleStatus(userData.id, userData.is_active)}>
    {userData.is_active ? 'Active' : 'Inactive'}
  </button>
) : (
  <span>{userData.is_active ? 'Active' : 'Inactive'}</span>
)}
```

**السلوك | Behavior:**
- إذا كان لديه الصلاحية: زر قابل للنقر لتغيير الحالة
- With permission: Clickable button to toggle status
- بدون الصلاحية: نص ثابت (للقراءة فقط)
- Without permission: Static text (read-only)

---

## جدول الصلاحيات الكامل | Complete Permissions Table

| الإجراء<br/>Action | المورد<br/>Resource | الصلاحية<br/>Permission | الزر/العنصر<br/>Button/Element |
|---|---|---|---|
| إضافة مستخدم | users | `create` | Add User Button |
| تعديل مستخدم | users | `update` | Edit Button |
| حذف مستخدم | users | `delete` | Delete Button |
| إعادة تعيين كلمة المرور | users | `reset_password` | Reset Password Button |
| تغيير دور المستخدم | users | `manage_roles` | Role Dropdown |
| تغيير حالة المستخدم | users | `manage_status` | Status Toggle |
| عرض تفاصيل المستخدم | users | `read` | Audit Button |
| عرض الجلسات | sessions | `read` | View Sessions Button |
| تسجيل خروج قسري | sessions | `terminate` | Force Logout Button |

---

## مثال عملي | Practical Example

### سيناريو: مدير فريق | Scenario: Team Manager

**الصلاحيات المعطاة | Granted Permissions:**
```javascript
{
  resources: ['users', 'sessions'],
  actions: {
    users: ['read', 'update', 'manage_status'],
    sessions: ['read']
  }
}
```

**ما سيراه المستخدم | What User Will See:**
✅ زر التعديل (Edit Button)
✅ زر تغيير الحالة (Status Toggle)
✅ زر عرض السجلات (Audit Button)
✅ زر عرض الجلسات (View Sessions Button)

**ما لن يراه | What User Won't See:**
❌ زر إضافة مستخدم (Add User Button)
❌ زر الحذف (Delete Button)
❌ زر إعادة تعيين كلمة المرور (Reset Password)
❌ زر تسجيل الخروج القسري (Force Logout)
❌ قائمة تغيير الدور (Role Dropdown - سيرى النص فقط)

---

## كيفية إنشاء دور مخصص | How to Create Custom Role

### الخطوات | Steps:

1. **الذهاب لصفحة الصلاحيات | Go to Permissions Page**
   - Dashboard → Admin → Permissions & Roles

2. **إنشاء دور جديد | Create New Role**
   - أدخل اسم الدور (مثل: "Team Manager")
   - Enter role name (e.g., "Team Manager")

3. **اختيار الصلاحيات | Select Permissions**
   - ✅ users - read
   - ✅ users - update
   - ✅ users - manage_status
   - ✅ sessions - read

4. **حفظ | Save**
   - اضغط "Add Permission"
   - Click "Add Permission"

5. **تعيين الدور | Assign Role**
   - في صفحة إدارة المستخدمين، اختر الدور الجديد من القائمة
   - In User Management page, select the new role from dropdown

---

## الخلاصة | Summary

✅ **تم إخفاء جميع الأزرار بناءً على الصلاحيات**
   - All buttons are hidden based on permissions

✅ **المستخدمون يرون فقط ما يمكنهم فعله**
   - Users only see what they can do

✅ **الحماية على مستوى الواجهة والخادم**
   - Protection at both UI and server level

✅ **تجربة مستخدم نظيفة وواضحة**
   - Clean and clear user experience

---

## الملفات المعدلة | Modified Files

1. **frontend/app/dashboard/admin/users/page.jsx**
   - Added `fetchUserPermissions()`
   - Added `hasPermission()` function
   - Wrapped all action buttons with permission checks
   - Made role dropdown and status button conditional

2. **backend/src/controllers/userManagementController.js**
   - Removed all hardcoded admin checks
   - Now relies on middleware permission checks

---

## اختبار النظام | Testing the System

### اختبار 1: مستخدم بدون صلاحيات | Test 1: User Without Permissions
```javascript
// Role: viewer
// Permissions: users:read only
// Expected: Only see Audit button, all other buttons hidden
```

### اختبار 2: مستخدم بصلاحيات جزئية | Test 2: User With Partial Permissions
```javascript
// Role: team_manager
// Permissions: users:read, users:update
// Expected: See Edit and Audit buttons only
```

### اختبار 3: مدير النظام | Test 3: Admin User
```javascript
// Role: admin
// Permissions: ALL
// Expected: See all buttons and controls
```

---

## الدعم | Support

إذا واجهت أي مشاكل أو لديك استفسارات:
If you encounter any issues or have questions:

- تأكد من إعادة تشغيل الخادم بعد تعديل الصلاحيات
- Make sure to restart the server after modifying permissions

- تحقق من أن المستخدم لديه صلاحية `users:read` للوصول لصفحة إدارة المستخدمين
- Verify the user has `users:read` permission to access User Management page

- استخدم Developer Tools لفحص API calls إذا لم تظهر الأزرار
- Use Developer Tools to inspect API calls if buttons don't appear

---

تم التحديث: 2026-01-03
Updated: 2026-01-03

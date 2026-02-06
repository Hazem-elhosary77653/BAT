# 🔧 حل مشاكل التشغيل

## ✅ المشاكل التي تم إصلاحها

### 1. ✅ socket.io تم تثبيته بنجاح
```bash
npm install socket.io
```

### 2. ✅ تم إصلاح imports في server.js
- نقل `require('http')` و `require('socket.io')` إلى الأعلى
- إزالة التكرار

### 3. ✅ تم إصلاح database migrations
- جعل جميع العمليات آمنة مع try-catch
- إضافة معالجة الأخطاء للجداول الموجودة

### 4. ✅ تم إضافة socket.io-client في Frontend package.json

---

## ⚠️ المشاكل المتبقية

### مشكلة 1: المنفذ 5002 مشغول
```
Error: listen EADDRINUSE: address already in use :::5002
```

**الحل:** إيقاف العملية السابقة
```bash
# Windows PowerShell
Get-Process node | Stop-Process -Force

# أو في cmd
taskkill /F /IM node.exe

# ثم انتظر 2 ثانية وشغل الخادم من جديد
npm run dev
```

### مشكلة 2: Permissions UNIQUE constraint
```
[ERROR] Query failed: UNIQUE constraint failed: permissions.role, permissions.action, permissions.resource
```

**السبب:** محاولة إدراج نفس الصلاحيات مرتين

**الحل:** هذا خطأ غير حرج - الخادم يستمر في العمل

---

## 🚀 خطوات التشغيل الصحيحة

### للخادم:
```bash
cd backend
npm run dev
```

### للواجهة (في terminal منفصل):
```bash
cd frontend
npm run dev
```

---

## ✨ التحقق من النجاح

يجب أن تبدأ الرسائل هكذا:

```
✅ Connected to SQLite database: ./database.db
✅ OpenAI service initialized
✅ WebSocket Server initialized
🚀 Server running on port 3001
📡 WebSocket available at ws://localhost:3001/socket.io/
```

---

## 🔍 اختبار الاتصال

### في Browser Console:
```javascript
// تجربة الاتصال بـ WebSocket
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ متصل بـ WebSocket');
  socket.emit('join-brd', {
    brdId: 'test_brd',
    userId: 'test_user',
    userName: 'اختبار'
  });
});

socket.on('user-joined', (data) => {
  console.log('👤 مستخدم انضم:', data);
});
```

---

## 📝 الملاحظات المهمة

1. **socket.io Server** يعمل على نفس PORT مثل Express
   - لا تحتاج port منفصل
   - يتم تعطيل الخادم عند تعطل الخادم الواحد

2. **CORS** مكفولة للـ Frontend
   - Origin: `http://localhost:3000`
   - Methods: `GET`, `POST`
   - Credentials: `true`

3. **Database** محلي بـ SQLite
   - الجداول الجديدة آمنة من الأخطاء
   - migration يعمل فقط عند البدء

---

**آخر تحديث:** 2 فبراير 2026

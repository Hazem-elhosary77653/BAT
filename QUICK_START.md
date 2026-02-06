# 🚀 Business Analyst Assistant Tool - Setup Guide

## ✅ متطلبات النظام

- **Node.js** v18 أو أحدث
- **npm** v9 أو أحدث
- **Port 3000** (للـ Frontend)
- **Port 3001** (للـ Backend)

## 🎯 البدء السريع

### Option 1: استخدام Launcher Script (الأسهل)

#### على Windows:
```bash
# Double-click على: start-dev.bat
# أو من Terminal:
.\start-dev.bat
```

#### على macOS/Linux:
```bash
chmod +x start-dev.ps1
./start-dev.ps1
```

### Option 2: الطريقة اليدوية

#### Terminal 1 - تشغيل Backend:
```bash
cd backend
npm install
npm run dev
```

#### Terminal 2 - تشغيل Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📍 الوصول إلى التطبيق

بعد البدء الناجح، يمكنك الوصول إلى:

| الخدمة | الرابط | الوصف |
|--------|--------|--------|
| **Frontend** | http://localhost:3000 | واجهة المستخدم الرئيسية |
| **Backend API** | http://localhost:3001/api | الـ APIs الخاص بالخادم |
| **Health Check** | http://localhost:3001/health | التحقق من حالة الخادم |
| **WebSocket** | ws://localhost:3001/socket.io/ | الاتصال الحي (Real-time) |

---

## 🔍 التحقق من النجاح

### في Terminal:

يجب أن تشاهد رسائل مشابهة لهذه:

```
✅ Connected to SQLite database: ./database.db
✅ OpenAI service initialized
✅ WebSocket Server initialized
🚀 Server running on port 3001
📡 WebSocket available at ws://localhost:3001/socket.io/
```

### في Browser:

```javascript
// افتح DevTools (F12) واكتب:
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✅ Connected!'));
```

---

## 🛠️ استكشاف الأخطاء

### مشكلة: Port already in use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**الحل:**
```bash
# Windows
taskkill /F /IM node.exe

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### مشكلة: Dependencies لم تُثبت

```
Error: Cannot find module 'socket.io'
```

**الحل:**
```bash
cd backend
npm install
```

### مشكلة: Frontend لا يتصل بـ Backend

**الحل:** تأكد من أن:
1. Backend يعمل على `http://localhost:3001`
2. CORS مفعل في `backend/src/server.js`
3. العميل يستخدم `http://localhost:3001` وليس عنوان آخر

---

## 📁 هيكل المشروع

```
.
├── backend/                           # خادم Node.js
│   ├── src/
│   │   ├── server.js                 # نقطة البداية
│   │   ├── services/
│   │   │   ├── collaborationService.js  # خدمة التعاون الفوري
│   │   │   └── websocketHandler.js      # معالج WebSocket
│   │   ├── routes/
│   │   │   └── collaborationRoutes.js   # APIs للتعاون
│   │   └── db/
│   │       └── migrations/
│   │           └── 010_add_collaboration_tables.js
│   └── package.json
│
├── frontend/                          # تطبيق React
│   ├── app/
│   ├── components/
│   │   ├── CollaborationPanel.jsx     # لوحة التعاون
│   │   └── DiscussionThreads.jsx      # خيوط النقاش
│   ├── hooks/
│   │   └── useCollaboration.js        # React Hook
│   ├── package.json
│   └── next.config.js
│
├── REAL_TIME_COLLABORATION_GUIDE.md   # وثائق التعاون الفوري
├── SETUP_TROUBLESHOOTING.md           # حل المشاكل
├── start-dev.bat                      # Launcher Windows
└── start-dev.ps1                      # Launcher PowerShell

```

---

## 🔐 متغيرات البيئة

### Backend (.env):
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_key_here
DATABASE_URL=./database.db
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## 📊 معلومات الميزات

### Real-time Collaboration ✅
- تحرير متزامن بدون تضارب
- مؤشرات حية للمستخدمين
- قفل تلقائي للأقسام

### @Mentions ✅
- الإشارة للمستخدمين بـ @username
- إشعارات فورية
- تتبع الإشارات

### Discussion Threads ✅
- نقاشات متسلسلة
- ردود متداخلة
- Emoji Reactions

---

## 🚨 Troubleshooting

### جميع الخدمات متوقفة؟
```bash
# احذف node_modules وأعد التثبيت
rm -r backend/node_modules frontend/node_modules
npm install --prefix backend
npm install --prefix frontend
```

### WebSocket غير متصل؟
1. تأكد من أن Backend يعمل
2. افتح DevTools واختبر الاتصال
3. تحقق من CORS في `server.js`

### Database Error؟
```bash
# حذف database القديم
rm backend/database.db

# سيتم إنشاء واحد جديد تلقائياً
npm run dev --prefix backend
```

---

## 📚 مصادر إضافية

- [Real-time Collaboration Guide](./REAL_TIME_COLLABORATION_GUIDE.md)
- [Setup Troubleshooting](./SETUP_TROUBLESHOOTING.md)
- [Business Enhancement Report](./BUSINESS_ENHANCEMENT_REPORT.md)

---

## 🤝 المساعدة

إذا واجهت مشاكل:

1. تحقق من [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md)
2. شاهد رسائل الأخطاء بعناية
3. تأكد من تثبيت جميع المتطلبات

---

## ✨ الخطوات التالية

بعد التشغيل الناجح:

1. 📱 افتح `http://localhost:3000`
2. 👤 سجل دخول أو أنشئ حساب
3. 📄 ابدأ باستخدام الميزات الجديدة

---

**آخر تحديث:** 2 فبراير 2026  
**الإصدار:** 1.0.0

---

**Made with ❤️ for Business Analysts**

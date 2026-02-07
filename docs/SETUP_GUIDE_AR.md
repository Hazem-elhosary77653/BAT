# ⚡ دليل الإعداد السريع - Slack & Teams

## 📦 المتطلبات الأساسية

- ✅ Node.js مثبت
- ✅ Backend يعمل على port 3001
- ✅ حساب Slack workspace (للـ Slack)
- ✅ حساب Microsoft Teams (للـ Teams)

---

## 🟣 إعداد Slack (10 دقائق)

### الطريقة 1: Webhook فقط (سريع - 3 دقائق)

#### الخطوة 1: إنشاء Webhook
1. افتح Slack في المتصفح
2. اذهب لقناة معينة (مثل #general)
3. انقر على اسم القناة في الأعلى
4. اختر **Integrations**
5. اضغط **Add an app**
6. ابحث عن **Incoming WebHooks**
7. اضغط **Add to Slack**
8. اختر القناة المطلوبة
9. **انسخ Webhook URL** (سيكون شكله: `https://hooks.slack.com/services/...`)

#### الخطوة 2: التكوين
افتح ملف `.env` في backend وأضف:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL_GENERAL=#general
FRONTEND_URL=http://localhost:3000
```

#### الخطوة 3: إعادة تشغيل السيرفر
```bash
cd backend
npm run dev
```

#### الخطوة 4: الاختبار
```bash
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "#general"}'
```

يجب أن تظهر رسالة في قناة Slack! ✅

---

### الطريقة 2: Bot كامل مع Commands (متقدم - 10 دقائق)

#### الخطوة 1: إنشاء Slack App
1. اذهب إلى https://api.slack.com/apps
2. اضغط **Create New App**
3. اختر **From a manifest**
4. اختر workspace
5. الصق محتوى `backend/slack-app-manifest.json`
6. عدّل `your-domain.com` بعنوان السيرفر الخاص بك
7. اضغط **Create**

#### الخطوة 2: الحصول على Tokens
1. من القائمة الجانبية → **OAuth & Permissions**
2. اضغط **Install to Workspace**
3. اضغط **Allow**
4. **انسخ Bot User OAuth Token** (يبدأ بـ `xoxb-`)
5. من القائمة → **Basic Information**
6. انزل لـ **App Credentials**
7. **انسخ Signing Secret**

#### الخطوة 3: التكوين
أضف في `.env`:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL_GENERAL=#general
SLACK_CHANNEL_BRDS=#brds
SLACK_CHANNEL_STORIES=#stories
FRONTEND_URL=http://localhost:3000
```

#### الخطوة 4: تكوين ngrok (للتطوير المحلي)
```bash
# تثبيت ngrok
npm install -g ngrok

# تشغيل ngrok
ngrok http 3001

# انسخ HTTPS URL (مثل: https://abc123.ngrok.io)
```

#### الخطوة 5: تحديث Slack App URLs
1. ارجع لـ https://api.slack.com/apps
2. اختر تطبيقك
3. **Slash Commands** → عدّل `/brd` و `/story`:
   - Request URL: `https://YOUR-NGROK-URL.ngrok.io/api/integrations/slack/commands`
4. **Interactivity & Shortcuts**:
   - Request URL: `https://YOUR-NGROK-URL.ngrok.io/api/integrations/slack/interactions`
5. **Event Subscriptions**:
   - Request URL: `https://YOUR-NGROK-URL.ngrok.io/api/integrations/slack/events`
   - اضغط **Save Changes**

#### الخطوة 6: دعوة Bot للقنوات
1. في Slack، اذهب للقناة #general
2. اكتب: `/invite @BA Assistant Bot`
3. كرر لباقي القنوات (#brds, #stories)

#### الخطوة 7: الاختبار
```bash
# اختبار webhook
curl -X POST http://localhost:3001/api/integrations/slack/test

# في Slack، جرب:
/brd list
/story list
```

---

## 🟦 إعداد Microsoft Teams (5 دقائق)

### الخطوة 1: إنشاء Incoming Webhook
1. افتح Microsoft Teams
2. اذهب للقناة المطلوبة (مثل General)
3. انقر على **...** بجانب اسم القناة
4. اختر **Connectors**
5. ابحث عن **Incoming Webhook**
6. اضغط **Configure**
7. أدخل:
   - Name: `Business Analyst Assistant`
   - Upload Image: (اختياري)
8. اضغط **Create**
9. **انسخ Webhook URL** (يبدأ بـ `https://outlook.office.com/webhook/...`)
10. اضغط **Done**

### الخطوة 2: التكوين
أضف في `.env`:
```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL
FRONTEND_URL=http://localhost:3000
```

### الخطوة 3: إعادة تشغيل السيرفر
```bash
cd backend
npm run dev
```

### الخطوة 4: الاختبار
```bash
curl -X POST http://localhost:3001/api/integrations/teams/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

يجب أن تظهر بطاقة في قناة Teams! ✅

---

## 🗄️ إعداد قاعدة البيانات

### الخطوة 1: تشغيل Migration
Migration سيعمل تلقائياً عند بدء السيرفر، أو يمكنك تشغيله يدوياً:
```bash
cd backend
node src/db/migrations/011_add_integration_columns.js
```

يجب أن ترى:
```
✅ Added is_enabled_slack column
✅ Added is_enabled_teams column
✅ Added slack_user_id column to users
✅ Added teams_user_id column to users
✅ Integration columns migration complete
```

### الخطوة 2: تفعيل الإشعارات
افتح SQLite database:
```bash
sqlite3 backend/database.db
```

ثم نفذ:
```sql
-- تفعيل Slack لكل الإشعارات
UPDATE notification_settings SET is_enabled_slack = 1;

-- تفعيل Teams لكل الإشعارات
UPDATE notification_settings SET is_enabled_teams = 1;

-- أو تفعيل أنواع محددة فقط
UPDATE notification_settings 
SET is_enabled_slack = 1, is_enabled_teams = 1 
WHERE type IN ('BRD_CREATED', 'BRD_APPROVED', 'STORY_ASSIGNED');

-- للخروج
.exit
```

---

## ✅ التحقق من الإعداد

### 1. التحقق من التكوين
```bash
# Slack
curl http://localhost:3001/api/integrations/slack/status

# يجب أن تحصل على:
{
  "configured": true,
  "webhookConfigured": true,
  "signingSecretConfigured": true,
  "channels": {
    "general": "#general",
    "brds": "#brds",
    "stories": "#stories"
  }
}

# Teams
curl http://localhost:3001/api/integrations/teams/status

# يجب أن تحصل على:
{
  "configured": true,
  "webhookUrl": "Configured"
}
```

### 2. اختبار الإشعارات
```bash
# Slack
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "#general", "type": "SYSTEM_ANNOUNCEMENT"}'

# Teams
curl -X POST http://localhost:3001/api/integrations/teams/test \
  -H "Content-Type: application/json" \
  -d '{"type": "SYSTEM_ANNOUNCEMENT"}'
```

### 3. التحقق من قاعدة البيانات
```sql
-- تحقق من الأعمدة الجديدة
PRAGMA table_info(notification_settings);

-- تحقق من التفعيل
SELECT type, is_enabled_slack, is_enabled_teams 
FROM notification_settings 
LIMIT 5;
```

---

## 🎯 الاستخدام

### إنشاء BRD وإرسال إشعارات
1. افتح Frontend: http://localhost:3000
2. سجل دخول
3. اذهب لـ BRDs
4. أنشئ BRD جديد
5. **تلقائياً** سيتم إرسال إشعارات إلى:
   - ✅ التطبيق (in-app notification)
   - ✅ البريد الإلكتروني (إذا مفعّل)
   - ✅ قناة Slack (إذا مفعّل)
   - ✅ قناة Teams (إذا مفعّل)

### استخدام Slash Commands في Slack
```
/brd list      → عرض آخر BRDs
/story list    → عرض آخر Stories
```

### استخدام Bot في Teams
```
search project  → البحث
brd list       → عرض BRDs
story list     → عرض Stories
help           → المساعدة
```

---

## 🐛 حل المشاكل الشائعة

### Slack لا يستقبل إشعارات

#### المشكلة: "webhookUrl not configured"
```bash
# تأكد من وجود SLACK_WEBHOOK_URL في .env
cat backend/.env | grep SLACK_WEBHOOK_URL

# إذا لم يكن موجود، أضفه
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/..." >> backend/.env

# أعد تشغيل السيرفر
```

#### المشكلة: Slash Commands لا تعمل
```bash
# تأكد من:
# 1. ngrok يعمل
ngrok http 3001

# 2. تحديث URLs في Slack App
# https://api.slack.com/apps → تطبيقك → Slash Commands

# 3. SLACK_SIGNING_SECRET موجود
cat backend/.env | grep SLACK_SIGNING_SECRET

# 4. Bot مضاف للقناة
# في Slack: /invite @BA Assistant Bot
```

#### المشكلة: "Invalid signature"
```bash
# تأكد من SLACK_SIGNING_SECRET صحيح
# انسخه من: https://api.slack.com/apps → Basic Information → Signing Secret
```

---

### Teams لا يستقبل إشعارات

#### المشكلة: "webhook not configured"
```bash
# تأكد من TEAMS_WEBHOOK_URL
cat backend/.env | grep TEAMS_WEBHOOK_URL

# أضفه إذا لم يكن موجود
echo "TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/..." >> backend/.env
```

#### المشكلة: Connector معطل
```
1. افتح قناة Teams
2. انقر ... → Connectors
3. ابحث عن "Incoming Webhook"
4. تأكد من أن "Business Analyst Assistant" مفعّل
5. إذا لم يكن موجود، أضفه من جديد
```

---

### قاعدة البيانات

#### المشكلة: "no such column: is_enabled_slack"
```bash
# شغل Migration
cd backend
node src/db/migrations/011_add_integration_columns.js

# أو أعد تشغيل السيرفر (سيعمل تلقائياً)
npm run dev
```

#### المشكلة: الإشعارات لا تُرسل لـ Slack/Teams رغم التكوين
```sql
-- تحقق من التفعيل
SELECT * FROM notification_settings WHERE type = 'BRD_CREATED';

-- فعّل إذا لزم
UPDATE notification_settings 
SET is_enabled_slack = 1, is_enabled_teams = 1 
WHERE type = 'BRD_CREATED';
```

---

## 📋 Checklist سريع

### Slack - Webhook فقط
- [ ] نسخ Webhook URL
- [ ] إضافة SLACK_WEBHOOK_URL في .env
- [ ] إضافة FRONTEND_URL في .env
- [ ] إعادة تشغيل السيرفر
- [ ] تشغيل Migration
- [ ] تفعيل في قاعدة البيانات
- [ ] اختبار: `curl POST /api/integrations/slack/test`

### Slack - Bot كامل
- [ ] إنشاء Slack App
- [ ] نسخ Bot Token
- [ ] نسخ Signing Secret
- [ ] نسخ Webhook URL
- [ ] إضافة كل Tokens في .env
- [ ] تشغيل ngrok
- [ ] تحديث URLs في Slack App
- [ ] دعوة Bot للقنوات
- [ ] اختبار Slash Commands

### Teams
- [ ] إنشاء Incoming Webhook
- [ ] نسخ Webhook URL
- [ ] إضافة TEAMS_WEBHOOK_URL في .env
- [ ] إعادة تشغيل السيرفر
- [ ] تشغيل Migration
- [ ] تفعيل في قاعدة البيانات
- [ ] اختبار: `curl POST /api/integrations/teams/test`

### قاعدة البيانات
- [ ] تشغيل Migration
- [ ] تفعيل is_enabled_slack
- [ ] تفعيل is_enabled_teams
- [ ] التحقق من الأعمدة الجديدة

---

## 🎉 تم!

إذا اتبعت جميع الخطوات:
- ✅ Slack يستقبل إشعارات
- ✅ Teams يستقبل بطاقات تفاعلية
- ✅ Slash Commands تعمل (إذا أعددت Bot)
- ✅ قاعدة البيانات محدثة

للمزيد من التفاصيل:
- 📖 [SLACK_TEAMS_INTEGRATION.md](./SLACK_TEAMS_INTEGRATION.md) - شرح تفصيلي
- 📋 [INTEGRATIONS_QUICKSTART_AR.md](./INTEGRATIONS_QUICKSTART_AR.md) - دليل سريع
- 💡 [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - أمثلة عملية

---

**محتاج مساعدة؟** راجع قسم حل المشاكل أعلاه أو الوثائق الكاملة.

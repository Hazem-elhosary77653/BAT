# 🔗 Slack & Microsoft Teams Integration

**نظام شامل لتكامل Slack و Microsoft Teams مع Business Analyst Assistant**

<div dir="rtl">

## 📖 المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [الميزات](#-الميزات)
3. [البدء السريع](#-البدء-السريع)
4. [الوثائق](#-الوثائق)
5. [المتطلبات](#-المتطلبات)
6. [التكوين](#-التكوين)
7. [الاستخدام](#-الاستخدام)
8. [API Reference](#-api-reference)
9. [استكشاف الأخطاء](#-استكشاف-الأخطاء)
10. [المساهمة](#-المساهمة)

---

## 🎯 نظرة عامة

تكامل شامل يربط نظام Business Analyst Assistant مع منصات **Slack** و **Microsoft Teams**، مما يوفر:

- 📬 **إشعارات تلقائية** في القنوات عند الأحداث المهمة
- ⚡ **أوامر سريعة** لإدارة BRDs و Stories
- 🔘 **مكونات تفاعلية** (أزرار، قوائم، بطاقات)
- 🔍 **بحث مباشر** من داخل المنصات
- 📊 **معاينة محتوى** احترافية

### الفرق بين Slack و Teams

| الميزة | Slack | Teams |
|--------|:-----:|:-----:|
| Webhooks | ✅ | ✅ |
| Bot Commands | ✅ | ✅ |
| Interactive Cards | ✅ Blocks | ✅ Adaptive Cards |
| Slash Commands | ✅ | ❌ |
| Tabs | ❌ | ✅ |
| Compose Extension | ❌ | ✅ |

---

## ✨ الميزات

### 🟣 Slack Integration

#### إشعارات تلقائية
```
📄 New BRD Created
━━━━━━━━━━━━━━━━━━
BRD: تطوير نظام المصادقة
Created by: أحمد علي
Status: Draft

[✅ Approve] [📝 Request Changes] [👁️ View BRD]
```

#### Slash Commands
- `/brd create` - فتح صفحة إنشاء BRD
- `/brd list` - عرض آخر 5 BRDs
- `/story list` - عرض آخر 5 Stories

#### Interactive Components
- أزرار موافقة/رفض BRDs
- أزرار قبول Tasks
- روابط مباشرة للمحتوى

### 🟦 Teams Integration

#### Adaptive Cards
```
╔═══════════════════════════════╗
║ 📄 New BRD Created            ║
╠═══════════════════════════════╣
║ BRD Title: تطوير نظام...     ║
║ Created by: أحمد علي          ║
║ Status: Draft                 ║
║ Created: 2026-02-06           ║
╠═══════════════════════════════╣
║ [View BRD] [Review]           ║
╚═══════════════════════════════╝
```

#### Bot Commands
- `search [query]` - البحث في BRDs و Stories
- `brd list` - عرض آخر BRDs
- `story list` - عرض آخر Stories
- `help` - عرض الأوامر

#### Teams Tabs
- Dashboard Tab
- BRDs Tab
- Stories Tab

---

## 🚀 البدء السريع

### التثبيت السريع (5 دقائق)

#### 1. Slack Webhook
```bash
# 1. أنشئ Incoming Webhook في Slack
# 2. انسخ Webhook URL
# 3. أضف في .env:
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/..." >> backend/.env
echo "FRONTEND_URL=http://localhost:3000" >> backend/.env

# 4. أعد تشغيل السيرفر
cd backend && npm run dev
```

#### 2. Teams Webhook
```bash
# 1. أنشئ Incoming Webhook في Teams
# 2. انسخ Webhook URL
# 3. أضف في .env:
echo "TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/..." >> backend/.env

# 4. أعد تشغيل السيرفر (إذا لم يكن يعمل)
cd backend && npm run dev
```

#### 3. تفعيل في قاعدة البيانات
```sql
UPDATE notification_settings 
SET is_enabled_slack = 1, is_enabled_teams = 1;
```

#### 4. الاختبار
```bash
# Slack
curl -X POST http://localhost:3001/api/integrations/slack/test

# Teams
curl -X POST http://localhost:3001/api/integrations/teams/test
```

✅ **تم! الآن إشعاراتك ستُرسل تلقائياً لـ Slack و Teams**

---

## 📚 الوثائق

### 📖 الأدلة الكاملة

1. **[دليل الإعداد السريع](./SETUP_GUIDE_AR.md)**
   - إعداد خطوة بخطوة
   - حل المشاكل الشائعة
   - Checklist كامل

2. **[الوثائق التفصيلية](./SLACK_TEAMS_INTEGRATION.md)**
   - شرح معماري
   - تكوين متقدم
   - أمان وأفضل الممارسات

3. **[دليل سريع](./INTEGRATIONS_QUICKSTART_AR.md)**
   - بدء في 5 دقائق
   - أوامر أساسية
   - استكشاف سريع

4. **[أمثلة عملية](./INTEGRATION_EXAMPLES.md)**
   - أمثلة كود كاملة
   - Workflows حقيقية
   - تخصيص متقدم

5. **[ملخص شامل](./INTEGRATION_SUMMARY_AR.md)**
   - نظرة عامة على التنفيذ
   - إحصائيات الكود
   - خطوات قادمة

### 🎬 دروس فيديو (قريباً)
- [ ] إعداد Slack من الصفر
- [ ] إعداد Teams من الصفر
- [ ] إنشاء Slash Commands
- [ ] تخصيص الرسائل

---

## 📋 المتطلبات

### الأساسية
- Node.js >= 14.x
- npm أو yarn
- SQLite database
- Backend يعمل على port 3001

### للتطوير
- ngrok (للاختبار المحلي)
- Postman أو curl (للاختبار)

### الحسابات
- ✅ Slack Workspace (مجاني)
- ✅ Microsoft 365 account (مجاني للتجربة)

---

## ⚙️ التكوين

### متغيرات البيئة

أضف في `backend/.env`:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL_GENERAL=#general
SLACK_CHANNEL_BRDS=#brds
SLACK_CHANNEL_STORIES=#stories

# Teams Configuration
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/URL
TEAMS_BOT_APP_ID=your-bot-app-id
TEAMS_BOT_PASSWORD=your-bot-password
TEAMS_TENANT_ID=your-tenant-id

# App Configuration
FRONTEND_URL=http://localhost:3000
```

### قاعدة البيانات

Migration سيعمل تلقائياً، أو شغّله يدوياً:

```bash
node backend/src/db/migrations/011_add_integration_columns.js
```

---

## 💻 الاستخدام

### في الكود

```javascript
const { notify } = require('./services/notificationService');

// إرسال إشعار
await notify(userId, 'BRD_CREATED', {
  brd_id: 123,
  brd_title: 'مشروع جديد',
  brd_description: 'وصف المشروع',
  actor_name: 'أحمد علي'
});

// سيُرسل تلقائياً لـ:
// - in-app notification ✅
// - email (إذا مفعّل) ✅
// - Slack (إذا مفعّل) ✅
// - Teams (إذا مفعّل) ✅
```

### من Slack

```
/brd list           → قائمة BRDs
/story list         → قائمة Stories
```

### من Teams

```
search login        → البحث
brd list            → قائمة BRDs
help                → المساعدة
```

---

## 🔌 API Reference

### Slack Endpoints

```
POST   /api/integrations/slack/commands       # Slash commands
POST   /api/integrations/slack/interactions   # Button clicks
POST   /api/integrations/slack/events         # Slack events
POST   /api/integrations/slack/test           # Test notification
GET    /api/integrations/slack/status         # Configuration status
```

### Teams Endpoints

```
POST   /api/integrations/teams/webhook        # Incoming webhooks
POST   /api/integrations/teams/messages       # Bot messages
POST   /api/integrations/teams/actions        # Card actions
POST   /api/integrations/teams/search         # Search
POST   /api/integrations/teams/test           # Test notification
GET    /api/integrations/teams/status         # Configuration status
GET    /api/integrations/teams/tab/config     # Tab configuration
```

### أمثلة cURL

```bash
# Slack - إرسال اختباري
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "#general"}'

# Teams - إرسال اختباري
curl -X POST http://localhost:3001/api/integrations/teams/test

# الحصول على حالة Slack
curl http://localhost:3001/api/integrations/slack/status

# الحصول على حالة Teams
curl http://localhost:3001/api/integrations/teams/status
```

---

## 🐛 استكشاف الأخطاء

### Slack لا يستقبل إشعارات

```bash
# 1. تحقق من التكوين
curl http://localhost:3001/api/integrations/slack/status

# 2. تحقق من .env
cat backend/.env | grep SLACK

# 3. تحقق من قاعدة البيانات
sqlite3 backend/database.db "SELECT * FROM notification_settings LIMIT 1;"

# 4. جرب إرسال اختباري
curl -X POST http://localhost:3001/api/integrations/slack/test
```

### Teams لا يستقبل إشعارات

```bash
# 1. تحقق من التكوين
curl http://localhost:3001/api/integrations/teams/status

# 2. تحقق من Webhook URL
echo $TEAMS_WEBHOOK_URL

# 3. تحقق من أن Connector نشط في Teams
# Teams → القناة → ... → Connectors → Incoming Webhook

# 4. جرب إرسال اختباري
curl -X POST http://localhost:3001/api/integrations/teams/test
```

### Slash Commands لا تعمل

```bash
# 1. تأكد من ngrok يعمل
ngrok http 3001

# 2. حدّث URLs في Slack App Settings
# https://api.slack.com/apps → تطبيقك → Slash Commands

# 3. تأكد من Signing Secret صحيح
cat backend/.env | grep SLACK_SIGNING_SECRET

# 4. تأكد من Bot مضاف للقناة
# في Slack: /invite @BA Assistant Bot
```

للمزيد: [دليل حل المشاكل](./SETUP_GUIDE_AR.md#-حل-المشاكل-الشائعة)

---

## 📊 الإحصائيات

### الكود المضاف
- **2,150+** سطر من الكود
- **10** ملفات جديدة
- **13** API endpoints
- **10** أنواع إشعارات
- **6** أوامر تفاعلية

### الملفات
```
backend/src/
├── services/
│   ├── slackService.js         (522 lines)
│   └── teamsService.js         (620 lines)
├── controllers/
│   ├── slackController.js      (208 lines)
│   └── teamsController.js      (232 lines)
├── routes/
│   ├── slackRoutes.js          (28 lines)
│   └── teamsRoutes.js          (40 lines)
└── db/migrations/
    └── 011_add_integration_columns.js
```

---

## 🎨 التخصيص

### تخصيص رسائل Slack

```javascript
// في slackService.js
buildNotificationBlocks(type, metadata) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'عنوان مخصص'
      }
    },
    // ... أضف blocks حسب احتياجك
  ];
  return blocks;
}
```

### تخصيص بطاقات Teams

```javascript
// في teamsService.js
buildAdaptiveCard(type, metadata) {
  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        // ... خصص البطاقة
      }
    }]
  };
  return card;
}
```

---

## 🔒 الأمان

### Slack
- ✅ Signature Verification
- ✅ Replay Attack Prevention
- ✅ Timestamp Validation

### Teams
- ⚠️ Webhook-based (no additional auth needed)
- ✅ Can add JWT validation for Bot Framework

---

## 🌟 الميزات القادمة

### قريباً
- [ ] Analytics Dashboard
- [ ] User Preferences
- [ ] i18n Support
- [ ] AI-powered responses

### مخطط لها
- [ ] Bidirectional Sync
- [ ] Mobile Apps
- [ ] Advanced Workflows
- [ ] Custom Integrations API

---

## 🤝 المساهمة

نرحب بمساهماتك! لإضافة ميزات جديدة:

1. Fork المشروع
2. أنشئ branch جديد: `git checkout -b feature/amazing-feature`
3. Commit التغييرات: `git commit -m 'Add amazing feature'`
4. Push للـ branch: `git push origin feature/amazing-feature`
5. افتح Pull Request

---

## 📄 الرخصة

MIT License - راجع ملف LICENSE

---

## 👥 الدعم

### الحصول على المساعدة
- 📖 [الوثائق الكاملة](./SLACK_TEAMS_INTEGRATION.md)
- 💬 افتح Issue في GitHub
- 📧 راسلنا على: support@example.com

### الموارد المفيدة
- [Slack API Docs](https://api.slack.com/)
- [Teams Developer Docs](https://dev.teams.microsoft.com/)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)

---

## ✅ Checklist

قبل البدء، تأكد من:
- [ ] قراءة [دليل الإعداد](./SETUP_GUIDE_AR.md)
- [ ] تكوين Environment Variables
- [ ] تشغيل Database Migration
- [ ] اختبار Webhooks
- [ ] قراءة [الأمثلة](./INTEGRATION_EXAMPLES.md)

---

## 🎉 جاهز للاستخدام!

بعد اتباع دليل الإعداد، ستكون قادراً على:
- ✅ استقبال إشعارات في Slack
- ✅ استقبال بطاقات في Teams
- ✅ استخدام Slash Commands
- ✅ التفاعل مع البطاقات
- ✅ البحث من المنصات

**ابدأ الآن:** [دليل الإعداد السريع](./SETUP_GUIDE_AR.md)

---

**آخر تحديث:** 6 فبراير 2026  
**الإصدار:** 1.0.0  
**الحالة:** ✅ Production Ready

</div>

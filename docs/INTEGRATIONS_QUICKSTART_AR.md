# دليل سريع - تكامل Slack & Microsoft Teams

## ⚡ البدء السريع

### 1️⃣ Slack (5 دقائق)

#### الخطوة 1: إنشاء Webhook
1. اذهب لقناة Slack المطلوبة
2. انقر على اسم القناة → Integrations → Add an app
3. ابحث عن "Incoming WebHooks" → Add
4. انسخ Webhook URL

#### الخطوة 2: التكوين
أضف في `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL_GENERAL=#general
```

#### الخطوة 3: الاختبار
```bash
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "#general"}'
```

### 2️⃣ Microsoft Teams (3 دقائق)

#### الخطوة 1: إنشاء Webhook
1. افتح قناة Teams
2. انقر "..." → Connectors → Incoming Webhook
3. اسم: "Business Analyst Assistant"
4. انسخ URL

#### الخطوة 2: التكوين
أضف في `.env`:
```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/URL
FRONTEND_URL=http://localhost:3000
```

#### الخطوة 3: الاختبار
```bash
curl -X POST http://localhost:3001/api/integrations/teams/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3️⃣ تفعيل الإشعارات

```sql
-- تفعيل Slack
UPDATE notification_settings SET is_enabled_slack = 1;

-- تفعيل Teams
UPDATE notification_settings SET is_enabled_teams = 1;
```

## 🎯 الأوامر المتاحة

### Slack Commands (بعد إعداد Bot)
- `/brd list` - عرض آخر BRDs
- `/story list` - عرض آخر Stories

### Teams Bot Commands
- `search [query]` - البحث
- `brd list` - BRDs
- `story list` - Stories

## 📊 أنواع الإشعارات

| النوع | الوصف | Slack | Teams |
|------|-------|:-----:|:-----:|
| BRD_CREATED | BRD جديد | ✅ | ✅ |
| BRD_APPROVED | موافقة | ✅ | ✅ |
| STORY_ASSIGNED | تعيين | ✅ | ✅ |
| COMMENT_ADDED | تعليق | ✅ | ✅ |
| MENTION | إشارة | ✅ | ✅ |

## 🔧 إعداد متقدم (اختياري)

### Slack Bot (للأوامر)
1. https://api.slack.com/apps → Create App
2. Bot Token Scopes: `chat:write`, `commands`
3. Install to Workspace
4. أضف في `.env`:
```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
```

5. Slash Commands URL: `https://your-domain/api/integrations/slack/commands`

### Teams Bot (للميزات المتقدمة)
1. https://dev.botframework.com/ → Create Bot
2. أضف في `.env`:
```env
TEAMS_BOT_APP_ID=your-app-id
TEAMS_BOT_PASSWORD=your-password
```

## 🐛 استكشاف المشاكل

### Slack لا يستقبل
- ✅ Bot مضاف للقناة؟
- ✅ Webhook URL صحيح؟
- ✅ `is_enabled_slack = 1` في DB؟

### Teams لا يستقبل
- ✅ Connector نشط في القناة؟
- ✅ Webhook URL صحيح؟
- ✅ `is_enabled_teams = 1` في DB؟

### التحقق من الحالة
```bash
# Slack
curl http://localhost:3001/api/integrations/slack/status

# Teams
curl http://localhost:3001/api/integrations/teams/status
```

## 📱 التكامل في الكود

```javascript
// في أي controller
const { notify } = require('../services/notificationService');

// إرسال إشعار
await notify(userId, 'BRD_CREATED', {
  brd_id: 123,
  brd_title: 'مشروع جديد',
  actor_name: 'أحمد علي'
});

// سيتم الإرسال تلقائياً إلى:
// - التطبيق (in-app)
// - البريد الإلكتروني (إن فعّل)
// - Slack (إن فعّل)
// - Teams (إن فعّل)
```

## 🌐 للتطوير المحلي

استخدم ngrok:
```bash
ngrok http 3001
# استخدم URL في Slack/Teams settings
```

## ✅ Checklist

- [ ] نسخ Webhook URLs
- [ ] تحديث `.env`
- [ ] إعادة تشغيل السيرفر
- [ ] تشغيل migration
- [ ] تفعيل في قاعدة البيانات
- [ ] اختبار الإشعارات
- [ ] تجربة الأوامر (اختياري)

---

**للمساعدة:** راجع [SLACK_TEAMS_INTEGRATION.md](./SLACK_TEAMS_INTEGRATION.md)

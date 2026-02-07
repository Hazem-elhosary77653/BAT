# Slack & Microsoft Teams Integration

تم تنفيذ تكامل شامل مع Slack و Microsoft Teams لنظام Business Analyst Assistant.

## 🎯 الميزات المنفذة

### 1. تكامل Slack

#### الإشعارات
- ✅ إرسال إشعارات تلقائية للقنوات عند:
  - إنشاء BRD جديد
  - الموافقة على BRD
  - إنشاء أو تعيين Story
  - إضافة تعليقات
  - الإشارة للمستخدمين

#### Slash Commands
- ✅ `/brd create` - فتح صفحة إنشاء BRD
- ✅ `/brd list` - عرض آخر 5 BRDs
- ✅ `/story list` - عرض آخر 5 Stories

#### Interactive Components
- ✅ أزرار الموافقة السريعة على BRDs
- ✅ أزرار طلب التعديلات
- ✅ معاينة البطاقات مع روابط مباشرة

### 2. تكامل Microsoft Teams

#### Adaptive Cards
- ✅ بطاقات تفاعلية للإشعارات
- ✅ عرض تفاصيل BRDs و Stories
- ✅ أزرار إجراءات سريعة
- ✅ تنسيق احترافي مع ألوان مميزة

#### Bot Commands
- ✅ `search [query]` - البحث في BRDs و Stories
- ✅ `brd list` - عرض آخر BRDs
- ✅ `story list` - عرض آخر Stories

#### Teams Tab
- ✅ تبويب مخصص في Teams
- ✅ عرض Dashboard كامل
- ✅ وصول مباشر لجميع الميزات

## 📁 الملفات المنشأة

### Backend Services
```
backend/src/services/
├── slackService.js          # خدمة تكامل Slack
└── teamsService.js          # خدمة تكامل Teams
```

### Controllers
```
backend/src/controllers/
├── slackController.js       # معالج طلبات Slack
└── teamsController.js       # معالج طلبات Teams
```

### Routes
```
backend/src/routes/
├── slackRoutes.js          # مسارات API لـ Slack
└── teamsRoutes.js          # مسارات API لـ Teams
```

### Database Migration
```
backend/src/db/migrations/
└── 011_add_integration_columns.js  # إضافة أعمدة التكامل
```

## 🔧 التكوين

### 1. إعداد Slack

#### إنشاء Slack App
1. اذهب إلى https://api.slack.com/apps
2. انقر "Create New App" → "From scratch"
3. اختر اسم التطبيق والـ Workspace

#### تفعيل الميزات
1. **Bot Token Scopes** (OAuth & Permissions):
   ```
   - chat:write
   - chat:write.public
   - commands
   - channels:read
   - groups:read
   - im:read
   - mpim:read
   - users:read
   ```

2. **Slash Commands** (Slash Commands):
   - Command: `/brd`
   - Request URL: `https://your-domain.com/api/integrations/slack/commands`
   - Description: "BRD management commands"
   
   - Command: `/story`
   - Request URL: `https://your-domain.com/api/integrations/slack/commands`
   - Description: "Story management commands"

3. **Interactivity** (Interactivity & Shortcuts):
   - Request URL: `https://your-domain.com/api/integrations/slack/interactions`

4. **Event Subscriptions** (Event Subscriptions):
   - Request URL: `https://your-domain.com/api/integrations/slack/events`
   - Subscribe to: `app_mention`, `message.im`

#### الحصول على Tokens
1. من "OAuth & Permissions" → انسخ "Bot User OAuth Token"
2. من "Basic Information" → انسخ "Signing Secret"

#### Incoming Webhooks
1. فعّل "Incoming Webhooks"
2. أنشئ webhook جديد للقناة المطلوبة
3. انسخ Webhook URL

#### تحديث .env
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL_GENERAL=#general
SLACK_CHANNEL_BRDS=#brds
SLACK_CHANNEL_STORIES=#stories
```

### 2. إعداد Microsoft Teams

#### إنشاء Teams Webhook
1. افتح قناة Teams المطلوبة
2. انقر على "..." → "Connectors"
3. ابحث عن "Incoming Webhook"
4. اضغط "Configure"
5. أدخل اسماً والصق صورة (اختياري)
6. انسخ Webhook URL

#### تحديث .env
```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL
FRONTEND_URL=http://localhost:3000
```

#### إنشاء Teams Bot (اختياري - للميزات المتقدمة)
1. اذهب إلى https://dev.botframework.com/
2. أنشئ bot جديد
3. سجل الـ App ID و Password
4. أضف Teams channel

```env
TEAMS_BOT_APP_ID=your-bot-app-id
TEAMS_BOT_PASSWORD=your-bot-password
TEAMS_TENANT_ID=your-tenant-id
```

### 3. تحديث قاعدة البيانات

قم بتشغيل Migration:
```bash
cd backend
node src/db/migrations/011_add_integration_columns.js
```

أو قم بإعادة تشغيل السيرفر (سيتم تشغيل Migration تلقائياً):
```bash
npm run dev
```

## 🚀 الاستخدام

### اختبار التكامل

#### Slack
```bash
# Test notification
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "#general", "type": "SYSTEM_ANNOUNCEMENT"}'

# Check status
curl http://localhost:3001/api/integrations/slack/status
```

#### Teams
```bash
# Test notification
curl -X POST http://localhost:3001/api/integrations/teams/test \
  -H "Content-Type: application/json" \
  -d '{"type": "SYSTEM_ANNOUNCEMENT"}'

# Check status
curl http://localhost:3001/api/integrations/teams/status
```

### تفعيل الإشعارات في قاعدة البيانات

```sql
-- تفعيل إشعارات Slack لنوع معين
UPDATE notification_settings 
SET is_enabled_slack = 1 
WHERE type = 'BRD_CREATED';

-- تفعيل إشعارات Teams
UPDATE notification_settings 
SET is_enabled_teams = 1 
WHERE type = 'BRD_CREATED';

-- تفعيل كل الإشعارات لكل المنصات
UPDATE notification_settings 
SET is_enabled_slack = 1, is_enabled_teams = 1;
```

## 📡 API Endpoints

### Slack Endpoints
```
POST   /api/integrations/slack/commands       # Slash commands
POST   /api/integrations/slack/interactions   # Button clicks, menus
POST   /api/integrations/slack/events         # Events from Slack
POST   /api/integrations/slack/test           # Test notification
GET    /api/integrations/slack/status         # Configuration status
```

### Teams Endpoints
```
POST   /api/integrations/teams/webhook        # Incoming webhooks
POST   /api/integrations/teams/messages       # Bot messages
POST   /api/integrations/teams/actions        # Card actions
POST   /api/integrations/teams/search         # Search from Teams
POST   /api/integrations/teams/test           # Test notification
GET    /api/integrations/teams/status         # Configuration status
GET    /api/integrations/teams/tab/config     # Tab configuration
POST   /api/integrations/teams/compose-extension/query  # Compose extension
```

## 🎨 أنواع الإشعارات المدعومة

- ✅ `BRD_CREATED` - إنشاء BRD جديد
- ✅ `BRD_UPDATED` - تحديث BRD
- ✅ `BRD_APPROVED` - الموافقة على BRD
- ✅ `BRD_REJECTED` - رفض BRD
- ✅ `STORY_CREATED` - إنشاء Story جديدة
- ✅ `STORY_ASSIGNED` - تعيين Story
- ✅ `STORY_STATUS_CHANGED` - تغيير حالة Story
- ✅ `COMMENT_ADDED` - إضافة تعليق
- ✅ `MENTION` - إشارة لمستخدم
- ✅ `SYSTEM_ANNOUNCEMENT` - إعلان نظام

## 🔐 الأمان

### Slack
- ✅ التحقق من التوقيع (Signature Verification)
- ✅ منع هجمات Replay
- ✅ التحقق من Timestamp

### Teams
- ⚠️ Webhook-based (لا يتطلب مصادقة إضافية)
- ✅ يمكن إضافة JWT validation للـ Bot Framework

## 🎯 أمثلة الاستخدام

### إرسال إشعار عند إنشاء BRD
```javascript
const { notify } = require('./services/notificationService');

// بعد إنشاء BRD
await notify(userId, 'BRD_CREATED', {
  brd_id: brd.id,
  brd_title: brd.title,
  brd_description: brd.description,
  actor_name: user.name,
  status: brd.status,
  created_at: new Date().toISOString()
});
```

### إرسال إشعار عند تعيين Story
```javascript
await notify(assigneeId, 'STORY_ASSIGNED', {
  story_id: story.id,
  story_title: story.title,
  story_description: story.description,
  assignee_name: assignee.name,
  priority: story.priority,
  status: story.status
});
```

## 📝 التخصيص

### تخصيص رسائل Slack
عدّل في `slackService.js`:
```javascript
buildNotificationBlocks(type, metadata) {
  // خصص الـ blocks حسب احتياجاتك
}
```

### تخصيص بطاقات Teams
عدّل في `teamsService.js`:
```javascript
buildAdaptiveCard(type, metadata) {
  // خصص الـ Adaptive Card
}
```

## 🔍 استكشاف الأخطاء

### Slack لا يستقبل إشعارات
1. تحقق من Bot Token في `.env`
2. تأكد من أن Bot مضاف للقناة
3. تحقق من Scopes المطلوبة
4. راجع logs السيرفر

### Teams لا يستقبل إشعارات
1. تحقق من Webhook URL
2. تأكد من أن Connector نشط
3. جرب Test endpoint أولاً
4. راجع format البطاقات

### Slash Commands لا تعمل
1. تحقق من Request URL في إعدادات Slack
2. تأكد من أن السيرفر accessible من الإنترنت
3. استخدم ngrok للتطوير المحلي
4. راجع Signing Secret

## 🌐 Development مع ngrok

للتطوير المحلي:
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3001

# استخدم URL من ngrok في إعدادات Slack/Teams
```

## ✅ الخلاصة

تم تنفيذ:
- ✅ خدمات تكامل Slack و Teams
- ✅ Controllers و Routes
- ✅ تحديث نظام الإشعارات
- ✅ Database migrations
- ✅ التكوينات والوثائق
- ✅ API endpoints كاملة
- ✅ أمثلة وتعليمات الاستخدام

النظام جاهز للاستخدام بعد إعداد التكوينات المطلوبة!

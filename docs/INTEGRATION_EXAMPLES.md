# أمثلة عملية - تكامل Slack & Teams

## 📝 أمثلة الاستخدام في الكود

### 1. إرسال إشعار عند إنشاء BRD

```javascript
// في brdController.js
const { notify } = require('../services/notificationService');

const createBRD = async (req, res) => {
  try {
    const { title, description, ...rest } = req.body;
    const userId = req.user.id;
    
    // إنشاء BRD
    const brd = await db.prepare(`
      INSERT INTO brds (title, description, created_by, created_at)
      VALUES (?, ?, ?, datetime('now'))
      RETURNING *
    `).get(title, description, userId);
    
    // إرسال إشعار
    const user = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
    
    await notify(userId, 'BRD_CREATED', {
      brd_id: brd.id,
      brd_title: brd.title,
      brd_description: brd.description,
      actor_name: user.name,
      actor_id: userId,
      status: brd.status,
      created_at: brd.created_at
    });
    
    // سيتم إرسال الإشعار تلقائياً إلى:
    // ✅ التطبيق (in-app)
    // ✅ البريد الإلكتروني (إذا مفعّل)
    // ✅ Slack (إذا مفعّل)
    // ✅ Teams (إذا مفعّل)
    
    res.json({ success: true, brd });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 2. إرسال إشعار عند تعيين Story

```javascript
// في storiesController.js
const assignStory = async (req, res) => {
  try {
    const { storyId, assigneeId } = req.body;
    const assignerId = req.user.id;
    
    // تحديث Story
    await db.prepare(`
      UPDATE stories 
      SET assigned_to = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(assigneeId, storyId);
    
    // الحصول على البيانات
    const story = await db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId);
    const assignee = await db.prepare('SELECT name FROM users WHERE id = ?').get(assigneeId);
    const assigner = await db.prepare('SELECT name FROM users WHERE id = ?').get(assignerId);
    
    // إرسال إشعار للمستلم
    await notify(assigneeId, 'STORY_ASSIGNED', {
      story_id: story.id,
      story_title: story.title,
      story_description: story.description,
      assignee_name: assignee.name,
      actor_name: assigner.name,
      actor_id: assignerId,
      priority: story.priority,
      status: story.status
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. إرسال إشعار عند إضافة تعليق

```javascript
// في commentsController.js
const addComment = async (req, res) => {
  try {
    const { resourceType, resourceId, text, mentions } = req.body;
    const userId = req.user.id;
    
    // إضافة التعليق
    const comment = await db.prepare(`
      INSERT INTO comments (resource_type, resource_id, user_id, text, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      RETURNING *
    `).get(resourceType, resourceId, userId, text);
    
    const user = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
    
    // إشعار صاحب المورد
    const resource = await db.prepare(`
      SELECT created_by FROM ${resourceType}s WHERE id = ?
    `).get(resourceId);
    
    if (resource.created_by !== userId) {
      await notify(resource.created_by, 'COMMENT_ADDED', {
        comment_id: comment.id,
        comment_text: text,
        actor_name: user.name,
        actor_id: userId,
        resource_type: resourceType,
        resource_id: resourceId
      });
    }
    
    // إشعار المستخدمين المذكورين
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== userId) {
          await notify(mentionedUserId, 'MENTION', {
            comment_text: text,
            actor_name: user.name,
            actor_id: userId,
            resource_type: resourceType,
            resource_id: resourceId
          });
        }
      }
    }
    
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 4. إرسال إشعار نظام شامل

```javascript
// في systemController.js
const { notifyBulk } = require('../services/notificationService');

const sendSystemAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const adminId = req.user.id;
    
    const admin = await db.prepare('SELECT name FROM users WHERE id = ?').get(adminId);
    
    // إرسال لجميع المستخدمين
    await notifyBulk('SYSTEM_ANNOUNCEMENT', {
      message: message,
      actor_name: admin.name,
      actor_id: adminId,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Announcement sent to all users' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 5. إرسال مباشر إلى Slack

```javascript
// إرسال مباشر دون المرور بنظام الإشعارات
const slackService = require('../services/slackService');

const sendCustomSlackMessage = async (req, res) => {
  try {
    const { channel, message } = req.body;
    
    const result = await slackService.sendMessage(
      channel,
      message,
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*رسالة مخصصة:*\n${message}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'عرض المزيد' },
              url: `${process.env.FRONTEND_URL}/dashboard`
            }
          ]
        }
      ]
    );
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 6. إرسال مباشر إلى Teams

```javascript
// إرسال مباشر إلى Teams
const teamsService = require('../services/teamsService');

const sendCustomTeamsCard = async (req, res) => {
  try {
    const { title, message, actions } = req.body;
    
    const card = {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: title,
              weight: 'Bolder',
              size: 'Large'
            },
            {
              type: 'TextBlock',
              text: message,
              wrap: true
            }
          ],
          actions: actions?.map(a => ({
            type: 'Action.OpenUrl',
            title: a.title,
            url: a.url
          }))
        }
      }]
    };
    
    const result = await teamsService.sendMessage('', card);
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🔧 أمثلة تكوين قاعدة البيانات

### تفعيل إشعارات Slack لأنواع معينة

```sql
-- تفعيل Slack لـ BRD فقط
UPDATE notification_settings 
SET is_enabled_slack = 1 
WHERE type LIKE 'BRD_%';

-- تفعيل Slack لـ Stories فقط
UPDATE notification_settings 
SET is_enabled_slack = 1 
WHERE type LIKE 'STORY_%';

-- تفعيل Slack لكل شيء
UPDATE notification_settings 
SET is_enabled_slack = 1;
```

### تفعيل إشعارات Teams

```sql
-- تفعيل Teams لأنواع محددة
UPDATE notification_settings 
SET is_enabled_teams = 1 
WHERE type IN ('BRD_CREATED', 'BRD_APPROVED', 'STORY_ASSIGNED');

-- تفعيل Teams لكل شيء
UPDATE notification_settings 
SET is_enabled_teams = 1;
```

### ربط مستخدمين بحساباتهم في Slack

```sql
-- ربط مستخدم بحساب Slack
UPDATE users 
SET slack_user_id = 'U1234567890'
WHERE email = 'user@example.com';

-- ربط مستخدم بحساب Teams
UPDATE users 
SET teams_user_id = '29:1a2b3c4d5e6f'
WHERE email = 'user@example.com';
```

---

## 🌐 أمثلة cURL للاختبار

### اختبار Slack

```bash
# إرسال إشعار اختباري
curl -X POST http://localhost:3001/api/integrations/slack/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#general",
    "type": "SYSTEM_ANNOUNCEMENT"
  }'

# التحقق من الحالة
curl http://localhost:3001/api/integrations/slack/status

# محاكاة Slash Command
curl -X POST http://localhost:3001/api/integrations/slack/commands \
  -d "command=/brd" \
  -d "text=list" \
  -d "user_id=U1234567890"
```

### اختبار Teams

```bash
# إرسال إشعار اختباري
curl -X POST http://localhost:3001/api/integrations/teams/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BRD_CREATED",
    "webhook": "https://outlook.office.com/webhook/..."
  }'

# التحقق من الحالة
curl http://localhost:3001/api/integrations/teams/status

# البحث من Teams
curl -X POST http://localhost:3001/api/integrations/teams/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "login",
    "userId": 1
  }'
```

---

## 🎨 أمثلة تخصيص Slack Blocks

### بطاقة BRD مخصصة

```javascript
const customBRDBlocks = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🎯 BRD جديد يحتاج لمراجعتك'
    }
  },
  {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*العنوان:*\n${brdTitle}`
      },
      {
        type: 'mrkdwn',
        text: `*الأولوية:*\n🔴 عالية`
      }
    ]
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*الوصف:*\n${description}`
    }
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `من: *${creatorName}* | تاريخ: ${date}`
      }
    ]
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '✅ موافقة' },
        style: 'primary',
        action_id: `approve_${brdId}`
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '📝 طلب تعديل' },
        action_id: `request_changes_${brdId}`
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '👁️ عرض' },
        url: `${process.env.FRONTEND_URL}/brds/${brdId}`
      }
    ]
  }
];
```

---

## 🎴 أمثلة تخصيص Teams Cards

### بطاقة Story مخصصة

```javascript
const customStoryCard = {
  type: 'message',
  attachments: [{
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'auto',
              items: [{
                type: 'Image',
                url: 'https://your-domain.com/icon.png',
                size: 'Small'
              }]
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [{
                type: 'TextBlock',
                text: '📋 Story جديدة',
                weight: 'Bolder',
                size: 'Large'
              }]
            }
          ]
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'العنوان:', value: storyTitle },
            { title: 'المُعيّن:', value: assigneeName },
            { title: 'الأولوية:', value: priority },
            { title: 'الحالة:', value: status }
          ]
        },
        {
          type: 'TextBlock',
          text: description,
          wrap: true,
          maxLines: 3
        }
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: '✅ قبول المهمة',
          url: `${process.env.FRONTEND_URL}/stories/${storyId}/accept`,
          style: 'positive'
        },
        {
          type: 'Action.OpenUrl',
          title: '👁️ عرض التفاصيل',
          url: `${process.env.FRONTEND_URL}/stories/${storyId}`
        }
      ]
    }
  }]
};
```

---

## 🤖 أمثلة استخدام من Slack

### مثال Slash Command

```
المستخدم: /brd list

الرد:
📄 Recent BRDs
━━━━━━━━━━━━━━
1. تطوير نظام المصادقة
   Status: Draft | عرض →

2. تحسين واجهة المستخدم
   Status: In Review | عرض →

3. تكامل مع API الدفع
   Status: Approved | عرض →
```

### مثال Interactive Button

```
إشعار في Slack:
━━━━━━━━━━━━━━
📄 New BRD Created

BRD: تطوير نظام الإشعارات
Created by: أحمد علي

[✅ Approve] [📝 Request Changes] [👁️ View BRD]

المستخدم يضغط: ✅ Approve

الرد:
✅ BRD approval request submitted. 
Please approve through the web interface for full audit trail.
```

---

## 💬 أمثلة استخدام من Teams

### مثال Bot Command

```
المستخدم: search authentication

الرد: (Adaptive Card)
━━━━━━━━━━━━━━
🔍 Search Results for "authentication"

Found 3 result(s)

📄 تطوير نظام المصادقة
   BRD - Draft
   [View →]

📋 تنفيذ OAuth 2.0
   Story - In Progress
   [View →]

📄 تحديث سياسة الأمان
   BRD - Approved
   [View →]
```

### مثال Compose Extension

```
المستخدم في Teams: 
يكتب في message box → يضغط على أيقونة التطبيق

يظهر Search Box:
"Search BRDs and Stories..."

المستخدم يكتب: "login"

تظهر النتائج:
━━━━━━━━━━━━━━
📄 تطوير صفحة تسجيل الدخول
📋 تحسين تجربة Login
📄 إضافة 2FA للـ Login

المستخدم يختار واحدة → تُرسل كبطاقة في المحادثة
```

---

## 📊 مثال Workflow كامل

### سيناريو: إنشاء BRD والموافقة عليه

```javascript
// 1. إنشاء BRD
const brd = await createBRD({
  title: 'نظام إدارة المشاريع',
  description: 'تطوير نظام شامل...',
  createdBy: userId
});

// ↓ يتم إرسال إشعار تلقائياً

// 2. في Slack:
// 📄 New BRD Created
// نظام إدارة المشاريع
// Created by: أحمد علي
// [✅ Approve] [📝 Request Changes] [👁️ View]

// 3. في Teams:
// بطاقة تفاعلية مع تفاصيل كاملة

// 4. المدير يضغط Approve في Slack
// يتم توجيهه للـ Web Interface

// 5. بعد الموافقة:
await approveBRD(brdId, managerId);

// ↓ إشعار جديد

// 6. في Slack:
// ✅ BRD Approved
// نظام إدارة المشاريع
// Approved by: محمد سالم

// 7. في Teams:
// بطاقة بتنسيق أخضر مع علامة ✅

// 8. جميع المعنيين يستلمون الإشعارات:
// - in-app notification
// - email
// - Slack message
// - Teams card
```

---

## 🎯 نصائح الاستخدام الأمثل

### 1. اختيار القناة المناسبة
```javascript
// استخدم قنوات مختلفة لأنواع مختلفة
const getSlackChannel = (notificationType) => {
  const channelMap = {
    'BRD_CREATED': process.env.SLACK_CHANNEL_BRDS,
    'BRD_APPROVED': process.env.SLACK_CHANNEL_BRDS,
    'STORY_CREATED': process.env.SLACK_CHANNEL_STORIES,
    'STORY_ASSIGNED': process.env.SLACK_CHANNEL_STORIES,
    'SYSTEM_ANNOUNCEMENT': process.env.SLACK_CHANNEL_GENERAL
  };
  return channelMap[notificationType] || process.env.SLACK_CHANNEL_GENERAL;
};
```

### 2. تجميع الإشعارات
```javascript
// بدلاً من إرسال 10 إشعارات منفصلة
// اجمعهم في إشعار واحد
const assignMultipleStories = async (stories, assigneeId) => {
  // ... تعيين كل Stories
  
  // إرسال إشعار واحد مجمّع
  await notify(assigneeId, 'MULTIPLE_STORIES_ASSIGNED', {
    count: stories.length,
    stories: stories.map(s => s.title),
    assignee_name: assigneeName
  });
};
```

### 3. استخدام Mentions بذكاء
```javascript
// في Slack: استخدم @username للإشارة
const message = `<@${slackUserId}> تم تعيين Story جديدة لك`;

// في Teams: استخدم mention syntax
const teamsMessage = `@${teamsUserName} تم تعيين Story جديدة لك`;
```

---

**للمزيد من الأمثلة، راجع:**
- [SLACK_TEAMS_INTEGRATION.md](./SLACK_TEAMS_INTEGRATION.md)
- [INTEGRATIONS_QUICKSTART_AR.md](./INTEGRATIONS_QUICKSTART_AR.md)

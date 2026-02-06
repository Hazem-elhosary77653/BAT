# ⚡ الدليل السريع - Quick Start

## 🚀 ابدأ الآن في 5 خطوات

### الخطوة 1: استيراد المكون الرئيسي

```jsx
import CollaborativeTextEditor from '@/components/CollaborativeTextEditor';
```

### الخطوة 2: إضافة المكون إلى الصفحة

```jsx
<CollaborativeTextEditor
  brdId={brdId}
  userId={userId}
  userName={userName}
  content={content}
  onContentChange={setContent}
  section={{ id: sectionId }}
/>
```

### الخطوة 3: اختبر الميزات

```
✅ حدد أي نص بالماوس
✅ اختر من الخيارات التي تظهر
✅ انظر التغييرات تحدث فوراً
```

### الخطوة 4: قم بحفظ التغييرات

```jsx
const handleChange = async (newContent) => {
  setContent(newContent);
  await api.put(`/api/brd/${brdId}/section/${sectionId}`, {
    content: newContent
  });
};
```

### الخطوة 5: الاستمتاع! 🎉

```
كل شيء جاهز الآن لـ:
✨ تحديد وتلوين النصوص
👥 الإشارة للمستخدمين الآخرين
🤖 إعادة التوليد بالذكاء الاصطناعي
🔄 المشاركة الفورية
```

---

## 🎯 الميزات الأساسية

### 1️⃣ التلوين (Highlighting)
```
اختر نص → اضغط على الأيقونة → اختر لون → تم!
الألوان: 🟨 أصفر | 🟩 أخضر | 🟦 أزرق | 🟥 وردي | 🟪 بنفسجي
```

### 2️⃣ الإشارة (Mention)
```
اختر نص → اضغط على Mention → اختر مستخدم → إشعار يُرسل فوراً!
```

### 3️⃣ إعادة التوليد (AI Regeneration)
```
اختر نص → اضغط على ✨ → أدخل التعليمات → انتظر النتيجة → استبدل!
```

---

## 📊 نظرة عامة على البنية

```
CollaborativeTextEditor
├── useTextSelection Hook (التحديدات المحلية)
├── useCollaboration Hook (المشاركة الفورية)
├── SelectionToolbar (الـ toolbar الذي يظهر)
├── AIRegeneratePanel (لوحة الذكاء الاصطناعي)
└── HighlightedContent (عرض المحتوى)
```

---

## 🔌 الاتصالات الأساسية

```
Frontend ←→ WebSocket ←→ Backend
   ↓
إرسال تحديد/تلوين
   ↓
استقبال من مستخدمين آخرين
   ↓
تحديث الواجهة تلقائياً
```

---

## 💾 حفظ البيانات

```javascript
// بعد أي تغيير
onContentChange(newContent)
  ↓
POST /api/brd/{brdId}/section/{sectionId}
  ↓
حفظ في قاعدة البيانات
  ↓
إخطار المستخدمين الآخرين
```

---

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|--------|------|
| الـ toolbar لا يظهر | تأكد من اختيار نص صحيح |
| الهايلايتات لا تُشارك | تحقق من اتصال WebSocket |
| الذكاء الاصطناعي لا يرد | تحقق من مفتاح OpenAI API |
| الأخطاء في الكونسول | اطلع على السجلات في Backend |

---

## 📚 مصادر إضافية

- `COLLABORATIVE_EDITING_GUIDE.md` - الدليل الكامل
- `ADVANCED_COLLABORATION_GUIDE_AR.md` - دليل مفصل بالعربية
- `COLLABORATION_UPDATE_SUMMARY.md` - ملخص التحديثات

---

## ✨ نصائح للأداء الأفضل

```javascript
// 1. استخدم useMemo للـ activeUsers
const memoizedUsers = useMemo(() => activeUsers, [activeUsers]);

// 2. تجنب الـ re-renders غير الضرورية
const memoizedEditor = React.memo(CollaborativeTextEditor);

// 3. استخدم debounce للحفظ
const debouncedSave = debounce(saveContent, 2000);

// 4. قلل عدد الـ WebSocket listeners
// استخدم event delegation بدلاً من multiple listeners
```

---

## 🎓 مثال عملي كامل

```jsx
'use client';

import React, { useState } from 'react';
import CollaborativeTextEditor from '@/components/CollaborativeTextEditor';
import { useAuthStore } from '@/store';

export default function BRDSectionPage({ params }) {
  const { user } = useAuthStore();
  const { brdId, sectionId } = params;
  
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleContentChange = async (newContent) => {
    setContent(newContent);
    setSaving(true);

    try {
      await fetch(`/api/brd/${brdId}/section/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('فشل الحفظ:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">محرر البرد</h1>
        <div className="flex gap-4">
          {saving && <span className="text-blue-600">⏳ جاري الحفظ...</span>}
          {lastSaved && (
            <span className="text-green-600">
              ✅ تم الحفظ في {lastSaved.toLocaleTimeString('ar-SA')}
            </span>
          )}
        </div>
      </div>

      <CollaborativeTextEditor
        brdId={brdId}
        userId={user?.id}
        userName={user?.name}
        content={content}
        onContentChange={handleContentChange}
        section={{ id: sectionId }}
      />
    </div>
  );
}
```

---

**جاهز لتجربة النظام الجديد؟ ابدأ الآن! 🚀**

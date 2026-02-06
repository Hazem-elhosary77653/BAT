/**
 * BRD Generation Routes




























































































































































































































































































































































































































































































































































































































لأي استفسارات أو مشاكل، يرجى التواصل مع فريق التطوير! 🚀- ✅ توثيق شامل- ✅ أمان عالي الجودة- ✅ ذكاء اصطناعي متقدم- ✅ تعاون فوري وفعّال- ✅ واجهة سهلة وسريعةتم بناء نظام تعاون متقدم يجمع بين:## الخلاصة---   - إعادة الاتصال التلقائي عند انقطاع الاتصال   - المحاولات الفاشلة تُسجل   - الأخطاء تُرجع رسائل واضحة4. **معالجة الأخطاء**   - سجل النشاط يُحفظ لكل عملية   - لا يمكن تعديل تلوين من شخص آخر   - كل تلوين يُحفظ مع معرّف المستخدم3. **حماية البيانات**   - لا يمكن عمل highlight لقسم لا تملك صلاحية الوصول إليه   - يجب أن يكون لديك صلاحية التعديل   - يجب أن تكون عضواً في البرد2. **التحقق من الصلاحيات (Authorization)**   - يتم التحقق من هويتك قبل أي عملية   - جميع الـ endpoints تتطلب token صحيح1. **التحقق من الاستيقان (Authentication)**### ✅ فحوصات الأمان:## الأمان والصلاحيات---```}  );    </div>      />        activeUsers={activeUsers}        onClose={closeToolbar}        onHighlight={handleHighlight}        position={toolbarPosition}        selection={selection}      <SelectionToolbar      </div>        {content}      >        style={{ minHeight: '400px' }}        className="p-6 border rounded-lg bg-white"        ref={contentRef}      <div    <div>  return (  };    closeToolbar();    // إغلاق الـ toolbar        broadcastHighlight(selection, color);    // بث للآخرين        addHighlight(selection, color);    // إضافة محليًا  const handleHighlight = (color) => {  } = useCollaboration(brdId, userId, userName);    highlights: sharedHighlights    broadcastHighlight,    activeUsers,  const {  } = useTextSelection(contentRef, userId);    closeToolbar    removeHighlight,    addHighlight,    highlights,    toolbarPosition,    selection,  const {  const [content, setContent] = useState('محتوى قابل للتحديد');  const contentRef = useRef(null);export default function CustomEditor({ brdId, userId, userName }) {import SelectionToolbar from '@/components/SelectionToolbar';import useCollaboration from '@/hooks/useCollaboration';import useTextSelection from '@/hooks/useTextSelection';import React, { useRef, useState } from 'react';'use client';```jsx### مثال 2: استخدام Hooks منفصلة---```}  );    </div>      />        section={{ id: sectionId }}        onContentChange={handleContentChange}        content={content}        userName={userName}        userId={userId}        brdId={brdId}      <CollaborativeTextEditor      </div>        )}          </span>            آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}          <span className="text-sm text-gray-500">        {lastSaved && (        <h1 className="text-2xl font-bold">محرر البرد التعاوني</h1>      <div className="mb-4 flex items-center justify-between">    <div className="p-6">  return (  };    }      console.error('فشل الحفظ:', err);    } catch (err) {      setLastSaved(new Date());      });        content: newContent      await api.put(`/api/brd/${brdId}/section/${sectionId}`, {    try {    // حفظ في قاعدة البيانات        setContent(newContent);  const handleContentChange = async (newContent) => {  const [lastSaved, setLastSaved] = useState(null);  const [content, setContent] = useState('محتوى البرد الأولي');export default function BRDEditor({ brdId, sectionId, userId, userName }) {import CollaborativeTextEditor from '@/components/CollaborativeTextEditor';import React, { useState } from 'react';'use client';```jsx### مثال 1: المحرر التعاوني الكامل## أمثلة عملية---```}  }    "rewritten": "النص المُعدّل"    "original": "النص الأصلي",  "data": {  "success": true,{```json**Response:**```}  "context": "السياق الإضافي" // اختياري  "instruction": "صحح الأخطاء الإملائية",  "selection": "النص المختار",{```json**Body:**```POST /api/brd/smart-edit```bash### 2. Smart Edit---```}  }    "tokensUsed": 150    "timestamp": "2024-02-05T10:30:00Z",    "instruction": "اجعله أكثر احترافية",    "result": "النص الجديد المُحسّن",    "original": "النص الأصلي",  "data": {  "success": true,{```json**Response:**```}  "context": "السياق الإضافي" // اختياري  "sectionId": "section-456", // اختياري  "brdId": "brd-123",        // اختياري  "instruction": "اجعله أكثر احترافية",  "text": "النص المراد إعادة توليده",{```json**Body:**```POST /api/brd/regenerate-section```bash### 1. إعادة توليد قسم## API Endpoints---```});  });    selection: data.selection    userName: data.userName,    userId: data.userId,  console.log({socket.on('user-selection', (data) => {```javascript#### 3. تحديد من مستخدم آخر```});  });    highlightId: data.highlightId  console.log({socket.on('highlight-removed', (data) => {```javascript#### 2. تلوين تمت إزالته```});  });    timestamp: data.timestamp    mentionedUser: data.mentionedUser,    createdBy: data.createdBy,    color: data.color,    text: data.text,    highlightId: data.highlightId,  console.log({socket.on('highlight-added', (data) => {```javascript#### 1. تلوين تمت إضافته### من Server إلى Client:---```});  }    timestamp: new Date()    endOffset: 50,    startOffset: 10,    text: 'النص المختار',  selection: {  userName: 'أحمد محمد',  userId: 'user-789',  brdId: 'brd-123',socket.emit('user-selection', {```javascript#### 3. إرسال التحديد```});  highlightId: 'hl-456'  brdId: 'brd-123',socket.emit('remove-highlight', {```javascript#### 2. إزالة تلوين```});  timestamp: new Date()  mentionedUser: null,       // اختياري  createdBy: 'user-789',  color: 'yellow',           // yellow, green, blue, pink, purple  text: 'النص المراد تلوينه',  highlightId: 'hl-456',  brdId: 'brd-123',socket.emit('add-highlight', {```javascript#### 1. إضافة تلوين### من Client إلى Server:## WebSocket Events---```});  endOffset: 5  startOffset: 0,  text: 'النص',broadcastSelection({// بث التحديد الحاليremoveHighlightBroadcast(highlightId);// حذف تلوين مشترك);  mentionedUser  // المستخدم المُشار إليه (اختياري)  color,         // اللون  text,          // النص المراد تلوينهbroadcastHighlight(// بث تلوين مشترك```javascript**الوظائف الجديدة:**```} = useCollaboration(brdId, userId, userName);  // ... الوظائف الأخرى  broadcastSelection,        // إرسال التحديد  removeHighlightBroadcast,  // إزالة تلوين مشترك  broadcastHighlight,        // إرسال تلوين مشترك  userSelections,            // تحديدات المستخدمين  highlights,                 // الهايلايتات المشتركة  activity,                   // سجل النشاط  threads,                    // خيوط النقاش  mentions,                   // الإشارات المستقبلة  lockedSections,             // الأقسام المقفولة  activeUsers,                // المستخدمين النشطين  isConnected,                 // حالة الاتصالconst {import useCollaboration from '@/hooks/useCollaboration';```javascriptيدير التعاون الفوري والمشاركة بين المستخدمين.### useCollaboration.js 🤝---```closeToolbar();// إغلاق الـ toolbarmarkMentionAsRead(mentionId);// تعليم كمقروء);  { id: 'user1', name: 'أحمد' }  // المستخدم  text,           // النصconst mentionId = addMention(// إضافة إشارةremoveHighlight(highlightId);// إزالة تلوين);  mentionedUser   // المستخدم المُشار إليه (اختياري)  'yellow',       // اللون  text,           // النص المراد تلوينهconst highlightId = addHighlight(// إضافة تلوين```javascript**الوظائف:**```} = useTextSelection(contentRef, userId);  closeToolbar        // إغلاق الـ toolbar  markMentionAsRead,  // تعليم كمقروء  addMention,         // إضافة إشارة  removeHighlight,    // إزالة تلوين  addHighlight,       // إضافة تلوين  mentions,           // قائمة الإشارات  highlights,         // Map من الهايلايتات  toolbarPosition,    // موضع الـ toolbar  selection,           // النص المختارconst {import useTextSelection from '@/hooks/useTextSelection';```javascriptيدير تحديد النص والهايلايتات المحلية.### useTextSelection.js 🎯## الـ Hooks---| section | object | بيانات القسم | ❌ || onContentChange | function | معالج التغييرات | ✅ || content | string | محتوى القسم | ✅ || userName | string | اسم المستخدم | ✅ || userId | string | معرّف المستخدم | ✅ || brdId | string | معرّف البرد | ✅ ||------|------|--------|---------|| Prop | Type | الوصف | الإلزامي |**Props:**```/>  section={{ id: 'section-1' }}  onContentChange={(newContent) => saveContent(newContent)}  content="محتوى البرد"  userName="أحمد محمد"  userId="user-456"  brdId="brd-123"<CollaborativeTextEditorimport CollaborativeTextEditor from '@/components/CollaborativeTextEditor';```jsxالمكون الرئيسي الذي يجمع كل شيء معاً.### CollaborativeTextEditor.jsx 🎯---```/>  getUserName={(userId) => 'الاسم'}  onRemoveMention={(id) => {}}  onRemoveHighlight={(id) => {}}  mentions={[]}  ])}    }]      mentionedUser: null      createdBy: 'user1',      color: 'yellow',      text: 'نص',      id: 'hl-1',    ['hl-1', {  highlights={new Map([  content="محتوى الوثيقة"<HighlightedContentimport HighlightedContent from '@/components/HighlightedContent';```jsxيعرض المحتوى مع جميع التلوينات والإشارات.### HighlightedContent.jsx 📝---- استبدال النص أو إعادة المحاولة- عرض النتيجة في معاينة- اقتراحات سريعة (5 خيارات)- إدخال نص حر للتعليمات**المميزات:**```/>  onClose={() => console.log('Closed')}  onReplace={(newText) => console.log('New text:', newText)}  selection="النص المختار"<AIRegeneratePanelimport AIRegeneratePanel from '@/components/AIRegeneratePanel';```jsxلوحة متقدمة لإعادة توليد النص.### AIRegeneratePanel.jsx 🤖---| activeUsers | array | قائمة المستخدمين النشطين || onClose | function | معالج عند الإغلاق || onAIRegenerate | function | معالج عند الضغط على AI || onMention | function | معالج عند اختيار مستخدم || onHighlight | function | معالج عند اختيار لون || position | object | موضع الـ toolbar {top, left} || selection | string | النص المختار ||------|------|--------|| Prop | Type | الوصف |**Props:**```/>  activeUsers={activeUsers}  onClose={() => console.log('Closed')}  onAIRegenerate={() => console.log('AI Regen')}  onMention={(user) => console.log('Mentioned:', user)}  onHighlight={(color) => console.log('Color:', color)}  position={{ top: 100, left: 200 }}  selection="النص المختار"<SelectionToolbarimport SelectionToolbar from '@/components/SelectionToolbar';```jsxيظهر عند تحديد النص مباشرة مع الخيارات التالية.### SelectionToolbar.jsx ⚙️## المكونات---- معالجة الأخطاء والاستثناءات- معاينة النتيجة قبل القبول- اقتراحات سريعة جاهزة- إدخال تعليمات مخصصة**الخصائص:**```💼 اجعله مناسباً للعرض الرسمي🎯 أضف تفاصيل أكثر وضوحاً📝 اجعله أكثر احترافية✍️ حسّن الأسلوب والصياغة🇸🇦 ترجمه إلى اللغة العربية```**التعليمات السريعة:**### 4️⃣ إعادة التوليد بالذكاء الاصطناعي (AI Regeneration)---- عدم فقدان أي ملاحظات مهمة- تتبع من تم الإشارة إليه- إشعارات فورية للمستخدمين**الفائدة:**```يظهر notification عند المستخدم B    ↓يختار المستخدم B    ↓تظهر قائمة بالمستخدمين النشطين    ↓يضغط على زر Mention    ↓المستخدم A يحدد نص```**كيف يعمل:**### 3️⃣ الإشارة للمستخدمين (Mentions)---- إمكانية الإزالة بنقرة واحدة- معلومات عن من أضاف التلوين- قائمة بجميع التلوينات النشطة- العرض الفوري للتلوينات في المحتوى- اختيار اللون من picker سريع**الخصائص:**```🟪 بنفسجي  (Purple)   - الأفكار والاقتراحات🟥 وردي    (Pink)     - التحذيرات والنقاط الحساسة🟦 أزرق    (Blue)     - الأسئلة والملاحظات المهمة🟩 أخضر    (Green)    - المشاكل المحلولة والموافقات🟨 أصفر    (Yellow)   - الإشارات العامة والملاحظات```**الألوان المتاحة:**### 2️⃣ تلوين وتوضيح (Highlighting)---- لا حاجة للبحث عن الخيارات- واجهة بسيطة وسهلة الاستخدام- تفاعل فوري وسريع**الفائدة:**- الـ toolbar يحتوي على خيارات متعددة- يظهر toolbar صغير فوق النص مباشرة- المستخدم يحدد نص في المحرر**كيف يعمل:**### 1️⃣ تحديد النص (Text Selection)## المميزات الرئيسية---- المشاركة الفورية (Real-time Sharing) عبر WebSocket- إعادة التوليد بالذكاء الاصطناعي (AI Regeneration) للأقسام المختارة- الإشارة للمستخدمين (Mentions) مع إشعارات فورية- تلوين وتوضيح (Highlighting) بـ 5 ألوان مختلفة- تحديد النص (Text Selection) مع ظهور toolbar فوري✨ **الميزات:**تم تطوير نظام تعاون متقدم يسمح لعدة مستخدمين بالعمل على نفس الوثيقة BRD بشكل متزامن مع دعم:## نظرة عامة---8. [الأمان والصلاحيات](#الأمان-والصلاحيات)7. [أمثلة عملية](#أمثلة-عملية)6. [API Endpoints](#api-endpoints)5. [WebSocket Events](#websocket-events)4. [الـ Hooks](#الـ-hooks)3. [المكونات](#المكونات)2. [المميزات الرئيسية](#المميزات-الرئيسية)1. [نظرة عامة](#نظرة-عامة)## 📖 الفهرس * All routes require authentication
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const brdController = require('../controllers/brdController');

// Middleware to check authentication
router.use(authMiddleware);

/**
 * GET /api/brd
 * List all BRDs for current user
 */
router.get(
  '/',
  query('skip').optional().isInt({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  brdController.listBRDs
);

/**
 * GET /api/brd/:id
 * Get specific BRD by ID
 */
router.get(
  '/:id',
  param('id').isUUID(),
  brdController.getBRD
);

/**
 * POST /api/brd/generate
 * Generate BRD from user stories using AI
 */
router.post(
  '/generate',
  body('story_ids')
    .isArray({ min: 1 })
    .withMessage('At least one story ID is required'),
  body('story_ids.*')
    .custom((value) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0;
    })
    .withMessage('Invalid story ID format'),
  body('title').optional().isString().trim(),
  body('template')
    .optional()
    .isString()
    .withMessage('Invalid template type'),
  body('tone').optional().isString(),
  body('target_audience').optional().isString(),
  body('options.language').optional().isString(),
  body('options.detailLevel')
    .optional()
    .isIn(['summary', 'standard', 'detailed', 'comprehensive'])
    .withMessage('Invalid detail level'),
  brdController.generateBRD
);

/**
 * PUT /api/brd/:id
 * Update BRD content
 */
router.put(
  '/:id',
  param('id').isUUID(),
  body('content').optional().isString(),
  body('title').optional().isString().trim(),
  brdController.updateBRD
);

/**
 * DELETE /api/brd/:id
 * Delete BRD
 */
router.delete(
  '/:id',
  param('id').isUUID(),
  brdController.deleteBRD
);

/**
 * POST /api/brd/regenerate-section
 * Regenerate a BRD section using AI
 */
router.post(
  '/regenerate-section',
  body('text')
    .notEmpty()
    .withMessage('Text is required')
    .isString(),
  body('instruction')
    .notEmpty()
    .withMessage('Instruction is required')
    .isString(),
  body('brdId').optional().isUUID(),
  body('sectionId').optional().isString(),
  body('context').optional().isString(),
  brdController.regenerateSection
);

/**
 * POST /api/brd/smart-edit
 * Smart edit a text selection
 */
router.post(
  '/smart-edit',
  body('selection')
    .notEmpty()
    .withMessage('Selection is required')
    .isString(),
  body('instruction')
    .notEmpty()
    .withMessage('Instruction is required')
    .isString(),
  body('context').optional().isString(),
  brdController.smartEdit
);

/**
 * GET /api/brd/:id/versions
 * Get version history for BRD
 */
router.get(
  '/:id/versions',
  param('id').isUUID(),
  brdController.getVersionHistory
);

/**
 * POST /api/brd/:id/export-pdf
 * Export BRD to PDF
 */
router.post(
  '/:id/export-pdf',
  param('id').isUUID(),
  brdController.exportPDF
);

/**
 * POST /api/brd/:id/export-docx
 * Export BRD to DOCX
 */
router.post(
  '/:id/export-docx',
  param('id').isUUID(),
  brdController.exportDOCX
);

/**
 * GET /api/brd/:id/export-text
 * Export BRD to plain text
 */
router.get(
  '/:id/export-text',
  param('id').isUUID(),
  brdController.exportText
);

/**
 * POST /api/brd/:id/export-excel
 * Export BRD to Excel
 */
router.post(
  '/:id/export-excel',
  param('id').isUUID(),
  brdController.exportExcel
);

/**
 * GET /api/brd/:id/analyze
 * Analyze BRD content using AI
 */
router.get(
  '/:id/analyze',
  param('id').isString(),
  brdController.analyzeBRD
);

/**
 * GET /api/brd/:id/estimate
 * Estimate project effort using AI
 */
router.get(
  '/:id/estimate',
  authMiddleware,
  param('id').isString(),
  brdController.estimateBRD
);

/**
 * POST /api/brd/:id/convert-to-stories
 * Extract user stories from BRD using AI
 */
router.post(
  '/:id/convert-to-stories',
  param('id').isUUID(),
  brdController.convertToStories
);

/**
 * GET /api/brd/:id/versions/:versionNumber
 * Get specific version content
 */
router.get(
  '/:id/versions/:versionNumber',
  [
    param('id').isString(),
    param('versionNumber').isInt()
  ],
  brdController.getVersionContent
);

/**
 * WORKFLOW ROUTES
 */

/**
 * POST /api/brd/:id/request-review
 * Request review for BRD (draft → in-review)
 */
router.post(
  '/:id/request-review',
  param('id').isUUID(),
  body('assigned_to').isInt().withMessage('Reviewer ID must be an integer'),
  body('reason').optional().isString(),
  brdController.requestReview
);

/**
 * POST /api/brd/:id/approve
 * Approve BRD (in-review → approved)
 */
router.post(
  '/:id/approve',
  param('id').isUUID(),
  body('reason').optional().isString(),
  brdController.approveBRD
);

/**
 * POST /api/brd/:id/reassign
 * Re-assign BRD review (in-review -> in-review)
 */
router.post(
  '/:id/reassign',
  param('id').isUUID(),
  body('assigned_to').isInt().withMessage('New reviewer ID must be an integer'),
  body('reason').optional().isString(),
  brdController.reassignBRD
);

/**
 * POST /api/brd/:id/reject
 * Reject BRD for revisions (in-review → draft)
 */
router.post(
  '/:id/reject',
  param('id').isUUID(),
  body('reason').optional().isString(),
  brdController.rejectBRD
);

/**
 * GET /api/brd/:id/workflow-history
 * Get workflow history
 */
router.get(
  '/:id/workflow-history',
  param('id').isUUID(),
  brdController.getWorkflowHistory
);

/**
 * GET /api/brd/:id/review-assignments
 * Get review assignments
 */
router.get(
  '/:id/review-assignments',
  param('id').isUUID(),
  brdController.getReviewAssignments
);

/**
 * POST /api/brd/:id/collaborators
 * Add collaborator to BRD
 */
router.post(
  '/:id/collaborators',
  param('id').isUUID(),
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('permission_level').optional().isIn(['view', 'comment', 'edit']),
  brdController.addCollaborator
);

/**
 * DELETE /api/brd/:id/collaborators/:collaboratorId
 * Remove collaborator from BRD
 */
router.delete(
  '/:id/collaborators/:collaboratorId',
  param('id').isUUID(),
  param('collaboratorId').isInt(),
  brdController.removeCollaborator
);

/**
 * GET /api/brd/:id/collaborators
 * Get collaborators for BRD
 */
router.get(
  '/:id/collaborators',
  param('id').isUUID(),
  brdController.getCollaborators
);

/**
 * GET /api/brd/:id/activity-log
 * Get activity log for BRD
 */
router.get(
  '/:id/activity-log',
  param('id').isUUID(),
  brdController.getActivityLog
);

/**
 * GET /api/brd/:id/comments
 * Get comments for BRD
 */
router.get(
  '/:id/comments',
  param('id').isUUID(),
  brdController.getComments
);

/**
 * POST /api/brd/:id/comments
 * Add comment to BRD
 */
router.post(
  '/:id/comments',
  param('id').isUUID(),
  body('section_id').notEmpty().withMessage('Section ID is required'),
  body('comment_text').trim().notEmpty().withMessage('Comment text is required'),
  brdController.addComment
);

/**
 * PUT /api/brd/:id/comments/:commentId
 * Update comment
 */
router.put(
  '/:id/comments/:commentId',
  param('id').isUUID(),
  param('commentId').isInt(),
  body('comment_text').optional().trim(),
  body('is_resolved').optional().isBoolean(),
  brdController.updateComment
);

/**
 * DELETE /api/brd/:id/comments/:commentId
 * Delete comment
 */
router.delete(
  '/:id/comments/:commentId',
  param('id').isUUID(),
  param('commentId').isInt(),
  brdController.deleteComment
);

/**
 * POST /api/brd/smart-edit
 * Smart edit text with AI
 */
router.post(
  '/smart-edit',
  body('selection').notEmpty().withMessage('Selection is required'),
  body('instruction').notEmpty().withMessage('Instruction is required'),
  brdController.smartEdit
);

/**
 * GET /api/brd/:id/review-assignments
 * Get review assignments for a BRD
 */
router.get(
  '/:id/review-assignments',
  param('id').isUUID(),
  brdController.getReviewAssignments
);

/**
 * POST /api/brd/:id/review-assignments
 * Assign reviewers to a BRD
 */
router.post(
  '/:id/review-assignments',
  param('id').isUUID(),
  body('reviewer_ids').isArray({ min: 1 }).withMessage('At least one reviewer is required'),
  brdController.assignReviewers
);

/**
 * PUT /api/brd/:id/review-assignments/:assignmentId
 * Update review assignment status
 */
router.put(
  '/:id/review-assignments/:assignmentId',
  param('id').isUUID(),
  param('assignmentId').isInt(),
  body('status').isIn(['pending', 'approved', 'rejected']),
  brdController.updateReviewAssignment
);

/**
 * GET /api/brd/:id/workflow-history
 * Get workflow history for a BRD
 */
router.get(
  '/:id/workflow-history',
  param('id').isUUID(),
  brdController.getWorkflowHistory
);

module.exports = router;

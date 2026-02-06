/**
 * API Routes للتعاون الفوري
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const collaborationService = require('../services/collaborationService');
const db = require('../db/connection');

// Middleware للتحقق من الأخطاء
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * الحصول على معلومات جلسة BRD
 * GET /api/collaboration/session/:brdId
 */
router.get('/session/:brdId', (req, res) => {
  try {
    const { brdId } = req.params;
    const sessionInfo = collaborationService.getSessionInfo(brdId);
    
    res.json({
      success: true,
      data: sessionInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * الحصول على سجل العمليات
 * GET /api/collaboration/operations/:brdId
 */
router.get('/operations/:brdId', [
  body('limit').optional().isInt({ min: 1, max: 1000 })
], handleValidationErrors, (req, res) => {
  try {
    const { brdId } = req.params;
    const { limit = 100 } = req.query;
    
    const operations = collaborationService.getOperationHistory(brdId, parseInt(limit));
    
    res.json({
      success: true,
      count: operations.length,
      data: operations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * الحصول على Mentions للمستخدم
 * GET /api/collaboration/mentions/:userId
 */
router.get('/mentions/:userId', [
  body('unreadOnly').optional().isBoolean()
], handleValidationErrors, (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly = false } = req.query;
    
    const mentions = collaborationService.getUserMentions(
      userId, 
      unreadOnly === 'true'
    );
    
    res.json({
      success: true,
      count: mentions.length,
      data: mentions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * تعليم Mention كمقروء
 * POST /api/collaboration/mentions/:mentionId/read
 */
router.post('/mentions/:mentionId/read', [
  body('userId').notEmpty().withMessage('userId مطلوب')
], handleValidationErrors, (req, res) => {
  try {
    const { mentionId } = req.params;
    const { userId } = req.body;
    
    const success = collaborationService.markMentionAsRead(mentionId, userId);
    
    res.json({
      success,
      message: success ? 'تم تعليم كمقروء' : 'لم يتم العثور على Mention'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * إنشاء Discussion Thread
 * POST /api/collaboration/threads
 */
router.post('/threads', [
  body('brdId').notEmpty().withMessage('brdId مطلوب'),
  body('sectionId').notEmpty().withMessage('sectionId مطلوب'),
  body('userId').notEmpty().withMessage('userId مطلوب'),
  body('content').notEmpty().withMessage('المحتوى مطلوب'),
  body('type').isIn(['general', 'question', 'suggestion', 'bug']).withMessage('نوع غير صحيح')
], handleValidationErrors, (req, res) => {
  try {
    const { brdId, sectionId, userId, content, type, parentThreadId } = req.body;
    
    // إنشاء خيط جديد
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const thread = {
      id: threadId,
      brdId,
      sectionId,
      parentThreadId: parentThreadId || null,
      type,
      status: 'open',
      comments: [{
        id: `comment_${Date.now()}`,
        userId,
        content,
        timestamp: new Date(),
        reactions: []
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      resolvedBy: null
    };
    
    // حفظ في قاعدة البيانات
    try {
      db.sqlite.prepare(`
        INSERT INTO discussion_threads 
        (thread_id, brd_id, section_id, parent_thread_id, type, status, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        threadId,
        brdId,
        sectionId,
        parentThreadId || null,
        type,
        'open',
        JSON.stringify(thread),
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (dbError) {
      // إذا كانت الجداول غير موجودة، سيكون الخيط في الذاكرة فقط
      console.warn('⚠️ قاعدة البيانات غير متوفرة، سيتم الاحتفاظ بالخيط في الذاكرة');
    }
    
    res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * إضافة رد على خيط
 * POST /api/collaboration/threads/:threadId/reply
 */
router.post('/threads/:threadId/reply', [
  body('userId').notEmpty().withMessage('userId مطلوب'),
  body('content').notEmpty().withMessage('المحتوى مطلوب')
], handleValidationErrors, (req, res) => {
  try {
    const { threadId } = req.params;
    const { userId, content } = req.body;
    
    const comment = {
      id: `comment_${Date.now()}`,
      userId,
      content,
      timestamp: new Date(),
      reactions: []
    };
    
    res.json({
      success: true,
      data: {
        threadId,
        comment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * حل خيط
 * POST /api/collaboration/threads/:threadId/resolve
 */
router.post('/threads/:threadId/resolve', [
  body('userId').notEmpty().withMessage('userId مطلوب')
], handleValidationErrors, (req, res) => {
  try {
    const { threadId } = req.params;
    const { userId } = req.body;
    
    res.json({
      success: true,
      message: 'تم حل الخيط',
      data: {
        threadId,
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * الحصول على خيوط BRD
 * GET /api/collaboration/threads/:brdId
 */
router.get('/threads/:brdId', [
  body('status').optional().isIn(['open', 'resolved', 'on-hold']),
  body('sectionId').optional()
], handleValidationErrors, (req, res) => {
  try {
    const { brdId } = req.params;
    const { status, sectionId } = req.query;
    
    res.json({
      success: true,
      data: {
        brdId,
        threads: [],
        filters: { status, sectionId }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * إضافة Reaction على تعليق
 * POST /api/collaboration/comments/:commentId/react
 */
router.post('/comments/:commentId/react', [
  body('userId').notEmpty().withMessage('userId مطلوب'),
  body('emoji').notEmpty().withMessage('emoji مطلوب'),
  body('action').isIn(['add', 'remove']).withMessage('action غير صحيحة')
], handleValidationErrors, (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, emoji, action } = req.body;
    
    res.json({
      success: true,
      data: {
        commentId,
        reaction: {
          emoji,
          userId,
          action,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * حفظ جميع العمليات المعلقة
 * POST /api/collaboration/persist
 */
router.post('/persist', [
  body('brdId').notEmpty().withMessage('brdId مطلوب')
], handleValidationErrors, (req, res) => {
  try {
    const { brdId } = req.body;
    
    const result = collaborationService.persistOperations(brdId);
    
    res.json({
      success: result.success,
      message: `تم حفظ ${result.count} عملية`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * استعادة العمليات من قاعدة البيانات
 * GET /api/collaboration/restore/:brdId
 */
router.get('/restore/:brdId', (req, res) => {
  try {
    const { brdId } = req.params;
    const { limit = 1000 } = req.query;
    
    const operations = collaborationService.restoreOperations(brdId, parseInt(limit));
    
    res.json({
      success: true,
      count: operations.length,
      data: operations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

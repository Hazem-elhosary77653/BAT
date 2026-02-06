/**
 * Real-time Collaboration Service
 * يدير التحرير المتزامن و@Mentions و Discussion Threads
 */

const { EventEmitter } = require('events');
const db = require('../db/connection');

class CollaborationService extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map(); // BRD ID -> Set of users
    this.sectionLocks = new Map(); // Section ID -> { userId, timestamp }
    this.operationLog = []; // سجل العمليات
    this.mentionQueue = new Map(); // User ID -> Array of mentions
  }

  /**
   * بدء جلسة تحرير لـ BRD
   */
  startEditSession(brdId, userId) {
    if (!this.activeSessions.has(brdId)) {
      this.activeSessions.set(brdId, new Set());
    }
    this.activeSessions.get(brdId).add(userId);

    this.emit('session:started', {
      brdId,
      userId,
      activeUsers: Array.from(this.activeSessions.get(brdId)),
      timestamp: new Date()
    });

    return {
      brdId,
      userId,
      activeUsers: Array.from(this.activeSessions.get(brdId))
    };
  }

  /**
   * إنهاء جلسة التحرير
   */
  endEditSession(brdId, userId) {
    if (this.activeSessions.has(brdId)) {
      this.activeSessions.get(brdId).delete(userId);
      
      // تحرير أي أقفال على الأقسام
      this.releaseSectionLocks(userId);

      if (this.activeSessions.get(brdId).size === 0) {
        this.activeSessions.delete(brdId);
      }

      this.emit('session:ended', {
        brdId,
        userId,
        activeUsers: this.activeSessions.has(brdId) 
          ? Array.from(this.activeSessions.get(brdId)) 
          : [],
        timestamp: new Date()
      });
    }
  }

  /**
   * قفل قسم للتحرير
   */
  lockSection(sectionId, userId, brdId) {
    const existingLock = this.sectionLocks.get(sectionId);

    // إذا كان مقفول بواسطة مستخدم آخر
    if (existingLock && existingLock.userId !== userId) {
      // تحقق من مهلة الجلسة (30 ثانية)
      const timeDiff = Date.now() - existingLock.timestamp;
      if (timeDiff < 30000) {
        return {
          success: false,
          lockedBy: existingLock.userId,
          message: 'هذا القسم قيد التحرير من قبل مستخدم آخر'
        };
      }
    }

    // قفل القسم
    this.sectionLocks.set(sectionId, {
      userId,
      brdId,
      timestamp: Date.now()
    });

    this.emit('section:locked', {
      sectionId,
      userId,
      brdId,
      timestamp: new Date()
    });

    return { success: true, sectionId, userId };
  }

  /**
   * فتح قفل القسم
   */
  unlockSection(sectionId, userId) {
    const lock = this.sectionLocks.get(sectionId);
    
    if (lock && lock.userId === userId) {
      this.sectionLocks.delete(sectionId);
      
      this.emit('section:unlocked', {
        sectionId,
        userId,
        timestamp: new Date()
      });

      return { success: true, sectionId };
    }

    return { success: false, message: 'لا توجد أقفال لفتحها' };
  }

  /**
   * تحرير جميع أقفال المستخدم
   */
  releaseSectionLocks(userId) {
    const keysToDelete = [];
    
    for (const [sectionId, lock] of this.sectionLocks.entries()) {
      if (lock.userId === userId) {
        keysToDelete.push(sectionId);
      }
    }

    keysToDelete.forEach(sectionId => {
      this.sectionLocks.delete(sectionId);
      this.emit('section:unlocked', {
        sectionId,
        userId,
        auto: true,
        timestamp: new Date()
      });
    });

    return keysToDelete.length;
  }

  /**
   * تسجيل عملية تحرير
   */
  logOperation(operation) {
    const logEntry = {
      id: this.operationLog.length + 1,
      timestamp: Date.now(),
      ...operation
    };

    this.operationLog.push(logEntry);

    // احتفظ بآخر 10000 عملية فقط
    if (this.operationLog.length > 10000) {
      this.operationLog.shift();
    }

    this.emit('operation:logged', logEntry);
    return logEntry;
  }

  /**
   * الحصول على سجل العمليات لـ BRD
   */
  getOperationHistory(brdId, limit = 100) {
    return this.operationLog
      .filter(op => op.brdId === brdId)
      .slice(-limit)
      .reverse();
  }

  /**
   * إضافة Mention
   */
  addMention(mentionedUserId, mentionedByUserId, brdId, context) {
    if (!this.mentionQueue.has(mentionedUserId)) {
      this.mentionQueue.set(mentionedUserId, []);
    }

    const mention = {
      id: `mention_${Date.now()}_${Math.random()}`,
      mentionedBy: mentionedByUserId,
      brdId,
      context,
      timestamp: Date.now(),
      read: false
    };

    this.mentionQueue.get(mentionedUserId).push(mention);

    this.emit('mention:created', {
      mentionedUserId,
      mention,
      timestamp: new Date()
    });

    return mention;
  }

  /**
   * الحصول على Mentions للمستخدم
   */
  getUserMentions(userId, unreadOnly = false) {
    const mentions = this.mentionQueue.get(userId) || [];
    
    if (unreadOnly) {
      return mentions.filter(m => !m.read);
    }
    
    return mentions;
  }

  /**
   * تعليم Mention كمقروء
   */
  markMentionAsRead(mentionId, userId) {
    const mentions = this.mentionQueue.get(userId) || [];
    const mention = mentions.find(m => m.id === mentionId);

    if (mention) {
      mention.read = true;
      return true;
    }

    return false;
  }

  /**
   * حذف Mention قديم
   */
  cleanOldMentions(daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [userId, mentions] of this.mentionQueue.entries()) {
      const filtered = mentions.filter(m => m.timestamp > cutoffTime);
      
      if (filtered.length !== mentions.length) {
        deletedCount += mentions.length - filtered.length;
        this.mentionQueue.set(userId, filtered);
      }
    }

    return deletedCount;
  }

  /**
   * الحصول على معلومات جلسة BRD
   */
  getSessionInfo(brdId) {
    return {
      brdId,
      activeUsers: this.activeSessions.has(brdId) 
        ? Array.from(this.activeSessions.get(brdId)) 
        : [],
      lockedSections: Array.from(this.sectionLocks.entries())
        .filter(([_, lock]) => lock.brdId === brdId)
        .map(([sectionId, lock]) => ({
          sectionId,
          lockedBy: lock.userId,
          since: new Date(lock.timestamp)
        }))
    };
  }

  /**
   * حفظ العمليات في قاعدة البيانات
   */
  persistOperations(brdId) {
    try {
      const operations = this.getOperationHistory(brdId);
      
      operations.forEach(op => {
        db.sqlite.prepare(`
          INSERT INTO collaboration_operations 
          (brd_id, user_id, operation_type, data, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          op.brdId,
          op.userId,
          op.type,
          JSON.stringify(op.data),
          new Date(op.timestamp).toISOString()
        );
      });

      return { success: true, count: operations.length };
    } catch (error) {
      console.error('❌ خطأ في حفظ العمليات:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * استعادة العمليات من قاعدة البيانات
   */
  restoreOperations(brdId, limit = 1000) {
    try {
      const operations = db.sqlite.prepare(`
        SELECT * FROM collaboration_operations
        WHERE brd_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(brdId, limit);

      return operations.map(op => ({
        ...op,
        data: JSON.parse(op.data),
        timestamp: new Date(op.created_at).getTime()
      })).reverse();
    } catch (error) {
      console.error('❌ خطأ في استعادة العمليات:', error);
      return [];
    }
  }
}

module.exports = new CollaborationService();

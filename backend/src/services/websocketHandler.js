/**
 * WebSocket Handler للتعاون الفوري
 * يدير الاتصالات الحية والتحرير المتزامن
 */

const collaborationService = require('../services/collaborationService');
const db = require('../db/connection');

class WebSocketHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socketId -> userId
    this.brdSockets = new Map(); // brdId -> Set of socket IDs
  }

  /**
   * تهيئة WebSocket listeners
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`✅ اتصال جديد: ${socket.id}`);

      // الاستماع للأحداث
      socket.on('join-brd', (data) => this.handleJoinBrd(socket, data));
      socket.on('leave-brd', (data) => this.handleLeaveBrd(socket, data));
      socket.on('content-change', (data) => this.handleContentChange(socket, data));
      socket.on('section-lock', (data) => this.handleSectionLock(socket, data));
      socket.on('section-unlock', (data) => this.handleSectionUnlock(socket, data));
      socket.on('cursor-move', (data) => this.handleCursorMove(socket, data));
      socket.on('mention', (data) => this.handleMention(socket, data));
      socket.on('comment-thread', (data) => this.handleCommentThread(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * الانضمام إلى جلسة تحرير BRD
   */
  handleJoinBrd(socket, data) {
    const { brdId, userId, userName } = data;

    if (!brdId || !userId) {
      socket.emit('error', { message: 'بيانات غير كاملة' });
      return;
    }

    // تسجيل المستخدم والـ Socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // انضمام إلى غرفة BRD
    socket.join(`brd:${brdId}`);

    if (!this.brdSockets.has(brdId)) {
      this.brdSockets.set(brdId, new Set());
    }
    this.brdSockets.get(brdId).add(socket.id);

    // بدء جلسة التحرير
    const session = collaborationService.startEditSession(brdId, userId);

    // إرسال معلومات الجلسة للمستخدم
    socket.emit('session-info', {
      brdId,
      userId,
      activeUsers: session.activeUsers,
      sessionId: socket.id
    });

    // إخطار المستخدمين الآخرين
    socket.to(`brd:${brdId}`).emit('user-joined', {
      userId,
      userName,
      activeUsers: session.activeUsers,
      timestamp: new Date()
    });

    console.log(`👤 ${userName} انضم إلى BRD ${brdId}`);
  }

  /**
   * مغادرة جلسة التحرير
   */
  handleLeaveBrd(socket, data) {
    const { brdId } = data;
    const userId = this.socketUsers.get(socket.id);

    if (!userId) return;

    // إنهاء الجلسة
    collaborationService.endEditSession(brdId, userId);

    // إزالة من البيانات
    socket.leave(`brd:${brdId}`);
    
    if (this.brdSockets.has(brdId)) {
      this.brdSockets.get(brdId).delete(socket.id);
    }

    // إخطار المستخدمين الآخرين
    const sessionInfo = collaborationService.getSessionInfo(brdId);
    socket.to(`brd:${brdId}`).emit('user-left', {
      userId,
      activeUsers: sessionInfo.activeUsers,
      timestamp: new Date()
    });

    // حفظ العمليات قبل المغادرة
    collaborationService.persistOperations(brdId);

    console.log(`👋 المستخدم ${userId} غادر BRD ${brdId}`);
  }

  /**
   * معالجة تغييرات المحتوى (التحرير المتزامن)
   */
  handleContentChange(socket, data) {
    const { brdId, sectionId, change, userId } = data;

    if (!brdId || !sectionId) {
      socket.emit('error', { message: 'بيانات غير كاملة' });
      return;
    }

    // تسجيل العملية
    const operation = {
      brdId,
      sectionId,
      userId,
      type: 'content-change',
      data: change
    };

    collaborationService.logOperation(operation);

    // بث التغيير للمستخدمين الآخرين
    socket.to(`brd:${brdId}`).emit('content-changed', {
      sectionId,
      change,
      userId,
      timestamp: new Date()
    });

    // إرسال تأكيد للمرسل
    socket.emit('change-acknowledged', {
      operationId: operation.id,
      timestamp: new Date()
    });
  }

  /**
   * قفل قسم للتحرير
   */
  handleSectionLock(socket, data) {
    const { brdId, sectionId } = data;
    const userId = this.socketUsers.get(socket.id);

    if (!userId) {
      socket.emit('error', { message: 'لم يتم التعرف على المستخدم' });
      return;
    }

    const lockResult = collaborationService.lockSection(sectionId, userId, brdId);

    if (lockResult.success) {
      socket.emit('section-locked', { sectionId, userId });
      
      // إخطار المستخدمين الآخرين
      socket.to(`brd:${brdId}`).emit('section-lock-updated', {
        sectionId,
        lockedBy: userId,
        timestamp: new Date()
      });
    } else {
      socket.emit('lock-failed', lockResult);
    }
  }

  /**
   * فتح قفل القسم
   */
  handleSectionUnlock(socket, data) {
    const { sectionId } = data;
    const userId = this.socketUsers.get(socket.id);

    if (!userId) return;

    const unlockResult = collaborationService.unlockSection(sectionId, userId);

    if (unlockResult.success) {
      socket.emit('section-unlocked', { sectionId });

      // إخطار المستخدمين الآخرين
      this.io.to(`brd:${data.brdId}`).emit('section-lock-updated', {
        sectionId,
        lockedBy: null,
        timestamp: new Date()
      });
    }
  }

  /**
   * تحديث موضع المؤشر (Live Cursor)
   */
  handleCursorMove(socket, data) {
    const { brdId, sectionId, position, userId } = data;

    if (!brdId) {
      socket.emit('error', { message: 'BRD ID مفقود' });
      return;
    }

    // بث موضع المؤشر للمستخدمين الآخرين
    socket.to(`brd:${brdId}`).emit('cursor-position-updated', {
      userId,
      sectionId,
      position,
      timestamp: new Date()
    });
  }

  /**
   * معالجة @Mentions
   */
  handleMention(socket, data) {
    const { brdId, mentionedUserId, mentionedByUserId, mentionedByName, context } = data;
    const userId = this.socketUsers.get(socket.id);

    if (userId !== mentionedByUserId) {
      socket.emit('error', { message: 'غير مصرح بإنشاء mention بهذا الشكل' });
      return;
    }

    // إضافة Mention
    const mention = collaborationService.addMention(
      mentionedUserId,
      mentionedByUserId,
      brdId,
      context
    );

    // إخطار المستخدم المذكور
    const targetSocketIds = this.userSockets.get(mentionedUserId) || new Set();
    targetSocketIds.forEach(socketId => {
      this.io.to(socketId).emit('you-were-mentioned', {
        by: mentionedByName,
        brdId,
        context,
        mention,
        timestamp: new Date()
      });
    });

    // تأكيد للمرسل
    socket.emit('mention-sent', {
      mentionId: mention.id,
      mentionedUserId,
      timestamp: new Date()
    });

    console.log(`🔔 ${mentionedByName} ذكر ${mentionedUserId} في BRD ${brdId}`);
  }

  /**
   * معالجة خيوط التعليقات
   */
  handleCommentThread(socket, data) {
    const { brdId, sectionId, threadId, action, commentData } = data;
    const userId = this.socketUsers.get(socket.id);

    if (!userId) {
      socket.emit('error', { message: 'لم يتم التعرف على المستخدم' });
      return;
    }

    const threadOperation = {
      brdId,
      sectionId,
      threadId,
      action, // 'create', 'reply', 'resolve', 'reopen'
      userId,
      data: commentData,
      timestamp: Date.now()
    };

    // تسجيل العملية
    collaborationService.logOperation({
      brdId,
      userId,
      type: 'comment-thread',
      data: threadOperation
    });

    // بث الحدث للجميع
    this.io.to(`brd:${brdId}`).emit('thread-updated', {
      ...threadOperation,
      timestamp: new Date()
    });

    socket.emit('thread-acknowledged', {
      threadId,
      action,
      timestamp: new Date()
    });

    console.log(`💬 تحديث خيط: ${action} على ${threadId}`);
  }

  /**
   * معالجة القطع (Disconnect)
   */
  handleDisconnect(socket) {
    const userId = this.socketUsers.get(socket.id);

    if (!userId) {
      console.log(`❌ قطع اتصال بدون معرف مستخدم: ${socket.id}`);
      return;
    }

    // إزالة Socket ID من بيانات المستخدم
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);
      
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.socketUsers.delete(socket.id);

    // تحرير جميع أقفال المستخدم
    const releasedCount = collaborationService.releaseSectionLocks(userId);

    console.log(`❌ قطع اتصال: ${userId} (تحرير ${releasedCount} أقفال)`);
  }

  /**
   * إرسال إشعار إلى مستخدم معين
   */
  notifyUser(userId, event, data) {
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
      return true;
    }

    return false;
  }

  /**
   * بث إلى جميع المستخدمين في غرفة
   */
  broadcastToRoom(brdId, event, data) {
    this.io.to(`brd:${brdId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }
}

module.exports = WebSocketHandler;

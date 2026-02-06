/**
 * useCollaboration Hook
 * يدير التعاون الفوري، @Mentions، وخيوط النقاش
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const useCollaboration = (brdId, userId, userName) => {
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [lockedSections, setLockedSections] = useState(new Map());
  const [cursorPositions, setCursorPositions] = useState(new Map());
  const [mentions, setMentions] = useState([]);
  const [threads, setThreads] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userNames, setUserNames] = useState(new Map()); // userId -> userName
  const [activity, setActivity] = useState([]); // Array of activity events
  const [highlights, setHighlights] = useState(new Map()); // للهايلايتات المشتركة
  const [userSelections, setUserSelections] = useState(new Map()); // تحديدات المستخدمين النشطة
  const [remoteChange, setRemoteChange] = useState(null); // التغييرات القادمة من مستخدمين آخرين

  // عند بدء الـ Hook
  useEffect(() => {
    // Early return if brdId or userId not provided
    if (!brdId || !userId) {
      setIsConnected(false);
      setActiveUsers([]);
      setMentions([]);
      setThreads(new Map());
      setActivity([]);
      setLockedSections(new Map());
      setCursorPositions(new Map());
      setUserNames(new Map());
      return;
    }

    // الاتصال بـ WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002', {
      auth: {
        token: localStorage.getItem('authToken'),
        userId,
        userName,
        brdId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // استماع للأحداث
    newSocket.on('connect', () => {
      console.log('✅ متصل بـ WebSocket');
      setIsConnected(true);

      // الانضمام إلى غرفة BRD
      newSocket.emit('join-brd', {
        brdId,
        userId,
        userName
      });
    });

    newSocket.on('session-info', (data) => {
      setSessionId(data.sessionId);
      if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
    });

    newSocket.on('user-joined', (data) => {
      if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
      if (data.userId && data.userName) {
        setUserNames(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, data.userName);
          return updated;
        });
      }
      setActivity(prev => [{
        id: Date.now(),
        type: 'presence',
        message: `${data.userName || 'Someone'} joined the session`,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
      console.log(`👤 ${data.userName || 'Peer'} joined`);
    });

    newSocket.on('user-left', (data) => {
      if (Array.isArray(data.activeUsers)) setActiveUsers(data.activeUsers);
      setActivity(prev => [{
        id: Date.now(),
        type: 'presence',
        message: `${getUserName(data.userId) || 'Someone'} left the session`,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
    });

    newSocket.on('section-lock-updated', (data) => {
      setLockedSections(prev => {
        const newLocks = new Map(prev);
        if (data.lockedBy) {
          newLocks.set(data.sectionId, data.lockedBy);
          setActivity(activityPrev => [{
            id: Date.now(),
            type: 'lock',
            message: `${data.lockedBy} locked a section`,
            timestamp: new Date()
          }, ...activityPrev].slice(0, 50));
        } else {
          newLocks.delete(data.sectionId);
        }
        return newLocks;
      });
    });

    newSocket.on('cursor-position-updated', (data) => {
      setCursorPositions(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          sectionId: data.sectionId,
          position: data.position,
          timestamp: data.timestamp
        });
        return updated;
      });
    });

    newSocket.on('you-were-mentioned', (data) => {
      setMentions(prev => Array.isArray(prev) ? [...prev, data] : [data]);

      // الإخطار
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 ${data.by || 'Mention'}`, {
          body: `Mentioned you in ${data.context?.sectionName || 'a section'}`,
          tag: 'mention',
          requireInteraction: true
        });
      }
    });

    newSocket.on('thread-updated', (data) => {
      setThreads(prev => {
        const updated = new Map(prev);
        updated.set(data.threadId, data);
        return updated;
      });
    });

    // استماع لتغييرات المحتوى
    newSocket.on('content-change-updated', (data) => {
      if (data.userId !== userId) {
        setRemoteChange(data);
      }
    });

    // استماع لأحداث الهايلايتات
    newSocket.on('highlight-added', (data) => {
      setHighlights(prev => {
        const updated = new Map(prev);
        updated.set(data.highlightId, data);
        return updated;
      });
      setActivity(activityPrev => [{
        id: Date.now(),
        type: 'highlight',
        message: `${data.createdBy} added a highlight`,
        timestamp: new Date()
      }, ...activityPrev].slice(0, 50));
    });

    newSocket.on('highlight-removed', (data) => {
      setHighlights(prev => {
        const updated = new Map(prev);
        updated.delete(data.highlightId);
        return updated;
      });
    });

    // استماع لأحداث التحديد
    newSocket.on('user-selection', (data) => {
      setUserSelections(prev => {
        const updated = new Map(prev);
        if (data.selection) {
          updated.set(data.userId, data);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket Error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (newSocket) {
        newSocket.emit('leave-brd', { brdId });
        newSocket.disconnect();
      }
    };
  }, [brdId, userId, userName]);

  /**
   * إرسال تغيير محتوى
   */
  const sendContentChange = useCallback((sectionId, change) => {
    if (!socket || !isConnected) return false;

    socket.emit('content-change', {
      brdId,
      sectionId,
      change,
      userId
    });

    return true;
  }, [socket, isConnected, brdId, userId]);

  /**
   * قفل قسم
   */
  const lockSection = useCallback((sectionId) => {
    if (!socket || !isConnected) return false;

    socket.emit('section-lock', {
      brdId,
      sectionId
    });

    return true;
  }, [socket, isConnected, brdId]);

  /**
   * فتح قفل القسم
   */
  const unlockSection = useCallback((sectionId) => {
    if (!socket || !isConnected) return false;

    socket.emit('section-unlock', {
      brdId,
      sectionId
    });

    return true;
  }, [socket, isConnected, brdId]);

  /**
   * تحديث موضع المؤشر
   */
  const updateCursorPosition = useCallback((sectionId, position) => {
    if (!socket || !isConnected) return false;

    socket.emit('cursor-move', {
      brdId,
      sectionId,
      position,
      userId
    });

    return true;
  }, [socket, isConnected, brdId, userId]);

  /**
   * ذكر مستخدم
   */
  const mentionUser = useCallback((mentionedUserId, context) => {
    if (!socket || !isConnected) return false;

    socket.emit('mention', {
      brdId,
      mentionedUserId,
      mentionedByUserId: userId,
      mentionedByName: userName,
      context
    });

    return true;
  }, [socket, isConnected, brdId, userId, userName]);

  /**
   * إنشاء خيط نقاش جديد
   */
  const createThread = useCallback((sectionId, content, type = 'general') => {
    if (!socket || !isConnected) return false;

    socket.emit('comment-thread', {
      brdId,
      sectionId,
      threadId: `thread_${Date.now()}`,
      action: 'create',
      commentData: {
        userId,
        userName,
        content,
        type
      }
    });

    return true;
  }, [socket, isConnected, brdId, userId, userName]);

  /**
   * إضافة رد على خيط
   */
  const replyToThread = useCallback((sectionId, threadId, content) => {
    if (!socket || !isConnected) return false;

    socket.emit('comment-thread', {
      brdId,
      sectionId,
      threadId,
      action: 'reply',
      commentData: {
        userId,
        userName,
        content,
        timestamp: new Date()
      }
    });

    return true;
  }, [socket, isConnected, brdId, userId, userName]);

  /**
   * حل خيط
   */
  const resolveThread = useCallback((sectionId, threadId) => {
    if (!socket || !isConnected) return false;

    socket.emit('comment-thread', {
      brdId,
      sectionId,
      threadId,
      action: 'resolve',
      commentData: {
        userId,
        userName,
        resolvedAt: new Date()
      }
    });

    return true;
  }, [socket, isConnected, brdId, userId, userName]);

  /**
   * التحقق من وجود قفل على القسم
   */
  const getSectionLockStatus = useCallback((sectionId) => {
    return lockedSections.get(sectionId);
  }, [lockedSections]);

  /**
   * الحصول على موضع مؤشر المستخدم
   */
  const getUserCursor = useCallback((targetUserId) => {
    return cursorPositions.get(targetUserId);
  }, [cursorPositions]);

  /**
   * تعليم Mention كمقروء
   */
  const markMentionAsRead = useCallback((mentionId) => {
    setMentions(prev =>
      Array.isArray(prev) ? prev.map(m => m.id === mentionId ? { ...m, read: true } : m) : []
    );
  }, []);

  const getUserName = useCallback((uId) => userNames.get(uId) || uId, [userNames]);

  /**
   * إرسال هايلايت مشترك
   */
  const broadcastHighlight = useCallback((text, color, mentionedUser = null) => {
    if (!socket || !isConnected) return false;

    const highlightId = `hl-${Date.now()}`;
    socket.emit('add-highlight', {
      brdId,
      highlightId,
      text,
      color,
      createdBy: userId,
      mentionedUser,
      timestamp: new Date()
    });

    return true;
  }, [socket, isConnected, brdId, userId]);

  /**
   * إزالة هايلايت
   */
  const removeHighlightBroadcast = useCallback((highlightId) => {
    if (!socket || !isConnected) return false;

    socket.emit('remove-highlight', {
      brdId,
      highlightId
    });

    return true;
  }, [socket, isConnected, brdId]);

  /**
   * إرسال تحديد النص للمستخدمين الآخرين
   */
  const broadcastSelection = useCallback((selection = null) => {
    if (!socket || !isConnected) return false;

    socket.emit('user-selection', {
      brdId,
      userId,
      userName,
      selection: selection ? {
        text: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        timestamp: new Date()
      } : null
    });

    return true;
  }, [socket, isConnected, brdId, userId, userName]);

  return {
    // الحالة
    isConnected,
    activeUsers,
    lockedSections,
    cursorPositions,
    mentions,
    threads,
    activity,
    sessionId,
    highlights,
    userSelections,
    remoteChange,

    // الوظائف
    sendContentChange,
    lockSection,
    unlockSection,
    updateCursorPosition,
    mentionUser,
    createThread,
    replyToThread,
    resolveThread,
    getSectionLockStatus,
    getUserCursor,
    markMentionAsRead,
    getUserName,
    broadcastHighlight,
    removeHighlightBroadcast,
    broadcastSelection
  };
};

export default useCollaboration;

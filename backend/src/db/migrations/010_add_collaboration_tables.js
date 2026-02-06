/**
 * Migration: إضافة جداول التعاون الفوري
 * يضيف جداول للعمليات والخيوط والإشعارات
 */

const db = require('../connection');

const migrateCollaboration = () => {
  try {
    console.log('🔄 بدء migration الجداول الجديدة...');

    // جدول العمليات (Collaboration Operations)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS collaboration_operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brd_id TEXT NOT NULL,
          section_id TEXT,
          user_id TEXT NOT NULL,
          operation_type TEXT NOT NULL,
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_collaboration_operations_brd_id 
        ON collaboration_operations(brd_id);

        CREATE INDEX IF NOT EXISTS idx_collaboration_operations_created_at 
        ON collaboration_operations(created_at);
      `);
      console.log('✅ تم إنشاء جدول collaboration_operations');
    } catch (e) {
      console.warn('⚠️ جدول collaboration_operations موجود بالفعل');
    }

    // جدول خيوط النقاش (Discussion Threads)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS discussion_threads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          thread_id TEXT UNIQUE NOT NULL,
          brd_id TEXT NOT NULL,
          section_id TEXT,
          parent_thread_id TEXT,
          type TEXT DEFAULT 'general',
          status TEXT DEFAULT 'open',
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          resolved_by TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_discussion_threads_brd_id 
        ON discussion_threads(brd_id);

        CREATE INDEX IF NOT EXISTS idx_discussion_threads_status 
        ON discussion_threads(status);

        CREATE INDEX IF NOT EXISTS idx_discussion_threads_section_id 
        ON discussion_threads(section_id);
      `);
      console.log('✅ تم إنشاء جدول discussion_threads');
    } catch (e) {
      console.warn('⚠️ جدول discussion_threads موجود بالفعل');
    }

    // جدول الإشعارات والإشارات (Mentions)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user_mentions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mention_id TEXT UNIQUE NOT NULL,
          mentioned_user_id TEXT NOT NULL,
          mentioned_by_user_id TEXT NOT NULL,
          brd_id TEXT NOT NULL,
          context TEXT,
          read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME
        );

        CREATE INDEX IF NOT EXISTS idx_user_mentions_mentioned_user_id 
        ON user_mentions(mentioned_user_id);

        CREATE INDEX IF NOT EXISTS idx_user_mentions_brd_id 
        ON user_mentions(brd_id);

        CREATE INDEX IF NOT EXISTS idx_user_mentions_read 
        ON user_mentions(read);
      `);
      console.log('✅ تم إنشاء جدول user_mentions');
    } catch (e) {
      console.warn('⚠️ جدول user_mentions موجود بالفعل');
    }

    // جدول التعليقات (Comments)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS thread_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id TEXT UNIQUE NOT NULL,
          thread_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_thread_comments_thread_id 
        ON thread_comments(thread_id);

        CREATE INDEX IF NOT EXISTS idx_thread_comments_user_id 
        ON thread_comments(user_id);
      `);
      console.log('✅ تم إنشاء جدول thread_comments');
    } catch (e) {
      console.warn('⚠️ جدول thread_comments موجود بالفعل');
    }

    // جدول Reactions (Emojis)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS comment_reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          emoji TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(comment_id, user_id, emoji)
        );

        CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id 
        ON comment_reactions(comment_id);
      `);
      console.log('✅ تم إنشاء جدول comment_reactions');
    } catch (e) {
      console.warn('⚠️ جدول comment_reactions موجود بالفعل');
    }

    // جدول الأقفال (Section Locks)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS section_locks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section_id TEXT NOT NULL,
          brd_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          UNIQUE(section_id)
        );

        CREATE INDEX IF NOT EXISTS idx_section_locks_brd_id 
        ON section_locks(brd_id);

        CREATE INDEX IF NOT EXISTS idx_section_locks_user_id 
        ON section_locks(user_id);
      `);
      console.log('✅ تم إنشاء جدول section_locks');
    } catch (e) {
      console.warn('⚠️ جدول section_locks موجود بالفعل');
    }

    // جدول مؤشرات المستخدمين (User Cursors)
    try {
      db.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user_cursors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brd_id TEXT NOT NULL,
          section_id TEXT,
          user_id TEXT NOT NULL,
          position INTEGER,
          line INTEGER,
          column INTEGER,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME
        );

        CREATE INDEX IF NOT EXISTS idx_user_cursors_brd_id 
        ON user_cursors(brd_id);

        CREATE INDEX IF NOT EXISTS idx_user_cursors_user_id 
        ON user_cursors(user_id);
      `);
      console.log('✅ تم إنشاء جدول user_cursors');
    } catch (e) {
      console.warn('⚠️ جدول user_cursors موجود بالفعل');
    }

    console.log('✨ تم إكمال جميع migrations بنجاح!');
    return { success: true };

  } catch (error) {
    console.error('❌ خطأ في migration:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { migrateCollaboration };

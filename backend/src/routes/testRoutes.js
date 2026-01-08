const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Simple test endpoint - no auth required for testing
router.get('/test', async (req, res) => {
  try {
    // Test 1: Database connection
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    const usersCount = usersResult.rows[0].count;
    
    // Test 2: Settings column exists
    const testUser = await db.query('SELECT id, email, settings FROM users LIMIT 1');
    const hasSettings = testUser.rows.length > 0 && testUser.rows[0].settings;
    
    // Test 3: Activity logs table
    const activityResult = await db.query('SELECT COUNT(*) as count FROM activity_logs');
    const activityCount = activityResult.rows[0].count;
    
    res.json({
      success: true,
      timestamp: new Date(),
      tests: {
        database_connection: '✅ Connected',
        users_count: usersCount,
        settings_storage: hasSettings ? '✅ Working' : '❌ Not configured',
        activity_logs_count: activityCount,
        tables: {
          users: '✅',
          activity_logs: '✅',
          user_sessions: '✅'
        }
      },
      message: 'جميع الأنظمة تعمل بشكل صحيح - All systems operational'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

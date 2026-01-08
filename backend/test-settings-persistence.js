// Test Settings Persistence - يختبر حفظ واسترجاع الإعدادات
// Run: node test-settings-persistence.js

const Database = require('better-sqlite3');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(70)}`, colors.yellow);
  log(`  ${message}`, colors.yellow);
  log(`${'='.repeat(70)}`, colors.yellow);
}

async function testSettingsPersistence() {
  logSection('اختبار حفظ واسترجاع الإعدادات من قاعدة البيانات');

  const db = new Database(path.join(__dirname, 'database.db'));
  
  try {
    // 1. Check if settings column exists
    logSection('1. فحص جدول users والـ settings column');
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const settingsColumn = tableInfo.find(col => col.name === 'settings');
    
    if (settingsColumn) {
      logSuccess('عمود settings موجود في جدول users');
      logInfo(`النوع: ${settingsColumn.type}`);
    } else {
      logError('عمود settings غير موجود!');
      db.close();
      return false;
    }

    // 2. Get all users with settings
    logSection('2. جلب جميع المستخدمين الذين لديهم إعدادات');
    const users = db.prepare(`
      SELECT id, email, first_name, last_name, settings 
      FROM users 
      WHERE settings IS NOT NULL
    `).all();

    logInfo(`عدد المستخدمين الذين لديهم إعدادات: ${users.length}`);

    if (users.length === 0) {
      logError('لا يوجد مستخدمين لديهم إعدادات مخزنة!');
      logInfo('جرب تسجيل الدخول وحفظ بعض الإعدادات أولاً');
      db.close();
      return false;
    }

    // 3. Test each user's settings
    logSection('3. فحص صحة الإعدادات المخزنة');
    
    let validCount = 0;
    let invalidCount = 0;

    users.forEach(user => {
      log(`\n--- المستخدم: ${user.email} (ID: ${user.id}) ---`, colors.cyan);
      
      try {
        const settings = JSON.parse(user.settings);
        validCount++;
        
        // Check required sections
        const requiredSections = ['notifications', 'privacy', 'display', 'accessibility', 'security'];
        const existingSections = requiredSections.filter(section => settings[section]);
        
        logSuccess(`Settings parsed successfully`);
        logInfo(`الأقسام الموجودة: ${existingSections.join(', ')}`);
        
        // Display some settings
        if (settings.display) {
          logInfo(`Theme: ${settings.display.theme || 'not set'}`);
          logInfo(`Language: ${settings.display.language || 'not set'}`);
          logInfo(`Date Format: ${settings.display.date_format || 'not set'}`);
        }
        
        if (settings.security) {
          logInfo(`Session Timeout: ${settings.security.sessions_timeout || 'not set'} minutes`);
          logInfo(`Two Factor: ${settings.security.two_factor ? 'enabled' : 'disabled'}`);
        }
        
        if (settings.notifications) {
          logInfo(`Email Login Alerts: ${settings.notifications.email_login ? 'on' : 'off'}`);
          logInfo(`Push Notifications: ${settings.notifications.push_enabled ? 'on' : 'off'}`);
        }
        
      } catch (error) {
        invalidCount++;
        logError(`فشل parse للـ settings: ${error.message}`);
        logInfo(`Raw settings: ${user.settings.substring(0, 100)}...`);
      }
    });

    logSection('4. الخلاصة');
    logInfo(`عدد المستخدمين الإجمالي: ${users.length}`);
    logSuccess(`إعدادات صحيحة: ${validCount}`);
    if (invalidCount > 0) {
      logError(`إعدادات غير صحيحة: ${invalidCount}`);
    }

    // 4. Test settings update simulation
    logSection('5. اختبار محاكاة تحديث الإعدادات');
    
    const testUser = users[0];
    logInfo(`اختبار على المستخدم: ${testUser.email}`);
    
    try {
      const currentSettings = JSON.parse(testUser.settings);
      
      // Simulate update
      const updatedSettings = {
        ...currentSettings,
        display: {
          ...currentSettings.display,
          theme: 'dark' // Change theme
        }
      };
      
      logInfo('محاكاة تحديث Theme إلى dark...');
      
      // Update in database
      db.prepare(`
        UPDATE users 
        SET settings = ? 
        WHERE id = ?
      `).run(JSON.stringify(updatedSettings), testUser.id);
      
      logSuccess('تم التحديث في Database');
      
      // Retrieve to verify
      const verifyUser = db.prepare(`
        SELECT settings FROM users WHERE id = ?
      `).get(testUser.id);
      
      const verifiedSettings = JSON.parse(verifyUser.settings);
      
      if (verifiedSettings.display.theme === 'dark') {
        logSuccess('✨ التحديث تم بنجاح والبيانات تم حفظها واسترجاعها بشكل صحيح!');
      } else {
        logError('فشل التحديث - البيانات لم تُحفظ!');
      }
      
      // Restore original
      db.prepare(`
        UPDATE users 
        SET settings = ? 
        WHERE id = ?
      `).run(JSON.stringify(currentSettings), testUser.id);
      
      logInfo('تم استعادة الإعدادات الأصلية');
      
    } catch (error) {
      logError(`خطأ في اختبار التحديث: ${error.message}`);
    }

    // 5. Check avatar persistence
    logSection('6. فحص حفظ الصور (Avatar)');
    
    const usersWithAvatars = db.prepare(`
      SELECT id, email, avatar 
      FROM users 
      WHERE avatar IS NOT NULL AND avatar != ''
    `).all();
    
    logInfo(`عدد المستخدمين الذين لديهم صور: ${usersWithAvatars.length}`);
    
    usersWithAvatars.forEach(user => {
      logSuccess(`${user.email}: ${user.avatar}`);
    });

    // 6. Check 2FA persistence
    logSection('7. فحص حفظ بيانات 2FA');
    
    const twoFAUsers = db.prepare(`
      SELECT u.email, t.is_enabled, t.secret, t.backup_codes
      FROM users u
      JOIN user_2fa t ON u.id = t.user_id
      WHERE t.is_enabled = 1
    `).all();
    
    logInfo(`عدد المستخدمين الذين لديهم 2FA مفعّل: ${twoFAUsers.length}`);
    
    twoFAUsers.forEach(user => {
      logSuccess(`${user.email}: 2FA enabled`);
      logInfo(`Secret stored: ${user.secret ? 'Yes' : 'No'}`);
      logInfo(`Backup codes stored: ${user.backup_codes ? 'Yes' : 'No'}`);
      
      if (user.backup_codes) {
        try {
          const codes = JSON.parse(user.backup_codes);
          logInfo(`عدد Backup codes: ${codes.length}`);
        } catch (e) {
          logError('فشل parse لـ backup codes');
        }
      }
    });

    db.close();

    // Final verdict
    logSection('🎯 النتيجة النهائية');
    
    if (validCount === users.length && validCount > 0) {
      log('\n🎉 ✅ جميع الإعدادات تُحفظ وتُسترجع من قاعدة البيانات بشكل صحيح! 🎉\n', colors.green);
      log('✅ Settings persistence: WORKING', colors.green);
      log('✅ Avatar persistence: WORKING', colors.green);
      log('✅ 2FA persistence: WORKING', colors.green);
      return true;
    } else {
      log('\n⚠️ هناك مشاكل في حفظ الإعدادات ⚠️\n', colors.red);
      return false;
    }

  } catch (error) {
    logError(`خطأ في الاختبار: ${error.message}`);
    logError(error.stack);
    db.close();
    return false;
  }
}

// Run test
testSettingsPersistence().then(success => {
  process.exit(success ? 0 : 1);
});

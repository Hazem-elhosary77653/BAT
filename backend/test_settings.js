const pool = require('./src/db/connection');

const testSettings = async () => {
    console.log('Testing Settings Persistence...');
    try {
        const userId = 51; // Admin user
        const initial = await pool.query('SELECT settings FROM users WHERE id = $1', [userId]);
        console.log('Initial Settings:', initial.rows[0].settings);

        // Simulate Update Controller Logic
        // The controller receives flat 'theme', 'language' and nested 'notifications'
        const reqBody = {
            theme: 'dark',
            language: 'ar',
            notifications: {
                email: true,
                push: false
            }
        };

        let currentSettings = {};
        try {
            currentSettings = initial.rows[0].settings ? JSON.parse(initial.rows[0].settings) : {};
        } catch (e) {
            currentSettings = {};
        }

        // Merging Logic from Controller
        const mergedDisplay = {
            ...(currentSettings.display || {}),
            theme: reqBody.theme,
            language: reqBody.language
        };

        const updatedSettings = {
            ...currentSettings,
            notifications: { ...currentSettings.notifications, ...reqBody.notifications },
            display: mergedDisplay
        };

        console.log('Updated Settings Object:', JSON.stringify(updatedSettings, null, 2));

        // Update DB
        await pool.query(
            'UPDATE users SET settings = $1 WHERE id = $2',
            [JSON.stringify(updatedSettings), userId]
        );

        // Verify
        const verify = await pool.query('SELECT settings FROM users WHERE id = $1', [userId]);
        const saved = JSON.parse(verify.rows[0].settings);

        console.log('Saved Theme:', saved.display?.theme);
        console.log('Saved Language:', saved.display?.language);
        console.log('Saved Notif Email:', saved.notifications?.email);

        if (saved.display.theme === 'dark' && saved.display.language === 'ar' && saved.notifications.email === true) {
            console.log('✅ Settings Persistence SUCCESS');
        } else {
            console.log('❌ Settings Persistence FAILED');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
};

testSettings();

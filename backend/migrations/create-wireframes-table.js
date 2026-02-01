const pool = require('../src/db/connection');

const createWireframesTable = async () => {
    try {
        console.log('[MIGRATION] Creating wireframes table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS wireframes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                wireframe_data TEXT,
                canvas_json TEXT,
                wireframe_type VARCHAR(50),
                brd_id INTEGER,
                status VARCHAR(20) DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (brd_id) REFERENCES brd_documents(id)
            )
        `);

        console.log('✅ Wireframes table created successfully');

        // Create wireframe_stories junction table for linking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wireframe_stories (
                wireframe_id INTEGER NOT NULL,
                story_id INTEGER NOT NULL,
                linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                linked_by_user_id INTEGER,
                PRIMARY KEY (wireframe_id, story_id),
                FOREIGN KEY (wireframe_id) REFERENCES wireframes(id) ON DELETE CASCADE,
                FOREIGN KEY (story_id) REFERENCES user_stories(id) ON DELETE CASCADE,
                FOREIGN KEY (linked_by_user_id) REFERENCES users(id)
            )
        `);

        console.log('✅ Wireframe_stories junction table created successfully');

    } catch (error) {
        console.error('[MIGRATION ERROR]', error.message);
        throw error;
    }
};

createWireframesTable()
    .then(() => {
        console.log('[MIGRATION] All wireframe tables created successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('[MIGRATION FAILED]', err);
        process.exit(1);
    });

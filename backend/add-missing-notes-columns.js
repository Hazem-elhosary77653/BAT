const { sqlite: db } = require('./src/db/connection');

async function migrate() {
    try {
        console.log('--- Migrating user_notes Table ---');

        // Add columns if they don't exist
        const columnsToAdd = [
            { name: 'is_pinned', type: 'BOOLEAN DEFAULT 0' },
            { name: 'is_favorite', type: 'BOOLEAN DEFAULT 0' },
            { name: 'is_archived', type: 'BOOLEAN DEFAULT 0' },
            { name: 'tags', type: 'TEXT' },
            { name: 'priority', type: 'VARCHAR(50)' },
            { name: 'due_date', type: 'DATETIME' },
            { name: 'is_todo', type: 'BOOLEAN DEFAULT 0' },
            { name: 'todo_items', type: 'TEXT' }
        ];

        const tableInfo = db.pragma('table_info(user_notes)');
        const existingColumns = tableInfo.map(c => c.name);

        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                db.exec(`ALTER TABLE user_notes ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();

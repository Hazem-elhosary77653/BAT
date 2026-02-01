const pool = require('../src/db/connection');
const { sqlite: db } = require('../src/db/connection');

/**
 * Migration to add new features to notes:
 * - is_pinned: Pin important notes
 * - is_favorite: Mark notes as favorite
 * - is_archived: Archive old notes
 * - tags: JSON array of tags/categories
 * - priority: high, medium, low
 * - due_date: For task-based notes
 * - is_todo: Boolean to mark note as todo list
 * - todo_items: JSON array of todo items with checkboxes
 */

async function migrateNotesFeatures() {
    console.log('🚀 Starting migration: Add new features to notes...\n');

    try {
        if (process.env.DB_TYPE === 'sqlite') {
            // SQLite Migration
            console.log('📊 Database type: SQLite');
            
            const columns = db.pragma('table_info(user_notes)');
            const columnNames = columns.map(col => col.name);
            
            // Add is_pinned column
            if (!columnNames.includes('is_pinned')) {
                console.log('➕ Adding is_pinned column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN is_pinned INTEGER DEFAULT 0').run();
                console.log('✅ is_pinned column added');
            }
            
            // Add is_favorite column
            if (!columnNames.includes('is_favorite')) {
                console.log('➕ Adding is_favorite column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN is_favorite INTEGER DEFAULT 0').run();
                console.log('✅ is_favorite column added');
            }
            
            // Add is_archived column
            if (!columnNames.includes('is_archived')) {
                console.log('➕ Adding is_archived column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN is_archived INTEGER DEFAULT 0').run();
                console.log('✅ is_archived column added');
            }
            
            // Add tags column (stored as JSON string)
            if (!columnNames.includes('tags')) {
                console.log('➕ Adding tags column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN tags TEXT DEFAULT NULL').run();
                console.log('✅ tags column added');
            }
            
            // Add priority column
            if (!columnNames.includes('priority')) {
                console.log('➕ Adding priority column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN priority VARCHAR(20) DEFAULT NULL').run();
                console.log('✅ priority column added');
            }
            
            // Add due_date column
            if (!columnNames.includes('due_date')) {
                console.log('➕ Adding due_date column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN due_date DATETIME DEFAULT NULL').run();
                console.log('✅ due_date column added');
            }
            
            // Add is_todo column
            if (!columnNames.includes('is_todo')) {
                console.log('➕ Adding is_todo column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN is_todo INTEGER DEFAULT 0').run();
                console.log('✅ is_todo column added');
            }
            
            // Add todo_items column (stored as JSON string)
            if (!columnNames.includes('todo_items')) {
                console.log('➕ Adding todo_items column...');
                db.prepare('ALTER TABLE user_notes ADD COLUMN todo_items TEXT DEFAULT NULL').run();
                console.log('✅ todo_items column added');
            }
            
        } else {
            // PostgreSQL Migration
            console.log('📊 Database type: PostgreSQL');
            
            // Check existing columns
            const checkColumn = async (columnName) => {
                const result = await pool.query(
                    `SELECT column_name FROM information_schema.columns 
                     WHERE table_name = 'user_notes' AND column_name = $1`,
                    [columnName]
                );
                return result.rows.length > 0;
            };
            
            // Add is_pinned column
            if (!(await checkColumn('is_pinned'))) {
                console.log('➕ Adding is_pinned column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE');
                console.log('✅ is_pinned column added');
            }
            
            // Add is_favorite column
            if (!(await checkColumn('is_favorite'))) {
                console.log('➕ Adding is_favorite column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE');
                console.log('✅ is_favorite column added');
            }
            
            // Add is_archived column
            if (!(await checkColumn('is_archived'))) {
                console.log('➕ Adding is_archived column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN is_archived BOOLEAN DEFAULT FALSE');
                console.log('✅ is_archived column added');
            }
            
            // Add tags column (array)
            if (!(await checkColumn('tags'))) {
                console.log('➕ Adding tags column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN tags TEXT[] DEFAULT NULL');
                console.log('✅ tags column added');
            }
            
            // Add priority column
            if (!(await checkColumn('priority'))) {
                console.log('➕ Adding priority column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN priority VARCHAR(20) DEFAULT NULL');
                console.log('✅ priority column added');
            }
            
            // Add due_date column
            if (!(await checkColumn('due_date'))) {
                console.log('➕ Adding due_date column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN due_date TIMESTAMP DEFAULT NULL');
                console.log('✅ due_date column added');
            }
            
            // Add is_todo column
            if (!(await checkColumn('is_todo'))) {
                console.log('➕ Adding is_todo column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN is_todo BOOLEAN DEFAULT FALSE');
                console.log('✅ is_todo column added');
            }
            
            // Add todo_items column (JSONB)
            if (!(await checkColumn('todo_items'))) {
                console.log('➕ Adding todo_items column...');
                await pool.query('ALTER TABLE user_notes ADD COLUMN todo_items JSONB DEFAULT NULL');
                console.log('✅ todo_items column added');
            }
        }
        
        console.log('\n✅ Migration completed successfully!');
        console.log('📝 New features added:');
        console.log('   - Pin notes (is_pinned)');
        console.log('   - Favorite notes (is_favorite)');
        console.log('   - Archive notes (is_archived)');
        console.log('   - Tags/Categories (tags)');
        console.log('   - Priority levels (priority: high/medium/low)');
        console.log('   - Due dates (due_date)');
        console.log('   - To-Do list support (is_todo, todo_items)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateNotesFeatures();

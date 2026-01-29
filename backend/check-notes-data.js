const pool = require('./src/db/connection');

async function checkNotes() {
    try {
        console.log('--- START NOTES DATA CHECK ---');
        const result = await pool.query('SELECT * FROM user_notes');
        console.log(`Total notes found: ${result.rows.length}`);

        result.rows.forEach((note, index) => {
            console.log(`Note ${index}: ID=${note.id}, Title="${note.title}", UserID=${note.user_id}`);
            if (!note.id && note.id !== 0) {
                console.error(`!!! CRITICAL: Note at index ${index} has MISSING/NULL ID !!!`);
            }
        });

        console.log('--- END NOTES DATA CHECK ---');
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkNotes();

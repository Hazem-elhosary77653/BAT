const { sqlite: db } = require('./src/db/connection');

async function inspectTable() {
    try {
        console.log('--- Inspecting user_notes Table Schema ---');
        const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_notes'").get();
        if (sql) {
            console.log('CREATE Statement:');
            console.log(sql.sql);
        } else {
            console.log('Table "user_notes" not found!');
        }

        const info = db.pragma('table_info(user_notes)');
        console.log('\nTable Info:');
        console.table(info);

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspectTable();

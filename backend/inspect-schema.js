const { sqlite: db } = require('./src/db/connection');

console.log('--- Inspecting brd_documents Table Schema ---');

try {
    const info = db.pragma('table_info(brd_documents)');
    console.log(JSON.stringify(info, null, 2));

    const hasGroupId = info.some(col => col.name === 'group_id');
    console.log(`\nHas group_id column: ${hasGroupId ? 'YES' : 'NO'}`);
} catch (error) {
    console.error('Error inspecting table:', error.message);
}

process.exit(0);

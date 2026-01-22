const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

try {
    console.log('Adding requester_signature to brd_documents...');
    db.exec("ALTER TABLE brd_documents ADD COLUMN requester_signature TEXT;");
    console.log('Added requester_signature to brd_documents.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column requester_signature already exists.');
    } else {
        console.error('Error adding requester_signature:', err.message);
    }
}

try {
    console.log('Adding reviewer_signature to brd_review_assignments...');
    db.exec("ALTER TABLE brd_review_assignments ADD COLUMN reviewer_signature TEXT;");
    console.log('Added reviewer_signature to brd_review_assignments.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column reviewer_signature already exists.');
    } else {
        console.error('Error adding reviewer_signature:', err.message);
    }
}

try {
    console.log('Adding signature to brd_workflow_history...');
    db.exec("ALTER TABLE brd_workflow_history ADD COLUMN signature TEXT;");
    console.log('Added signature to brd_workflow_history.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column signature already exists in brd_workflow_history.');
    } else {
        console.error('Error adding signature to brd_workflow_history:', err.message);
    }
}

console.log('Database migration completed.');
process.exit(0);

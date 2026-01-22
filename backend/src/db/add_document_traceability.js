const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Phase 1 Document Analysis Workspace...');

try {
    // 1. Add content column to documents
    try {
        db.exec("ALTER TABLE documents ADD COLUMN content TEXT;");
        console.log('Added content column to documents table.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column content already exists in documents.');
        } else {
            throw err;
        }
    }

    // 2. Add source_document_id to user_stories
    try {
        db.exec("ALTER TABLE user_stories ADD COLUMN source_document_id INTEGER;");
        console.log('Added source_document_id to user_stories table.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column source_document_id already exists in user_stories.');
        } else {
            throw err;
        }
    }

    // 3. Add source_document_id to diagrams
    try {
        db.exec("ALTER TABLE diagrams ADD COLUMN source_document_id INTEGER;");
        console.log('Added source_document_id to diagrams table.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column source_document_id already exists in diagrams.');
        } else {
            throw err;
        }
    }

    // 4. Add source_document_id to brd_documents
    try {
        db.exec("ALTER TABLE brd_documents ADD COLUMN source_document_id INTEGER;");
        console.log('Added source_document_id to brd_documents table.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column source_document_id already exists in brd_documents.');
        } else {
            throw err;
        }
    }

    console.log('Migration completed successfully.');
} catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
}

process.exit(0);

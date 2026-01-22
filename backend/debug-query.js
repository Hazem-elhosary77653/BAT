const pool = require('./src/db/connection');

async function debug() {
    try {
        const userId = 1; // Or any user id
        const sql = `
        SELECT d.id, d.user_id, d.title, d.description, d.diagram_type, d.diagram_data as mermaid_code, 
               d.created_at, d.updated_at, d.source_document_id, doc.title as source_document_title
        FROM diagrams d
        LEFT JOIN documents doc ON doc.id = d.source_document_id
        WHERE d.user_id = $1
    `;
        console.log('Running query...');
        const result = await pool.query(sql, [userId]);
        console.log('Query Success! Rows count:', result.rows.length);
    } catch (err) {
        console.error('QUERY FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        process.exit();
    }
}

debug();

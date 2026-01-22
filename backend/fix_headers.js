const fs = require('fs');
const path = 'src/controllers/documentsController.js';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const viewFunctionStart = 'const viewDocumentFile = async (req, res) => {';
const viewFunctionEnd = '};';

const startIndex = content.indexOf(viewFunctionStart);
if (startIndex === -1) {
    console.log('Could not find viewDocumentFile function start');
    process.exit(1);
}

// Find the next }; after the start index
// Since the function is at the end, it should be easy.
const endIndex = content.indexOf(viewFunctionEnd, startIndex + viewFunctionStart.length);

if (endIndex === -1) {
    console.log('Could not find viewDocumentFile function end');
    process.exit(1);
}

const newFunction = `const viewDocumentFile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path, file_type FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];
    const absolutePath = path.resolve(__dirname, '../../', doc.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Force inline display for browsers using explicit headers option
    res.sendFile(absolutePath, {
      headers: {
        'Content-Type': doc.file_type || 'application/pdf',
        'Content-Disposition': 'inline',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  } catch (err) {
    console.error('Error viewing document file:', err);
    res.status(500).json({ error: 'Failed to stream document' });
  }
};`;

const updatedContent = content.substring(0, startIndex) + newFunction + content.substring(endIndex + 2);

fs.writeFileSync(path, updatedContent);
console.log('Successfully replaced viewDocumentFile function');

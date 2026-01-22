const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

// Polyfill for DOMMatrix if not present (needed for some PDF parsing environments)
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        constructor() {
            this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
            this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
            this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
            this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
        }
    };
}

/**
 * Extracts raw text from uploaded files (PDF, DOCX, TXT)
 * @param {string} filePath - Path to the file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(filePath, fileType) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error('[DocumentUtils] File not found:', filePath);
            return '';
        }

        // 1. PDF Processing
        if (fileType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        }

        // 2. DOCX Processing
        if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            filePath.toLowerCase().endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }

        // 3. Plain Text Processing
        if (fileType.includes('text/') || filePath.toLowerCase().endsWith('.txt')) {
            return fs.readFileSync(filePath, 'utf8');
        }

        console.warn('[DocumentUtils] Unsupported file type for extraction:', fileType);
        return '';
    } catch (error) {
        console.error('[DocumentUtils] Extraction failed:', error.message);
        return '';
    }
}

module.exports = {
    extractTextFromFile
};

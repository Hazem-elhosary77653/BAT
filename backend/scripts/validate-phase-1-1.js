/**
 * Validation Script for Phase 1.1 AI Integration
 * Tests database tables, routes, and services
 * 
 * Usage: node backend/scripts/validate-phase-1-1.js
 */

const db = require('better-sqlite3')('database.db');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Phase 1.1 - AI Integration Implementation\n');

const checks = {
  passed: [],
  failed: [],
};

// Helper function to log results
function check(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    checks.passed.push(name);
  } else {
    console.log(`❌ ${name}`);
    checks.failed.push(name);
  }
}

// 1. Check if database tables exist
console.log('📊 Database Tables Check:');
try {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('ai_configurations', 'brd_documents', 'brd_versions')
  `).all();
  
  check('ai_configurations table exists', tables.some(t => t.name === 'ai_configurations'));
  check('brd_documents table exists', tables.some(t => t.name === 'brd_documents'));
  check('brd_versions table exists', tables.some(t => t.name === 'brd_versions'));
} catch (error) {
  console.log(`❌ Database error: ${error.message}`);
  checks.failed.push('Database tables');
}

// 2. Check if files exist
console.log('\n📁 Files Check:');
const backendPath = 'd:\\Tools\\Test Tool2\\backend\\src';
const filesToCheck = [
  { name: 'AI Service', path: path.join(backendPath, 'services', 'aiService.js') },
  { name: 'AI Config Controller', path: path.join(backendPath, 'controllers', 'aiConfigController.js') },
  { name: 'BRD Controller', path: path.join(backendPath, 'controllers', 'brdController.js') },
  { name: 'AI Config Routes', path: path.join(backendPath, 'routes', 'aiConfigRoutes.js') },
  { name: 'BRD Routes', path: path.join(backendPath, 'routes', 'brdRoutes.js') },
];

filesToCheck.forEach(file => {
  check(`${file.name} exists`, fs.existsSync(file.path));
});

// 3. Check file content for key methods
console.log('\n🔧 Methods Check:');
const aiServicePath = path.join(backendPath, 'services', 'aiService.js');
if (fs.existsSync(aiServicePath)) {
  const aiServiceContent = fs.readFileSync(aiServicePath, 'utf8');
  check('aiService has generateBRDFromStories', aiServiceContent.includes('generateBRDFromStories'));
  check('aiService has generateStoriesFromRequirements', aiServiceContent.includes('generateStoriesFromRequirements'));
  check('aiService has estimateStoryPoints', aiServiceContent.includes('estimateStoryPoints'));
}

const brdControllerPath = path.join(backendPath, 'controllers', 'brdController.js');
if (fs.existsSync(brdControllerPath)) {
  const brdContent = fs.readFileSync(brdControllerPath, 'utf8');
  check('brdController uses db.prepare (SQLite)', brdContent.includes('db.prepare'));
  check('brdController does NOT use pool.query (PostgreSQL)', !brdContent.includes('pool.query'));
  check('brdController has generateBRD method', brdContent.includes('exports.generateBRD'));
  check('brdController has listBRDs method', brdContent.includes('exports.listBRDs'));
  check('brdController has exportPDF method', brdContent.includes('exports.exportPDF'));
}

// 4. Check server.js registration
console.log('\n🌐 Server Routes Check:');
const serverPath = path.join(backendPath, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  check('server.js registers ai-config routes', serverContent.includes("'/api/ai-config'"));
  check('server.js registers brd routes', serverContent.includes("'/api/brd'"));
}

// 5. Check migration file
console.log('\n🗄️  Migration Check:');
const migrationPath = 'd:\\Tools\\Test Tool2\\backend\\migrations\\004_add_ai_configuration_tables.js';
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  check('Migration creates ai_configurations table', migrationContent.includes('ai_configurations'));
  check('Migration creates brd_documents table', migrationContent.includes('brd_documents'));
  check('Migration creates brd_versions table', migrationContent.includes('brd_versions'));
  check('Migration creates indexes', migrationContent.includes('CREATE INDEX'));
}

// 6. Check encryption implementation
console.log('\n🔐 Security Check:');
if (fs.existsSync(aiServicePath)) {
  const aiServiceContent = fs.readFileSync(aiServicePath, 'utf8');
  check('aiService handles API key encryption', aiServiceContent.includes('crypto') || aiServiceContent.includes('encrypt'));
}

const configControllerPath = path.join(backendPath, 'controllers', 'aiConfigController.js');
if (fs.existsSync(configControllerPath)) {
  const configContent = fs.readFileSync(configControllerPath, 'utf8');
  check('aiConfigController encrypts API keys', configContent.includes('createCipheriv'));
  check('aiConfigController validates input', configContent.includes('validationResult'));
}

// 7. Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);

if (checks.failed.length > 0) {
  console.log('\nFailed checks:');
  checks.failed.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\n🎉 All checks passed! Phase 1.1 implementation is complete.');
  process.exit(0);
}

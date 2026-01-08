#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all components are properly configured
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('\n📋 Business Analyst Assistant - Setup Verification\n');
console.log('=' .repeat(60) + '\n');

// Check 1: Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    checks.passed.push(`✅ Node.js ${nodeVersion} (Required: 18+)`);
  } else {
    checks.failed.push(`❌ Node.js ${nodeVersion} - Please upgrade to 18+`);
  }
} catch (e) {
  checks.failed.push(`❌ Could not verify Node.js version`);
}

// Check 2: Backend directory
if (fs.existsSync('./backend')) {
  checks.passed.push('✅ Backend directory exists');
} else {
  checks.failed.push('❌ Backend directory not found');
}

// Check 3: Frontend directory
if (fs.existsSync('./frontend')) {
  checks.passed.push('✅ Frontend directory exists');
} else {
  checks.failed.push('❌ Frontend directory not found');
}

// Check 4: Backend package.json
if (fs.existsSync('./backend/package.json')) {
  const pkg = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
  
  // Check dependencies
  const requiredDeps = ['express', 'pg', 'better-sqlite3', 'bcryptjs', 'jsonwebtoken'];
  const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    checks.passed.push('✅ Backend dependencies configured');
  } else {
    checks.warnings.push(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
  }
  
  // Check scripts
  if (pkg.scripts['migrate-sqlite']) {
    checks.passed.push('✅ SQLite migration script available');
  } else {
    checks.failed.push('❌ SQLite migration script not found');
  }
} else {
  checks.failed.push('❌ Backend package.json not found');
}

// Check 5: Backend .env
if (fs.existsSync('./backend/.env')) {
  const env = fs.readFileSync('./backend/.env', 'utf8');
  
  if (env.includes('DB_TYPE')) {
    checks.passed.push('✅ Backend .env configured');
  } else {
    checks.warnings.push('⚠️  DB_TYPE not set in .env');
  }
  
  if (env.includes('sqlite')) {
    checks.passed.push('✅ SQLite configured as database');
  } else if (env.includes('postgresql')) {
    checks.warnings.push('⚠️  Using PostgreSQL - Docker may be required');
  }
} else {
  checks.warnings.push('⚠️  Backend .env not found - will need configuration');
}

// Check 6: Database file
if (fs.existsSync('./backend/database.db')) {
  const stats = fs.statSync('./backend/database.db');
  checks.passed.push(`✅ SQLite database exists (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
  checks.warnings.push('⚠️  SQLite database not created yet - run: npm run migrate-sqlite');
}

// Check 7: Frontend .env
if (fs.existsSync('./frontend/.env.local')) {
  checks.passed.push('✅ Frontend .env.local exists');
} else {
  checks.warnings.push('⚠️  Frontend .env.local not found');
}

// Check 8: Migration script
if (fs.existsSync('./backend/src/db/migrate-sqlite.js')) {
  checks.passed.push('✅ SQLite migration script exists');
} else {
  checks.failed.push('❌ SQLite migration script not found');
}

// Check 9: Connection adapter
if (fs.existsSync('./backend/src/db/connection.js')) {
  const conn = fs.readFileSync('./backend/src/db/connection.js', 'utf8');
  if (conn.includes('better-sqlite3') && conn.includes('DB_TYPE')) {
    checks.passed.push('✅ Database adapter supports SQLite and PostgreSQL');
  } else {
    checks.warnings.push('⚠️  Database adapter may not be fully configured');
  }
} else {
  checks.failed.push('❌ Connection module not found');
}

// Print results
console.log('PASSED CHECKS:');
checks.passed.forEach(check => console.log('  ' + check));

if (checks.warnings.length > 0) {
  console.log('\nWARNINGS:');
  checks.warnings.forEach(warning => console.log('  ' + warning));
}

if (checks.failed.length > 0) {
  console.log('\nFAILED CHECKS:');
  checks.failed.forEach(failure => console.log('  ' + failure));
}

console.log('\n' + '='.repeat(60));

// Summary
console.log(`\nSummary: ${checks.passed.length} passed, ${checks.failed.length} failed, ${checks.warnings.length} warnings\n`);

// Next steps
if (checks.failed.length === 0) {
  console.log('✨ All checks passed! Ready to start:\n');
  console.log('  1. Backend: npm run dev (in backend directory)');
  console.log('  2. Frontend: npm run dev (in frontend directory)');
  console.log('  3. Browser: http://localhost:3000\n');
} else {
  console.log('❌ Please fix failed checks before starting.\n');
}

process.exit(checks.failed.length > 0 ? 1 : 0);

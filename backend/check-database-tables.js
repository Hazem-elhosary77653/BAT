const Database = require('better-sqlite3');
const db = new Database('./database.db');

console.log('\n=== ALL TABLES ===');
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
console.log(JSON.stringify(tables, null, 2));

console.log('\n=== USERS TABLE SCHEMA ===');
const userSchema = db.prepare('PRAGMA table_info(users)').all();
console.log(JSON.stringify(userSchema, null, 2));

// Check for 2FA table
console.log('\n=== Checking for 2FA tables ===');
const twoFactorTables = tables.filter(t => t.name.includes('2fa') || t.name.includes('two_factor'));
console.log(JSON.stringify(twoFactorTables, null, 2));

if (twoFactorTables.length > 0) {
  twoFactorTables.forEach(table => {
    console.log(`\n=== ${table.name} SCHEMA ===`);
    const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(JSON.stringify(schema, null, 2));
    
    console.log(`\n=== ${table.name} DATA ===`);
    const data = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
    console.log(JSON.stringify(data, null, 2));
  });
}

// Check settings data
console.log('\n=== USER SETTINGS SAMPLE ===');
const settingsSample = db.prepare('SELECT id, email, settings FROM users WHERE settings IS NOT NULL LIMIT 1').all();
if (settingsSample.length > 0) {
  console.log('User ID:', settingsSample[0].id);
  console.log('Email:', settingsSample[0].email);
  const settings = JSON.parse(settingsSample[0].settings);
  console.log('Settings:', JSON.stringify(settings, null, 2));
}

db.close();
console.log('\n=== DONE ===');

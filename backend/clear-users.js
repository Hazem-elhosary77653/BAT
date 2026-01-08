#!/usr/bin/env node
/**
 * Script to clear all users from database
 * Usage: node clear-users.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'app.db');

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function clearUsers() {
  try {
    // Confirm deletion
    const answer = await prompt(
      '⚠️  WARNING: This will delete ALL users from the database. Continue? (type "yes" to confirm): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      return;
    }
    
    const db = new Database(dbPath);
    
    // Get count before
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`\nDeleting ${countBefore.count} users...`);
    
    // Delete all users
    db.prepare('DELETE FROM users').run();
    
    // Get count after
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`✓ Deletion complete. Users remaining: ${countAfter.count}`);
    
    db.close();
    rl.close();
    
  } catch (err) {
    console.error('Error:', err.message);
    rl.close();
    process.exit(1);
  }
}

clearUsers();

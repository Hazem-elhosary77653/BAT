#!/usr/bin/env node
require('dotenv').config();

const pool = require('./src/db/connection');

async function checkActivityLogsTable() {
  try {
    console.log('Checking activity_logs table...\n');
    
    // Get table schema
    const schemaResult = await pool.query(`PRAGMA table_info(activity_logs)`);
    console.log('Columns in activity_logs:');
    if (schemaResult.rows && schemaResult.rows.length > 0) {
      schemaResult.rows.forEach((col, i) => {
        console.log(`  ${i+1}. ${col.name} (${col.type})`);
      });
    } else {
      console.log('  (no columns found - table might be empty)');
    }
    
    // Try to fetch all activities
    console.log('\nTesting query: SELECT * FROM activity_logs LIMIT 1');
    const result = await pool.query(
      `SELECT * FROM activity_logs LIMIT 1`
    );
    console.log('Query successful - found', result.rows.length, 'rows');
    
    // Test the join query
    console.log('\nTesting JOIN query...');
    const joinResult = await pool.query(
      `SELECT al.*, u.email FROM activity_logs al 
       JOIN users u ON al.user_id = u.id LIMIT 1`
    );
    console.log('JOIN query successful');
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full error:', err.code);
  }
  
  process.exit(0);
}

checkActivityLogsTable();

#!/usr/bin/env node
/**
 * Seed script to populate demo users with different roles
 * Usage: node seed-users.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database path
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Hash password
const hashPassword = async (password) => {
  return bcrypt.hashSync(password, 10);
};

// Demo users
const demoUsers = [
  {
    email: 'admin@example.com',
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    password: 'Admin@123',
    role: 'admin',
    is_active: true
  },
  {
    email: 'analyst@example.com',
    username: 'analyst',
    first_name: 'Analyst',
    last_name: 'User',
    password: 'Analyst@123',
    role: 'analyst',
    is_active: true
  },
  {
    email: 'viewer@example.com',
    username: 'viewer',
    first_name: 'Viewer',
    last_name: 'User',
    password: 'Viewer@123',
    role: 'viewer',
    is_active: true
  },
  {
    email: 'john.doe@example.com',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    password: 'John@123',
    role: 'analyst',
    is_active: true
  },
  {
    email: 'jane.smith@example.com',
    username: 'janesmith',
    first_name: 'Jane',
    last_name: 'Smith',
    password: 'Jane@123',
    role: 'analyst',
    is_active: true
  }
];

async function seedUsers() {
  try {
    console.log('Starting user seed process...');
    
    // Disable foreign keys temporarily to allow delete
    db.pragma('foreign_keys = OFF');
    
    // Check if users table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).all();
    
    if (tableCheck.length === 0) {
      console.log('Creating users table...');
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT DEFAULT 'analyst',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created.');
    }
    
    // Check for existing users
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`Current users in database: ${existingUsers.count}`);
    
    if (existingUsers.count > 0) {
      console.log('Clearing existing users to reseed with fresh data...');
      db.prepare('DELETE FROM users').run();
      console.log('✅ Cleared all users');
    }
    
    // Insert demo users
    const insertStmt = db.prepare(`
      INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const transaction = db.transaction((users) => {
      for (const user of users) {
        try {
          const passwordHash = bcrypt.hashSync(user.password, 10);
          insertStmt.run(
            user.email,
            user.username,
            passwordHash,
            user.first_name,
            user.last_name,
            user.role,
            user.is_active ? 1 : 0
          );
          console.log(`✓ Created user: ${user.email} (${user.role})`);
        } catch (err) {
          console.error(`✗ Error creating user ${user.email}:`, err.message);
        }
      }
    });
    
    transaction(demoUsers);
    
    // Display created users
    console.log('\n--- Created Users ---');
    const allUsers = db.prepare('SELECT id, email, username, role, is_active FROM users').all();
    console.table(allUsers);
    
    console.log('\n--- Login Credentials ---');
    demoUsers.forEach(user => {
      console.log(`${user.email} / ${user.password}`);
    });
    
    console.log('\nSeed completed successfully!');
    
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seed
seedUsers();

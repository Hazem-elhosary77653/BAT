// Standalone test server that stays running
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

// Initialize database connection
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { credential, password } = req.body;
    console.log('[ENDPOINT] Login attempt with:', credential);

    if (!credential || !password) {
      return res.status(400).json({ error: 'Credential and password required' });
    }

    // Get user
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?');
    const user = stmt.get(credential, credential, credential);
    
    console.log('[ENDPOINT] User lookup result:', user ? `Found ${user.email}` : 'Not found');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    console.log('[ENDPOINT] Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('[ENDPOINT] Login successful');
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('[ENDPOINT] Error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

// Keep server running
process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});

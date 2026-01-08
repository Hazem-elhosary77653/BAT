const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT. Optionally embed sessionId for server-side session validation.
const generateToken = (user, sessionId = null) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Get user by email, username, or mobile
const getUserByCredential = async (credential) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 OR username = $1 OR mobile = $1`,
    [credential]
  );
  return result.rows[0];
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  getUserByCredential
};

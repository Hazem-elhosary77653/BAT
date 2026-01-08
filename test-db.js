const db = require('./backend/node_modules/better-sqlite3')('./backend/database.db');
const jwt = require('./backend/node_modules/jsonwebtoken');

try {
  // Get first user
  const user = db.prepare('SELECT id, email, role FROM users LIMIT 1').get();
  console.log('\nFirst user:', user);

  // Create JWT token
  if (user) {
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '24h' }
    );
    console.log('\nGenerated token for curl:');
    console.log(token);
  }
} catch (err) {
  console.error('Error:', err.message);
}

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = new sqlite3.Database('./dev.db');

console.log('🔍 Testing complete authentication flow...');

// Simulate the exact authService.login method
async function testLogin() {
  const username = 'admin';
  const password = 'password';
  
  console.log('🔍 Login attempt for username:', username);
  
  // Get user from database
  const stmt = db.prepare(
    'SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = ? OR email = ?'
  );
  
  const user = await new Promise((resolve, reject) => {
    stmt.get(username, username, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  console.log('🔍 User found:', user ? 'YES' : 'NO');
  if (user) {
    console.log('🔍 User details:', { id: user.id, username: user.username, role: user.role });
  }
  
  if (!user) {
    console.log('❌ No user found for username:', username);
    return;
  }
  
  console.log('🔐 Testing password for user:', user.username);
  console.log('🔐 Password hash length:', user.password_hash ? user.password_hash.length : 'UNDEFINED');
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('🔐 Password validation result:', isValidPassword ? 'VALID' : 'INVALID');
  
  if (!isValidPassword) {
    console.log('❌ Password validation failed');
    return;
  }
  
  // Generate JWT token
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
  
  console.log('🎫 JWT token generated:', token ? 'YES' : 'NO');
  console.log('🎫 Token length:', token ? token.length : 'UNDEFINED');
  
  // Return the result
  const result = {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      church_id: user.church_id
    },
    token
  };
  
  console.log('✅ Authentication successful!');
  console.log('📊 Result:', JSON.stringify(result, null, 2));
  
  db.close();
}

testLogin().catch(console.error);

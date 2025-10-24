const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Simulate the exact authentication flow from authService.ts
const db = new sqlite3.Database('./dev.db');

console.log('🔍 Testing exact authentication flow...');

// This is the exact query from authService.ts line 46-49
const stmt = db.prepare(
  'SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = ? OR email = ?'
);

console.log('📝 Query: SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = ? OR email = ?');
console.log('📝 Parameters: ["admin", "admin"]');

stmt.get('admin', 'admin', (err, user) => {
  if (err) {
    console.error('❌ Query error:', err);
    return;
  }
  
  console.log('\n📊 Query result:');
  console.log(user);
  
  if (!user) {
    console.log('❌ No user found!');
    db.close();
    return;
  }
  
  console.log('\n🔐 Testing password...');
  const testPassword = 'password';
  const isValid = bcrypt.compareSync(testPassword, user.password_hash);
  
  console.log('🔐 Password test result:', isValid ? '✅ VALID' : '❌ INVALID');
  
  if (isValid) {
    console.log('✅ Authentication should work!');
    console.log('👤 User data:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      church_id: user.church_id
    });
  } else {
    console.log('❌ Password mismatch!');
  }
  
  db.close();
});

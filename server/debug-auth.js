const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

async function debugAuth() {
  console.log('=== DEBUGGING AUTHENTICATION ===');
  
  const db = new sqlite3.Database('./dev.db');
  
  // Get user from database
  db.get("SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = ?", ['admin'], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }
    
    if (!user) {
      console.log('❌ No user found in database');
      db.close();
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      church_id: user.church_id,
      hashLength: user.password_hash.length,
      hashStart: user.password_hash.substring(0, 10)
    });
    
    // Test password comparison
    const password = 'password';
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Password comparison result:', isValid);
    
    if (isValid) {
      console.log('✅ Authentication should work!');
    } else {
      console.log('❌ Authentication will fail');
    }
    
    db.close();
  });
}

debugAuth();

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./dev.db');

console.log('🔍 Testing exact password hash...');

db.get("SELECT password_hash FROM users WHERE username = ?", ['admin'], (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  if (!row) {
    console.log('❌ No user found');
    db.close();
    return;
  }
  
  console.log('📊 Password hash from database:');
  console.log('Hash:', row.password_hash);
  console.log('Length:', row.password_hash ? row.password_hash.length : 'UNDEFINED');
  
  const testPassword = 'password';
  console.log('\n🔐 Testing password:', testPassword);
  
  const isValid = bcrypt.compareSync(testPassword, row.password_hash);
  console.log('🔐 Result:', isValid ? '✅ VALID' : '❌ INVALID');
  
  if (!isValid) {
    console.log('\n🔧 Generating new hash...');
    const newHash = bcrypt.hashSync(testPassword, 10);
    console.log('New hash:', newHash);
    
    db.run("UPDATE users SET password_hash = ? WHERE username = ?", [newHash, 'admin'], (err) => {
      if (err) {
        console.error('❌ Update error:', err);
      } else {
        console.log('✅ Password updated successfully');
        
        // Test again
        const isValidAfter = bcrypt.compareSync(testPassword, newHash);
        console.log('🔐 Test after update:', isValidAfter ? '✅ VALID' : '❌ INVALID');
      }
      db.close();
    });
  } else {
    console.log('✅ Password is valid!');
    db.close();
  }
});

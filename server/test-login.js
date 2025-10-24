const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

async function testLogin() {
  console.log('Testing login...');
  
  // Test bcrypt hash generation
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  // Test bcrypt comparison
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password comparison result:', isValid);
  
  // Check database
  const db = new sqlite3.Database('./dev.db');
  
  db.get("SELECT id, username, password_hash FROM users WHERE username = ?", ['admin'], (err, row) => {
    if (err) {
      console.error('Database error:', err);
    } else if (row) {
      console.log('Database user found:', row.username);
      console.log('Database hash length:', row.password_hash.length);
      console.log('Database hash starts with:', row.password_hash.substring(0, 10));
      
      // Test comparison with database hash
      bcrypt.compare('password', row.password_hash, (err, result) => {
        if (err) {
          console.error('Comparison error:', err);
        } else {
          console.log('Database password comparison result:', result);
        }
        db.close();
      });
    } else {
      console.log('No user found in database');
      db.close();
    }
  });
}

testLogin();

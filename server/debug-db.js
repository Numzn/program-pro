const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./dev.db');

console.log('🔍 Checking database...');

// Check users table
db.all("SELECT id, username, email, role, length(password_hash) as hash_length FROM users", (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('📊 Users in database:');
  console.table(rows);
  
  if (rows.length === 0) {
    console.log('❌ No users found! Creating admin user...');
    
    const password = 'password';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run(
      "INSERT INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)",
      ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', 1],
      function(err) {
        if (err) {
          console.error('❌ Insert error:', err);
        } else {
          console.log('✅ Admin user created with ID:', this.lastID);
        }
        db.close();
      }
    );
  } else {
    console.log('✅ Users found. Testing password...');
    
    const user = rows[0];
    const testPassword = 'password';
    
    // Test the password
    db.get("SELECT password_hash FROM users WHERE username = ?", ['admin'], (err, row) => {
      if (err) {
        console.error('❌ Error getting password:', err);
        db.close();
        return;
      }
      
      if (row) {
        const isValid = bcrypt.compareSync(testPassword, row.password_hash);
        console.log('🔐 Password test result:', isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isValid) {
          console.log('🔧 Fixing password...');
          const newHash = bcrypt.hashSync(testPassword, 10);
          db.run("UPDATE users SET password_hash = ? WHERE username = ?", [newHash, 'admin'], (err) => {
            if (err) {
              console.error('❌ Update error:', err);
            } else {
              console.log('✅ Password updated successfully');
            }
            db.close();
          });
        } else {
          db.close();
        }
      } else {
        console.log('❌ No admin user found');
        db.close();
      }
    });
  }
});

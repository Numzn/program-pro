const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

async function createUser() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Generated hash:', hash);
  
  const db = new sqlite3.Database('./dev.db');
  
  db.run(
    'INSERT INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)',
    ['admin', 'admin@gracecommunity.com', hash, 'ADMIN', 1],
    function(err) {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('User created with ID:', this.lastID);
        
        // Test the hash
        bcrypt.compare('password', hash, (err, result) => {
          console.log('Password test result:', result);
          db.close();
        });
      }
    }
  );
}

createUser();

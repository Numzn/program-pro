const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./dev.db');

const passwordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

db.run(
  'INSERT INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)',
  ['admin', 'admin@gracecommunity.com', passwordHash, 'ADMIN', 1],
  function(err) {
    if (err) {
      console.error('Error inserting user:', err);
    } else {
      console.log('User inserted successfully with ID:', this.lastID);
    }
    db.close();
  }
);

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./dev.db');

console.log('🔍 Detailed Authentication Debug...');

// Check if churches exist
db.all("SELECT * FROM churches", (err, churches) => {
  if (err) {
    console.error('❌ Error checking churches:', err);
    return;
  }
  
  console.log('🏛️ Churches in database:');
  console.table(churches);
  
  if (churches.length === 0) {
    console.log('❌ No churches found! Creating default church...');
    db.run(
      "INSERT INTO churches (name, slug, theme_config) VALUES (?, ?, ?)",
      ['Grace Community Church', 'grace-community', '{"primaryColor":"#4F46E5","secondaryColor":"#10B981"}'],
      function(err) {
        if (err) {
          console.error('❌ Church insert error:', err);
        } else {
          console.log('✅ Church created with ID:', this.lastID);
          checkUsers(this.lastID);
        }
      }
    );
  } else {
    checkUsers(churches[0].id);
  }
});

function checkUsers(churchId) {
  console.log(`\n👥 Checking users for church_id: ${churchId}`);
  
  db.all("SELECT id, username, email, role, church_id, password_hash, length(password_hash) as hash_length FROM users", (err, users) => {
    if (err) {
      console.error('❌ Error checking users:', err);
      return;
    }
    
    console.log('📊 Users in database:');
    console.table(users);
    
    if (users.length === 0) {
      console.log('❌ No users found! Creating admin user...');
      createAdminUser(churchId);
    } else {
      testLogin(users[0]);
    }
  });
}

function createAdminUser(churchId) {
  const password = 'password';
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    "INSERT INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)",
    ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', churchId],
    function(err) {
      if (err) {
        console.error('❌ User insert error:', err);
      } else {
        console.log('✅ Admin user created with ID:', this.lastID);
        testLogin({ id: this.lastID, username: 'admin', email: 'admin@gracecommunity.com', role: 'ADMIN', church_id: churchId, password_hash: hashedPassword });
      }
    }
  );
}

function testLogin(user) {
  console.log(`\n🔐 Testing login for user: ${user.username}`);
  
  const testPassword = 'password';
  const isValid = bcrypt.compareSync(testPassword, user.password_hash);
  
  console.log('🔐 Password test result:', isValid ? '✅ VALID' : '❌ INVALID');
  
  if (!isValid) {
    console.log('🔧 Fixing password...');
    const newHash = bcrypt.hashSync(testPassword, 10);
    db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id], (err) => {
      if (err) {
        console.error('❌ Password update error:', err);
      } else {
        console.log('✅ Password updated successfully');
      }
      db.close();
    });
  } else {
    console.log('✅ Login should work!');
    db.close();
  }
}

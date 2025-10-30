import bcrypt from 'bcryptjs'
import DatabaseConnection from '../database/connection'

async function createAdminUser(): Promise<void> {
  const db = DatabaseConnection.getInstance()
  await db.connect()
  const connection = db.getConnection() as any

  const username = 'admin'
  const email = 'admin@gracecommunity.com'
  const password = 'admin123'
  const role = 'ADMIN'
  const churchId = 1

  const hashedPassword = await bcrypt.hash(password, 10)

  const isPostgres = process.env.DATABASE_URL?.includes('postgres')

  // Ensure church exists
  if (isPostgres) {
    await connection.query(
      'INSERT INTO churches (name, short_name, slug, description) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING',
      ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church']
    )
  } else {
    const stmtChurch = connection.prepare(
      'INSERT OR IGNORE INTO churches (name, short_name, slug, description) VALUES (?, ?, ?, ?)'
    )
    await stmtChurch.run('Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church')
  }

  // Upsert admin user
  if (isPostgres) {
    await connection.query(
      'INSERT INTO users (username, email, password_hash, role, church_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO NOTHING',
      [username, email, hashedPassword, role, churchId]
    )
  } else {
    const stmt = connection.prepare(
      'INSERT OR IGNORE INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)'
    )
    await stmt.run(username, email, hashedPassword, role, churchId)
  }

  console.log('✅ Admin user ensured: admin / admin123')
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ Failed to create admin user:', e); process.exit(1) })



import DatabaseConnection from './connection'

export async function seedDatabase(): Promise<void> {
  const db = DatabaseConnection.getInstance()
  const connection = db.getConnection()

  try {
    console.log('🌱 Seeding database...')

    const seedData = {
      churches: [{
        name: 'Grace Community Church',
        slug: 'grace-community',
        theme_config: JSON.stringify({
          primaryColor: '#4F46E5',
          secondaryColor: '#10B981'
        })
      }],
      users: [
        {
          username: 'admin',
          email: 'admin@gracecommunity.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'ADMIN',
          church_id: 1
        },
        {
          username: 'editor',
          email: 'editor@gracecommunity.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'EDITOR',
          church_id: 1
        }
      ]
    }

    // Insert churches
    for (const church of seedData.churches) {
      if (process.env.DATABASE_URL?.includes('postgres')) {
        const client = await (connection as any).connect()
        await client.query(
          'INSERT INTO churches (name, slug, theme_config) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
          [church.name, church.slug, church.theme_config]
        )
        client.release()
      } else {
        const stmt = (connection as any).prepare(
          'INSERT OR IGNORE INTO churches (name, slug, theme_config) VALUES (?, ?, ?)'
        )
        stmt.run(church.name, church.slug, church.theme_config)
      }
    }

    // Insert users
    for (const user of seedData.users) {
      if (process.env.DATABASE_URL?.includes('postgres')) {
        const client = await (connection as any).connect()
        await client.query(
          'INSERT INTO users (username, email, password_hash, role, church_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
          [user.username, user.email, user.password_hash, user.role, user.church_id]
        )
        client.release()
      } else {
        const stmt = (connection as any).prepare(
          'INSERT OR IGNORE INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)'
        )
        stmt.run(user.username, user.email, user.password_hash, user.role, user.church_id)
      }
    }

    console.log('✅ Database seeded successfully')
    console.log('📝 Default credentials: username="admin", password="password"')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

if (require.main === module) {
  const db = DatabaseConnection.getInstance()
  db.connect().then(() => {
    seedDatabase().then(() => {
      db.disconnect()
      process.exit(0)
    })
  })
}
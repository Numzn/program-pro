import { readFileSync } from 'fs'
import { join } from 'path'
import DatabaseConnection from '../src/database/connection'

async function migrateDatabase() {
  console.log('🔄 Starting database migration...')
  
  try {
    // Read schema file
    const schemaPath = join(process.cwd(), 'src/database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    
    // Get database connection
    const db = DatabaseConnection.getInstance()
    await db.connect()
    const connection = db.getConnection()
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    if (process.env.DATABASE_URL?.includes('postgres')) {
      // PostgreSQL migration
      console.log('🐘 Using PostgreSQL database')
      const client = await (connection as any).connect()
      
      try {
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i]
          if (statement.trim()) {
            console.log(`  ${i + 1}/${statements.length}: Executing statement...`)
            await client.query(statement)
          }
        }
        console.log('✅ PostgreSQL migration completed successfully!')
      } finally {
        client.release()
      }
    } else {
      // SQLite migration
      console.log('🗃️ Using SQLite database')
      const stmt = (connection as any).prepare
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          console.log(`  ${i + 1}/${statements.length}: Executing statement...`)
          try {
            await stmt(statement).run()
          } catch (error: any) {
            // Ignore "table already exists" errors
            if (!error.message.includes('already exists')) {
              console.error(`❌ Error executing statement ${i + 1}:`, error.message)
              throw error
            } else {
              console.log(`  ⚠️ Table already exists, skipping...`)
            }
          }
        }
      }
      console.log('✅ SQLite migration completed successfully!')
    }
    
    // Test database connection
    console.log('🔍 Testing database connection...')
    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query('SELECT COUNT(*) FROM churches')
      client.release()
      console.log(`✅ Database test successful. Found ${result.rows[0].count} churches.`)
    } else {
      const stmt = (connection as any).prepare('SELECT COUNT(*) FROM churches')
      const result = await stmt.get()
      console.log(`✅ Database test successful. Found ${result['COUNT(*)']} churches.`)
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('🎉 Migration completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export default migrateDatabase

import { Router, Request, Response } from 'express'
import { readFileSync } from 'fs'
import { join } from 'path'
import DatabaseConnection from '../database/connection'

const router = Router()

// Migration endpoint - only for development/setup
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting database migration...')
    
    const db = DatabaseConnection.getInstance()
    await db.connect()
    
    // Read PostgreSQL schema
    const schemaPath = join(process.cwd(), 'src/database/schema-postgres.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        await db.run(statement)
      }
    }
    
    console.log('✅ Database migration completed successfully!')
    
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      statementsExecuted: statements.length
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'church-program-pro-api'
  })
})

export default router

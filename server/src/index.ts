import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import DatabaseConnection from './database/connection'
import { errorHandler, notFound } from './middleware/errorHandler'
import authRoutes from './api/auth'
import programRoutes from './api/programs'
import templateRoutes from './api/templates'
import churchRoutes from './api/church'
import { readFileSync } from 'fs'
import { join } from 'path'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '10000', 10)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:8000", "ws://localhost:3000", "ws://localhost:5173"],
    },
  },
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Migration endpoint - direct implementation
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('🔄 Starting database migration...')
    
    const db = DatabaseConnection.getInstance()
    await db.connect()
    
    // Read PostgreSQL schema
    const schemaPath = join(__dirname, 'database/schema-postgres.sql')
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

// Test endpoint
app.get('/api/migrate/test', (req, res) => {
  res.json({ message: 'Migration router is working!' })
})

app.use('/api/auth', authRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/church', churchRoutes)

app.use(notFound)
app.use(errorHandler)

async function startServer() {
  try {
    console.log('🔄 Starting server...')
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔗 Port: ${PORT}`)
    
    const db = DatabaseConnection.getInstance()
    await db.connect()

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, shutting down gracefully')
  const db = DatabaseConnection.getInstance()
  await db.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('📴 SIGINT received, shutting down gracefully')
  const db = DatabaseConnection.getInstance()
  await db.disconnect()
  process.exit(0)
})

startServer()
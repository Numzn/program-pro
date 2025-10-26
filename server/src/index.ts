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
    ? ['https://program-pro.onrender.com', 'https://dashboard.render.com', '*']
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

// Simple migration endpoint - just create essential tables
app.post('/api/migrate', async (req, res) => {
  // Set timeout to prevent hanging
  const timeout = setTimeout(() => {
    res.status(408).json({
      success: false,
      error: 'Migration timeout',
      message: 'Migration took too long to complete'
    })
  }, 30000) // 30 second timeout

  try {
    console.log('🔄 Starting simple database migration...')
    
    const db = DatabaseConnection.getInstance()
    await db.connect()
    
    // Create churches table
    await db.run(`
      CREATE TABLE IF NOT EXISTS churches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        theme_config TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Churches table created')
    
    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        church_id INTEGER REFERENCES churches(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Users table created')
    
    // Create programs table
    await db.run(`
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME,
        location TEXT,
        church_id INTEGER REFERENCES churches(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Programs table created')
    
    // Insert default church if it doesn't exist
    const existingChurch = await db.get('SELECT id FROM churches WHERE slug = $1', ['grace-community-church'])
    if (!existingChurch) {
      await db.run(`
        INSERT INTO churches (name, short_name, slug, description) 
        VALUES ($1, $2, $3, $4)
      `, ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church'])
      console.log('✅ Default church created')
    }
    
    clearTimeout(timeout)
    res.json({
      success: true,
      message: 'Simple migration completed successfully',
      tablesCreated: ['churches', 'users', 'programs']
    })
    
  } catch (error) {
    clearTimeout(timeout)
    console.error('❌ Simple migration failed:', error)
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

// Minimal test endpoint - no database
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  })
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
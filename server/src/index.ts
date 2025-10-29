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
      styleSrc: ["'self'", "'unsafe-inline'"], // Keep for Tailwind/CSS-in-JS
      scriptSrc: ["'self'"], // Removed unsafe-inline for security
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:8000", "http://localhost:5173", "ws://localhost:3000", "ws://localhost:5173", "https://program-pro-1.onrender.com", "https://program-pro.onrender.com"],
    },
  },
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// CORS configuration - must be before routes
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://program-pro-1.onrender.com', 'https://program-pro.onrender.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions))

// Handle OPTIONS preflight requests explicitly (cors middleware should handle this, but being explicit)
app.options('*', cors(corsOptions))

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

// Database initialization endpoint
app.post('/api/migrate', async (req, res) => {
  const timeout = setTimeout(() => {
    res.status(408).json({
      success: false,
      error: 'Migration timeout',
      message: 'Migration took too long to complete'
    })
  }, 30000)

  try {
    console.log('🔄 Starting database migration...')
    
    const db = DatabaseConnection.getInstance()
    await db.connect()
    
    // Test connection
    console.log('🔍 Testing database connection...')
    await db.run('SELECT 1 as test')
    console.log('✅ Database connection test passed')
    
    const isPostgres = process.env.DATABASE_URL?.includes('postgres')
    
    // Create churches table
    console.log('🔍 Creating churches table...')
    if (isPostgres) {
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
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS churches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          short_name TEXT,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          theme_config TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }
    console.log('✅ Churches table created')
    
    // Create users table
    console.log('🔍 Creating users table...')
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'CONGREGATION',
          church_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
        )
      `)
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'CONGREGATION',
          church_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
        )
      `)
    }
    console.log('✅ Users table created')
    
    // Create programs table
    console.log('🔍 Creating programs table...')
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS programs (
          id SERIAL PRIMARY KEY,
          church_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          date DATE NOT NULL,
          theme TEXT,
          is_active BOOLEAN DEFAULT true,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS programs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          church_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          date DATE NOT NULL,
          theme TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
    }
    console.log('✅ Programs table created')
    
    // Create schedule_items table
    console.log('🔍 Creating schedule_items table...')
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS schedule_items (
          id SERIAL PRIMARY KEY,
          program_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_time TIME,
          order_index INTEGER NOT NULL DEFAULT 0,
          type TEXT NOT NULL DEFAULT 'worship',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        )
      `)
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS schedule_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          program_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_time TIME,
          order_index INTEGER NOT NULL DEFAULT 0,
          type TEXT NOT NULL DEFAULT 'worship',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        )
      `)
    }
    console.log('✅ Schedule items table created')
    
    // Create special_guests table
    console.log('🔍 Creating special_guests table...')
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS special_guests (
          id SERIAL PRIMARY KEY,
          program_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          role TEXT,
          bio TEXT,
          photo_url TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        )
      `)
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS special_guests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          program_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          role TEXT,
          bio TEXT,
          photo_url TEXT,
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        )
      `)
    }
    console.log('✅ Special guests table created')
    
    // Create program_templates table
    console.log('🔍 Creating program_templates table...')
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS program_templates (
          id SERIAL PRIMARY KEY,
          church_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          template_data TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
        )
      `)
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS program_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          church_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          template_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
        )
      `)
    }
    console.log('✅ Program templates table created')
    
    // Insert default church
    console.log('🔍 Checking for default church...')
    const existingChurch = await db.get(
      isPostgres 
        ? 'SELECT id FROM churches WHERE slug = $1' 
        : 'SELECT id FROM churches WHERE slug = ?', 
      ['grace-community-church']
    )
    
    if (!existingChurch) {
      console.log('🔍 Creating default church...')
      if (isPostgres) {
        await db.run(`
          INSERT INTO churches (name, short_name, slug, description) 
          VALUES ($1, $2, $3, $4)
        `, ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church'])
      } else {
        await db.run(`
          INSERT INTO churches (name, short_name, slug, description) 
          VALUES (?, ?, ?, ?)
        `, ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church'])
      }
      console.log('✅ Default church created')
    } else {
      console.log('✅ Default church already exists')
    }
    
    // Insert default admin user
    console.log('🔍 Checking for default admin user...')
    const existingUser = await db.get(
      isPostgres 
        ? 'SELECT id FROM users WHERE username = $1' 
        : 'SELECT id FROM users WHERE username = ?', 
      ['admin']
    )
    
    if (!existingUser) {
      console.log('🔍 Creating default admin user...')
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('password', 10)
      
      if (isPostgres) {
        await db.run(`
          INSERT INTO users (username, email, password_hash, role, church_id) 
          VALUES ($1, $2, $3, $4, $5)
        `, ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', 1])
      } else {
        await db.run(`
          INSERT INTO users (username, email, password_hash, role, church_id) 
          VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', 1])
      }
      console.log('✅ Default admin user created')
    } else {
      console.log('✅ Default admin user already exists')
    }
    
    clearTimeout(timeout)
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      tablesCreated: ['churches', 'users', 'programs', 'schedule_items', 'special_guests', 'program_templates'],
      defaultData: {
        church: 'Grace Community Church',
        adminUser: 'admin',
        adminPassword: 'password'
      }
    })
    
  } catch (error) {
    clearTimeout(timeout)
    console.error('❌ Migration failed:', error)
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
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

// Root API endpoint - provide API information
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Church Program Pro API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      programs: '/api/programs',
      templates: '/api/templates',
      church: '/api/church',
      health: '/health'
    },
    documentation: 'Visit /api/auth, /api/programs, etc. for specific endpoints'
  })
})

// Debug middleware - log all API requests (only in development, BEFORE routes)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api', (req, res, next) => {
    console.log('🔍 API Request:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      url: req.url,
      baseUrl: req.baseUrl
    })
    next()
  })
}

// API Routes - order matters!
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
    
    // Run automatic database migration
    console.log('🔄 Running automatic database migration...')
    try {
      const isPostgres = process.env.DATABASE_URL?.includes('postgres')
      
      // Create churches table
      if (isPostgres) {
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
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS churches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            short_name TEXT,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            theme_config TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
      }
      
      // Create users table
      if (isPostgres) {
        await db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'CONGREGATION',
            church_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
          )
        `)
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'CONGREGATION',
            church_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
          )
        `)
      }
      
      // Create programs table
      if (isPostgres) {
        await db.run(`
          CREATE TABLE IF NOT EXISTS programs (
            id SERIAL PRIMARY KEY,
            church_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date DATE NOT NULL,
            theme TEXT,
            is_active BOOLEAN DEFAULT true,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
          )
        `)
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            church_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date DATE NOT NULL,
            theme TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
          )
        `)
      }
      
      // Create schedule_items table
      if (isPostgres) {
        await db.run(`
          CREATE TABLE IF NOT EXISTS schedule_items (
            id SERIAL PRIMARY KEY,
            program_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIME,
            order_index INTEGER NOT NULL DEFAULT 0,
            type TEXT NOT NULL DEFAULT 'worship',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
          )
        `)
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS schedule_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIME,
            order_index INTEGER NOT NULL DEFAULT 0,
            type TEXT NOT NULL DEFAULT 'worship',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
          )
        `)
      }
      
      // Create special_guests table
      if (isPostgres) {
        await db.run(`
          CREATE TABLE IF NOT EXISTS special_guests (
            id SERIAL PRIMARY KEY,
            program_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            role TEXT,
            bio TEXT,
            photo_url TEXT,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
          )
        `)
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS special_guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            role TEXT,
            bio TEXT,
            photo_url TEXT,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
          )
        `)
      }
      
      // Create program_templates table
      if (isPostgres) {
        await db.run(`
          CREATE TABLE IF NOT EXISTS program_templates (
            id SERIAL PRIMARY KEY,
            church_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            template_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
          )
        `)
      } else {
        await db.run(`
          CREATE TABLE IF NOT EXISTS program_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            church_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            template_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
          )
        `)
      }
      
      // Insert default church
      const existingChurch = await db.get(
        isPostgres 
          ? 'SELECT id FROM churches WHERE slug = $1' 
          : 'SELECT id FROM churches WHERE slug = ?', 
        ['grace-community-church']
      )
      
      if (!existingChurch) {
        if (isPostgres) {
          await db.run(`
            INSERT INTO churches (name, short_name, slug, description) 
            VALUES ($1, $2, $3, $4)
          `, ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church'])
        } else {
          await db.run(`
            INSERT INTO churches (name, short_name, slug, description) 
            VALUES (?, ?, ?, ?)
          `, ['Grace Community Church', 'Grace Church', 'grace-community-church', 'A welcoming community church'])
        }
      }
      
      // Insert default admin user
      const existingUser = await db.get(
        isPostgres 
          ? 'SELECT id FROM users WHERE username = $1' 
          : 'SELECT id FROM users WHERE username = ?', 
        ['admin']
      )
      
      if (!existingUser) {
        const bcrypt = require('bcryptjs')
        const hashedPassword = await bcrypt.hash('password', 10)
        
        if (isPostgres) {
          await db.run(`
            INSERT INTO users (username, email, password_hash, role, church_id) 
            VALUES ($1, $2, $3, $4, $5)
          `, ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', 1])
        } else {
          await db.run(`
            INSERT INTO users (username, email, password_hash, role, church_id) 
            VALUES (?, ?, ?, ?, ?)
          `, ['admin', 'admin@gracecommunity.com', hashedPassword, 'ADMIN', 1])
        }
      }
      
      console.log('✅ Database migration completed successfully')
    } catch (error) {
      console.error('❌ Database migration failed:', error)
    }

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
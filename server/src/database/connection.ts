import sqlite3 from 'sqlite3'
import { Pool } from 'pg'
import { promisify } from 'util'

// Create a wrapper class that provides the better-sqlite3 interface for sqlite3
class SQLiteWrapper {
  private db: sqlite3.Database

  constructor(db: sqlite3.Database) {
    this.db = db
  }

  prepare(sql: string) {
    return {
      run: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          this.db.run(sql, params, function(err) {
            if (err) reject(err)
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes })
          })
        })
      },
      get: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          this.db.get(sql, params, (err, row) => {
            if (err) reject(err)
            else resolve(row)
          })
        })
      },
      all: (...params: any[]) => {
        return new Promise((resolve, reject) => {
          this.db.all(sql, params, (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        })
      }
    }
  }
}

class DatabaseConnection {
  private static instance: DatabaseConnection
  private db: sqlite3.Database | Pool | null = null
  private isConnected = false

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    const databaseUrl = process.env.DATABASE_URL || 'sqlite:./dev.db'
    
    if (databaseUrl.includes('postgres')) {
      // PostgreSQL connection
      console.log('🔗 Connecting to PostgreSQL database...')
      console.log('🔗 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@')) // Hide password
      
      this.db = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { 
          rejectUnauthorized: false,
          sslmode: 'require'
        } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
      
      // Test the connection
      try {
        const client = await this.db.connect()
        await client.query('SELECT NOW()')
        client.release()
        console.log('✅ PostgreSQL database connected successfully')
      } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error)
        throw error
      }
    } else {
      // SQLite connection
      const dbPath = databaseUrl.replace('sqlite:', '')
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite connection failed:', err)
          throw err
        }
        console.log('✅ SQLite database connected successfully')
      })
    }
    
    this.isConnected = true
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.db) {
      return
    }

    if (this.db instanceof Pool) {
      await this.db.end()
      console.log('✅ PostgreSQL database disconnected')
    } else {
      return new Promise((resolve, reject) => {
        (this.db as sqlite3.Database).close((err) => {
          if (err) {
            console.error('❌ SQLite disconnection failed:', err)
            reject(err)
          } else {
            console.log('✅ SQLite database disconnected')
            resolve()
          }
        })
      })
    }
    
    this.db = null
    this.isConnected = false
  }

  getConnection(): any {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    
    if (this.db instanceof Pool) {
      return this.db
    } else {
      // Return a wrapper that provides the better-sqlite3 interface
      return new SQLiteWrapper(this.db as sqlite3.Database)
    }
  }

  // Helper methods for common operations
  async run(sql: string, params: any[] = []): Promise<any> {
    const connection = this.getConnection()
    
    if (connection instanceof Pool) {
      const client = await connection.connect()
      try {
        console.log('🔍 Executing SQL:', sql.substring(0, 100) + '...')
        console.log('🔍 With params:', params)
        const result = await client.query(sql, params)
        console.log('✅ SQL executed successfully')
        return result
      } catch (error) {
        console.error('❌ SQL execution failed:', error)
        console.error('❌ SQL:', sql)
        console.error('❌ Params:', params)
        throw error
      } finally {
        client.release()
      }
    } else {
      const run = promisify(connection.run.bind(connection))
      return run(sql, params)
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const connection = this.getConnection()
    
    if (connection instanceof Pool) {
      const client = await connection.connect()
      try {
        const result = await client.query(sql, params)
        return result.rows[0] || null
      } finally {
        client.release()
      }
    } else {
      const get = promisify(connection.get.bind(connection))
      return get(sql, params)
    }
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const connection = this.getConnection()
    
    if (connection instanceof Pool) {
      const client = await connection.connect()
      try {
        const result = await client.query(sql, params)
        return result.rows
      } finally {
        client.release()
      }
    } else {
      const all = promisify(connection.all.bind(connection))
      return all(sql, params)
    }
  }
}

export default DatabaseConnection
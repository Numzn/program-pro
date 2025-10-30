import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import DatabaseConnection from '../database/connection'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  role?: 'CONGREGATION' | 'EDITOR' | 'ADMIN'
  church_id: number
}

export interface AuthResult {
  user: {
    id: number
    username: string
    email: string
    role: string
    church_id: number
  }
  token: string
}

export class AuthService {
  private db = DatabaseConnection.getInstance()

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { username, password } = credentials
      console.log('🔍 Login attempt for username:', username)
      const connection = this.db.getConnection()

      let user
      if (process.env.DATABASE_URL?.includes('postgres')) {
        const client = await (connection as any).connect()
        const result = await client.query(
          'SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = $1 OR email = $1',
          [username]
        )
        client.release()
        user = result.rows[0]
      } else {
        const stmt = (connection as any).prepare(
          'SELECT id, username, email, password_hash, role, church_id FROM users WHERE username = ? OR email = ?'
        )
        user = await stmt.get(username, username)
        console.log('🔍 User found:', user ? 'YES' : 'NO')
        if (user) {
          console.log('🔍 User details:', { id: user.id, username: user.username, role: user.role })
        }
      }

      if (!user) {
        console.log('❌ No user found for username:', username)
        throw new Error('Invalid credentials')
      }

      console.log('🔐 Testing password for user:', user.username)
      console.log('🔐 Password hash length:', user.password_hash ? user.password_hash.length : 'UNDEFINED')
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log('🔐 Password validation result:', isValidPassword ? 'VALID' : 'INVALID')
      if (!isValidPassword) {
        console.log('❌ Password validation failed')
        throw new Error('Invalid credentials')
      }

      const token = this.generateToken(user.id)
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          church_id: user.church_id
        },
        token
      }
    } catch (e) {
      console.error('❌ AuthService error:', (e as any)?.message || e)
      throw e
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    const { username, email, password, role = 'CONGREGATION', church_id } = data
    const connection = this.db.getConnection()

    let existingUser
    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      )
      client.release()
      existingUser = result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      )
      existingUser = await stmt.get(username, email)
    }

    if (existingUser) {
      throw new Error('User already exists')
    }

    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)

    let newUser
    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role, church_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, church_id',
        [username, email, password_hash, role, church_id]
      )
      client.release()
      newUser = result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'INSERT INTO users (username, email, password_hash, role, church_id) VALUES (?, ?, ?, ?, ?)'
      )
      const result = stmt.run(username, email, password_hash, role, church_id)
      
      const selectStmt = (connection as any).prepare(
        'SELECT id, username, email, role, church_id FROM users WHERE id = ?'
      )
      newUser = await selectStmt.get(result.lastInsertRowid)
    }

    const token = this.generateToken(newUser.id)

    return {
      user: newUser,
      token
    }
  }

  private generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT secret not configured')
    }

    return jwt.sign(
      { userId },
      secret,
      { expiresIn: '7d' }
    )
  }
}
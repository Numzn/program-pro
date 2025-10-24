import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import DatabaseConnection from '../database/connection'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    username: string
    email: string
    role: string
    church_id: number
  }
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({ error: 'Access token required' })
      return
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      res.status(500).json({ error: 'JWT secret not configured' })
      return
    }

    const decoded = jwt.verify(token, secret) as any
    const db = DatabaseConnection.getInstance()
    const connection = db.getConnection()

    let user
    if (process.env.DATABASE_URL?.includes('postgres')) {
      const client = await (connection as any).connect()
      const result = await client.query(
        'SELECT id, username, email, role, church_id FROM users WHERE id = $1',
        [decoded.userId]
      )
      client.release()
      user = result.rows[0]
    } else {
      const stmt = (connection as any).prepare(
        'SELECT id, username, email, role, church_id FROM users WHERE id = ?'
      )
      user = await stmt.get(decoded.userId)
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
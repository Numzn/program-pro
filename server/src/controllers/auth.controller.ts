import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AuthService } from '../services/authService'

const authService = new AuthService()

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT secret not configured')
  return secret
}

function signAccessToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '15m' })
}

function signRefreshToken(userId: number): string {
  return jwt.sign({ userId, type: 'refresh' }, getJwtSecret(), { expiresIn: '7d' })
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export const authController = {
  async login(req: Request, res: Response) {
    const { username, password } = req.body
    const result = await authService.login({ username, password })

    const accessToken = signAccessToken(result.user.id)
    const refreshToken = signRefreshToken(result.user.id)

    // Backward compatibility: keep legacy cookie 'token'
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    setRefreshCookie(res, refreshToken)

    res.json({
      success: true,
      data: { user: result.user },
      accessToken,
    })
  },

  async register(req: Request, res: Response) {
    const { username, email, password, role, church_id } = req.body
    const result = await authService.register({ username, email, password, role, church_id })

    const accessToken = signAccessToken(result.user.id)
    const refreshToken = signRefreshToken(result.user.id)
    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      success: true,
      data: { user: result.user },
      accessToken,
    })
  },

  async me(req: any, res: Response) {
    return res.json({ success: true, user: req.user })
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refresh_token
    if (!token) {
      res.status(401).json({ error: 'Missing refresh token' })
      return
    }
    try {
      const payload = jwt.verify(token, getJwtSecret()) as any
      if (payload?.type !== 'refresh') {
        res.status(401).json({ error: 'Invalid token type' })
        return
      }
      const newAccessToken = signAccessToken(payload.userId)
      const newRefreshToken = signRefreshToken(payload.userId)
      setRefreshCookie(res, newRefreshToken)
      res.json({ success: true, accessToken: newAccessToken })
    } catch (e) {
      res.status(401).json({ error: 'Invalid refresh token' })
    }
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie('refresh_token')
    res.clearCookie('token')
    res.json({ success: true, message: 'Logged out successfully' })
  },
}



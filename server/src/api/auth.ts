import { Router, Request, Response } from 'express'
import { AuthService } from '../services/authService'
import { validate, loginSchema, registerSchema } from '../middleware/validate'
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
const authService = new AuthService()

router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body
  console.log('🌐 API Login request for:', username)

  try {
    console.log('🔍 Calling authService.login...')
    const result = await authService.login({ username, password })
    console.log('✅ AuthService.login successful')
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      user: result.user,
      token: result.token
    })
  } catch (error) {
    console.log('❌ AuthService.login failed:', error.message)
    res.status(401).json({
      error: 'Invalid credentials'
    })
  }
}))

router.post('/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role, church_id } = req.body

  try {
    const result = await authService.register({
      username,
      email,
      password,
      role: role || 'CONGREGATION',
      church_id: church_id || 1
    })

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    })
  } catch (error: any) {
    res.status(400).json({
      error: error.message
    })
  }
}))

router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user
  })
}))

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

export default router
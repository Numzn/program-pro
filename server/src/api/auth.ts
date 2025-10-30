import { Router, Request, Response } from 'express'
import { validate, loginSchema, registerSchema } from '../middleware/validate'
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate'
import { asyncHandler } from '../middleware/errorHandler'
import { authController } from '../controllers/auth.controller'

const router = Router()
router.post('/login', validate(loginSchema), asyncHandler(authController.login))

router.post('/register', validate(registerSchema), asyncHandler(authController.register))

router.get('/me', authenticate, asyncHandler(authController.me))

router.post('/logout', asyncHandler(authController.logout))

export default router
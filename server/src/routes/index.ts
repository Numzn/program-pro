import express from 'express'
import authRoutes from '../api/auth'
import programRoutes from '../api/programs'
import templateRoutes from '../api/templates'
import churchRoutes from '../api/church'
import { authController } from '../controllers/auth.controller'
import { validate, loginSchema, registerSchema } from '../middleware/validate'
import { authenticate } from '../middleware/authenticate'

const v1 = express.Router()

// Info endpoint for v1
v1.get('/', (_req, res) => {
  res.json({
    success: true,
    version: 'v1',
    endpoints: {
      auth: '/api/v1/auth',
      programs: '/api/v1/programs',
      templates: '/api/v1/templates',
      church: '/api/v1/church',
    },
  })
})

// Auth v1 using controller
const authV1 = express.Router()
authV1.post('/login', validate(loginSchema), authController.login)
authV1.post('/register', validate(registerSchema), authController.register)
authV1.get('/me', authenticate, authController.me)
authV1.post('/refresh', authController.refresh)
authV1.post('/logout', authController.logout)

v1.use('/auth', authV1)

// Reuse existing routers for other domains
v1.use('/programs', programRoutes)
v1.use('/templates', templateRoutes)
v1.use('/church', churchRoutes)

export default v1



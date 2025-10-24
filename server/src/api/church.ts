import { Router, Request, Response } from 'express'
import { ChurchService } from '../services/churchService'
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/authenticate'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
const churchService = new ChurchService()

// Validation schema for church settings
const churchSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Church name is required'),
    short_name: z.string().optional(),
    description: z.string().optional(),
    theme_config: z.string().optional()
  })
})

// Get church settings
router.get('/settings', 
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const church = await churchService.getChurchById(req.user!.church_id)
    
    if (!church) {
      res.status(404).json({ error: 'Church not found' })
      return
    }

    res.json({
      success: true,
      data: church
    })
  })
)

// Update church settings
router.put('/settings',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, short_name, description, theme_config } = req.body

    // Validate input
    const validation = churchSettingsSchema.safeParse({ body: req.body })
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors
      })
      return
    }

    const updatedChurch = await churchService.updateChurchSettings(
      req.user!.church_id,
      { name, short_name, description, theme_config }
    )

    res.json({
      success: true,
      data: updatedChurch
    })
  })
)

// Initialize default church (for first-time setup)
router.post('/initialize',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const church = await churchService.createDefaultChurch()
      
      res.status(201).json({
        success: true,
        data: church
      })
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Church already exists' })
      } else {
        throw error
      }
    }
  })
)

export default router

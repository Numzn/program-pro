import { Router, Request, Response } from 'express'
import { TemplateService } from '../services/templateService'
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/authenticate'
import { asyncHandler } from '../middleware/errorHandler'
import { z } from 'zod'

const router = Router()
const templateService = new TemplateService()

const templateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    template_data: z.string().min(1, 'Template data is required')
  })
})

const updateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Template name is required').optional(),
    description: z.string().optional(),
    template_data: z.string().min(1, 'Template data is required').optional()
  })
})

router.get('/', 
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const templates = await templateService.getTemplates(req.user!.church_id)
    
    res.json({
      success: true,
      data: templates
    })
  })
)

router.get('/:id',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const templateId = parseInt(id)

    if (isNaN(templateId)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    const template = await templateService.getTemplateById(templateId, req.user!.church_id)
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' })
      return
    }

    res.json({
      success: true,
      data: template
    })
  })
)

router.post('/',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, template_data } = req.body

    // Validate JSON format
    try {
      JSON.parse(template_data)
    } catch (error) {
      res.status(400).json({ error: 'Invalid template data format' })
      return
    }

    const template = await templateService.createTemplate({
      church_id: req.user!.church_id,
      name,
      description,
      template_data
    })

    res.status(201).json({
      success: true,
      data: template
    })
  })
)

router.put('/:id',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const templateId = parseInt(id)
    const { name, description, template_data } = req.body

    if (isNaN(templateId)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    // Validate JSON format if provided
    if (template_data) {
      try {
        JSON.parse(template_data)
      } catch (error) {
        res.status(400).json({ error: 'Invalid template data format' })
        return
      }
    }

    const template = await templateService.updateTemplate(templateId, req.user!.church_id, {
      name,
      description,
      template_data
    })

    if (!template) {
      res.status(404).json({ error: 'Template not found' })
      return
    }

    res.json({
      success: true,
      data: template
    })
  })
)

router.delete('/:id',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const templateId = parseInt(id)

    if (isNaN(templateId)) {
      res.status(400).json({ error: 'Invalid template ID' })
      return
    }

    const deleted = await templateService.deleteTemplate(templateId, req.user!.church_id)

    if (!deleted) {
      res.status(404).json({ error: 'Template not found' })
      return
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    })
  })
)

export default router

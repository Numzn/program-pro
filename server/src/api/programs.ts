import { Router, Request, Response } from 'express'
import { ProgramService } from '../services/programService'
import { validate, programSchema, scheduleItemSchema, specialGuestSchema, bulkImportSchema } from '../middleware/validate'
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/authenticate'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()
const programService = new ProgramService()

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { church_id, is_active } = req.query
  
  const programs = await programService.getPrograms(
    church_id ? parseInt(church_id as string) : undefined,
    is_active !== undefined ? is_active === 'true' : undefined
  )

  res.json({
    success: true,
    data: programs
  })
}))

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const programId = parseInt(id)

  if (isNaN(programId)) {
    res.status(400).json({ error: 'Invalid program ID' })
    return
  }

  const program = await programService.getProgramById(programId)
  
  if (!program) {
    res.status(404).json({ error: 'Program not found' })
    return
  }

  res.json({
    success: true,
    data: program
  })
}))

router.post('/', 
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  validate(programSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, date, theme, is_active } = req.body

    const program = await programService.createProgram({
      church_id: req.user!.church_id,
      title,
      date,
      theme,
      is_active: is_active ?? true,
      created_by: req.user!.id
    })

    res.status(201).json({
      success: true,
      data: program
    })
  })
)

router.put('/:id',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  validate(programSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const programId = parseInt(id)
    const { title, date, theme, is_active } = req.body

    if (isNaN(programId)) {
      res.status(400).json({ error: 'Invalid program ID' })
      return
    }

    const program = await programService.updateProgram(programId, {
      title,
      date,
      theme,
      is_active
    })

    if (!program) {
      res.status(404).json({ error: 'Program not found' })
      return
    }

    res.json({
      success: true,
      data: program
    })
  })
)

router.delete('/:id',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const programId = parseInt(id)

    if (isNaN(programId)) {
      res.status(400).json({ error: 'Invalid program ID' })
      return
    }

    const deleted = await programService.deleteProgram(programId)

    if (!deleted) {
      res.status(404).json({ error: 'Program not found' })
      return
    }

    res.json({
      success: true,
      message: 'Program deleted successfully'
    })
  })
)

router.post('/:id/schedule',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  validate(scheduleItemSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const programId = parseInt(id)
    const { title, description, start_time, type, order_index } = req.body

    if (isNaN(programId)) {
      res.status(400).json({ error: 'Invalid program ID' })
      return
    }

    const scheduleItem = await programService.addScheduleItem(programId, {
      title,
      description,
      start_time,
      type,
      order_index: order_index ?? 0
    })

    res.status(201).json({
      success: true,
      data: scheduleItem
    })
  })
)

router.post('/:id/guests',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  validate(specialGuestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const programId = parseInt(id)
    const { name, role, bio, photo_url, display_order } = req.body

    if (isNaN(programId)) {
      res.status(400).json({ error: 'Invalid program ID' })
      return
    }

    const specialGuest = await programService.addSpecialGuest(programId, {
      name,
      role,
      bio,
      photo_url,
      display_order: display_order ?? 0
    })

    res.status(201).json({
      success: true,
      data: specialGuest
    })
  })
)

router.post('/bulk-import',
  authenticate,
  authorize(['EDITOR', 'ADMIN']),
  validate(bulkImportSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, date, theme, is_active, schedule_items, special_guests } = req.body

    const program = await programService.createProgramWithDetails({
      church_id: req.user!.church_id,
      title,
      date,
      theme,
      is_active: is_active ?? true,
      created_by: req.user!.id,
      schedule_items: schedule_items || [],
      special_guests: special_guests || []
    })

    res.status(201).json({
      success: true,
      data: program
    })
  })
)

export default router
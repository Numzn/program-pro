import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      })
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
  })
})

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CONGREGATION', 'EDITOR', 'ADMIN']).optional()
  })
})

export const programSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    theme: z.string().optional(),
    is_active: z.boolean().optional()
  })
})

export const scheduleItemSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    start_time: z.string().optional().refine(
      (val) => !val || /^\d{2}:\d{2}(:\d{2})?$/.test(val),
      'Time must be in HH:MM or HH:MM:SS format'
    ),
    type: z.enum(['worship', 'sermon', 'announcement', 'special']),
    order_index: z.number().int().min(0).optional()
  })
})

export const specialGuestSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().optional(),
    bio: z.string().optional(),
    photo_url: z.string().url().optional(),
    display_order: z.number().int().min(0).optional()
  })
})

export const bulkImportSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    theme: z.string().optional(),
    is_active: z.boolean().optional(),
    schedule_items: z.array(z.object({
      title: z.string().min(1, 'Schedule item title is required'),
      description: z.string().optional(),
      start_time: z.string().optional().refine(
        (val) => !val || /^\d{2}:\d{2}(:\d{2})?$/.test(val),
        'Time must be in HH:MM or HH:MM:SS format'
      ),
      type: z.enum(['worship', 'sermon', 'announcement', 'special']),
      order_index: z.number().int().min(0).optional()
    })).optional(),
    special_guests: z.array(z.object({
      name: z.string().min(1, 'Guest name is required'),
      role: z.string().optional(),
      bio: z.string().optional(),
      photo_url: z.string().url().optional(),
      display_order: z.number().int().min(0).optional()
    })).optional()
  })
})
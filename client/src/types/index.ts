export interface User {
  id: number
  username: string
  email?: string | null
  role: string
  church_id?: number | null
  created_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface Program {
  id: number
  church_id: number
  title: string
  date?: string | null
  theme?: string | null
  is_active: boolean
  created_by?: number | null
  created_at: string
  updated_at?: string | null
}

export interface ScheduleItem {
  id: number
  program_id: number
  title: string
  description?: string | null
  start_time?: string | null
  duration_minutes?: number | null
  order_index: number
  type: string
  created_at: string
}

export interface SpecialGuest {
  id: number
  program_id: number
  name: string
  role?: string | null
  description?: string | null
  bio?: string | null
  photo_url?: string | null
  display_order: number
  created_at: string
}

export interface Resource {
  id: number
  program_id: number
  title: string
  url: string
  type: string
  description?: string
  created_at: string
}

export interface ProgramWithDetails extends Program {
  schedule_items: ScheduleItem[]
  special_guests: SpecialGuest[]
  resources?: Resource[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Input types for creating schedule items and special guests (without database-generated fields)
export type ScheduleItemInput = Omit<ScheduleItem, 'id' | 'program_id' | 'created_at'>
export type SpecialGuestInput = Omit<SpecialGuest, 'id' | 'program_id' | 'created_at'>
import { create } from 'zustand'
import { Program, ProgramWithDetails } from '../types'
import apiService from '../services/api'

interface ProgramStore {
  programs: Program[]
  activeProgram: ProgramWithDetails | null
  isLoading: boolean
  error: string | null
  
  fetchPrograms: (churchId?: number, isActive?: boolean) => Promise<void>
  fetchProgramById: (id: number) => Promise<void>
  createProgram: (data: any) => Promise<Program>
  updateProgram: (id: number, data: any) => Promise<Program>
  deleteProgram: (id: number) => Promise<void>
  setActiveProgram: (program: ProgramWithDetails | null) => void
  
  // Bulk import
  bulkImportProgram: (data: any) => Promise<ProgramWithDetails>
  
  // Schedule items management
  addScheduleItem: (programId: number, data: any) => Promise<void>
  deleteScheduleItem: (programId: number, itemId: number) => Promise<void>
  reorderScheduleItems: (programId: number, items: any[]) => Promise<void>
  
  // Special guests management
  addSpecialGuest: (programId: number, data: any) => Promise<void>
  deleteSpecialGuest: (programId: number, guestId: number) => Promise<void>
  reorderSpecialGuests: (programId: number, guests: any[]) => Promise<void>
}

export const useProgramStore = create<ProgramStore>((set) => ({
  programs: [],
  activeProgram: null,
  isLoading: false,
  error: null,

  fetchPrograms: async (churchId?: number, isActive?: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const programs = await apiService.getPrograms(churchId, isActive)
      set({ programs, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  fetchProgramById: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      console.log('🔍 Fetching program ID:', id)
      const program = await apiService.getProgramById(id)
      console.log('✅ Program fetched:', program)
      set({ activeProgram: program, isLoading: false })
    } catch (error: any) {
      console.error('❌ Error fetching program:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  createProgram: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newProgram = await apiService.createProgram(data)
      set(state => ({
        programs: [newProgram, ...state.programs],
        isLoading: false
      }))
      return newProgram
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  updateProgram: async (id: number, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await apiService.updateProgram(id, data)
      set(state => ({
        programs: state.programs.map(p => p.id === id ? updated : p),
        isLoading: false
      }))
      return updated
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  deleteProgram: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await apiService.deleteProgram(id)
      set(state => ({
        programs: state.programs.filter(p => p.id !== id),
        isLoading: false
      }))
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  setActiveProgram: (program: ProgramWithDetails | null) => {
    set({ activeProgram: program })
  },

  // Bulk import
  bulkImportProgram: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const program = await apiService.bulkImportProgram(data)
      set(state => ({
        programs: [program, ...state.programs],
        activeProgram: program,
        isLoading: false
      }))
      return program
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Schedule items management
  addScheduleItem: async (programId: number, data: any) => {
    try {
      const newItem = await apiService.addScheduleItem(programId, data)
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              schedule_items: [...state.activeProgram.schedule_items, newItem]
            }
          }
        }
        return state
      })
    } catch (error: any) {
      throw error
    }
  },

  deleteScheduleItem: async (programId: number, itemId: number) => {
    try {
      // Note: We'll need to add a delete endpoint to the API
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              schedule_items: state.activeProgram.schedule_items.filter(item => item.id !== itemId)
            }
          }
        }
        return state
      })
    } catch (error: any) {
      throw error
    }
  },

  reorderScheduleItems: async (programId: number, items: any[]) => {
    try {
      // Update local state immediately for better UX
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              schedule_items: items
            }
          }
        }
        return state
      })
      // Note: We'll need to add a reorder endpoint to the API
    } catch (error: any) {
      throw error
    }
  },

  // Special guests management
  addSpecialGuest: async (programId: number, data: any) => {
    try {
      const newGuest = await apiService.addSpecialGuest(programId, data)
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              special_guests: [...state.activeProgram.special_guests, newGuest]
            }
          }
        }
        return state
      })
    } catch (error: any) {
      throw error
    }
  },

  deleteSpecialGuest: async (programId: number, guestId: number) => {
    try {
      // Note: We'll need to add a delete endpoint to the API
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              special_guests: state.activeProgram.special_guests.filter(guest => guest.id !== guestId)
            }
          }
        }
        return state
      })
    } catch (error: any) {
      throw error
    }
  },

  reorderSpecialGuests: async (programId: number, guests: any[]) => {
    try {
      // Update local state immediately for better UX
      set(state => {
        if (state.activeProgram && state.activeProgram.id === programId) {
          return {
            activeProgram: {
              ...state.activeProgram,
              special_guests: guests
            }
          }
        }
        return state
      })
      // Note: We'll need to add a reorder endpoint to the API
    } catch (error: any) {
      throw error
    }
  }
}))
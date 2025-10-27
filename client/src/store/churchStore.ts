import { create } from 'zustand'
import apiService from '../services/api'

export interface Church {
  id: number
  name: string
  short_name?: string
  slug: string
  description?: string
  theme_config?: string
  created_at: string
}

interface ChurchStore {
  church: Church | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchChurchSettings: () => Promise<void>
  fetchChurchInfo: () => Promise<void> // Public method for homepage
  updateChurchSettings: (settings: {
    name: string
    short_name?: string
    description?: string
    theme_config?: string
  }) => Promise<void>
  clearError: () => void
}

export const useChurchStore = create<ChurchStore>((set) => ({
  church: null,
  isLoading: false,
  error: null,

  fetchChurchSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const church = await apiService.getChurchSettings()
      set({ church, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  fetchChurchInfo: async () => {
    set({ isLoading: true, error: null })
    try {
      const church = await apiService.getChurchInfo()
      set({ church, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  updateChurchSettings: async (settings) => {
    set({ isLoading: true, error: null })
    try {
      const updatedChurch = await apiService.updateChurchSettings(settings)
      set({ church: updatedChurch, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))

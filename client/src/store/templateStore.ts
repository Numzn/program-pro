import { create } from 'zustand'
import apiService from '../services/api'

export interface Template {
  id: number
  name: string
  description?: string
  template_data: string
  created_at: string
}

interface TemplateStore {
  templates: Template[]
  isLoading: boolean
  error: string | null
  
  fetchTemplates: () => Promise<void>
  saveTemplate: (name: string, description: string, data: string) => Promise<void>
  deleteTemplate: (id: number) => Promise<void>
  clearError: () => void
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null })
    try {
      const templates = await apiService.getTemplates()
      set({ templates, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
    }
  },

  saveTemplate: async (name: string, description: string, data: string) => {
    set({ isLoading: true, error: null })
    try {
      const template = await apiService.saveTemplate(name, description, data)
      
      // Add to local state
      set((state) => ({
        templates: [template, ...state.templates],
        isLoading: false
      }))
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  deleteTemplate: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await apiService.deleteTemplate(id)
      
      // Remove from local state
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }))
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))

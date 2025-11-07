import { create } from 'zustand'
import apiService from '../services/api'

export interface Template {
  id: number
  name: string
  content: string
  created_at: string
  church_id?: number | null
}

interface TemplateStore {
  templates: Template[]
  isLoading: boolean
  error: string | null
  
  fetchTemplates: () => Promise<void>
  saveTemplate: (name: string, content: string) => Promise<void>
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

  saveTemplate: async (name: string, content: string) => {
    set({ isLoading: true, error: null })
    try {
      const template = await apiService.saveTemplate(name, content)
      
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

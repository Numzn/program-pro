import { create } from 'zustand'
import { User } from '../types'
import apiService from '../services/api'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const result = await apiService.login(username, password)
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await apiService.logout()
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({
          user,
          token,
          isAuthenticated: true
        })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading })
}))
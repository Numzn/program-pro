import { create } from 'zustand'
import { User } from '../types'
import apiService from '../services/api'
import { getTimeUntilRefresh } from '../utils/jwt'
import axios from 'axios'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshTimerId: NodeJS.Timeout | null
  
  // Public methods
  getToken: () => string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  validateAuth: () => Promise<boolean>
  refreshToken: () => Promise<void>
  setLoading: (loading: boolean) => void
  
  // Internal methods
  setupRefreshTimer: () => void
  clearRefreshTimer: () => void
  syncToLocalStorage: (token: string | null, user: User | null) => void
  loadFromLocalStorage: () => { token: string | null; user: User | null }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  refreshTimerId: null,

  getToken: () => get().token,

  syncToLocalStorage: (token: string | null, user: User | null) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },

  loadFromLocalStorage: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    let user: User | null = null
    if (userStr) {
      try {
        user = JSON.parse(userStr)
      } catch {
        localStorage.removeItem('user')
      }
    }
    
    return { token, user }
  },

  setupRefreshTimer: () => {
    const { token, clearRefreshTimer } = get()
    
    if (!token) {
      return
    }
    
    // Clear any existing timer
    clearRefreshTimer()
    
    const timeUntilRefresh = getTimeUntilRefresh(token, 2) // 2 minutes before expiry
    
    if (!timeUntilRefresh || timeUntilRefresh <= 0) {
      // Token already expired or expiring soon, refresh immediately
      get().refreshToken().catch(() => {
        // If refresh fails, will be handled by error handler
      })
      return
    }
    
    console.log(`🕐 Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)
    
    const timerId = setTimeout(() => {
      const { refreshToken } = get()
      refreshToken().catch((error) => {
        console.error('❌ Background token refresh failed:', error)
        // Don't clear state here, let 401 interceptor handle it
      })
    }, timeUntilRefresh)
    
    set({ refreshTimerId: timerId })
  },

  clearRefreshTimer: () => {
    const { refreshTimerId } = get()
    if (refreshTimerId) {
      clearTimeout(refreshTimerId)
      set({ refreshTimerId: null })
    }
  },

  validateAuth: async () => {
    const { token, loadFromLocalStorage } = get()
    
    // First, try to load from localStorage if store is empty
    if (!token) {
      const { token: storedToken, user: storedUser } = loadFromLocalStorage()
      if (!storedToken) {
        // No token in localStorage, user is not authenticated
        return false
      }
      set({ token: storedToken, user: storedUser })
    }
    
    const currentToken = get().token
    if (!currentToken) {
      return false
    }
    
    try {
      // Get the API base URL (reuse logic from ApiService)
      const isProduction = typeof window !== 'undefined' && window.location.hostname === 'program-pro-1.onrender.com'
      const apiUrl = isProduction 
        ? 'https://backend-5gvy.onrender.com/api/v1'
        : (import.meta as any).env?.VITE_API_URL || '/api'
      
      const response = await axios.get(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        withCredentials: true,
      })
      
      if (response.data) {
        const user = response.data as User
        set({
          user,
          token: currentToken,
          isAuthenticated: true,
        })
        get().syncToLocalStorage(currentToken, user)
        get().setupRefreshTimer()
        return true
      }
      
      return false
    } catch (error: any) {
      // If 401, token is invalid/expired - clear it silently
      if (error.response?.status === 401) {
        console.log('🔐 Token expired or invalid, clearing auth state')
      } else {
        console.error('❌ Token validation failed:', error)
      }
      
      // Clear invalid token
      get().clearRefreshTimer()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
      get().syncToLocalStorage(null, null)
      return false
    }
  },

  refreshToken: async () => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname === 'program-pro-1.onrender.com'
    const apiUrl = isProduction 
      ? 'https://backend-5gvy.onrender.com/api/v1'
      : (import.meta as any).env?.VITE_API_URL || '/api'
    
    try {
      const response = await axios.post(
        `${apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      
      if (response.data?.success && response.data?.accessToken) {
        const newToken = response.data.accessToken
        const { user } = get()
        
        set({
          token: newToken,
          isAuthenticated: true,
        })
        
        get().syncToLocalStorage(newToken, user)
        get().setupRefreshTimer() // Schedule next refresh
        
        console.log('✅ Token refreshed successfully')
        return
      }
      
      throw new Error('Invalid refresh response')
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      // Clear state on refresh failure
      get().clearRefreshTimer()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
      get().syncToLocalStorage(null, null)
      throw error
    }
  },

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
      get().syncToLocalStorage(result.token, result.user)
      get().setupRefreshTimer() // Setup refresh timer after login
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    get().clearRefreshTimer()
    
    try {
      await apiService.logout()
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
      get().syncToLocalStorage(null, null)
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading })
}))
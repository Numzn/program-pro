import axios, { AxiosInstance } from 'axios'
import { ApiResponse, User, Program, ProgramWithDetails } from '../types'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    // Runtime detection: Check if we're on Render production
    const isProduction = typeof window !== 'undefined' && window.location.hostname === 'program-pro-1.onrender.com'
    
    // CRITICAL: Override env var if we're on production to fix old cached builds
    let apiUrl: string
    if (isProduction) {
      // Force correct URL for production (v1)
      apiUrl = 'https://backend-5gvy.onrender.com/api/v1'
      console.log('🚨 PRODUCTION: Forcing correct API URL, ignoring env var')
    } else {
      // For local/dev, use env var or fallback to relative path (Vite proxy)
      apiUrl = (import.meta as any).env?.VITE_API_URL || '/api'
    }
    
    console.log('🌐 API Service initialized with URL:', apiUrl)
    console.log('🔧 Environment VITE_API_URL:', (import.meta as any).env?.VITE_API_URL)
    console.log('🌍 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side')
    console.log('🎯 Using:', isProduction ? 'Production URL (FORCED)' : 'Env var or default')
    
    this.api = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.api.interceptors.request.use(
      (config) => {
        // Log every request for debugging
        console.log('📡 API Request Interceptor:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          hasData: !!config.data
        })
        
        // Read token from AuthStore (single source of truth)
        const token = useAuthStore.getState().getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Ensure baseURL is set correctly
        if (!config.baseURL) {
          console.warn('⚠️ No baseURL set, using default:', this.api.defaults.baseURL)
          config.baseURL = this.api.defaults.baseURL
        }
        
        return config
      },
      (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        // Enhanced error logging for debugging
        if (error.response) {
          console.error('❌ API Error Response:', {
            status: error.response.status,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config?.baseURL + error.config?.url,
            data: error.response.data,
            message: error.message
          })
          
          // For 422 errors, log detailed validation errors
          if (error.response.status === 422 && error.response.data) {
            console.error('🚨 Validation Errors:', JSON.stringify(error.response.data, null, 2))
            if (error.response.data.errors) {
              error.response.data.errors.forEach((err: any) => {
                console.error(`  - ${err.loc?.join('.')}: ${err.msg}`)
              })
            }
          }
        } else if (error.request) {
          console.error('❌ API Request Error (no response):', {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config?.baseURL + error.config?.url,
            message: error.message
          })
        }
        
        // Handle 401 errors with token refresh
        // BUT: Don't try to refresh on auth endpoints (login, register, refresh itself)
        const requestUrl = originalRequest?.url || ''
        const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                              requestUrl.includes('/auth/register') ||
                              requestUrl.includes('/auth/refresh') ||
                              requestUrl.includes('/auth/logout')
        
        // Debug log to verify URL matching
        if (error.response?.status === 401) {
          console.log('🔐 Authentication failed:', {
            url: error.config?.url,
            response: error.response.data
          })
          
          // For auth endpoints (login, register), show notification and clear tokens
          if (isAuthEndpoint) {
            // Clear invalid tokens (using both old and new key names for compatibility)
            localStorage.removeItem('authToken')
            localStorage.removeItem('userData')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            
            // Show user-friendly message
            toast.error('Invalid email or password. Please try again.')
          }
        }
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true
          
          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => {
              const token = useAuthStore.getState().getToken()
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.api.request(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }
          
          this.isRefreshing = true
          
          try {
            // Attempt to refresh token using AuthStore
            await useAuthStore.getState().refreshToken()
            
            // Process queued requests
            this.processQueue(null)
            
            // Retry original request with new token
            const token = useAuthStore.getState().getToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.api.request(originalRequest)
          } catch (refreshError) {
            // Refresh failed, clear state and redirect
            this.processQueue(refreshError)
            await useAuthStore.getState().logout()
            
            // Clear tokens from localStorage (using both old and new key names for compatibility)
            localStorage.removeItem('authToken')
            localStorage.removeItem('userData')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            
            // Show notification
            toast.error('Session expired. Please log in again.')
            
            // Only redirect if not already on login page
            if (window.location.pathname !== '/admin/login') {
              window.location.href = '/admin/login'
            }
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve()
      }
    })
    this.failedQueue = []
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    console.log('🔐 Attempting login to:', this.api.defaults.baseURL + '/auth/login')
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password
      })
      console.log('✅ Login response received:', response.status)
      
      // Handle v1 API response shape: { success: true, data: { user }, accessToken }
      if (response.data?.success && response.data?.data?.user && response.data?.accessToken) {
        return { 
          user: response.data.data.user, 
          token: response.data.accessToken 
        }
      }
      
      // Legacy shape fallback (shouldn't happen with current backend)
      if (response.data?.success && response.data?.user && response.data?.token) {
        return { 
          user: response.data.user, 
          token: response.data.token 
        }
      }
      
      throw new Error(response.data.error || 'Login failed')
    } catch (error: any) {
      // Extract error message from backend response
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail)
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      // Re-throw original error
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } catch (error: any) {
      // Log error for debugging
      console.error('Logout API error:', error)
      // Re-throw to let caller handle it
      // AuthStore will still clear state in finally block
      throw error
    }
  }

  async getPrograms(churchId?: number, isActive?: boolean): Promise<Program[]> {
    const params = new URLSearchParams()
    if (churchId) params.append('church_id', churchId.toString())
    if (isActive !== undefined) params.append('is_active', isActive.toString())

    const response = await this.api.get<ApiResponse<Program[]>>(`/programs?${params.toString()}`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to fetch programs')
  }

  async getProgramById(id: number): Promise<ProgramWithDetails> {
    console.log('🌐 API: Fetching program ID:', id)
    const response = await this.api.get(`/programs/${id}`)
    console.log('🌐 API Response:', response.data)
    
    if (response.data.success && response.data.data) {
      console.log('✅ API: Program data found')
      return response.data.data
    }
    console.error('❌ API: No program data in response')
    throw new Error(response.data.error || 'Failed to fetch program')
  }

  async createProgram(data: any): Promise<Program> {
    try {
      const response = await this.api.post<ApiResponse<Program>>('/programs', data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Failed to create program')
    } catch (error: any) {
      // Extract detailed validation errors from 422 responses
      if (error.response?.status === 422 && error.response?.data) {
        const validationErrors = this.extractValidationErrors(error.response.data)
        if (validationErrors) {
          throw new Error(validationErrors)
        }
      }
      // Re-throw with better error message
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to create program'
      throw new Error(errorMessage)
    }
  }

  async updateProgram(id: number, data: any): Promise<Program> {
    try {
      const response = await this.api.put<ApiResponse<Program>>(`/programs/${id}`, data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Failed to update program')
    } catch (error: any) {
      // Extract detailed validation errors from 422 responses
      if (error.response?.status === 422 && error.response?.data) {
        const validationErrors = this.extractValidationErrors(error.response.data)
        if (validationErrors) {
          throw new Error(validationErrors)
        }
      }
      // Re-throw with better error message
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to update program'
      throw new Error(errorMessage)
    }
  }

  private extractValidationErrors(errorData: any): string | null {
    // Handle FastAPI validation error format
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const errors = errorData.detail.map((err: any) => {
        const field = err.loc?.join('.') || 'field'
        const message = err.msg || 'Invalid value'
        return `${field}: ${message}`
      })
      return errors.join(', ')
    }
    
    // Handle custom error format
    if (errorData.error) {
      return errorData.error
    }
    
    if (errorData.detail && typeof errorData.detail === 'string') {
      return errorData.detail
    }
    
    return null
  }

  async deleteProgram(id: number): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/programs/${id}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete program')
    }
  }

  async addScheduleItem(programId: number, data: any): Promise<any> {
    console.log('📤 Adding schedule item:', { programId, data })
    try {
      const response = await this.api.post<ApiResponse>(`/programs/${programId}/schedule`, data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Failed to add schedule item')
    } catch (error: any) {
      // Log full error details for debugging
      if (error.response?.data) {
        console.error('🚨 Schedule item validation error:', {
          status: error.response.status,
          error: error.response.data.error,
          message: error.response.data.message,
          errors: error.response.data.errors,
          fullResponse: error.response.data
        })
      }
      throw error
    }
  }

  async updateScheduleItem(programId: number, itemId: number, data: any): Promise<any> {
    const response = await this.api.put<ApiResponse>(`/programs/${programId}/schedule/${itemId}`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to update schedule item')
  }

  async deleteScheduleItem(programId: number, itemId: number): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/programs/${programId}/schedule/${itemId}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete schedule item')
    }
  }

  async reorderScheduleItems(programId: number, items: Array<{id: number, order_index: number}>): Promise<any[]> {
    const response = await this.api.put<ApiResponse<any[]>>(`/programs/${programId}/schedule/reorder`, { items })
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to reorder schedule items')
  }

  async addSpecialGuest(programId: number, data: any): Promise<any> {
    const response = await this.api.post<ApiResponse>(`/programs/${programId}/guests`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to add special guest')
  }

  async updateSpecialGuest(programId: number, guestId: number, data: any): Promise<any> {
    const response = await this.api.put<ApiResponse>(`/programs/${programId}/guests/${guestId}`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to update special guest')
  }

  async deleteSpecialGuest(programId: number, guestId: number): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/programs/${programId}/guests/${guestId}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete special guest')
    }
  }

  async reorderSpecialGuests(programId: number, guests: Array<{id: number, display_order: number}>): Promise<any[]> {
    const response = await this.api.put<ApiResponse<any[]>>(`/programs/${programId}/guests/reorder`, { guests })
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to reorder special guests')
  }

  // Bulk import methods
  async bulkImportProgram(data: any): Promise<ProgramWithDetails> {
    console.log('📦 bulkImportProgram called with data:', {
      title: data.title,
      hasScheduleItems: data.schedule_items?.length || 0,
      hasGuests: data.special_guests?.length || 0
    })
    console.log('🌐 API baseURL:', this.api.defaults.baseURL)
    console.log('🔗 Full endpoint:', `${this.api.defaults.baseURL}/programs/bulk-import`)
    
    try {
      const response = await this.api.post<ApiResponse<ProgramWithDetails>>('/programs/bulk-import', data)
      
      console.log('✅ bulkImportProgram response:', response.data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Failed to bulk import program')
    } catch (error: any) {
      console.error('❌ bulkImportProgram error:', {
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          baseURL: error.config.baseURL,
          method: error.config.method,
          fullURL: error.config.baseURL + error.config.url
        } : 'No config',
        response: error.response?.data
      })
      throw error
    }
  }

  async bulkUpdateProgram(programId: number, data: any): Promise<ProgramWithDetails> {
    console.log('📦 bulkUpdateProgram called with:', {
      programId,
      title: data.title,
      hasScheduleItems: data.schedule_items?.length || 0,
      hasGuests: data.special_guests?.length || 0
    })
    console.log('🌐 API baseURL:', this.api.defaults.baseURL)
    console.log('🔗 Full endpoint:', `${this.api.defaults.baseURL}/programs/${programId}/bulk-update`)
    
    try {
      const response = await this.api.put<ApiResponse<ProgramWithDetails>>(
        `/programs/${programId}/bulk-update`,
        data
      )
      
      console.log('✅ bulkUpdateProgram response:', response.data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Failed to bulk update program')
    } catch (error: any) {
      console.error('❌ bulkUpdateProgram error:', {
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          baseURL: error.config.baseURL,
          method: error.config.method,
          fullURL: error.config.baseURL + error.config.url
        } : 'No config',
        response: error.response?.data
      })
      throw error
    }
  }

  // Template methods
  async getTemplates(): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>('/templates')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to fetch templates')
  }

  async getTemplateById(id: number): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>(`/templates/${id}`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to fetch template')
  }

  async saveTemplate(name: string, description: string, templateData: string): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/templates', {
      name,
      description,
      template_data: templateData
    })
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to save template')
  }

  async updateTemplate(id: number, data: { name?: string; description?: string; template_data?: string }): Promise<any> {
    const response = await this.api.put<ApiResponse<any>>(`/templates/${id}`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to update template')
  }

  async deleteTemplate(id: number): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/templates/${id}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete template')
    }
  }

  // Church settings methods
  async getChurchSettings(): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>('/church/settings')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to fetch church settings')
  }

  // Public church info (no auth required)
  async getChurchInfo(): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>('/church/info')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to fetch church information')
  }

  async updateChurchSettings(settings: {
    name: string
    short_name?: string
    description?: string
    theme_config?: string
  }): Promise<any> {
    const response = await this.api.put<ApiResponse<any>>('/church/settings', settings)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to update church settings')
  }
}

export default new ApiService()
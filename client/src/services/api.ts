import axios, { AxiosInstance } from 'axios'
import { ApiResponse, User, Program, ProgramWithDetails } from '../types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    // CRITICAL FIX: Use relative URL - Vite proxy (dev) or Render (prod) will handle routing
    // This ensures local dev uses proxy and production uses VITE_API_URL from render.yaml
    // FORCE REBUILD: 2025-10-29 - Frontend still using old URL
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api'
    console.log('🌐 API Service initialized with URL:', apiUrl)
    console.log('🔧 Environment VITE_API_URL:', (import.meta as any).env?.VITE_API_URL)
    console.log('🚨 FORCE REBUILD: This should show https://program-pro.onrender.com/api')
    
    this.api = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/admin/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/login', {
      username,
      password
    })
    
    if (response.data.success && response.data.user && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return { user: response.data.user, token: response.data.token }
    }
    throw new Error(response.data.error || 'Login failed')
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
    const response = await this.api.post<ApiResponse<Program>>('/programs', data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to create program')
  }

  async updateProgram(id: number, data: any): Promise<Program> {
    const response = await this.api.put<ApiResponse<Program>>(`/programs/${id}`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to update program')
  }

  async deleteProgram(id: number): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/programs/${id}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete program')
    }
  }

  async addScheduleItem(programId: number, data: any): Promise<any> {
    const response = await this.api.post<ApiResponse>(`/programs/${programId}/schedule`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to add schedule item')
  }

  async addSpecialGuest(programId: number, data: any): Promise<any> {
    const response = await this.api.post<ApiResponse>(`/programs/${programId}/guests`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to add special guest')
  }

  // Bulk import methods
  async bulkImportProgram(data: any): Promise<ProgramWithDetails> {
    const response = await this.api.post<ApiResponse<ProgramWithDetails>>('/programs/bulk-import', data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to bulk import program')
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
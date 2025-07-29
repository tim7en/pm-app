// HTTP client with automatic authentication header injection

export interface ApiError extends Error {
  status: number
  statusText: string
}

class HttpClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        const error = new Error(errorData.error || `HTTP Error: ${response.status}`) as ApiError
        error.status = response.status
        error.statusText = response.statusText
        throw error
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error && (error as ApiError).status === 401) {
        // Token is invalid, remove it and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          window.location.href = '/auth'
        }
      }
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// Export a singleton instance
export const apiClient = new HttpClient()

// Convenience functions for common API calls
export const api = {
  // Projects
  projects: {
    list: (params?: { workspaceId?: string; status?: string; search?: string }) => 
      apiClient.get<any[]>(`/projects${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    create: (data: { name: string; description?: string; color?: string; workspaceId?: string }) =>
      apiClient.post<any>('/projects', data),
    get: (id: string) => apiClient.get<any>(`/projects/${id}`),
    update: (id: string, data: any) => apiClient.put<any>(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete<any>(`/projects/${id}`),
  },

  // Tasks
  tasks: {
    list: (params?: { projectId?: string; assigneeId?: string; status?: string; priority?: string; search?: string }) =>
      apiClient.get<any[]>(`/tasks${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    create: (data: any) => apiClient.post<any>('/tasks', data),
    get: (id: string) => apiClient.get<any>(`/tasks/${id}`),
    update: (id: string, data: any) => apiClient.put<any>(`/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete<any>(`/tasks/${id}`),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<any>('/auth/login', { email, password }),
    register: (name: string, email: string, password: string) =>
      apiClient.post<any>('/auth/register', { name, email, password }),
    logout: () => apiClient.post<any>('/auth/logout'),
    me: () => apiClient.get<any>('/auth/me'),
  },
}

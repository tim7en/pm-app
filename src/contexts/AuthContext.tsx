"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
}

interface Workspace {
  id: string
  name: string
  description?: string
  role: string
  memberCount: number
  projectCount: number
}

interface AuthContextType {
  user: User | null
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  currentWorkspace: Workspace | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setCurrentWorkspace: (workspaceId: string) => void
  refreshWorkspaces: () => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace>
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Function to add auth token to requests
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth-token')
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    }
  }

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include' // Include cookies
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setWorkspaces(data.workspaces)
        setCurrentWorkspaceId(data.currentWorkspaceId || data.workspaces[0]?.id || null)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth-token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('auth-token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    localStorage.setItem('auth-token', data.token)
    setUser(data.user)
    setWorkspaces(data.workspaces)
    setCurrentWorkspaceId(data.workspaces[0]?.id || null)
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    localStorage.setItem('auth-token', data.token)
    setUser(data.user)
    setWorkspaces(data.workspaces)
    setCurrentWorkspaceId(data.workspaces[0]?.id || null)
  }

  const logout = async () => {
    try {
      // Call the logout API to clear HTTP-only cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include' // Include cookies
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    // Clear localStorage token
    localStorage.removeItem('auth-token')
    
    // Clear state
    setUser(null)
    setWorkspaces([])
    setCurrentWorkspaceId(null)
    
    // Redirect to auth page
    router.push('/auth')
  }

  const setCurrentWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId)
  }

  const refreshWorkspaces = async () => {
    try {
      console.log('Refreshing workspaces...')
      const response = await fetch('/api/workspaces', {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Workspaces refreshed:', data.length, 'workspaces found')
        setWorkspaces(data)
        
        // If current workspace is not in the new list, reset it
        if (currentWorkspaceId && !data.some((ws: Workspace) => ws.id === currentWorkspaceId)) {
          console.log('Current workspace no longer available, clearing selection')
          setCurrentWorkspaceId(null)
        }
        
        return data
      } else {
        console.error('Failed to refresh workspaces:', response.status, response.statusText)
        throw new Error('Failed to refresh workspaces')
      }
    } catch (error) {
      console.error('Error refreshing workspaces:', error)
      throw error
    }
  }

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create workspace')
    }

    const newWorkspace = await response.json()
    setWorkspaces(prev => [...prev, newWorkspace])
    
    // If this is the first workspace, make it current
    if (workspaces.length === 0) {
      setCurrentWorkspaceId(newWorkspace.id)
    }
    
    return newWorkspace
  }

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null

  const value: AuthContextType = {
    user,
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspace,
    getAuthHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Higher-order component to protect routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth')
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

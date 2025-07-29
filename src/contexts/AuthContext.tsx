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
  role: string
}

interface AuthContextType {
  user: User | null
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setCurrentWorkspace: (workspaceId: string) => void
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

  const value: AuthContextType = {
    user,
    workspaces,
    currentWorkspaceId,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    setCurrentWorkspace,
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

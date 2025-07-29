import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

export function useAPI() {
  const { getAuthHeaders, isAuthenticated } = useAuth()

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }

    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      // If we get a 401, the user needs to re-authenticate
      if (response.status === 401) {
        throw new Error('Authentication required')
      }

      return response
    } catch (error) {
      console.error('API call failed:', error)
      throw error
    }
  }, [getAuthHeaders, isAuthenticated])

  return { apiCall }
}

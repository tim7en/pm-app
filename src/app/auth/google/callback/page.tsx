"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)
  const hasProcessedRef = useRef(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register } = useAuth()
  
  useEffect(() => {
    // Prevent duplicate processing using ref (works better with React Strict Mode)
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true
    
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      if (error) {
        setError(`Google OAuth error: ${error}`)
        setStatus('error')
        return
      }
      
      if (!code) {
        setError('No authorization code received from Google')
        setStatus('error')
        return
      }

      console.log('Processing OAuth callback with code:', code.substring(0, 20) + '...')

      // Clear the URL parameters immediately to prevent reuse
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)

      try {
        // Exchange code for user data with our API
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for HTTP-only auth token
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed')
        }

        // Store the JWT token in localStorage
        if (data.token) {
          localStorage.setItem('auth-token', data.token)
        }

        setIsNewUser(data.isNewUser || false)
        setStatus('success')

        // Redirect to main app after short delay
        setTimeout(() => {
          window.location.href = '/' // Use href instead of router to ensure clean navigation
        }, 2000)

      } catch (err: any) {
        console.error('Google OAuth callback error:', err)
        setError(err.message || 'Authentication failed')
        setStatus('error')
      }
    }
    
    handleCallback()
  }, [])
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500 mb-4" />
              <CardTitle>Signing you in...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Please wait while we complete your Google sign-in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <CardTitle>
                {isNewUser ? 'Welcome to Project Manager!' : 'Welcome back!'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {isNewUser 
                    ? 'Your account has been created successfully with Google.'
                    : 'You have been signed in successfully.'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle>Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-center text-gray-600">
                Something went wrong during the Google sign-in process.
              </p>
              
              <div className="flex space-x-2">
                <Link href="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Try Again
                  </Button>
                </Link>
                <Link href="/auth" className="flex-1">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

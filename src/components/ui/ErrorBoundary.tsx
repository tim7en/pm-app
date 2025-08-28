"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { log } from '@/lib/logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
}

interface ErrorFallbackProps {
  error: Error
  errorInfo?: React.ErrorInfo
  resetError: () => void
  errorId?: string
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId 
}) => {
  const handleReportBug = () => {
    // Navigate to bug report page with pre-filled information
    const bugData = {
      title: `UI Error: ${error.name}`,
      description: `Error: ${error.message}\n\nError ID: ${errorId}\n\nStack: ${error.stack}`,
      category: 'UI',
      priority: 'HIGH'
    }
    
    const params = new URLSearchParams({
      prefill: JSON.stringify(bugData)
    })
    
    window.open(`/bug-reports/new?${params}`, '_blank')
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Our team has been notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">Error Details (Development):</p>
              <p className="text-sm text-red-700 mt-1 font-mono">{error.message}</p>
              {errorId && (
                <p className="text-xs text-red-600 mt-1">Error ID: {errorId}</p>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={resetError}
              className="flex items-center gap-2 flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2 flex-1"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
          
          <Button 
            variant="ghost"
            onClick={handleReportBug}
            className="w-full flex items-center gap-2 text-sm"
          >
            <Bug className="w-4 h-4" />
            Report this issue
          </Button>
          
          {errorId && (
            <p className="text-xs text-muted-foreground text-center">
              Reference ID: {errorId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId } = this.state
    
    // Log error with structured logging
    log.error('React Error Boundary caught an error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Store error info in state
    this.setState({ errorInfo })

    // Report to external error tracking service
    if (typeof window !== 'undefined') {
      // TODO: Integrate with Sentry or other error tracking
      // Sentry.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack
      //     }
      //   },
      //   tags: {
      //     errorBoundary: true,
      //     errorId
      //   }
      // })
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    log.error('useErrorHandler caught an error', error, {
      errorId,
      componentStack: errorInfo?.componentStack,
      hookError: true,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // TODO: Report to external error tracking
    
    return errorId
  }, [])
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => {
    return (
      <GlobalErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </GlobalErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Async error boundary for handling Promise rejections
export class AsyncErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }

    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))

    const errorId = `async_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    log.error('Unhandled Promise rejection', error, {
      errorId,
      asyncError: true,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })

    // Prevent the default browser behavior
    event.preventDefault()

    // Update state to show error UI
    this.setState({
      hasError: true,
      error,
      errorId
    })
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `boundary_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId } = this.state
    
    log.error('Async Error Boundary caught an error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      asyncErrorBoundary: true
    })
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorId: undefined
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary
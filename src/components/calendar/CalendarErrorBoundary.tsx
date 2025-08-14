"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { log } from '@/lib/logger'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class CalendarErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `calendar_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId } = this.state
    
    // Use structured logging instead of console.error
    log.error('Calendar Error Boundary caught an error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      calendarError: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen bg-background">
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Calendar Error</CardTitle>
                <CardDescription>
                  Something went wrong while loading the calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {this.state.error && process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">Error Details:</p>
                    <p className="text-sm text-red-700 mt-1">{this.state.error.message}</p>
                    {this.state.errorId && (
                      <p className="text-xs text-red-600 mt-1">Error ID: {this.state.errorId}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-center space-x-2">
                  <Button 
                    onClick={() => this.setState({ hasError: false, error: undefined, errorId: undefined })}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>
                {this.state.errorId && (
                  <p className="text-xs text-muted-foreground text-center">
                    Reference ID: {this.state.errorId}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface MessagesErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface MessagesErrorBoundaryProps {
  children: React.ReactNode
}

export class MessagesErrorBoundary extends React.Component<MessagesErrorBoundaryProps, MessagesErrorBoundaryState> {
  constructor(props: MessagesErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): MessagesErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Messages Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen bg-background">
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                  <AlertTriangle className="h-12 w-12" />
                </div>
                <CardTitle>Something went wrong</CardTitle>
                <CardDescription>
                  The messaging system encountered an error and needs to be refreshed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="font-medium text-red-800 mb-1">Error Details:</p>
                    <p className="text-red-700">{this.state.error.message}</p>
                  </div>
                )}
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

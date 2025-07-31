'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the critical error
    console.error('Critical application error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto text-center px-4">
            <div className="mb-8">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Critical Error
              </h1>
              <p className="text-muted-foreground mb-6">
                A critical error occurred that prevented the application from loading properly.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={reset}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Application
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
              <p>
                This is a critical system error. Please contact support immediately.
              </p>
              {error.digest && (
                <p className="mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function ServerError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto text-center px-4">
        <div className="mb-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-foreground mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Server Error
          </h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong on our servers. Please try again later.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

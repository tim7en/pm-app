'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
        padding: '0 1rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            color: '#ef4444'
          }}>⚠️</div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: '0.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            margin: '0 0 1.5rem 0'
          }}>
            We encountered an unexpected error. This has been logged and we'll look into it.
          </p>
          
          {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'left',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontWeight: '600',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                margin: '0 0 0.5rem 0'
              }}>Error Details:</h3>
              <pre style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                whiteSpace: 'pre-wrap',
                margin: '0'
              }}>
                {error.message}
              </pre>
              {error.digest && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.5rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={reset}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '0.75rem'
            }}
          >
            🔄 Try again
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

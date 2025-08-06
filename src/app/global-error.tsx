'use client'

import { useEffect } from 'react'

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
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
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
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1rem',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>⚠</div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#000000',
                marginBottom: '0.5rem'
              }}>
                Critical Error
              </h1>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                A critical error occurred that prevented the application from loading properly.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button 
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginBottom: '0.75rem'
                }}
              >
                🔄 Restart Application
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

            <div style={{
              marginTop: '2rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <p>
                This is a critical system error. Please contact support immediately.
              </p>
              {error.digest && (
                <p style={{ marginTop: '0.5rem' }}>Error ID: {error.digest}</p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function NotFound() {
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
            marginBottom: '1rem'
          }}>📄</div>
          <h1 style={{
            fontSize: '3.75rem',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: '0.5rem',
            margin: '0 0 0.5rem 0'
          }}>404</h1>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '0.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            Page Not Found
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            margin: '0 0 1.5rem 0'
          }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}
          >
            🏠 Go Home
          </Link>
          
          <a 
            href="/workspaces"
            style={{
              display: 'inline-block',
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: '#374151',
              textDecoration: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              textAlign: 'center'
            }}
          >
            ← View Workspaces
          </a>
        </div>

        <div style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0' }}>
            Looking for something specific? Try navigating from the home page.
          </p>
        </div>
      </div>
    </div>
  )
}

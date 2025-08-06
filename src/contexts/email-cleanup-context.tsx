import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface GmailTokens {
  accessToken: string
  refreshToken: string
  expiryDate: number
}

interface GmailProfile {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

interface EmailCleanupContextType {
  // Gmail Connection State
  gmailConnected: boolean
  authTokens: GmailTokens | null
  gmailProfile: GmailProfile | null
  isConnecting: boolean
  
  // Actions
  setGmailConnected: (connected: boolean) => void
  setAuthTokens: (tokens: GmailTokens | null) => void
  setGmailProfile: (profile: GmailProfile | null) => void
  setIsConnecting: (connecting: boolean) => void
  
  // Gmail Connection Methods
  connectGmail: () => Promise<void>
  disconnectGmail: () => void
  checkOAuthCallback: () => void
  
  // Session Persistence
  saveSession: () => void
  loadSession: () => void
  clearSession: () => void
}

const EmailCleanupContext = createContext<EmailCleanupContextType | null>(null)

interface EmailCleanupProviderProps {
  children: ReactNode
}

export function EmailCleanupProvider({ children }: EmailCleanupProviderProps) {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [authTokens, setAuthTokens] = useState<GmailTokens | null>(null)
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Load session on mount
  useEffect(() => {
    loadSession()
  }, [])

  // Save session when state changes
  useEffect(() => {
    if (gmailConnected && authTokens && gmailProfile) {
      saveSession()
    }
  }, [gmailConnected, authTokens, gmailProfile])

  const saveSession = () => {
    if (typeof window === 'undefined') return
    
    try {
      const sessionData = {
        gmailConnected,
        authTokens,
        gmailProfile,
        timestamp: Date.now()
      }
      localStorage.setItem('email-cleanup-session', JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  const loadSession = () => {
    if (typeof window === 'undefined') return
    
    try {
      // First check for OAuth callback tokens from the callback page
      const callbackTokens = localStorage.getItem('gmail-tokens')
      if (callbackTokens) {
        const tokens = JSON.parse(callbackTokens)
        if (tokens.accessToken) {
          console.log('📧 Found OAuth callback tokens, processing...')
          handleCallbackTokens(tokens)
          // Remove the temporary tokens
          localStorage.removeItem('gmail-tokens')
          return
        }
      }
      
      // Then check for existing session
      const sessionData = localStorage.getItem('email-cleanup-session')
      if (!sessionData) return

      const parsed = JSON.parse(sessionData)
      
      // Check if session is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - parsed.timestamp > maxAge) {
        clearSession()
        return
      }

      // Check if tokens are still valid (not expired)
      if (parsed.authTokens?.expiryDate && parsed.authTokens.expiryDate < Date.now()) {
        // Token expired, clear session
        clearSession()
        return
      }

      // Restore session
      if (parsed.gmailConnected && parsed.authTokens && parsed.gmailProfile) {
        setGmailConnected(parsed.gmailConnected)
        setAuthTokens(parsed.authTokens)
        setGmailProfile(parsed.gmailProfile)
        console.log('📧 Gmail session restored:', parsed.gmailProfile.emailAddress)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      clearSession()
    }
  }

  const handleCallbackTokens = async (tokens: any) => {
    try {
      setIsConnecting(true)
      console.log('📧 Processing OAuth callback tokens...')
      
      // Use the tokens to get Gmail profile
      const response = await fetch('/api/email/gmail/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken 
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.stats) {
        // Set the auth tokens with proper format
        setAuthTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiryDate: Date.now() + (3600 * 1000) // 1 hour from now (default for Google tokens)
        })
        
        // Set Gmail profile from stats
        setGmailProfile({
          emailAddress: data.profile?.emailAddress || 'Unknown',
          messagesTotal: data.stats.totalEmails || 0,
          threadsTotal: data.stats.totalEmails || 0, // Approximate
          historyId: Date.now().toString()
        })
        
        setGmailConnected(true)
        
        console.log('📧 Gmail connected via OAuth callback!')
        
        // Show success message
        setTimeout(() => {
          const message = `🎉 Gmail Authentication Successful!\n\nAccount connected with ${data.stats.totalEmails} emails\nYou can now use the Email Co-Pilot features!`
          alert(message)
        }, 500)
      } else {
        throw new Error(data.error || 'Failed to get Gmail profile')
      }
    } catch (error) {
      console.error('Error processing callback tokens:', error)
      
      // Still set the tokens even if profile fetch fails
      setAuthTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: Date.now() + (3600 * 1000)
      })
      setGmailConnected(true)
      
      console.log('📧 Gmail tokens set, but profile fetch failed')
      alert('Gmail connected! (Profile info unavailable, but functionality should work)')
    } finally {
      setIsConnecting(false)
    }
  }

  const clearSession = () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem('email-cleanup-session')
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  const connectGmail = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/email/gmail/connect')
      const data = await response.json()
      
      if (data.success) {
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || 'Failed to get auth URL')
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect to Gmail. Please try again.')
      setIsConnecting(false)
    }
  }

  const disconnectGmail = () => {
    setGmailConnected(false)
    setAuthTokens(null)
    setGmailProfile(null)
    setIsConnecting(false)
    clearSession()
    console.log('📧 Gmail disconnected')
  }

  const checkOAuthCallback = () => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (error) {
      alert(`Gmail connection failed: ${error}`)
      window.history.replaceState({}, document.title, window.location.pathname)
      setIsConnecting(false)
      return
    }
    
    if (code) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Exchange code for tokens
      handleOAuthSuccess(code)
    }
  }

  const handleOAuthSuccess = async (code: string) => {
    try {
      setIsConnecting(true)
      
      const response = await fetch('/api/email/gmail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAuthTokens({
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          expiryDate: data.tokens.expiryDate
        })
        setGmailProfile(data.profile)
        setGmailConnected(true)
        
        console.log('📧 Gmail connected successfully:', data.profile.emailAddress)
        
        // Show success message
        setTimeout(() => {
          alert(`Gmail connected successfully!\n\nAccount: ${data.profile.emailAddress}\nEmails: ${data.profile.messagesTotal.toLocaleString()}`)
        }, 100)
      } else {
        throw new Error(data.error || 'Failed to exchange tokens')
      }
    } catch (error) {
      console.error('Error handling OAuth success:', error)
      alert('Failed to complete Gmail connection. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const value: EmailCleanupContextType = {
    // State
    gmailConnected,
    authTokens,
    gmailProfile,
    isConnecting,
    
    // Setters
    setGmailConnected,
    setAuthTokens,
    setGmailProfile,
    setIsConnecting,
    
    // Methods
    connectGmail,
    disconnectGmail,
    checkOAuthCallback,
    
    // Session Management
    saveSession,
    loadSession,
    clearSession
  }

  return (
    <EmailCleanupContext.Provider value={value}>
      {children}
    </EmailCleanupContext.Provider>
  )
}

export function useEmailCleanup() {
  const context = useContext(EmailCleanupContext)
  if (!context) {
    throw new Error('useEmailCleanup must be used within an EmailCleanupProvider')
  }
  return context
}

// Hook for Gmail connection status
export function useGmailConnection() {
  const { gmailConnected, authTokens, gmailProfile, isConnecting } = useEmailCleanup()
  
  return {
    isConnected: gmailConnected,
    tokens: authTokens,
    profile: gmailProfile,
    isConnecting,
    hasValidTokens: authTokens && authTokens.expiryDate > Date.now()
  }
}

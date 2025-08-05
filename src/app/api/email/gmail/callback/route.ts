import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    // Handle OAuth error
    redirect(`/email-cleanup?error=${encodeURIComponent(error)}`)
    return
  }
  
  if (code) {
    // Store the authorization code and redirect to the main page
    // In a real app, you'd store this securely or exchange for tokens immediately
    redirect(`/email-cleanup?code=${encodeURIComponent(code)}`)
    return
  }
  
  // No code or error, redirect with error
  redirect('/email-cleanup?error=no_code_received')
}

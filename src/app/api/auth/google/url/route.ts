import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'

export async function GET() {
  try {
    // Check if Google OAuth environment variables are set
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        configured: false,
        error: 'Google OAuth credentials not configured',
        missing: {
          clientId: !clientId,
          clientSecret: !clientSecret
        },
        setup: 'Please follow the Google OAuth Setup Guide to configure credentials'
      }, { status: 400 })
    }

    if (clientId === 'your_google_client_id_here' || clientSecret === 'your_google_client_secret_here') {
      return NextResponse.json({
        configured: false,
        error: 'Google OAuth credentials are placeholder values',
        setup: 'Please replace placeholder values with actual Google OAuth credentials'
      }, { status: 400 })
    }

    // Create OAuth2 client
    const client = new OAuth2Client(clientId, clientSecret, redirectUrl)

    // Generate OAuth URL
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      prompt: 'select_account' // Always show account selector
    })

    return NextResponse.json({
      configured: true,
      url: authorizeUrl,
      redirectUrl,
      clientId: clientId.substring(0, 20) + '...', // Show partial ID for verification
      message: 'Google OAuth is properly configured'
    })

  } catch (error) {
    console.error('Google OAuth URL generation error:', error)
    return NextResponse.json({
      configured: false,
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

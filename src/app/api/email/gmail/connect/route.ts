import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function GET() {
  try {
    const gmailService = new GmailService(GMAIL_CONFIG)
    const authUrl = gmailService.generateAuthUrl()
    
    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Gmail OAuth URL generated successfully'
    })
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, refreshToken } = await request.json()
    
    if (!code && !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Authorization code or refresh token required' },
        { status: 400 }
      )
    }

    const gmailService = new GmailService(GMAIL_CONFIG)
    
    let tokens
    if (code) {
      // Exchange authorization code for tokens
      tokens = await gmailService.getTokens(code)
    } else {
      // Use existing refresh token
      tokens = { refresh_token: refreshToken } as any
    }

    // Set tokens and get profile
    gmailService.setTokens(tokens)
    const profile = await gmailService.getProfile()

    // Store tokens securely (in production, use encrypted database)
    // For demo, we'll return them (not recommended for production)
    
    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      },
      profile: {
        emailAddress: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId
      },
      message: 'Gmail account connected successfully'
    })
  } catch (error) {
    console.error('Error connecting Gmail account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to connect Gmail account' },
      { status: 500 }
    )
  }
}

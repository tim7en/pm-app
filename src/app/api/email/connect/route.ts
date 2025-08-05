import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, code } = await request.json()

    if (provider === 'gmail') {
      // Exchange code for tokens with Google OAuth
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/email/callback`
        })
      })

      const tokens = await tokenResponse.json()

      if (tokens.error) {
        return NextResponse.json({ error: tokens.error }, { status: 400 })
      }

      // Get user's Gmail profile
      const profileResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })

      const profile = await profileResponse.json()

      // Store account in database
      // await db.emailAccount.create({
      //   data: {
      //     userId: session.user.id,
      //     email: profile.emailAddress,
      //     provider: 'gmail',
      //     accessToken: tokens.access_token,
      //     refreshToken: tokens.refresh_token,
      //     isActive: true
      //   }
      // })

      return NextResponse.json({ 
        success: true, 
        email: profile.emailAddress,
        message: 'Gmail account connected successfully'
      })
    }

    if (provider === 'outlook') {
      // Similar implementation for Outlook
      return NextResponse.json({ 
        success: true, 
        message: 'Outlook integration coming soon'
      })
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })

  } catch (error) {
    console.error('Email connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect email account' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's connected email accounts
    // const accounts = await db.emailAccount.findMany({
    //   where: { 
    //     userId: session.user.id,
    //     isActive: true
    //   },
    //   select: {
    //     id: true,
    //     email: true,
    //     provider: true,
    //     createdAt: true
    //   }
    // })

    // Mock data for now
    const accounts = [
      {
        id: '1',
        email: 'user@company.com',
        provider: 'gmail',
        createdAt: new Date()
      }
    ]

    return NextResponse.json({ accounts })

  } catch (error) {
    console.error('Failed to get email accounts:', error)
    return NextResponse.json(
      { error: 'Failed to get email accounts' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { OAuth2Client } from 'google-auth-library'
import { emailService } from '@/lib/email'

// In-memory store to track used authorization codes
const usedCodes = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    // Check if Google OAuth environment variables are set
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    // Force production URL
    const redirectUrl = 'https://tasken.uz/auth/google/callback'

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured' },
        { status: 500 }
      )
    }

    if (clientId === 'your_google_client_id_here' || clientSecret === 'your_google_client_secret_here') {
      return NextResponse.json(
        { error: 'Google OAuth credentials are placeholder values' },
        { status: 500 }
      )
    }

    // Create OAuth2 client with current environment variables
    const client = new OAuth2Client(clientId, clientSecret, redirectUrl)

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Check if code has already been used
    if (usedCodes.has(code)) {
      console.log('Duplicate authorization code usage attempt:', code.substring(0, 20) + '...')
      return NextResponse.json(
        { error: 'Authorization code has already been used' },
        { status: 400 }
      )
    }

    // Mark code as used
    usedCodes.add(code)

    // Clean up old codes (keep only last 100 to prevent memory leak)
    if (usedCodes.size > 100) {
      const codesArray = Array.from(usedCodes)
      usedCodes.clear()
      // Keep the last 50 codes
      codesArray.slice(-50).forEach(c => usedCodes.add(c))
    }

    console.log('Processing Google OAuth code:', code.substring(0, 20) + '...')

    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 400 }
      )
    }

    const { sub: googleId, email, name, picture } = payload

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      )
    }

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    let isNewUser = false

    if (!user) {
      // Create new user
      isNewUser = true
      const newUser = await db.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          avatar: picture || null,
          googleId,
          oauthProvider: 'google',
          emailVerified: true, // Google emails are pre-verified
          lastLoginAt: new Date()
        }
      })

      // Create default workspace for new user
      const workspace = await db.workspace.create({
        data: {
          name: `${name || 'My'} Workspace`,
          description: 'Your personal workspace'
        }
      })

      // Add user as workspace owner
      await db.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: workspace.id,
          role: 'OWNER'
        }
      })

      // Get user with workspace info
      user = await db.user.findUnique({
        where: { id: newUser.id },
        include: {
          workspaceMembers: {
            include: {
              workspace: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      // Send welcome email for new users
      if (user) {
        await emailService.sendWelcomeEmail(user.email, user.name || 'User')
      }
    } else {
      // Update existing user with Google info if not already set
      const updateData: any = {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts on successful login
        lockedUntil: null // Unlock account if it was locked
      }

      if (!user.googleId) {
        updateData.googleId = googleId
        updateData.oauthProvider = 'google'
      }

      if (!user.emailVerified) {
        updateData.emailVerified = true
      }

      if (!user.avatar && picture) {
        updateData.avatar = picture
      }

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          workspaceMembers: {
            include: {
              workspace: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or update user' },
        { status: 500 }
      )
    }

    // Create JWT token
    const token = createToken(user.id)

    // Get user's workspaces
    const workspaces = user.workspaceMembers.map(member => ({
      id: member.workspace.id,
      name: member.workspace.name,
      role: member.role
    }))

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      },
      workspaces,
      token,
      isNewUser
    })

    // Set token as HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    )
  }
}

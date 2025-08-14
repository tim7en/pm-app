import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { loginSchema, validateRequestBody } from '@/lib/validations'
import { withErrorHandling, AuthenticationError, withDatabase } from '@/lib/errors'
import { authRateLimit } from '@/lib/rate-limit'
import { log, createRequestLogger } from '@/lib/logger'
import bcrypt from 'bcryptjs'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestLogger = createRequestLogger(request)
  
  // Apply rate limiting
  const rateLimitResponse = await authRateLimit(request)
  if (rateLimitResponse) {
    requestLogger.warn('Login rate limit exceeded')
    return rateLimitResponse
  }

  // Validate request body
  const body = await request.json()
  const { email, password } = validateRequestBody(loginSchema, body)

  requestLogger.auth('Login attempt', { email })

  // Find user by email
  const user = await withDatabase(async () => {
    return db.user.findUnique({
      where: { email },
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
  }, 'find user by email')

  if (!user || !user.password) {
    requestLogger.auth('Login failed - invalid credentials', { email })
    throw new AuthenticationError('Invalid email or password')
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60)
    requestLogger.security('Login attempt on locked account', { 
      email, 
      userId: user.id,
      remainingTime 
    })
    throw new AuthenticationError(`Account is locked. Try again in ${remainingTime} minutes.`)
  }

  // Compare hashed passwords
  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    // Increment failed login attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1
    const maxAttempts = 5
    
    let lockUntil: Date | null = null
    if (failedAttempts >= maxAttempts) {
      // Lock account for 30 minutes
      lockUntil = new Date(Date.now() + 30 * 60 * 1000)
    }

    await withDatabase(async () => {
      return db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockUntil
        }
      })
    }, 'update failed login attempts')

    requestLogger.security('Login failed - invalid password', { 
      email, 
      userId: user.id,
      failedAttempts,
      accountLocked: !!lockUntil
    })

    if (lockUntil) {
      throw new AuthenticationError('Too many failed attempts. Account locked for 30 minutes.')
    }

    throw new AuthenticationError(`Invalid email or password. ${maxAttempts - failedAttempts} attempts remaining.`)
  }

  // Reset failed attempts on successful login
  await withDatabase(async () => {
    return db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    })
  }, 'reset failed login attempts')

  // Create JWT token
  const token = createToken(user.id)

  // Get user's workspaces
  const workspaces = user.workspaceMembers.map(member => ({
    id: member.workspace.id,
    name: member.workspace.name,
    role: member.role
  }))

  requestLogger.auth('Login successful', { 
    email, 
    userId: user.id,
    workspaceCount: workspaces.length
  })

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    },
    workspaces,
    token
  })

  // Set token as HTTP-only cookie
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  })

  return response
})

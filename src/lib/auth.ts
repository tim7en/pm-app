import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from './db'

// Safe environment variable access
function getJWTSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error('JWT secret should not be accessed on client side')
  }
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production'
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
}

export interface AuthSession {
  user: AuthUser
  workspaceId?: string
}

/**
 * Extract user information from JWT token in request headers
 */
export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get token from cookies as fallback
      const token = request.cookies.get('auth-token')?.value
      if (!token) {
        return null
      }
      return verifyToken(token)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    return verifyToken(token)
  } catch (error) {
    console.error('Error getting auth session:', error)
    return null
  }
}

/**
 * Verify JWT token and return user session
 */
async function verifyToken(token: string): Promise<AuthSession | null> {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any
    
    if (!decoded.userId) {
      return null
    }

    // Get fresh user data from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    })

    if (!user) {
      return null
    }

    // Get user's default workspace
    const workspaceMember = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      include: {
        workspace: {
          select: { id: true }
        }
      }
    })

    return {
      user,
      workspaceId: workspaceMember?.workspace.id
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

/**
 * Create JWT token for user
 */
export function createToken(userId: string): string {
  return jwt.sign(
    { userId },
    getJWTSecret(),
    { expiresIn: '30d' } // Token expires in 30 days
  )
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (request: NextRequest, session: AuthSession) => Promise<Response>) {
  return async (request: NextRequest) => {
    const session = await getAuthSession(request)
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, session)
  }
}

/**
 * Check if user has access to workspace
 */
export async function hasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    }
  })
  
  return !!membership
}

/**
 * Check if user has access to project
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId }
      }
    }
  })
  
  if (!project) {
    return false
  }

  // User has access if they are the owner or a member
  return project.ownerId === userId || project.members.length > 0
}

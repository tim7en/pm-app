import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// GET /api/invitations - Get user's pending invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's pending workspace invitations
    const invitations = await db.workspaceInvitation.findMany({
      where: {
        email: session.user.email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        workspace: {
          select: { id: true, name: true, description: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

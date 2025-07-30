import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// POST /api/invitations/[id]/decline - Decline workspace invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the invitation
    const invitation = await db.workspaceInvitation.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation is for the current user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      )
    }

    // Decline the invitation
    await db.workspaceInvitation.update({
      where: { id },
      data: { status: 'DECLINED' }
    })

    return NextResponse.json({
      message: 'Invitation declined successfully'
    })
  } catch (error) {
    console.error('Error declining invitation:', error)
    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 }
    )
  }
}

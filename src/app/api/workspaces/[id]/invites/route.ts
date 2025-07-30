import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to view invites (OWNER or ADMIN)
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.id
        }
      }
    })

    if (!workspaceMember || (workspaceMember.role !== 'OWNER' && workspaceMember.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view invitations' },
        { status: 403 }
      )
    }

    // Get pending invitations
    const invitations = await db.workspaceInvitation.findMany({
      where: {
        workspaceId: params.id,
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedInvitations = invitations.map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      invitedAt: invite.createdAt.toISOString(),
      invitedBy: invite.inviter
    }))

    return NextResponse.json(formattedInvitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

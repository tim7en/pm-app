import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to cancel invites (OWNER or ADMIN)
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
        { error: 'Insufficient permissions to cancel invitations' },
        { status: 403 }
      )
    }

    // Get the invitation to verify it belongs to this workspace
    const invitation = await db.workspaceInvitation.findUnique({
      where: {
        id: params.inviteId
      }
    })

    if (!invitation || invitation.workspaceId !== resolvedParams.id) {
      return NextResponse.json(
        { error: 'Invitation not found in this workspace' },
        { status: 404 }
      )
    }

    // Delete the invitation
    await db.workspaceInvitation.delete({
      where: {
        id: params.inviteId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}

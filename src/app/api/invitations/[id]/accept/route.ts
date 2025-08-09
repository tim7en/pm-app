import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationType } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'

// POST /api/invitations/[id]/accept - Accept workspace invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
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
        workspace: true
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
    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId
        }
      }
    })

    if (existingMember) {
      // Update invitation status to accepted
      await db.workspaceInvitation.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      })

      return NextResponse.json(
        { error: 'You are already a member of this workspace' },
        { status: 400 }
      )
    }

    // Accept the invitation - create workspace membership
    const member = await db.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      },
      include: {
        workspace: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // Update invitation status
    await db.workspaceInvitation.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    })

    // Create notification for successful join
    await db.notification.create({
      data: {
        title: 'Welcome to the team!',
        message: `You have successfully joined ${invitation.workspace.name}`,
        type: NotificationType.WORKSPACE_INVITE,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      member,
      workspace: invitation.workspace
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

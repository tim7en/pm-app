import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Role, NotificationType } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'

// GET /api/workspaces/[id]/members - Get workspace members
export async function GET(
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

    // Check if user has access to this workspace
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: id
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      )
    }

    // Get all workspace members
    const members = await db.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    // Ensure consistent data structure and handle null values
    const sanitizedMembers = members.map(member => ({
      id: member.user.id,
      name: member.user.name || member.user.email || 'Unknown User',
      email: member.user.email,
      avatar: member.user.avatar,
      role: member.role,
      joinedAt: member.joinedAt
    }))

    return NextResponse.json(sanitizedMembers)
  } catch (error) {
    console.error('Error fetching workspace members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace members' },
      { status: 500 }
    )
  }
}

// POST /api/workspaces/[id]/members - Invite user to workspace by email
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

    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if current user has permission to invite (workspace owner or admin)
    const currentUserMembership = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: id
        }
      }
    })

    if (!currentUserMembership || !['OWNER', 'ADMIN'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Find user by email
    const userToInvite = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // If user doesn't exist, create invitation for when they register
    if (!userToInvite) {
      // Check if invitation already exists
      const existingInvitation = await db.workspaceInvitation.findUnique({
        where: {
          email_workspaceId: {
            email: email.toLowerCase(),
            workspaceId: id
          }
        }
      })

      if (existingInvitation && existingInvitation.status === 'PENDING' && existingInvitation.expiresAt > new Date()) {
        return NextResponse.json(
          { error: 'Invitation already sent to this email' },
          { status: 400 }
        )
      }

      // Create or update invitation
      const invitation = await db.workspaceInvitation.upsert({
        where: {
          email_workspaceId: {
            email: email.toLowerCase(),
            workspaceId: id
          }
        },
        update: {
          role: role as Role,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        create: {
          email: email.toLowerCase(),
          workspaceId: id,
          role: role as Role,
          invitedBy: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        include: {
          workspace: {
            select: { id: true, name: true }
          },
          inviter: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json({
        message: 'Invitation sent successfully. The user will be notified when they register or log in.',
        invitation
      }, { status: 201 })
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToInvite.id,
          workspaceId: id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.workspaceInvitation.findUnique({
      where: {
        email_workspaceId: {
          email: email.toLowerCase(),
          workspaceId: id
        }
      }
    })

    if (existingInvitation && existingInvitation.status === 'PENDING' && existingInvitation.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this user' },
        { status: 400 }
      )
    }

    // Create or update invitation for existing user
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const invitation = await db.workspaceInvitation.upsert({
      where: {
        email_workspaceId: {
          email: email.toLowerCase(),
          workspaceId: id
        }
      },
      update: {
        role: role as Role,
        invitedBy: session.user.id,
        status: 'PENDING',
        expiresAt
      },
      create: {
        email: email.toLowerCase(),
        workspaceId: id,
        role: role as Role,
        invitedBy: session.user.id,
        expiresAt
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create notification for the invited user
    await db.notification.create({
      data: {
        title: 'Workspace Invitation',
        message: `You have been invited to join ${invitation.workspace.name} with ${role.toLowerCase()} role by ${invitation.inviter.name}`,
        type: NotificationType.WORKSPACE_INVITE,
        userId: userToInvite.id
      }
    })

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation
    }, { status: 201 })
  } catch (error) {
    console.error('Error inviting workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to invite workspace member' },
      { status: 500 }
    )
  }
}
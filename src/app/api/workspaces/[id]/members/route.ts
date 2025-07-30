import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

// GET /api/workspaces/[id]/members - Get workspace members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
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
          workspaceId: params.id
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
      where: { workspaceId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    return NextResponse.json(members)
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
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
          workspaceId: params.id
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

    if (!userToInvite) {
      return NextResponse.json(
        { error: 'User not found. The user must register first.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToInvite.id,
          workspaceId: params.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Add user to workspace
    const member = await db.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId: params.id,
        role: role as Role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // Create notification for the invited user
    await db.notification.create({
      data: {
        title: 'Workspace Invitation',
        message: `You have been invited to join a workspace with ${role.toLowerCase()} role`,
        type: 'PROJECT_INVITE',
        userId: userToInvite.id
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error inviting workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to invite workspace member' },
      { status: 500 }
    )
  }
}
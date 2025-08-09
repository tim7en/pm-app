import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectRole } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

// GET /api/projects/[id]/members - Get project members (includes workspace members)
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

    // Get project details including workspace
    const project = await db.project.findUnique({
      where: { id },
      select: { workspaceId: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get direct project members
    const projectMembers = await db.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // Get workspace members who can be assigned to tasks
    const workspaceMembers = await db.workspaceMember.findMany({
      where: { workspaceId: project.workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    // Combine and deduplicate members
    const allMembers: any[] = []
    const seenUserIds = new Set()

    // Add project members first (they have explicit roles)
    for (const member of projectMembers) {
      allMembers.push({
        id: member.id,
        userId: member.userId,
        projectId: member.projectId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
        source: 'project'
      })
      seenUserIds.add(member.userId)
    }

    // Add workspace members who aren't already project members
    for (const wsMember of workspaceMembers) {
      if (!seenUserIds.has(wsMember.userId)) {
        // Map workspace role to project role
        let projectRole: ProjectRole = 'MEMBER'
        if (wsMember.role === 'OWNER') projectRole = 'ADMIN'
        else if (wsMember.role === 'ADMIN') projectRole = 'MANAGER'

        allMembers.push({
          id: `ws-${wsMember.id}`,
          userId: wsMember.userId,
          projectId: id,
          role: projectRole,
          joinedAt: wsMember.joinedAt,
          user: wsMember.user,
          source: 'workspace'
        })
      }
    }

    return NextResponse.json(allMembers)
  } catch (error) {
    console.error('Error fetching project members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/members - Add project member
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
    const { userId, email, role = 'MEMBER' } = body

    let targetUserId = userId

    // If email is provided instead of userId, find user by email
    if (!targetUserId && email) {
      const userToInvite = await db.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!userToInvite) {
        return NextResponse.json(
          { error: 'User not found. The user must register first.' },
          { status: 404 }
        )
      }

      targetUserId = userToInvite.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to add members (project owner or admin)
    const project = await db.project.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const isOwner = project.ownerId === session.user.id
    const isAdmin = project.members.some(member => 
      member.userId === session.user.id && member.role === 'ADMIN'
    )

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add members' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId: id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      )
    }

    // Add member
    const member = await db.projectMember.create({
      data: {
        userId: targetUserId,
        projectId: id,
        role: role as ProjectRole
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
        title: 'Project Invitation',
        message: `You have been invited to join a project with ${role.toLowerCase()} role`,
        type: 'PROJECT_INVITE',
        userId: targetUserId
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding project member:', error)
    return NextResponse.json(
      { error: 'Failed to add project member' },
      { status: 500 }
    )
  }
}

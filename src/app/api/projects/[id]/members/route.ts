import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectRole } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

// GET /api/projects/[id]/members - Get project members
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

    const members = await db.projectMember.findMany({
      where: { projectId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json(members)
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
      where: { id: params.id },
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
          projectId: params.id
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
        projectId: params.id,
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

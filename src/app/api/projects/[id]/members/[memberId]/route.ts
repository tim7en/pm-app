import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectRole } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

// PUT /api/projects/[id]/members/[memberId] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !Object.values(ProjectRole).includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to update roles (project owner or admin)
    const project = await db.project.findUnique({
      where: { id: resolvedParams.id },
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
        { error: 'Insufficient permissions to update member roles' },
        { status: 403 }
      )
    }

    // Update member role
    const updatedMember = await db.projectMember.update({
      where: { id: resolvedParams.memberId },
      data: { role: role as ProjectRole },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to remove members (project owner or admin)
    const project = await db.project.findUnique({
      where: { id: resolvedParams.id },
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
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      )
    }

    // Don't allow removing the project owner
    const memberToRemove = await db.projectMember.findUnique({
      where: { id: resolvedParams.memberId },
      include: { user: true }
    })

    if (memberToRemove && memberToRemove.userId === project.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      )
    }

    // Remove member
    await db.projectMember.delete({
      where: { id: resolvedParams.memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}

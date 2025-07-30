import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

// PUT /api/workspaces/[id]/members/[memberId] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id, memberId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    // Check if current user has permission to update roles (workspace owner or admin)
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
        { error: 'Insufficient permissions to update member roles' },
        { status: 403 }
      )
    }

    // Get the member to update
    const memberToUpdate = await db.workspaceMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    if (!memberToUpdate || memberToUpdate.workspaceId !== id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent changing owner role
    if (memberToUpdate.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      )
    }

    // Update member role
    const updatedMember = await db.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as Role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to update workspace member' },
      { status: 500 }
    )
  }
}

// DELETE /api/workspaces/[id]/members/[memberId] - Remove member from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id, memberId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if current user has permission to remove members (workspace owner or admin)
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
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      )
    }

    // Get the member to remove
    const memberToRemove = await db.workspaceMember.findUnique({
      where: { id: memberId }
    })

    if (!memberToRemove || memberToRemove.workspaceId !== id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent removing workspace owner
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      )
    }

    // Remove member from workspace
    await db.workspaceMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json(
      { error: 'Failed to remove workspace member' },
      { status: 500 }
    )
  }
}
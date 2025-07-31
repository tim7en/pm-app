import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// PUT /api/workspaces/[id]/members/[memberId]/position - Update member position
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id: workspaceId, memberId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, department } = body

    // Check if current user has permission to edit member positions (workspace owner or admin)
    const currentUserMembership = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspaceId
        }
      }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      )
    }

    // Only workspace owners and admins can edit member positions
    if (currentUserMembership.role !== 'OWNER' && currentUserMembership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can edit member positions' },
        { status: 403 }
      )
    }

    // Check if the target member exists in the workspace
    const targetMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: workspaceId
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found in workspace' },
        { status: 404 }
      )
    }

    // Update the member's position
    const updatedMember = await db.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: workspaceId
        }
      },
      data: {
        // @ts-ignore - Prisma types not updated yet
        title: title || null,
        // @ts-ignore - Prisma types not updated yet
        department: department || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      member: updatedMember
    })
  } catch (error) {
    console.error('Error updating member position:', error)
    return NextResponse.json(
      { error: 'Failed to update member position' },
      { status: 500 }
    )
  }
}
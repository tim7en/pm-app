import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// POST /api/workspaces/[id]/leave - Leave workspace (current user leaves)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find current user's membership
    const membership = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 404 }
      )
    }

    // Prevent leaving if user is the only owner
    if (membership.role === 'OWNER') {
      const ownerCount = await db.workspaceMember.count({
        where: {
          workspaceId: id,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot leave workspace. You are the only owner. Please transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    // Start transaction to clean up user's history in the workspace
    await db.$transaction(async (tx) => {
      // Remove user from all project memberships in this workspace
      const workspaceProjects = await tx.project.findMany({
        where: { workspaceId: id },
        select: { id: true }
      })

      const projectIds = workspaceProjects.map(p => p.id)

      if (projectIds.length > 0) {
        // Remove project memberships
        await tx.projectMember.deleteMany({
          where: {
            userId: session.user.id,
            projectId: { in: projectIds }
          }
        })

        // Remove task assignments
        await tx.task.updateMany({
          where: {
            assigneeId: session.user.id,
            projectId: { in: projectIds }
          },
          data: {
            assigneeId: null
          }
        })

        // Remove task verifications
        await tx.task.updateMany({
          where: {
            verifiedById: session.user.id,
            projectId: { in: projectIds }
          },
          data: {
            verifiedById: null
          }
        })

        // Delete comments made by user in workspace projects
        await tx.comment.deleteMany({
          where: {
            userId: session.user.id,
            task: {
              projectId: { in: projectIds }
            }
          }
        })
      }

      // Remove workspace membership
      await tx.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId: id
          }
        }
      })
    })

    return NextResponse.json({
      message: 'Successfully left the workspace. Your activity history has been removed.'
    })
  } catch (error) {
    console.error('Error leaving workspace:', error)
    return NextResponse.json(
      { error: 'Failed to leave workspace' },
      { status: 500 }
    )
  }
}

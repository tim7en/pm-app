import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { TaskStatus } from '@/lib/prisma-mock'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const { status } = await request.json()

    // Validate status
    if (!Object.values(TaskStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get task with project information
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true
          }
        },
        assignees: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user has permission to change status
    // Allow: project members, project owner, and task assignees
    const isProjectMember = task.project.members.some(
      member => member.userId === session.user.id
    )
    const isProjectOwner = task.project.ownerId === session.user.id
    const isTaskAssignee = task.assignees.some(
      assignee => assignee.userId === session.user.id
    )

    const hasAccess = isProjectMember || isProjectOwner || isTaskAssignee

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update task status
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

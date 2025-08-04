import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { canUserPerformAction } from '@/lib/roles'
import { NotificationService } from '@/lib/notification-service'

// GET /api/tasks/[id]/assignees - Get task assignees
export async function GET(
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

    // Check if user can view the task
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, workspaceId: true }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check user access to task
    const canView = await canUserPerformAction(session.user.id, task.project.id, 'canEditTask')
    if (!canView && task.creatorId !== session.user.id && 
        !task.assignees.some(a => a.userId === session.user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(task.assignees)
  } catch (error) {
    console.error('Error fetching task assignees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task assignees' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/assignees - Add assignees to task
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

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    // Get task with project info
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        },
        assignees: {
          select: { userId: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user can assign tasks
    const canAssign = await canUserPerformAction(session.user.id, task.project.id, 'canAssignTask')
    if (!canAssign) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign tasks' },
        { status: 403 }
      )
    }

    // Validate that all users exist and are workspace members
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      include: {
        workspaceMembers: {
          where: { workspaceId: task.project.workspaceId },
          select: { workspaceId: true }
        }
      }
    })

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: 'One or more users not found' },
        { status: 400 }
      )
    }

    // Check workspace membership
    const nonMembers = users.filter(user => user.workspaceMembers.length === 0)
    if (nonMembers.length > 0) {
      return NextResponse.json(
        { error: `Users not in workspace: ${nonMembers.map(u => u.email).join(', ')}` },
        { status: 400 }
      )
    }

    // Get currently assigned user IDs
    const currentAssigneeIds = task.assignees.map(a => a.userId)
    
    // Filter out users who are already assigned
    const newUserIds = userIds.filter(userId => !currentAssigneeIds.includes(userId))

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { message: 'All users are already assigned to this task' },
        { status: 200 }
      )
    }

    // Create new task assignments
    const newAssignments = await Promise.all(
      newUserIds.map(userId =>
        db.taskAssignee.create({
          data: {
            taskId: id,
            userId,
            assignedBy: session.user.id
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        })
      )
    )

    // Update legacy assigneeId if it's empty and we have assignees
    if (!task.assigneeId && newAssignments.length > 0) {
      await db.task.update({
        where: { id },
        data: { assigneeId: newAssignments[0].userId }
      })
    }

    // Send notifications to newly assigned users
    const notificationService = new NotificationService()
    await Promise.all(
      newAssignments.map(assignment =>
        NotificationService.createNotification({
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
          userId: assignment.userId,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.projectId,
            assignedBy: session.user.name || session.user.email
          }
        })
      )
    )

    return NextResponse.json({
      message: `${newAssignments.length} user(s) assigned to task`,
      assignments: newAssignments
    })
  } catch (error) {
    console.error('Error assigning users to task:', error)
    return NextResponse.json(
      { error: 'Failed to assign users to task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]/assignees - Remove assignees from task
export async function DELETE(
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

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    // Get task with project info
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, workspaceId: true }
        },
        assignees: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user can assign tasks (or if they're removing themselves)
    const canAssign = await canUserPerformAction(session.user.id, task.project.id, 'canAssignTask')
    const removingSelf = userIds.length === 1 && userIds[0] === session.user.id
    
    if (!canAssign && !removingSelf) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify task assignments' },
        { status: 403 }
      )
    }

    // Remove assignments
    const removedCount = await db.taskAssignee.deleteMany({
      where: {
        taskId: id,
        userId: { in: userIds }
      }
    })

    // Update legacy assigneeId if we removed the currently assigned user
    if (task.assigneeId && userIds.includes(task.assigneeId)) {
      const remainingAssignees = await db.taskAssignee.findFirst({
        where: { taskId: id },
        select: { userId: true }
      })
      
      await db.task.update({
        where: { id },
        data: { assigneeId: remainingAssignees?.userId || null }
      })
    }

    return NextResponse.json({
      message: `${removedCount.count} assignment(s) removed`,
      removedCount: removedCount.count
    })
  } catch (error) {
    console.error('Error removing task assignees:', error)
    return NextResponse.json(
      { error: 'Failed to remove task assignees' },
      { status: 500 }
    )
  }
}

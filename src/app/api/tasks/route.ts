import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, Priority, NotificationType } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleTasks, canUserPerformAction } from '@/lib/roles'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    // Get all accessible tasks for the user
    let tasks = await getAccessibleTasks(session.user.id, projectId || undefined)
    
    // Filter by workspace if specified (through projects)
    if (workspaceId) {
      tasks = tasks.filter(task => task.project?.workspaceId === workspaceId)
    }
    
    // Apply other filters
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      tasks = tasks.filter(task => task.status === status)
    }
    
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      tasks = tasks.filter(task => task.priority === priority)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      projectId,
      assigneeId,
      assigneeIds,
      priority = 'MEDIUM',
      dueDate,
      tags = []
    } = body

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and project are required' },
        { status: 400 }
      )
    }

    // Check if user can create tasks in this project
    const canCreateTask = await canUserPerformAction(session.user.id, projectId, 'canCreateTask')
    if (!canCreateTask) {
      return NextResponse.json(
        { error: 'You do not have permission to create tasks in this project' },
        { status: 403 }
      )
    }

    // Verify project exists and user has access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get workspace and project information for permission checking
    const projectWithWorkspace = await db.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true, ownerId: true }
    })

    if (!projectWithWorkspace) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check user's role in workspace to determine assignment permissions
    const userWorkspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: projectWithWorkspace.workspaceId
        }
      }
    })

    const isProjectOwner = projectWithWorkspace.ownerId === session.user.id
    const isWorkspaceOwnerOrAdmin = userWorkspaceMember?.role === 'OWNER' || userWorkspaceMember?.role === 'ADMIN'

    // Determine which assignee IDs to use (new multi-assignee or legacy single assignee)
    const targetAssigneeIds = assigneeIds && assigneeIds.length > 0 
      ? assigneeIds 
      : (assigneeId && assigneeId.trim() !== '' ? [assigneeId] : [])

    // Validate assignee permissions and workspace membership
    if (targetAssigneeIds.length > 0) {
      // If user is a regular member and not project owner, they can only assign to themselves
      if (!isWorkspaceOwnerOrAdmin && !isProjectOwner) {
        const hasNonSelfAssignment = targetAssigneeIds.some(id => id !== session.user.id)
        if (hasNonSelfAssignment) {
          return NextResponse.json(
            { error: 'Members can only assign tasks to themselves unless they are project owners' },
            { status: 403 }
          )
        }
      }

      // Check if all assignees are members of the project's workspace
      const assigneeWorkspaceMembers = await db.workspaceMember.findMany({
        where: {
          userId: { in: targetAssigneeIds },
          workspaceId: projectWithWorkspace.workspaceId
        },
        select: { userId: true }
      })

      const validAssigneeIds = assigneeWorkspaceMembers.map(m => m.userId)
      const invalidAssigneeIds = targetAssigneeIds.filter(id => !validAssigneeIds.includes(id))

      if (invalidAssigneeIds.length > 0) {
        return NextResponse.json(
          { error: `Some assignees are not members of the project workspace: ${invalidAssigneeIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Use first assignee for legacy assigneeId field
    const finalAssigneeId = targetAssigneeIds.length > 0 ? targetAssigneeIds[0] : null

    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: finalAssigneeId,
        creatorId: session.user.id,
        priority: priority as Priority,
        status: TaskStatus.TODO,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
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
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    // Create multiple assignee records if we have multiple assignees
    if (targetAssigneeIds.length > 0) {
      await Promise.all(
        targetAssigneeIds.map(assigneeUserId =>
          db.taskAssignee.create({
            data: {
              taskId: task.id,
              userId: assigneeUserId,
              assignedBy: session.user.id
            }
          })
        )
      )
    }

    // Create notifications for all assignees (except creator)
    const nonCreatorAssignees = targetAssigneeIds.filter(id => id !== session.user.id)
    if (nonCreatorAssignees.length > 0) {
      try {
        await Promise.all(
          nonCreatorAssignees.map(assigneeUserId =>
            NotificationService.createTaskNotification(
              NotificationType.TASK_ASSIGNED,
              assigneeUserId,
              title,
              task.id,
              session.user.name || 'Someone'
            )
          )
        )
        console.log(`Task assignment notifications sent to ${nonCreatorAssignees.length} assignees`)
      } catch (error) {
        console.error('Failed to create task assignment notifications:', error)
        // Don't fail the task creation if notification fails
      }
    }

    // Create notification for task creator (self-notification for task creation confirmation)
    try {
      const createTaskNotification = {
        title: 'Task Created',
        message: `You created task "${title}"`,
        type: NotificationType.TASK_ASSIGNED, // Reuse existing type for now
        userId: session.user.id,
        relatedId: task.id,
        relatedUrl: `/tasks?id=${task.id}`,
        senderName: session.user.name || 'You'
      }
      
      await NotificationService.createNotification(createTaskNotification)
      console.log(`Task creation notification sent to creator ${session.user.id}`)
    } catch (error) {
      console.error('Failed to create task creation notification:', error)
      // Don't fail the task creation if notification fails
    }

    // Ensure notification count is synced after task creation
    try {
      await NotificationService.syncNotificationCountForUser(session.user.id)
      console.log(`Synced notification count for user ${session.user.id} after task creation`)
    } catch (error) {
      console.error('Failed to sync notification count after task creation:', error)
      // Don't fail the task creation if sync fails
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
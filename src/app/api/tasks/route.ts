import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, Priority, NotificationType } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleTasks, canUserPerformAction } from '@/lib/roles'
import { NotificationService } from '@/lib/notification-service'
import { taskCreateSchema, validateRequestBody } from '@/lib/validations'
import { 
  withErrorHandling, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ValidationError,
  withDatabase 
} from '@/lib/errors'
import { authenticatedApiRateLimit } from '@/lib/rate-limit'
import { log, createRequestLogger } from '@/lib/logger'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const requestLogger = createRequestLogger(request)
  
  // Apply rate limiting
  const rateLimitResponse = await authenticatedApiRateLimit(request)
  if (rateLimitResponse) {
    requestLogger.warn('Tasks GET rate limit exceeded')
    return rateLimitResponse
  }

  const session = await getAuthSession(request)
  
  if (!session) {
    throw new AuthenticationError()
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const workspaceId = searchParams.get('workspaceId')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')

  requestLogger.api('Fetching tasks', { 
    userId: session.user.id,
    projectId,
    workspaceId,
    filters: { status, priority, search }
  })

  // Get all accessible tasks for the user
  let tasks = await withDatabase(async () => {
    return getAccessibleTasks(session.user.id, projectId || undefined)
  }, 'get accessible tasks')
  
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

  requestLogger.api('Tasks fetched successfully', { 
    userId: session.user.id,
    taskCount: tasks.length
  })

  return NextResponse.json(tasks)
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestLogger = createRequestLogger(request)
  
  // Apply rate limiting
  const rateLimitResponse = await authenticatedApiRateLimit(request)
  if (rateLimitResponse) {
    requestLogger.warn('Tasks POST rate limit exceeded')
    return rateLimitResponse
  }

  const session = await getAuthSession(request)
  
  if (!session) {
    throw new AuthenticationError()
  }

  const body = await request.json()
  const validatedData = validateRequestBody(taskCreateSchema, body)
  const {
    title,
    description,
    projectId,
    assigneeId,
    assigneeIds,
    priority = 'MEDIUM',
    dueDate,
    tags = []
  } = validatedData

  requestLogger.api('Creating task', { 
    userId: session.user.id,
    projectId,
    title,
    assigneeCount: assigneeIds?.length || (assigneeId ? 1 : 0)
  })

  // Check if user can create tasks in this project
  const canCreateTask = await canUserPerformAction(session.user.id, projectId, 'canCreateTask')
  if (!canCreateTask) {
    throw new AuthorizationError('You do not have permission to create tasks in this project')
  }

  // Verify project exists and user has access
  const project = await withDatabase(async () => {
    return db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    })
  }, 'verify project access')

  if (!project) {
    throw new NotFoundError('Project')
  }

  // Get workspace and project information for permission checking
  const projectWithWorkspace = await withDatabase(async () => {
    return db.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true, ownerId: true }
    })
  }, 'get project workspace info')

  if (!projectWithWorkspace) {
    throw new NotFoundError('Project')
  }

  // Check user's role in workspace to determine assignment permissions
  const userWorkspaceMember = await withDatabase(async () => {
    return db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: projectWithWorkspace.workspaceId
        }
      }
    })
  }, 'get user workspace membership')

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
        throw new AuthorizationError('Members can only assign tasks to themselves unless they are project owners')
      }
    }

    // Check if all assignees are members of the project's workspace
    const assigneeWorkspaceMembers = await withDatabase(async () => {
      return db.workspaceMember.findMany({
        where: {
          userId: { in: targetAssigneeIds },
          workspaceId: projectWithWorkspace.workspaceId
        },
        select: { userId: true }
      })
    }, 'validate assignee workspace membership')

    const validAssigneeIds = assigneeWorkspaceMembers.map(m => m.userId)
    const invalidAssigneeIds = targetAssigneeIds.filter(id => !validAssigneeIds.includes(id))

    if (invalidAssigneeIds.length > 0) {
      throw new ValidationError(`Some assignees are not members of the project workspace: ${invalidAssigneeIds.join(', ')}`)
    }
  }

  // Use first assignee for legacy assigneeId field
  const finalAssigneeId = targetAssigneeIds.length > 0 ? targetAssigneeIds[0] : null

  // Create the task
  const task = await withDatabase(async () => {
    return db.task.create({
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
  }, 'create task')

  // Create multiple assignee records if we have multiple assignees
  if (targetAssigneeIds.length > 0) {
    await withDatabase(async () => {
      return Promise.all(
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
    }, 'create task assignees')
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
      requestLogger.info(`Task assignment notifications sent to ${nonCreatorAssignees.length} assignees`)
    } catch (error) {
      requestLogger.error('Failed to create task assignment notifications', error)
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
    requestLogger.info(`Task creation notification sent to creator`)
  } catch (error) {
    requestLogger.error('Failed to create task creation notification', error)
    // Don't fail the task creation if notification fails
  }

  // Ensure notification count is synced after task creation
  try {
    await NotificationService.syncNotificationCountForUser(session.user.id)
    requestLogger.info(`Synced notification count for user after task creation`)
  } catch (error) {
    requestLogger.error('Failed to sync notification count after task creation', error)
    // Don't fail the task creation if sync fails
  }

  requestLogger.task('Task created successfully', { 
    userId: session.user.id,
    taskId: task.id,
    projectId,
    assigneeCount: targetAssigneeIds.length
  })

  return NextResponse.json(task, { status: 201 })
})
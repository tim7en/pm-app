import { db } from '@/lib/db'
import { ProjectRole, TaskStatus, Priority, TaskVerificationStatus } from '@prisma/client'

/**
 * Get user's system role
 */
export async function getUserSystemRole(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  return user?.role || 'MEMBER'
}

/**
 * Get user's role in a specific project
 */
export async function getUserProjectRole(userId: string, projectId: string): Promise<ProjectRole | null> {
  // Check if user is the project owner
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  })
  
  if (project?.ownerId === userId) {
    return 'ADMIN'
  }
  
  // Check project membership
  const membership = await db.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    },
    select: { role: true }
  })
  
  return membership?.role || null
}

/**
 * Get all projects accessible to a user
 */
export async function getAccessibleProjects(userId: string) {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can see all projects
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return db.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }
  
  // Regular users can only see projects they own or are members of
  return db.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      _count: {
        select: {
          tasks: true,
          members: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

/**
 * Get all tasks accessible to a user
 */
export async function getAccessibleTasks(userId: string, projectId?: string) {
  const systemRole = await getUserSystemRole(userId)
  
  // Base query
  const baseWhere: any = {}
  
  // Filter by project if specified
  if (projectId) {
    baseWhere.projectId = projectId
  }
  
  const includeOptions = {
    assignee: {
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
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
    },
    tags: {
      select: {
        id: true,
        name: true,
        color: true
      }
    },
    subtasks: {
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    },
    comments: {
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' as const }
    },
    _count: {
      select: {
        comments: true,
        subtasks: true
      }
    }
  }
  
  // System admins can see all tasks
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return db.task.findMany({
      where: baseWhere,
      include: includeOptions,
      orderBy: { updatedAt: 'desc' }
    }).then(tasks => tasks.map(task => ({
      ...task,
      commentCount: task._count.comments,
      attachmentCount: 0, // Add when attachments are implemented
      subtaskCount: task._count.subtasks,
      completedSubtaskCount: task.subtasks.filter(st => st.isCompleted).length
    })))
  }
  
  // Regular users can only see tasks from projects they own or are members of
  return db.task.findMany({
    where: {
      ...baseWhere,
      project: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    },
    include: includeOptions,
    orderBy: { updatedAt: 'desc' }
  }).then(tasks => tasks.map(task => ({
    ...task,
    commentCount: task._count.comments,
    attachmentCount: 0, // Add when attachments are implemented
    subtaskCount: task._count.subtasks,
    completedSubtaskCount: task.subtasks.filter(st => st.isCompleted).length
  })))
}

/**
 * Check if user can perform a specific action in a project
 */
export async function canUserPerformAction(
  userId: string, 
  projectId: string, 
  action: 'canCreateTask' | 'canAssignTask' | 'canEditTask' | 'canDeleteTask' | 'canVerifyTask'
): Promise<boolean> {
  // Get user's system role
  const systemRole = await getUserSystemRole(userId)
  
  // System admins and owners can do everything
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get user's project role
  const projectRole = await getUserProjectRole(userId, projectId)
  
  // Project admin can do everything in the project
  if (projectRole === 'ADMIN') {
    return true
  }
  
  // Project manager permissions
  if (projectRole === 'MANAGER') {
    return true
  }
  
  // Officer permissions
  if (projectRole === 'OFFICER') {
    return ['canCreateTask', 'canEditTask'].includes(action)
  }
  
  // Member permissions
  if (projectRole === 'MEMBER') {
    return action === 'canCreateTask'
  }
  
  // Default: no permissions
  return false
}

/**
 * Check if user can verify tasks in a project
 */
export async function canUserVerifyTasks(userId: string, projectId: string): Promise<boolean> {
  // Get user's system role
  const systemRole = await getUserSystemRole(userId)
  
  // System admins and owners can verify tasks
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get user's project role
  const projectRole = await getUserProjectRole(userId, projectId)
  
  // Only project admins and managers can verify tasks
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

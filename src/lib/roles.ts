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
    select: { ownerId: true, workspaceId: true }
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
  
  if (membership) {
    return membership.role
  }
  
  // Check workspace membership - workspace members can participate in projects
  if (project?.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      },
      select: { role: true }
    })
    
    if (workspaceMember) {
      // Workspace owners and admins get ADMIN role in projects
      if (workspaceMember.role === 'OWNER') {
        return 'ADMIN'
      }
      if (workspaceMember.role === 'ADMIN') {
        return 'MANAGER'
      }
      // Regular workspace members get MEMBER role in projects
      return 'MEMBER'
    }
  }
  
  return null
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
        workspace: {
          select: {
            id: true,
            name: true
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
  
  // Get user's accessible workspaces
  const userWorkspaces = await db.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true }
  })
  
  const workspaceIds = userWorkspaces.map(w => w.workspaceId)
  
  // Regular users can see projects they own, are members of, or are in their accessible workspaces
  return db.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
        { workspaceId: { in: workspaceIds } }
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
      workspace: {
        select: {
          id: true,
          name: true
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
        color: true,
        workspaceId: true
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
  
  // Regular users can see tasks from projects they own, are members of, or are assigned to
  return db.task.findMany({
    where: {
      ...baseWhere,
      OR: [
        // Tasks assigned to the user
        { assigneeId: userId },
        // Tasks created by the user
        { creatorId: userId },
        // Tasks from projects they own or are members of
        {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          }
        }
      ]
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
 * Check if user can perform a specific action on a task
 */
export async function canUserPerformTaskAction(
  userId: string, 
  taskId: string, 
  action: 'canEditTask' | 'canDeleteTask'
): Promise<boolean> {
  // Get the task with project and assignee info
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // If user is the creator of the task, they can edit and delete it (highest priority)
  if (task.creatorId === userId) {
    return true
  }

  // If user is assigned to the task, they can edit it (but not delete it unless they created it)
  if (task.assigneeId === userId) {
    return action === 'canEditTask'
  }

  // Otherwise, use project-level permissions
  return canUserPerformAction(userId, task.project.id, action)
}

/**
 * Check if user can perform a specific action in a project
 */
export async function canUserPerformAction(
  userId: string, 
  projectId: string, 
  action: 'canCreateTask' | 'canAssignTask' | 'canEditTask' | 'canDeleteTask' | 'canVerifyTask'
): Promise<boolean> {
  // Get user's system role (workspace role)
  const systemRole = await getUserSystemRole(userId)
  
  // Get project info to check ownership
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Check if user is project owner
  const isProjectOwner = project.ownerId === userId

  // Check workspace role
  let workspaceRole: string | null = null
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    workspaceRole = workspaceMember?.role || null
  }
  
  // Workspace OWNER and ADMIN can do everything
  if (workspaceRole === 'OWNER' || workspaceRole === 'ADMIN') {
    return true
  }
  
  // Project owner can do everything in their project
  if (isProjectOwner) {
    return true
  }
  
  // Get user's project role
  const projectRole = await getUserProjectRole(userId, projectId)
  
  // Project admin can do everything in the project
  if (projectRole === 'ADMIN') {
    return true
  }
  
  // For task creation, workspace members can only create tasks in projects they own
  if (action === 'canCreateTask') {
    // Only project owners or workspace OWNER/ADMIN can create tasks
    return isProjectOwner || workspaceRole === 'OWNER' || workspaceRole === 'ADMIN'
  }
  
  // Project manager permissions
  if (projectRole === 'MANAGER') {
    return true
  }
  
  // Officer permissions
  if (projectRole === 'OFFICER') {
    return ['canEditTask'].includes(action)
  }
  
  // Member permissions - members can only edit tasks, not create them in projects they don't own
  if (projectRole === 'MEMBER') {
    return action === 'canEditTask'
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

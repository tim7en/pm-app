import { db } from '@/lib/db'
import { ProjectRole, TaskStatus, Priority, TaskVerificationStatus, Role } from '@/lib/prisma-mock'

// Permission types for fine-grained access control
export type SystemPermission = 
  | 'canCreateWorkspace'
  | 'canManageAllWorkspaces'
  | 'canViewAllProjects'
  | 'canManageAllProjects'
  | 'canViewAllTasks'
  | 'canManageAllTasks'
  | 'canManageSystemUsers'
  | 'canAccessAnalytics'
  | 'canManageIntegrations'

export type WorkspacePermission =
  | 'canViewWorkspace'
  | 'canEditWorkspace'
  | 'canDeleteWorkspace'
  | 'canManageWorkspaceMembers'
  | 'canInviteMembers'
  | 'canRemoveMembers'
  | 'canCreateProjects'
  | 'canViewAllWorkspaceProjects'
  | 'canManageWorkspaceSettings'

export type ProjectPermission =
  | 'canViewProject'
  | 'canEditProject'
  | 'canDeleteProject'
  | 'canManageProjectMembers'
  | 'canCreateTasks'
  | 'canAssignTasks'
  | 'canEditAllTasks'
  | 'canDeleteAllTasks'
  | 'canVerifyTasks'
  | 'canManageProjectSettings'

export type TaskPermission =
  | 'canViewTask'
  | 'canEditTask'
  | 'canDeleteTask'
  | 'canAssignTask'
  | 'canVerifyTask'
  | 'canComment'
  | 'canUploadAttachments'

export type MessagePermission =
  | 'canViewMessages'
  | 'canSendMessages'
  | 'canDeleteOwnMessages'
  | 'canDeleteAllMessages'
  | 'canManageChannels'

// Permission matrices for different roles
export const SYSTEM_PERMISSIONS: Record<Role, SystemPermission[]> = {
  OWNER: [
    'canCreateWorkspace',
    'canManageAllWorkspaces',
    'canViewAllProjects',
    'canManageAllProjects',
    'canViewAllTasks',
    'canManageAllTasks',
    'canManageSystemUsers',
    'canAccessAnalytics',
    'canManageIntegrations'
  ],
  ADMIN: [
    'canCreateWorkspace',
    'canManageAllWorkspaces',
    'canViewAllProjects',
    'canManageAllProjects',
    'canViewAllTasks',
    'canManageAllTasks',
    'canManageSystemUsers',
    'canAccessAnalytics',
    'canManageIntegrations'
  ],
  PROJECT_MANAGER: [
    'canCreateWorkspace',
    'canViewAllProjects',
    'canAccessAnalytics'
  ],
  PROJECT_OFFICER: [
    'canViewAllProjects',
    'canAccessAnalytics'
  ],
  MEMBER: [],
  GUEST: []
}

export const WORKSPACE_PERMISSIONS: Record<Role, WorkspacePermission[]> = {
  OWNER: [
    'canViewWorkspace',
    'canEditWorkspace',
    'canDeleteWorkspace',
    'canManageWorkspaceMembers',
    'canInviteMembers',
    'canRemoveMembers',
    'canCreateProjects',
    'canViewAllWorkspaceProjects',
    'canManageWorkspaceSettings'
  ],
  ADMIN: [
    'canViewWorkspace',
    'canEditWorkspace',
    'canManageWorkspaceMembers',
    'canInviteMembers',
    'canRemoveMembers',
    'canCreateProjects',
    'canViewAllWorkspaceProjects',
    'canManageWorkspaceSettings'
  ],
  PROJECT_MANAGER: [
    'canViewWorkspace',
    'canCreateProjects',
    'canViewAllWorkspaceProjects',
    'canInviteMembers'
  ],
  PROJECT_OFFICER: [
    'canViewWorkspace',
    'canViewAllWorkspaceProjects'
  ],
  MEMBER: [
    'canViewWorkspace',
    'canViewAllWorkspaceProjects'
  ],
  GUEST: [
    'canViewWorkspace'
  ]
}

export const PROJECT_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  ADMIN: [
    'canViewProject',
    'canEditProject',
    'canDeleteProject',
    'canManageProjectMembers',
    'canCreateTasks',
    'canAssignTasks',
    'canEditAllTasks',
    'canDeleteAllTasks',
    'canVerifyTasks',
    'canManageProjectSettings'
  ],
  MANAGER: [
    'canViewProject',
    'canEditProject',
    'canManageProjectMembers',
    'canCreateTasks',
    'canAssignTasks',
    'canEditAllTasks',
    'canDeleteAllTasks',
    'canVerifyTasks'
  ],
  OFFICER: [
    'canViewProject',
    'canCreateTasks',
    'canAssignTasks',
    'canEditAllTasks',
    'canVerifyTasks'
  ],
  MEMBER: [
    'canViewProject',
    'canCreateTasks'
  ],
  VIEWER: [
    'canViewProject'
  ]
}

// ============= COMPREHENSIVE ACCESS CONTROL SYSTEM =============

/**
 * Check if user has a specific system permission
 */
export async function hasSystemPermission(userId: string, permission: SystemPermission): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId) as Role
  return SYSTEM_PERMISSIONS[systemRole]?.includes(permission) || false
}

/**
 * Check if user has a specific workspace permission
 */
export async function hasWorkspacePermission(
  userId: string, 
  workspaceId: string, 
  permission: WorkspacePermission
): Promise<boolean> {
  // Get user's workspace role
  const workspaceMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    },
    select: { role: true }
  })

  if (!workspaceMember) {
    return false
  }

  return WORKSPACE_PERMISSIONS[workspaceMember.role]?.includes(permission) || false
}

/**
 * Check if user has a specific project permission
 */
export async function hasProjectPermission(
  userId: string, 
  projectId: string, 
  permission: ProjectPermission
): Promise<boolean> {
  const projectRole = await getUserProjectRole(userId, projectId)
  
  if (!projectRole) {
    return false
  }

  return PROJECT_PERMISSIONS[projectRole]?.includes(permission) || false
}

/**
 * Check if user has a specific task permission
 */
export async function hasTaskPermission(
  userId: string, 
  taskId: string, 
  permission: TaskPermission
): Promise<boolean> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      creatorId: true,
      assigneeId: true,
      projectId: true,
      project: {
        select: {
          id: true,
          ownerId: true,
          workspaceId: true
        }
      }
    }
  })

  if (!task) {
    return false
  }

  // Check if user is task creator or assignee for basic permissions
  const isTaskCreator = task.creatorId === userId
  const isTaskAssignee = task.assigneeId === userId

  // Basic task permissions based on relationship to task
  switch (permission) {
    case 'canViewTask':
      // Anyone with project access can view tasks
      return await hasProjectPermission(userId, task.projectId, 'canViewProject')
    
    case 'canEditTask':
      // Task creator, assignee, or project members with edit permission
      if (isTaskCreator || isTaskAssignee) return true
      return await hasProjectPermission(userId, task.projectId, 'canEditAllTasks')
    
    case 'canDeleteTask':
      // Only task creator or project members with delete permission
      if (isTaskCreator) return true
      return await hasProjectPermission(userId, task.projectId, 'canDeleteAllTasks')
    
    case 'canAssignTask':
      return await hasProjectPermission(userId, task.projectId, 'canAssignTasks')
    
    case 'canVerifyTask':
      return await hasProjectPermission(userId, task.projectId, 'canVerifyTasks')
    
    case 'canComment':
      // Anyone who can view the task can comment
      return await hasTaskPermission(userId, taskId, 'canViewTask')
    
    case 'canUploadAttachments':
      // Task creator, assignee, or project members
      if (isTaskCreator || isTaskAssignee) return true
      return await hasProjectPermission(userId, task.projectId, 'canViewProject')
    
    default:
      return false
  }
}

/**
 * Check if user has message permissions in a workspace
 */
export async function hasMessagePermission(
  userId: string, 
  workspaceId: string, 
  permission: MessagePermission
): Promise<boolean> {
  // Check if user is a member of the workspace
  const workspaceMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    },
    select: { role: true }
  })

  if (!workspaceMember) {
    return false
  }

  const role = workspaceMember.role

  switch (permission) {
    case 'canViewMessages':
      // All workspace members can view messages
      return true
    
    case 'canSendMessages':
      // All workspace members except guests can send messages
      return role !== 'GUEST'
    
    case 'canDeleteOwnMessages':
      // All workspace members can delete their own messages
      return role !== 'GUEST'
    
    case 'canDeleteAllMessages':
      // Only workspace owners and admins can delete all messages
      return role === 'OWNER' || role === 'ADMIN'
    
    case 'canManageChannels':
      // Only workspace owners and admins can manage channels
      return role === 'OWNER' || role === 'ADMIN'
    
    default:
      return false
  }
}

/**
 * Get user's workspace role
 */
export async function getUserWorkspaceRole(userId: string, workspaceId: string): Promise<Role | null> {
  const workspaceMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    },
    select: { role: true }
  })

  return workspaceMember?.role || null
}

/**
 * Check if user can access a specific workspace
 */
export async function canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  return await hasWorkspacePermission(userId, workspaceId, 'canViewWorkspace')
}

/**
 * Check if user can access a specific project
 */
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  return await hasProjectPermission(userId, projectId, 'canViewProject')
}

/**
 * Check if user can access a specific task
 */
export async function canAccessTask(userId: string, taskId: string): Promise<boolean> {
  return await hasTaskPermission(userId, taskId, 'canViewTask')
}

/**
 * Get all accessible workspaces for a user
 */
export async function getAccessibleWorkspaces(userId: string) {
  const userWorkspaces = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  })

  return userWorkspaces.map(member => ({
    ...member.workspace,
    role: member.role,
    joinedAt: member.joinedAt
  }))
}

/**
 * Bulk permission check for multiple resources
 */
export async function checkMultiplePermissions(
  userId: string,
  checks: Array<{
    type: 'system'
    permission: SystemPermission
  } | {
    type: 'workspace'
    workspaceId: string
    permission: WorkspacePermission
  } | {
    type: 'project'
    projectId: string
    permission: ProjectPermission
  } | {
    type: 'task'
    taskId: string
    permission: TaskPermission
  }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  for (const check of checks) {
    let key: string
    let hasPermission: boolean

    switch (check.type) {
      case 'system':
        key = `system:${check.permission}`
        hasPermission = await hasSystemPermission(userId, check.permission)
        break
      
      case 'workspace':
        key = `workspace:${check.workspaceId}:${check.permission}`
        hasPermission = await hasWorkspacePermission(userId, check.workspaceId, check.permission)
        break
      
      case 'project':
        key = `project:${check.projectId}:${check.permission}`
        hasPermission = await hasProjectPermission(userId, check.projectId, check.permission)
        break
      
      case 'task':
        key = `task:${check.taskId}:${check.permission}`
        hasPermission = await hasTaskPermission(userId, check.taskId, check.permission)
        break
      
      default:
        key = 'unknown'
        hasPermission = false
    }

    results[key] = hasPermission
  }

  return results
}

// ============= EXISTING FUNCTIONS (UPDATED) =============

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
 * Get all projects accessible to a user (filtered for invited members)
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

  // For PROJECT_MANAGER and PROJECT_OFFICER roles, show projects they have access to
  if (systemRole === 'PROJECT_MANAGER' || systemRole === 'PROJECT_OFFICER') {
    // Get user's workspace memberships
    const userWorkspaces = await db.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true }
    })
    
    const workspaceIds = userWorkspaces.map(w => w.workspaceId)
    
    return db.project.findMany({
      where: {
        OR: [
          // Projects they own
          { ownerId: userId },
          // Projects they are explicitly members of
          { members: { some: { userId } } },
          // For workspace owners/admins, show all workspace projects
          { 
            AND: [
              { workspaceId: { in: workspaceIds } },
              {
                workspace: {
                  members: {
                    some: {
                      userId,
                      role: { in: ['OWNER', 'ADMIN'] }
                    }
                  }
                }
              }
            ]
          }
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
  
  // For invited members (MEMBER, GUEST), only show projects where they have assigned tasks or own projects
  return db.project.findMany({
    where: {
      OR: [
        // Projects they own (in case they own a project but have MEMBER role)
        { ownerId: userId },
        // Projects that have tasks assigned to them (legacy single assignee)
        { tasks: { some: { assigneeId: userId } } },
        // Projects that have tasks assigned to them (new multi-assignee) - TODO: Fix this once assignees relation is working
        // { tasks: { some: { assignees: { some: { userId: userId } } } } },
        // Projects that have tasks created by them
        { tasks: { some: { creatorId: userId } } }
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
 * Get all tasks accessible to a user (filtered for invited members)
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

  // For PROJECT_MANAGER and PROJECT_OFFICER roles, show tasks from projects they have access to
  if (systemRole === 'PROJECT_MANAGER' || systemRole === 'PROJECT_OFFICER') {
    return db.task.findMany({
      where: {
        ...baseWhere,
        OR: [
          // Tasks assigned to the user (legacy single assignee)
          { assigneeId: userId },
          // Tasks assigned to the user (new multi-assignee)
          { assignees: { some: { userId } } },
          // Tasks created by the user
          { creatorId: userId },
          // Tasks from projects they own
          { project: { ownerId: userId } },
          // Tasks from projects they are explicitly members of
          { project: { members: { some: { userId } } } },
          // Tasks from projects in workspaces where they are owners/admins
          {
            project: {
              workspace: {
                members: {
                  some: {
                    userId,
                    role: { in: ['OWNER', 'ADMIN'] }
                  }
                }
              }
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

  // For invited members (MEMBER, GUEST), only show tasks they are directly involved with
  return db.task.findMany({
    where: {
      ...baseWhere,
      OR: [
        // Tasks assigned to the user (legacy single assignee)
        { assigneeId: userId },
        // Tasks assigned to the user (new multi-assignee)
        { assignees: { some: { userId } } },
        // Tasks created by the user
        { creatorId: userId },
        // Tasks from projects they own (in case they own a project but have MEMBER role)
        { project: { ownerId: userId } }
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
      },
      assignees: {
        select: { userId: true }
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

  // If user is assigned to the task (legacy single assignee or multi-assignee), they can edit it (but not delete it unless they created it)
  const isAssigned = task.assigneeId === userId || task.assignees.some(assignee => assignee.userId === userId)
  if (action === 'canEditTask' && isAssigned) {
    return true
  }

  // Check project-level permissions
  const projectPermission = await canUserPerformAction(userId, task.project.id, action)
  return projectPermission
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

// ============= PROJECT PERMISSIONS =============

/**
 * Check if user can view a specific project
 */
export async function canViewProject(userId: string, projectId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can view all projects
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get project info
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Project owner can always view
  if (project.ownerId === userId) {
    return true
  }

  // Check workspace membership
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    
    // Workspace members can view projects in their workspace
    if (workspaceMember) {
      return true
    }
  }

  // Check if user is a project member
  const projectMember = await db.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  })

  if (projectMember) {
    return true
  }

  // Check if user has any tasks in this project
  const userTasks = await db.task.findFirst({
    where: {
      projectId,
      OR: [
        { assigneeId: userId },
        { creatorId: userId }
      ]
    }
  })

  return !!userTasks
}

/**
 * Check if user can create projects in a workspace
 */
export async function canCreateProject(userId: string, workspaceId?: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can create projects anywhere
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }

  // If no workspace specified, check if user has any workspace membership
  if (!workspaceId) {
    const userWorkspace = await db.workspaceMember.findFirst({
      where: { userId }
    })
    return !!userWorkspace
  }

  // Check workspace membership and role
  const workspaceMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    }
  })

  if (!workspaceMember) {
    return false
  }

  // Workspace owners and admins can create projects
  if (workspaceMember.role === 'OWNER' || workspaceMember.role === 'ADMIN') {
    return true
  }

  // Regular members can also create projects (business rule)
  return workspaceMember.role === 'MEMBER'
}

/**
 * Check if user can edit a specific project
 */
export async function canEditProject(userId: string, projectId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can edit all projects
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get project info
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Project owner can edit
  if (project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can edit projects
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role
  const projectRole = await getUserProjectRole(userId, projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

/**
 * Check if user can delete a specific project
 */
export async function canDeleteProject(userId: string, projectId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can delete all projects
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get project info
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Only project owner can delete
  if (project.ownerId === userId) {
    return true
  }

  // Check workspace role - only workspace owners can delete projects
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    
    return workspaceMember?.role === 'OWNER'
  }

  return false
}

/**
 * Check if user can manage project members (add/remove/change roles)
 */
export async function canManageProjectMembers(userId: string, projectId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can manage all project members
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get project info
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Project owner can manage members
  if (project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can manage project members
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role - only admins and managers can manage members
  const projectRole = await getUserProjectRole(userId, projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

// ============= TASK PERMISSIONS =============

/**
 * Check if user can view a specific task
 */
export async function canViewTask(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can view all tasks
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Task creator or assignee can view
  if (task.creatorId === userId || task.assigneeId === userId) {
    return true
  }

  // Project owner can view all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check if user can view the project (this includes workspace membership checks)
  return canViewProject(userId, task.projectId)
}

/**
 * Check if user can create tasks in a project
 */
export async function canCreateTask(userId: string, projectId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can create tasks anywhere
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get project info
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, workspaceId: true }
  })

  if (!project) {
    return false
  }

  // Project owner can create tasks
  if (project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can create tasks
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role
  const projectRole = await getUserProjectRole(userId, projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER' || projectRole === 'MEMBER'
}

/**
 * Check if user can edit a specific task
 */
export async function canEditTask(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can edit all tasks
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Task creator can edit
  if (task.creatorId === userId) {
    return true
  }

  // Task assignee can edit
  if (task.assigneeId === userId) {
    return true
  }

  // Project owner can edit all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (task.project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can edit tasks
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role
  const projectRole = await getUserProjectRole(userId, task.projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

/**
 * Check if user can delete a specific task
 */
export async function canDeleteTask(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can delete all tasks
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Only task creator can delete their own tasks
  if (task.creatorId === userId) {
    return true
  }

  // Project owner can delete all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check workspace role - only workspace owners can delete any task
  if (task.project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId
        }
      }
    })
    
    if (workspaceMember?.role === 'OWNER') {
      return true
    }
  }

  // Check project role - only project admins can delete tasks
  const projectRole = await getUserProjectRole(userId, task.projectId)
  return projectRole === 'ADMIN'
}

/**
 * Check if user can assign/unassign a specific task
 */
export async function canAssignTask(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can assign any task
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Task creator can assign
  if (task.creatorId === userId) {
    return true
  }

  // Project owner can assign all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (task.project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can assign tasks
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role
  const projectRole = await getUserProjectRole(userId, task.projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

/**
 * Check if user can change task status
 */
export async function canChangeTaskStatus(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can change any task status
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Task creator or assignee can change status
  if (task.creatorId === userId || task.assigneeId === userId) {
    return true
  }

  // Project owner can change status of all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (task.project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can change task status
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role
  const projectRole = await getUserProjectRole(userId, task.projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER' || projectRole === 'MEMBER'
}

/**
 * Check if user can verify/approve a specific task
 */
export async function canVerifyTask(userId: string, taskId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId)
  
  // System admins can verify any task
  if (systemRole === 'ADMIN' || systemRole === 'OWNER') {
    return true
  }
  
  // Get task info
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { 
      assigneeId: true, 
      creatorId: true, 
      projectId: true,
      project: {
        select: { ownerId: true, workspaceId: true }
      }
    }
  })

  if (!task) {
    return false
  }

  // Task assignee cannot verify their own task (business rule)
  if (task.assigneeId === userId) {
    return false
  }

  // Project owner can verify all tasks in their project
  if (task.project.ownerId === userId) {
    return true
  }

  // Check workspace role
  if (task.project.workspaceId) {
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId
        }
      }
    })
    
    // Workspace owners and admins can verify tasks
    if (workspaceMember?.role === 'OWNER' || workspaceMember?.role === 'ADMIN') {
      return true
    }
  }

  // Check project role - only admins and managers can verify tasks
  const projectRole = await getUserProjectRole(userId, task.projectId)
  return projectRole === 'ADMIN' || projectRole === 'MANAGER'
}

// ============= UTILITY FUNCTIONS =============

/**
 * Get user's effective permissions for a project
 */
export async function getUserProjectPermissions(userId: string, projectId: string) {
  const [
    canView,
    canEdit,
    canDelete,
    canManageMembers,
    canCreateTasks,
  ] = await Promise.all([
    canViewProject(userId, projectId),
    canEditProject(userId, projectId),
    canDeleteProject(userId, projectId),
    canManageProjectMembers(userId, projectId),
    canCreateTask(userId, projectId),
  ])

  return {
    canView,
    canEdit,
    canDelete,
    canManageMembers,
    canCreateTasks,
  }
}

/**
 * Get user's effective permissions for a task
 */
export async function getUserTaskPermissions(userId: string, taskId: string) {
  const [
    canView,
    canEdit,
    canDelete,
    canAssign,
    canChangeStatus,
    canVerify,
  ] = await Promise.all([
    canViewTask(userId, taskId),
    canEditTask(userId, taskId),
    canDeleteTask(userId, taskId),
    canAssignTask(userId, taskId),
    canChangeTaskStatus(userId, taskId),
    canVerifyTask(userId, taskId),
  ])

  return {
    canView,
    canEdit,
    canDelete,
    canAssign,
    canChangeStatus,
    canVerify,
  }
}

// ============= ADMINISTRATIVE UTILITY FUNCTIONS =============

/**
 * Check if user is a system administrator
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const systemRole = await getUserSystemRole(userId) as Role
  return systemRole === 'ADMIN' || systemRole === 'OWNER'
}

/**
 * Check if user is a workspace administrator
 */
export async function isWorkspaceAdmin(userId: string, workspaceId: string): Promise<boolean> {
  const workspaceRole = await getUserWorkspaceRole(userId, workspaceId)
  return workspaceRole === 'ADMIN' || workspaceRole === 'OWNER'
}

/**
 * Check if user is a project administrator
 */
export async function isProjectAdmin(userId: string, projectId: string): Promise<boolean> {
  const projectRole = await getUserProjectRole(userId, projectId)
  return projectRole === 'ADMIN'
}

/**
 * Get user's effective permissions for a workspace (including inherited permissions)
 */
export async function getUserEffectiveWorkspacePermissions(
  userId: string, 
  workspaceId: string
): Promise<{
  systemPermissions: SystemPermission[]
  workspacePermissions: WorkspacePermission[]
  isSystemAdmin: boolean
  isWorkspaceAdmin: boolean
}> {
  const systemRole = await getUserSystemRole(userId) as Role
  const workspaceRole = await getUserWorkspaceRole(userId, workspaceId)

  const systemPermissions = SYSTEM_PERMISSIONS[systemRole] || []
  const workspacePermissions = workspaceRole ? WORKSPACE_PERMISSIONS[workspaceRole] || [] : []

  return {
    systemPermissions,
    workspacePermissions,
    isSystemAdmin: systemRole === 'ADMIN' || systemRole === 'OWNER',
    isWorkspaceAdmin: workspaceRole === 'ADMIN' || workspaceRole === 'OWNER'
  }
}

/**
 * Get user's effective permissions for a project (including inherited permissions)
 */
export async function getUserEffectiveProjectPermissions(
  userId: string, 
  projectId: string
): Promise<{
  systemPermissions: SystemPermission[]
  workspacePermissions: WorkspacePermission[]
  projectPermissions: ProjectPermission[]
  isSystemAdmin: boolean
  isWorkspaceAdmin: boolean
  isProjectAdmin: boolean
}> {
  // Get project workspace
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true }
  })

  if (!project?.workspaceId) {
    throw new Error('Project not found or has no workspace')
  }

  const workspacePermissions = await getUserEffectiveWorkspacePermissions(userId, project.workspaceId)
  const projectRole = await getUserProjectRole(userId, projectId)
  const projectPermissions = projectRole ? PROJECT_PERMISSIONS[projectRole] || [] : []

  return {
    ...workspacePermissions,
    projectPermissions,
    isProjectAdmin: projectRole === 'ADMIN'
  }
}

/**
 * Check if user can manage another user (for user management operations)
 */
export async function canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
  // System admins can manage all users
  if (await isSystemAdmin(managerId)) {
    return true
  }

  // Users cannot manage themselves through this function
  if (managerId === targetUserId) {
    return false
  }

  // Check if both users are in the same workspace and manager has admin role
  const managerWorkspaces = await getAccessibleWorkspaces(managerId)
  const targetUserWorkspaces = await getAccessibleWorkspaces(targetUserId)

  for (const managerWs of managerWorkspaces) {
    for (const targetWs of targetUserWorkspaces) {
      if (managerWs.id === targetWs.id) {
        // If manager is workspace admin and target is not system admin, allow management
        const isManagerWsAdmin = managerWs.role === 'ADMIN' || managerWs.role === 'OWNER'
        const isTargetSystemAdmin = await isSystemAdmin(targetUserId)
        
        if (isManagerWsAdmin && !isTargetSystemAdmin) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Get all users that a user can manage
 */
export async function getManageableUsers(managerId: string) {
  if (await isSystemAdmin(managerId)) {
    // System admins can manage all users
    return db.user.findMany({
      where: {
        id: { not: managerId } // Exclude self
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    })
  }

  // Get workspaces where user is admin
  const adminWorkspaces = await db.workspaceMember.findMany({
    where: {
      userId: managerId,
      role: { in: ['ADMIN', 'OWNER'] }
    },
    select: { workspaceId: true }
  })

  const workspaceIds = adminWorkspaces.map(w => w.workspaceId)

  if (workspaceIds.length === 0) {
    return []
  }

  // Get all users in those workspaces (excluding system admins and self)
  return db.user.findMany({
    where: {
      AND: [
        { id: { not: managerId } },
        { role: { notIn: ['ADMIN', 'OWNER'] } },
        {
          workspaceMembers: {
            some: {
              workspaceId: { in: workspaceIds }
            }
          }
        }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      workspaceMembers: {
        where: {
          workspaceId: { in: workspaceIds }
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })
}

/**
 * Validate role hierarchy for role changes
 */
export async function canChangeUserRole(
  changerId: string, 
  targetUserId: string, 
  newRole: Role,
  context: { type: 'system' } | { type: 'workspace', workspaceId: string }
): Promise<{ allowed: boolean; reason?: string }> {
  // System role changes
  if (context.type === 'system') {
    const changerSystemRole = await getUserSystemRole(changerId) as Role
    
    // Only system owners can change system roles
    if (changerSystemRole !== 'OWNER') {
      return { allowed: false, reason: 'Only system owners can change system roles' }
    }

    // Cannot change own role
    if (changerId === targetUserId) {
      return { allowed: false, reason: 'Cannot change your own system role' }
    }

    // Cannot elevate to OWNER
    if (newRole === 'OWNER') {
      return { allowed: false, reason: 'Cannot create additional system owners' }
    }

    return { allowed: true }
  }

  // Workspace role changes
  if (context.type === 'workspace') {
    const changerWorkspaceRole = await getUserWorkspaceRole(changerId, context.workspaceId)
    const targetCurrentRole = await getUserWorkspaceRole(targetUserId, context.workspaceId)

    // Must be workspace owner to change roles
    if (changerWorkspaceRole !== 'OWNER') {
      return { allowed: false, reason: 'Only workspace owners can change member roles' }
    }

    // Cannot change own role
    if (changerId === targetUserId) {
      return { allowed: false, reason: 'Cannot change your own role' }
    }

    // Cannot change role of system admins
    if (await isSystemAdmin(targetUserId)) {
      return { allowed: false, reason: 'Cannot change role of system administrators' }
    }

    return { allowed: true }
  }

  return { allowed: false, reason: 'Invalid context' }
}

// ============= PERMISSION MIDDLEWARE HELPERS =============

/**
 * Create a permission checker for API routes
 */
export function createPermissionChecker(
  type: 'system',
  permission: SystemPermission
): (userId: string) => Promise<boolean>

export function createPermissionChecker(
  type: 'workspace',
  permission: WorkspacePermission
): (userId: string, workspaceId: string) => Promise<boolean>

export function createPermissionChecker(
  type: 'project',
  permission: ProjectPermission
): (userId: string, projectId: string) => Promise<boolean>

export function createPermissionChecker(
  type: 'task',
  permission: TaskPermission
): (userId: string, taskId: string) => Promise<boolean>

export function createPermissionChecker(type: any, permission: any) {
  switch (type) {
    case 'system':
      return (userId: string) => hasSystemPermission(userId, permission)
    case 'workspace':
      return (userId: string, workspaceId: string) => hasWorkspacePermission(userId, workspaceId, permission)
    case 'project':
      return (userId: string, projectId: string) => hasProjectPermission(userId, projectId, permission)
    case 'task':
      return (userId: string, taskId: string) => hasTaskPermission(userId, taskId, permission)
    default:
      throw new Error(`Unknown permission type: ${type}`)
  }
}

/**
 * Permission check decorator for API routes
 */
export function requirePermission(
  checker: (userId: string, ...args: any[]) => Promise<boolean>
) {
  return async (userId: string, ...args: any[]): Promise<{ allowed: boolean; error?: string }> => {
    try {
      const allowed = await checker(userId, ...args)
      return { allowed }
    } catch (error) {
      return { 
        allowed: false, 
        error: error instanceof Error ? error.message : 'Permission check failed' 
      }
    }
  }
}

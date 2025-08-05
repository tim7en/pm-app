import { useState, useEffect } from 'react'
import { useAPI } from './use-api'

export interface ProjectPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canManageMembers: boolean
  canCreateTasks: boolean
}

export interface TaskPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canAssign: boolean
  canChangeStatus: boolean
  canVerify: boolean
}

export interface WorkspacePermissions {
  canCreateProject: boolean
}

export interface PermissionCheckOptions {
  projectId?: string
  taskId?: string
  workspaceId?: string
}

/**
 * Hook to check user permissions for projects and tasks
 */
export function usePermissions(options: PermissionCheckOptions = {}) {
  const { apiCall } = useAPI()
  const [permissions, setPermissions] = useState<{
    project?: ProjectPermissions
    task?: TaskPermissions
    workspace?: WorkspacePermissions
  }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (options.projectId || options.taskId || options.workspaceId) {
      fetchPermissions()
    }
  }, [options.projectId, options.taskId, options.workspaceId])

  const fetchPermissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (options.projectId) searchParams.set('projectId', options.projectId)
      if (options.taskId) searchParams.set('taskId', options.taskId)
      if (options.workspaceId) searchParams.set('workspaceId', options.workspaceId)

      const response = await apiCall(`/api/permissions?${searchParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch permissions')
      }
    } catch (err) {
      setError('Network error while fetching permissions')
      console.error('Permission fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check a specific permission
   */
  const checkPermission = async (
    type: 'project' | 'task',
    action: string,
    resourceId?: string,
    workspaceId?: string
  ): Promise<boolean> => {
    try {
      const response = await apiCall('/api/permissions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          action,
          resourceId,
          workspaceId
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.allowed
      }
    } catch (err) {
      console.error('Permission check error:', err)
    }
    return false
  }

  /**
   * Check if user can view project
   */
  const canViewProject = async (projectId: string): Promise<boolean> => {
    return checkPermission('project', 'view', projectId)
  }

  /**
   * Check if user can create project in workspace
   */
  const canCreateProject = async (workspaceId?: string): Promise<boolean> => {
    return checkPermission('project', 'create', undefined, workspaceId)
  }

  /**
   * Check if user can edit project
   */
  const canEditProject = async (projectId: string): Promise<boolean> => {
    return checkPermission('project', 'edit', projectId)
  }

  /**
   * Check if user can delete project
   */
  const canDeleteProject = async (projectId: string): Promise<boolean> => {
    return checkPermission('project', 'delete', projectId)
  }

  /**
   * Check if user can manage project members
   */
  const canManageProjectMembers = async (projectId: string): Promise<boolean> => {
    return checkPermission('project', 'manageMembers', projectId)
  }

  /**
   * Check if user can create tasks in project
   */
  const canCreateTaskInProject = async (projectId: string): Promise<boolean> => {
    return checkPermission('project', 'createTask', projectId)
  }

  /**
   * Check if user can view task
   */
  const canViewTask = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'view', taskId)
  }

  /**
   * Check if user can edit task
   */
  const canEditTask = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'edit', taskId)
  }

  /**
   * Check if user can delete task
   */
  const canDeleteTask = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'delete', taskId)
  }

  /**
   * Check if user can assign task
   */
  const canAssignTask = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'assign', taskId)
  }

  /**
   * Check if user can change task status
   */
  const canChangeTaskStatus = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'changeStatus', taskId)
  }

  /**
   * Check if user can verify task
   */
  const canVerifyTask = async (taskId: string): Promise<boolean> => {
    return checkPermission('task', 'verify', taskId)
  }

  /**
   * Refresh permissions for current resources
   */
  const refreshPermissions = () => {
    if (options.projectId || options.taskId || options.workspaceId) {
      fetchPermissions()
    }
  }

  return {
    permissions,
    loading,
    error,
    refreshPermissions,
    
    // Project permission checks
    canViewProject,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageProjectMembers,
    canCreateTaskInProject,
    
    // Task permission checks
    canViewTask,
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canChangeTaskStatus,
    canVerifyTask,
    
    // Direct access to permission objects
    projectPermissions: permissions.project,
    taskPermissions: permissions.task,
    workspacePermissions: permissions.workspace,
  }
}

/**
 * Hook for project-specific permissions
 */
export function useProjectPermissions(projectId?: string) {
  const { permissions, loading, error, refreshPermissions, ...methods } = usePermissions({ 
    projectId 
  })

  return {
    permissions: permissions.project,
    loading,
    error,
    refreshPermissions,
    canView: permissions.project?.canView ?? false,
    canEdit: permissions.project?.canEdit ?? false,
    canDelete: permissions.project?.canDelete ?? false,
    canManageMembers: permissions.project?.canManageMembers ?? false,
    canCreateTasks: permissions.project?.canCreateTasks ?? false,
    ...methods,
  }
}

/**
 * Hook for task-specific permissions
 */
export function useTaskPermissions(taskId?: string) {
  const { permissions, loading, error, refreshPermissions, ...methods } = usePermissions({ 
    taskId 
  })

  return {
    permissions: permissions.task,
    loading,
    error,
    refreshPermissions,
    canView: permissions.task?.canView ?? false,
    canEdit: permissions.task?.canEdit ?? false,
    canDelete: permissions.task?.canDelete ?? false,
    canAssign: permissions.task?.canAssign ?? false,
    canChangeStatus: permissions.task?.canChangeStatus ?? false,
    canVerify: permissions.task?.canVerify ?? false,
    ...methods,
  }
}

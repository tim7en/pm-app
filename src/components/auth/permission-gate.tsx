import React, { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGateProps {
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
  
  // Project permissions
  projectId?: string
  requireProjectPermission?: 'view' | 'edit' | 'delete' | 'manageMembers' | 'createTasks'
  
  // Task permissions  
  taskId?: string
  requireTaskPermission?: 'view' | 'edit' | 'delete' | 'assign' | 'changeStatus' | 'verify'
  
  // Workspace permissions
  workspaceId?: string
  requireWorkspacePermission?: 'createProject'
  
  // Custom permission check
  customCheck?: () => Promise<boolean> | boolean
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGate({
  children,
  fallback = null,
  loading: loadingComponent = null,
  projectId,
  requireProjectPermission,
  taskId,
  requireTaskPermission,
  workspaceId,
  requireWorkspacePermission,
  customCheck
}: PermissionGateProps) {
  const { permissions, loading } = usePermissions({
    projectId: requireProjectPermission ? projectId : undefined,
    taskId: requireTaskPermission ? taskId : undefined,
    workspaceId: requireWorkspacePermission ? workspaceId : undefined,
  })

  // Show loading state
  if (loading && loadingComponent) {
    return <>{loadingComponent}</>
  }

  // Check project permissions
  if (requireProjectPermission && projectId) {
    const hasPermission = permissions.project?.[`can${requireProjectPermission.charAt(0).toUpperCase() + requireProjectPermission.slice(1)}`]
    if (!hasPermission) {
      return <>{fallback}</>
    }
  }

  // Check task permissions
  if (requireTaskPermission && taskId) {
    const hasPermission = permissions.task?.[`can${requireTaskPermission.charAt(0).toUpperCase() + requireTaskPermission.slice(1)}`]
    if (!hasPermission) {
      return <>{fallback}</>
    }
  }

  // Check workspace permissions
  if (requireWorkspacePermission && workspaceId) {
    const hasPermission = permissions.workspace?.[`can${requireWorkspacePermission.charAt(0).toUpperCase() + requireWorkspacePermission.slice(1)}`]
    if (!hasPermission) {
      return <>{fallback}</>
    }
  }

  // Custom permission check (not implemented in this simple version)
  if (customCheck) {
    // Would need to handle async checks properly
    console.warn('Custom permission checks not yet implemented in PermissionGate')
  }

  return <>{children}</>
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<PermissionGateProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate {...permissionConfig}>
        <Component {...props} />
      </PermissionGate>
    )
  }
}

/**
 * Hook for conditional permission-based logic
 */
export function usePermissionCheck(config: {
  projectId?: string
  taskId?: string
  workspaceId?: string
}) {
  const { permissions, loading, error } = usePermissions(config)

  const hasProjectPermission = (permission: keyof NonNullable<typeof permissions.project>) => {
    return permissions.project?.[permission] ?? false
  }

  const hasTaskPermission = (permission: keyof NonNullable<typeof permissions.task>) => {
    return permissions.task?.[permission] ?? false
  }

  const hasWorkspacePermission = (permission: keyof NonNullable<typeof permissions.workspace>) => {
    return permissions.workspace?.[permission] ?? false
  }

  return {
    permissions,
    loading,
    error,
    hasProjectPermission,
    hasTaskPermission,
    hasWorkspacePermission,
  }
}

// Example usage components

/**
 * Renders children only if user can edit the project
 */
export function ProjectEditGate({ 
  projectId, 
  children, 
  fallback 
}: { 
  projectId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      projectId={projectId}
      requireProjectPermission="edit"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Renders children only if user can delete the project
 */
export function ProjectDeleteGate({ 
  projectId, 
  children, 
  fallback 
}: { 
  projectId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      projectId={projectId}
      requireProjectPermission="delete"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Renders children only if user can manage project members
 */
export function ProjectMemberManagementGate({ 
  projectId, 
  children, 
  fallback 
}: { 
  projectId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      projectId={projectId}
      requireProjectPermission="manageMembers"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Renders children only if user can edit the task
 */
export function TaskEditGate({ 
  taskId, 
  children, 
  fallback 
}: { 
  taskId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      taskId={taskId}
      requireTaskPermission="edit"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Renders children only if user can assign the task
 */
export function TaskAssignGate({ 
  taskId, 
  children, 
  fallback 
}: { 
  taskId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      taskId={taskId}
      requireTaskPermission="assign"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Renders children only if user can verify the task
 */
export function TaskVerifyGate({ 
  taskId, 
  children, 
  fallback 
}: { 
  taskId: string
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <PermissionGate
      taskId={taskId}
      requireTaskPermission="verify"
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}

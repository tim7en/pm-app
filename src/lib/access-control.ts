import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import {
  hasSystemPermission,
  hasWorkspacePermission,
  hasProjectPermission,
  hasTaskPermission,
  SystemPermission,
  WorkspacePermission,
  ProjectPermission,
  TaskPermission,
  canAccessWorkspace,
  canAccessProject,
  canAccessTask,
  isSystemAdmin,
  isWorkspaceAdmin,
  isProjectAdmin
} from '@/lib/roles'

// ============= API MIDDLEWARE =============

/**
 * Middleware to check system permissions
 */
export function requireSystemPermission(permission: SystemPermission) {
  return async (request: NextRequest) => {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const hasPermission = await hasSystemPermission(session.user.id, permission)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Middleware to check workspace permissions
 */
export function requireWorkspacePermission(permission: WorkspacePermission) {
  return async (request: NextRequest, workspaceId: string) => {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const hasPermission = await hasWorkspacePermission(session.user.id, workspaceId, permission)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Middleware to check project permissions
 */
export function requireProjectPermission(permission: ProjectPermission) {
  return async (request: NextRequest, projectId: string) => {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const hasPermission = await hasProjectPermission(session.user.id, projectId, permission)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient project permissions' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Middleware to check task permissions
 */
export function requireTaskPermission(permission: TaskPermission) {
  return async (request: NextRequest, taskId: string) => {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const hasPermission = await hasTaskPermission(session.user.id, taskId, permission)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient task permissions' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

// ============= ACCESS CONTROL HELPERS =============

/**
 * Get user session and check basic authentication
 */
export async function requireAuth(request: NextRequest) {
  const session = await getAuthSession(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }

  return session
}

/**
 * Check workspace access with detailed error messages
 */
export async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const hasAccess = await canAccessWorkspace(userId, workspaceId)
  
  if (!hasAccess) {
    throw new Error('You do not have access to this workspace')
  }

  return true
}

/**
 * Check project access with detailed error messages
 */
export async function checkProjectAccess(userId: string, projectId: string) {
  const hasAccess = await canAccessProject(userId, projectId)
  
  if (!hasAccess) {
    throw new Error('You do not have access to this project')
  }

  return true
}

/**
 * Check task access with detailed error messages
 */
export async function checkTaskAccess(userId: string, taskId: string) {
  const hasAccess = await canAccessTask(userId, taskId)
  
  if (!hasAccess) {
    throw new Error('You do not have access to this task')
  }

  return true
}

/**
 * Admin-only endpoint wrapper
 */
export function requireSystemAdmin() {
  return async (request: NextRequest) => {
    const session = await requireAuth(request)
    const isAdmin = await isSystemAdmin(session.user.id)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'System administrator access required' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Workspace admin endpoint wrapper
 */
export function requireWorkspaceAdmin(workspaceId: string) {
  return async (request: NextRequest) => {
    const session = await requireAuth(request)
    const isAdmin = await isWorkspaceAdmin(session.user.id, workspaceId)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Workspace administrator access required' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Project admin endpoint wrapper
 */
export function requireProjectAdmin(projectId: string) {
  return async (request: NextRequest) => {
    const session = await requireAuth(request)
    const isAdmin = await isProjectAdmin(session.user.id, projectId)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Project administrator access required' },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Create a permission-protected API handler
 */
export function withPermission<T extends any[]>(
  permissionCheck: (userId: string, ...args: T) => Promise<boolean>,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = await requireAuth(request)
      const hasPermission = await permissionCheck(session.user.id, ...args)
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return await handler(request, ...args)
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      console.error('Permission check error:', error)
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Extract IDs from request URL and params
 */
export function extractResourceIds(request: NextRequest, params?: any) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  return {
    workspaceId: params?.workspaceId || searchParams.get('workspaceId'),
    projectId: params?.projectId || params?.id || searchParams.get('projectId'),
    taskId: params?.taskId || params?.id || searchParams.get('taskId'),
    userId: params?.userId || searchParams.get('userId')
  }
}

/**
 * Validate and sanitize permission requests
 */
export function validatePermissionRequest(
  requiredFields: string[],
  providedData: Record<string, any>
) {
  const missing = requiredFields.filter(field => !providedData[field])
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }

  return true
}

// ============= ERROR HANDLING =============

/**
 * Standard permission error responses
 */
export const PermissionErrors = {
  AUTHENTICATION_REQUIRED: {
    error: 'Authentication required',
    status: 401
  },
  INSUFFICIENT_PERMISSIONS: {
    error: 'Insufficient permissions',
    status: 403
  },
  WORKSPACE_ACCESS_DENIED: {
    error: 'You do not have access to this workspace',
    status: 403
  },
  PROJECT_ACCESS_DENIED: {
    error: 'You do not have access to this project',
    status: 403
  },
  TASK_ACCESS_DENIED: {
    error: 'You do not have access to this task',
    status: 403
  },
  ADMIN_REQUIRED: {
    error: 'Administrator access required',
    status: 403
  },
  RESOURCE_NOT_FOUND: {
    error: 'Resource not found',
    status: 404
  }
} as const

/**
 * Create standardized error response
 */
export function createPermissionError(
  errorType: keyof typeof PermissionErrors,
  customMessage?: string
) {
  const error = PermissionErrors[errorType]
  return NextResponse.json(
    { error: customMessage || error.error },
    { status: error.status }
  )
}

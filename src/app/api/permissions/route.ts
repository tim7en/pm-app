import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import {
  // Project permissions
  canViewProject,
  canCreateProject,
  canEditProject,
  canDeleteProject,
  canManageProjectMembers,
  
  // Task permissions
  canViewTask,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  canAssignTask,
  canChangeTaskStatus,
  canVerifyTask,
  
  // Utility functions
  getUserProjectPermissions,
  getUserTaskPermissions,
} from '@/lib/roles'

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
    const { type, action, resourceId, workspaceId } = body

    if (!type || !action) {
      return NextResponse.json(
        { error: 'Type and action are required' },
        { status: 400 }
      )
    }

    let result = false

    try {
      switch (type) {
        case 'project':
          if (!resourceId && action !== 'create') {
            return NextResponse.json(
              { error: 'Project ID is required for this action' },
              { status: 400 }
            )
          }

          switch (action) {
            case 'view':
              result = await canViewProject(session.user.id, resourceId)
              break
            case 'create':
              result = await canCreateProject(session.user.id, workspaceId)
              break
            case 'edit':
              result = await canEditProject(session.user.id, resourceId)
              break
            case 'delete':
              result = await canDeleteProject(session.user.id, resourceId)
              break
            case 'manageMembers':
              result = await canManageProjectMembers(session.user.id, resourceId)
              break
            case 'createTask':
              result = await canCreateTask(session.user.id, resourceId)
              break
            case 'permissions':
              const projectPermissions = await getUserProjectPermissions(session.user.id, resourceId)
              return NextResponse.json({ permissions: projectPermissions })
            default:
              return NextResponse.json(
                { error: 'Invalid project action' },
                { status: 400 }
              )
          }
          break

        case 'task':
          if (!resourceId) {
            return NextResponse.json(
              { error: 'Task ID is required' },
              { status: 400 }
            )
          }

          switch (action) {
            case 'view':
              result = await canViewTask(session.user.id, resourceId)
              break
            case 'edit':
              result = await canEditTask(session.user.id, resourceId)
              break
            case 'delete':
              result = await canDeleteTask(session.user.id, resourceId)
              break
            case 'assign':
              result = await canAssignTask(session.user.id, resourceId)
              break
            case 'changeStatus':
              result = await canChangeTaskStatus(session.user.id, resourceId)
              break
            case 'verify':
              result = await canVerifyTask(session.user.id, resourceId)
              break
            case 'permissions':
              const taskPermissions = await getUserTaskPermissions(session.user.id, resourceId)
              return NextResponse.json({ permissions: taskPermissions })
            default:
              return NextResponse.json(
                { error: 'Invalid task action' },
                { status: 400 }
              )
          }
          break

        default:
          return NextResponse.json(
            { error: 'Invalid resource type. Must be "project" or "task"' },
            { status: 400 }
          )
      }

      return NextResponse.json({ allowed: result })
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json(
        { error: 'Failed to check permissions' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Permission API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Bulk permission check endpoint
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
    const taskId = searchParams.get('taskId')
    const workspaceId = searchParams.get('workspaceId')

    const response: any = {}

    try {
      // Get project permissions if projectId is provided
      if (projectId) {
        response.project = await getUserProjectPermissions(session.user.id, projectId)
      }

      // Get task permissions if taskId is provided
      if (taskId) {
        response.task = await getUserTaskPermissions(session.user.id, taskId)
      }

      // Get workspace-level permissions
      if (workspaceId) {
        response.workspace = {
          canCreateProject: await canCreateProject(session.user.id, workspaceId)
        }
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('Bulk permission check error:', error)
      return NextResponse.json(
        { error: 'Failed to check permissions' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Permission bulk API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

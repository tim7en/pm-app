import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationType } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'
import { canUserPerformTaskAction } from '@/lib/roles'
import { NotificationService } from '@/lib/notification-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assigneeId } = body

    if (!assigneeId) {
      return NextResponse.json(
        { error: 'Assignee ID is required' },
        { status: 400 }
      )
    }

    // Get the existing task to validate permissions
    const existingTask = await db.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        project: {
          include: {
            workspace: true
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to assign this task
    const hasPermission = await canUserPerformTaskAction(
      session.user.id,
      resolvedParams.id,
      'canEditTask'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign tasks in this workspace' },
        { status: 403 }
      )
    }

    // Track if we added user to workspace
    let wasAddedToWorkspace = false

    // Check if the assignee user exists in the system
    const assigneeUser = await db.user.findUnique({
      where: { id: assigneeId }
    })

    if (!assigneeUser) {
      return NextResponse.json(
        { error: 'Assignee user not found. Only existing workspace members can be assigned to tasks.' },
        { status: 404 }
      )
    }

    // Get user's role and project ownership for permission validation
    const userWorkspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: existingTask.project.workspaceId
        }
      }
    })

    const isProjectOwner = existingTask.project.ownerId === session.user.id
    const isWorkspaceOwnerOrAdmin = userWorkspaceMember?.role === 'OWNER' || userWorkspaceMember?.role === 'ADMIN'

    // If user is a regular member and not project owner, they can only assign to themselves
    if (!isWorkspaceOwnerOrAdmin && !isProjectOwner && assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: 'Members can only assign tasks to themselves unless they are project owners' },
        { status: 403 }
      )
    }

    // Check if assignee is already a member of the workspace
    let assigneeWorkspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: assigneeId,
          workspaceId: existingTask.project.workspaceId
        }
      }
    })

    // If assignee is not a workspace member, add them automatically (for workspace owners/admins only)
    if (!assigneeWorkspaceMember) {
      if (!isWorkspaceOwnerOrAdmin && !isProjectOwner) {
        return NextResponse.json(
          { error: 'Cannot assign to users outside the workspace. Only workspace owners/admins can add new members.' },
          { status: 403 }
        )
      }

      // Add the user to the workspace as a MEMBER
      try {
        assigneeWorkspaceMember = await db.workspaceMember.create({
          data: {
            userId: assigneeId,
            workspaceId: existingTask.project.workspaceId,
            role: 'MEMBER',
            joinedAt: new Date()
          }
        })
        
        wasAddedToWorkspace = true
        console.log(`✅ Added user ${assigneeUser.name || assigneeUser.email} to workspace ${existingTask.project.workspace.name}`)
      } catch (error) {
        console.error('Error adding user to workspace:', error)
        return NextResponse.json(
          { error: 'Failed to add user to workspace' },
          { status: 500 }
        )
      }
    }

    // Check if assignee is already a member of the project
    let assigneeProjectMember = await db.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: assigneeId,
          projectId: existingTask.projectId
        }
      }
    })

    // If assignee is not a project member, add them automatically
    let wasAddedToProject = false
    if (!assigneeProjectMember) {
      try {
        assigneeProjectMember = await db.projectMember.create({
          data: {
            userId: assigneeId,
            projectId: existingTask.projectId,
            role: 'MEMBER',
            joinedAt: new Date()
          }
        })
        
        wasAddedToProject = true
        console.log(`✅ Added user ${assigneeUser.name || assigneeUser.email} to project ${existingTask.title}`)
      } catch (error) {
        console.error('Error adding user to project:', error)
        // Don't fail the task assignment if project membership fails
      }
    }

    // Now assign the task
    const updatedTask = await db.task.update({
      where: { id: resolvedParams.id },
      data: { assigneeId },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true, workspaceId: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        subtasks: true,
        tags: true,
        _count: {
          select: {
            comments: true,
            subtasks: true
          }
        }
      }
    })

    // Send notifications
    try {
      // Notify the assigned user about the task assignment
      if (assigneeId !== session.user.id) { // Don't notify if user assigned task to themselves
        await NotificationService.createNotification({
          title: 'New Task Assigned',
          message: `You have been assigned to task "${updatedTask.title}" in project "${updatedTask.project.name}"`,
          type: NotificationType.TASK_ASSIGNED,
          userId: assigneeId,
          relatedId: updatedTask.id,
          relatedUrl: `/tasks/${updatedTask.id}`,
          senderName: session.user.name || session.user.email || 'Unknown User',
          senderAvatar: session.user.avatar || undefined
        })
      }

      // If user was added to workspace, send additional notification
      if (wasAddedToWorkspace) {
        await NotificationService.createNotification({
          title: 'Added to Workspace',
          message: `You have been added to workspace "${existingTask.project.workspace.name}" and assigned to task "${updatedTask.title}"`,
          type: NotificationType.WORKSPACE_INVITE,
          userId: assigneeId,
          relatedId: existingTask.project.workspaceId,
          relatedUrl: `/workspaces/${existingTask.project.workspaceId}`,
          senderName: session.user.name || session.user.email || 'Unknown User',
          senderAvatar: session.user.avatar || undefined
        })
      }

      // If user was added to project, send additional notification
      if (wasAddedToProject) {
        await NotificationService.createNotification({
          title: 'Added to Project',
          message: `You have been added to project "${updatedTask.project.name}" and assigned to task "${updatedTask.title}"`,
          type: NotificationType.PROJECT_INVITE,
          userId: assigneeId,
          relatedId: existingTask.projectId,
          relatedUrl: `/projects/${existingTask.projectId}`,
          senderName: session.user.name || session.user.email || 'Unknown User',
          senderAvatar: session.user.avatar || undefined
        })
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the task assignment if notification fails
    }

    // Transform the response
    const transformedTask = {
      ...updatedTask,
      commentCount: updatedTask._count.comments,
      subtaskCount: updatedTask._count.subtasks,
      completedSubtaskCount: updatedTask.subtasks.filter(st => st.isCompleted).length,
      attachmentCount: 0
    }

    // Create appropriate response message
    let message = `Task assigned to ${assigneeUser.name || assigneeUser.email}`
    const additions: string[] = []
    
    if (wasAddedToWorkspace) {
      additions.push('added to workspace')
    }
    if (wasAddedToProject) {
      additions.push('added to project')
    }
    if (!wasAddedToWorkspace && !wasAddedToProject) {
      additions.push('user notified')
    }
    
    if (additions.length > 0) {
      message += ` (${additions.join(', ')})`
    }

    return NextResponse.json({
      task: transformedTask,
      message
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}

// Allow unassigning tasks (set assigneeId to null)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to unassign this task
    const hasPermission = await canUserPerformTaskAction(
      session.user.id,
      resolvedParams.id,
      'canEditTask'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to unassign tasks in this workspace' },
        { status: 403 }
      )
    }

    const updatedTask = await db.task.update({
      where: { id: resolvedParams.id },
      data: { assigneeId: null },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true, workspaceId: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        subtasks: true,
        tags: true,
        _count: {
          select: {
            comments: true,
            subtasks: true
          }
        }
      }
    })

    // Transform the response
    const transformedTask = {
      ...updatedTask,
      commentCount: updatedTask._count.comments,
      subtaskCount: updatedTask._count.subtasks,
      completedSubtaskCount: updatedTask.subtasks.filter(st => st.isCompleted).length,
      attachmentCount: 0
    }

    return NextResponse.json({
      task: transformedTask,
      message: 'Task unassigned successfully'
    })
  } catch (error) {
    console.error('Error unassigning task:', error)
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    )
  }
}

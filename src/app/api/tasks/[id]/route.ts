import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, Priority } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'
import { canUserPerformAction, canUserPerformTaskAction } from '@/lib/roles'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
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
          },
          orderBy: { createdAt: 'desc' }
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this task
    // User can access if they are:
    // 1. A member of the task's workspace
    // 2. Assigned to the task
    // 3. The creator of the task
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: task.project.workspaceId
        }
      }
    })

    const hasAccess = workspaceMember || 
                     task.assigneeId === session.user.id || 
                     task.creatorId === session.user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this task' },
        { status: 403 }
      )
    }

    // Transform the data
    const transformedTask = {
      ...task,
      commentCount: task._count.comments,
      subtaskCount: task._count.subtasks,
      completedSubtaskCount: task.subtasks.filter(st => st.isCompleted).length,
      attachmentCount: 0
    }

    return NextResponse.json(transformedTask)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      status,
      dueDate,
      tags
    } = body

    // Get the existing task to validate permissions
    const existingTask = await db.task.findUnique({
      where: { id: params.id },
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

    // Check if user has permission to update this task
    const hasPermission = await canUserPerformTaskAction(
      session.user.id,
      params.id,
      'canEditTask'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update tasks in this workspace' },
        { status: 403 }
      )
    }

    // If changing assignee, validate assignment permissions
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      if (assigneeId && assigneeId.trim() !== '') {
        // Get user's role and project ownership
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

        // Check if assignee is a member of the workspace
        const assigneeWorkspaceMember = await db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: assigneeId,
              workspaceId: existingTask.project.workspaceId
            }
          }
        })

        if (!assigneeWorkspaceMember) {
          return NextResponse.json(
            { error: 'Assignee is not a member of the project workspace' },
            { status: 400 }
          )
        }
      }
    }

    // If changing project, validate project access and creation permissions
    if (projectId !== undefined && projectId !== existingTask.projectId) {
      const hasProjectCreatePermission = await canUserPerformAction(
        session.user.id,
        existingTask.project.workspaceId,
        'canCreateTask'
      )

      if (!hasProjectCreatePermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions to move task to this project' },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (projectId !== undefined) updateData.projectId = projectId
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (priority !== undefined && Object.values(Priority).includes(priority as Priority)) {
      updateData.priority = priority as Priority
    }
    if (status !== undefined && Object.values(TaskStatus).includes(status as TaskStatus)) {
      updateData.status = status as TaskStatus
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await db.taskTag.deleteMany({
        where: { taskId: params.id }
      })
      
      // Create new tags
      if (tags.length > 0) {
        await db.taskTag.createMany({
          data: tags.map((tag: any) => ({
            taskId: params.id,
            name: tag.name,
            color: tag.color || '#6b7280'
          }))
        })
      }
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        },
        creator: {
          select: { id: true, name: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
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
      ...task,
      commentCount: task._count.comments,
      subtaskCount: task._count.subtasks,
      completedSubtaskCount: task.subtasks.filter(st => st.isCompleted).length,
      attachmentCount: 0
    }

    return NextResponse.json(transformedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the existing task to validate permissions
    const existingTask = await db.task.findUnique({
      where: { id: params.id },
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

    // Check if user has permission to delete this task
    const hasPermission = await canUserPerformTaskAction(
      session.user.id,
      params.id,
      'canDeleteTask'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete tasks in this workspace' },
        { status: 403 }
      )
    }

    // Delete related tags first
    await db.taskTag.deleteMany({
      where: { taskId: params.id }
    })

    // Delete related subtasks
    await db.subTask.deleteMany({
      where: { taskId: params.id }
    })

    // Delete related comments
    await db.comment.deleteMany({
      where: { taskId: params.id }
    })

    // Delete the task
    await db.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, Priority } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
          select: { id: true, name: true, color: true }
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
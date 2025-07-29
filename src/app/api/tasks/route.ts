import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, Priority } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleTasks, canUserPerformAction } from '@/lib/roles'

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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    // Get all accessible tasks for the user
    let tasks = await getAccessibleTasks(session.user.id, projectId || undefined)
    
    // Apply filters
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      tasks = tasks.filter(task => task.status === status)
    }
    
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      tasks = tasks.filter(task => task.priority === priority)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

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
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority = 'MEDIUM',
      dueDate,
      tags = []
    } = body

    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and project are required' },
        { status: 400 }
      )
    }

    // Check if user can create tasks in this project
    const canCreateTask = await canUserPerformAction(session.user.id, projectId, 'canCreateTask')
    if (!canCreateTask) {
      return NextResponse.json(
        { error: 'You do not have permission to create tasks in this project' },
        { status: 403 }
      )
    }

    // Verify project exists and user has access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // If assignee is specified, verify they have access to the project
    if (assigneeId) {
      const assigneeHasAccess = await db.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: assigneeId },
            { members: { some: { userId: assigneeId } } }
          ]
        }
      })

      if (!assigneeHasAccess) {
        return NextResponse.json(
          { error: 'Assignee does not have access to this project' },
          { status: 400 }
        )
      }
    }

    // If no assignee specified, assign to the creator
    const finalAssigneeId = assigneeId || session.user.id

    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: finalAssigneeId,
        creatorId: session.user.id,
        priority: priority as Priority,
        status: TaskStatus.TODO,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
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
        }
      }
    })

    // Create notification for assignee if different from creator
    if (finalAssigneeId && finalAssigneeId !== session.user.id) {
      await db.notification.create({
        data: {
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${title}`,
          type: 'TASK_ASSIGNED',
          userId: finalAssigneeId
        }
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
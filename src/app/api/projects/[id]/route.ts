import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectStatus } from '@prisma/client'
import { getAuthSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        workspace: {
          select: { id: true, name: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true }
            },
            creator: {
              select: { id: true, name: true, avatar: true }
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
          },
          orderBy: [
            { position: 'asc' },
            { createdAt: 'desc' }
          ]
        },
        sections: {
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Transform the data
    const transformedProject = {
      ...project,
      taskCount: project._count.tasks,
      completedTaskCount: project.tasks.filter(t => t.status === 'DONE').length,
      memberCount: project._count.members,
      tasks: project.tasks.map(task => ({
        ...task,
        commentCount: task._count.comments,
        subtaskCount: task._count.subtasks,
        completedSubtaskCount: task.subtasks.filter(st => st.isCompleted).length,
        attachmentCount: 0
      }))
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
      name,
      description,
      color,
      status
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (status !== undefined && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      updateData.status = status as ProjectStatus
    }

    const project = await db.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        workspace: {
          select: { id: true, name: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        tasks: {
          select: { 
            id: true, 
            status: true,
            dueDate: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    })

    // Transform the response
    const transformedProject = {
      ...project,
      taskCount: project._count.tasks,
      completedTaskCount: project.tasks.filter(t => t.status === 'DONE').length,
      memberCount: project._count.members,
      isStarred: false
    }

    return NextResponse.json(transformedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify project exists and user has permission to delete it
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user is project owner or admin
    const isOwner = project.ownerId === session.user.id
    const isAdmin = project.members.some(member => 
      member.userId === session.user.id && member.role === 'ADMIN'
    )

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this project' },
        { status: 403 }
      )
    }

    // Delete project (cascading deletes will handle tasks, comments, subtasks, etc.)
    await db.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
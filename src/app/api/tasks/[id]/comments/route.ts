import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'
import { NotificationType } from '@prisma/client'
import { getSocketInstance } from '@/lib/socket'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const taskId = resolvedParams.id

    // Verify task exists and user has access to it
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          // Task creator can comment
          { creatorId: session.user.id },
          // Task assignee(s) can comment
          { assigneeId: session.user.id },
          { assignees: { some: { userId: session.user.id } } },
          // Project owner can comment
          { project: { ownerId: session.user.id } },
          // Project members can comment
          { project: { members: { some: { userId: session.user.id } } } }
        ]
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch comments for the task
    const comments = await db.comment.findMany({
      where: {
        taskId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const taskId = resolvedParams.id
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Verify task exists and user has access to it
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          // Task creator can comment
          { creatorId: session.user.id },
          // Task assignee(s) can comment
          { assigneeId: session.user.id },
          { assignees: { some: { userId: session.user.id } } },
          // Project owner can comment
          { project: { ownerId: session.user.id } },
          // Project members can comment
          { project: { members: { some: { userId: session.user.id } } } }
        ]
      },
      include: {
        assignee: {
          select: { id: true, name: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true }
        },
        project: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                userId: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        comments: {
          select: {
            userId: true,
            user: {
              select: { id: true, name: true }
            }
          },
          distinct: ['userId']
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        taskId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Send notifications to relevant users (but not the commenter)
    const notificationTargets = new Set<string>()
    
    // Notify task creator (if not the commenter)
    if (task.creatorId && task.creatorId !== session.user.id) {
      notificationTargets.add(task.creatorId)
    }
    
    // Notify task assignee (if not the commenter)
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      notificationTargets.add(task.assigneeId)
    }
    
    // Notify all task assignees for multi-assignee tasks (if not the commenter)
    const taskWithAssignees = await db.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: {
            user: true
          }
        },
        project: {
          select: {
            ownerId: true
          }
        }
      }
    })
    
    if (taskWithAssignees?.assignees) {
      taskWithAssignees.assignees.forEach(assignee => {
        if (assignee.userId !== session.user.id) {
          notificationTargets.add(assignee.userId)
        }
      })
    }
    
    // Notify project owner (if not the commenter and not already included)
    if (taskWithAssignees?.project?.ownerId && 
        taskWithAssignees.project.ownerId !== session.user.id) {
      notificationTargets.add(taskWithAssignees.project.ownerId)
    }

    // Send notifications
    for (const userId of notificationTargets) {
      try {
        await NotificationService.createTaskNotification(
          NotificationType.COMMENT_ADDED,
          userId,
          task.title,
          task.id,
          session.user.name || 'Someone'
        )
      } catch (error) {
        console.error(`Failed to send comment notification to user ${userId}:`, error)
        // Don't fail the comment creation if notification fails
      }
    }

    // Send real-time notifications via Socket.IO
    try {
      const io = getSocketInstance()
      if (io) {
        // Emit to all notification targets
        for (const userId of notificationTargets) {
          io.to(`user:${userId}`).emit('comment-added', {
            taskId: task.id,
            taskTitle: task.title,
            commentId: comment.id,
            commenterName: session.user.name || 'Someone',
            commenterAvatar: session.user.avatar,
            content: comment.content,
            createdAt: comment.createdAt
          })
        }
        
        // Also emit to task-specific room for anyone currently viewing the task
        io.to(`task-${taskId}`).emit('comment-updated', {
          taskId: task.id,
          newComment: {
            ...comment,
            author: comment.user
          }
        })
      }
    } catch (error) {
      console.error('Failed to send real-time comment notification:', error)
      // Don't fail the comment creation if real-time notification fails
    }

    return NextResponse.json({
      ...comment,
      author: comment.user
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

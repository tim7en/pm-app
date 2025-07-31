import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'
import { NotificationType } from '@prisma/client'

export async function POST(
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

    const taskId = params.id
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
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        }
      },
      include: {
        assignee: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true }
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

    // Send notifications to relevant users (assignee and creator, but not the commenter)
    const notificationTargets = new Set<string>()
    
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      notificationTargets.add(task.assigneeId)
    }
    
    if (task.creatorId && task.creatorId !== session.user.id) {
      notificationTargets.add(task.creatorId)
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

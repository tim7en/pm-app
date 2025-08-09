import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { canUserVerifyTasks } from '@/lib/roles'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const taskId = resolvedParams.id
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the task with its project
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user can verify tasks
    const canVerify = await canUserVerifyTasks(session.user.id, task.projectId)
    if (!canVerify) {
      return NextResponse.json(
        { error: 'You do not have permission to verify tasks' },
        { status: 403 }
      )
    }

    const { verified, rejectionReason } = await request.json()

    if (verified) {
      // Verify the task
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedById: session.user.id,
          rejectionReason: null
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      })

      // Create notification for assignee
      if (updatedTask.assigneeId) {
        await db.notification.create({
          data: {
            title: 'Task Verified',
            message: `Your task "${task.title}" has been verified`,
            type: 'TASK_VERIFIED',
            userId: updatedTask.assigneeId
          }
        })
      }

      return NextResponse.json({ success: true, task: updatedTask })
    } else {
      // Reject the task
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_PROGRESS',
          verificationStatus: 'REJECTED',
          verifiedAt: new Date(),
          verifiedById: session.user.id,
          rejectionReason: rejectionReason
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      })

      // Create notification for assignee
      if (updatedTask.assigneeId) {
        await db.notification.create({
          data: {
            title: 'Task Rejected',
            message: `Your task "${task.title}" has been rejected`,
            type: 'TASK_REJECTED',
            userId: updatedTask.assigneeId
          }
        })
      }

      return NextResponse.json({ success: true, task: updatedTask })
    }
  } catch (error) {
    console.error('Error verifying task:', error)
    return NextResponse.json(
      { error: 'Failed to verify task' },
      { status: 500 }
    )
  }
}

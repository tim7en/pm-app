import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
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

    const { id: taskId, subtaskId } = params
    const body = await request.json()
    const { isCompleted } = body

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'isCompleted must be a boolean' },
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
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Update the subtask
    const subtask = await db.subTask.update({
      where: { id: subtaskId },
      data: { isCompleted }
    })

    return NextResponse.json(subtask)
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
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

    const { id: taskId, subtaskId } = params

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
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the subtask
    await db.subTask.delete({
      where: { id: subtaskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    )
  }
}

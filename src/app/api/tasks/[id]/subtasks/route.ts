import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

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
    const { title } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Subtask title is required' },
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

    // Create the subtask
    const subtask = await db.subTask.create({
      data: {
        title: title.trim(),
        taskId,
        isCompleted: false
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}

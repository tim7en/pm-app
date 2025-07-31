import { NextRequest, NextResponse } from 'next/server'
// import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // AI task feedback temporarily disabled due to API key issues
    return NextResponse.json(
      { 
        feedback: "Great job completing this task! Keep up the excellent work.",
        error: 'AI task feedback temporarily unavailable' 
      },
      { status: 503 }
    )

    // const body = await request.json()
    // const { taskId, completionTime } = body

    // if (!taskId) {
    //   return NextResponse.json(
    //     { error: 'Task ID is required' },
    //     { status: 400 }
    //   )
    // }

    // // Get task data
    // const task = await db.task.findUnique({
    //   where: { id: taskId },
    //   include: {
        assignee: true,
        creator: true,
        project: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get user's recent performance
    const recentTasks = await db.task.findMany({
      where: {
        assigneeId: session.user.id,
        status: 'DONE',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    })

    const userPerformance = {
      recentCompletions: recentTasks.length,
      avgPriority: recentTasks.reduce((acc, t) => {
        const priorityScore = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }
        return acc + (priorityScore[t.priority] || 2)
      }, 0) / (recentTasks.length || 1),
      streak: recentTasks.length
    }

    const feedback = await aiAssistant.generateTaskCompletionFeedback(
      task,
      completionTime || 1,
      userPerformance
    )

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('AI feedback generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
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

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get project data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { status: 'DONE' },
          include: {
            assignee: true,
            creator: true
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

    const assessment = await aiAssistant.assessProjectEfficiency(
      project,
      project.tasks,
      {
        start: project.createdAt,
        end: project.status === 'COMPLETED' ? project.updatedAt : undefined
      }
    )

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('AI project assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to assess project efficiency' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
// import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

async function handleAssessProject(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // AI Assessment temporarily disabled due to API key issues
    return NextResponse.json(
      { error: 'AI assessment temporarily unavailable' },
      { status: 503 }
    )

    // // Get projectId from query params (GET) or body (POST)
    // const { searchParams } = new URL(request.url)
    // let projectId = searchParams.get('projectId')
    
    // if (!projectId && request.method === 'POST') {
    //   const body = await request.json()
    //   projectId = body.projectId
    // }

    // if (!projectId) {
    //   return NextResponse.json(
    //     { error: 'Project ID is required' },
    //     { status: 400 }
    //   )
    // }

    // // Get project data
    // const project = await db.project.findUnique({
    //   where: { id: projectId },
    //   include: {
    //     tasks: {
    //       where: { status: 'DONE' },
    //       include: {
    //         assignee: true,
    //         creator: true
    //       }
    //     }
    //   }
    // })

    // if (!project) {
    //   return NextResponse.json(
    //     { error: 'Project not found' },
    //     { status: 404 }
    //   )
    // }

    // const assessment = await aiAssistant.assessProjectEfficiency(
    //   project,
    //   project.tasks,
    //   {
    //     start: project.createdAt,
    //     end: project.status === 'COMPLETED' ? project.updatedAt : undefined
    //   }
    // )

    // return NextResponse.json({ assessment })
  } catch (error) {
    console.error('AI project assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to assess project efficiency' },
      { status: 500 }
    )
  }
}

// Support both GET and POST methods
export async function GET(request: NextRequest) {
  return handleAssessProject(request)
}

export async function POST(request: NextRequest) {
  return handleAssessProject(request)
}

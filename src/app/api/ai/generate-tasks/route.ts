import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'

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
    const { description, projectContext, existingTasks } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const suggestions = await aiAssistant.generateTasks({
      description,
      projectContext,
      userRole: 'MEMBER', // Default role for task generation
      existingTasks
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('AI task generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate task suggestions' },
      { status: 500 }
    )
  }
}

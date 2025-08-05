import { NextRequest, NextResponse } from 'next/server'

// In-memory progress tracking (in production, you'd use Redis or similar)
const progressStore = new Map<string, any>()

// Progress tracking for bulk email processing
export async function POST(request: NextRequest) {
  try {
    const { sessionId, action, progressData } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      )
    }

    if (action === 'update') {
      // Update progress for a session
      progressStore.set(sessionId, {
        ...progressData,
        lastUpdated: Date.now()
      })
      
      return NextResponse.json({
        success: true,
        message: 'Progress updated'
      })
    } else if (action === 'get') {
      // Get current progress for a session
      const progress = progressStore.get(sessionId) || {
        totalEmails: 0,
        processed: 0,
        classified: 0,
        prospects: 0,
        labelsApplied: 0,
        errors: 0,
        progress: 0,
        currentBatch: 0,
        totalBatches: 0,
        currentChunk: 0,
        totalChunks: 0,
        currentEmail: '',
        aiRequestsInProgress: 0,
        processingSpeed: 0,
        estimatedTimeRemaining: 0,
        isComplete: false,
        lastUpdated: Date.now()
      }
      
      return NextResponse.json({
        success: true,
        progress
      })
    } else if (action === 'clear') {
      // Clear progress for a session
      progressStore.delete(sessionId)
      
      return NextResponse.json({
        success: true,
        message: 'Progress cleared'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in progress tracking:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to handle progress request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      )
    }

    const progress = progressStore.get(sessionId) || {
      totalEmails: 0,
      processed: 0,
      classified: 0,
      prospects: 0,
      labelsApplied: 0,
      errors: 0,
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      currentChunk: 0,
      totalChunks: 0,
      currentEmail: '',
      aiRequestsInProgress: 0,
      processingSpeed: 0,
      estimatedTimeRemaining: 0,
      isComplete: false,
      lastUpdated: Date.now()
    }
    
    return NextResponse.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('Error getting progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

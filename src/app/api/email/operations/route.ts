import { NextRequest, NextResponse } from 'next/server'
import { emailOperationHistory } from '@/lib/email-operation-history'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const operations = emailOperationHistory.getRollbackableOperations(userId, 20)
    
    return NextResponse.json({
      success: true,
      operations: operations.map(op => ({
        id: op.id,
        type: op.type,
        timestamp: op.timestamp,
        description: op.description,
        sessionId: op.sessionId,
        canRollback: op.canRollback,
        isRolledBack: op.isRolledBack,
        affectedCount: op.emailsAffected.length,
        metadata: op.metadata
      })),
      stats: emailOperationHistory.getStats(userId)
    })
  } catch (error) {
    console.error('Error fetching operations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const operationId = searchParams.get('operationId')
    const userId = searchParams.get('userId')
    
    if (!operationId || !userId) {
      return NextResponse.json(
        { error: 'Operation ID and User ID are required' },
        { status: 400 }
      )
    }

    // Create Gmail service for the user
    const gmailService = new GmailService(GMAIL_CONFIG)
    
    const result = await emailOperationHistory.rollbackOperation(
      operationId, 
      gmailService, 
      userId
    )
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Rollback failed',
          details: result.errors.join(', ')
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back operation: ${result.description}`,
      rollbackId: result.id,
      timestamp: result.timestamp,
      errors: result.errors
    })
  } catch (error) {
    console.error('Error rolling back operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rollback operation' },
      { status: 500 }
    )
  }
}

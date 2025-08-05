import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'
import { EmailCleanupService } from '@/lib/email-cleanup-service'

interface EmailAnalysisResult {
  id: string
  subject: string
  from: string
  snippet: string
  timestamp: Date
  analysis?: {
    category: string
    confidence: number
    reasons: string[]
    priority: string
    sentiment: number
    keyEntities: string[]
    suggestedActions: string[]
    prospectStage: string
  }
  classification?: {
    isProspect: boolean
    isImportant: boolean
    requiresAction: boolean
    category: string
  }
  error?: string
  errorDetails?: string
}

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, count = 10 } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    // Initialize Gmail service
    const gmailService = new GmailService(GMAIL_CONFIG)
    gmailService.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: '',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000 // 1 hour from now
    })

    // Initialize AI cleanup service
    const cleanupService = new EmailCleanupService()

    console.log(`Fetching ${count} unread emails from Gmail...`)
    
    // Fetch unread emails
    const unreadEmails = await gmailService.getUnreadEmails(count)
    
    if (unreadEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unread emails found',
        results: [],
        summary: {
          totalEmails: 0,
          categorized: 0,
          errors: 0
        }
      })
    }

    console.log(`Found ${unreadEmails.length} unread emails. Starting AI classification...`)

    // Process each email with AI classification
    const results: EmailAnalysisResult[] = []
    let categorized = 0
    let errors = 0

    for (const email of unreadEmails) {
      try {
        console.log(`Processing email: ${email.subject}`)
        
        // Analyze email with AI
        const analysis = await cleanupService.analyzeEmailWithAI(
          email.subject,
          email.body,
          email.from
        )

        // Categorize email
        const category = await cleanupService.categorizeEmail(email)
        
        // Determine prospect stage
        const prospectStage = cleanupService.matchProspectStage(
          email.subject,
          email.body
        )

        const result: EmailAnalysisResult = {
          id: email.id,
          subject: email.subject,
          from: email.from,
          snippet: email.snippet,
          timestamp: email.timestamp,
          analysis: {
            category: prospectStage?.name || 'uncategorized',
            confidence: category.confidence,
            reasons: [prospectStage?.description || 'No specific category detected'],
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            keyEntities: analysis.keyEntities,
            suggestedActions: analysis.suggestedActions,
            prospectStage: prospectStage?.name || 'unknown'
          },
          classification: {
            isProspect: prospectStage !== null,
            isImportant: analysis.priority === 'high',
            requiresAction: analysis.suggestedActions.length > 0,
            category: prospectStage?.name || 'uncategorized'
          }
        }

        results.push(result)
        categorized++
        
        console.log(`✅ Processed: ${email.subject} -> ${prospectStage?.name || 'uncategorized'} (${prospectStage?.name || 'non-prospect'})`)
        
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error)
        
        results.push({
          id: email.id,
          subject: email.subject,
          from: email.from,
          snippet: email.snippet,
          timestamp: email.timestamp,
          error: 'Failed to analyze email',
          errorDetails: error instanceof Error ? error.message : 'Unknown error'
        })
        errors++
      }
    }

    // Generate summary statistics
    const categoryStats = results.reduce((acc, result) => {
      if (result.analysis?.category) {
        acc[result.analysis.category] = (acc[result.analysis.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const prospectStageStats = results.reduce((acc, result) => {
      if (result.analysis?.prospectStage) {
        acc[result.analysis.prospectStage] = (acc[result.analysis.prospectStage] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const priorityStats = results.reduce((acc, result) => {
      if (result.analysis?.priority) {
        acc[result.analysis.priority] = (acc[result.analysis.priority] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    console.log(`🎯 Classification complete! ${categorized} successful, ${errors} errors`)

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${results.length} emails`,
      results,
      summary: {
        totalEmails: unreadEmails.length,
        categorized,
        errors,
        categoryBreakdown: categoryStats,
        prospectStageBreakdown: prospectStageStats,
        priorityBreakdown: priorityStats,
        insights: {
          highPriorityCount: results.filter(r => r.analysis?.priority === 'high').length,
          prospectCount: results.filter(r => r.classification?.isProspect).length,
          actionRequiredCount: results.filter(r => r.classification?.requiresAction).length
        }
      }
    })

  } catch (error) {
    console.error('Error analyzing Gmail emails:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

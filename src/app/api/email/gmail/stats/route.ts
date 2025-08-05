import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, includeUnlabeled = true } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    const gmailService = new GmailService(GMAIL_CONFIG)
    gmailService.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: '',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000
    })

    console.log('📊 Fetching Gmail statistics and labels...')

    // Fetch user profile for basic stats
    const profile = await gmailService.getProfile()
    
    // Fetch all labels
    const allLabels = await gmailService.getLabels()
    
    // Get email counts for important queries
    const emailStats = await Promise.all([
      gmailService.getEmailCount(''),              // Total emails
      gmailService.getEmailCount('is:unread'),     // Unread emails
      gmailService.getEmailCount('in:inbox'),      // Inbox emails
      gmailService.getEmailCount('in:sent'),       // Sent emails
      gmailService.getEmailCount('in:spam'),       // Spam emails
      gmailService.getEmailCount('in:trash'),      // Trash emails
      gmailService.getEmailCount('is:starred'),    // Starred emails
      gmailService.getEmailCount('has:attachment'), // With attachments
    ])

    // Get count of emails with any AI labels (already classified)
    let alreadyClassifiedCount = 0
    let unlabeledCount = 0
    
    if (includeUnlabeled) {
      try {
        // Count emails that have AI/ labels
        alreadyClassifiedCount = await gmailService.getEmailCount('label:AI/*')
        
        // Calculate unlabeled emails (inbox emails without AI labels)
        const inboxCount = emailStats[2] // inbox emails
        unlabeledCount = Math.max(0, inboxCount - alreadyClassifiedCount)
        
        console.log(`📊 Classification status: ${alreadyClassifiedCount} classified, ${unlabeledCount} unlabeled (of ${inboxCount} inbox emails)`)
      } catch (error) {
        console.warn('Could not calculate unlabeled email count:', error)
      }
    }

    // Process labels with counts
    const labelStats = await Promise.all(
      allLabels.map(async (label) => {
        try {
          const count = await gmailService.getEmailCount(`label:"${label.name}"`)
          return {
            id: label.id,
            name: label.name,
            type: label.type || 'user',
            messageCount: count,
            threadsTotal: label.threadsTotal || 0,
            messagesTotal: label.messagesTotal || 0,
            color: label.color || null
          }
        } catch (error) {
          console.warn(`Failed to get count for label ${label.name}:`, error)
          return {
            id: label.id,
            name: label.name,
            type: label.type || 'user',
            messageCount: 0,
            threadsTotal: label.threadsTotal || 0,
            messagesTotal: label.messagesTotal || 0,
            color: label.color || null
          }
        }
      })
    )

    // Categorize labels
    const systemLabels = labelStats.filter(label => label.type === 'system')
    const userLabels = labelStats.filter(label => label.type === 'user')
    const aiLabels = userLabels.filter(label => label.name.startsWith('AI/'))
    
    // Calculate AI classification statistics
    const aiClassificationStats = {
      totalAiLabels: aiLabels.length,
      totalClassifiedEmails: aiLabels.reduce((sum, label) => sum + label.messageCount, 0),
      alreadyClassifiedCount,
      unlabeledCount,
      classificationCoverage: emailStats[2] > 0 ? ((alreadyClassifiedCount / emailStats[2]) * 100).toFixed(1) : '0',
      categoryBreakdown: aiLabels.reduce((breakdown, label) => {
        const category = label.name.replace('AI/', '')
        breakdown[category] = label.messageCount
        return breakdown
      }, {} as Record<string, number>)
    }

    const stats = {
      profile: {
        emailAddress: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId
      },
      emailCounts: {
        total: emailStats[0],
        unread: emailStats[1],
        inbox: emailStats[2],
        sent: emailStats[3],
        spam: emailStats[4],
        trash: emailStats[5],
        starred: emailStats[6],
        withAttachments: emailStats[7],
        alreadyClassified: alreadyClassifiedCount,
        unlabeled: unlabeledCount
      },
      labels: {
        total: allLabels.length,
        system: systemLabels.length,
        user: userLabels.length,
        ai: aiLabels.length
      },
      labelDetails: {
        system: systemLabels,
        user: userLabels,
        ai: aiLabels
      },
      aiClassification: aiClassificationStats,
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Gmail statistics fetched successfully')
    console.log(`📧 Total emails: ${stats.emailCounts.total}`)
    console.log(`📬 Unread emails: ${stats.emailCounts.unread}`)
    console.log(`📥 Inbox emails: ${stats.emailCounts.inbox}`)
    console.log(`🏷️ Total labels: ${stats.labels.total} (${stats.labels.ai} AI labels)`)
    console.log(`🤖 AI classified emails: ${aiClassificationStats.totalClassifiedEmails}`)
    console.log(`📊 Classification coverage: ${aiClassificationStats.classificationCoverage}%`)
    console.log(`🔄 Unlabeled emails ready for processing: ${unlabeledCount}`)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching Gmail statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Gmail statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

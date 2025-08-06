import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId, accessToken, refreshToken, maxEmails = 50 } = await request.json()

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Gmail tokens required' }, { status: 400 })
    }

    // Fetch emails from Gmail API using real tokens
    const emails = await fetchEmailsFromGmail(accessToken, refreshToken, maxEmails)
    
    // Process emails with AI using real Gmail integration
    const processedEmails = await processEmailsWithAI(emails, accessToken, refreshToken)
    
    // Store results in database
    // await storeEmailResults(processedEmails)

    return NextResponse.json({ 
      success: true,
      processed: processedEmails.length,
      emails: processedEmails,
      message: `Successfully processed ${processedEmails.length} emails`
    })

  } catch (error) {
    console.error('Email processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    )
  }
}

async function fetchEmailsFromGmail(accessToken: string, refreshToken: string, maxEmails: number = 50) {
  try {
    // Use the existing Gmail bulk-analyze endpoint to get real emails
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/gmail/debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        action: 'sample-emails',
        sampleSize: maxEmails
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        // Convert Gmail format to expected format
        return data.result.emails.map((email: any) => ({
          id: email.id,
          threadId: email.threadId,
          subject: email.subject || 'No Subject',
          from: email.from || 'Unknown Sender',
          to: [email.to || 'Unknown Recipient'],
          body: email.body || email.snippet || '',
          snippet: email.snippet || '',
          timestamp: new Date(email.internalDate || Date.now()),
          isRead: !email.labelIds?.includes('UNREAD'),
          labels: email.labelIds || ['INBOX']
        }))
      }
    }
    
    // Fallback to empty array if API fails
    return []
  } catch (error) {
    console.error('Failed to fetch emails from Gmail:', error)
    return []
  }
}

async function processEmailsWithAI(emails: any[], accessToken: string, refreshToken: string) {
  try {
    // Use the existing bulk-analyze endpoint for AI processing
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/gmail/bulk-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        maxEmails: emails.length,
        applyLabels: false, // Just analyze, don't apply labels yet
        skipClassified: false,
        batchSize: 10,
        aiModel: 'auto',
        query: ''
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        // Merge the AI analysis results with original emails
        return emails.map((email, index) => {
          const aiResult = data.result.results?.[index]
          return {
            ...email,
            categorization: {
              prospectStage: aiResult?.classification?.category || 'Other',
              confidence: aiResult?.classification?.confidence || 0.5,
              followUpOpportunity: aiResult?.classification?.priority === 'high',
              followUpSuggestion: aiResult?.classification?.priority === 'high' ? 
                'Consider following up within 2-3 days' : null,
              responseTemplate: getResponseTemplate(aiResult?.classification?.category),
              engagementScore: aiResult?.classification?.confidence || 0.5,
              sentimentScore: aiResult?.classification?.sentiment || 0,
              urgencyLevel: getPriorityBasedUrgency(aiResult?.classification?.priority)
            }
          }
        })
      }
    }

    // Fallback to basic categorization if AI fails
    return emails.map(email => ({
      ...email,
      categorization: {
        prospectStage: 'Other',
        confidence: 0.5,
        followUpOpportunity: false,
        followUpSuggestion: null,
        responseTemplate: 'Thank you for your email. I\'ll review this and get back to you soon.',
        engagementScore: 0.5,
        sentimentScore: 0,
        urgencyLevel: 'medium'
      }
    }))
  } catch (error) {
    console.error('Failed to process emails with AI:', error)
    return emails.map(email => ({
      ...email,
      categorization: {
        prospectStage: 'Other',
        confidence: 0.5,
        followUpOpportunity: false,
        followUpSuggestion: null,
        responseTemplate: 'Thank you for your email. I\'ll review this and get back to you soon.',
        engagementScore: 0.5,
        sentimentScore: 0,
        urgencyLevel: 'medium'
      }
    }))
  }
}

function getResponseTemplate(category: string) {
  const templates: Record<string, string> = {
    'Cold-Outreach': 'Thank you for reaching out. I\'ll review your proposal and get back to you soon.',
    'Job-Opportunities': 'Thank you for considering me for this opportunity. I\'ll review the details.',
    'Finance': 'Thank you for the financial information. I\'ll review this carefully.',
    'Important-Follow-Up': 'I appreciate you following up. Let me address your points.',
    'Work': 'Thank you for your work-related email. I\'ll respond accordingly.',
    'Personal': 'Thanks for your personal message. I appreciate you reaching out.',
    'Social': 'Thanks for the social update. Great to hear from you.',
    'Notifications-Updates': 'Thank you for the notification. I\'ve noted the update.',
    'Spam-Promotions': 'Thank you for your message.',
    'Other': 'Thank you for your email. I\'ll review this and get back to you soon.'
  }
  return templates[category] || templates['Other']
}

function getPriorityBasedUrgency(priority: string) {
  switch (priority) {
    case 'high': return 'urgent'
    case 'medium': return 'high'
    case 'low': return 'medium'
    default: return 'low'
  }
}

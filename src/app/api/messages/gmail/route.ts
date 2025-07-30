import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const url = new URL(request.url)
    const folder = url.searchParams.get('folder') || 'INBOX'
    const maxResults = parseInt(url.searchParams.get('maxResults') || '20')
    const pageToken = url.searchParams.get('pageToken')

    // Note: In a real implementation, you would need to store OAuth tokens per user
    // For now, we'll return mock data
    const mockEmails = [
      {
        id: '1',
        threadId: 'thread-1',
        snippet: 'Important project update regarding the Q4 deliverables...',
        payload: {
          headers: [
            { name: 'From', value: 'john.doe@company.com' },
            { name: 'To', value: user.email },
            { name: 'Subject', value: 'Q4 Project Update - Action Required' },
            { name: 'Date', value: new Date().toISOString() }
          ]
        },
        internalDate: Date.now().toString(),
        labelIds: ['INBOX', 'IMPORTANT'],
        isRead: false,
        priority: 'high' as const,
        hasAttachments: true
      },
      {
        id: '2',
        threadId: 'thread-2',
        snippet: 'Weekly team meeting scheduled for tomorrow at 2 PM...',
        payload: {
          headers: [
            { name: 'From', value: 'team-lead@company.com' },
            { name: 'To', value: user.email },
            { name: 'Subject', value: 'Weekly Team Meeting - Tomorrow 2PM' },
            { name: 'Date', value: new Date(Date.now() - 3600000).toISOString() }
          ]
        },
        internalDate: (Date.now() - 3600000).toString(),
        labelIds: ['INBOX'],
        isRead: true,
        priority: 'medium' as const,
        hasAttachments: false
      },
      {
        id: '3',
        threadId: 'thread-3',
        snippet: 'Your invoice for this month has been generated and is ready for review...',
        payload: {
          headers: [
            { name: 'From', value: 'billing@service.com' },
            { name: 'To', value: user.email },
            { name: 'Subject', value: 'Monthly Invoice - Review Required' },
            { name: 'Date', value: new Date(Date.now() - 86400000).toISOString() }
          ]
        },
        internalDate: (Date.now() - 86400000).toString(),
        labelIds: ['INBOX'],
        isRead: false,
        priority: 'low' as const,
        hasAttachments: true
      }
    ]

    return NextResponse.json({
      emails: mockEmails,
      nextPageToken: null,
      resultSizeEstimate: mockEmails.length
    })

  } catch (error) {
    console.error('Error fetching Gmail messages:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user

    const { to, subject, body, threadId, isDraft } = await request.json()

    // Mock sending email
    const emailData = {
      id: `email-${Date.now()}`,
      threadId: threadId || `thread-${Date.now()}`,
      snippet: body.substring(0, 100) + '...',
      payload: {
        headers: [
          { name: 'From', value: user.email },
          { name: 'To', value: to },
          { name: 'Subject', value: subject },
          { name: 'Date', value: new Date().toISOString() }
        ]
      },
      internalDate: Date.now().toString(),
      labelIds: isDraft ? ['DRAFT'] : ['SENT'],
      isRead: true,
      priority: 'medium' as const,
      hasAttachments: false
    }

    return NextResponse.json({
      success: true,
      email: emailData,
      message: isDraft ? 'Draft saved successfully' : 'Email sent successfully'
    })

  } catch (error) {
    console.error('Error sending/saving email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

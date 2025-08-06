import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, dateRange } = await request.json()

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication tokens' },
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
      expiry_date: Date.now() + 3600000
    })

    const gmail = gmailService.gmail

    // Get recent emails for analysis (last 30 days or custom range)
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date()

    const query = `after:${Math.floor(startDate.getTime() / 1000)} before:${Math.floor(endDate.getTime() / 1000)}`
    
    // Fetch emails for analysis
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 200 // Limit for performance
    })

    const messages = listResponse.data.messages || []
    
    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        insights: {
          totalAnalyzed: 0,
          topSubjects: [],
          senderAnalysis: [],
          timePatterns: {},
          labelDistribution: [],
          recommendations: ['No emails found in the specified date range.']
        }
      })
    }

    // Fetch detailed email data (in batches for performance)
    const batchSize = 50
    const emailDetails: any[] = []
    
    for (let i = 0; i < Math.min(messages.length, 100); i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      const batchPromises = batch.map(async (message) => {
        try {
          const emailResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date', 'To']
          })
          return emailResponse.data
        } catch (error) {
          console.error('Error fetching email:', error)
          return null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      emailDetails.push(...batchResults.filter(email => email !== null))
    }

    // Analyze the data
    const insights = analyzeEmailData(emailDetails)

    return NextResponse.json({
      success: true,
      insights: {
        ...insights,
        totalAnalyzed: emailDetails.length,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
      }
    })

  } catch (error) {
    console.error('Gmail insights error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

function analyzeEmailData(emails: any[]) {
  // Subject line analysis
  const subjectMap = new Map<string, number>()
  const senderMap = new Map<string, number>()
  const hourMap = new Map<number, number>()
  const labelMap = new Map<string, number>()
  
  emails.forEach(email => {
    const headers = email.payload?.headers || []
    
    // Subject analysis
    const subjectHeader = headers.find((h: any) => h.name === 'Subject')
    if (subjectHeader) {
      const subject = subjectHeader.value
      // Group by first 30 characters to find patterns
      const pattern = subject.substring(0, 30).toLowerCase()
      subjectMap.set(pattern, (subjectMap.get(pattern) || 0) + 1)
    }
    
    // Sender analysis
    const fromHeader = headers.find((h: any) => h.name === 'From')
    if (fromHeader) {
      const sender = extractEmail(fromHeader.value)
      senderMap.set(sender, (senderMap.get(sender) || 0) + 1)
    }
    
    // Time pattern analysis
    const dateHeader = headers.find((h: any) => h.name === 'Date')
    if (dateHeader) {
      const date = new Date(dateHeader.value)
      const hour = date.getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    }
    
    // Label analysis
    if (email.labelIds) {
      email.labelIds.forEach((labelId: string) => {
        labelMap.set(labelId, (labelMap.get(labelId) || 0) + 1)
      })
    }
  })

  // Top subject patterns
  const topSubjects = Array.from(subjectMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([subject, count]) => ({
      pattern: subject + '...',
      count,
      percentage: Math.round((count / emails.length) * 100)
    }))

  // Top senders
  const topSenders = Array.from(senderMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([sender, count]) => ({
      sender,
      count,
      percentage: Math.round((count / emails.length) * 100)
    }))

  // Time patterns
  const peakHours = Array.from(hourMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
      percentage: Math.round((count / emails.length) * 100)
    }))

  // Label distribution
  const labelDistribution = Array.from(labelMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([labelId, count]) => ({
      labelId,
      count,
      percentage: Math.round((count / emails.length) * 100)
    }))

  // Generate recommendations
  const recommendations = []
  
  if (emails.length > 50) {
    recommendations.push(`You've processed ${emails.length} emails. Consider using AI classification for better organization.`)
  }
  
  if (topSenders.length > 0 && topSenders[0].percentage > 20) {
    recommendations.push(`${topSenders[0].sender} sends ${topSenders[0].percentage}% of your emails. Consider creating a filter.`)
  }
  
  if (peakHours.length > 0) {
    recommendations.push(`Most emails arrive around ${peakHours[0].hour}. This might be your optimal processing time.`)
  }

  return {
    topSubjects,
    senderAnalysis: topSenders,
    timePatterns: {
      peakHours,
      totalHours: hourMap.size
    },
    labelDistribution,
    recommendations
  }
}

function extractEmail(fromHeader: string): string {
  const emailMatch = fromHeader.match(/<(.+?)>/)
  if (emailMatch) {
    return emailMatch[1]
  }
  
  // If no angle brackets, assume the whole string is the email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const match = fromHeader.match(emailRegex)
  return match ? match[0] : fromHeader.trim()
}

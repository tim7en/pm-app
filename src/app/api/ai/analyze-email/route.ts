import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, email } = await request.json()

    // Create a structured prompt for email analysis
    const analysisPrompt = `
You are an AI email analyst specializing in sales prospect categorization. Analyze the following email and provide insights.

Email Details:
- Subject: ${email.subject}
- From: ${email.from}
- Body: ${email.body}
- Snippet: ${email.snippet}

Please analyze this email and provide a JSON response with the following structure:
{
  "prospectStage": "one of: cold-outreach, interested, qualified, proposal, negotiation, closed-won, closed-lost, follow-up",
  "confidence": 0.85,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "followUpSuggestion": "Suggested follow-up action",
  "suggestedResponse": "Template response suggestion",
  "urgencyLevel": "one of: low, medium, high, urgent",
  "keyIndicators": ["list", "of", "key", "phrases", "found"],
  "reasoning": "Brief explanation of the analysis"
}

Focus on identifying:
1. The prospect's level of interest and engagement
2. Where they are in the sales funnel
3. Urgency indicators
4. Sentiment and tone
5. Whether immediate follow-up is needed
`

    // In a real implementation, this would call OpenAI's API
    // For now, return a mock analysis
    const mockAnalysis = {
      prospectStage: email.body.toLowerCase().includes('interested') ? 'interested' : 'cold-outreach',
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      sentiment: Math.random() * 0.6 - 0.3, // -0.3 to 0.3
      needsFollowUp: !email.isRead || Math.random() > 0.6,
      followUpSuggestion: generateFollowUpSuggestion(email),
      suggestedResponse: generateResponseTemplate(email),
      urgencyLevel: determineUrgency(email),
      keyIndicators: extractKeywords(email),
      reasoning: `Analysis based on email content, subject line, and sender patterns.`
    }

    return NextResponse.json(mockAnalysis)

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    )
  }
}

function generateFollowUpSuggestion(email: any): string {
  const suggestions = [
    `Follow up on "${email.subject}" within 2-3 business days`,
    `Schedule a call to discuss the points raised in this email`,
    `Send additional information based on their expressed interest`,
    `Circle back with pricing details or proposal`,
    `Check in to see if they need any clarification`
  ]
  
  return suggestions[Math.floor(Math.random() * suggestions.length)]
}

function generateResponseTemplate(email: any): string {
  const templates = [
    `Hi ${extractFirstName(email.from)},\n\nThank you for your email regarding "${email.subject}". I appreciate your interest and would love to discuss this further.\n\nWould you be available for a brief call this week to explore how we can help?\n\nBest regards`,
    `Dear ${extractFirstName(email.from)},\n\nI hope this email finds you well. Thank you for reaching out about "${email.subject}".\n\nI'd be happy to provide more information and answer any questions you might have. When would be a good time for a quick conversation?\n\nLooking forward to hearing from you.`,
    `Hi ${extractFirstName(email.from)},\n\nThanks for your message. I understand you're interested in learning more about our solutions.\n\nI've attached some additional information that might be helpful. Would you like to schedule a demo to see how this could work for your specific needs?\n\nBest regards`
  ]
  
  return templates[Math.floor(Math.random() * templates.length)]
}

function extractFirstName(email: string): string {
  // Simple name extraction - in real implementation, use more sophisticated parsing
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function determineUrgency(email: any): string {
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'time sensitive']
  const highKeywords = ['important', 'priority', 'soon', 'quick', 'fast']
  
  const content = `${email.subject} ${email.body}`.toLowerCase()
  
  if (urgentKeywords.some(keyword => content.includes(keyword))) {
    return 'urgent'
  }
  
  if (highKeywords.some(keyword => content.includes(keyword))) {
    return 'high'
  }
  
  if (!email.isRead) {
    return 'medium'
  }
  
  return 'low'
}

function extractKeywords(email: any): string[] {
  const content = `${email.subject} ${email.body}`.toLowerCase()
  const keywords = [
    'interested', 'budget', 'timeline', 'decision', 'proposal', 'pricing',
    'demo', 'meeting', 'call', 'schedule', 'urgent', 'important',
    'questions', 'information', 'details', 'features', 'benefits'
  ]
  
  return keywords.filter(keyword => content.includes(keyword))
}

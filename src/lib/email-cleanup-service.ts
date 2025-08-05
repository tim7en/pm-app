// Email Cleanup Co-Pilot Core Logic
import { db } from '@/lib/db'

export interface EmailData {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  body: string
  snippet: string
  timestamp: Date
  isRead: boolean
  labels: string[]
  attachments?: Array<{
    filename: string
    mimeType: string
    size: number
  }>
  rawHeaders?: Record<string, string>
}

export interface ProspectStage {
  id: string
  name: string
  description: string
  keywords: string[]
  priority: number
  color: string
}

export interface EmailCategorization {
  emailId: string
  prospectStage: ProspectStage
  confidence: number
  followUpOpportunity: boolean
  followUpSuggestion?: string
  responseTemplate?: string
  engagementScore: number
  sentimentScore: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
}

export interface EmailInsights {
  totalEmails: number
  categorizedEmails: number
  followUpOpportunities: number
  averageResponseTime: number
  engagementTrends: Array<{
    date: string
    openRate: number
    responseRate: number
  }>
  topPerformingSubjects: Array<{
    subject: string
    responseRate: number
    count: number
  }>
  prospectStageDistribution: Array<{
    stage: ProspectStage
    count: number
    percentage: number
  }>
}

// Default prospect stages
export const DEFAULT_PROSPECT_STAGES: ProspectStage[] = [
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    description: 'Initial contact attempts',
    keywords: ['introduction', 'cold', 'reaching out', 'connect', 'introduce'],
    priority: 1,
    color: '#3B82F6'
  },
  {
    id: 'interested',
    name: 'Interested',
    description: 'Showing interest or asking questions',
    keywords: ['interested', 'tell me more', 'questions', 'curious', 'learn more'],
    priority: 2,
    color: '#10B981'
  },
  {
    id: 'qualified',
    name: 'Qualified',
    description: 'Qualified leads ready for next steps',
    keywords: ['budget', 'timeline', 'decision maker', 'qualified', 'next steps'],
    priority: 3,
    color: '#F59E0B'
  },
  {
    id: 'proposal',
    name: 'Proposal Stage',
    description: 'Proposal sent or being discussed',
    keywords: ['proposal', 'quote', 'pricing', 'contract', 'terms'],
    priority: 4,
    color: '#8B5CF6'
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    description: 'Negotiating terms and details',
    keywords: ['negotiate', 'revisions', 'changes', 'terms', 'conditions'],
    priority: 5,
    color: '#EF4444'
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    description: 'Successfully closed deals',
    keywords: ['accept', 'signed', 'approved', 'go ahead', 'confirmed'],
    priority: 6,
    color: '#059669'
  },
  {
    id: 'closed-lost',
    name: 'Closed Lost',
    description: 'Lost opportunities',
    keywords: ['not interested', 'declined', 'reject', 'pass', 'no thank you'],
    priority: 7,
    color: '#6B7280'
  },
  {
    id: 'follow-up',
    name: 'Follow-up Required',
    description: 'Needs follow-up action',
    keywords: ['follow up', 'check in', 'touch base', 'remind', 'circle back'],
    priority: 8,
    color: '#F97316'
  }
]

export class EmailCleanupService {
  /**
   * Categorize email using AI analysis
   */
  async categorizeEmail(email: EmailData): Promise<EmailCategorization> {
    try {
      // Analyze email content using GPT-4
      const analysis = await this.analyzeEmailWithAI(email.subject, email.body, email.from)
      
      // Match with prospect stages
      const prospectStage = this.matchProspectStage(email.subject, email.body)
      
      // Generate insights
      const categorization: EmailCategorization = {
        emailId: email.id,
        prospectStage: prospectStage || DEFAULT_PROSPECT_STAGES[0],
        confidence: analysis.confidence,
        followUpOpportunity: analysis.needsFollowUp,
        followUpSuggestion: analysis.followUpSuggestion,
        responseTemplate: analysis.suggestedResponse,
        engagementScore: this.calculateEngagementScore(email, analysis),
        sentimentScore: analysis.sentiment,
        urgencyLevel: this.determineUrgencyLevel(email, analysis)
      }
      
      // Store in database (mock for demo)
      // await this.storeCategorization(categorization)
      
      return categorization
    } catch (error) {
      console.error('Error categorizing email:', error)
      throw error
    }
  }

  /**
   * Analyze email content using AI
   */
  public async analyzeEmailWithAI(subject: string, body: string, from: string) {
    const prompt = `
Analyze this email for sales prospect categorization:

Subject: ${subject}
From: ${from}
Body: ${body}

Analyze and provide:
1. Prospect stage based on content
2. Sentiment score (-1 to 1)
3. Whether follow-up is needed
4. Priority level (low, medium, high)
5. Key entities mentioned
6. Suggested actions
7. Confidence level (0-1)

Respond in JSON format.
`

    try {
      // This would integrate with your AI service (OpenAI, etc.)
      const response = await fetch('/api/ai/analyze-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, subject, body, from })
      })
      
      const result = await response.json()
      return {
        priority: result.priority || 'medium',
        sentiment: result.sentiment || 0,
        keyEntities: result.keyEntities || [],
        suggestedActions: result.suggestedActions || [],
        confidence: result.confidence || 0.5,
        needsFollowUp: result.needsFollowUp || false,
        followUpSuggestion: result.followUpSuggestion,
        suggestedResponse: result.suggestedResponse,
        suggestedStage: result.suggestedStage
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      return this.fallbackAnalysis(subject, body, from)
    }
  }

  /**
   * Match email to prospect stage
   */
  public matchProspectStage(subject: string, body: string): ProspectStage | null {
    let bestMatch: ProspectStage | null = null
    let highestScore = 0

    const content = `${subject} ${body}`.toLowerCase()

    for (const stage of DEFAULT_PROSPECT_STAGES) {
      let score = 0
      
      // Keyword matching
      for (const keyword of stage.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 1
        }
      }

      if (score > highestScore && score > 0) {
        highestScore = score
        bestMatch = stage
      }
    }

    return bestMatch
  }

  /**
   * Calculate stage matching score
   */
  private calculateStageScore(email: EmailData, stage: ProspectStage, analysis: any): number {
    let score = 0
    const content = `${email.subject} ${email.body}`.toLowerCase()

    // Keyword matching
    for (const keyword of stage.keywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 1
      }
    }

    // AI analysis bonus
    if (analysis.suggestedStage === stage.id) {
      score += 5
    }

    return score
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(email: EmailData, analysis: any): number {
    let score = 0.5 // Base score

    // Email length indicates engagement
    if (email.body.length > 500) score += 0.2
    if (email.body.length > 1000) score += 0.1

    // Questions indicate engagement
    const questionCount = (email.body.match(/\?/g) || []).length
    score += Math.min(questionCount * 0.1, 0.3)

    // Sentiment boost
    if (analysis.sentiment > 0.3) score += 0.2

    // Response timing (if available)
    // This would need additional email thread analysis

    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Determine urgency level
   */
  private determineUrgencyLevel(email: EmailData, analysis: any): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'time sensitive']
    const highKeywords = ['important', 'priority', 'soon', 'quick']
    
    const content = `${email.subject} ${email.body}`.toLowerCase()
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'urgent'
    }
    
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'high'
    }
    
    if (analysis.needsFollowUp) {
      return 'medium'
    }
    
    return 'low'
  }

  /**
   * Store categorization in database
   */
  private async storeCategorization(categorization: EmailCategorization) {
    await db.emailCategorization.upsert({
      where: { emailId: categorization.emailId },
      update: {
        prospectStageId: categorization.prospectStage.id,
        confidence: categorization.confidence,
        followUpOpportunity: categorization.followUpOpportunity,
        followUpSuggestion: categorization.followUpSuggestion,
        responseTemplate: categorization.responseTemplate,
        engagementScore: categorization.engagementScore,
        sentimentScore: categorization.sentimentScore,
        urgencyLevel: categorization.urgencyLevel,
        updatedAt: new Date()
      },
      create: {
        emailId: categorization.emailId,
        prospectStageId: categorization.prospectStage.id,
        confidence: categorization.confidence,
        followUpOpportunity: categorization.followUpOpportunity,
        followUpSuggestion: categorization.followUpSuggestion,
        responseTemplate: categorization.responseTemplate,
        engagementScore: categorization.engagementScore,
        sentimentScore: categorization.sentimentScore,
        urgencyLevel: categorization.urgencyLevel
      }
    })
  }

  /**
   * Fallback analysis when AI fails
   */
  private fallbackAnalysis(subject: string, body: string, from: string) {
    return {
      priority: 'medium' as const,
      sentiment: 0,
      keyEntities: [],
      suggestedActions: [],
      confidence: 0.3,
      needsFollowUp: true,
      followUpSuggestion: "Follow up on this email",
      suggestedResponse: "Thank you for your email. I'll review and get back to you soon.",
      suggestedStage: 'cold-outreach'
    }
  }

  /**
   * Get email insights for dashboard
   */
  async getEmailInsights(userId: string, dateRange?: { start: Date; end: Date }): Promise<EmailInsights> {
    // Implementation would query database for user's email data
    // This is a placeholder structure
    return {
      totalEmails: 0,
      categorizedEmails: 0,
      followUpOpportunities: 0,
      averageResponseTime: 0,
      engagementTrends: [],
      topPerformingSubjects: [],
      prospectStageDistribution: []
    }
  }

  /**
   * Process bulk emails
   */
  async processBulkEmails(emails: EmailData[]): Promise<EmailCategorization[]> {
    const results: EmailCategorization[] = []
    
    // Process in batches to avoid overwhelming the AI API
    const batchSize = 10
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(email => this.categorizeEmail(email))
      )
      results.push(...batchResults)
    }
    
    return results
  }
}

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

// Default classification stages (Updated to match the new 8-category system)
export const DEFAULT_CLASSIFICATION_LABELS: ProspectStage[] = [
  {
    id: 'Personal',
    name: 'Personal',
    description: 'Personal communications from friends and family',
    keywords: ['family', 'personal', 'friends', 'private'],
    priority: 2,
    color: '#3B82F6'
  },
  {
    id: 'Work',
    name: 'Work',
    description: 'Work-related communications and business emails',
    keywords: ['project', 'meeting', 'work', 'business', 'colleague', 'office', 'report'],
    priority: 1,
    color: '#10B981'
  },
  {
    id: 'Spam/Promotions',
    name: 'Spam/Promotions',
    description: 'Marketing emails and promotional content',
    keywords: ['sale', 'offer', 'promotion', 'discount', 'marketing', 'unsubscribe', 'deal'],
    priority: 3,
    color: '#EF4444'
  },
  {
    id: 'Social',
    name: 'Social',
    description: 'Social media and community communications',
    keywords: ['social', 'community', 'event', 'network', 'forum', 'group'],
    priority: 3,
    color: '#8B5CF6'
  },
  {
    id: 'Notifications/Updates',
    name: 'Notifications/Updates',
    description: 'System notifications and service updates',
    keywords: ['notification', 'update', 'system', 'account', 'automated', 'service'],
    priority: 3,
    color: '#F59E0B'
  },
  {
    id: 'Finance',
    name: 'Finance',
    description: 'Financial and banking communications',
    keywords: ['bank', 'payment', 'invoice', 'financial', 'billing', 'transaction', 'statement'],
    priority: 1,
    color: '#059669'
  },
  {
    id: 'Job Opportunities',
    name: 'Job Opportunities',
    description: 'Career and employment related emails',
    keywords: ['job', 'career', 'recruitment', 'opportunity', 'position', 'hiring', 'resume'],
    priority: 2,
    color: '#6366F1'
  },
  {
    id: 'Important/Follow Up',
    name: 'Important/Follow Up',
    description: 'High priority items requiring immediate attention',
    keywords: ['urgent', 'important', 'deadline', 'action required', 'follow up', 'asap', 'critical'],
    priority: 1,
    color: '#DC2626'
  },
  {
    id: 'Other',
    name: 'Other',
    description: 'Unclassifiable or error cases',
    keywords: [],
    priority: 3,
    color: '#6B7280'
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
        prospectStage: prospectStage || DEFAULT_CLASSIFICATION_LABELS[0],
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
You are an expert AI email analyst. Your task is to analyze incoming emails and classify them into exactly one of the following 8 predefined categories based on the email content, sender, and context.

EMAIL TO ANALYZE:
Subject: ${subject}
From: ${from}
Body: ${body}

CLASSIFICATION CATEGORIES WITH PRIORITIES (Choose EXACTLY ONE):

PRIORITY 1 - IMMEDIATE ATTENTION (High Priority):
1. "Work" - Work-Related Communications  
   • Business emails related to work projects
   • Professional communications with colleagues
   • Work meetings, reports, and updates
   • Keywords: project, meeting, work, business, colleague, office, report

2. "Finance" - Financial and Banking Communications
   • Banking statements and notifications
   • Financial services communications
   • Investment and trading updates
   • Payment and billing notifications
   • Keywords: bank, payment, invoice, financial, billing, transaction, statement

3. "Important/Follow Up" - High Priority Items Requiring Action
   • Urgent emails requiring immediate attention
   • Important deadlines and time-sensitive matters
   • Follow-up items that need action
   • Critical communications
   • Keywords: urgent, important, deadline, action required, follow up, asap, critical

PRIORITY 2 - IMPORTANT (Medium Priority):
4. "Personal" - Personal Communications
   • Personal emails from friends and family
   • Private matters and personal discussions
   • Non-work related personal correspondence
   • Keywords: personal, family, friends, private

5. "Job Opportunities" - Career and Employment Related
   • Job applications and opportunities
   • Recruitment communications
   • Career development emails
   • Professional networking for job purposes
   • Keywords: job, career, recruitment, opportunity, position, hiring, resume

PRIORITY 3 - LOW PRIORITY:
6. "Social" - Social Media and Social Communications
   • Social media notifications
   • Social network updates
   • Community and forum communications
   • Social events and activities
   • Keywords: social, community, event, network, forum, group

7. "Notifications/Updates" - System and Service Notifications
   • System notifications and updates
   • Service updates from platforms
   • Account notifications
   • Automated system messages
   • Keywords: notification, update, system, account, automated, service

8. "Spam/Promotions" - Marketing and Promotional Content
   • Marketing emails and advertisements
   • Promotional offers and sales
   • Newsletter subscriptions and campaigns
   • Spam and unwanted promotional content
   • Keywords: sale, offer, promotion, discount, marketing, unsubscribe, deal

9. "Other" - Unclassifiable or Error Cases
   • Emails that don't fit into other categories
   • Corrupted or unclear content
   • Mixed category content
   • Classification errors or edge cases
   • Keywords: none specific, fallback category
ANALYSIS REQUIREMENTS:
1. Read the email content carefully
2. Identify key indicators and context clues
3. Consider the sender's email domain and signature
4. Look for specific intent and purpose
5. Classify into the MOST APPROPRIATE single category
6. Assign priority based on the category (Priority 1 = high, Priority 2 = medium, Priority 3 = low)
7. Provide confidence level (0.0 to 1.0)
8. Include reasoning for your classification

RESPONSE FORMAT (JSON):
{
  "category": "one of the 9 categories above",
  "confidence": 0.85,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "priority": "high/medium/low",
  "reasoning": "Clear explanation of classification decision",
  "keyEntities": ["important", "entities", "mentioned"],
  "suggestedActions": ["actionable", "suggestions"],
  "followUpSuggestion": "Specific follow-up recommendation",
  "suggestedResponse": "Brief response template",
  "personalRelevance": 0.8
}

PRIORITY ASSIGNMENT RULES:
• HIGH Priority: Work, Finance, Important/Follow Up
• MEDIUM Priority: Personal, Job Opportunities  
• LOW Priority: Social, Notifications/Updates, Spam/Promotions, Other

Return valid JSON with all requested fields.
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
        suggestedStage: result.category || result.suggestedStage, // Support both new and legacy format
        personalRelevance: result.personalRelevance || 0.5
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

    for (const stage of DEFAULT_CLASSIFICATION_LABELS) {
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
    // Database operations commented out for now - would need proper schema
    /*
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
    */
    console.log('Email categorization stored (mock):', categorization.emailId)
  }

  /**
   * Fallback analysis when AI fails
   */
  private fallbackAnalysis(subject: string, body: string, from: string) {
    const content = `${subject} ${body} ${from}`.toLowerCase()
    
    // Check for urgent/important indicators
    if (content.includes('urgent') || content.includes('important') || content.includes('asap') || 
        content.includes('deadline') || content.includes('action required')) {
      return {
        priority: 'high' as const,
        sentiment: 0,
        keyEntities: ['urgent'],
        suggestedActions: ['Immediate review required'],
        confidence: 0.7,
        needsFollowUp: true,
        followUpSuggestion: "Urgent attention required - review immediately",
        suggestedResponse: "Thank you for your urgent message. I will review and respond as soon as possible.",
        suggestedStage: 'Important/Follow Up',
        personalRelevance: 0.8
      }
    }
    
    // Check for work-related indicators
    if (content.includes('project') || content.includes('meeting') || content.includes('work') || 
        content.includes('business') || content.includes('colleague')) {
      return {
        priority: 'high' as const,
        sentiment: 0,
        keyEntities: ['work'],
        suggestedActions: ['Review work-related content'],
        confidence: 0.6,
        needsFollowUp: true,
        followUpSuggestion: "Work-related email - review and respond appropriately",
        suggestedResponse: "Thank you for your email. I'll review the details and get back to you soon.",
        suggestedStage: 'Work',
        personalRelevance: 0.7
      }
    }
    
    // Check for promotional content
    if (content.includes('sale') || content.includes('offer') || content.includes('promotion') || 
        content.includes('discount') || content.includes('unsubscribe')) {
      return {
        priority: 'low' as const,
        sentiment: 0,
        keyEntities: ['promotion'],
        suggestedActions: ['Review promotional content'],
        confidence: 0.8,
        needsFollowUp: false,
        followUpSuggestion: "Promotional email - no follow-up needed",
        suggestedResponse: "Thank you for the information.",
        suggestedStage: 'Spam/Promotions',
        personalRelevance: 0.2
      }
    }
    
    // Check for financial content
    if (content.includes('bank') || content.includes('payment') || content.includes('invoice') || 
        content.includes('financial') || content.includes('billing')) {
      return {
        priority: 'medium' as const,
        sentiment: 0,
        keyEntities: ['finance'],
        suggestedActions: ['Review financial content'],
        confidence: 0.7,
        needsFollowUp: true,
        followUpSuggestion: "Financial matter - review and take appropriate action",
        suggestedResponse: "Thank you for the financial information. I'll review this accordingly.",
        suggestedStage: 'Finance',
        personalRelevance: 0.6
      }
    }
    
    // Default fallback
    return {
      priority: 'medium' as const,
      sentiment: 0,
      keyEntities: [],
      suggestedActions: ['General review'],
      confidence: 0.3,
      needsFollowUp: true,
      followUpSuggestion: "General email - review as needed",
      suggestedResponse: "Thank you for your email. I'll review and get back to you soon.",
      suggestedStage: 'Notifications/Updates',
      personalRelevance: 0.3
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

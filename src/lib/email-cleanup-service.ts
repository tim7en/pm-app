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

// Default business classification stages (Updated for Timur Sabitov's professional context)
export const DEFAULT_BUSINESS_STAGES: ProspectStage[] = [
  {
    id: 'high-priority-personal',
    name: 'High Priority Personal',
    description: 'Personal emails from family, close friends, and urgent personal matters',
    keywords: ['family', 'personal', 'urgent', 'health', 'emergency', 'important personal'],
    priority: 1,
    color: '#DC2626'
  },
  {
    id: 'climate-finance-work',
    name: 'Climate Finance & Work',
    description: 'Climate finance, GCF, Adaptation Fund, UNDP, UNESCO, and official work communications',
    keywords: ['GCF', 'Green Climate Fund', 'Adaptation Fund', 'UNDP', 'UNESCO', 'climate finance', 'UNFCCC', 'NDC', 'ministry', 'official', 'work', 'project', 'climate', 'environmental'],
    priority: 1,
    color: '#059669'
  },
  {
    id: 'academic-research',
    name: 'Academic & Research',
    description: 'University work, research collaboration, publications, and academic opportunities',
    keywords: ['university', 'research', 'publication', 'academic', 'lecture', 'teaching', 'peer review', 'conference', 'paper', 'journal', 'collaboration', 'fulbright', 'scholarship'],
    priority: 1,
    color: '#7C3AED'
  },
  {
    id: 'international-organizations',
    name: 'International Organizations',
    description: 'Communications from World Bank, ADB, AFD, EU, and other international bodies',
    keywords: ['World Bank', 'ADB', 'Asian Development Bank', 'AFD', 'European Union', 'EU', 'international', 'development', 'funding', 'grant', 'bilateral', 'multilateral'],
    priority: 1,
    color: '#0EA5E9'
  },
  {
    id: 'consulting-opportunities',
    name: 'Consulting & Opportunities',
    description: 'Consulting work, career opportunities, and professional development',
    keywords: ['consulting', 'consultant', 'opportunity', 'career', 'job', 'position', 'contract', 'freelance', 'expert', 'specialist'],
    priority: 2,
    color: '#10B981'
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    description: 'Banking, investments, financial management, and personal finance matters',
    keywords: ['bank', 'banking', 'investment', 'finance', 'financial', 'payment', 'invoice', 'money', 'salary', 'tax', 'insurance'],
    priority: 2,
    color: '#F59E0B'
  },
  {
    id: 'professional-network',
    name: 'Professional Network',
    description: 'Professional networking, industry contacts, and business relationships',
    keywords: ['networking', 'professional', 'business', 'industry', 'contact', 'colleague', 'partnership', 'collaboration'],
    priority: 2,
    color: '#8B5CF6'
  },
  {
    id: 'media-outreach',
    name: 'Media & Outreach',
    description: 'Media interviews, public relations, and outreach opportunities',
    keywords: ['interview', 'media', 'press', 'journalist', 'article', 'blog', 'content', 'public relations', 'outreach'],
    priority: 3,
    color: '#14B8A6'
  },
  {
    id: 'administrative',
    name: 'Administrative',
    description: 'General administration, newsletters, and low-priority notifications',
    keywords: ['newsletter', 'notification', 'admin', 'system', 'update', 'maintenance', 'subscription', 'marketing'],
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
        prospectStage: prospectStage || DEFAULT_BUSINESS_STAGES[0],
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
You are analyzing emails for Timur Sabitov, an Environmental Scientist and Project Manager with expertise in climate change, international development, and project management.

RECIPIENT CONTEXT:
- Name: Timur Sabitov
- Email: sabitov.ty@gmail.com, Phone: +998 99 893 24 33
- Role: Head of Project Management Unit, National Center for Climate Change
- Expertise: Climate finance (GCF, Adaptation Fund), environmental engineering, project management
- Affiliations: UNFCCC IPCC focal point, UNESCO, UNDP, World Bank, ADB, AFD projects
- Education: Fulbright Scholar (SUNY-ESF), Environmental Engineering MS, Duke Financial Management
- Languages: Russian (native), Uzbek (native), English (fluent)
- Location: Tashkent, Uzbekistan

EMAIL TO ANALYZE:
Subject: ${subject}
From: ${from}
Body: ${body}

CLASSIFICATION PRIORITIES (1=highest, 3=lowest):
Priority 1 - IMMEDIATE ATTENTION:
- high-priority-personal: Family, health, urgent personal matters
- climate-finance-work: GCF, Adaptation Fund, UNDP, UNESCO, ministry work, climate projects
- academic-research: University work, research, publications, teaching duties
- international-organizations: World Bank, ADB, AFD, EU, international development

Priority 2 - IMPORTANT:
- consulting-opportunities: Consulting work, expert positions, career opportunities
- personal-finance: Banking, investments, financial management
- professional-network: Professional networking, industry contacts

Priority 3 - LOW PRIORITY:
- media-outreach: Media interviews, PR opportunities
- administrative: Newsletters, notifications, marketing

ANALYSIS INSTRUCTIONS:
1. Identify if email is DIRECTLY addressed to Timur Sabitov (check To: field, subject mentions)
2. Look for keywords related to Timur's work areas: climate change, environmental, GCF, adaptation, UNDP, UNESCO, project management, research
3. Assess sender authority/importance (government, international orgs, universities vs marketing)
4. Determine urgency based on content and sender
5. Check for personal connections (colleagues, academic networks, project partners)

Analyze and provide:
1. Business classification stage (from the 9 categories above)
2. Sentiment score (-1 to 1)
3. Whether follow-up is needed
4. Priority level (high, medium, low) - bias toward HIGH for direct work/personal emails
5. Key entities mentioned (organizations, people, projects)
6. Suggested actions
7. Confidence level (0-1)
8. Personal relevance score (0-1) - how directly this relates to Timur personally

PRIORITY BOOST FACTORS:
- Direct mention of "Timur" or "Sabitov" (+0.3 confidence)
- Climate/environmental keywords (+0.2 confidence)
- International organization senders (+0.2 confidence)
- Project/work related content (+0.2 confidence)
- Personal/urgent language (+0.3 confidence)

Respond in JSON format with all requested fields.
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
        suggestedStage: result.suggestedStage,
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

    for (const stage of DEFAULT_BUSINESS_STAGES) {
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
    const content = `${subject} ${body} ${from}`.toLowerCase()
    
    // Check for high-priority personal indicators
    if (content.includes('urgent') || content.includes('emergency') || content.includes('family')) {
      return {
        priority: 'high' as const,
        sentiment: 0,
        keyEntities: [],
        suggestedActions: ['Immediate review required'],
        confidence: 0.4,
        needsFollowUp: true,
        followUpSuggestion: "Urgent attention required - review immediately",
        suggestedResponse: "Thank you for your urgent message. I will review and respond as soon as possible.",
        suggestedStage: 'high-priority-personal',
        personalRelevance: 0.8
      }
    }
    
    // Check for work-related indicators
    if (content.includes('gcf') || content.includes('climate') || content.includes('project') || 
        content.includes('ministry') || content.includes('undp') || content.includes('unesco')) {
      return {
        priority: 'high' as const,
        sentiment: 0,
        keyEntities: [],
        suggestedActions: ['Review work-related content'],
        confidence: 0.4,
        needsFollowUp: true,
        followUpSuggestion: "Work-related email - review and respond appropriately",
        suggestedResponse: "Thank you for your email. I'll review the details and get back to you soon.",
        suggestedStage: 'climate-finance-work',
        personalRelevance: 0.7
      }
    }
    
    // Default fallback
    return {
      priority: 'medium' as const,
      sentiment: 0,
      keyEntities: [],
      suggestedActions: [],
      confidence: 0.3,
      needsFollowUp: true,
      followUpSuggestion: "Follow up on this email",
      suggestedResponse: "Thank you for your email. I'll review and get back to you soon.",
      suggestedStage: 'administrative',
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

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import OpenAI from 'openai'
import { ZaiClient } from '@/lib/zai-client'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Z.AI
const zaiClient = new ZaiClient(process.env.ZAI_API_KEY || '5bb6d9567c6a40568f61bcd8e76483a7.BLqz1y96gXl5dPBx')

export async function POST(request: NextRequest) {
  try {
    // Skip session check for now to allow testing
    // const session = await getAuthSession(request)
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { prompt, subject, body, from } = await request.json()

    console.log(`🤖 AI Analysis Request:`)
    console.log(`   • Subject: ${subject}`)
    console.log(`   • From: ${from}`)
    console.log(`   • Body length: ${body?.length || 0} chars`)

    // Create a structured prompt for email analysis
    const analysisPrompt = `
You are an expert AI email analyst specializing in business email classification for a professional services company. Your task is to analyze incoming emails and classify them into exactly 8 predefined business groups based on the email content, sender, and context.

EMAIL TO ANALYZE:
- Subject: ${subject}
- From: ${from}
- Body: ${body}

CLASSIFICATION GROUPS (Choose EXACTLY ONE):

1. "prospect-lead" - New Business Opportunities
   • Cold outreach from potential clients
   • Initial inquiries about services
   • First-time contact from prospects
   • Requests for information or proposals
   • Keywords: "interested", "services", "quote", "proposal", "learn more", "tell me about"

2. "active-client" - Existing Client Communications
   • Ongoing project discussions
   • Client updates and feedback
   • Regular business communications with current clients
   • Project status updates
   • Keywords: "project", "update", "feedback", "review", "meeting", "progress"

3. "vendor-supplier" - Business Operations & Vendors
   • Communications from suppliers and vendors
   • Service provider updates
   • Business operations related emails
   • Equipment/software/service purchases
   • Keywords: "invoice", "payment", "order", "delivery", "service update", "subscription"

4. "partnership-collaboration" - Strategic Partnerships
   • Partnership opportunities
   • Collaboration proposals
   • Joint venture discussions
   • Strategic alliance communications
   • Keywords: "partnership", "collaboration", "joint", "strategic", "alliance", "work together"

5. "recruitment-hr" - Human Resources & Talent
   • Job applications and resumes
   • Recruitment communications
   • HR-related matters
   • Employee communications
   • Keywords: "resume", "application", "job", "position", "hiring", "candidate", "interview"

6. "media-pr" - Marketing & Public Relations
   • Media inquiries
   • Press releases
   • Marketing collaborations
   • Content creation opportunities
   • Keywords: "interview", "press", "media", "article", "blog", "content", "marketing"

7. "legal-compliance" - Legal & Compliance
   • Legal documents and communications
   • Compliance requirements
   • Contract discussions
   • Legal inquiries
   • Keywords: "contract", "legal", "compliance", "terms", "agreement", "liability", "regulation"

8. "administrative" - General Administration
   • General administrative matters
   • Non-business critical communications
   • Newsletters and subscriptions
   • System notifications
   • Keywords: "newsletter", "notification", "admin", "system", "update", "maintenance"

ANALYSIS REQUIREMENTS:
1. Read the email content carefully
2. Identify key indicators and context clues
3. Consider the sender's email domain and signature
4. Look for specific business intent and purpose
5. Classify into the MOST APPROPRIATE single group
6. Provide confidence level (0.0 to 1.0)
7. Include reasoning for your classification

RESPONSE FORMAT (JSON ONLY):
{
  "suggestedStage": "one of the 8 groups above",
  "confidence": 0.85,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "followUpSuggestion": "Specific actionable suggestion",
  "suggestedResponse": "Brief response template",
  "priority": "low/medium/high",
  "keyIndicators": ["list", "of", "key", "phrases", "found"],
  "reasoning": "Clear explanation of classification decision",
  "isProspect": true,
  "businessContext": "Brief context about business relevance"
}

CLASSIFICATION GUIDELINES:
• Focus on BUSINESS INTENT rather than just keywords
• Consider the sender's role and company context
• Prioritize prospect-lead for any potential revenue opportunity
• Use active-client for existing business relationships
• Be decisive - choose the BEST fit from the 8 groups
• High confidence (0.8+) for clear classifications
• Medium confidence (0.5-0.8) for ambiguous cases
• Low confidence (<0.5) only for very unclear emails

PRIORITY RULES:
• High Priority: prospect-lead, legal-compliance, active-client (urgent)
• Medium Priority: partnership-collaboration, recruitment-hr, vendor-supplier
• Low Priority: media-pr, administrative

Return ONLY valid JSON, no additional text or formatting.
`

    let analysisResult;
    let aiProvider = 'unknown';

    // Try OpenAI API first
    if (process.env.OPENAI_API_KEY && openai) {
      try {
        console.log(`🤖 Calling OpenAI GPT-4 for analysis...`)
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert sales email analyst. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })

        const aiResponse = completion.choices[0]?.message?.content
        console.log(`🤖 OpenAI Raw Response:`, aiResponse)

        if (aiResponse) {
          try {
            analysisResult = JSON.parse(aiResponse)
            aiProvider = 'OpenAI GPT-4'
            console.log(`✅ OpenAI Analysis Success:`, analysisResult)
          } catch (parseError) {
            console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
            throw new Error('Invalid JSON from OpenAI')
          }
        } else {
          throw new Error('No response from OpenAI')
        }
      } catch (openaiError) {
        console.error('❌ OpenAI API Error:', openaiError)
        console.log('🔄 Falling back to Z.AI GLM-4-32B...')
        
        // Try Z.AI as fallback
        try {
          analysisResult = await zaiClient.analyzeEmail(subject, body, from, analysisPrompt)
          aiProvider = 'Z.AI GLM-4-32B'
          console.log(`✅ Z.AI Analysis Success:`, analysisResult)
        } catch (zaiError) {
          console.error('❌ Z.AI API Error:', zaiError)
          console.log('🔄 Falling back to rule-based analysis...')
          analysisResult = getRuleBasedAnalysis(subject, body, from)
          aiProvider = 'Rule-based fallback'
        }
      }
    } else {
      console.log('ℹ️ OpenAI not configured, trying Z.AI GLM-4-32B...')
      
      // Try Z.AI first when OpenAI is not available
      try {
        analysisResult = await zaiClient.analyzeEmail(subject, body, from, analysisPrompt)
        aiProvider = 'Z.AI GLM-4-32B'
        console.log(`✅ Z.AI Analysis Success:`, analysisResult)
      } catch (zaiError) {
        console.error('❌ Z.AI API Error:', zaiError)
        console.log('🔄 Falling back to rule-based analysis...')
        analysisResult = getRuleBasedAnalysis(subject, body, from)
        aiProvider = 'Rule-based fallback'
      }
    }

    // Add AI provider information to the result
    analysisResult.aiProvider = aiProvider
    
    console.log(`📊 Final Analysis Result (${aiProvider}):`, analysisResult)
    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email' },
      { status: 500 }
    )
  }
}

/**
 * Rule-based analysis fallback when OpenAI is not available
 */
function getRuleBasedAnalysis(subject: string, body: string, from: string) {
  console.log(`🔍 Rule-based analysis for email from: ${from}`)
  
  const content = `${subject} ${body}`.toLowerCase()
  const domain = from.split('@')[1]?.toLowerCase() || ''
  
  // Stage classification based on content analysis
  let suggestedStage = 'administrative' // default
  let confidence = 0.6 // default confidence for rule-based
  let priority = 'medium'
  let businessContext = 'General business communication'
  
  // 1. Prospect Lead - New Business Opportunities
  if (content.includes('interested') || content.includes('quote') || 
      content.includes('proposal') || content.includes('services') ||
      content.includes('tell me more') || content.includes('learn more') ||
      content.includes('pricing') || content.includes('cost') ||
      content.includes('hire') || content.includes('outsource')) {
    suggestedStage = 'prospect-lead'
    confidence = 0.85
    priority = 'high'
    businessContext = 'Potential new business opportunity requiring immediate attention'
  }
  
  // 2. Active Client - Existing Client Communications
  else if (content.includes('project') || content.includes('update') || 
           content.includes('feedback') || content.includes('review') ||
           content.includes('meeting') || content.includes('progress') ||
           content.includes('milestone') || content.includes('deliverable')) {
    suggestedStage = 'active-client'
    confidence = 0.8
    priority = 'high'
    businessContext = 'Communication from existing client about ongoing work'
  }
  
  // 3. Vendor Supplier - Business Operations
  else if (content.includes('invoice') || content.includes('payment') || 
           content.includes('order') || content.includes('delivery') ||
           content.includes('subscription') || content.includes('renewal') ||
           content.includes('service update') || content.includes('billing')) {
    suggestedStage = 'vendor-supplier'
    confidence = 0.75
    priority = 'medium'
    businessContext = 'Vendor or supplier communication regarding business operations'
  }
  
  // 4. Partnership Collaboration - Strategic Partnerships
  else if (content.includes('partnership') || content.includes('collaboration') || 
           content.includes('joint venture') || content.includes('strategic') ||
           content.includes('alliance') || content.includes('work together') ||
           content.includes('mutual') || content.includes('cooperate')) {
    suggestedStage = 'partnership-collaboration'
    confidence = 0.8
    priority = 'medium'
    businessContext = 'Strategic partnership or collaboration opportunity'
  }
  
  // 5. Recruitment HR - Human Resources & Talent
  else if (content.includes('resume') || content.includes('application') || 
           content.includes('job') || content.includes('position') ||
           content.includes('hiring') || content.includes('candidate') ||
           content.includes('interview') || content.includes('cv') ||
           content.includes('employment') || content.includes('career')) {
    suggestedStage = 'recruitment-hr'
    confidence = 0.8
    priority = 'medium'
    businessContext = 'Human resources communication regarding talent acquisition'
  }
  
  // 6. Media PR - Marketing & Public Relations
  else if (content.includes('interview') || content.includes('press') || 
           content.includes('media') || content.includes('article') ||
           content.includes('blog') || content.includes('content') ||
           content.includes('marketing') || content.includes('publicity') ||
           content.includes('journalist') || content.includes('feature')) {
    suggestedStage = 'media-pr'
    confidence = 0.75
    priority = 'low'
    businessContext = 'Media or public relations opportunity'
  }
  
  // 7. Legal Compliance - Legal & Compliance
  else if (content.includes('contract') || content.includes('legal') || 
           content.includes('compliance') || content.includes('terms') ||
           content.includes('agreement') || content.includes('liability') ||
           content.includes('regulation') || content.includes('law') ||
           content.includes('attorney') || content.includes('lawyer')) {
    suggestedStage = 'legal-compliance'
    confidence = 0.9
    priority = 'high'
    businessContext = 'Legal or compliance matter requiring attention'
  }
  
  // 8. Administrative - General Administration (default)
  else if (content.includes('newsletter') || content.includes('notification') || 
           content.includes('admin') || content.includes('system') ||
           content.includes('maintenance') || content.includes('unsubscribe') ||
           content.includes('automated') || content.includes('no-reply')) {
    suggestedStage = 'administrative'
    confidence = 0.7
    priority = 'low'
    businessContext = 'Administrative or system-generated communication'
  }
  
  // Domain-based adjustments
  if (domain.includes('gmail.com') || domain.includes('yahoo.com') || domain.includes('hotmail.com')) {
    // Personal email domains - likely prospects or personal communications
    if (suggestedStage === 'administrative') {
      suggestedStage = 'prospect-lead'
      confidence = 0.6
      businessContext = 'Personal email domain suggesting potential prospect'
    }
  }
  
  // Calculate sentiment
  const positiveWords = ['great', 'excellent', 'perfect', 'wonderful', 'amazing', 'fantastic', 'good', 'thanks', 'appreciate', 'interested', 'excited']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry', 'upset', 'decline', 'cancel']
  
  let sentiment = 0
  positiveWords.forEach(word => {
    if (content.includes(word)) sentiment += 0.1
  })
  negativeWords.forEach(word => {
    if (content.includes(word)) sentiment -= 0.1
  })
  sentiment = Math.max(-1, Math.min(1, sentiment))
  
  // Determine if follow-up is needed
  const needsFollowUp = suggestedStage === 'prospect-lead' || 
                       suggestedStage === 'active-client' || 
                       suggestedStage === 'partnership-collaboration' ||
                       content.includes('question') ||
                       content.includes('when') ||
                       content.includes('how') ||
                       content.includes('response') ||
                       content.includes('reply')
  
  const keyIndicators = extractKeywords(subject, body)
  
  const result = {
    suggestedStage,
    confidence,
    sentiment,
    needsFollowUp,
    followUpSuggestion: generateFollowUpSuggestion(subject, from, suggestedStage),
    suggestedResponse: generateResponseTemplate(from, subject, suggestedStage),
    priority,
    keyIndicators,
    reasoning: `Rule-based analysis detected "${suggestedStage}" stage with ${Math.round(confidence * 100)}% confidence. ${businessContext}`,
    isProspect: suggestedStage === 'prospect-lead' || suggestedStage === 'partnership-collaboration',
    businessContext
  }
  
  console.log(`🎯 Rule-based result:`, result)
  return result
}

function generateFollowUpSuggestion(subject: string, from: string, stage: string): string {
  const firstName = extractFirstName(from)
  
  const suggestions = {
    'prospect-lead': `Follow up with ${firstName} within 24 hours to discuss their service requirements and schedule a discovery call`,
    'active-client': `Respond to ${firstName} about "${subject}" within 4 hours and provide requested updates or schedule a status meeting`,
    'vendor-supplier': `Review and process ${firstName}'s vendor communication within 2-3 business days`,
    'partnership-collaboration': `Schedule a partnership discussion call with ${firstName} within 1 week to explore collaboration opportunities`,
    'recruitment-hr': `Acknowledge ${firstName}'s application within 2 business days and coordinate with HR for next steps`,
    'media-pr': `Respond to ${firstName}'s media request within 24 hours and coordinate with marketing team if needed`,
    'legal-compliance': `Forward to legal team immediately and respond to ${firstName} within 1 business day with timeline`,
    'administrative': `Process ${firstName}'s administrative request within 3-5 business days as per standard procedures`
  }
  
  return suggestions[stage as keyof typeof suggestions] || `Follow up with ${firstName} about "${subject}" as appropriate for the communication type`
}

function generateResponseTemplate(from: string, subject: string, stage?: string): string {
  const firstName = extractFirstName(from)
  
  // Stage-specific templates
  const stageTemplates = {
    'prospect-lead': `Hi ${firstName},\n\nThank you for your inquiry about our services. I'd be happy to discuss how we can help with your project.\n\nWould you be available for a brief call this week to explore your requirements in detail?\n\nBest regards`,
    'active-client': `Hi ${firstName},\n\nThank you for your update regarding "${subject}". I'll review this and get back to you with feedback shortly.\n\nPlease let me know if you have any immediate questions.\n\nBest regards`,
    'vendor-supplier': `Hi ${firstName},\n\nThank you for the information. I'll review the details and coordinate with our team as needed.\n\nI'll get back to you if we need any clarification.\n\nBest regards`,
    'partnership-collaboration': `Hi ${firstName},\n\nThank you for reaching out about potential collaboration opportunities. This sounds interesting and aligns with our strategic direction.\n\nI'd love to schedule a call to discuss this further. When would be a good time for you?\n\nBest regards`,
    'recruitment-hr': `Hi ${firstName},\n\nThank you for your interest in opportunities with our company. We'll review your application and get back to you within the next few business days.\n\nBest regards`,
    'media-pr': `Hi ${firstName},\n\nThank you for reaching out. I'd be happy to help with your article/interview request.\n\nLet me know what information you need and your timeline.\n\nBest regards`,
    'legal-compliance': `Hi ${firstName},\n\nThank you for bringing this to our attention. I'll review the legal/compliance matter and coordinate with our legal team.\n\nI'll get back to you within 1-2 business days.\n\nBest regards`,
    'administrative': `Hi ${firstName},\n\nThank you for your message. I've noted the information and will take appropriate action as needed.\n\nBest regards`
  }
  
  // Return stage-specific template if available, otherwise use default
  if (stage && stageTemplates[stage as keyof typeof stageTemplates]) {
    return stageTemplates[stage as keyof typeof stageTemplates]
  }
  
  // Default templates
  const templates = [
    `Hi ${firstName},\n\nThank you for your email regarding "${subject}". I appreciate you reaching out.\n\nI'll review your message and get back to you shortly.\n\nBest regards`,
    `Dear ${firstName},\n\nThank you for contacting us about "${subject}". We value your communication.\n\nI'll address your message and respond within 1-2 business days.\n\nBest regards`,
    `Hi ${firstName},\n\nI've received your message about "${subject}" and wanted to acknowledge it promptly.\n\nI'll review the details and provide a comprehensive response soon.\n\nBest regards`
  ]
  
  return templates[Math.floor(Math.random() * templates.length)]
}

function extractFirstName(email: string): string {
  // Simple name extraction - in real implementation, use more sophisticated parsing
  const namePart = email.split('@')[0]
  const cleanName = namePart.replace(/[^a-zA-Z]/g, '')
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
}

function extractKeywords(subject: string, body: string): string[] {
  const content = `${subject} ${body}`.toLowerCase()
  const keywords = [
    'interested', 'budget', 'timeline', 'decision', 'proposal', 'pricing',
    'demo', 'meeting', 'call', 'schedule', 'urgent', 'important',
    'questions', 'information', 'details', 'features', 'benefits',
    'requirements', 'needs', 'solution', 'help', 'services'
  ]
  
  return keywords.filter(keyword => content.includes(keyword))
}

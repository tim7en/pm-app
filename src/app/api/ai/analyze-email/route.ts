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

    const { prompt, subject, body, from, aiModel = 'auto' } = await request.json()

    console.log(`🤖 AI Analysis Request:`)
    console.log(`   • Subject: ${subject}`)
    console.log(`   • From: ${from}`)
    console.log(`   • Body length: ${body?.length || 0} chars`)
    console.log(`   • AI Model: ${aiModel}`)

    // Create a structured prompt for email analysis using the new classification labels
    const analysisPrompt = `
You are an expert AI email analyst. Your task is to analyze incoming emails and classify them into exactly one of the following 8 predefined categories based on the email content, sender, and context.

EMAIL TO ANALYZE:
- Subject: ${subject}
- From: ${from}
- Body: ${body}

CLASSIFICATION CATEGORIES (Choose EXACTLY ONE):

1. "Personal" - Personal Communications
   • Personal emails from friends and family
   • Private matters and personal discussions
   • Non-work related personal correspondence
   • Keywords: personal, family, friends, private

2. "Work" - Work-Related Communications  
   • Business emails related to work projects
   • Professional communications with colleagues
   • Work meetings, reports, and updates
   • Keywords: project, meeting, work, business, colleague

3. "Spam/Promotions" - Marketing and Promotional Content
   • Marketing emails and advertisements
   • Promotional offers and sales
   • Newsletter subscriptions and campaigns
   • Spam and unwanted promotional content
   • Keywords: sale, offer, promotion, discount, marketing, unsubscribe

4. "Social" - Social Media and Social Communications
   • Social media notifications
   • Social network updates
   • Community and forum communications
   • Social events and activities
   • Keywords: social, community, event, network, forum

5. "Notifications/Updates" - System and Service Notifications
   • System notifications and updates
   • Service updates from platforms
   • Account notifications
   • Automated system messages
   • Keywords: notification, update, system, account, automated

6. "Finance" - Financial and Banking Communications
   • Banking statements and notifications
   • Financial services communications
   • Investment and trading updates
   • Payment and billing notifications
   • Keywords: bank, payment, invoice, financial, billing, transaction

7. "Job Opportunities" - Career and Employment Related
   • Job applications and opportunities
   • Recruitment communications
   • Career development emails
   • Professional networking for job purposes
   • Keywords: job, career, recruitment, opportunity, position, hiring

8. "Important/Follow Up" - High Priority Items Requiring Action
   • Urgent emails requiring immediate attention
   • Important deadlines and time-sensitive matters
   • Follow-up items that need action
   • Critical communications
   • Keywords: urgent, important, deadline, action required, follow up

ANALYSIS REQUIREMENTS:
1. Read the email content carefully
2. Identify key indicators and context clues
3. Consider the sender's email domain and signature
4. Look for specific intent and purpose
5. Classify into the MOST APPROPRIATE single category
6. Provide confidence level (0.0 to 1.0)
7. Include reasoning for your classification
RESPONSE FORMAT (JSON ONLY):
{
  "category": "one of the 8 categories above",
  "confidence": 0.85,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "followUpSuggestion": "Specific actionable suggestion",
  "suggestedResponse": "Brief response template",
  "priority": "low/medium/high",
  "keyIndicators": ["list", "of", "key", "phrases", "found"],
  "reasoning": "Clear explanation of classification decision",
  "isProspect": false,
  "businessContext": "Brief context about email relevance"
}

CLASSIFICATION GUIDELINES:
• Focus on EMAIL CONTENT and PURPOSE rather than just keywords
• Consider the sender's context and email signature
• Prioritize "Important/Follow Up" for any urgent or time-sensitive content
• Use "Work" for professional business communications
• Be decisive - choose the BEST fit from the 8 categories
• High confidence (0.8+) for clear classifications
• Medium confidence (0.5-0.8) for ambiguous cases
• Low confidence (<0.5) only for very unclear emails

PRIORITY RULES:
• High Priority: Important/Follow Up, Finance (urgent), Work (urgent)
• Medium Priority: Job Opportunities, Work (normal), Personal (urgent)
• Low Priority: Social, Notifications/Updates, Spam/Promotions

Return ONLY valid JSON, no additional text or formatting.
`

    let analysisResult;
    let aiProvider = 'unknown';

    // Determine which AI provider to use based on aiModel parameter
    if (aiModel === 'openai' || (aiModel === 'auto' && process.env.OPENAI_API_KEY)) {
      // Try OpenAI API first
      try {
        console.log(`🤖 Calling OpenAI GPT-4 for analysis...`)
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert email analyst. Always respond with valid JSON only."
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
            if (aiModel === 'openai') {
              throw new Error('Invalid JSON from OpenAI')
            }
            // Fall back to Z.AI if in auto mode
            throw new Error('OpenAI parse error - falling back')
          }
        } else {
          throw new Error('No response from OpenAI')
        }
      } catch (openaiError) {
        console.error('❌ OpenAI API Error:', openaiError)
        if (aiModel === 'openai') {
          return NextResponse.json({ 
            error: 'OpenAI analysis failed', 
            details: openaiError instanceof Error ? openaiError.message : 'Unknown error' 
          }, { status: 500 })
        }
        
        if (aiModel === 'auto') {
          console.log('🔄 Falling back to Z.AI GLM-4-32B...')
          
          // Try Z.AI as fallback
          try {
            analysisResult = await zaiClient.analyzeEmail(subject, body, from, analysisPrompt)
            aiProvider = 'Z.AI GLM-4-32B (fallback)'
            console.log(`✅ Z.AI Analysis Success:`, analysisResult)
          } catch (zaiError) {
            console.error('❌ Z.AI API Error:', zaiError)
            console.log('🔄 Falling back to rule-based analysis...')
            analysisResult = getRuleBasedAnalysis(subject, body, from)
            aiProvider = 'Rule-based fallback'
          }
        }
      }
    } else if (aiModel === 'zai') {
      // Use Z.AI exclusively
      try {
        console.log(`🤖 Calling Z.AI GLM-4-32B for analysis...`)
        analysisResult = await zaiClient.analyzeEmail(subject, body, from, analysisPrompt)
        aiProvider = 'Z.AI GLM-4-32B'
        console.log(`✅ Z.AI Analysis Success:`, analysisResult)
      } catch (zaiError) {
        console.error('❌ Z.AI API Error:', zaiError)
        return NextResponse.json({ 
          error: 'Z.AI analysis failed', 
          details: zaiError instanceof Error ? zaiError.message : 'Unknown error' 
        }, { status: 500 })
      }
    } else {
      // Auto mode but no OpenAI, try Z.AI first
      console.log('ℹ️ OpenAI not configured, trying Z.AI GLM-4-32B...')
      
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
  let category = 'Notifications/Updates' // default
  let confidence = 0.6 // default confidence for rule-based
  let priority = 'medium'
  let businessContext = 'General communication'
  
  // 1. Personal - Personal Communications
  if (content.includes('family') || content.includes('friend') || 
      content.includes('personal') || content.includes('private') ||
      domain.includes('gmail.com') && !content.includes('business') && !content.includes('work')) {
    category = 'Personal'
    confidence = 0.7
    priority = 'medium'
    businessContext = 'Personal communication from friends or family'
  }
  
  // 2. Work - Work-Related Communications
  else if (content.includes('project') || content.includes('meeting') || 
           content.includes('work') || content.includes('business') ||
           content.includes('colleague') || content.includes('office') ||
           content.includes('report') || content.includes('deadline')) {
    category = 'Work'
    confidence = 0.8
    priority = 'high'
    businessContext = 'Work-related professional communication'
  }
  
  // 3. Spam/Promotions - Marketing and Promotional Content
  else if (content.includes('sale') || content.includes('offer') || 
           content.includes('promotion') || content.includes('discount') ||
           content.includes('marketing') || content.includes('unsubscribe') ||
           content.includes('deal') || content.includes('limited time') ||
           content.includes('exclusive') || content.includes('free')) {
    category = 'Spam/Promotions'
    confidence = 0.85
    priority = 'low'
    businessContext = 'Marketing or promotional content'
  }
  
  // 4. Social - Social Media and Social Communications
  else if (content.includes('social') || content.includes('community') || 
           content.includes('event') || content.includes('network') ||
           content.includes('forum') || content.includes('group') ||
           domain.includes('facebook') || domain.includes('linkedin') ||
           domain.includes('twitter') || domain.includes('instagram')) {
    category = 'Social'
    confidence = 0.75
    priority = 'low'
    businessContext = 'Social media or community communication'
  }
  
  // 5. Notifications/Updates - System and Service Notifications
  else if (content.includes('notification') || content.includes('update') || 
           content.includes('system') || content.includes('account') ||
           content.includes('automated') || content.includes('no-reply') ||
           content.includes('service') || content.includes('maintenance') ||
           from.includes('noreply') || from.includes('no-reply')) {
    category = 'Notifications/Updates'
    confidence = 0.8
    priority = 'low'
    businessContext = 'System or service notification'
  }
  
  // 6. Finance - Financial and Banking Communications
  else if (content.includes('bank') || content.includes('payment') || 
           content.includes('invoice') || content.includes('financial') ||
           content.includes('billing') || content.includes('transaction') ||
           content.includes('statement') || content.includes('credit') ||
           content.includes('debit') || content.includes('investment')) {
    category = 'Finance'
    confidence = 0.85
    priority = 'high'
    businessContext = 'Financial or banking communication'
  }
  
  // 7. Job Opportunities - Career and Employment Related
  else if (content.includes('job') || content.includes('career') || 
           content.includes('recruitment') || content.includes('opportunity') ||
           content.includes('position') || content.includes('hiring') ||
           content.includes('resume') || content.includes('application') ||
           content.includes('interview') || content.includes('employment')) {
    category = 'Job Opportunities'
    confidence = 0.8
    priority = 'medium'
    businessContext = 'Career or employment related communication'
  }
  
  // 8. Important/Follow Up - High Priority Items Requiring Action
  else if (content.includes('urgent') || content.includes('important') || 
           content.includes('deadline') || content.includes('action required') ||
           content.includes('follow up') || content.includes('asap') ||
           content.includes('critical') || content.includes('immediate') ||
           content.includes('priority')) {
    category = 'Important/Follow Up'
    confidence = 0.9
    priority = 'high'
    businessContext = 'High priority item requiring immediate attention'
  }
  
  // Domain-based adjustments
  if (domain.includes('gmail.com') || domain.includes('yahoo.com') || domain.includes('hotmail.com')) {
    // Personal email domains - adjust if needed
    if (category === 'Notifications/Updates' && !content.includes('system') && !content.includes('automated')) {
      category = 'Personal'
      confidence = 0.6
      businessContext = 'Personal email from common email provider'
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
  const needsFollowUp = category === 'Important/Follow Up' || 
                       category === 'Work' || 
                       category === 'Finance' ||
                       content.includes('question') ||
                       content.includes('when') ||
                       content.includes('how') ||
                       content.includes('response') ||
                       content.includes('reply')
  
  const keyIndicators = extractKeywords(subject, body)
  
  const result = {
    category,
    confidence,
    sentiment,
    needsFollowUp,
    followUpSuggestion: generateFollowUpSuggestion(subject, from, category),
    suggestedResponse: generateResponseTemplate(from, subject, category),
    priority,
    keyIndicators,
    reasoning: `Rule-based analysis detected "${category}" category with ${Math.round(confidence * 100)}% confidence. ${businessContext}`,
    isProspect: category === 'Job Opportunities' || category === 'Work',
    businessContext
  }
  
  console.log(`🎯 Rule-based result:`, result)
  return result
}

function generateFollowUpSuggestion(subject: string, from: string, category: string): string {
  const firstName = extractFirstName(from)
  
  const suggestions = {
    'Personal': `Follow up with ${firstName} about "${subject}" when convenient`,
    'Work': `Respond to ${firstName} about "${subject}" within 4 hours and provide requested updates or schedule a meeting`,
    'Spam/Promotions': `No follow-up needed - consider unsubscribing or marking as spam`,
    'Social': `Engage with ${firstName}'s social post or event invitation as appropriate`,
    'Notifications/Updates': `Review notification and take any required action`,
    'Finance': `Review ${firstName}'s financial communication within 2 business days and take appropriate action`,
    'Job Opportunities': `Respond to ${firstName}'s job-related message within 2 business days`,
    'Important/Follow Up': `Take immediate action on ${firstName}'s urgent request - respond within 24 hours`
  }
  
  return suggestions[category as keyof typeof suggestions] || `Follow up with ${firstName} about "${subject}" as appropriate for the communication type`
}

function generateResponseTemplate(from: string, subject: string, category?: string): string {
  const firstName = extractFirstName(from)
  
  // Category-specific templates
  const categoryTemplates = {
    'Personal': `Hi ${firstName},\n\nThanks for reaching out! I'll get back to you soon.\n\nBest regards`,
    'Work': `Hi ${firstName},\n\nThank you for your email regarding "${subject}". I'll review this and get back to you with feedback shortly.\n\nPlease let me know if you have any immediate questions.\n\nBest regards`,
    'Spam/Promotions': `[Auto-response not recommended for promotional emails]`,
    'Social': `Hi ${firstName},\n\nThanks for connecting! I appreciate the invitation/update.\n\nBest regards`,
    'Notifications/Updates': `[No response typically needed for automated notifications]`,
    'Finance': `Hi ${firstName},\n\nThank you for the financial information. I'll review the details and get back to you if any action is needed.\n\nBest regards`,
    'Job Opportunities': `Hi ${firstName},\n\nThank you for your interest in opportunities. I'll review your message and get back to you within the next few business days.\n\nBest regards`,
    'Important/Follow Up': `Hi ${firstName},\n\nI've received your urgent message about "${subject}" and will prioritize this matter.\n\nI'll get back to you within 24 hours.\n\nBest regards`
  }
  
  // Return category-specific template if available, otherwise use default
  if (category && categoryTemplates[category as keyof typeof categoryTemplates]) {
    return categoryTemplates[category as keyof typeof categoryTemplates]
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

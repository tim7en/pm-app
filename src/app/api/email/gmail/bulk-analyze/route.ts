import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'
import { EmailCleanupService } from '@/lib/email-cleanup-service'
import OpenAI from 'openai'
import { ZaiClient } from '@/lib/zai-client'

// Initialize OpenAI for direct server-side AI classification
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Z.AI for fallback classification
const zaiClient = new ZaiClient(process.env.ZAI_API_KEY || '5bb6d9567c6a40568f61bcd8e76483a7.BLqz1y96gXl5dPBx')

// Direct server-side AI classification function with dual AI provider support
async function classifyEmailWithAI(subject: string, body: string, from: string, aiModel: string = 'auto') {
  const analysisPrompt = `
You are an expert AI email analyst. Your task is to analyze incoming emails and classify them into exactly one of the following 9 predefined categories based on the email content, sender, and context.

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
6. Provide confidence level (0.0 to 1.0)
7. Include reasoning for your classification

RESPONSE FORMAT (JSON ONLY):
{
  "category": "one of the 8 categories above",
  "confidence": 0.85,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "priority": "low/medium/high",
  "reasoning": "Clear explanation of classification decision",
  "isProspect": false,
  "businessContext": "Brief context about email relevance"
}

PRIORITY RULES:
• High Priority: Important/Follow Up, Finance (urgent), Work (urgent)
• Medium Priority: Job Opportunities, Work (normal), Personal (urgent)
• Low Priority: Social, Notifications/Updates, Spam/Promotions

Return ONLY valid JSON, no additional text or formatting.`

  // Determine which AI provider to use based on aiModel parameter
  let aiProvider = 'unknown'
  
  if (aiModel === 'openai' || (aiModel === 'auto' && process.env.OPENAI_API_KEY)) {
    // Try OpenAI API first
    try {
      console.log('🤖 Calling OpenAI GPT-4 for direct classification...')
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
      if (aiResponse) {
        const result = JSON.parse(aiResponse)
        aiProvider = 'OpenAI GPT-4'
        console.log(`🤖 OpenAI classification: ${result.category} (${Math.round(result.confidence * 100)}%)`)
        result.aiProvider = aiProvider
        return result
      } else {
        throw new Error('No response from OpenAI')
      }
    } catch (error) {
      console.error('❌ OpenAI classification error:', error)
      if (aiModel === 'openai') {
        throw error // Don't fall back if specifically requested OpenAI
      }
      console.log('🔄 Falling back to Z.AI GLM-4-32B...')
    }
  }
  
  if (aiModel === 'zai' || (aiModel === 'auto' && aiProvider === 'unknown')) {
    // Try Z.AI as primary or fallback
    try {
      console.log('🤖 Calling Z.AI GLM-4-32B for direct classification...')
      const result = await zaiClient.analyzeEmail(subject, body, from, analysisPrompt)
      aiProvider = 'Z.AI GLM-4-32B'
      console.log(`🤖 Z.AI classification: ${result.category} (${Math.round(result.confidence * 100)}%)`)
      result.aiProvider = aiProvider
      return result
    } catch (error) {
      console.error('❌ Z.AI classification error:', error)
      if (aiModel === 'zai') {
        throw error // Don't fall back if specifically requested Z.AI
      }
      console.log('🔄 Falling back to rule-based classification...')
    }
  }
  
  // Fallback to rule-based classification
  console.log('🔄 Using rule-based classification as fallback...')
  const result = getRuleBasedClassification(subject, body, from)
  return { ...result, aiProvider: 'Rule-based fallback' }
}

// Simple rule-based classification for fallback
function getRuleBasedClassification(subject: string, body: string, from: string) {
  const content = `${subject} ${body}`.toLowerCase()
  
  if (content.includes('urgent') || content.includes('important') || content.includes('asap')) {
    return {
      category: 'Important/Follow Up',
      confidence: 0.7,
      priority: 'high',
      sentiment: 0,
      needsFollowUp: true,
      reasoning: 'Rule-based: Contains urgent/important keywords',
      isProspect: false,
      businessContext: 'High priority communication'
    }
  }
  
  if (content.includes('work') || content.includes('project') || content.includes('meeting')) {
    return {
      category: 'Work',
      confidence: 0.6,
      priority: 'medium',
      sentiment: 0,
      needsFollowUp: true,
      reasoning: 'Rule-based: Contains work-related keywords',
      isProspect: false,
      businessContext: 'Work-related communication'
    }
  }
  
  if (content.includes('promotion') || content.includes('sale') || content.includes('offer')) {
    return {
      category: 'Spam/Promotions',
      confidence: 0.8,
      priority: 'low',
      sentiment: 0,
      needsFollowUp: false,
      reasoning: 'Rule-based: Contains promotional keywords',
      isProspect: false,
      businessContext: 'Promotional content'
    }
  }
  
  return {
    category: 'Other',
    confidence: 0.3,
    priority: 'low',
    sentiment: 0,
    needsFollowUp: false,
    reasoning: 'Rule-based: Default fallback classification',
    isProspect: false,
    businessContext: 'Unclassified email'
  }
}

interface BulkAnalysisResult {
  totalProcessed: number
  totalClassified: number
  labelsApplied: number
  errors: number
  progress: number
  results: any[]
  labelMapping: Record<string, string>
}

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
    const { 
      accessToken, 
      refreshToken, 
      maxEmails = 100,
      applyLabels = false,
      skipClassified = true,
      query = '',
      pageToken,
      batchSize = 10,
      aiModel = 'auto',
      emailsToProcess // For applying labels to already processed emails
    } = await request.json()
    
    console.log('🔍 Bulk analyze request received with parameters:')
    console.log('  • accessToken:', accessToken ? 'PROVIDED' : 'MISSING')
    console.log('  • refreshToken:', refreshToken ? 'PROVIDED' : 'MISSING')
    console.log('  • maxEmails:', maxEmails)
    console.log('  • applyLabels:', applyLabels)
    console.log('  • skipClassified:', skipClassified)
    console.log('  • query:', query)
    console.log('  • pageToken:', pageToken)
    console.log('  • batchSize:', batchSize)
    console.log('  • aiModel:', aiModel)
    console.log('  • emailsToProcess:', emailsToProcess ? `${emailsToProcess.length} emails` : 'NOT PROVIDED')
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    // Initialize services
    const gmailService = new GmailService(GMAIL_CONFIG)
    gmailService.setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      scope: '',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000
    })

    const cleanupService = new EmailCleanupService()

    console.log(`Starting bulk analysis of up to ${maxEmails} emails...`)

    let emails: any[] = []
    let nextPageToken: string | undefined = undefined
    
    // Handle pre-processed emails vs fetching new ones
    if (emailsToProcess && Array.isArray(emailsToProcess)) {
      console.log(`Processing ${emailsToProcess.length} pre-classified emails for label application...`)
      emails = emailsToProcess
    } else {
      // Fetch emails with pagination
      const result = await gmailService.getAllEmails({
        maxResults: Math.min(maxEmails, 50), // Limit per batch
        pageToken,
        query
      })
      emails = result.emails
      nextPageToken = result.nextPageToken
    }

    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No emails found',
        result: {
          totalProcessed: 0,
          totalClassified: 0,
          labelsApplied: 0,
          errors: 0,
          progress: 100,
          results: [],
          nextPageToken: null
        }
      })
    }

    // Create prospect labels if applying labels
    let labelMapping: Record<string, string> = {}
    if (applyLabels) {
      try {
        console.log('🏷️ Creating prospect labels...')
        labelMapping = await gmailService.createProspectLabels()
        console.log('✅ Created prospect labels:', Object.keys(labelMapping))
        console.log('📋 Label mapping details:', labelMapping)
      } catch (error) {
        console.error('❌ Error creating labels:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to create Gmail labels: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 })
      }
    } else {
      console.log('ℹ️ Label application disabled - skipping label creation')
    }

    // Process emails in batches
    const processingBatchSize = batchSize || 10
    const results: any[] = []
    let totalClassified = 0
    let labelsApplied = 0
    let errors = 0
    let skippedAlreadyClassified = 0

    for (let i = 0; i < emails.length; i += processingBatchSize) {
      const batch = emails.slice(i, i + processingBatchSize)
      
      // Analyze batch
      const batchPromises = batch.map(async (email) => {
        try {
          let analysis: any
          let alreadyClassified = false
          
          // Check if email is already classified (has AI labels) and skipClassified is enabled
          if (skipClassified && email.labels && Array.isArray(email.labels)) {
            const hasAILabel = email.labels.some((label: string) => 
              label.includes('AI/') || 
              label.includes('Prospect') || 
              label.includes('Classification')
            )
            
            if (hasAILabel) {
              console.log(`⏭️ Skipping already classified email: "${email.subject}"`)
              skippedAlreadyClassified++
              alreadyClassified = true
              
              // Return minimal result for already classified emails
              return {
                id: email.id,
                subject: email.subject,
                from: email.from,
                snippet: email.snippet,
                timestamp: email.timestamp,
                alreadyClassified: true,
                analysis: {
                  suggestedStage: 'already-classified',
                  confidence: 1.0,
                  priority: 'medium',
                  sentiment: 0.5
                },
                classification: {
                  category: 'already-classified',
                  confidence: 1.0,
                  priority: 'medium',
                  sentiment: 0.5,
                  prospectStage: 'already-classified',
                  isProspect: false,
                  requiresAction: false
                }
              }
            }
          }
          
          // Check if this is a pre-classified email or needs new analysis
          if (emailsToProcess && email.classification) {
            // Use existing classification for pre-processed emails
            console.log(`Using pre-classification for email ${email.id}: ${email.classification}`)
            analysis = {
              suggestedStage: email.classification,
              category: 'prospect',
              confidence: 0.95,
              priority: 'medium',
              sentiment: 0.5,
              isProspect: true,
              requiresAction: false
            }
          } else {
            // Direct server-side AI Classification using selected AI model
            console.log(`🤖 Calling direct AI classification for email: "${email.subject}" using ${aiModel}`)
            analysis = await classifyEmailWithAI(
              email.subject || '',
              email.body || email.snippet || '',
              email.from || '',
              aiModel
            )
          }
          
          // Apply labels if requested
          let appliedLabel: string | null = null
          let labelApplySuccess = false
          if (applyLabels && analysis.category) {
            // Use the exact category name for label creation
            // e.g., "Work" -> "AI/Work", "Spam/Promotions" -> "AI/Spam-Promotions", "Job Opportunities" -> "AI/Job-Opportunities"
            const labelName = `AI/${analysis.category.replace(/[\/\s]/g, '-')}`
            
            console.log(`🔍 Attempting to apply label "${labelName}" to email ${email.id}`)
            console.log(`📧 Email subject: "${email.subject}"`)
            console.log(`🏷️ Available labels:`, Object.keys(labelMapping))
            console.log(`🎯 Suggested stage: "${analysis.suggestedStage}"`)
            //console.log(`� Formatted stage: "${formattedStage}"`)
            console.log(`�🔍 Looking for label: "${labelName}"`)
            console.log(`📋 Label mapping has:`, labelMapping)
            
            if (labelMapping[labelName]) {
              console.log(`✓ Found label mapping for "${labelName}": ${labelMapping[labelName]}`)
              try {
                labelApplySuccess = await gmailService.applyLabelWithRetry(email.id, labelMapping[labelName])
                if (labelApplySuccess) {
                  appliedLabel = labelName
                  labelsApplied++
                  console.log(`✅ Applied label "${labelName}" to email: ${email.subject}`)
                  
                  // Verify the label was actually applied
                  const verified = await gmailService.verifyLabelApplied(email.id, labelMapping[labelName])
                  console.log(`🔍 Label verification for ${email.id}: ${verified ? 'SUCCESS' : 'FAILED'}`)
                } else {
                  console.error(`❌ Failed to apply label "${labelName}" to email: ${email.subject}`)
                  errors++
                }
              } catch (labelError) {
                console.error(`💥 Error applying label to ${email.id}:`, labelError)
                errors++
              }
            } else {
              console.error(`❌ Label "${labelName}" not found in labelMapping`)
              console.error(`🔍 Expected one of:`, Object.keys(labelMapping))
              console.error(`🔍 Analysis result:`, analysis)
              
              // Try to find a similar label name
              const availableLabels = Object.keys(labelMapping)
              const possibleMatches = availableLabels.filter(label => 
                label.toLowerCase().includes(analysis.category.toLowerCase()) ||
                analysis.category.toLowerCase().includes(label.toLowerCase().replace('AI/', '').toLowerCase())
              )
              if (possibleMatches.length > 0) {
                console.log(`🤔 Possible matches:`, possibleMatches)
                
                // Try to apply the first possible match
                const matchLabel = possibleMatches[0]
                console.log(`🔄 Trying to apply possible match: "${matchLabel}"`)
                try {
                  labelApplySuccess = await gmailService.applyLabelWithRetry(email.id, labelMapping[matchLabel])
                  if (labelApplySuccess) {
                    appliedLabel = matchLabel
                    labelsApplied++
                    console.log(`✅ Applied fallback label "${matchLabel}" to email: ${email.subject}`)
                  } else {
                    console.error(`❌ Failed to apply fallback label "${matchLabel}"`)
                    errors++
                  }
                } catch (fallbackError) {
                  console.error(`💥 Error applying fallback label:`, fallbackError)
                  errors++
                }
              } else {
                errors++
              }
            }
          } else {
            if (!applyLabels) {
              console.log(`ℹ️ Label application disabled for email ${email.id}`)
            } else if (!analysis.category) {
              console.log(`⚠️ No suggested stage for email ${email.id}:`, analysis)
            }
          }

          totalClassified++
          
          return {
            id: email.id,
            subject: email.subject,
            from: email.from,
            snippet: email.snippet,
            timestamp: email.timestamp,
            analysis,
            appliedLabel,
            labelApplySuccess,
            classification: {
              category: analysis.category || 'Other',
              confidence: analysis.confidence || 0.1,
              priority: analysis.priority || 'low',
              sentiment: analysis.sentiment || 0,
              prospectStage: analysis.suggestedStage || 'Other',
              isProspect: !!analysis.suggestedStage,
              requiresAction: analysis.needsFollowUp || false
            }
          }
        } catch (error) {
          errors++
          console.error(`Error processing email ${email.id}:`, error)
          
          // Return a proper classification for failed emails
          totalClassified++
          return {
            id: email.id,
            subject: email.subject,
            from: email.from,
            snippet: email.snippet,
            timestamp: email.timestamp,
            analysis: {
              category: 'Other',
              confidence: 0.1,
              priority: 'low',
              sentiment: 0,
              needsFollowUp: false,
              reasoning: 'Classification failed - moved to Other category',
              isProspect: false,
              businessContext: 'Error during classification',
              aiProvider: 'Error fallback'
            },
            appliedLabel: null,
            labelApplySuccess: false,
            classification: {
              category: 'Other',
              confidence: 0.1,
              priority: 'low',
              sentiment: 0,
              prospectStage: 'Other',
              isProspect: false,
              requiresAction: false
            },
            error: 'Classification failed',
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Report progress with batch information
      const progress = Math.round(((i + batch.length) / emails.length) * 100)
      const currentBatch = Math.floor(i / processingBatchSize) + 1
      const totalBatches = Math.ceil(emails.length / processingBatchSize)
      console.log(`Processed batch ${currentBatch}/${totalBatches}: ${i + batch.length}/${emails.length} emails (${progress}%)`)
    }

    const analysisResult: BulkAnalysisResult = {
      totalProcessed: emails.length,
      totalClassified,
      labelsApplied,
      errors,
      progress: 100,
      results,
      labelMapping
    }

    // If labels were applied, add verification summary
    let verificationSummary: {
      totalAttempted: number
      successfullyApplied: number
      failedToApply: number
      labelsCreated: number
    } | null = null
    
    if (applyLabels && labelsApplied > 0) {
      const appliedEmails = results.filter(r => r.appliedLabel && r.labelApplySuccess)
      verificationSummary = {
        totalAttempted: results.filter(r => r.classification?.isProspect).length,
        successfullyApplied: labelsApplied,
        failedToApply: results.filter(r => r.classification?.isProspect && !r.labelApplySuccess).length,
        labelsCreated: Object.keys(labelMapping).length
      }
      
      console.log(`📊 Label Application Summary:`)
      console.log(`   • Total prospects found: ${verificationSummary.totalAttempted}`)
      console.log(`   • Labels successfully applied: ${verificationSummary.successfullyApplied}`)
      console.log(`   • Failed to apply: ${verificationSummary.failedToApply}`)
      console.log(`   • Labels available: ${Object.keys(labelMapping).join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${emails.length} emails successfully${applyLabels ? ` and applied ${labelsApplied} labels to Gmail` : ''}`,
      result: analysisResult,
      nextPageToken,
      verification: verificationSummary,
      summary: {
        totalProcessed: emails.length,
        processed: emails.length,
        classified: totalClassified,
        prospects: results.filter(r => r.classification?.isProspect).length,
        highPriority: results.filter(r => r.classification?.priority === 'high').length,
        labelsApplied,
        errors,
        skippedAlreadyClassified,
        gmailLabelsCreated: Object.keys(labelMapping).length
      }
    })

  } catch (error) {
    console.error('Error in bulk email analysis:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

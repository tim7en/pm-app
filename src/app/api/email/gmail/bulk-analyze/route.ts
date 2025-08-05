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

// Direct server-side AI classification function
async function classifyEmailWithAI(subject: string, body: string, from: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key not configured, using fallback classification')
    return {
      suggestedStage: 'administrative',
      confidence: 0.3,
      priority: 'low',
      sentiment: 0,
      isProspect: false,
      personalRelevance: 0.2,
      reasoning: 'Fallback classification - OpenAI not configured'
    }
  }

  try {
    const analysisPrompt = `
You are analyzing emails for Timur Sabitov, an Environmental Scientist and Project Manager with expertise in climate change, international development, and project management.

RECIPIENT CONTEXT:
- Name: Timur Sabitov (sabitov.ty@gmail.com, +998 99 893 24 33)
- Role: Head of Project Management Unit, National Center for Climate Change, Uzbekistan
- Expertise: Climate finance (GCF, Adaptation Fund), environmental engineering, UNFCCC IPCC focal point
- Affiliations: UNESCO, UNDP, World Bank, ADB, AFD projects, Duke University (Financial Management)
- Education: Fulbright Scholar (SUNY-ESF), MS Environmental Engineering
- Location: Tashkent, Uzbekistan

EMAIL TO ANALYZE:
- Subject: ${subject}
- From: ${from}
- Body: ${body}

CLASSIFICATION GROUPS (Choose EXACTLY ONE):
1. "high-priority-personal" - Family, health, urgent personal matters (PRIORITY 1)
2. "climate-finance-work" - GCF, Adaptation Fund, UNDP, UNESCO, ministry work, climate projects (PRIORITY 1)
3. "academic-research" - University work, research, publications, teaching duties (PRIORITY 1)
4. "international-organizations" - World Bank, ADB, AFD, EU, international development (PRIORITY 1)
5. "consulting-opportunities" - Consulting work, expert positions, career opportunities (PRIORITY 2)
6. "personal-finance" - Banking, investments, financial management (PRIORITY 2)
7. "professional-network" - Professional networking, industry contacts (PRIORITY 2)
8. "media-outreach" - Media interviews, PR opportunities (PRIORITY 3)
9. "administrative" - Newsletters, notifications, marketing (PRIORITY 3)

PRIORITY ANALYSIS:
- Direct mention of "Timur" or "Sabitov" = Higher priority
- Climate/environmental keywords = Higher priority
- International organization senders = Higher priority
- Work/project related content = Higher priority
- Personal/urgent language = Highest priority

RESPONSE FORMAT (JSON ONLY):
{
  "suggestedStage": "one of the 9 groups above",
  "confidence": 0.95,
  "sentiment": 0.3,
  "needsFollowUp": true,
  "priority": "high/medium/low",
  "reasoning": "Classification decision with personal relevance assessment",
  "isProspect": true,
  "personalRelevance": 0.8,
  "businessContext": "How this relates to Timur's work/life"
}

Return ONLY valid JSON, no additional text.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business email analyst. Always respond with valid JSON only."
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
      console.log(`🤖 Direct AI classification: ${result.suggestedStage} (${Math.round(result.confidence * 100)}%)`)
      return result
    } else {
      throw new Error('No response from OpenAI')
    }
  } catch (error) {
    console.error('❌ Direct AI classification error:', error)
    return {
      suggestedStage: 'administrative',
      confidence: 0.3,
      priority: 'low',
      sentiment: 0,
      isProspect: false,
      personalRelevance: 0.2,
      reasoning: `Fallback classification due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
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
            // Direct server-side AI Classification using OpenAI
            console.log(`🤖 Calling direct AI classification for email: "${email.subject}"`)
            analysis = await classifyEmailWithAI(
              email.subject || '',
              email.body || email.snippet || '',
              email.from || ''
            )
          }
          
          // Apply labels if requested
          let appliedLabel: string | null = null
          let labelApplySuccess = false
          if (applyLabels && analysis.suggestedStage) {
            // Convert suggested stage to proper label name format
            // e.g., "prospect-lead" -> "AI/Prospect-Lead"
            const stageParts = analysis.suggestedStage.split('-')
            const formattedStage = stageParts.map(part => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join('-')
            const labelName = `AI/${formattedStage}`
            
            console.log(`🔍 Attempting to apply label "${labelName}" to email ${email.id}`)
            console.log(`📧 Email subject: "${email.subject}"`)
            console.log(`🏷️ Available labels:`, Object.keys(labelMapping))
            console.log(`🎯 Suggested stage: "${analysis.suggestedStage}"`)
            console.log(`� Formatted stage: "${formattedStage}"`)
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
                label.toLowerCase().includes(analysis.suggestedStage.toLowerCase()) ||
                analysis.suggestedStage.toLowerCase().includes(label.toLowerCase().replace('AI/', '').toLowerCase())
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
            } else if (!analysis.suggestedStage) {
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
              category: analysis.suggestedStage || 'unknown',
              confidence: analysis.confidence,
              priority: analysis.priority,
              sentiment: analysis.sentiment,
              prospectStage: analysis.suggestedStage || 'unknown',
              isProspect: !!analysis.suggestedStage,
              requiresAction: analysis.needsFollowUp
            }
          }
        } catch (error) {
          errors++
          console.error(`Error processing email ${email.id}:`, error)
          return {
            id: email.id,
            subject: email.subject,
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

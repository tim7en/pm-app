import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, messageId } = await request.json()
    
    if (!accessToken || !messageId) {
      return NextResponse.json(
        { success: false, error: 'Access token and message ID required' },
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

    console.log('🔍 Testing label creation and application...')

    // 1. Get existing labels
    console.log('📋 Fetching existing labels...')
    const existingLabels = await gmailService.getLabels()
    console.log(`Found ${existingLabels.length} existing labels`)

    // 2. Create prospect labels
    console.log('🏷️ Creating prospect labels...')
    const labelMapping = await gmailService.createProspectLabels()
    console.log('Created labels:', Object.keys(labelMapping))

    // 3. Test applying a label to the message
    const testLabelName = 'AI/Qualified'
    const testLabelId = labelMapping[testLabelName]
    
    if (testLabelId) {
      console.log(`🎯 Applying test label "${testLabelName}" (${testLabelId}) to message ${messageId}`)
      
      const success = await gmailService.applyLabelWithRetry(messageId, testLabelId)
      console.log(`Label application result: ${success ? 'SUCCESS' : 'FAILED'}`)

      if (success) {
        // Verify the label was applied
        console.log('✅ Verifying label application...')
        const verified = await gmailService.verifyLabelApplied(messageId, testLabelId)
        console.log(`Verification result: ${verified ? 'VERIFIED' : 'NOT VERIFIED'}`)

        return NextResponse.json({
          success: true,
          message: 'Label test completed successfully',
          result: {
            labelsCreated: Object.keys(labelMapping).length,
            testLabelApplied: success,
            testLabelVerified: verified,
            testLabelName,
            testLabelId,
            messageId,
            labelMapping
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to apply test label',
          result: {
            labelsCreated: Object.keys(labelMapping).length,
            testLabelApplied: false,
            testLabelName,
            testLabelId,
            messageId
          }
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Test label "${testLabelName}" not found in created labels`,
        result: {
          labelsCreated: Object.keys(labelMapping).length,
          availableLabels: Object.keys(labelMapping)
        }
      })
    }

  } catch (error) {
    console.error('Error in label test:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test labels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

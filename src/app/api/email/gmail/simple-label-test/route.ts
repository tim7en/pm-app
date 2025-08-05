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
    const { accessToken, refreshToken } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
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

    console.log('🧪 Testing simple label creation...')

    try {
      // Test 1: List existing labels first
      console.log('📋 Step 1: Listing existing labels...')
      const existingLabels = await gmailService.getLabels()
      console.log(`Found ${existingLabels.length} existing labels`)
      
      const aiLabels = existingLabels.filter(label => label.name?.startsWith('AI/'))
      console.log(`Found ${aiLabels.length} existing AI labels:`, aiLabels.map(l => l.name))

      // Test 2: Try to create a simple label
      console.log('🏗️ Step 2: Creating a simple test label...')
      const testLabelName = `AI/Test-${Date.now()}`
      const testLabelId = await gmailService.createLabel(testLabelName, '#3B82F6') // Use a valid color mapping
      console.log(`✅ Successfully created test label: ${testLabelName} with ID: ${testLabelId}`)

      // Test 3: Try to create prospect labels
      console.log('🏗️ Step 3: Creating prospect labels...')
      const labelMapping = await gmailService.createProspectLabels()
      console.log('✅ Successfully created prospect labels:', labelMapping)

      return NextResponse.json({
        success: true,
        result: {
          existingLabelsCount: existingLabels.length,
          existingAiLabels: aiLabels.map(l => ({ id: l.id, name: l.name })),
          testLabelCreated: testLabelId,
          prospectLabelsCreated: Object.keys(labelMapping).length,
          labelMapping
        }
      })

    } catch (error) {
      console.error('❌ Label creation test failed:', error)
      
      return NextResponse.json({
        success: false,
        error: `Label creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null
      })
    }

  } catch (error) {
    console.error('Simple label test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

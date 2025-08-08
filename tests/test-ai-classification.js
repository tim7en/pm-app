#!/usr/bin/env node

/**
 * Test script for AI email classification
 */

async function testAIClassification() {
  const testEmail = {
    subject: "Re: Your proposal - we're interested!",
    body: "Hi there, thanks for sending over the proposal. We've reviewed it and are quite interested in moving forward. Could we schedule a call this week to discuss the timeline and budget? We have about $50k allocated for this project and would like to start in the next month.",
    from: "john.doe@example.com"
  }

  try {
    console.log('🧪 Testing AI Email Classification...')
    console.log('📧 Test Email:')
    console.log(`   Subject: ${testEmail.subject}`)
    console.log(`   From: ${testEmail.from}`)
    console.log(`   Body: ${testEmail.body.substring(0, 100)}...`)
    console.log('')

    const response = await fetch('http://localhost:3000/api/ai/analyze-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // Mock session for testing
      },
      body: JSON.stringify({
        subject: testEmail.subject,
        body: testEmail.body,
        from: testEmail.from
      })
    })

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const result = await response.json()
    console.log('🤖 AI Classification Result:')
    console.log(`   • Suggested Stage: ${result.suggestedStage}`)
    console.log(`   • Confidence: ${Math.round(result.confidence * 100)}%`)
    console.log(`   • Sentiment: ${result.sentiment}`)
    console.log(`   • Priority: ${result.priority}`)
    console.log(`   • Needs Follow-up: ${result.needsFollowUp}`)
    console.log(`   • Is Prospect: ${result.isProspect}`)
    console.log(`   • Key Indicators: ${result.keyIndicators?.join(', ')}`)
    console.log(`   • Reasoning: ${result.reasoning}`)
    console.log('')

    // Expected result for this test email should be "qualified" or "interested"
    if (result.suggestedStage === 'qualified' || result.suggestedStage === 'interested') {
      console.log('✅ Test PASSED - Correctly identified as qualified/interested prospect')
    } else {
      console.log(`⚠️ Test WARNING - Expected 'qualified' or 'interested', got '${result.suggestedStage}'`)
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testAIClassification().catch(console.error)
}

module.exports = { testAIClassification }

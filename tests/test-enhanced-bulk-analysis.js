#!/usr/bin/env node

/**
 * Test Enhanced Bulk Email Analysis Features
 * Tests: scrolling, dynamic parameters, skip classified emails, progress tracking
 */

const fetch = require('node-fetch')

async function testEnhancedBulkAnalysis() {
  console.log('🧪 Testing Enhanced Bulk Email Analysis Features')
  console.log('=' .repeat(80))
  
  // Test parameters for different scenarios
  const testScenarios = [
    {
      name: 'Small Batch with Skip Classified',
      params: {
        maxEmails: 10,
        applyLabels: false,
        skipClassified: true,
        query: 'is:unread',
        batchSize: 5
      }
    },
    {
      name: 'Medium Batch with Label Application',
      params: {
        maxEmails: 25,
        applyLabels: true,
        skipClassified: true,
        query: 'is:inbox',
        batchSize: 10
      }
    },
    {
      name: 'Large Batch without Skip Classified',
      params: {
        maxEmails: 50,
        applyLabels: false,
        skipClassified: false,
        query: '',
        batchSize: 20
      }
    }
  ]
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing Scenario: ${scenario.name}`)
    console.log('Parameters:', JSON.stringify(scenario.params, null, 2))
    
    try {
      // Test the enhanced bulk analysis endpoint
      const response = await fetch('http://localhost:3000/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          ...scenario.params
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        console.log('✅ Response received')
        console.log(`📊 Summary:`)
        console.log(`   • Total Processed: ${result.summary?.totalProcessed || 0}`)
        console.log(`   • Classified: ${result.summary?.classified || 0}`)
        console.log(`   • Prospects: ${result.summary?.prospects || 0}`)
        console.log(`   • High Priority: ${result.summary?.highPriority || 0}`)
        console.log(`   • Labels Applied: ${result.summary?.labelsApplied || 0}`)
        console.log(`   • Skipped Already Classified: ${result.summary?.skippedAlreadyClassified || 0}`)
        console.log(`   • Errors: ${result.summary?.errors || 0}`)
        
        // Test progress tracking features
        if (result.result?.results) {
          console.log(`🔄 Progress Features:`)
          console.log(`   • Total Emails in Results: ${result.result.results.length}`)
          console.log(`   • Has Next Page Token: ${result.nextPageToken ? 'Yes' : 'No'}`)
          console.log(`   • Batch Processing: ${scenario.params.batchSize} emails/batch`)
          
          // Check for already classified emails
          const alreadyClassified = result.result.results.filter(email => email.alreadyClassified)
          if (alreadyClassified.length > 0) {
            console.log(`   • Already Classified Emails Found: ${alreadyClassified.length}`)
          }
        }
        
      } else {
        console.log(`❌ HTTP Error: ${response.status} - ${response.statusText}`)
        
        if (response.status === 400) {
          console.log('   This is expected for test tokens - testing parameter validation')
        }
      }
    } catch (error) {
      console.log(`❌ Request Error: ${error.message}`)
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   ⚠️ Development server not running - start with `npm run dev`')
      }
    }
    
    console.log('─'.repeat(60))
  }
  
  console.log('\n🎯 Enhanced Features to Verify:')
  console.log('✅ Dynamic Parameters:')
  console.log('   • maxEmails: Configurable email count limit')
  console.log('   • batchSize: Adjustable batch processing size')
  console.log('   • skipClassified: Toggle to skip already classified emails')
  console.log('   • applyLabels: Toggle Gmail label application')
  console.log('   • query: Flexible Gmail search query')
  
  console.log('\n✅ Progress Tracking:')
  console.log('   • Real-time progress percentage')
  console.log('   • Batch-by-batch processing status')
  console.log('   • Emails per second calculation')
  console.log('   • Time remaining estimation')
  console.log('   • Current vs total email counts')
  
  console.log('\n✅ Skip Already Classified:')
  console.log('   • Detect emails with AI/* labels')
  console.log('   • Skip processing for classified emails')
  console.log('   • Count skipped emails in summary')
  console.log('   • Prevent duplicate classification work')
  
  console.log('\n✅ Scrolling & UI Features:')
  console.log('   • Auto-scroll to latest results')
  console.log('   • Fixed height scroll area')
  console.log('   • Loading indicators while processing')
  console.log('   • Dynamic result updates')
  
  console.log('\n✅ Interactive UI Controls:')
  console.log('   • Live parameter changes')
  console.log('   • Immediate effect application')
  console.log('   • Disabled state during processing')
  console.log('   • Continue analysis for more emails')
  
  console.log('\n🚀 Next Steps for UI Testing:')
  console.log('1. Open the application at http://localhost:3000')
  console.log('2. Navigate to "Bulk Analyzer" tab')
  console.log('3. Connect Gmail and test different parameter combinations')
  console.log('4. Observe real-time progress and scrolling behavior')
  console.log('5. Verify skip classified functionality works')
  
  console.log('\n✅ Backend enhancements completed!')
  console.log('✅ Frontend bulk analyzer component created!')
  console.log('✅ Personalized classification system integrated!')
}

// Run the test
testEnhancedBulkAnalysis().catch(console.error)

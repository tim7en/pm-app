#!/usr/bin/env node

/**
 * Test AI classification pipeline using REAL Gmail emails
 * This replaces mock data with actual email data from Gmail
 */

async function testRealEmailPipeline() {
  console.log('🔥 Testing AI Classification with REAL Gmail Emails')
  console.log('=' * 60)
  
  // Step 1: Check if we have stored tokens
  console.log('\n🔑 Step 1: Authentication Check')
  console.log('-' * 40)
  
  const accessToken = process.env.GMAIL_ACCESS_TOKEN
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  
  if (!accessToken || !refreshToken) {
    console.log('❌ Gmail tokens not found in environment variables')
    console.log('💡 Please set GMAIL_ACCESS_TOKEN and GMAIL_REFRESH_TOKEN')
    console.log('   You can get these by running the Gmail OAuth flow first')
    return
  }
  
  console.log('✅ Gmail tokens found')
  
  // Step 2: Fetch real emails from Gmail
  console.log('\n📬 Step 2: Fetching Real Emails from Gmail')
  console.log('-' * 40)
  
  try {
    const response = await fetch('http://localhost:3000/api/email/gmail/bulk-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        maxEmails: 10, // Start with 10 emails for testing
        applyLabels: false, // Just fetch and classify, don't apply labels yet
        query: 'is:unread OR in:inbox' // Get recent emails
      })
    })
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch emails: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return
    }
    
    const bulkResult = await response.json()
    
    if (!bulkResult.success) {
      console.log('❌ Bulk analysis failed:', bulkResult.error)
      return
    }
    
    const emails = bulkResult.result.results || []
    console.log(`✅ Fetched ${emails.length} real emails from Gmail`)
    
    if (emails.length === 0) {
      console.log('⚠️ No emails found. Try adjusting the query or check Gmail permissions.')
      return
    }
    
    // Step 3: Test AI Classification on Real Emails
    console.log('\n🤖 Step 3: AI Classification of Real Emails')
    console.log('-' * 40)
    
    const classifications = []
    
    for (let i = 0; i < Math.min(emails.length, 5); i++) {
      const email = emails[i]
      
      try {
        console.log(`\n📧 Email ${i + 1}: "${email.subject?.substring(0, 50)}..."`)
        console.log(`   From: ${email.from}`)
        
        const classifyResponse = await fetch('http://localhost:3000/api/ai/analyze-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: email.subject || '',
            body: email.body || email.snippet || '',
            from: email.from || ''
          })
        })
        
        if (!classifyResponse.ok) {
          console.log(`   ❌ Classification failed: ${classifyResponse.status}`)
          continue
        }
        
        const classification = await classifyResponse.json()
        console.log(`   🎯 AI Classification: ${classification.suggestedStage}`)
        console.log(`   📊 Confidence: ${Math.round(classification.confidence * 100)}%`)
        console.log(`   💭 Reasoning: ${classification.reasoning?.substring(0, 100)}...`)
        
        classifications.push({
          email: {
            id: email.id,
            subject: email.subject,
            from: email.from
          },
          classification: classification.suggestedStage,
          confidence: classification.confidence
        })
        
      } catch (error) {
        console.log(`   ❌ Error processing email: ${error.message}`)
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Step 4: Classification Summary
    console.log('\n📊 Step 4: Classification Summary')
    console.log('-' * 40)
    
    const stageCounts = classifications.reduce((counts, item) => {
      counts[item.classification] = (counts[item.classification] || 0) + 1
      return counts
    }, {})
    
    console.log('Classification Distribution:')
    Object.entries(stageCounts).forEach(([stage, count]) => {
      console.log(`   • ${stage}: ${count} emails`)
    })
    
    const avgConfidence = classifications.reduce((sum, item) => sum + item.confidence, 0) / classifications.length
    console.log(`\nAverage Confidence: ${Math.round(avgConfidence * 100)}%`)
    
    // Step 5: Test Label Application (Optional)
    console.log('\n🏷️ Step 5: Label Application Test')
    console.log('-' * 40)
    
    console.log('Ready to apply labels to classified emails.')
    console.log('Run with applyLabels=true to create and apply Gmail labels.')
    
    // Show what labels would be created
    const expectedLabels = [...new Set(classifications.map(c => {
      const stageParts = c.classification.split('-')
      const formattedStage = stageParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('-')
      return `AI/${formattedStage}`
    }))]
    
    console.log('\nLabels that would be created:')
    expectedLabels.forEach(label => {
      console.log(`   • ${label}`)
    })
    
    console.log('\n🎯 Real Email Test Summary')
    console.log('-' * 40)
    console.log(`✅ Fetched ${emails.length} real emails from Gmail`)
    console.log(`✅ Classified ${classifications.length} emails with AI`)
    console.log(`✅ Found ${Object.keys(stageCounts).length} different business categories`)
    console.log(`✅ Average confidence: ${Math.round(avgConfidence * 100)}%`)
    
    console.log('\n💡 Next Steps:')
    console.log('   1. Review classifications above for accuracy')
    console.log('   2. Run bulk analysis with applyLabels=true to apply Gmail labels')
    console.log('   3. Check Gmail interface to verify labels were created and applied')
    
  } catch (error) {
    console.log('❌ Pipeline test failed:', error.message)
    console.error(error)
  }
}

// Helper function to run label application
async function applyLabelsToRealEmails() {
  console.log('\n🏷️ Applying Labels to Real Emails')
  console.log('=' * 40)
  
  const accessToken = process.env.GMAIL_ACCESS_TOKEN
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  
  if (!accessToken || !refreshToken) {
    console.log('❌ Gmail tokens required')
    return
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/email/gmail/bulk-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        maxEmails: 10,
        applyLabels: true, // Actually apply the labels
        query: 'is:unread OR in:inbox'
      })
    })
    
    const result = await response.json()
    console.log('Label application result:', result)
    
  } catch (error) {
    console.log('❌ Label application failed:', error.message)
  }
}

// Main execution
if (process.argv.includes('--apply-labels')) {
  applyLabelsToRealEmails().catch(console.error)
} else {
  testRealEmailPipeline().catch(console.error)
}

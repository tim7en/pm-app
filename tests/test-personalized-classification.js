#!/usr/bin/env node

/**
 * Test Personalized Email Classification for Timur Sabitov
 * Verifies that the AI classification system properly prioritizes emails based on personal/professional context
 */

const testEmails = [
  {
    id: 'test-1',
    subject: 'Urgent: Family Health Emergency',
    from: 'family.member@example.com',
    body: 'Hi Timur, we have an urgent family health situation that requires your immediate attention. Please call as soon as possible.',
    expectedCategory: 'high-priority-personal',
    expectedPriority: 'high'
  },
  {
    id: 'test-2', 
    subject: 'GCF Project Proposal Review Required - Adaptation Fund',
    from: 'project.coordinator@undp.org',
    body: 'Dear Timur Sabitov, We need your review on the GCF project proposal for climate adaptation in Central Asia. Your expertise in adaptation fund mechanisms is crucial for this $5M project.',
    expectedCategory: 'climate-finance-work',
    expectedPriority: 'high'
  },
  {
    id: 'test-3',
    subject: 'Research Collaboration Opportunity - Climate Change Modeling',
    from: 'professor.smith@university.edu',
    body: 'Dr. Sabitov, I am reaching out regarding a potential research collaboration on climate change modeling in Central Asia. Given your background with USGS and Fulbright experience...',
    expectedCategory: 'academic-research',
    expectedPriority: 'high'
  },
  {
    id: 'test-4',
    subject: 'World Bank Climate Project Consultation',
    from: 'climate.team@worldbank.org',
    body: 'Dear Mr. Sabitov, The World Bank would like to consult with you on our new climate adaptation project in Uzbekistan. Your role as focal point for UNFCCC makes you an ideal advisor.',
    expectedCategory: 'international-organizations',
    expectedPriority: 'high'
  },
  {
    id: 'test-5',
    subject: 'Consulting Opportunity: ADB Environmental Assessment',
    from: 'consultant.manager@adb.org',
    body: 'Hello Timur, We have a consulting opportunity for environmental impact assessment on a regional development project. Your experience with ADB and climate finance would be valuable.',
    expectedCategory: 'consulting-opportunities',
    expectedPriority: 'medium'
  },
  {
    id: 'test-6',
    subject: 'Personal Banking Update - Investment Portfolio',
    from: 'advisor@mybank.uz',
    body: 'Dear Timur Sabitov, Your investment portfolio performance review is ready. Please review the attached financial statements and schedule a consultation if needed.',
    expectedCategory: 'personal-finance',
    expectedPriority: 'medium'
  },
  {
    id: 'test-7',
    subject: 'Newsletter: Latest Climate Tech Innovations',
    from: 'newsletter@climatetech.com',
    body: 'Climate Tech Weekly - Discover the latest innovations in renewable energy, carbon capture, and sustainable development solutions.',
    expectedCategory: 'administrative',
    expectedPriority: 'low'
  }
]

async function testPersonalizedClassification() {
  console.log('🧪 Testing Personalized Email Classification for Timur Sabitov')
  console.log('=' .repeat(80))
  
  const results = []
  
  for (const email of testEmails) {
    console.log(`\n📧 Testing Email: ${email.id}`)
    console.log(`Subject: ${email.subject}`)
    console.log(`From: ${email.from}`)
    console.log(`Expected: ${email.expectedCategory} (${email.expectedPriority} priority)`)
    
    try {
      // Test the classification endpoint
      const response = await fetch('http://localhost:3000/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          maxResults: 1,
          applyLabels: false,
          testEmails: [email] // Send single email for classification test
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Classification: ${result.classification || 'Not available'}`)
        console.log(`✅ Priority: ${result.priority || 'Not available'}`)
        console.log(`✅ Confidence: ${result.confidence || 'Not available'}`)
        
        results.push({
          email: email.id,
          expected: email.expectedCategory,
          actual: result.classification,
          expectedPriority: email.expectedPriority,
          actualPriority: result.priority,
          success: result.classification === email.expectedCategory
        })
      } else {
        console.log(`❌ HTTP Error: ${response.status}`)
        results.push({
          email: email.id,
          expected: email.expectedCategory,
          actual: 'ERROR',
          success: false
        })
      }
    } catch (error) {
      console.log(`❌ Request Error: ${error.message}`)
      results.push({
        email: email.id,
        expected: email.expectedCategory,
        actual: 'ERROR',
        success: false
      })
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(80))
  
  const successCount = results.filter(r => r.success).length
  const totalTests = results.length
  
  console.log(`✅ Successful Classifications: ${successCount}/${totalTests}`)
  console.log(`📈 Accuracy Rate: ${Math.round((successCount/totalTests) * 100)}%`)
  
  console.log('\n📋 Detailed Results:')
  results.forEach(r => {
    const status = r.success ? '✅' : '❌'
    console.log(`${status} ${r.email}: Expected "${r.expected}" → Got "${r.actual}"`)
  })
  
  // Priority Analysis
  console.log('\n🎯 Priority Classification Analysis:')
  const highPriorityEmails = testEmails.filter(e => e.expectedPriority === 'high')
  console.log(`High Priority Emails (should get immediate attention): ${highPriorityEmails.length}`)
  
  console.log('\n💡 Key Personalization Features Being Tested:')
  console.log('- Personal/family emergency detection')
  console.log('- Climate finance work prioritization (GCF, Adaptation Fund)')
  console.log('- Academic/research collaboration recognition')
  console.log('- International organization identification')
  console.log('- Consulting opportunity classification')
  console.log('- Personal finance management')
  console.log('- Administrative content filtering')
  
  if (successCount === totalTests) {
    console.log('\n🎉 All tests passed! Personalized classification working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Check the classification logic and AI prompts.')
  }
}

// Run the test
testPersonalizedClassification().catch(console.error)

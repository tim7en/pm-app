#!/usr/bin/env node

/**
 * Test the label name formatting logic for the new 8 business groups
 */

function testLabelFormatting() {
  console.log('🏷️ Testing Label Name Formatting for Business Groups...')
  
  const testCases = [
    'prospect-lead',
    'active-client', 
    'vendor-supplier',
    'partnership-collaboration',
    'recruitment-hr',
    'media-pr',
    'legal-compliance',
    'administrative'
  ]
  
  testCases.forEach(stage => {
    // This is the logic from bulk-analyze endpoint
    const stageParts = stage.split('-')
    const formattedStage = stageParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join('-')
    const labelName = `AI/${formattedStage}`
    
    console.log(`   "${stage}" → "${labelName}"`)
  })
  
  console.log('')
  console.log('📋 Expected Gmail Label Names:')
  console.log('   • AI/Personal (Personal Communications)')
  console.log('   • AI/Work (Work-Related Communications)') 
  console.log('   • AI/Spam-Promotions (Marketing & Promotional Content)')
  console.log('   • AI/Social (Social Media & Social Communications)')
  console.log('   • AI/Notifications-Updates (System & Service Notifications)')
  console.log('   • AI/Finance (Financial & Banking Communications)')
  console.log('   • AI/Job-Opportunities (Career & Employment Related)')
  console.log('   • AI/Important-Follow-Up (High Priority Items Requiring Action)')
  console.log('   • AI/Other (Unclassifiable or Error Cases)')
}

testLabelFormatting()

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
  console.log('   • AI/Prospect-Lead (New Business Opportunities)')
  console.log('   • AI/Active-Client (Existing Client Communications)') 
  console.log('   • AI/Vendor-Supplier (Business Operations & Vendors)')
  console.log('   • AI/Partnership-Collaboration (Strategic Partnerships)')
  console.log('   • AI/Recruitment-Hr (Human Resources & Talent)')
  console.log('   • AI/Media-Pr (Marketing & Public Relations)')
  console.log('   • AI/Legal-Compliance (Legal & Compliance)')
  console.log('   • AI/Administrative (General Administration)')
}

testLabelFormatting()

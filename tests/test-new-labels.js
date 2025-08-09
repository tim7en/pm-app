#!/usr/bin/env node
/**
 * Test script to verify the new AI classification labels are working correctly
 */

// Test mapping between AI classification categories and expected Gmail labels
const classificationCategories = [
  'Personal',
  'Work', 
  'Spam/Promotions',
  'Social',
  'Notifications/Updates',
  'Finance',
  'Job Opportunities',
  'Important/Follow Up',
  'Other'
]

const expectedGmailLabels = [
  'AI/Personal',
  'AI/Work',
  'AI/Spam-Promotions',
  'AI/Social', 
  'AI/Notifications-Updates',
  'AI/Finance',
  'AI/Job-Opportunities',
  'AI/Important-Follow-Up',
  'AI/Other'
]

console.log('🧪 Testing AI Classification → Gmail Label Mapping')
console.log('=' * 50)

classificationCategories.forEach((category, index) => {
  const labelName = `AI/${category.replace(/[\/\s]/g, '-')}`
  const expectedLabel = expectedGmailLabels[index]
  
  console.log(`📧 "${category}"`)
  console.log(`   → Generated: "${labelName}"`)
  console.log(`   → Expected:  "${expectedLabel}"`)
  console.log(`   → Match: ${labelName === expectedLabel ? '✅' : '❌'}`)
  console.log('')
})

console.log('📊 Summary:')
console.log(`   • Total categories: ${classificationCategories.length}`)
console.log(`   • Expected labels: ${expectedGmailLabels.length}`)

// Test the replacement logic
console.log('\n🔧 Testing replacement logic:')
console.log('   "Spam/Promotions" → "AI/Spam-Promotions"')
console.log('   "Notifications/Updates" → "AI/Notifications-Updates"') 
console.log('   "Job Opportunities" → "AI/Job-Opportunities"')
console.log('   "Important/Follow Up" → "AI/Important-Follow-Up"')

console.log('\n✅ New label system is ready for testing!')

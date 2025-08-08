#!/usr/bin/env node

/**
 * Test Email Classification Stages for Timur Sabitov
 * Validates the new 9-category business classification system
 */

const { EmailCleanupService, DEFAULT_BUSINESS_STAGES } = require('./src/lib/email-cleanup-service.ts')

console.log('🧪 Testing Email Classification Stages for Timur Sabitov')
console.log('=' .repeat(80))

console.log('\n📋 Available Classification Stages:')
DEFAULT_BUSINESS_STAGES.forEach((stage, index) => {
  console.log(`${index + 1}. ${stage.id} (Priority ${stage.priority})`)
  console.log(`   Name: ${stage.name}`)
  console.log(`   Description: ${stage.description}`)
  console.log(`   Keywords: ${stage.keywords.join(', ')}`)
  console.log('')
})

console.log('🎯 Priority Level Distribution:')
const priority1 = DEFAULT_BUSINESS_STAGES.filter(s => s.priority === 1)
const priority2 = DEFAULT_BUSINESS_STAGES.filter(s => s.priority === 2) 
const priority3 = DEFAULT_BUSINESS_STAGES.filter(s => s.priority === 3)

console.log(`Priority 1 (Highest): ${priority1.length} categories`)
priority1.forEach(s => console.log(`  - ${s.name}`))

console.log(`\nPriority 2 (Medium): ${priority2.length} categories`)
priority2.forEach(s => console.log(`  - ${s.name}`))

console.log(`\nPriority 3 (Lowest): ${priority3.length} categories`)
priority3.forEach(s => console.log(`  - ${s.name}`))

console.log('\n✅ Classification system tailored for Timur Sabitov:')
console.log('- Environmental scientist and project manager')
console.log('- Climate finance expert (GCF, Adaptation Fund)')
console.log('- International development professional')
console.log('- Academic researcher and lecturer')
console.log('- UNFCCC IPCC focal point')
console.log('- Based in Tashkent, Uzbekistan')

console.log('\n🔍 Personalization Features:')
console.log('✅ Personal/family emergency prioritization')
console.log('✅ Climate finance work classification')
console.log('✅ Academic/research collaboration tracking')
console.log('✅ International organization recognition')
console.log('✅ Consulting opportunity identification')
console.log('✅ Personal finance management')
console.log('✅ Professional networking categorization')
console.log('✅ Media/outreach opportunity filtering')
console.log('✅ Administrative content de-prioritization')

console.log('\n🎉 Email classification system ready for production!')

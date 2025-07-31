#!/usr/bin/env node

/**
 * Authentication System Setup Script
 * This script helps set up the authentication system for Project Manager
 */

const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

console.log('🔐 Project Manager Authentication Setup\n')

// Generate secure random strings
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex')
}

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const templatePath = path.join(process.cwd(), '.env.template')

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists')
  console.log('   To reconfigure, delete .env.local and run this script again\n')
  process.exit(0)
}

if (!fs.existsSync(templatePath)) {
  console.log('❌ .env.template not found')
  console.log('   Please make sure you are in the project root directory\n')
  process.exit(1)
}

// Read template
let envContent = fs.readFileSync(templatePath, 'utf8')

// Generate secure secrets
const jwtSecret = generateSecureSecret(64)
const nextAuthSecret = generateSecureSecret(32)

// Replace placeholders
envContent = envContent.replace(
  'your-secret-key-change-in-production-make-it-long-and-random',
  jwtSecret
)
envContent = envContent.replace(
  'your-nextauth-secret-change-in-production',
  nextAuthSecret
)

// Write .env.local
fs.writeFileSync(envPath, envContent)

console.log('✅ Created .env.local with secure secrets generated')
console.log('✅ JWT_SECRET and NEXTAUTH_SECRET configured automatically\n')

console.log('📋 Next steps:')
console.log('1. Configure database: npx prisma db push')
console.log('2. Start development server: npm run dev')
console.log('3. Visit http://localhost:3000/auth to test\n')

console.log('🔧 Optional configurations:')
console.log('- Edit .env.local to add SMTP settings for email functionality')
console.log('- Add Google OAuth credentials for social login')
console.log('- See AUTH_SETUP_GUIDE.md for detailed instructions\n')

console.log('🎉 Authentication system is ready to use!')

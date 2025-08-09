#!/usr/bin/env node

/**
 * Simple Gmail OAuth token getter
 * Run this to get access and refresh tokens for Gmail API
 */

async function getGmailTokens() {
  console.log('🔑 Gmail OAuth Token Setup')
  console.log('=' * 40)
  
  // Check if tokens already exist
  const existingAccess = process.env.GMAIL_ACCESS_TOKEN
  const existingRefresh = process.env.GMAIL_REFRESH_TOKEN
  
  if (existingAccess && existingRefresh) {
    console.log('✅ Gmail tokens already configured!')
    console.log('Access Token (first 20 chars):', existingAccess.substring(0, 20) + '...')
    console.log('Refresh Token (first 20 chars):', existingRefresh.substring(0, 20) + '...')
    console.log('\n💡 You can now run: node test-real-email-pipeline.js')
    return
  }
  
  console.log('📋 To get Gmail tokens, you need to:')
  console.log('\n1. Make sure your .env.local file has:')
  console.log('   GOOGLE_CLIENT_ID=your_client_id')
  console.log('   GOOGLE_CLIENT_SECRET=your_client_secret')
  console.log('   GOOGLE_REDIRECT_URI=http://localhost:3000/api/email/gmail/callback')
  
  console.log('\n2. Start the development server:')
  console.log('   npm run dev')
  
  console.log('\n3. Visit the Gmail OAuth URL:')
  console.log('   http://localhost:3000/api/email/gmail/auth')
  
  console.log('\n4. Complete OAuth flow and copy the tokens')
  
  console.log('\n5. Add tokens to your .env.local:')
  console.log('   GMAIL_ACCESS_TOKEN=your_access_token')
  console.log('   GMAIL_REFRESH_TOKEN=your_refresh_token')
  
  console.log('\n6. Then run the real email test:')
  console.log('   node test-real-email-pipeline.js')
  
  // Test server connection
  console.log('\n🔍 Testing server connection...')
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ Development server is running')
      console.log('🔗 Visit: http://localhost:3000/api/email/gmail/auth')
    } else {
      console.log('⚠️ Server responded but may have issues')
    }
  } catch (error) {
    console.log('❌ Development server not running')
    console.log('💡 Please run: npm run dev')
  }
}

getGmailTokens().catch(console.error)

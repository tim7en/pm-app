/**
 * Google OAuth Configuration Checker
 * Run this script to verify your Google OAuth setup
 */

require('dotenv').config()

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`)
}

function success(message) { log(colors.green, '✅', message) }
function error(message) { log(colors.red, '❌', message) }
function warning(message) { log(colors.yellow, '⚠️', message) }
function info(message) { log(colors.blue, 'ℹ️', message) }

console.log('\n' + '='.repeat(60))
log(colors.cyan, '🔍', 'GOOGLE OAUTH CONFIGURATION CHECKER')
console.log('='.repeat(60) + '\n')

// Check environment variables
info('Checking environment variables...')

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const nextAuthUrl = process.env.NEXTAUTH_URL

if (!clientId) {
  error('GOOGLE_CLIENT_ID is not set in environment variables')
} else if (clientId === 'your_google_client_id_here') {
  error('GOOGLE_CLIENT_ID is still a placeholder value')
  warning('Please replace with actual Client ID from Google Cloud Console')
} else if (!clientId.includes('.apps.googleusercontent.com')) {
  warning('GOOGLE_CLIENT_ID format looks incorrect (should end with .apps.googleusercontent.com)')
} else {
  success(`GOOGLE_CLIENT_ID is set: ${clientId.substring(0, 20)}...`)
}

if (!clientSecret) {
  error('GOOGLE_CLIENT_SECRET is not set in environment variables')
} else if (clientSecret === 'your_google_client_secret_here') {
  error('GOOGLE_CLIENT_SECRET is still a placeholder value')
  warning('Please replace with actual Client Secret from Google Cloud Console')
} else if (!clientSecret.startsWith('GOCSPX-')) {
  warning('GOOGLE_CLIENT_SECRET format looks incorrect (should start with GOCSPX-)')
} else {
  success(`GOOGLE_CLIENT_SECRET is set: ${clientSecret.substring(0, 10)}...`)
}

if (!nextAuthUrl) {
  warning('NEXTAUTH_URL is not set, using default localhost:3001')
} else {
  success(`NEXTAUTH_URL is set: ${nextAuthUrl}`)
}

console.log()

// Generate expected callback URL
const baseUrl = nextAuthUrl || 'http://localhost:3001'
const callbackUrl = `${baseUrl}/api/auth/google/callback`

info('Expected OAuth callback URL:')
console.log(`   ${callbackUrl}`)
console.log()

// Check if configuration looks complete
const hasValidClientId = clientId && clientId !== 'your_google_client_id_here' && clientId.includes('.apps.googleusercontent.com')
const hasValidClientSecret = clientSecret && clientSecret !== 'your_google_client_secret_here' && clientSecret.startsWith('GOCSPX-')

if (hasValidClientId && hasValidClientSecret) {
  success('Google OAuth configuration appears to be complete!')
  console.log()
  info('Next steps:')
  console.log('   1. Make sure your Google Cloud Console OAuth app is PUBLISHED (not in testing mode)')
  console.log('   2. Verify the callback URL above is added to your OAuth client\'s authorized redirect URIs')
  console.log('   3. Test the authentication flow at: http://localhost:3001/auth/login')
  console.log()
  info('To test configuration:')
  console.log('   curl http://localhost:3001/api/auth/google/url')
} else {
  error('Google OAuth configuration is incomplete!')
  console.log()
  info('Required actions:')
  console.log('   1. Go to Google Cloud Console: https://console.cloud.google.com/')
  console.log('   2. Navigate to APIs & Services > Credentials')
  console.log('   3. Create or edit your OAuth 2.0 Client ID')
  console.log('   4. Copy the Client ID and Client Secret to your .env file')
  console.log('   5. Make sure your OAuth consent screen is configured and PUBLISHED')
  console.log()
  warning('See GOOGLE_OAUTH_PUBLIC_ACCESS_GUIDE.md for detailed instructions')
}

console.log('\n' + '='.repeat(60))

// If valid config, test OAuth URL generation
if (hasValidClientId && hasValidClientSecret) {
  info('Testing OAuth URL generation...')
  
  try {
    const { OAuth2Client } = require('google-auth-library')
    
    const client = new OAuth2Client(clientId, clientSecret, callbackUrl)
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true
    })
    
    success('OAuth URL generated successfully!')
    info('Sample OAuth URL:')
    console.log(`   ${authUrl.substring(0, 100)}...`)
    
  } catch (err) {
    error(`Failed to generate OAuth URL: ${err.message}`)
    warning('Make sure google-auth-library is installed: npm install google-auth-library')
  }
}

console.log('='.repeat(60) + '\n')

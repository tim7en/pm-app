import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail-service'

const GMAIL_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/email/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    // Handle OAuth error
    const errorHtml = `
      <html>
        <head><title>Gmail Authentication Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: red;">❌ Authentication Failed</h1>
          <p>Error: ${error}</p>
          <p><a href="/email-cleanup">Try again</a></p>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (code) {
    try {
      // Exchange code for tokens
      const gmailService = new GmailService(GMAIL_CONFIG)
      const tokens = await gmailService.getTokens(code)
      
      // Return success page with tokens for testing
      const successHtml = `
        <html>
          <head>
            <title>Gmail Authentication Success</title>
            <script>
              // Auto-redirect after 10 seconds
              let countdown = 10;
              function updateCountdown() {
                document.getElementById('countdown').textContent = countdown;
                if (countdown === 0) {
                  window.location.href = '/email-cleanup?auth=success';
                  return;
                }
                countdown--;
                setTimeout(updateCountdown, 1000);
              }
              
              // Start countdown when page loads
              window.onload = function() {
                updateCountdown();
                
                // Save tokens to localStorage for the email cleanup app to use
                localStorage.setItem('gmail-tokens', JSON.stringify({
                  accessToken: "${tokens.access_token}",
                  refreshToken: "${tokens.refresh_token || ''}",
                  timestamp: "${new Date().toISOString()}"
                }));
              };
              
              function redirectNow() {
                window.location.href = '/email-cleanup?auth=success';
              }
              
              function copyTokens() {
                const tokens = {
                  accessToken: "${tokens.access_token}",
                  refreshToken: "${tokens.refresh_token || ''}",
                  timestamp: "${new Date().toISOString()}"
                };
                navigator.clipboard.writeText(JSON.stringify(tokens, null, 2)).then(() => {
                  alert('Tokens copied to clipboard!');
                });
              }
            </script>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: green;">✅ Gmail Authentication Successful!</h1>
            <p>Your Gmail account has been connected successfully.</p>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
              <p><strong>🔄 Redirecting to Email Cleanup in <span id="countdown">10</span> seconds...</strong></p>
              <button onclick="redirectNow()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                Continue Now
              </button>
              <button onclick="copyTokens()" style="padding: 8px 15px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Copy Tokens
              </button>
            </div>
            
            <h3>🔐 Authentication Tokens:</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Access Token:</strong></p>
              <input type="text" value="${tokens.access_token}" 
                     style="width: 100%; padding: 5px; font-family: monospace; font-size: 12px;" 
                     onclick="this.select()" readonly />
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Refresh Token:</strong></p>
              <input type="text" value="${tokens.refresh_token || 'N/A'}" 
                     style="width: 100%; padding: 5px; font-family: monospace; font-size: 12px;" 
                     onclick="this.select()" readonly />
            </div>
            
            <h3>📋 Next Steps:</h3>
            <ol>
              <li>Copy the tokens above</li>
              <li>Save them to a file called <code>gmail-tokens.json</code> in your project root</li>
              <li>Run the comprehensive test suite: <code>node label-comprehensive-test.js</code></li>
            </ol>
            
            <h3>📄 For Manual Testing - Save as gmail-tokens.json:</h3>
            <textarea style="width: 100%; height: 120px; font-family: monospace; font-size: 12px;" 
                      onclick="this.select()" readonly>{
  "accessToken": "${tokens.access_token}",
  "refreshToken": "${tokens.refresh_token || ''}",
  "timestamp": "${new Date().toISOString()}"
}</textarea>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              💡 <strong>Tip:</strong> Tokens are automatically saved to browser storage and will be available in the Email Cleanup app.
            </p>
          </body>
        </html>
      `;
      
      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      const errorHtml = `
        <html>
          <head><title>Token Exchange Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: red;">❌ Token Exchange Failed</h1>
            <p>Failed to exchange authorization code for tokens.</p>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p><a href="/email-cleanup">Try again</a></p>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
  
  // No code or error, redirect with error
  const noCodeHtml = `
    <html>
      <head><title>Authentication Error</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: red;">❌ No Authorization Code</h1>
        <p>No authorization code was received from Gmail.</p>
        <p><a href="/email-cleanup">Try again</a></p>
      </body>
    </html>
  `;
  return new NextResponse(noCodeHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

#!/usr/bin/env node

/**
 * Gmail Authentication Helper
 * Helps capture and save Gmail OAuth tokens for testing
 */

const http = require('http');
const url = require('url');
const fs = require('fs');

const PORT = 3002; // Different port to avoid conflicts

console.log('🔐 Gmail Authentication Helper');
console.log('===============================');
console.log('This helper will capture OAuth tokens from the callback.');
console.log();

// Create a simple server to capture the callback
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/capture-tokens') {
    const { access_token, refresh_token } = parsedUrl.query;
    
    if (access_token && refresh_token) {
      const tokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        timestamp: new Date().toISOString()
      };
      
      // Save tokens to file
      fs.writeFileSync('./gmail-tokens.json', JSON.stringify(tokens, null, 2));
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Authentication Success</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: green;">✅ Authentication Successful!</h1>
            <p>Tokens have been saved to <code>gmail-tokens.json</code></p>
            <p>You can now run the label test suite again:</p>
            <pre style="background: #f0f0f0; padding: 10px;">node label-comprehensive-test.js</pre>
            <p>This window can be closed.</p>
          </body>
        </html>
      `);
      
      console.log('✅ Tokens captured and saved to gmail-tokens.json');
      console.log('📧 Access Token:', access_token.substring(0, 20) + '...');
      console.log('🔄 Refresh Token:', refresh_token.substring(0, 20) + '...');
      console.log();
      console.log('🎯 Next step: Run the test suite again:');
      console.log('   node label-comprehensive-test.js');
      
      // Close server after successful capture
      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
      
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: red;">❌ Authentication Failed</h1>
            <p>Required tokens not found in callback.</p>
            <p>Please try the authentication flow again.</p>
          </body>
        </html>
      `);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Token capture server running on http://localhost:${PORT}`);
  console.log();
  console.log('📋 Instructions:');
  console.log('1. Complete the Gmail OAuth flow in your browser');
  console.log('2. After successful authentication, you\'ll see tokens in the URL or browser');
  console.log('3. Extract the tokens and visit:');
  console.log(`   http://localhost:${PORT}/capture-tokens?access_token=YOUR_ACCESS_TOKEN&refresh_token=YOUR_REFRESH_TOKEN`);
  console.log();
  console.log('Or manually create gmail-tokens.json with:');
  console.log(JSON.stringify({
    accessToken: "your_access_token_here",
    refreshToken: "your_refresh_token_here",
    timestamp: new Date().toISOString()
  }, null, 2));
  console.log();
  console.log('Press Ctrl+C to stop this server.');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping authentication helper...');
  server.close();
  process.exit(0);
});

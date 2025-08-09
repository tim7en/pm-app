#!/usr/bin/env node

/**
 * Manual Token Entry Script
 * For manually entering Gmail OAuth tokens
 */

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Manual Gmail Token Entry');
console.log('============================');
console.log('This script helps you manually enter Gmail OAuth tokens.');
console.log();

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function collectTokens() {
  try {
    console.log('Please follow these steps first:');
    console.log('1. Visit: https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify&prompt=consent&response_type=code&client_id=447386615051-991cas13orb6k1q826gn8h07qif3nhlr.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Femail%2Fgmail%2Fcallback');
    console.log('2. Sign in with: sabitov.ty@gmail.com');
    console.log('3. Grant permissions');
    console.log('4. Check the callback URL or browser developer tools for tokens');
    console.log();

    const accessToken = await askQuestion('Enter your access token: ');
    if (!accessToken) {
      console.log('❌ Access token is required');
      process.exit(1);
    }

    const refreshToken = await askQuestion('Enter your refresh token: ');
    if (!refreshToken) {
      console.log('❌ Refresh token is required');
      process.exit(1);
    }

    const tokens = {
      accessToken,
      refreshToken,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('./gmail-tokens.json', JSON.stringify(tokens, null, 2));
    
    console.log();
    console.log('✅ Tokens saved to gmail-tokens.json');
    console.log('📧 Access Token:', accessToken.substring(0, 20) + '...');
    console.log('🔄 Refresh Token:', refreshToken.substring(0, 20) + '...');
    console.log();
    console.log('🎯 Now you can run the comprehensive test:');
    console.log('   node label-comprehensive-test.js');

  } catch (error) {
    console.error('❌ Error collecting tokens:', error.message);
  } finally {
    rl.close();
  }
}

collectTokens();

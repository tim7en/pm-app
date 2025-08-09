#!/usr/bin/env node

async function testAPILogin() {
  console.log('🔍 Testing API Login System...');
  
  try {
    const testCred = {
      email: 'login@test.com',
      password: 'test123'
    };

    console.log('1. Testing login endpoint...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCred)
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);

    const result = await response.text();
    console.log(`   Response: ${result}`);

    if (response.ok) {
      console.log('✅ Login API is working!');
      const data = JSON.parse(result);
      console.log('📋 Login successful:', {
        user: data.user?.email,
        token: data.token ? 'Present' : 'Missing'
      });
    } else {
      console.log('❌ Login API failed');
      console.log('Trying to debug the issue...');
      
      // Test the /api/auth/me endpoint
      console.log('\n2. Testing auth/me endpoint...');
      const meResponse = await fetch('http://localhost:3000/api/auth/me');
      console.log(`   Status: ${meResponse.status}`);
      const meResult = await meResponse.text();
      console.log(`   Response: ${meResult}`);
    }

  } catch (error) {
    console.error('💥 API test failed:', error.message);
  }
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  console.log('Installing fetch for Node.js...');
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

testAPILogin();

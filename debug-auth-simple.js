#!/usr/bin/env node

/**
 * Simple Auth Debug Test
 * Debug authentication issues step by step
 */

const BASE_URL = 'http://localhost:3000'

// Test user
const TEST_USER = {
  name: 'Test Debug User',
  email: 'debug@test.com',
  password: 'testpass123'
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  })

  console.log(`📡 ${options.method || 'GET'} ${endpoint}:`, response.status, response.statusText)
  return response
}

async function testAuth() {
  console.log('🔐 Simple Auth Debug Test')
  console.log('================================')
  
  try {
    // Test 1: Try to login
    console.log('\n1. Testing login for existing user...')
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    })

    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ Login successful!')
      console.log('📋 Login response:', JSON.stringify(loginData, null, 2))
      
      // Test 2: Test authenticated request
      console.log('\n2. Testing authenticated request...')
      const workspacesResponse = await makeRequest('/api/workspaces', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      })
      
      if (workspacesResponse.ok) {
        const workspaces = await workspacesResponse.json()
        console.log('✅ Authenticated request successful!')
        console.log('📋 Workspaces:', JSON.stringify(workspaces, null, 2))
      } else {
        const error = await workspacesResponse.json()
        console.log('❌ Authenticated request failed:', error)
      }
      
    } else {
      console.log('❌ Login failed')
      const error = await loginResponse.text()
      console.log('Error response:', error)
      
      // Test registration instead
      console.log('\n1b. Testing registration...')
      const registerResponse = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(TEST_USER)
      })
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json()
        console.log('✅ Registration successful!')
        console.log('📋 Register response:', JSON.stringify(registerData, null, 2))
      } else {
        const error = await registerResponse.text()
        console.log('❌ Registration failed:', error)
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

// Run test
testAuth()

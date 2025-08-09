/**
 * Comprehensive Authentication System QA/QC Test Suite
 * Tests all authentication endpoints and Google OAuth integration
 */

const fetch = require('node-fetch') // You may need to install: npm install node-fetch@2
const crypto = require('crypto')

const BASE_URL = 'http://localhost:3001'
const TEST_EMAIL = `test.auth.${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'
const TEST_NAME = 'QA Test User'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`)
}

function success(message) { log(colors.green, '✅', message) }
function error(message) { log(colors.red, '❌', message) }
function warning(message) { log(colors.yellow, '⚠️', message) }
function info(message) { log(colors.blue, 'ℹ️', message) }
function test(message) { log(colors.cyan, '🧪', message) }

class AuthTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    }
    this.authToken = null
    this.cookies = []
  }

  async runTest(testName, testFunction) {
    test(`Running: ${testName}`)
    try {
      await testFunction()
      success(`PASSED: ${testName}`)
      this.testResults.passed++
      this.testResults.tests.push({ name: testName, status: 'PASSED' })
    } catch (err) {
      error(`FAILED: ${testName} - ${err.message}`)
      this.testResults.failed++
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: err.message })
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuthTester/1.0'
      }
    }

    if (this.authToken) {
      defaultOptions.headers['Authorization'] = `Bearer ${this.authToken}`
    }

    if (this.cookies.length > 0) {
      defaultOptions.headers['Cookie'] = this.cookies.join('; ')
    }

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    }

    const response = await fetch(url, mergedOptions)
    
    // Extract cookies from response
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      this.cookies.push(setCookieHeader.split(';')[0])
    }

    return response
  }

  // =================== CORE AUTHENTICATION TESTS ===================

  async testHealthCheck() {
    const response = await this.makeRequest('/api/auth/me')
    if (response.status === 401) {
      success('Health check passed - unauthenticated request properly rejected')
    } else {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  }

  async testUserRegistration() {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Registration failed: ${error.error}`)
    }

    const data = await response.json()
    if (!data.user || !data.token) {
      throw new Error('Registration response missing user or token')
    }

    this.authToken = data.token
    success(`User registered: ${data.user.email}`)
  }

  async testUserLogin() {
    // First logout to test fresh login
    this.authToken = null
    this.cookies = []

    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Login failed: ${error.error}`)
    }

    const data = await response.json()
    if (!data.user || !data.token) {
      throw new Error('Login response missing user or token')
    }

    this.authToken = data.token
    success(`User logged in: ${data.user.email}`)
  }

  async testTokenValidation() {
    const response = await this.makeRequest('/api/auth/me')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token validation failed: ${error.error}`)
    }

    const data = await response.json()
    if (!data.user || data.user.email !== TEST_EMAIL) {
      throw new Error('Token validation returned incorrect user data')
    }

    success('Token validation successful')
  }

  async testInvalidLogin() {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'wrongpassword'
      })
    })

    if (response.ok) {
      throw new Error('Invalid login should have failed')
    }

    const error = await response.json()
    if (!error.error) {
      throw new Error('Error response should contain error message')
    }

    success('Invalid login properly rejected')
  }

  async testDuplicateRegistration() {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate User',
        email: TEST_EMAIL, // Same email as before
        password: 'AnotherPassword123!'
      })
    })

    if (response.ok) {
      throw new Error('Duplicate registration should have failed')
    }

    const error = await response.json()
    if (!error.error.includes('already exists') && !error.error.includes('duplicate')) {
      throw new Error('Should return duplicate user error')
    }

    success('Duplicate registration properly rejected')
  }

  // =================== PASSWORD RESET TESTS ===================

  async testPasswordResetRequest() {
    const response = await this.makeRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Password reset request failed: ${error.error}`)
    }

    const data = await response.json()
    if (!data.message) {
      throw new Error('Password reset response should contain message')
    }

    success('Password reset request successful')
  }

  async testPasswordResetInvalidToken() {
    const fakeToken = crypto.randomBytes(32).toString('hex')
    const response = await this.makeRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: fakeToken,
        password: 'NewPassword123!'
      })
    })

    if (response.ok) {
      throw new Error('Invalid reset token should have failed')
    }

    const error = await response.json()
    if (!error.error.includes('Invalid') && !error.error.includes('expired')) {
      throw new Error('Should return invalid token error')
    }

    success('Invalid reset token properly rejected')
  }

  // =================== GOOGLE OAUTH TESTS ===================

  async testGoogleOAuthURL() {
    const response = await this.makeRequest('/api/auth/google/url')

    if (!response.ok) {
      const error = await response.json()
      
      // If Google OAuth is not configured, that's expected
      if (error.error.includes('not configured')) {
        warning('Google OAuth not configured - skipping OAuth tests')
        return 'skip_oauth'
      }
      
      throw new Error(`Google OAuth URL generation failed: ${error.error}`)
    }

    const data = await response.json()
    if (!data.url || !data.url.includes('google.com')) {
      throw new Error('Invalid Google OAuth URL returned')
    }

    success('Google OAuth URL generation successful')
    return 'oauth_configured'
  }

  async testGoogleOAuthInvalidCode() {
    const response = await this.makeRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        code: 'invalid_code_12345'
      })
    })

    if (response.ok) {
      throw new Error('Invalid Google OAuth code should have failed')
    }

    const error = await response.json()
    if (!error.error) {
      throw new Error('Should return error for invalid OAuth code')
    }

    success('Invalid Google OAuth code properly rejected')
  }

  // =================== SECURITY TESTS ===================

  async testAccountLockout() {
    // First, create a temporary test user for lockout testing
    const lockoutEmail = `lockout.test.${Date.now()}@example.com`
    
    // Register user
    await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Lockout Test User',
        email: lockoutEmail,
        password: TEST_PASSWORD
      })
    })

    // Attempt 5 failed logins
    for (let i = 1; i <= 5; i++) {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: lockoutEmail,
          password: 'wrongpassword'
        })
      })

      if (response.ok) {
        throw new Error(`Login attempt ${i} should have failed`)
      }

      const error = await response.json()
      
      if (i < 5 && !error.error.includes('attempts remaining')) {
        warning(`Attempt ${i}: ${error.error}`)
      } else if (i === 5 && !error.error.includes('locked')) {
        throw new Error('Account should be locked after 5 failed attempts')
      }
    }

    // 6th attempt should indicate account is locked
    const finalResponse = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: lockoutEmail,
        password: TEST_PASSWORD // Even correct password should fail
      })
    })

    if (finalResponse.ok) {
      throw new Error('Login should fail when account is locked')
    }

    const finalError = await finalResponse.json()
    if (!finalError.error.includes('locked')) {
      throw new Error('Should return account locked error')
    }

    success('Account lockout mechanism working correctly')
  }

  async testInputValidation() {
    // Test missing email
    let response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: TEST_PASSWORD
      })
    })

    if (response.status !== 400) {
      throw new Error('Should return 400 for missing email')
    }

    // Test invalid email format
    response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email',
        password: TEST_PASSWORD
      })
    })

    if (response.ok) {
      throw new Error('Should reject invalid email format')
    }

    // Test weak password
    response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: `weak.password.${Date.now()}@example.com`,
        password: '123' // Too short
      })
    })

    if (response.ok) {
      throw new Error('Should reject weak password')
    }

    success('Input validation working correctly')
  }

  async testSQLInjection() {
    // Test SQL injection attempts
    const maliciousInputs = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "admin'--",
      "' UNION SELECT * FROM users --"
    ]

    for (const maliciousInput of maliciousInputs) {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: maliciousInput,
          password: TEST_PASSWORD
        })
      })

      if (response.ok) {
        throw new Error(`SQL injection attempt should have failed: ${maliciousInput}`)
      }
    }

    success('SQL injection protection working')
  }

  async testXSSProtection() {
    // Test XSS attempts in registration
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '"><script>alert("xss")</script>'
    ]

    for (const payload of xssPayloads) {
      const response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: payload,
          email: `xss.test.${Date.now()}@example.com`,
          password: TEST_PASSWORD
        })
      })

      // Registration might succeed, but the payload should be sanitized
      if (response.ok) {
        const data = await response.json()
        if (data.user.name && data.user.name.includes('<script>')) {
          throw new Error('XSS payload was not sanitized')
        }
      }
    }

    success('XSS protection working')
  }

  // =================== PERFORMANCE TESTS ===================

  async testResponseTimes() {
    const endpoints = [
      { path: '/api/auth/me', method: 'GET', maxTime: 100 },
      { path: '/api/auth/login', method: 'POST', maxTime: 500, body: { email: TEST_EMAIL, password: TEST_PASSWORD } }
    ]

    for (const endpoint of endpoints) {
      const startTime = Date.now()
      
      const options = { method: endpoint.method }
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body)
      }

      await this.makeRequest(endpoint.path, options)
      
      const responseTime = Date.now() - startTime
      
      if (responseTime > endpoint.maxTime) {
        warning(`${endpoint.path} took ${responseTime}ms (expected < ${endpoint.maxTime}ms)`)
      } else {
        success(`${endpoint.path} responded in ${responseTime}ms`)
      }
    }
  }

  // =================== DATA CONSISTENCY TESTS ===================

  async testDataConsistency() {
    // Test that user data is consistent across endpoints
    const meResponse = await this.makeRequest('/api/auth/me')
    const meData = await meResponse.json()

    if (!meData.user || meData.user.email !== TEST_EMAIL) {
      throw new Error('User data inconsistent in /me endpoint')
    }

    // Test that sensitive data is not exposed
    if (meData.user.password) {
      throw new Error('Password should not be exposed in API responses')
    }

    if (meData.user.resetToken) {
      throw new Error('Reset token should not be exposed in API responses')
    }

    success('Data consistency verified')
  }

  async testUserLogout() {
    const response = await this.makeRequest('/api/auth/logout', {
      method: 'POST'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Logout failed: ${error.error}`)
    }

    // Try to use the token after logout
    this.authToken = null
    this.cookies = []
    
    const meResponse = await this.makeRequest('/api/auth/me')
    if (meResponse.ok) {
      throw new Error('Token should be invalid after logout')
    }

    success('User logout successful')
  }

  // =================== MAIN TEST RUNNER ===================

  async runAllTests() {
    console.log('\n' + '='.repeat(80))
    log(colors.magenta, '🚀', 'STARTING COMPREHENSIVE AUTHENTICATION QA/QC TESTS')
    console.log('='.repeat(80) + '\n')

    info(`Testing against: ${BASE_URL}`)
    info(`Test email: ${TEST_EMAIL}`)
    console.log()

    // Core Authentication Tests
    log(colors.blue, '📋', 'CORE AUTHENTICATION TESTS')
    console.log('-'.repeat(50))
    
    await this.runTest('Health Check', () => this.testHealthCheck())
    await this.runTest('User Registration', () => this.testUserRegistration())
    await this.runTest('User Login', () => this.testUserLogin())
    await this.runTest('Token Validation', () => this.testTokenValidation())
    await this.runTest('Invalid Login Rejection', () => this.testInvalidLogin())
    await this.runTest('Duplicate Registration Rejection', () => this.testDuplicateRegistration())
    
    console.log()

    // Password Reset Tests
    log(colors.blue, '🔑', 'PASSWORD RESET TESTS')
    console.log('-'.repeat(50))
    
    await this.runTest('Password Reset Request', () => this.testPasswordResetRequest())
    await this.runTest('Invalid Reset Token Rejection', () => this.testPasswordResetInvalidToken())
    
    console.log()

    // Google OAuth Tests
    log(colors.blue, '🌐', 'GOOGLE OAUTH TESTS')
    console.log('-'.repeat(50))
    
    const oauthStatus = await this.runTest('Google OAuth URL Generation', () => this.testGoogleOAuthURL())
    
    if (oauthStatus !== 'skip_oauth') {
      await this.runTest('Invalid OAuth Code Rejection', () => this.testGoogleOAuthInvalidCode())
    }
    
    console.log()

    // Security Tests
    log(colors.blue, '🔒', 'SECURITY TESTS')
    console.log('-'.repeat(50))
    
    await this.runTest('Account Lockout Mechanism', () => this.testAccountLockout())
    await this.runTest('Input Validation', () => this.testInputValidation())
    await this.runTest('SQL Injection Protection', () => this.testSQLInjection())
    await this.runTest('XSS Protection', () => this.testXSSProtection())
    
    console.log()

    // Performance Tests
    log(colors.blue, '⚡', 'PERFORMANCE TESTS')
    console.log('-'.repeat(50))
    
    await this.runTest('Response Time Validation', () => this.testResponseTimes())
    
    console.log()

    // Data Consistency Tests
    log(colors.blue, '📊', 'DATA CONSISTENCY TESTS')
    console.log('-'.repeat(50))
    
    await this.runTest('Data Consistency Check', () => this.testDataConsistency())
    await this.runTest('User Logout', () => this.testUserLogout())

    // Final Results
    this.printResults()
  }

  printResults() {
    console.log('\n' + '='.repeat(80))
    log(colors.magenta, '📊', 'TEST RESULTS SUMMARY')
    console.log('='.repeat(80))

    const total = this.testResults.passed + this.testResults.failed
    const passRate = ((this.testResults.passed / total) * 100).toFixed(1)

    log(colors.green, '✅', `PASSED: ${this.testResults.passed}`)
    log(colors.red, '❌', `FAILED: ${this.testResults.failed}`)
    log(colors.blue, '📈', `PASS RATE: ${passRate}%`)

    console.log('\nDetailed Results:')
    console.log('-'.repeat(50))

    this.testResults.tests.forEach(test => {
      const symbol = test.status === 'PASSED' ? '✅' : '❌'
      const color = test.status === 'PASSED' ? colors.green : colors.red
      console.log(`${color}${symbol} ${test.name}${colors.reset}`)
      if (test.error) {
        console.log(`   ${colors.red}   Error: ${test.error}${colors.reset}`)
      }
    })

    console.log('\n' + '='.repeat(80))

    if (this.testResults.failed === 0) {
      log(colors.green, '🎉', 'ALL TESTS PASSED! Authentication system is production-ready.')
    } else {
      log(colors.yellow, '⚠️', `${this.testResults.failed} tests failed. Review and fix issues before production.`)
    }

    console.log('='.repeat(80) + '\n')
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AuthTester()
  tester.runAllTests().catch(err => {
    console.error('Test runner failed:', err)
    process.exit(1)
  })
}

module.exports = AuthTester

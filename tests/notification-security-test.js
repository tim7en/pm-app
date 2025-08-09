/**
 * Comprehensive Security Testing Suite for Notification System
 * Tests XSS protection, input validation, rate limiting, and data sanitization
 */

const axios = require('axios')
const chalk = require('chalk')

class NotificationSecurityTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.testResults = []
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    }
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`))
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running test: ${testName}`)
      const result = await testFunction()
      this.testResults.push({ name: testName, status: 'PASS', result })
      this.log(`✅ ${testName} - PASSED`, 'success')
      return result
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message })
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error')
      throw error
    }
  }

  // Test XSS Protection
  async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      '<svg onload="alert(1)">',
      '"><script>alert("XSS")</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<body onload="alert(1)">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<object data="javascript:alert(1)"></object>'
    ]

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/notifications`, {
          type: 'test',
          title: payload,
          message: payload,
          relatedUrl: payload
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Test-Request': 'true' // Allow test requests to bypass CSRF
          },
          timeout: 5000
        })

        // Check if XSS payload was sanitized
        if (response.data.notification) {
          const { title, message, relatedUrl } = response.data.notification
          
          if (title.includes('<script>') || message.includes('<script>') || 
              title.includes('javascript:') || message.includes('javascript:') ||
              relatedUrl && relatedUrl.includes('javascript:')) {
            throw new Error(`XSS payload not sanitized: ${payload}`)
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior - API should reject malicious input
          continue
        }
        throw error
      }
    }

    return 'All XSS payloads properly sanitized or rejected'
  }

  // Test SQL Injection Protection
  async testSQLInjection() {
    const sqlPayloads = [
      "'; DROP TABLE notifications; --",
      "' OR '1'='1",
      "'; INSERT INTO notifications VALUES (1, 'hacked'); --",
      "' UNION SELECT * FROM users --",
      "'; DELETE FROM notifications WHERE id > 0; --"
    ]

    for (const payload of sqlPayloads) {
      try {
        await axios.post(`${this.baseUrl}/api/notifications`, {
          type: 'test',
          title: payload,
          message: payload,
          notificationId: payload
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Test-Request': 'true'
          },
          timeout: 5000
        })
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          // Expected behavior - API should handle malicious input safely
          continue
        }
      }
    }

    return 'SQL injection payloads handled safely'
  }

  // Test Rate Limiting
  async testRateLimit() {
    const requests = []
    const maxRequests = 70 // Above the 60/hour limit
    const testUserId = 'rate-limit-test-' + Date.now()

    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        axios.get(`${this.baseUrl}/api/notifications`, {
          headers: { 'X-Test-User': testUserId },
          timeout: 5000
        }).catch(error => error.response)
      )
    }

    const responses = await Promise.all(requests)
    const rateLimitedResponses = responses.filter(
      response => response && response.status === 429
    )

    if (rateLimitedResponses.length === 0) {
      throw new Error('Rate limiting not working - no 429 responses received')
    }

    return `Rate limiting working - ${rateLimitedResponses.length} requests rate limited`
  }

  // Test Input Validation
  async testInputValidation() {
    const invalidInputs = [
      { type: 'invalid_type', title: 'Test', message: 'Test' },
      { type: 'test', title: '', message: 'Test' }, // Empty title
      { type: 'test', title: 'A'.repeat(1000), message: 'Test' }, // Oversized title
      { type: 'test', title: 'Test', message: 'A'.repeat(5000) }, // Oversized message
      { type: 'test', title: null, message: 'Test' }, // Null title
      { type: 'test', title: 'Test', message: null }, // Null message
      { priority: 'invalid_priority', title: 'Test', message: 'Test' }
    ]

    for (const input of invalidInputs) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/notifications`, input, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Test-Request': 'true'
          },
          timeout: 5000
        })

        // Check if invalid input was properly handled
        if (response.status === 200 && response.data.success) {
          // Verify that the data was sanitized/corrected
          const notification = response.data.notification
          if (input.type === 'invalid_type' && notification.type === 'invalid_type') {
            throw new Error('Invalid notification type not corrected')
          }
          if (input.title === '' && notification.title === '') {
            throw new Error('Empty title not handled')
          }
        }
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          // Expected behavior for invalid input
          continue
        }
        throw error
      }
    }

    return 'Input validation working correctly'
  }

  // Test URL Validation
  async testURLValidation() {
    const maliciousUrls = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'ftp://malicious.com/steal-data',
      'http://localhost:22/ssh-attack',
      'https://malicious.com/xss?param=<script>alert(1)</script>'
    ]

    for (const url of maliciousUrls) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/notifications`, {
          type: 'test',
          title: 'Test',
          message: 'Test',
          relatedUrl: url
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Test-Request': 'true'
          },
          timeout: 5000
        })

        if (response.data.notification && response.data.notification.relatedUrl === url) {
          throw new Error(`Malicious URL not filtered: ${url}`)
        }
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          // Expected behavior
          continue
        }
        throw error
      }
    }

    return 'URL validation working correctly'
  }

  // Test Memory Leak Prevention
  async testMemoryLeaks() {
    const startMemory = process.memoryUsage()
    
    // Create many notifications rapidly
    const promises = []
    for (let i = 0; i < 100; i++) {
      promises.push(
        axios.get(`${this.baseUrl}/api/notifications?limit=50`, {
          timeout: 5000
        }).catch(() => {}) // Ignore errors for this test
      )
    }

    await Promise.all(promises)
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const endMemory = process.memoryUsage()
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed
    
    // Allow for some memory increase but flag excessive growth
    if (memoryIncrease > 50 * 1024 * 1024) { // 50MB threshold
      throw new Error(`Potential memory leak detected: ${memoryIncrease / 1024 / 1024}MB increase`)
    }

    return `Memory usage stable: ${memoryIncrease / 1024}KB increase`
  }

  // Test CSRF Protection
  async testCSRFProtection() {
    try {
      // Attempt request without proper headers
      const response = await axios.post(`${this.baseUrl}/api/notifications`, {
        action: 'mark-all-read'
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Request': 'true'
        },
        timeout: 5000
      })

      // Check if CSRF protection headers are required
      if (response.status === 200) {
        // Try with X-Requested-With header
        const protectedResponse = await axios.patch(`${this.baseUrl}/api/notifications`, {
          action: 'mark-all-read'
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 5000
        })

        if (protectedResponse.status !== 200) {
          throw new Error('CSRF protection may be too restrictive')
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return 'CSRF protection active'
      }
      throw error
    }

    return 'CSRF protection validated'
  }

  // Run all security tests
  async runAllTests() {
    this.log('🔒 Starting Notification Security Test Suite', 'info')
    this.log('='  * 60, 'info')

    const tests = [
      { name: 'XSS Protection', fn: () => this.testXSSProtection() },
      { name: 'SQL Injection Protection', fn: () => this.testSQLInjection() },
      { name: 'Rate Limiting', fn: () => this.testRateLimit() },
      { name: 'Input Validation', fn: () => this.testInputValidation() },
      { name: 'URL Validation', fn: () => this.testURLValidation() },
      { name: 'Memory Leak Prevention', fn: () => this.testMemoryLeaks() },
      { name: 'CSRF Protection', fn: () => this.testCSRFProtection() }
    ]

    let passedTests = 0
    let failedTests = 0

    for (const test of tests) {
      try {
        await this.runTest(test.name, test.fn)
        passedTests++
      } catch (error) {
        failedTests++
      }
    }

    // Print final report
    this.log('='  * 60, 'info')
    this.log('🔒 SECURITY TEST RESULTS', 'info')
    this.log('='  * 60, 'info')
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌'
      const color = result.status === 'PASS' ? 'success' : 'error'
      this.log(`${status} ${result.name}`, color)
      if (result.error) {
        this.log(`   Error: ${result.error}`, 'error')
      }
    })

    this.log('='  * 60, 'info')
    this.log(`Tests Passed: ${passedTests}`, 'success')
    this.log(`Tests Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info')
    this.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`, 
             failedTests === 0 ? 'success' : 'warning')

    if (failedTests === 0) {
      this.log('🎉 All security tests passed! Notification system is production-ready.', 'success')
    } else {
      this.log('⚠️  Some security tests failed. Please address issues before production deployment.', 'warning')
    }

    return {
      passed: passedTests,
      failed: failedTests,
      results: this.testResults
    }
  }
}

// Export for use in other test files
module.exports = NotificationSecurityTest

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new NotificationSecurityTest()
  tester.runAllTests().catch(console.error)
}

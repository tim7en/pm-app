#!/usr/bin/env node

/**
 * ⚡ PM-App API Performance & Reliability Test Suite
 * 
 * Comprehensive testing of API performance and reliability:
 * - Response time monitoring
 * - Load testing with concurrent requests
 * - Error handling validation
 * - Rate limiting testing
 * - Database performance under load
 * - Memory leak detection
 * - API endpoint availability
 */

const BASE_URL = 'http://localhost:3000'

// Test configuration
const LOAD_TEST_CONFIG = {
  concurrentUsers: 5,
  requestsPerUser: 10,
  maxResponseTime: 2000, // 2 seconds
  acceptableErrorRate: 5 // 5%
}

// Test user (using correct password from working tests)
const TEST_USER = {
  email: 'test-admin@pmapp-test.com',
  password: 'TestAdmin123!'
}

let authToken = null
let testWorkspace = null

// Performance metrics
const metrics = {
  responseTimes: [],
  errors: [],
  successfulRequests: 0,
  totalRequests: 0,
  startTime: null,
  endTime: null
}

// Utility functions
function logSection(message) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`⚡ ${message}`)
  console.log('='.repeat(60))
}

function logSubsection(message) {
  console.log(`\n📊 ${message}`)
  console.log('-'.repeat(40))
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`)
}

function logSuccess(message) {
  console.log(`✅ ✓ ${message}`)
}

function logWarning(message) {
  console.log(`⚠️  ${message}`)
}

function logError(message) {
  console.log(`❌ ✗ ${message}`)
}

class ApiPerformanceTester {
  constructor() {
    this.results = []
  }

  async makeRequest(endpoint, options = {}) {
    const startTime = Date.now()
    const url = `${BASE_URL}${endpoint}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    if (authToken) {
      defaultOptions.headers['Authorization'] = `Bearer ${authToken}`
    }

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      metrics.totalRequests++
      metrics.responseTimes.push(responseTime)

      if (response.ok) {
        metrics.successfulRequests++
      } else {
        metrics.errors.push({
          endpoint,
          status: response.status,
          responseTime,
          timestamp: new Date().toISOString()
        })
      }

      return { response, responseTime }
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      metrics.totalRequests++
      metrics.errors.push({
        endpoint,
        error: error.message,
        responseTime,
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }

  async runTest(testName, testFunction) {
    logInfo(`Running: ${testName}`)
    try {
      await testFunction()
      this.results.push({ name: testName, status: 'passed', error: null })
      logSuccess(testName)
      return true
    } catch (error) {
      this.results.push({ name: testName, status: 'failed', error: error.message })
      logError(`${testName}: ${error.message}`)
      return false
    }
  }

  // ============= SETUP =============
  async setup() {
    logSubsection('Performance Test Setup')
    
    await this.runTest('Authenticate test user', async () => {
      const { response } = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(TEST_USER)
      })

      if (!response.ok) {
        throw new Error('Authentication failed - ensure test user exists')
      }

      const data = await response.json()
      authToken = data.token
      
      if (data.workspaces && data.workspaces.length > 0) {
        testWorkspace = data.workspaces[0]
      }

      logInfo(`  Authenticated successfully`)
      logInfo(`  Available workspaces: ${data.workspaces?.length || 0}`)
    })
  }

  // ============= RESPONSE TIME TESTS =============
  async testResponseTimes() {
    logSubsection('API Response Time Tests')
    
    const endpoints = [
      { path: '/api/profile', method: 'GET', name: 'User Profile' },
      { path: '/api/workspaces', method: 'GET', name: 'Workspaces List' },
      { path: '/api/projects', method: 'GET', name: 'Projects List' },
      { path: '/api/tasks', method: 'GET', name: 'Tasks List' },
      { path: '/api/notifications', method: 'GET', name: 'Notifications' }
    ]

    for (const endpoint of endpoints) {
      await this.runTest(`Response time test: ${endpoint.name}`, async () => {
        const { response, responseTime } = await this.makeRequest(endpoint.path, {
          method: endpoint.method
        })

        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`)
        }

        if (responseTime > LOAD_TEST_CONFIG.maxResponseTime) {
          throw new Error(`Response time ${responseTime}ms exceeds limit ${LOAD_TEST_CONFIG.maxResponseTime}ms`)
        }

        logInfo(`  Response time: ${responseTime}ms`)
      })
    }
  }

  // ============= LOAD TESTING =============
  async testConcurrentLoad() {
    logSubsection('Concurrent Load Testing')
    
    await this.runTest('Concurrent user simulation', async () => {
      const { concurrentUsers, requestsPerUser } = LOAD_TEST_CONFIG
      const totalRequests = concurrentUsers * requestsPerUser

      logInfo(`  Testing with ${concurrentUsers} concurrent users`)
      logInfo(`  ${requestsPerUser} requests per user`)
      logInfo(`  Total requests: ${totalRequests}`)

      metrics.startTime = Date.now()

      // Create concurrent user simulations
      const userPromises = []
      for (let i = 0; i < concurrentUsers; i++) {
        userPromises.push(this.simulateUser(i, requestsPerUser))
      }

      // Wait for all users to complete
      await Promise.all(userPromises)

      metrics.endTime = Date.now()
      const totalTime = metrics.endTime - metrics.startTime

      logInfo(`  Load test completed in ${totalTime}ms`)
      logInfo(`  Average requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`)
    })
  }

  async simulateUser(userId, requestCount) {
    const userTasks = []
    
    for (let i = 0; i < requestCount; i++) {
      // Simulate realistic user behavior with different endpoints
      const actions = [
        () => this.makeRequest('/api/workspaces'),
        () => this.makeRequest('/api/tasks'),
        () => this.makeRequest('/api/projects'),
        () => this.makeRequest('/api/profile'),
        () => this.makeRequest('/api/notifications')
      ]

      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      userTasks.push(randomAction())
      
      // Small delay between requests to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    }

    return Promise.all(userTasks)
  }

  // ============= ERROR HANDLING TESTS =============
  async testErrorHandling() {
    logSubsection('Error Handling Tests')
    
    // Test 1: Invalid endpoint
    await this.runTest('404 error handling', async () => {
      const { response } = await this.makeRequest('/api/non-existent-endpoint')
      
      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Error response should be JSON')
      }

      logInfo(`  404 error properly handled`)
    })

    // Test 2: Unauthorized access
    await this.runTest('401 unauthorized handling', async () => {
      const tempToken = authToken
      authToken = null // Remove token

      const { response } = await this.makeRequest('/api/tasks')
      
      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`)
      }

      authToken = tempToken // Restore token
      logInfo(`  401 unauthorized properly handled`)
    })

    // Test 3: Invalid data handling
    await this.runTest('400 bad request handling', async () => {
      const { response } = await this.makeRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          title: '',
          projectId: 'invalid-id'
        })
      })

      if (response.status !== 400 && response.status !== 422) {
        throw new Error(`Expected 400/422, got ${response.status}`)
      }

      logInfo(`  Bad request properly handled`)
    })
  }

  // ============= DATABASE PERFORMANCE TESTS =============
  async testDatabasePerformance() {
    logSubsection('Database Performance Tests')
    
    await this.runTest('Large dataset query performance', async () => {
      if (!testWorkspace) {
        logInfo(`  No workspace available - skipping database performance test`)
        return
      }

      const { response, responseTime } = await this.makeRequest(`/api/tasks?workspaceId=${testWorkspace.id}&limit=100`)
      
      if (!response.ok) {
        throw new Error(`Database query failed: ${response.status}`)
      }

      if (responseTime > 5000) { // 5 seconds for large queries
        throw new Error(`Database query too slow: ${responseTime}ms`)
      }

      logInfo(`  Large dataset query time: ${responseTime}ms`)
    })

    await this.runTest('Complex filtering query performance', async () => {
      if (!testWorkspace) {
        logInfo(`  No workspace available - skipping complex query test`)
        return
      }

      const { response, responseTime } = await this.makeRequest(
        `/api/tasks?workspaceId=${testWorkspace.id}&status=TODO&priority=HIGH&search=test`
      )
      
      if (!response.ok) {
        throw new Error(`Complex query failed: ${response.status}`)
      }

      if (responseTime > 3000) { // 3 seconds for complex queries
        throw new Error(`Complex query too slow: ${responseTime}ms`)
      }

      logInfo(`  Complex filtering query time: ${responseTime}ms`)
    })
  }

  // ============= MEMORY AND RESOURCE TESTS =============
  async testResourceUsage() {
    logSubsection('Resource Usage Tests')
    
    await this.runTest('Memory leak detection simulation', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform many requests to check for memory leaks
      for (let i = 0; i < 50; i++) {
        await this.makeRequest('/api/profile')
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024

      logInfo(`  Memory usage change: ${memoryIncreaseMB.toFixed(2)}MB`)
      
      // Alert if memory increased significantly (more than 50MB)
      if (memoryIncreaseMB > 50) {
        logWarning(`  Potential memory leak detected: ${memoryIncreaseMB.toFixed(2)}MB increase`)
      }
    })

    await this.runTest('Connection handling test', async () => {
      // Test many simultaneous connections
      const connectionPromises = []
      for (let i = 0; i < 20; i++) {
        connectionPromises.push(this.makeRequest('/api/profile'))
      }

      const results = await Promise.allSettled(connectionPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      logInfo(`  Simultaneous connections: ${successful} successful, ${failed} failed`)
      
      if (failed > successful * 0.1) { // More than 10% failure rate
        throw new Error(`High connection failure rate: ${failed}/${results.length}`)
      }
    })
  }

  // ============= API RELIABILITY TESTS =============
  async testApiReliability() {
    logSubsection('API Reliability Tests')
    
    await this.runTest('API endpoint availability check', async () => {
      const criticalEndpoints = [
        '/api/profile',
        '/api/workspaces',
        '/api/projects',
        '/api/tasks'
      ]

      const results = []
      for (const endpoint of criticalEndpoints) {
        try {
          const { response } = await this.makeRequest(endpoint)
          results.push({
            endpoint,
            available: response.status < 500,
            status: response.status
          })
        } catch (error) {
          results.push({
            endpoint,
            available: false,
            error: error.message
          })
        }
      }

      const availableCount = results.filter(r => r.available).length
      const availabilityRate = (availableCount / results.length) * 100

      logInfo(`  API availability: ${availabilityRate.toFixed(1)}% (${availableCount}/${results.length})`)

      if (availabilityRate < 95) {
        throw new Error(`Low API availability: ${availabilityRate.toFixed(1)}%`)
      }
    })

    await this.runTest('Error rate validation', async () => {
      const errorRate = (metrics.errors.length / metrics.totalRequests) * 100
      const acceptableRate = LOAD_TEST_CONFIG.acceptableErrorRate

      logInfo(`  Error rate: ${errorRate.toFixed(2)}% (${metrics.errors.length}/${metrics.totalRequests})`)

      if (errorRate > acceptableRate) {
        throw new Error(`Error rate ${errorRate.toFixed(2)}% exceeds acceptable rate ${acceptableRate}%`)
      }
    })
  }

  // ============= MAIN TEST RUNNER =============
  async runAllTests() {
    logSection('🚀 Starting API Performance & Reliability Test Suite')
    
    // Reset metrics
    metrics.responseTimes = []
    metrics.errors = []
    metrics.successfulRequests = 0
    metrics.totalRequests = 0

    try {
      await this.setup()
      await this.testResponseTimes()
      await this.testConcurrentLoad()
      await this.testErrorHandling()
      await this.testDatabasePerformance()
      await this.testResourceUsage()
      await this.testApiReliability()
      
      this.printSummary()
    } catch (error) {
      console.error('💥 Performance test suite failed:', error.message)
    }
  }

  printSummary() {
    logSection('📊 API Performance & Reliability Test Results')
    
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const total = this.results.length
    const successRate = ((passed / total) * 100).toFixed(1)

    // Calculate performance metrics
    const avgResponseTime = metrics.responseTimes.length > 0 
      ? (metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(2)
      : 0
    
    const maxResponseTime = metrics.responseTimes.length > 0 
      ? Math.max(...metrics.responseTimes)
      : 0

    const minResponseTime = metrics.responseTimes.length > 0 
      ? Math.min(...metrics.responseTimes)
      : 0

    const errorRate = metrics.totalRequests > 0 
      ? ((metrics.errors.length / metrics.totalRequests) * 100).toFixed(2)
      : 0

    console.log(`\n📈 Performance Metrics:`)
    console.log(`   Total API Requests: ${metrics.totalRequests}`)
    console.log(`   Successful Requests: ${metrics.successfulRequests}`)
    console.log(`   Failed Requests: ${metrics.errors.length}`)
    console.log(`   Error Rate: ${errorRate}%`)
    console.log(`   Average Response Time: ${avgResponseTime}ms`)
    console.log(`   Min Response Time: ${minResponseTime}ms`)
    console.log(`   Max Response Time: ${maxResponseTime}ms`)

    console.log(`\n🎯 Test Results:`)
    console.log(`   Tests Passed: ${passed}`)
    console.log(`   Tests Failed: ${failed}`)
    console.log(`   Success Rate: ${successRate}%`)

    logSubsection('Test Results by Category')
    this.results.forEach((result, index) => {
      const icon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${index + 1}. ${icon} ${result.name}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    // Performance assessment
    logSubsection('🎯 Performance Assessment')
    
    if (avgResponseTime < 500) {
      logSuccess(`Excellent response times (avg: ${avgResponseTime}ms)`)
    } else if (avgResponseTime < 1000) {
      logWarning(`Good response times (avg: ${avgResponseTime}ms)`)
    } else {
      logError(`Slow response times (avg: ${avgResponseTime}ms) - optimization needed`)
    }

    if (errorRate < 1) {
      logSuccess(`Excellent error rate (${errorRate}%)`)
    } else if (errorRate < 5) {
      logWarning(`Acceptable error rate (${errorRate}%)`)
    } else {
      logError(`High error rate (${errorRate}%) - reliability issues detected`)
    }

    // Recommendations
    if (failed > 0 || avgResponseTime > 1000 || errorRate > 5) {
      logSubsection('🔧 Recommendations')
      if (avgResponseTime > 1000) {
        console.log('• Consider database query optimization')
        console.log('• Implement response caching')
        console.log('• Add database indexes for common queries')
      }
      if (errorRate > 5) {
        console.log('• Review error handling logic')
        console.log('• Improve input validation')
        console.log('• Add retry mechanisms for transient failures')
      }
      if (maxResponseTime > 5000) {
        console.log('• Implement request timeouts')
        console.log('• Add async processing for heavy operations')
      }
    } else {
      logSection('🎉 API Performance & Reliability Excellent!')
      console.log('✅ Response times are optimal')
      console.log('✅ Error rates are minimal')
      console.log('✅ API reliability is high')
      console.log('✅ System is production-ready from performance perspective')
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new ApiPerformanceTester()
  tester.runAllTests()
}

module.exports = ApiPerformanceTester

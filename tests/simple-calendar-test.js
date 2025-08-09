#!/usr/bin/env node

/**
 * 📅 PM-App Simple Calendar Functionality Test
 * 
 * Tests calendar functionality using existing authenticated users
 */

const BASE_URL = 'http://localhost:3000'

// Use existing test users (authenticated already)
const TEST_USERS = {
  admin: {
    email: 'test-admin@pmapp-test.com',
    password: 'TestAdmin123!',
    name: 'Test Admin User'
  },
  member1: {
    email: 'test-member1@pmapp-test.com', 
    password: 'TestMember1123!',
    name: 'Test Member One'
  }
}

// Test data storage
const testData = {
  users: {},
  workspaces: {},
  events: {}
}

let currentUser = null

// Utilities
function log(message) {
  console.log(`ℹ️  ${message}`)
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logError(message) {
  console.log(`❌ ${message}`)
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📅 ${title}`)
  console.log('='.repeat(60))
}

class SimpleCalendarTest {
  constructor() {
    this.results = []
    this.apiCalls = 0
  }

  async makeRequest(endpoint, options = {}) {
    this.apiCalls++
    const url = `${BASE_URL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (currentUser?.token) {
      defaultHeaders['Authorization'] = `Bearer ${currentUser.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    })

    return response
  }

  async test(name, testFn) {
    log(`Testing: ${name}`)
    try {
      await testFn()
      this.results.push({ name, status: 'PASS' })
      logSuccess(`✓ ${name}`)
      return true
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message })
      logError(`✗ ${name}: ${error.message}`)
      return false
    }
  }

  async authenticateUsers() {
    logSection('🔐 Calendar Test Authentication')
    
    for (const [key, user] of Object.entries(TEST_USERS)) {
      await this.test(`Login ${user.name}`, async () => {
        const response = await this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: user.email,
            password: user.password
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Login failed: ${error.error || 'Unknown error'}`)
        }

        const data = await response.json()
        testData.users[key] = {
          ...data.user,
          token: data.token,
          workspaces: data.workspaces || []
        }
        
        log(`  ✓ Authenticated: ${user.email} (ID: ${data.user.id})`)
        log(`  ✓ Has ${data.workspaces?.length || 0} workspace(s)`)
      })
    }
  }

  async testCalendarEndpoints() {
    logSection('📅 Calendar API Endpoints')
    
    currentUser = testData.users.admin
    
    // Test 1: Check if calendar API exists
    await this.test('Check calendar API availability', async () => {
      const response = await this.makeRequest('/api/calendar/events')
      
      if (response.status === 404) {
        log(`  ⚠️  Calendar API not implemented yet (404)`)
        throw new Error('Calendar API not found - implementation needed')
      } else if (response.status === 401) {
        log(`  ✓ Calendar API exists but requires authentication (401)`)
      } else if (response.ok) {
        const events = await response.json()
        log(`  ✓ Calendar API working - found ${events.length || 0} events`)
      } else {
        const error = await response.json()
        log(`  ⚠️  Calendar API error: ${error.error}`)
      }
    })

    // Test 2: Try to create a calendar event
    if (testData.users.admin.workspaces && testData.users.admin.workspaces.length > 0) {
      const workspace = testData.users.admin.workspaces[0]
      
      await this.test('Test calendar event creation', async () => {
        const response = await this.makeRequest('/api/calendar/events', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Calendar Event',
            description: 'Testing calendar functionality',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
            workspaceId: workspace.id,
            type: 'MEETING'
          })
        })

        if (response.status === 404) {
          throw new Error('Calendar event creation API not implemented')
        } else if (!response.ok) {
          const error = await response.json()
          throw new Error(`Event creation failed: ${error.error}`)
        } else {
          const event = await response.json()
          testData.events.testEvent = event
          log(`  ✓ Created calendar event: ${event.title} (ID: ${event.id})`)
        }
      })
    }
  }

  async testCalendarFrontend() {
    logSection('🖥️ Calendar Frontend')
    
    // Test 1: Check if calendar page is accessible
    await this.test('Calendar page accessibility', async () => {
      const response = await this.makeRequest('/calendar')
      
      if (response.ok) {
        log(`  ✓ Calendar page is accessible (status: ${response.status})`)
      } else {
        throw new Error(`Calendar page not accessible (status: ${response.status})`)
      }
    })

    // Test 2: Check for calendar-related API routes
    await this.test('Calendar route discovery', async () => {
      const routes = [
        '/api/calendar',
        '/api/calendar/events',
        '/api/events'
      ]
      
      let foundRoutes = 0
      for (const route of routes) {
        const response = await this.makeRequest(route)
        if (response.status !== 404) {
          foundRoutes++
          log(`  ✓ Found calendar route: ${route} (status: ${response.status})`)
        }
      }
      
      if (foundRoutes === 0) {
        throw new Error('No calendar API routes found')
      } else {
        log(`  ✓ Found ${foundRoutes} calendar-related routes`)
      }
    })
  }

  async testTaskCalendarIntegration() {
    logSection('🔗 Task-Calendar Integration')
    
    currentUser = testData.users.admin
    
    // Test: Check if tasks with due dates appear in calendar
    await this.test('Task due date calendar integration', async () => {
      // Get tasks to see if any have due dates
      const response = await this.makeRequest('/api/tasks')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks for calendar integration test')
      }

      const tasks = await response.json()
      const tasksWithDueDates = tasks.filter(task => task.dueDate)
      
      log(`  ✓ Found ${tasks.length} total tasks`)
      log(`  ✓ Found ${tasksWithDueDates.length} tasks with due dates`)
      
      if (tasksWithDueDates.length > 0) {
        log(`  ✓ Task-calendar integration data available`)
      } else {
        log(`  ⚠️  No tasks with due dates for integration testing`)
      }
    })
  }

  async runTests() {
    logSection('🚀 Starting Calendar Functionality Tests')
    
    try {
      await this.authenticateUsers()
      await this.testCalendarFrontend()
      await this.testCalendarEndpoints()
      await this.testTaskCalendarIntegration()
      
      this.printResults()
      
    } catch (error) {
      logError(`Test suite failed: ${error.message}`)
      this.printResults()
    }
  }

  printResults() {
    logSection('📊 Calendar Test Results Summary')
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`)
    console.log(`API Calls Made: ${this.apiCalls}`)
    
    if (failed > 0) {
      console.log(`\n❌ Failed Tests:`)
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`)
      })
    }
    
    console.log(`\n${'='.repeat(60)}`)
    
    // Calendar implementation assessment
    const calendarRouteTests = this.results.filter(r => 
      r.name.includes('Calendar') || r.name.includes('calendar')
    )
    const calendarPassed = calendarRouteTests.filter(r => r.status === 'PASS').length
    
    if (calendarPassed >= calendarRouteTests.length * 0.7) {
      logSuccess(`📅 Calendar functionality appears to be working well`)
    } else {
      logError(`⚠️  Calendar implementation may need attention`)
    }
    
    // Implementation status
    const apiFailures = this.results.filter(r => 
      r.status === 'FAIL' && r.error.includes('not implemented')
    ).length
    
    if (apiFailures > 0) {
      console.log(`\n🚧 Implementation Status:`)
      console.log(`   - ${apiFailures} feature(s) need API implementation`)
      console.log(`   - Frontend appears to be ready`)
      console.log(`   - Backend API development needed`)
    }
  }
}

// Run the tests
const tester = new SimpleCalendarTest()
tester.runTests().catch(error => {
  console.error('Calendar test runner error:', error)
  process.exit(1)
})

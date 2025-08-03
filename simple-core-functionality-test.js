#!/usr/bin/env node

/**
 * 🔧 PM-App Simple Core Functionality Test Suite
 * 
 * Tests core functionality using existing authenticated users
 */

const BASE_URL = 'http://localhost:3000'

// Use existing test users (should be authenticated already)
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
  },
  member2: {
    email: 'test-member2@pmapp-test.com',
    password: 'TestMember2123!', 
    name: 'Test Member Two'
  }
}

// Test data storage
const testData = {
  users: {},
  workspaces: {},
  projects: {},
  tasks: {}
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
  console.log(`🔍 ${title}`)
  console.log('='.repeat(60))
}

class SimpleCoreTest {
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
    logSection('🔐 User Authentication')
    
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

  async testTaskManagement() {
    logSection('📝 Task Management Core Features')
    
    // Use admin user
    currentUser = testData.users.admin
    
    // Get first available workspace
    if (!currentUser.workspaces || currentUser.workspaces.length === 0) {
      throw new Error('No workspaces available for testing')
    }
    
    const workspace = currentUser.workspaces[0]
    log(`Using workspace: ${workspace.name} (ID: ${workspace.id})`)

    // Test 1: Get workspace projects (using correct API)
    await this.test('Get workspace projects', async () => {
      const response = await this.makeRequest(`/api/projects?workspaceId=${workspace.id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get projects: ${error.error}`)
      }

      const projects = await response.json()
      testData.projects = projects
      log(`  ✓ Found ${projects.length} project(s) in workspace`)
    })

    // Test 2: Create a new task (if we have projects)
    if (testData.projects && testData.projects.length > 0) {
      const project = testData.projects[0]
      
      await this.test('Create new task', async () => {
        const response = await this.makeRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Core Test Task - Simple',
            description: 'Testing task creation in core functionality test',
            projectId: project.id,
            priority: 'MEDIUM',
            status: 'TODO'
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Task creation failed: ${error.error}`)
        }

        const task = await response.json()
        testData.tasks.newTask = task
        log(`  ✓ Created task: ${task.title} (ID: ${task.id})`)
      })

      // Test 3: Get tasks for project (using correct API)
      await this.test('Get project tasks', async () => {
        const response = await this.makeRequest(`/api/tasks?projectId=${project.id}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to get tasks: ${error.error}`)
        }

        const tasks = await response.json()
        log(`  ✓ Found ${tasks.length} task(s) in project`)
      })

      // Test 4: Update task (if we created one)
      if (testData.tasks.newTask) {
        await this.test('Update task', async () => {
          const task = testData.tasks.newTask
          const response = await this.makeRequest(`/api/tasks/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: task.title + ' - UPDATED',
              status: 'IN_PROGRESS'
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Task update failed: ${error.error}`)
          }

          const updatedTask = await response.json()
          log(`  ✓ Updated task status to: ${updatedTask.status}`)
        })
      }
    }
  }

  async testWorkspaceAccess() {
    logSection('🏢 Workspace Access Tests')

    // Test admin access
    currentUser = testData.users.admin
    await this.test('Admin can access workspaces', async () => {
      const response = await this.makeRequest('/api/workspaces')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get workspaces: ${error.error}`)
      }

      const workspaces = await response.json()
      log(`  ✓ Admin can see ${workspaces.length} workspace(s)`)
    })

    // Test member access  
    currentUser = testData.users.member1
    await this.test('Member1 can access workspaces', async () => {
      const response = await this.makeRequest('/api/workspaces')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get workspaces: ${error.error}`)
      }

      const workspaces = await response.json()
      log(`  ✓ Member1 can see ${workspaces.length} workspace(s)`)
    })
  }

  async testUserProfiles() {
    logSection('👤 User Profile Tests')

    for (const [key, user] of Object.entries(testData.users)) {
      currentUser = user
      await this.test(`Get profile for ${TEST_USERS[key].name}`, async () => {
        const response = await this.makeRequest('/api/profile')
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to get profile: ${error.error}`)
        }

        const profile = await response.json()
        log(`  ✓ Profile: ${profile.name} (${profile.email})`)
      })
    }
  }

  async runTests() {
    logSection('🚀 Starting Simple Core Functionality Tests')
    
    try {
      await this.authenticateUsers()
      await this.testUserProfiles()
      await this.testWorkspaceAccess()
      await this.testTaskManagement()
      
      this.printResults()
      
    } catch (error) {
      logError(`Test suite failed: ${error.message}`)
      this.printResults()
    }
  }

  printResults() {
    logSection('📊 Test Results Summary')
    
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
    
    if (failed === 0) {
      logSuccess(`🎉 All tests passed! Core functionality is working.`)
    } else {
      logError(`⚠️  ${failed} test(s) failed. See details above.`)
    }
  }
}

// Run the tests
const tester = new SimpleCoreTest()
tester.runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})

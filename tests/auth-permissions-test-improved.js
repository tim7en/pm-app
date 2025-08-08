#!/usr/bin/env node

/**
 * 🔐 Improved Authentication & Permissions Test Suite
 * 
 * This test suite handles existing users and provides comprehensive testing
 * for multi-user permission scenarios with proper cleanup and recovery.
 * 
 * Run with: node auth-permissions-test-improved.js
 */

const BASE_URL = 'http://localhost:3000'

// Test users configuration
const USERS = {
  admin: {
    name: 'Test Admin User',
    email: 'test-admin@pmapp-test.com',
    password: 'TestAdmin123!',
    role: 'OWNER'
  },
  member1: {
    name: 'Test Member One',
    email: 'test-member1@pmapp-test.com', 
    password: 'TestMember1123!',
    role: 'MEMBER'
  },
  member2: {
    name: 'Test Member Two',
    email: 'test-member2@pmapp-test.com',
    password: 'TestMember2123!',
    role: 'MEMBER'
  }
}

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
}

// Test context storage
const testContext = {
  users: {},
  workspaces: {},
  projects: {},
  tasks: {},
  invitations: {}
}

// Utility functions
function logSuccess(message) {
  console.log(`✅ ${message}`)
  testResults.passed++
}

function logError(message) {
  console.log(`❌ ${message}`)
  testResults.failed++
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`)
}

function logSection(title) {
  console.log(`\\n${'='.repeat(60)}`)
  console.log(`🔍 ${title}`)
  console.log('='.repeat(60))
}

function logSubsection(title) {
  console.log(`\\n📋 ${title}`)
  console.log('-'.repeat(40))
}

class AuthTester {
  constructor() {
    this.currentUser = null
    this.authToken = null
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
      }
    }

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    }

    testResults.total++
    return fetch(url, finalOptions)
  }

  async switchUser(userKey) {
    this.currentUser = userKey
    this.authToken = testContext.users[userKey]?.token || null
    logInfo(`Switched to user: ${USERS[userKey].name} (${userKey})`)
  }

  async runTest(testName, testFunction) {
    try {
      logInfo(`Running: ${testName}`)
      await testFunction()
      logSuccess(`✓ ${testName}`)
      testResults.tests.push({ name: testName, status: 'PASSED' })
    } catch (error) {
      logError(`✗ ${testName}: ${error.message}`)
      testResults.tests.push({ name: testName, status: 'FAILED', error: error.message })
    }
  }

  // ================== SETUP & CLEANUP ==================

  async testSetupUsers() {
    logSubsection('User Setup Tests')
    
    for (const [userKey, userData] of Object.entries(USERS)) {
      await this.runTest(`Setup user: ${userData.name}`, async () => {
        // Try to login first (user might exist)
        let loginResponse = await this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: userData.email,
            password: userData.password
          })
        })

        let userRecord
        if (loginResponse.ok) {
          // User exists, use login data
          const loginData = await loginResponse.json()
          userRecord = {
            ...loginData.user,
            token: loginData.token,
            workspaces: loginData.workspaces || [],
            defaultWorkspaceId: loginData.workspaces?.[0]?.id
          }
          logInfo(`  Existing user logged in: ${userData.email}`)
        } else {
          // User doesn't exist, register
          const registerResponse = await this.makeRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              password: userData.password
            })
          })

          if (!registerResponse.ok) {
            const error = await registerResponse.json()
            throw new Error(`Setup failed: ${error.error}`)
          }

          const registerData = await registerResponse.json()
          userRecord = {
            ...registerData.user,
            token: registerData.token,
            workspaces: registerData.workspaces || [],
            defaultWorkspaceId: registerData.workspaces?.[0]?.id
          }
          logInfo(`  New user registered: ${userData.email}`)
        }

        // Store user data
        testContext.users[userKey] = userRecord
        logInfo(`  User ID: ${userRecord.id}`)
        logInfo(`  Has ${userRecord.workspaces.length} workspace(s)`)
      })
    }
  }

  async testCleanupWorkspaces() {
    logSubsection('Cleanup Existing Test Workspaces')
    
    for (const [userKey, userData] of Object.entries(USERS)) {
      await this.switchUser(userKey)
      await this.runTest(`Cleanup workspaces for ${userData.name}`, async () => {
        // Get user's workspaces
        const response = await this.makeRequest('/api/workspaces')
        if (!response.ok) {
          logInfo(`  No accessible workspaces to clean`)
          return
        }

        const workspaces = await response.json()
        const testWorkspaces = workspaces.filter(ws => 
          ws.name.includes('Test') || 
          ws.name.includes('Shared') || 
          ws.name.includes('Personal')
        )

        for (const workspace of testWorkspaces) {
          try {
            const deleteResponse = await this.makeRequest(`/api/workspaces/${workspace.id}`, {
              method: 'DELETE'
            })
            if (deleteResponse.ok) {
              logInfo(`  Cleaned workspace: ${workspace.name}`)
            }
          } catch (error) {
            logInfo(`  Could not clean workspace ${workspace.name}: ${error.message}`)
          }
        }
      })
    }
  }

  // ================== WORKSPACE MANAGEMENT TESTS ==================

  async testWorkspaceCreation() {
    logSubsection('Workspace Creation Tests')
    
    // Admin creates shared workspace
    await this.switchUser('admin')
    await this.runTest('Admin creates shared test workspace', async () => {
      const response = await this.makeRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Shared Team Workspace',
          description: 'Test workspace for permission validation'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Workspace creation failed: ${error.error}`)
      }

      const workspace = await response.json()
      testContext.workspaces.shared = workspace
      logInfo(`  Shared Workspace ID: ${workspace.id}`)
    })

    // Member2 creates their own workspace
    await this.switchUser('member2')
    await this.runTest('Member2 creates personal test workspace', async () => {
      const response = await this.makeRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member2 Personal Workspace',
          description: 'Test personal workspace for Member2'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Workspace creation failed: ${error.error}`)
      }

      const workspace = await response.json()
      testContext.workspaces.member2Personal = workspace
      logInfo(`  Member2 Workspace ID: ${workspace.id}`)
    })
  }

  async testWorkspaceInvitations() {
    logSubsection('Workspace Invitation Tests')
    
    // Admin invites members to shared workspace
    await this.switchUser('admin')
    
    const inviteUsers = ['member1', 'member2']
    for (const userKey of inviteUsers) {
      await this.runTest(`Admin invites ${USERS[userKey].name} to shared workspace`, async () => {
        const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.shared.id}/members`, {
          method: 'POST',
          body: JSON.stringify({
            email: USERS[userKey].email,
            role: 'MEMBER'
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Invitation failed: ${error.error}`)
        }

        const invitation = await response.json()
        if (!testContext.invitations.toShared) {
          testContext.invitations.toShared = []
        }
        testContext.invitations.toShared.push({
          ...invitation,
          userKey,
          email: USERS[userKey].email
        })
        logInfo(`  Invitation sent to ${USERS[userKey].email}`)
      })
    }

    // Member2 invites Member1 to their workspace
    await this.switchUser('member2')
    await this.runTest('Member2 invites Member1 to personal workspace', async () => {
      const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.member2Personal.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          email: USERS.member1.email,
          role: 'MEMBER'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Invitation failed: ${error.error}`)
      }

      const invitation = await response.json()
      testContext.invitations.toMember2Personal = invitation
      logInfo(`  Member1 invited to Member2's workspace`)
    })
  }

  async testInvitationAcceptance() {
    logSubsection('Invitation Acceptance Tests')
    
    // Give invitations time to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const usersToCheck = ['member1', 'member2']
    
    for (const userKey of usersToCheck) {
      await this.switchUser(userKey)
      
      await this.runTest(`Accept invitations for ${USERS[userKey].name}`, async () => {
        const response = await this.makeRequest('/api/invitations')
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to get invitations: ${error.error}`)
        }

        const invitations = await response.json()
        logInfo(`  ${USERS[userKey].name} has ${invitations.length} pending invitations`)
        
        // Accept all test-related invitations
        const testInvitations = invitations.filter(inv => 
          inv.workspace?.name?.includes('Test')
        )
        
        for (const invitation of testInvitations) {
          const acceptResponse = await this.makeRequest(`/api/invitations/${invitation.id}/accept`, {
            method: 'POST'
          })

          if (acceptResponse.ok) {
            logInfo(`    ✓ Accepted invitation to: ${invitation.workspace.name}`)
          } else {
            const error = await acceptResponse.json()
            logInfo(`    ✗ Failed to accept invitation: ${error.error}`)
          }
        }
      })
    }
  }

  // ================== PROJECT MANAGEMENT TESTS ==================

  async testProjectCreation() {
    logSubsection('Project Creation Tests')
    
    // Admin creates project in shared workspace
    await this.switchUser('admin')
    await this.runTest('Admin creates project in shared workspace', async () => {
      const response = await this.makeRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Shared Team Project',
          description: 'Test project for permission validation',
          workspaceId: testContext.workspaces.shared.id,
          color: '#10b981'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Project creation failed: ${error.error}`)
      }

      const project = await response.json()
      testContext.projects.sharedTeam = project
      logInfo(`  Shared Project ID: ${project.id}`)
    })

    // Member2 creates project in their personal workspace
    await this.switchUser('member2')
    await this.runTest('Member2 creates project in personal workspace', async () => {
      const response = await this.makeRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member2 Personal Project',
          description: 'Test personal project for Member2',
          workspaceId: testContext.workspaces.member2Personal.id,
          color: '#f59e0b'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Project creation failed: ${error.error}`)
      }

      const project = await response.json()
      testContext.projects.member2Personal = project
      logInfo(`  Member2 Project ID: ${project.id}`)
    })
  }

  // ================== PERMISSION VALIDATION TESTS ==================

  async testBasicPermissions() {
    logSubsection('Basic Permission Validation Tests')
    
    // Test workspace access
    await this.switchUser('admin')
    await this.runTest('Admin can access owned workspace', async () => {
      const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.shared.id}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Admin should have access: ${error.error}`)
      }
      logInfo(`  ✓ Admin workspace access confirmed`)
    })

    // Test unauthorized access
    await this.switchUser('admin')
    await this.runTest('Admin cannot access Member2 personal workspace', async () => {
      const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.member2Personal.id}`)
      if (response.ok) {
        throw new Error(`Admin should NOT have access to Member2's workspace`)
      }
      logInfo(`  ✓ Unauthorized access properly denied`)
    })

    // Test project access after workspace membership
    await this.switchUser('member1')
    await this.runTest('Member1 can access shared workspace after invitation', async () => {
      // First check if member1 can see the shared workspace
      const workspacesResponse = await this.makeRequest('/api/workspaces')
      if (!workspacesResponse.ok) {
        throw new Error('Failed to get workspaces')
      }
      
      const workspaces = await workspacesResponse.json()
      const sharedWorkspace = workspaces.find(ws => ws.id === testContext.workspaces.shared.id)
      
      if (!sharedWorkspace) {
        throw new Error('Member1 should have access to shared workspace after invitation')
      }
      
      logInfo(`  ✓ Member1 can see shared workspace: ${sharedWorkspace.name}`)
    })
  }

  // ================== MAIN TEST RUNNER ==================

  async runAllTests() {
    logSection('🚀 Starting Improved Authentication & Permissions Test Suite')
    
    try {
      // Setup phase
      await this.testSetupUsers()
      await this.testCleanupWorkspaces()
      
      // Core functionality tests
      await this.testWorkspaceCreation()
      await this.testWorkspaceInvitations()
      await this.testInvitationAcceptance()
      
      // Project tests
      await this.testProjectCreation()
      
      // Permission validation
      await this.testBasicPermissions()
      
    } catch (error) {
      logError(`Critical test failure: ${error.message}`)
    }

    this.printTestSummary()
  }

  printTestSummary() {
    logSection('📊 Test Results Summary')
    
    const totalTests = testResults.passed + testResults.failed
    console.log(`Total API Calls: ${testResults.total}`)
    console.log(`Tests Passed: ${testResults.passed}`)
    console.log(`Tests Failed: ${testResults.failed}`)
    console.log(`Success Rate: ${totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0}%`)
    
    console.log(`\\n📋 Test Results by Category:`)
    console.log('='.repeat(60))
    
    testResults.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${test.name}`)
      if (test.error) {
        console.log(`   Error: ${test.error}`)
      }
    })

    logSection('🎯 Test Context Summary')
    console.log('Test Users:')
    Object.entries(testContext.users).forEach(([key, user]) => {
      console.log(`  - ${USERS[key].name} (${key}): ${user.id}`)
      console.log(`    Email: ${USERS[key].email}`)
      console.log(`    Workspaces: ${user.workspaces.length}`)
    })
    
    if (Object.keys(testContext.workspaces).length > 0) {
      console.log('\\nTest Workspaces:')
      Object.entries(testContext.workspaces).forEach(([key, workspace]) => {
        console.log(`  - ${workspace.name} (${key}): ${workspace.id}`)
      })
    }
    
    if (Object.keys(testContext.projects).length > 0) {
      console.log('\\nTest Projects:')
      Object.entries(testContext.projects).forEach(([key, project]) => {
        console.log(`  - ${project.name} (${key}): ${project.id}`)
      })
    }

    const passRate = totalTests > 0 ? (testResults.passed / totalTests) * 100 : 0
    if (passRate >= 80) {
      logSection('🎉 Test Suite Completed Successfully!')
      console.log('✅ Authentication system is working correctly')
      console.log('✅ Basic permission validation is functioning')
      console.log('✅ User management and workspace creation works')
    } else if (passRate >= 50) {
      logSection('⚠️  Partial Success')
      console.log('✅ Core authentication is working')
      console.log('⚠️  Some permission features need attention')
    } else {
      logSection('❌ Significant Issues Found')
      console.log('❌ Multiple system components need debugging')
      console.log('Please review the failed tests and fix underlying issues')
    }
  }
}

// ================== MAIN EXECUTION ==================

async function main() {
  console.log('🔐 PM-App Improved Authentication & Permissions Test Suite')
  console.log('=' .repeat(60))
  console.log('Testing multi-user scenarios with proper cleanup and recovery...')
  console.log('')

  const tester = new AuthTester()
  await tester.runAllTests()
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the tests
main().catch(error => {
  console.error('💥 Test suite execution failed:', error)
  process.exit(1)
})

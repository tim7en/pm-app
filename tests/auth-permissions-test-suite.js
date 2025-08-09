#!/usr/bin/env node

/**
 * 🔐 Comprehensive Authentication & Permissions Test Suite
 * 
 * This test suite creates multiple users, workspaces, and tests complex permission scenarios:
 * 
 * Test Scenario:
 * 1. Create 3 users: AdminUser (workspace owner), Member1, Member2
 * 2. AdminUser creates a workspace and invites Member1 and Member2
 * 3. Member2 creates their own workspace and invites Member1
 * 4. Test all permission conditions for tasks, projects, and workspaces
 * 5. Record all performed tests and results
 * 
 * Run with: node auth-permissions-test-suite.js
 */

const BASE_URL = 'http://localhost:3000'

// Test users configuration
const USERS = {
  admin: {
    name: 'Admin User',
    email: 'admin@pmapp-test.com',
    password: 'AdminPass123!',
    role: 'OWNER'
  },
  member1: {
    name: 'Member One',
    email: 'member1@pmapp-test.com', 
    password: 'Member1Pass123!',
    role: 'MEMBER'
  },
  member2: {
    name: 'Member Two',
    email: 'member2@pmapp-test.com',
    password: 'Member2Pass123!',
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

// Test context storage
const testContext = {
  users: {},
  workspaces: {},
  projects: {},
  tasks: {},
  invitations: {}
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

  // ================== USER MANAGEMENT TESTS ==================

  async testUserRegistration() {
    logSubsection('User Registration Tests')
    
    for (const [userKey, userData] of Object.entries(USERS)) {
      await this.runTest(`Register ${userData.name}`, async () => {
        const response = await this.makeRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Registration failed: ${error.error}`)
        }

        const data = await response.json()
        
        if (!data.user || !data.token || !data.workspaces) {
          throw new Error('Registration response missing required fields')
        }

        // Store user data for later tests
        testContext.users[userKey] = {
          ...data.user,
          token: data.token,
          workspaces: data.workspaces,
          defaultWorkspaceId: data.workspaces[0]?.id
        }

        logInfo(`  User ID: ${data.user.id}`)
        logInfo(`  Default Workspace: ${data.workspaces[0]?.name}`)
      })
    }
  }

  async testUserLogin() {
    logSubsection('User Login Tests')
    
    for (const [userKey, userData] of Object.entries(USERS)) {
      await this.runTest(`Login ${userData.name}`, async () => {
        const response = await this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: userData.email,
            password: userData.password
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Login failed: ${error.error}`)
        }

        const data = await response.json()
        
        if (!data.user || !data.token) {
          throw new Error('Login response missing required fields')
        }

        // Update stored token
        testContext.users[userKey].token = data.token
        logInfo(`  Updated token for ${userData.name}`)
      })
    }
  }

  // ================== WORKSPACE MANAGEMENT TESTS ==================

  async testWorkspaceCreation() {
    logSubsection('Workspace Creation Tests')
    
    // Admin creates shared workspace
    await this.switchUser('admin')
    await this.runTest('Admin creates shared workspace', async () => {
      const response = await this.makeRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Shared Team Workspace',
          description: 'Workspace for testing multi-user permissions'
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
    await this.runTest('Member2 creates personal workspace', async () => {
      const response = await this.makeRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Member2 Personal Workspace',
          description: 'Personal workspace for Member2'
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
        const response = await this.makeRequest('/api/workspaces/invitations', {
          method: 'POST',
          body: JSON.stringify({
            workspaceId: testContext.workspaces.shared.id,
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
      const response = await this.makeRequest('/api/workspaces/invitations', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: testContext.workspaces.member2Personal.id,
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
    
    // Get pending invitations for each user
    const usersToCheck = ['member1', 'member2']
    
    for (const userKey of usersToCheck) {
      await this.switchUser(userKey)
      
      await this.runTest(`Get pending invitations for ${USERS[userKey].name}`, async () => {
        const response = await this.makeRequest('/api/workspaces/invitations/pending')
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to get invitations: ${error.error}`)
        }

        const invitations = await response.json()
        logInfo(`  ${USERS[userKey].name} has ${invitations.length} pending invitations`)
        
        // Accept all invitations
        for (const invitation of invitations) {
          await this.runTest(`${USERS[userKey].name} accepts invitation to ${invitation.workspace.name}`, async () => {
            const acceptResponse = await this.makeRequest(`/api/workspaces/invitations/${invitation.id}/accept`, {
              method: 'POST'
            })

            if (!acceptResponse.ok) {
              const error = await acceptResponse.json()
              throw new Error(`Failed to accept invitation: ${error.error}`)
            }

            logInfo(`    Joined workspace: ${invitation.workspace.name}`)
          })
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
          name: 'Shared Team Project',
          description: 'Project for testing permissions across team members',
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
          name: 'Member2 Personal Project',
          description: 'Personal project for Member2',
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

  async testProjectMemberManagement() {
    logSubsection('Project Member Management Tests')
    
    // Admin adds members to shared project
    await this.switchUser('admin')
    
    const projectMembers = [
      { userKey: 'member1', role: 'MEMBER' },
      { userKey: 'member2', role: 'MANAGER' }
    ]

    for (const { userKey, role } of projectMembers) {
      await this.runTest(`Admin adds ${USERS[userKey].name} as ${role} to shared project`, async () => {
        const response = await this.makeRequest('/api/projects/members', {
          method: 'POST',
          body: JSON.stringify({
            projectId: testContext.projects.sharedTeam.id,
            userId: testContext.users[userKey].id,
            role: role
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to add project member: ${error.error}`)
        }

        logInfo(`  ${USERS[userKey].name} added as ${role}`)
      })
    }

    // Member2 adds Member1 to their personal project
    await this.switchUser('member2')
    await this.runTest('Member2 adds Member1 to personal project', async () => {
      const response = await this.makeRequest('/api/projects/members', {
        method: 'POST',
        body: JSON.stringify({
          projectId: testContext.projects.member2Personal.id,
          userId: testContext.users.member1.id,
          role: 'VIEWER'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to add project member: ${error.error}`)
      }

      logInfo(`  Member1 added as VIEWER to Member2's project`)
    })
  }

  // ================== TASK MANAGEMENT TESTS ==================

  async testTaskCreation() {
    logSubsection('Task Creation Tests')
    
    // Admin creates tasks in shared project
    await this.switchUser('admin')
    const adminTasks = [
      {
        title: 'Admin Task 1 - Setup Project Structure',
        description: 'Initial project setup and configuration',
        priority: 'HIGH',
        assigneeKey: 'member1'
      },
      {
        title: 'Admin Task 2 - Design Review',
        description: 'Review and approve design specifications',
        priority: 'MEDIUM',
        assigneeKey: 'member2'
      }
    ]

    for (const taskData of adminTasks) {
      await this.runTest(`Admin creates task: ${taskData.title}`, async () => {
        const response = await this.makeRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            projectId: testContext.projects.sharedTeam.id,
            assigneeId: testContext.users[taskData.assigneeKey].id
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Task creation failed: ${error.error}`)
        }

        const task = await response.json()
        if (!testContext.tasks.shared) {
          testContext.tasks.shared = []
        }
        testContext.tasks.shared.push(task)
        logInfo(`  Task created and assigned to ${USERS[taskData.assigneeKey].name}`)
      })
    }

    // Member2 creates task in their personal project
    await this.switchUser('member2')
    await this.runTest('Member2 creates task in personal project', async () => {
      const response = await this.makeRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Member2 Personal Task',
          description: 'Personal task for Member2 project',
          priority: 'LOW',
          projectId: testContext.projects.member2Personal.id,
          assigneeId: testContext.users.member1.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Task creation failed: ${error.error}`)
      }

      const task = await response.json()
      testContext.tasks.member2Personal = task
      logInfo(`  Personal task created and assigned to Member1`)
    })
  }

  // ================== PERMISSION TESTS ==================

  async testWorkspacePermissions() {
    logSubsection('Workspace Permission Tests')
    
    // Test workspace access permissions
    const permissionTests = [
      {
        user: 'admin',
        workspace: 'shared',
        shouldAccess: true,
        description: 'Admin accessing owned workspace'
      },
      {
        user: 'member1',
        workspace: 'shared',
        shouldAccess: true,
        description: 'Member1 accessing shared workspace (invited)'
      },
      {
        user: 'member1',
        workspace: 'member2Personal',
        shouldAccess: true,
        description: 'Member1 accessing Member2 workspace (invited)'
      },
      {
        user: 'admin',
        workspace: 'member2Personal',
        shouldAccess: false,
        description: 'Admin accessing Member2 workspace (not invited)'
      }
    ]

    for (const test of permissionTests) {
      await this.switchUser(test.user)
      await this.runTest(`Permission test: ${test.description}`, async () => {
        const workspaceId = testContext.workspaces[test.workspace].id
        const response = await this.makeRequest(`/api/workspaces/${workspaceId}`)

        if (test.shouldAccess) {
          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Should have access but failed: ${error.error}`)
          }
          logInfo(`  ✓ Access granted as expected`)
        } else {
          if (response.ok) {
            throw new Error(`Should NOT have access but succeeded`)
          }
          logInfo(`  ✓ Access denied as expected`)
        }
      })
    }
  }

  async testProjectPermissions() {
    logSubsection('Project Permission Tests')
    
    const permissionTests = [
      {
        user: 'admin',
        project: 'sharedTeam',
        action: 'GET',
        shouldAccess: true,
        description: 'Admin accessing owned project'
      },
      {
        user: 'member1',
        project: 'sharedTeam',
        action: 'GET',
        shouldAccess: true,
        description: 'Member1 accessing shared project (member)'
      },
      {
        user: 'member2',
        project: 'sharedTeam',
        action: 'PUT',
        shouldAccess: true,
        description: 'Member2 updating shared project (manager role)'
      },
      {
        user: 'member1',
        project: 'member2Personal',
        action: 'GET',
        shouldAccess: true,
        description: 'Member1 viewing Member2 project (viewer role)'
      },
      {
        user: 'member1',
        project: 'member2Personal',
        action: 'PUT',
        shouldAccess: false,
        description: 'Member1 updating Member2 project (viewer role - should fail)'
      },
      {
        user: 'admin',
        project: 'member2Personal',
        action: 'GET',
        shouldAccess: false,
        description: 'Admin accessing Member2 project (not invited)'
      }
    ]

    for (const test of permissionTests) {
      await this.switchUser(test.user)
      await this.runTest(`Permission test: ${test.description}`, async () => {
        const projectId = testContext.projects[test.project].id
        let response

        if (test.action === 'GET') {
          response = await this.makeRequest(`/api/projects/${projectId}`)
        } else if (test.action === 'PUT') {
          response = await this.makeRequest(`/api/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: `Updated ${test.project} Project`,
              description: 'Updated description'
            })
          })
        }

        if (test.shouldAccess) {
          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Should have access but failed: ${error.error}`)
          }
          logInfo(`  ✓ ${test.action} access granted as expected`)
        } else {
          if (response.ok) {
            throw new Error(`Should NOT have ${test.action} access but succeeded`)
          }
          logInfo(`  ✓ ${test.action} access denied as expected`)
        }
      })
    }
  }

  async testTaskPermissions() {
    logSubsection('Task Permission Tests')
    
    const taskTests = [
      {
        user: 'member1',
        task: 'shared',
        taskIndex: 0,
        action: 'GET',
        shouldAccess: true,
        description: 'Member1 viewing assigned task'
      },
      {
        user: 'member1',
        task: 'shared',
        taskIndex: 0,
        action: 'PUT',
        shouldAccess: true,
        description: 'Member1 updating assigned task'
      },
      {
        user: 'member1',
        task: 'shared',
        taskIndex: 1,
        action: 'GET',
        shouldAccess: true,
        description: 'Member1 viewing other task in same project'
      },
      {
        user: 'member1',
        task: 'member2Personal',
        taskIndex: null,
        action: 'GET',
        shouldAccess: true,
        description: 'Member1 viewing task in Member2 project (viewer)'
      },
      {
        user: 'member1',
        task: 'member2Personal',
        taskIndex: null,
        action: 'PUT',
        shouldAccess: false,
        description: 'Member1 updating task in Member2 project (viewer - should fail)'
      }
    ]

    for (const test of taskTests) {
      await this.switchUser(test.user)
      await this.runTest(`Task permission: ${test.description}`, async () => {
        let taskId
        if (test.task === 'shared' && test.taskIndex !== null) {
          taskId = testContext.tasks.shared[test.taskIndex].id
        } else if (test.task === 'member2Personal') {
          taskId = testContext.tasks.member2Personal.id
        }

        let response
        if (test.action === 'GET') {
          response = await this.makeRequest(`/api/tasks/${taskId}`)
        } else if (test.action === 'PUT') {
          response = await this.makeRequest(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: 'Updated Task Title',
              status: 'IN_PROGRESS'
            })
          })
        }

        if (test.shouldAccess) {
          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Should have access but failed: ${error.error}`)
          }
          logInfo(`  ✓ ${test.action} access granted as expected`)
        } else {
          if (response.ok) {
            throw new Error(`Should NOT have ${test.action} access but succeeded`)
          }
          logInfo(`  ✓ ${test.action} access denied as expected`)
        }
      })
    }
  }

  // ================== CLEANUP TESTS ==================

  async testCleanup() {
    logSubsection('Cleanup and Verification Tests')
    
    // Test data deletion permissions
    await this.switchUser('admin')
    await this.runTest('Admin deletes shared workspace', async () => {
      const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.shared.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Workspace deletion failed: ${error.error}`)
      }
      logInfo(`  Shared workspace deleted successfully`)
    })

    await this.switchUser('member2')
    await this.runTest('Member2 deletes personal workspace', async () => {
      const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.member2Personal.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Workspace deletion failed: ${error.error}`)
      }
      logInfo(`  Member2 personal workspace deleted successfully`)
    })
  }

  // ================== MAIN TEST RUNNER ==================

  async runAllTests() {
    logSection('🚀 Starting Comprehensive Authentication & Permissions Test Suite')
    
    try {
      // Core authentication tests
      await this.testUserRegistration()
      await this.testUserLogin()
      
      // Workspace management tests
      await this.testWorkspaceCreation()
      await this.testWorkspaceInvitations()
      await this.testInvitationAcceptance()
      
      // Project management tests
      await this.testProjectCreation()
      await this.testProjectMemberManagement()
      
      // Task management tests
      await this.testTaskCreation()
      
      // Permission validation tests
      await this.testWorkspacePermissions()
      await this.testProjectPermissions()
      await this.testTaskPermissions()
      
      // Cleanup tests
      await this.testCleanup()
      
    } catch (error) {
      logError(`Critical test failure: ${error.message}`)
    }

    this.printTestSummary()
  }

  printTestSummary() {
    logSection('📊 Test Results Summary')
    
    console.log(`Total API Calls: ${testResults.total}`)
    console.log(`Tests Passed: ${testResults.passed}`)
    console.log(`Tests Failed: ${testResults.failed}`)
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
    
    console.log(`\\n📋 Detailed Test Results:`)
    console.log('='.repeat(60))
    
    testResults.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${test.name}`)
      if (test.error) {
        console.log(`   Error: ${test.error}`)
      }
    })

    logSection('🎯 Test Context Summary')
    console.log('Created Users:')
    Object.entries(testContext.users).forEach(([key, user]) => {
      console.log(`  - ${USERS[key].name} (${key}): ${user.id}`)
    })
    
    console.log('\\nCreated Workspaces:')
    Object.entries(testContext.workspaces).forEach(([key, workspace]) => {
      console.log(`  - ${workspace.name} (${key}): ${workspace.id}`)
    })
    
    console.log('\\nCreated Projects:')
    Object.entries(testContext.projects).forEach(([key, project]) => {
      console.log(`  - ${project.name} (${key}): ${project.id}`)
    })

    if (testResults.failed === 0) {
      logSection('🎉 All Tests Passed Successfully!')
      console.log('✅ Authentication system is working correctly')
      console.log('✅ Permission system is properly enforced')
      console.log('✅ Multi-user scenarios are handled properly')
      console.log('✅ Workspace and project access controls are functioning')
    } else {
      logSection('⚠️  Some Tests Failed')
      console.log('Please review the failed tests and fix the underlying issues.')
    }
  }
}

// ================== MAIN EXECUTION ==================

async function main() {
  console.log('🔐 PM-App Authentication & Permissions Test Suite')
  console.log('=' .repeat(60))
  console.log('Testing comprehensive multi-user permission scenarios...')
  console.log('')
  console.log('Test Scenario Overview:')
  console.log('1. Create 3 users with different roles')
  console.log('2. Create multiple workspaces')
  console.log('3. Cross-invite users between workspaces')
  console.log('4. Create projects and add members with different roles')
  console.log('5. Create tasks and test permission boundaries')
  console.log('6. Verify all permission constraints are enforced')
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

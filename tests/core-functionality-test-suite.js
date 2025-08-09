#!/usr/bin/env node

/**
 * 🔧 PM-App Core Functionality Test Suite
 * 
 * Comprehensive testing of core app functionality:
 * - Task Management (CRUD operations)
 * - Project Management 
 * - Workspace Operations
 * - Permission Boundaries
 * - File Attachments
 * - Comments and Subtasks
 */

const BASE_URL = 'http://localhost:3000'

// Test users (using existing authenticated users)
const USERS = {
  admin: {
    name: 'Test Admin User',
    email: 'test-admin@pmapp-test.com',
    password: 'TestAdmin123!'
  },
  member1: {
    name: 'Test Member One',
    email: 'test-member1@pmapp-test.com',
    password: 'TestMember1123!'
  },
  member2: {
    name: 'Test Member Two',
    email: 'test-member2@pmapp-test.com',
    password: 'TestMember2123!'
  }
}

// Test context to store created resources
const testContext = {
  users: {},
  workspaces: {},
  projects: {},
  tasks: {},
  comments: {},
  attachments: {}
}

// Current session info
let currentUser = null

// Utility functions
function logSection(message) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 ${message}`)
  console.log('='.repeat(60))
}

function logSubsection(message) {
  console.log(`\n📋 ${message}`)
  console.log('-'.repeat(40))
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`)
}

function logSuccess(message) {
  console.log(`✅ ✓ ${message}`)
}

function logError(message) {
  console.log(`❌ ✗ ${message}`)
}

class CoreFunctionalityTester {
  constructor() {
    this.results = []
    this.apiCalls = 0
  }

  async makeRequest(endpoint, options = {}) {
    this.apiCalls++
    const url = `${BASE_URL}${endpoint}`
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    if (currentUser?.token) {
      defaultOptions.headers['Authorization'] = `Bearer ${currentUser.token}`
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    })

    return response
  }

  async switchUser(userKey) {
    const userData = USERS[userKey]
    currentUser = testContext.users[userKey]
    logInfo(`Switched to user: ${userData.name} (${userKey})`)
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

  // ============= SETUP TESTS =============
  async setupUsers() {
    logSubsection('User Authentication Setup')
    
    for (const [userKey, userData] of Object.entries(USERS)) {
      await this.runTest(`Setup user: ${userData.name}`, async () => {
        // Try to login (users should exist from previous tests)
        const loginResponse = await this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: userData.email,
            password: userData.password
          })
        })

        if (!loginResponse.ok) {
          throw new Error('User login failed - run auth tests first')
        }

        const loginData = await loginResponse.json()
        testContext.users[userKey] = {
          ...loginData.user,
          token: loginData.token,
          workspaces: loginData.workspaces || []
        }
        
        logInfo(`  User authenticated: ${userData.email}`)
        logInfo(`  User ID: ${testContext.users[userKey].id}`)
        logInfo(`  Available workspaces: ${testContext.users[userKey].workspaces.length}`)
      })
    }
  }

  // ============= WORKSPACE TESTS =============
  async testWorkspaceOperations() {
    logSubsection('Workspace Operations Tests')
    
    await this.switchUser('admin')
    
    // Test 1: Create workspace
    await this.runTest('Admin creates test workspace for core functionality', async () => {
      const response = await this.makeRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Core Functionality Test Workspace',
          description: 'Workspace for testing core PM-App functionality'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Workspace creation failed: ${error.error}`)
      }

      const workspace = await response.json()
      testContext.workspaces.coreTest = workspace
      logInfo(`  Workspace created: ${workspace.name} (ID: ${workspace.id})`)
    })

    // Test 2: Invite users to workspace
    const inviteUsers = ['member1', 'member2']
    for (const userKey of inviteUsers) {
      await this.runTest(`Invite ${USERS[userKey].name} to test workspace`, async () => {
        const response = await this.makeRequest(`/api/workspaces/${testContext.workspaces.coreTest.id}/members`, {
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

        logInfo(`  Invitation sent to ${USERS[userKey].email}`)
      })
    }

    // Test 3: Accept invitations
    for (const userKey of inviteUsers) {
      await this.switchUser(userKey)
      await this.runTest(`${USERS[userKey].name} accepts workspace invitation`, async () => {
        // Get pending invitations
        const invitationsResponse = await this.makeRequest('/api/invitations')
        if (!invitationsResponse.ok) {
          throw new Error('Failed to get invitations')
        }

        const invitations = await invitationsResponse.json()
        const testInvitation = invitations.find(inv => 
          inv.workspace.name === 'Core Functionality Test Workspace'
        )

        if (!testInvitation) {
          throw new Error('Test workspace invitation not found')
        }

        // Accept invitation
        const acceptResponse = await this.makeRequest(`/api/invitations/${testInvitation.id}/accept`, {
          method: 'POST'
        })

        if (!acceptResponse.ok) {
          const error = await acceptResponse.json()
          throw new Error(`Failed to accept invitation: ${error.error}`)
        }

        logInfo(`  ${USERS[userKey].name} joined workspace successfully`)
      })
    }
  }

  // ============= PROJECT TESTS =============
  async testProjectOperations() {
    logSubsection('Project Operations Tests')
    
    await this.switchUser('admin')

    // Test 1: Create projects
    const projectsToCreate = [
      { name: 'Core Test Project Alpha', description: 'First test project for core functionality' },
      { name: 'Core Test Project Beta', description: 'Second test project for collaboration testing' }
    ]

    for (const [index, projectData] of projectsToCreate.entries()) {
      await this.runTest(`Create project: ${projectData.name}`, async () => {
        const response = await this.makeRequest('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            ...projectData,
            workspaceId: testContext.workspaces.coreTest.id,
            color: index === 0 ? '#3b82f6' : '#10b981'
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Project creation failed: ${error.error}`)
        }

        const project = await response.json()
        const projectKey = index === 0 ? 'alpha' : 'beta'
        testContext.projects[projectKey] = project
        logInfo(`  Project created: ${project.name} (ID: ${project.id})`)
      })
    }

    // Test 2: Add members to projects
    await this.runTest('Add Member1 to Alpha project', async () => {
      const response = await this.makeRequest(`/api/projects/${testContext.projects.alpha.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          email: USERS.member1.email,
          role: 'MEMBER'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Adding project member failed: ${error.error}`)
      }

      logInfo(`  Member1 added to Alpha project`)
    })

    // Test 3: Project access validation
    await this.switchUser('member2')
    await this.runTest('Member2 cannot access Alpha project (not a member)', async () => {
      const response = await this.makeRequest(`/api/projects/${testContext.projects.alpha.id}`)
      
      if (response.ok) {
        throw new Error('Member2 should not have access to Alpha project')
      }

      if (response.status !== 403 && response.status !== 404) {
        throw new Error(`Unexpected response status: ${response.status}`)
      }

      logInfo(`  Access properly denied with status: ${response.status}`)
    })
  }

  // ============= TASK TESTS =============
  async testTaskOperations() {
    logSubsection('Task Management Tests')
    
    await this.switchUser('admin')

    // Test 1: Create tasks
    const tasksToCreate = [
      {
        title: 'Core Test Task 1 - High Priority',
        description: 'This is a high priority task for testing core functionality',
        projectId: testContext.projects.alpha.id,
        priority: 'HIGH',
        status: 'TODO'
      },
      {
        title: 'Core Test Task 2 - Assigned Task',
        description: 'This task will be assigned to Member1',
        projectId: testContext.projects.alpha.id,
        assigneeId: testContext.users.member1.id,
        priority: 'MEDIUM',
        status: 'TODO'
      },
      {
        title: 'Core Test Task 3 - Beta Project',
        description: 'Task in Beta project for isolation testing',
        projectId: testContext.projects.beta.id,
        priority: 'LOW',
        status: 'TODO'
      }
    ]

    for (const [index, taskData] of tasksToCreate.entries()) {
      await this.runTest(`Create task: ${taskData.title}`, async () => {
        const response = await this.makeRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Task creation failed: ${error.error}`)
        }

        const task = await response.json()
        const taskKey = `task${index + 1}`
        testContext.tasks[taskKey] = task
        logInfo(`  Task created: ${task.title} (ID: ${task.id})`)
        
        if (taskData.assigneeId) {
          logInfo(`  Task assigned to: ${task.assignee?.name || 'Unknown'}`)
        }
      })
    }

    // Test 2: Update task
    await this.runTest('Update task status and priority', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task1.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          description: 'Updated task description with new priority'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Task update failed: ${error.error}`)
      }

      const updatedTask = await response.json()
      testContext.tasks.task1 = updatedTask
      logInfo(`  Task updated - Status: ${updatedTask.status}, Priority: ${updatedTask.priority}`)
    })

    // Test 3: Task assignment
    await this.runTest('Assign unassigned task to Member2', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task1.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          assigneeId: testContext.users.member2.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Task assignment failed: ${error.error}`)
      }

      const updatedTask = await response.json()
      testContext.tasks.task1 = updatedTask
      logInfo(`  Task assigned to: ${updatedTask.assignee?.name}`)
    })

    // Test 4: Task access by assignee
    await this.switchUser('member2')
    await this.runTest('Member2 can access assigned task', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task1.id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Task access failed: ${error.error}`)
      }

      const task = await response.json()
      logInfo(`  Member2 successfully accessed task: ${task.title}`)
    })

    // Test 5: Task access restriction
    await this.runTest('Member2 cannot access Beta project task (not project member)', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task3.id}`)
      
      if (response.ok) {
        throw new Error('Member2 should not have access to Beta project task')
      }

      logInfo(`  Access properly denied to Beta project task`)
    })
  }

  // ============= SUBTASK TESTS =============
  async testSubtaskOperations() {
    logSubsection('Subtask Operations Tests')
    
    await this.switchUser('member1')

    // Test 1: Create subtasks
    const subtasksToCreate = [
      { title: 'Setup development environment' },
      { title: 'Write unit tests' },
      { title: 'Code review and feedback' }
    ]

    for (const [index, subtaskData] of subtasksToCreate.entries()) {
      await this.runTest(`Create subtask: ${subtaskData.title}`, async () => {
        const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/subtasks`, {
          method: 'POST',
          body: JSON.stringify(subtaskData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Subtask creation failed: ${error.error}`)
        }

        const subtask = await response.json()
        const subtaskKey = `subtask${index + 1}`
        if (!testContext.tasks.task2.subtasks) {
          testContext.tasks.task2.subtasks = []
        }
        testContext.tasks.task2.subtasks.push(subtask)
        logInfo(`  Subtask created: ${subtask.title} (ID: ${subtask.id})`)
      })
    }

    // Test 2: Complete subtask
    await this.runTest('Mark first subtask as completed', async () => {
      const subtask = testContext.tasks.task2.subtasks[0]
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/subtasks/${subtask.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isCompleted: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Subtask completion failed: ${error.error}`)
      }

      logInfo(`  Subtask marked as completed`)
    })
  }

  // ============= COMMENT TESTS =============
  async testCommentOperations() {
    logSubsection('Comment System Tests')
    
    await this.switchUser('admin')

    // Test 1: Add comments
    const commentsToAdd = [
      { content: 'Great progress on this task! Keep it up.' },
      { content: 'Please make sure to follow the coding standards.' },
      { content: 'This looks good, but needs some minor adjustments.' }
    ]

    for (const [index, commentData] of commentsToAdd.entries()) {
      await this.runTest(`Add comment ${index + 1} to task`, async () => {
        const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/comments`, {
          method: 'POST',
          body: JSON.stringify(commentData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Comment creation failed: ${error.error}`)
        }

        const comment = await response.json()
        const commentKey = `comment${index + 1}`
        testContext.comments[commentKey] = comment
        logInfo(`  Comment added: "${comment.content.substring(0, 50)}..."`)
      })
    }

    // Test 2: Member adds comment
    await this.switchUser('member1')
    await this.runTest('Member1 adds response comment', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: 'Thanks for the feedback! I\'ll address these points.'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Member comment creation failed: ${error.error}`)
      }

      const comment = await response.json()
      testContext.comments.memberResponse = comment
      logInfo(`  Member1 comment added: "${comment.content}"`)
    })
  }

  // ============= FILE ATTACHMENT TESTS =============
  async testFileAttachments() {
    logSubsection('File Attachment Tests')
    
    await this.switchUser('member1')

    // Test 1: Create test file and upload
    await this.runTest('Upload file attachment to task', async () => {
      // Create a simple text file
      const fileContent = 'This is a test file for attachment testing.\nIt contains sample data for the task.'
      const blob = new Blob([fileContent], { type: 'text/plain' })
      const file = new File([blob], 'test-document.txt', { type: 'text/plain' })

      const formData = new FormData()
      formData.append('file', file)

      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/attachments`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`File upload failed: ${error.error}`)
      }

      const attachment = await response.json()
      testContext.attachments.testFile = attachment
      logInfo(`  File uploaded: ${attachment.fileName} (${attachment.fileSize} bytes)`)
    })

    // Test 2: Get task attachments
    await this.runTest('Retrieve task attachments list', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}/attachments`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to get attachments: ${error.error}`)
      }

      const attachments = await response.json()
      logInfo(`  Retrieved ${attachments.length} attachment(s)`)
      
      if (attachments.length === 0) {
        throw new Error('No attachments found')
      }
    })
  }

  // ============= PERMISSION TESTS =============
  async testPermissionBoundaries() {
    logSubsection('Permission Boundary Tests')
    
    // Test 1: Member cannot delete admin's task
    await this.switchUser('member1')
    await this.runTest('Member1 cannot delete admin-created task', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task3.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        throw new Error('Member1 should not be able to delete admin task')
      }

      logInfo(`  Delete permission properly denied (${response.status})`)
    })

    // Test 2: Member cannot create task in project they're not a member of
    await this.switchUser('member2')
    await this.runTest('Member2 cannot create task in Alpha project (not a member)', async () => {
      const response = await this.makeRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Unauthorized Task',
          description: 'This should fail',
          projectId: testContext.projects.alpha.id,
          priority: 'MEDIUM'
        })
      })

      if (response.ok) {
        throw new Error('Member2 should not be able to create task in Alpha project')
      }

      logInfo(`  Task creation properly denied (${response.status})`)
    })

    // Test 3: Admin can perform all operations
    await this.switchUser('admin')
    await this.runTest('Admin can update any task in workspace', async () => {
      const response = await this.makeRequest(`/api/tasks/${testContext.tasks.task2.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: 'Admin updated this task description'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Admin update failed: ${error.error}`)
      }

      logInfo(`  Admin successfully updated task`)
    })
  }

  // ============= INTEGRATION TESTS =============
  async testTaskWorkflow() {
    logSubsection('Complete Task Workflow Tests')
    
    await this.switchUser('admin')

    // Test complete workflow: Create → Assign → Work → Complete
    await this.runTest('Complete task workflow test', async () => {
      // Step 1: Create task
      const response1 = await this.makeRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Workflow Test Task',
          description: 'Testing complete task workflow',
          projectId: testContext.projects.alpha.id,
          priority: 'HIGH',
          status: 'TODO'
        })
      })

      if (!response1.ok) {
        throw new Error('Task creation failed in workflow')
      }

      const task = await response1.json()
      
      // Step 2: Assign to member
      const response2 = await this.makeRequest(`/api/tasks/${task.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          assigneeId: testContext.users.member1.id
        })
      })

      if (!response2.ok) {
        throw new Error('Task assignment failed in workflow')
      }

      // Step 3: Member starts work
      await this.switchUser('member1')
      const response3 = await this.makeRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        })
      })

      if (!response3.ok) {
        throw new Error('Status update failed in workflow')
      }

      // Step 4: Add comment
      const response4 = await this.makeRequest(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: 'Started working on this task'
        })
      })

      if (!response4.ok) {
        throw new Error('Comment addition failed in workflow')
      }

      // Step 5: Complete task
      const response5 = await this.makeRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'DONE'
        })
      })

      if (!response5.ok) {
        throw new Error('Task completion failed in workflow')
      }

      testContext.tasks.workflowTest = task
      logInfo(`  Complete workflow executed successfully for task: ${task.title}`)
    })
  }

  // ============= MAIN TEST RUNNER =============
  async runAllTests() {
    logSection('🚀 Starting Core Functionality Test Suite')
    
    try {
      await this.setupUsers()
      await this.testWorkspaceOperations()
      await this.testProjectOperations()
      await this.testTaskOperations()
      await this.testSubtaskOperations()
      await this.testCommentOperations()
      await this.testFileAttachments()
      await this.testPermissionBoundaries()
      await this.testTaskWorkflow()
      
      this.printSummary()
    } catch (error) {
      console.error('💥 Test suite failed:', error.message)
    }
  }

  printSummary() {
    logSection('📊 Core Functionality Test Results Summary')
    
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const total = this.results.length
    const successRate = ((passed / total) * 100).toFixed(1)

    console.log(`Total API Calls: ${this.apiCalls}`)
    console.log(`Tests Passed: ${passed}`)
    console.log(`Tests Failed: ${failed}`)
    console.log(`Success Rate: ${successRate}%`)

    logSubsection('Test Results by Category')
    this.results.forEach((result, index) => {
      const icon = result.status === 'passed' ? '✅' : '❌'
      console.log(`${index + 1}. ${icon} ${result.name}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    logSubsection('🎯 Test Context Summary')
    console.log(`Test Workspaces: ${Object.keys(testContext.workspaces).length}`)
    console.log(`Test Projects: ${Object.keys(testContext.projects).length}`)
    console.log(`Test Tasks: ${Object.keys(testContext.tasks).length}`)
    console.log(`Test Comments: ${Object.keys(testContext.comments).length}`)
    console.log(`Test Attachments: ${Object.keys(testContext.attachments).length}`)

    if (failed === 0) {
      logSection('🎉 All Core Functionality Tests Passed!')
      console.log('✅ Task management is working correctly')
      console.log('✅ Project operations are functional')
      console.log('✅ Permission boundaries are enforced')
      console.log('✅ File attachments are working')
      console.log('✅ Comments and subtasks are operational')
    } else {
      logSection('❌ Some Tests Failed')
      console.log('❌ Please review failed tests and fix issues')
      console.log('❌ Core functionality may not be fully operational')
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new CoreFunctionalityTester()
  tester.runAllTests()
}

module.exports = CoreFunctionalityTester

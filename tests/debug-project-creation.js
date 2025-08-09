#!/usr/bin/env node

/**
 * Debug script to test project creation and listing
 */

const BASE_URL = 'http://localhost:3000'

// Test user (using correct credentials from working tests)
const TEST_USER = {
  email: 'test-admin@pmapp-test.com',
  password: 'TestAdmin123!'
}

let authToken = null
let testWorkspace = null

console.log('🔍 Debug: Project Creation & Listing')
console.log('====================================')

async function authenticate() {
  console.log('\n1. Authenticating...')
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER)
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`)
    }

    const data = await response.json()
    authToken = data.token
    
    if (data.workspaces && data.workspaces.length > 0) {
      testWorkspace = data.workspaces[0]
    }

    console.log('✅ Authentication successful')
    console.log(`   Token: ${authToken?.substring(0, 20)}...`)
    console.log(`   Workspaces: ${data.workspaces?.length || 0}`)
    if (testWorkspace) {
      console.log(`   Using workspace: ${testWorkspace.id} (${testWorkspace.name})`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Authentication failed:', error.message)
    return false
  }
}

async function listExistingProjects() {
  console.log('\n2. Listing existing projects...')
  try {
    const url = testWorkspace 
      ? `/api/projects?workspaceId=${testWorkspace.id}&includeCounts=true`
      : '/api/projects?includeCounts=true'
    
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`)
    }

    const projects = await response.json()
    console.log(`✅ Found ${projects.length} existing projects`)
    
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.status})`)
      console.log(`      Tasks: ${project.taskCount}, Members: ${project.memberCount}`)
      console.log(`      Created: ${new Date(project.createdAt).toLocaleDateString()}`)
    })
    
    return projects
  } catch (error) {
    console.error('❌ Failed to list projects:', error.message)
    return []
  }
}

async function createTestProject() {
  console.log('\n3. Creating test project...')
  try {
    const projectData = {
      name: `Test Project ${Date.now()}`,
      description: 'A test project created by debug script',
      color: '#3b82f6',
      workspaceId: testWorkspace?.id
    }

    console.log(`   Creating project: "${projectData.name}"`)
    if (testWorkspace) {
      console.log(`   In workspace: ${testWorkspace.id}`)
    }

    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    })

    console.log(`   Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Project creation failed: ${response.status} - ${errorText}`)
    }

    const newProject = await response.json()
    console.log('✅ Project created successfully!')
    console.log(`   Project ID: ${newProject.id}`)
    console.log(`   Project Name: ${newProject.name}`)
    console.log(`   Status: ${newProject.status}`)
    
    return newProject
  } catch (error) {
    console.error('❌ Project creation failed:', error.message)
    return null
  }
}

async function verifyProjectInList() {
  console.log('\n4. Verifying project appears in list...')
  const projects = await listExistingProjects()
  return projects
}

async function checkWorkspaceAccess() {
  console.log('\n5. Checking workspace access...')
  try {
    if (!testWorkspace) {
      console.log('⚠️  No workspace available')
      return false
    }

    const response = await fetch(`${BASE_URL}/api/workspaces/${testWorkspace.id}/members`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Workspace access check failed: ${response.status}`)
    }

    const members = await response.json()
    console.log(`✅ Workspace access verified`)
    console.log(`   Members: ${members.length}`)
    
    return true
  } catch (error) {
    console.error('❌ Workspace access check failed:', error.message)
    return false
  }
}

async function runDebugTest() {
  console.log('Starting project creation debug test...\n')
  
  // Step 1: Authenticate
  const authSuccess = await authenticate()
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication')
    return
  }

  // Step 2: Check workspace access
  await checkWorkspaceAccess()

  // Step 3: List existing projects
  const beforeProjects = await listExistingProjects()

  // Step 4: Create a test project
  const newProject = await createTestProject()

  // Step 5: Verify project appears in list
  const afterProjects = await verifyProjectInList()

  // Summary
  console.log('\n📊 Debug Summary')
  console.log('================')
  console.log(`Projects before: ${beforeProjects.length}`)
  console.log(`Projects after: ${afterProjects.length}`)
  console.log(`Project created: ${newProject ? 'Yes' : 'No'}`)
  
  if (newProject && afterProjects.length > beforeProjects.length) {
    console.log('✅ Project creation is working correctly!')
  } else {
    console.log('❌ Project creation has issues:')
    if (!newProject) {
      console.log('   - Project creation API failed')
    }
    if (afterProjects.length === beforeProjects.length) {
      console.log('   - Project not appearing in list after creation')
    }
  }
}

// Run the debug test
runDebugTest().catch(console.error)

// Test script to validate permission demo with real data
import { db } from './src/lib/db.js'

async function setupPermissionDemoData() {
  try {
    console.log('Setting up permission demo data...')

    // Find or create a test user
    let testUser = await db.user.findFirst({
      where: { email: { contains: '@' } }
    })

    if (!testUser) {
      console.log('No users found. Creating test user...')
      testUser = await db.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User'
        }
      })
    }

    console.log('Using user:', testUser.email)

    // Find or create a workspace
    let workspace = await db.workspace.findFirst()
    
    if (!workspace) {
      console.log('No workspace found. Creating demo workspace...')
      workspace = await db.workspace.create({
        data: {
          name: 'Demo Workspace',
          members: {
            create: {
              userId: testUser.id,
              role: 'ADMIN'
            }
          }
        }
      })
    }

    // Find or create a test project
    let testProject = await db.project.findFirst({
      where: { workspaceId: workspace.id }
    })

    if (!testProject) {
      console.log('Creating demo project...')
      testProject = await db.project.create({
        data: {
          name: 'Demo Project',
          description: 'Project for testing permission system',
          workspaceId: workspace.id,
          members: {
            create: {
              userId: testUser.id,
              role: 'OWNER'
            }
          }
        }
      })
    }

    // Find or create a test task
    let testTask = await db.task.findFirst({
      where: { projectId: testProject.id }
    })

    if (!testTask) {
      console.log('Creating demo task...')
      testTask = await db.task.create({
        data: {
          title: 'Demo Task',
          description: 'Task for testing permission system',
          projectId: testProject.id,
          status: 'TODO',
          priority: 'MEDIUM'
        }
      })
    }

    console.log('\nDemo data setup complete!')
    console.log('=====================================')
    console.log('Project ID:', testProject.id)
    console.log('Task ID:', testTask.id)
    console.log('User ID:', testUser.id)
    console.log('Workspace ID:', workspace.id)
    console.log('=====================================')
    console.log('\nUpdate your demo page with these IDs:')
    console.log(`const sampleProjectId = "${testProject.id}"`)
    console.log(`const sampleTaskId = "${testTask.id}"`)
    console.log('\nThen visit: http://localhost:3000/demo/permissions')

    return {
      projectId: testProject.id,
      taskId: testTask.id,
      userId: testUser.id,
      workspaceId: workspace.id
    }

  } catch (error) {
    console.error('Error setting up demo data:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupPermissionDemoData()
}

export { setupPermissionDemoData }

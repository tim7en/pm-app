import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      avatar: '/avatars/01.png'
    }
  })

  console.log('✅ Created test user:', testUser.email)

  // Create test workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'Default Workspace',
      description: 'Main workspace for testing'
    }
  })

  // Add user to workspace
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: testUser.id,
        workspaceId: workspace.id
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      workspaceId: workspace.id,
      role: 'OWNER'
    }
  })

  console.log('✅ Created workspace and membership')

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      color: '#3b82f6',
      ownerId: testUser.id,
      workspaceId: workspace.id,
      status: 'ACTIVE'
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
      color: '#10b981',
      ownerId: testUser.id,
      workspaceId: workspace.id,
      status: 'ACTIVE'
    }
  })

  // Add user as project member
  await prisma.projectMember.createMany({
    data: [
      {
        userId: testUser.id,
        projectId: project1.id,
        role: 'ADMIN'
      },
      {
        userId: testUser.id,
        projectId: project2.id,
        role: 'ADMIN'
      }
    ]
  })

  // Create sample tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Design Homepage Mockup',
        description: 'Create wireframes and high-fidelity mockups for the new homepage',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: testUser.id,
        creatorId: testUser.id,
        position: 1,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Set up development environment',
        description: 'Configure React Native development environment',
        status: 'DONE',
        priority: 'MEDIUM',
        projectId: project2.id,
        assigneeId: testUser.id,
        creatorId: testUser.id,
        position: 1
      },
      {
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project2.id,
        assigneeId: testUser.id,
        creatorId: testUser.id,
        position: 2,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        title: 'Research competitor analysis',
        description: 'Analyze competitors and market trends',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: null, // Unassigned task
        creatorId: testUser.id,
        position: 3
      },
      {
        title: 'Write project documentation',
        description: 'Create comprehensive project documentation',
        status: 'TODO',
        priority: 'LOW',
        projectId: project2.id,
        assigneeId: null, // Unassigned task
        creatorId: testUser.id,
        position: 3
      }
    ]
  })

  console.log('✅ Created sample projects and tasks')
  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('Test credentials:')
  console.log('Email: test@example.com')
  console.log('Password: password')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

import { PrismaClient, User } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users with real emails and passwords
  const users = [
    {
      email: 'tim7en@gmail.com',
      name: 'Timur',
      password: await bcrypt.hash('password123', 12),
      avatar: '/avatars/01.png'
    },
    {
      email: 'zusabi@gmail.com', 
      name: 'Zusabi',
      password: await bcrypt.hash('password123', 12),
      avatar: '/avatars/02.png'
    },
    {
      email: 'test@example.com',
      name: 'Test User',
      password: await bcrypt.hash('password', 12),
      avatar: '/avatars/03.png'
    },
    {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 12),
      avatar: '/avatars/04.png'
    }
  ]

  const createdUsers: User[] = []
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
    createdUsers.push(user)
    console.log('✅ Created user:', user.email)
  }

  // Get Timur as the main user
  const timurUser = createdUsers.find(u => u.email === 'tim7en@gmail.com')!

  // Create workspace for Timur
  const workspace = await prisma.workspace.upsert({
    where: { id: 'timur-workspace' },
    update: {},
    create: {
      id: 'timur-workspace',
      name: "Timur's Team Workspace",
      description: 'Main workspace for team collaboration'
    }
  })

  // Add Timur as workspace owner
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: timurUser.id,
        workspaceId: workspace.id
      }
    },
    update: {},
    create: {
      userId: timurUser.id,
      workspaceId: workspace.id,
      role: 'OWNER'
    }
  })

  console.log('✅ Created workspace and ownership')

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      color: '#3b82f6',
      ownerId: timurUser.id,
      workspaceId: workspace.id,
      status: 'ACTIVE'
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
      color: '#10b981',
      ownerId: timurUser.id,
      workspaceId: workspace.id,
      status: 'ACTIVE'
    }
  })

  // Add Timur as project member
  await prisma.projectMember.createMany({
    data: [
      {
        userId: timurUser.id,
        projectId: project1.id,
        role: 'ADMIN'
      },
      {
        userId: timurUser.id,
        projectId: project2.id,
        role: 'ADMIN'
      }
    ]
  })

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Homepage Layout',
        description: 'Create wireframes and mockups for the new homepage',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: timurUser.id,
        creatorId: timurUser.id,
        projectId: project1.id,
        position: 1,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Setup Development Environment',
        description: 'Configure local development environment for the project',
        status: 'DONE',
        priority: 'MEDIUM',
        assigneeId: timurUser.id,
        creatorId: timurUser.id,
        projectId: project1.id,
        position: 2
      },
      {
        title: 'Research Mobile Frameworks',
        description: 'Compare React Native vs Flutter for mobile development',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: timurUser.id,
        creatorId: timurUser.id,
        projectId: project2.id,
        position: 1,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Create User Authentication Flow',
        description: 'Implement login, registration, and password reset functionality',
        status: 'TODO',
        priority: 'HIGH',
        creatorId: timurUser.id,
        projectId: project2.id,
        position: 2
      },
      {
        title: 'Database Schema Design',
        description: 'Design the database schema for user data and app content',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        creatorId: timurUser.id,
        projectId: project2.id,
        position: 3
      }
    ]
  })

  console.log('✅ Created sample projects and tasks')
  
  console.log(`
🎉 Seeding completed!

Test credentials:
- Timur: tim7en@gmail.com / password123
- Zusabi: zusabi@gmail.com / password123 
- Test User: test@example.com / password
- Admin: admin@example.com / admin123

You can now invite existing users to your workspace/projects by their email addresses!
  `)
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

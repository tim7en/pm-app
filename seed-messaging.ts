import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedMessagingData() {
  console.log('🌱 Seeding messaging data...')

  // Create test users
  const testUsers = [
    {
      email: 'alice@company.com',
      name: 'Alice Johnson',
      password: await bcrypt.hash('password123', 10),
      avatar: '/avatars/01.png'
    },
    {
      email: 'bob@company.com', 
      name: 'Bob Smith',
      password: await bcrypt.hash('password123', 10),
      avatar: '/avatars/02.png'
    },
    {
      email: 'charlie@company.com',
      name: 'Charlie Brown',
      password: await bcrypt.hash('password123', 10),
      avatar: '/avatars/03.png'
    },
    {
      email: 'diana@company.com',
      name: 'Diana Prince',
      password: await bcrypt.hash('password123', 10),
      avatar: '/avatars/04.png'
    }
  ]

  // Create users
  const createdUsers: any[] = []
  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (!existingUser) {
      const user = await prisma.user.create({
        data: userData
      })
      createdUsers.push(user)
      console.log(`✅ Created user: ${user.name} (${user.email})`)
    } else {
      createdUsers.push(existingUser)
      console.log(`👤 User already exists: ${existingUser.name} (${existingUser.email})`)
    }
  }

  // Create or get default workspace
  let workspace = await prisma.workspace.findFirst({
    where: { name: 'Default Workspace' }
  })

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Default Workspace',
        description: 'Default workspace for testing messaging'
      }
    })
    console.log(`✅ Created workspace: ${workspace.name}`)
  } else {
    console.log(`🏢 Using existing workspace: ${workspace.name}`)
  }

  // Add users to workspace
  for (const user of createdUsers) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id
        }
      }
    })

    if (!existingMember) {
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: user.email === 'alice@company.com' ? 'ADMIN' : 'MEMBER'
        }
      })
      console.log(`✅ Added ${user.name} to workspace`)
    } else {
      console.log(`👥 ${user.name} already in workspace`)
    }
  }

  // Store workspace ID for frontend use
  console.log(`🆔 Workspace ID for testing: ${workspace.id}`)
  console.log(`📝 Add this to localStorage as 'currentWorkspaceId': ${workspace.id}`)

  console.log('✨ Messaging data seeding completed!')
  console.log('\n🔑 Test user credentials:')
  testUsers.forEach(user => {
    console.log(`   ${user.name}: ${user.email} / password123`)
  })
}

seedMessagingData()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

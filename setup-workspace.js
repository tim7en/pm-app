const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupWorkspace() {
  try {
    // Find Timur user
    const timurUser = await prisma.user.findUnique({
      where: { email: 'tim7en@gmail.com' }
    })

    if (!timurUser) {
      console.log('Timur user not found')
      return
    }

    // Create or find a workspace
    let workspace = await prisma.workspace.findFirst({
      where: { name: 'Default Workspace' }
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Default Workspace',
          description: 'Main workspace for project management',
          ownerId: timurUser.id,
        }
      })
      console.log('Created workspace:', workspace.name)
    }

    // Create workspace member relationship for Timur as owner
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: timurUser.id
      }
    })

    if (!existingMember) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: timurUser.id,
          role: 'OWNER'
        }
      })
      console.log('Added Timur as workspace owner')
    }

    console.log('Workspace setup complete!')
    console.log('Workspace ID:', workspace.id)
    console.log('Timur can now invite users like zusabi@gmail.com to the team')

  } catch (error) {
    console.error('Error setting up workspace:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupWorkspace()

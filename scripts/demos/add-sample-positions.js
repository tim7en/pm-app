const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSamplePositions() {
  try {
    // Get some workspace members
    const members = await prisma.workspaceMember.findMany({
      take: 3,
      include: {
        user: true
      }
    })

    if (members.length === 0) {
      console.log('No workspace members found')
      return
    }

    // Sample positions to assign
    const positions = [
      { title: 'Senior Developer', department: 'Engineering' },
      { title: 'Product Manager', department: 'Product' },
      { title: 'UI/UX Designer', department: 'Design' }
    ]

    for (let i = 0; i < Math.min(members.length, positions.length); i++) {
      const member = members[i]
      const position = positions[i]

      await prisma.workspaceMember.update({
        where: { id: member.id },
        data: {
          title: position.title,
          department: position.department
        }
      })

      console.log(`Updated ${member.user.name || member.user.email} with position: ${position.title} in ${position.department}`)
    }

    console.log('Sample positions added successfully!')
  } catch (error) {
    console.error('Error adding sample positions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSamplePositions()

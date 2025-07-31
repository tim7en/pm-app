import { PrismaClient, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedNotifications() {
  try {
    console.log('🌱 Seeding notifications...')

    // Get the first user for testing
    const firstUser = await prisma.user.findFirst()
    
    if (!firstUser) {
      console.log('❌ No users found. Please create a user first.')
      return
    }

    console.log(`🔍 Found user: ${firstUser.name || firstUser.email}`)

    // Create sample notifications
    const notifications = [
      {
        title: 'Welcome to UzEffect!',
        message: 'You have successfully joined the project management platform. Start by creating your first project.',
        type: NotificationType.WORKSPACE_INVITE,
        userId: firstUser.id,
      },
      {
        title: 'Task Due Soon',
        message: 'Your task "Design Homepage" is due in 2 hours. Don\'t forget to complete it on time.',
        type: NotificationType.TASK_DUE_SOON,
        userId: firstUser.id,
      },
      {
        title: 'New Comment Added',
        message: 'John Doe added a comment to your task "Frontend Development": "Great progress so far!"',
        type: NotificationType.COMMENT_ADDED,
        userId: firstUser.id,
      },
      {
        title: 'Task Assigned',
        message: 'You have been assigned to task "API Integration" in Project Alpha.',
        type: NotificationType.TASK_ASSIGNED,
        userId: firstUser.id,
      },
      {
        title: 'Task Verification Required',
        message: 'Task "Database Schema" requires your verification before it can be marked as complete.',
        type: NotificationType.TASK_VERIFICATION_REQUIRED,
        userId: firstUser.id,
      }
    ]

    // Delete existing notifications for this user
    await prisma.notification.deleteMany({
      where: { userId: firstUser.id }
    })

    // Create new notifications
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      })
    }

    console.log(`✅ Created ${notifications.length} sample notifications for ${firstUser.name || firstUser.email}`)
    
  } catch (error) {
    console.error('❌ Error seeding notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedNotifications()
}

export { seedNotifications }

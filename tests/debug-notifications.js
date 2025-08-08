// Debug script to check notification issues
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugNotifications() {
  try {
    console.log('=== NOTIFICATION DEBUG REPORT ===\n')
    
    // First, let's see what users exist
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    
    console.log('Available users:')
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email}) - ID: ${u.id}`)
    })
    console.log('')
    
    // Get the first user for testing
    const user = allUsers[0]
    
    if (!user) {
      console.log('No users found!')
      return
    }
    
    console.log(`User ID: ${user.id}`)
    console.log(`User Name: ${user.name}`)
    console.log(`User Email: ${user.email}\n`)
    
    // Get all notifications for this user
    const allNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total notifications: ${allNotifications.length}`)
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { 
        userId: user.id,
        isRead: false 
      }
    })
    
    console.log(`Unread notifications: ${unreadCount}`)
    
    // Show breakdown by read status
    const readCount = allNotifications.filter(n => n.isRead).length
    const unreadNotifications = allNotifications.filter(n => !n.isRead)
    
    console.log(`Read notifications: ${readCount}`)
    console.log(`\n=== UNREAD NOTIFICATIONS ===`)
    
    unreadNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ID: ${notif.id}`)
      console.log(`   Title: ${notif.title}`)
      console.log(`   Message: ${notif.message}`)
      console.log(`   Type: ${notif.type}`)
      console.log(`   IsRead: ${notif.isRead}`)
      console.log(`   Created: ${notif.createdAt}`)
      console.log('')
    })
    
    // Test marking one as read
    if (unreadNotifications.length > 0) {
      const firstUnread = unreadNotifications[0]
      console.log(`\n=== TESTING MARK AS READ ===`)
      console.log(`Marking notification ${firstUnread.id} as read...`)
      
      const updated = await prisma.notification.update({
        where: { id: firstUnread.id },
        data: { isRead: true }
      })
      
      console.log(`Updated successfully: isRead = ${updated.isRead}`)
      
      // Check new count
      const newUnreadCount = await prisma.notification.count({
        where: { 
          userId: user.id,
          isRead: false 
        }
      })
      
      console.log(`New unread count: ${newUnreadCount}`)
      
      // Revert the change
      await prisma.notification.update({
        where: { id: firstUnread.id },
        data: { isRead: false }
      })
      
      console.log('Reverted change for debugging')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugNotifications()

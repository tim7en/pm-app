// Test script for notification mark as read functionality
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMarkAsRead() {
  try {
    console.log('=== TESTING MARK AS READ FUNCTIONALITY ===\n')
    
    // Get first user
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('No user found!')
      return
    }
    
    console.log(`Testing with user: ${user.name} (${user.email})`)
    
    // Get initial unread count
    const initialCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })
    console.log(`Initial unread count: ${initialCount}`)
    
    // Get first unread notification
    const unreadNotif = await prisma.notification.findFirst({
      where: { userId: user.id, isRead: false }
    })
    
    if (!unreadNotif) {
      console.log('No unread notifications found!')
      return
    }
    
    console.log(`\nFound unread notification: ${unreadNotif.title}`)
    console.log(`ID: ${unreadNotif.id}`)
    console.log(`isRead: ${unreadNotif.isRead}`)
    
    // Test single mark as read
    console.log('\n=== Testing Single Mark as Read ===')
    await prisma.notification.update({
      where: { id: unreadNotif.id },
      data: { isRead: true }
    })
    
    const afterSingleCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })
    console.log(`Count after marking one as read: ${afterSingleCount}`)
    console.log(`Expected: ${initialCount - 1}`)
    console.log(`Success: ${afterSingleCount === initialCount - 1}`)
    
    // Revert for testing mark all
    await prisma.notification.update({
      where: { id: unreadNotif.id },
      data: { isRead: false }
    })
    
    // Test mark all as read
    console.log('\n=== Testing Mark All as Read ===')
    const updateResult = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    })
    
    const afterAllCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })
    
    console.log(`Updated ${updateResult.count} notifications`)
    console.log(`Count after marking all as read: ${afterAllCount}`)
    console.log(`Expected: 0`)
    console.log(`Success: ${afterAllCount === 0}`)
    
    // Revert all changes for normal testing
    console.log('\n=== Reverting Changes ===')
    await prisma.notification.updateMany({
      where: { userId: user.id },
      data: { isRead: false }
    })
    
    const finalCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })
    console.log(`Final unread count (restored): ${finalCount}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMarkAsRead()

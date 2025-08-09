// Test script to verify messaging functionality
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMessaging() {
  console.log('Testing messaging system...')
  
  try {
    // Check if conversation and message tables exist
    const conversationCount = await prisma.conversation.count()
    const messageCount = await prisma.message.count()
    const participantCount = await prisma.conversationParticipant.count()
    
    console.log(`Found ${conversationCount} conversations`)
    console.log(`Found ${messageCount} messages`)
    console.log(`Found ${participantCount} participants`)
    
    // Test creating a conversation
    const testConversation = await prisma.conversation.create({
      data: {
        name: 'Test Conversation',
        isGroup: false,
        type: 'INTERNAL',
        participants: {
          create: [
            { userId: 'test-user-1' },
            { userId: 'test-user-2' }
          ]
        }
      },
      include: {
        participants: true
      }
    })
    
    console.log('Created test conversation:', testConversation.id)
    
    // Test creating a message
    const testMessage = await prisma.message.create({
      data: {
        content: 'Hello, this is a test message!',
        conversationId: testConversation.id,
        senderId: 'test-user-1'
      }
    })
    
    console.log('Created test message:', testMessage.id)
    
    // Clean up test data
    await prisma.message.delete({ where: { id: testMessage.id } })
    await prisma.conversationParticipant.deleteMany({ where: { conversationId: testConversation.id } })
    await prisma.conversation.delete({ where: { id: testConversation.id } })
    
    console.log('Test completed successfully! ✅')
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMessaging()

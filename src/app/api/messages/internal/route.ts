import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Create a simple message table structure (you might want to add this to your Prisma schema)
// For now, we'll use a mock in-memory store
const messages: any[] = []
const conversations: any[] = []

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for a specific conversation
      const conversationMessages = messages.filter(msg => 
        msg.conversationId === conversationId
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      return NextResponse.json({
        success: true,
        messages: conversationMessages
      })
    } else {
      // Get all conversations for the user
      const userConversations = conversations.filter(conv =>
        conv.participants.some((p: any) => p.id === session.user.id)
      ).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())

      return NextResponse.json({
        success: true,
        conversations: userConversations
      })
    }

  } catch (error) {
    console.error('Error fetching internal messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, content, conversationId } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 })
    }

    // Get receiver details
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const timestamp = new Date()

    let currentConversationId = conversationId

    // Create new conversation if it doesn't exist
    if (!currentConversationId) {
      currentConversationId = `conv-${session.user.id}-${receiverId}-${Date.now()}`
      
      const newConversation = {
        id: currentConversationId,
        participants: [
          {
            id: session.user.id,
            name: session.user.name || session.user.email,
            email: session.user.email,
            avatar: session.user.avatar
          },
          {
            id: receiver.id,
            name: receiver.name || receiver.email,
            email: receiver.email,
            avatar: receiver.avatar
          }
        ],
        lastMessage: {
          content,
          timestamp,
          senderId: session.user.id
        },
        unreadCount: 1,
        isGroup: false,
        type: 'internal'
      }

      conversations.push(newConversation)
    } else {
      // Update existing conversation
      const convIndex = conversations.findIndex(c => c.id === currentConversationId)
      if (convIndex !== -1) {
        conversations[convIndex].lastMessage = {
          content,
          timestamp,
          senderId: session.user.id
        }
        conversations[convIndex].unreadCount += 1
      }
    }

    // Create the message
    const newMessage = {
      id: messageId,
      conversationId: currentConversationId,
      content,
      sender: {
        id: session.user.id,
        name: session.user.name || session.user.email,
        email: session.user.email,
        avatar: session.user.avatar
      },
      receiver: {
        id: receiver.id,
        name: receiver.name || receiver.email,
        email: receiver.email,
        avatar: receiver.avatar
      },
      timestamp,
      isRead: false,
      type: 'internal'
    }

    messages.push(newMessage)

    return NextResponse.json({
      success: true,
      message: newMessage,
      conversationId: currentConversationId
    })

  } catch (error) {
    console.error('Error sending internal message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

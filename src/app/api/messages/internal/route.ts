import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversationId')
    const participantId = url.searchParams.get('participantId')

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await db.message.findMany({
        where: {
          conversationId: conversationId,
          conversation: {
            participants: {
              some: {
                userId: session.user.id
              }
            }
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      const formattedMessages = messages.map(message => ({
        id: message.id,
        content: message.content,
        timestamp: message.createdAt,
        senderId: message.senderId,
        isRead: message.isRead,
        sender: {
          id: message.sender.id,
          name: message.sender.name || message.sender.email,
          email: message.sender.email,
          avatar: message.sender.avatar
        }
      }))

      return NextResponse.json({
        success: true,
        messages: formattedMessages
      })
    } else if (participantId) {
      // Get conversation with a specific participant
      const conversation = await db.conversation.findFirst({
        where: {
          type: 'INTERNAL',
          isGroup: false,
          AND: [
            {
              participants: {
                some: {
                  userId: session.user.id
                }
              }
            },
            {
              participants: {
                some: {
                  userId: participantId
                }
              }
            }
          ]
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  workspaceMembers: {
                    select: {
                      role: true,
                      workspace: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          }
        }
      })

      if (conversation) {
        // Get unread message count
        const unreadCount = await db.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: session.user.id },
            isRead: false
          }
        })

        const lastMessage = conversation.messages[0]
        
        return NextResponse.json({
          success: true,
          conversation: {
            id: conversation.id,
            participants: conversation.participants.map(p => ({
              id: p.user.id,
              name: p.user.name || p.user.email,
              email: p.user.email,
              avatar: p.user.avatar,
              role: p.user.workspaceMembers[0]?.role || 'MEMBER',
              isOnline: Math.random() > 0.3 // Simulate online status for now
            })),
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              timestamp: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              sender: {
                id: lastMessage.sender.id,
                name: lastMessage.sender.name || lastMessage.sender.email,
                email: lastMessage.sender.email,
                avatar: lastMessage.sender.avatar
              },
              isRead: lastMessage.isRead
            } : null,
            unreadCount,
            isGroup: conversation.isGroup,
            groupName: conversation.name,
            type: 'internal' as const,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          conversation: null
        })
      }
    } else {
      // Get all conversations for the user
      const conversations = await db.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: session.user.id
            }
          },
          type: 'INTERNAL'
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  workspaceMembers: {
                    select: {
                      role: true,
                      workspace: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      // Get unread message counts separately for better performance
      const conversationIds = conversations.map(c => c.id)
      const unreadCounts = await Promise.all(
        conversationIds.map(async (id) => {
          const count = await db.message.count({
            where: {
              conversationId: id,
              senderId: { not: session.user.id },
              isRead: false
            }
          })
          return { conversationId: id, count }
        })
      )

      const formattedConversations = conversations.map(conversation => {
        const lastMessage = conversation.messages[0]
        const otherParticipants = conversation.participants.filter(p => p.userId !== session.user.id)
        
        // Get unread count for this conversation
        const unreadData = unreadCounts.find(u => u.conversationId === conversation.id)
        const unreadCount = unreadData?.count || 0

        return {
          id: conversation.id,
          participants: conversation.participants.map(p => ({
            id: p.user.id,
            name: p.user.name || p.user.email,
            email: p.user.email,
            avatar: p.user.avatar,
            role: p.user.workspaceMembers[0]?.role || 'MEMBER',
            isOnline: Math.random() > 0.3 // Simulate online status for now
          })),
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            senderName: lastMessage.sender.name || lastMessage.sender.email
          } : {
            content: 'Start a conversation',
            timestamp: conversation.createdAt,
            senderId: session.user.id,
            senderName: 'System'
          },
          unreadCount,
          isGroup: conversation.isGroup,
          groupName: conversation.name,
          type: 'internal' as const,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      })

      return NextResponse.json({
        success: true,
        conversations: formattedConversations
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

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    let targetConversationId = conversationId

    // If no conversation ID provided, find or create a conversation
    if (!targetConversationId && receiverId) {
      // Look for existing conversation between these two users
      const existingConversation = await db.conversation.findFirst({
        where: {
          isGroup: false,
          type: 'INTERNAL',
          participants: {
            every: {
              userId: {
                in: [session.user.id, receiverId]
              }
            }
          }
        },
        include: {
          participants: true
        }
      })

      if (existingConversation && existingConversation.participants.length === 2) {
        targetConversationId = existingConversation.id
      } else {
        // Create new conversation
        const newConversation = await db.conversation.create({
          data: {
            isGroup: false,
            type: 'INTERNAL',
            participants: {
              create: [
                { userId: session.user.id },
                { userId: receiverId }
              ]
            }
          }
        })
        targetConversationId = newConversation.id
      }
    }

    if (!targetConversationId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 400 })
    }

    // Verify user is participant in this conversation
    const participant = await db.conversationParticipant.findFirst({
      where: {
        conversationId: targetConversationId,
        userId: session.user.id
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not authorized to send message to this conversation' }, { status: 403 })
    }

    // Create the message
    const message = await db.message.create({
      data: {
        content: content.trim(),
        conversationId: targetConversationId,
        senderId: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Update conversation updated timestamp
    await db.conversation.update({
      where: { id: targetConversationId },
      data: { updatedAt: new Date() }
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      timestamp: message.createdAt,
      senderId: message.senderId,
      isRead: message.isRead,
      sender: {
        id: message.sender.id,
        name: message.sender.name || message.sender.email,
        email: message.sender.email,
        avatar: message.sender.avatar
      }
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
      conversationId: targetConversationId
    })

  } catch (error) {
    console.error('Error sending internal message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Mark all messages in this conversation as read for this user
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id }, // Don't mark own messages as read
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Update participant's last read timestamp
    await db.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: session.user.id
      },
      data: {
        lastReadAt: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
  }
}

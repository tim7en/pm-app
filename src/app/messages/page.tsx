"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  Send, 
  Search, 
  Plus, 
  MessageSquare,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Users,
  Clock,
  Check,
  CheckCheck
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  receiver: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: Date
  isRead: boolean
  attachments?: Array<{
    id: string
    name: string
    type: string
    size: string
  }>
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
  }>
  lastMessage: {
    content: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
  isGroup: boolean
  groupName?: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
    }
  }, [activeConversation])

  const fetchConversations = async () => {
    try {
      // Mock conversations for now
      const mockConversations: Conversation[] = [
        {
          id: "1",
          participants: [
            { id: "1", name: "John Doe", avatar: "" },
            { id: "2", name: "Jane Smith", avatar: "" }
          ],
          lastMessage: {
            content: "Hey, can you review the new design mockups?",
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            senderId: "2"
          },
          unreadCount: 2,
          isGroup: false
        },
        {
          id: "2",
          participants: [
            { id: "1", name: "John Doe", avatar: "" },
            { id: "3", name: "Mike Johnson", avatar: "" }
          ],
          lastMessage: {
            content: "The project deadline has been moved to next week",
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            senderId: "3"
          },
          unreadCount: 0,
          isGroup: false
        },
        {
          id: "3",
          participants: [
            { id: "1", name: "John Doe", avatar: "" },
            { id: "2", name: "Jane Smith", avatar: "" },
            { id: "3", name: "Mike Johnson", avatar: "" },
            { id: "4", name: "Sarah Wilson", avatar: "" }
          ],
          lastMessage: {
            content: "Team meeting tomorrow at 10 AM",
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            senderId: "4"
          },
          unreadCount: 5,
          isGroup: true,
          groupName: "Design Team"
        }
      ]
      setConversations(mockConversations)
      setActiveConversation(mockConversations[0])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock messages for now
      const mockMessages: Message[] = [
        {
          id: "1",
          content: "Hey there! How's the project going?",
          sender: { id: "2", name: "Jane Smith", avatar: "" },
          receiver: { id: "1", name: "John Doe", avatar: "" },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          isRead: true
        },
        {
          id: "2",
          content: "It's going well! I just finished the initial design mockups.",
          sender: { id: "1", name: "John Doe", avatar: "" },
          receiver: { id: "2", name: "Jane Smith", avatar: "" },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
          isRead: true
        },
        {
          id: "3",
          content: "That's great! Can you share them with me? I'd love to take a look.",
          sender: { id: "2", name: "Jane Smith", avatar: "" },
          receiver: { id: "1", name: "John Doe", avatar: "" },
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isRead: true
        },
        {
          id: "4",
          content: "Sure! I'll send them over in a few minutes.",
          sender: { id: "1", name: "John Doe", avatar: "" },
          receiver: { id: "2", name: "Jane Smith", avatar: "" },
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isRead: true
        },
        {
          id: "5",
          content: "Hey, can you review the new design mockups?",
          sender: { id: "2", name: "Jane Smith", avatar: "" },
          receiver: { id: "1", name: "John Doe", avatar: "" },
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          isRead: false
        }
      ]
      setMessages(mockMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    try {
      const newMessageObj: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: { id: "1", name: "John Doe", avatar: "" },
        receiver: activeConversation.participants.find(p => p.id !== "1") || activeConversation.participants[0],
        timestamp: new Date(),
        isRead: false
      }

      setMessages(prev => [...prev, newMessageObj])
      setNewMessage("")

      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? {
              ...conv,
              lastMessage: {
                content: newMessage,
                timestamp: new Date(),
                senderId: "1"
              }
            }
          : conv
      ))
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase()
    const participantNames = conv.participants.map(p => p.name.toLowerCase()).join(' ')
    const groupName = conv.groupName?.toLowerCase() || ''
    const lastMessage = conv.lastMessage.content.toLowerCase()
    
    return (
      participantNames.includes(searchLower) ||
      groupName.includes(searchLower) ||
      lastMessage.includes(searchLower)
    )
  })

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== "1") || conversation.participants[0]
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        activeConversation?.id === conversation.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                          <AvatarFallback>
                            {otherParticipant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-sm truncate">
                              {conversation.isGroup ? conversation.groupName : otherParticipant.name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={getOtherParticipant(activeConversation).avatar} 
                          alt={getOtherParticipant(activeConversation).name} 
                        />
                        <AvatarFallback>
                          {getOtherParticipant(activeConversation).name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {activeConversation.isGroup 
                            ? activeConversation.groupName 
                            : getOtherParticipant(activeConversation).name
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeConversation.isGroup 
                            ? `${activeConversation.participants.length} participants`
                            : 'Online'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.sender.id === "1"
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`p-3 rounded-lg ${
                                isCurrentUser 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {isCurrentUser && (
                                message.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="resize-none"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
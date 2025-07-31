"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Users,
  Search,
  Plus,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Circle,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  isOnline: boolean
  lastSeen?: Date
  department?: string
  title?: string
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: Date
  isRead?: boolean
}

interface ChatConversation {
  id: string
  name: string
  participants: TeamMember[]
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  messages: Message[]
}

interface ExpandableChatWindowProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  teamMembers: TeamMember[]
  currentUserId?: string
  workspaceId?: string
}

export function ExpandableChatWindow({
  isOpen,
  onOpenChange,
  teamMembers,
  currentUserId,
  workspaceId
}: ExpandableChatWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMemberSelection, setShowMemberSelection] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations and messages on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  // Load conversations from API
  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/messages/internal')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.conversations) {
          setConversations(data.conversations.map((conv: any) => ({
            ...conv,
            messages: [] // Messages will be loaded when conversation is selected
          })))
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/internal?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          // Update the conversation with loaded messages
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    messages: data.messages.map((msg: any) => ({
                      id: msg.id,
                      content: msg.content,
                      senderId: msg.sender.id,
                      senderName: msg.sender.name,
                      senderAvatar: msg.sender.avatar,
                      timestamp: new Date(msg.timestamp),
                      isRead: msg.isRead
                    }))
                  }
                : conv
            )
          )
          
          // Update active conversation if it's the one we loaded
          if (activeConversation?.id === conversationId) {
            const updatedConv = conversations.find(c => c.id === conversationId)
            if (updatedConv) {
              setActiveConversation({
                ...updatedConv,
                messages: data.messages.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.sender.id,
                  senderName: msg.sender.name,
                  senderAvatar: msg.sender.avatar,
                  timestamp: new Date(msg.timestamp),
                  isRead: msg.isRead
                }))
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Handle conversation selection
  const handleConversationSelect = (conversation: ChatConversation) => {
    setActiveConversation(conversation)
    // Load messages if they haven't been loaded yet
    if (conversation.messages.length === 0) {
      loadMessages(conversation.id)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeConversation?.messages])

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Create a new conversation with selected members
  const startNewConversation = () => {
    if (selectedMembers.length === 0) return

    const participants = teamMembers.filter(member => 
      selectedMembers.includes(member.id)
    )

    const isGroup = participants.length > 1
    const conversationId = `conv-${Date.now()}`
    
    const newConversation: ChatConversation = {
      id: conversationId,
      name: isGroup 
        ? `Group with ${participants.map(p => p.name).join(', ')}`
        : participants[0].name,
      participants,
      unreadCount: 0,
      isGroup,
      messages: []
    }

    setConversations(prev => [newConversation, ...prev])
    setActiveConversation(newConversation)
    setShowMemberSelection(false)
    setSelectedMembers([])
  }

  // Start direct message with a specific member
  const startDirectMessage = (member: TeamMember) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      !conv.isGroup && conv.participants.some(p => p.id === member.id)
    )

    if (existingConv) {
      setActiveConversation(existingConv)
    } else {
      const newConversation: ChatConversation = {
        id: `dm-${member.id}-${Date.now()}`,
        name: member.name,
        participants: [member],
        unreadCount: 0,
        isGroup: false,
        messages: []
      }
      
      setConversations(prev => [newConversation, ...prev])
      setActiveConversation(newConversation)
    }
    setShowMemberSelection(false)
  }

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    const tempMessage: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      senderId: currentUserId || 'current-user',
      senderName: 'You',
      timestamp: new Date(),
      isRead: false
    }

    // Update UI immediately for better UX
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, tempMessage],
      lastMessage: tempMessage
    }

    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation.id ? updatedConversation : conv
      )
    )
    
    setActiveConversation(updatedConversation)
    setNewMessage('')

    // Send message to backend
    try {
      if (activeConversation.isGroup) {
        // For group messages, send to multiple recipients
        const promises = activeConversation.participants.map(participant => 
          fetch('/api/messages/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverId: participant.id,
              content: tempMessage.content,
              conversationId: activeConversation.id
            })
          })
        )
        await Promise.all(promises)
      } else {
        // Direct message to single recipient
        const participant = activeConversation.participants[0]
        await fetch('/api/messages/internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: participant.id,
            content: tempMessage.content,
            conversationId: activeConversation.id
          })
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Could show error state here
    }
  }

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format message time
  const formatMessageTime = (timestamp: Date) => {
    return format(timestamp, 'HH:mm')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 border-0 shadow-2xl overflow-hidden",
          isExpanded ? "max-w-7xl w-[90vw] h-[85vh]" : "max-w-5xl w-[80vw] h-[75vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle>Team Chat</DialogTitle>
                <DialogDescription>
                  {activeConversation 
                    ? `${activeConversation.name} • ${activeConversation.participants.length} participant${activeConversation.participants.length !== 1 ? 's' : ''}`
                    : `${teamMembers.length} team members available`
                  }
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {activeConversation && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-80 border-r bg-card/30 flex flex-col min-h-0">
            {/* Search */}
            <div className="p-3 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-b shrink-0">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowMemberSelection(true)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowMemberSelection(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Group
                </Button>
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading conversations...</span>
                  </div>
                ) : (
                  <>
                    {conversations.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Recent Conversations</h3>
                        {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          "hover:bg-accent/50",
                          activeConversation?.id === conversation.id && "bg-accent"
                        )}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <div className="relative">
                          {conversation.isGroup ? (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.participants[0]?.avatar} />
                              <AvatarFallback>
                                {conversation.participants[0]?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {!conversation.isGroup && conversation.participants[0]?.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {conversation.name}
                            </h4>
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage.senderName === 'You' ? 'You: ' : ''}{conversation.lastMessage.content}
                            </p>
                          )}
                          
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Team Members List */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Team Members</h3>
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => startDirectMessage(member)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                          member.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {member.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {member.title} • {member.department}
                          </p>
                          <span className={cn(
                            "text-xs",
                            member.isOnline ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {member.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {activeConversation.messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">Start a conversation</h3>
                        <p className="text-sm text-muted-foreground">
                          Send a message to {activeConversation.name}
                        </p>
                      </div>
                    ) : (
                      activeConversation.messages.map((message) => {
                        const isCurrentUser = message.senderId === currentUserId || message.senderId === 'current-user'
                        
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              isCurrentUser ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isCurrentUser && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.senderAvatar} />
                                <AvatarFallback className="text-xs">
                                  {message.senderName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              isCurrentUser && "items-end"
                            )}>
                              <Card className={cn(
                                "p-3",
                                isCurrentUser 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                <CardContent className="p-0">
                                  <p className="text-sm whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <div className={cn(
                                "flex items-center gap-2 text-xs text-muted-foreground",
                                isCurrentUser ? "justify-end" : "justify-start"
                              )}>
                                <span>{formatMessageTime(message.timestamp)}</span>
                              </div>
                            </div>
                            
                            {isCurrentUser && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  You
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-card/30">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder={`Message ${activeConversation.name}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[40px] max-h-[120px] resize-none"
                        rows={1}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        onClick={sendMessage}
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
                <div className="text-center max-w-md">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a team member to start chatting, or create a new group conversation
                  </p>
                  <Button onClick={() => setShowMemberSelection(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member Selection Modal for Group Chat */}
        <Dialog open={showMemberSelection} onOpenChange={setShowMemberSelection}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Group Chat</DialogTitle>
              <DialogDescription>
                Select team members to include in the group conversation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                        selectedMembers.includes(member.id) 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-accent border-border"
                      )}
                      onClick={() => {
                        setSelectedMembers(prev => 
                          prev.includes(member.id)
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        )
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        selectedMembers.includes(member.id)
                          ? "bg-primary border-primary"
                          : "border-border"
                      )}>
                        {selectedMembers.includes(member.id) && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowMemberSelection(false)
                      setSelectedMembers([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={startNewConversation}
                    disabled={selectedMembers.length === 0}
                  >
                    {selectedMembers.length === 1 ? 'Start Chat' : 'Create Group'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

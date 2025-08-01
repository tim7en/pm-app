"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import DOMPurify from 'dompurify'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  Minimize2, 
  Maximize2,
  Users,
  Search,
  Plus,
  Paperclip,
  Smile,
  Circle,
  UserPlus,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import MessagingErrorBoundary from "./messaging-error-boundary"

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
  workspaceRole?: string
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

interface Conversation {
  id: string
  participants: TeamMember[]
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  groupName?: string
  type: 'internal'
  createdAt?: Date
  updatedAt?: Date
}

interface TeamChatDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: string
}

export function TeamChatDialog({
  isOpen,
  onOpenChange,
  workspaceId
}: TeamChatDialogProps) {
  return (
    <MessagingErrorBoundary>
      <TeamChatDialogContent 
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        workspaceId={workspaceId}
      />
    </MessagingErrorBoundary>
  )
}

function TeamChatDialogContent({
  isOpen,
  onOpenChange,
  workspaceId
}: TeamChatDialogProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMemberSelection, setShowMemberSelection] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectingConversation, setSelectingConversation] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Get current user ID and name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authUser = localStorage.getItem('auth-user')
      if (authUser) {
        const user = JSON.parse(authUser)
        setCurrentUserId(user.id)
        setCurrentUserName(user.name || user.email)
      }
    }
  }, [])

  // Clear conversations and load team members when dialog opens
  useEffect(() => {
    if (isOpen && currentUserId) {
      // Clear conversations when dialog opens to start fresh
      setConversations([])
      setActiveConversation(null)
      
      // Only load team members
      loadTeamMembers()
    }
  }, [isOpen, workspaceId, currentUserId])

  // Enhanced error handling for API calls
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`API Error in ${context}:`, error)
    
    let errorMessage = 'An unexpected error occurred'
    let shouldRetry = false
    
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      errorMessage = 'Network connection failed. Please check your internet connection.'
      shouldRetry = true
    } else if (error.status === 401) {
      errorMessage = 'Session expired. Please log in again.'
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.'
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.'
      shouldRetry = true
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
      shouldRetry = true
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
      action: shouldRetry ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            // Retry logic would go here based on context
            console.log(`Retrying ${context}`)
          }}
        >
          Retry
        </Button>
      ) : undefined
    })
    
    return { errorMessage, shouldRetry }
  }, [toast])

  // Load team members with improved error handling
  const loadTeamMembers = async () => {
    if (isLoading) return // Prevent concurrent requests
    
    try {
      const currentWorkspaceId = workspaceId || 
        (typeof window !== 'undefined' ? localStorage.getItem('currentWorkspaceId') : null) || 
        'default-workspace'
      
      if (!currentWorkspaceId || currentWorkspaceId === 'null') {
        console.warn('No valid workspace ID found, cannot load team members')
        toast({
          title: "No Workspace Selected",
          description: "Please select a workspace to view team members",
          variant: "destructive"
        })
        return
      }

      setIsLoading(true)
      const response = await fetch(`/api/messages/team-members?workspaceId=${currentWorkspaceId}`)
      
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          message: `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const data = await response.json()
      if (data.success && data.members) {
        setTeamMembers(data.members)
      } else {
        console.warn('Team members API returned no data:', data)
        setTeamMembers([])
        toast({
          title: "No Data",
          description: "No team members found for this workspace",
          variant: "default"
        })
      }
    } catch (error) {
      handleApiError(error, 'loading team members')
      setTeamMembers([]) // Set empty array as fallback
    } finally {
      setIsLoading(false)
    }
  }

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages/internal?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          const messages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.sender.id,
            senderName: msg.sender.name || msg.sender.email,
            senderAvatar: msg.sender.avatar,
            timestamp: new Date(msg.timestamp),
            isRead: msg.isRead
          }))
          
          // Update conversations with messages
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, messages, unreadCount: 0 }
                : conv
            )
          )
          
          // Update active conversation if it matches
          setActiveConversation(prev => {
            if (prev && prev.id === conversationId) {
              return { ...prev, messages, unreadCount: 0 }
            }
            return prev
          })

          // Mark messages as read
          await fetch('/api/messages/internal', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
          })

          // Scroll to bottom after messages are loaded
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
            }
          }, 150)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Handle conversation selection
  const handleConversationSelect = async (conversation: Conversation) => {
    if (selectingConversation) return // Prevent double-clicks
    
    setSelectingConversation(true)
    setShowMemberSelection(false)
    setLoadingMessages(true)
    
    try {
      // Set active conversation with empty messages initially to ensure UI renders
      const conversationWithMessages = {
        ...conversation,
        messages: conversation.messages || []
      }
      setActiveConversation(conversationWithMessages)
      
      // Load messages and ensure the active conversation is updated with the latest data
      await loadMessages(conversation.id)
      
      // Clear unread count for this conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
      
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
    } catch (error) {
      console.error('Error selecting conversation:', error)
      // Even if loading fails, set the conversation so the UI doesn't break
      setActiveConversation({
        ...conversation,
        messages: conversation.messages || []
      })
      toast({
        title: "Error",
        description: "Failed to load conversation messages",
        variant: "destructive"
      })
    } finally {
      setSelectingConversation(false)
    }
  }

  // Auto-scroll to bottom when messages change or conversation opens
  useEffect(() => {
    if (!messagesEndRef.current || !activeConversation) return

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // Immediate scroll for conversation change
    if (activeConversation?.id) {
      scrollToBottom()
    }

    // Delayed scroll for new messages
    const timeoutId = setTimeout(scrollToBottom, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [activeConversation?.messages, activeConversation?.id, loadingMessages])

  // Clean up duplicate conversations and invalid entries
  const deduplicateConversations = useCallback(() => {
    setConversations(prev => {
      // Remove duplicates and invalid entries
      const seenIds = new Set<string>()
      const seenParticipants = new Set<string>()
      
      const cleanedConversations = prev.filter(conversation => {
        // Remove if no ID or duplicate ID
        if (!conversation.id || seenIds.has(conversation.id)) {
          return false
        }
        
        // For direct messages, check for duplicate participants
        if (!conversation.isGroup && conversation.participants.length > 0) {
          const participantKey = conversation.participants
            .map(p => p.id)
            .sort()
            .join('-')
          
          if (seenParticipants.has(participantKey)) {
            return false // Remove duplicate participant conversation
          }
          seenParticipants.add(participantKey)
        }
        
        seenIds.add(conversation.id)
        return true
      })
      
      return cleanedConversations.length !== prev.length ? cleanedConversations : prev
    })
  }, [])

  // Debounce deduplication to prevent excessive calls
  useEffect(() => {
    const timeoutId = setTimeout(deduplicateConversations, 500)
    return () => clearTimeout(timeoutId)
  }, [conversations.length, deduplicateConversations])

  // Clear recent conversations
  const clearRecentConversations = () => {
    setConversations([])
    if (activeConversation) {
      setActiveConversation(null)
    }
    setShowClearConfirm(false)
    toast({
      title: "Conversations Cleared",
      description: "All recent conversations have been cleared from the list",
    })
  }

  // Generate unique temporary conversation ID
  const generateTempConversationId = (memberId: string) => {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${memberId}`
  }

  // Helper function to safely add conversation without duplicates
  const addConversationSafely = (newConversation: Conversation) => {
    setConversations(prev => {
      // Check if conversation already exists
      const existingIndex = prev.findIndex(conv => 
        conv.id === newConversation.id || 
        (!conv.isGroup && !newConversation.isGroup && 
         conv.participants.some(p => newConversation.participants.some(np => np.id === p.id)))
      )
      
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev]
        updated[existingIndex] = newConversation
        return updated
      } else {
        // Add new conversation
        return [newConversation, ...prev]
      }
    })
  }

  // Start direct message with a specific member
  const startDirectMessage = async (member: TeamMember) => {
    setLoadingMessages(true)
    try {
      // Check if conversation already exists in current list
      const existingConv = conversations.find(conv => 
        !conv.isGroup && conv.participants.some(p => p.id === member.id)
      )

      if (existingConv) {
        setActiveConversation(existingConv)
        // Always load messages to ensure we have the latest
        await loadMessages(existingConv.id)
      } else {
        // Try to load existing conversation with this member from backend
        try {
          const response = await fetch(`/api/messages/internal?participantId=${member.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.conversation) {
              // Found existing conversation, add it to the list
              const conversation: Conversation = {
                id: data.conversation.id,
                participants: [member],
                messages: [],
                lastMessage: data.conversation.lastMessage ? {
                  id: data.conversation.lastMessage.id,
                  content: data.conversation.lastMessage.content,
                  senderId: data.conversation.lastMessage.sender.id,
                  senderName: data.conversation.lastMessage.sender.name,
                  senderAvatar: data.conversation.lastMessage.sender.avatar,
                  timestamp: new Date(data.conversation.lastMessage.timestamp),
                  isRead: data.conversation.lastMessage.isRead
                } : undefined,
                unreadCount: data.conversation.unreadCount || 0,
                isGroup: false,
                type: 'internal'
              }
              
              addConversationSafely(conversation)
              setActiveConversation(conversation)
              // Load messages for this conversation
              await loadMessages(conversation.id)
            } else {
              // No existing conversation, create a new empty one
              const newConversation: Conversation = {
                id: generateTempConversationId(member.id),
                participants: [member],
                messages: [],
                lastMessage: undefined,
                unreadCount: 0,
                isGroup: false,
                type: 'internal'
              }
              
              addConversationSafely(newConversation)
              setActiveConversation(newConversation)
            }
          } else {
            // API error, create temporary conversation
            const newConversation: Conversation = {
              id: generateTempConversationId(member.id),
              participants: [member],
              messages: [],
              lastMessage: undefined,
              unreadCount: 0,
              isGroup: false,
              type: 'internal'
            }
            
            addConversationSafely(newConversation)
            setActiveConversation(newConversation)
          }
        } catch (apiError) {
          console.error('Error checking for existing conversation:', apiError)
          // Fallback to temporary conversation
          const newConversation: Conversation = {
            id: generateTempConversationId(member.id),
            participants: [member],
            messages: [],
            lastMessage: undefined,
            unreadCount: 0,
            isGroup: false,
            type: 'internal'
          }
          
          addConversationSafely(newConversation)
          setActiveConversation(newConversation)
        }
      }
      setShowMemberSelection(false)
      
      // Scroll to bottom after conversation is set
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  // Send a message
  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage || !activeConversation) return

    // Sanitize message content before sending
    const sanitizedContent = sanitizeMessage(trimmedMessage)
    if (!sanitizedContent) {
      toast({
        title: "Invalid Message",
        description: "Message content contains invalid characters",
        variant: "destructive"
      })
      return
    }

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: sanitizedContent,
      senderId: currentUserId,
      senderName: currentUserName || 'You',
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

    // Scroll to bottom immediately after adding the message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 50)

    try {
      // Send to backend
      const participant = getOtherParticipant(activeConversation)
      const isNewConversation = activeConversation.id.startsWith('conv-')
      
      const requestBody: any = {
        receiverId: participant.id,
        content: sanitizedContent
      }
      
      // Only include conversationId if this is an existing conversation
      if (!isNewConversation) {
        requestBody.conversationId = activeConversation.id
      }
      
      const response = await fetch('/api/messages/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        // Replace temporary message with real one
        const realMessage = {
          id: data.message.id,
          content: data.message.content,
          senderId: data.message.senderId,
          senderName: data.message.sender.name,
          senderAvatar: data.message.sender.avatar,
          timestamp: new Date(data.message.timestamp),
          isRead: data.message.isRead
        }

        const realConversationId = data.conversationId || activeConversation.id
        // isNewConversation is already declared above

        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversation.id 
              ? {
                  ...conv,
                  id: realConversationId, // Update with real conversation ID if it was temporary
                  messages: conv.messages.map(msg => 
                    msg.id === tempMessage.id ? realMessage : msg
                  ),
                  lastMessage: realMessage
                }
              : conv
          )
        )

        setActiveConversation(prev => prev ? {
          ...prev,
          id: realConversationId, // Update with real conversation ID if it was temporary
          messages: prev.messages.map(msg => 
            msg.id === tempMessage.id ? realMessage : msg
          )
        } : null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Sanitize message content to prevent XSS
  const sanitizeMessage = useCallback((content: string) => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    })
  }, [])

  // Format message time
  const formatMessageTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    if (!date || isNaN(date.getTime())) {
      return 'Unknown'
    }
    return format(date, 'HH:mm')
  }

  // Format last seen time
  const formatLastSeen = (date: Date | string) => {
    const now = new Date()
    const targetDate = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (!targetDate || isNaN(targetDate.getTime())) {
      return 'Unknown'
    }
    
    const diffMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Get conversation display name (always show the other person)
  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.groupName || 'Group Chat'
    }
    
    // Find the participant that is not the current user
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId)
    return otherParticipant?.name || 'Unknown User'
  }

  // Get the other participant in a conversation (not the current user)
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== currentUserId) || conversation.participants[0]
  }

  // Generate consistent colors for users
  const getUserColor = (userId: string, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return {
        bg: 'bg-blue-600',
        text: 'text-white',
        border: 'border-l-blue-600',
        avatar: 'bg-blue-600 text-white',
        name: 'text-blue-700 dark:text-blue-300',
        timestamp: 'text-blue-100',
        checkmarks: 'text-blue-300'
      }
    }

    // Generate consistent color based on userId hash
    const colors = [
      {
        bg: 'bg-emerald-600',
        text: 'text-white', 
        border: 'border-r-emerald-600',
        avatar: 'bg-emerald-600 text-white',
        name: 'text-emerald-700 dark:text-emerald-300',
        timestamp: 'text-emerald-100',
        checkmarks: 'text-emerald-300'
      },
      {
        bg: 'bg-purple-600',
        text: 'text-white',
        border: 'border-r-purple-600', 
        avatar: 'bg-purple-600 text-white',
        name: 'text-purple-700 dark:text-purple-300',
        timestamp: 'text-purple-100',
        checkmarks: 'text-purple-300'
      },
      {
        bg: 'bg-orange-600',
        text: 'text-white',
        border: 'border-r-orange-600',
        avatar: 'bg-orange-600 text-white', 
        name: 'text-orange-700 dark:text-orange-300',
        timestamp: 'text-orange-100',
        checkmarks: 'text-orange-300'
      },
      {
        bg: 'bg-pink-600',
        text: 'text-white',
        border: 'border-r-pink-600',
        avatar: 'bg-pink-600 text-white',
        name: 'text-pink-700 dark:text-pink-300', 
        timestamp: 'text-pink-100',
        checkmarks: 'text-pink-300'
      },
      {
        bg: 'bg-teal-600',
        text: 'text-white',
        border: 'border-r-teal-600',
        avatar: 'bg-teal-600 text-white',
        name: 'text-teal-700 dark:text-teal-300',
        timestamp: 'text-teal-100', 
        checkmarks: 'text-teal-300'
      },
      {
        bg: 'bg-indigo-600',
        text: 'text-white',
        border: 'border-r-indigo-600',
        avatar: 'bg-indigo-600 text-white',
        name: 'text-indigo-700 dark:text-indigo-300',
        timestamp: 'text-indigo-100',
        checkmarks: 'text-indigo-300'
      }
    ]

    // Simple hash function to get consistent color index
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    const colorIndex = Math.abs(hash) % colors.length
    return colors[colorIndex]
  }

  // Optimized search filtering with memoization
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return teamMembers.filter(member => member.id !== currentUserId)
    }
    
    const searchLower = searchQuery.toLowerCase()
    
    return teamMembers
      .filter(member => member.id !== currentUserId)
      .filter(member => {
        const nameMatch = member.name?.toLowerCase().includes(searchLower)
        const emailMatch = member.email?.toLowerCase().includes(searchLower)
        const deptMatch = member.department?.toLowerCase().includes(searchLower)
        return nameMatch || emailMatch || deptMatch
      })
      .filter((member, index, array) => 
        // Ensure unique member IDs
        array.findIndex(m => m.id === member.id) === index
      )
  }, [teamMembers, searchQuery, currentUserId])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 border-0 shadow-2xl overflow-hidden",
          isExpanded ? "max-w-7xl w-[90vw] h-[85vh]" : "max-w-5xl w-[80vw] h-[75vh]"
        )}
        aria-describedby="team-chat-description"
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeConversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setActiveConversation(null)}
                  aria-label="Go back to team member list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle>
                  {activeConversation 
                    ? getConversationDisplayName(activeConversation)
                    : 'Team Communication'
                  }
                </DialogTitle>
                <DialogDescription>
                  {activeConversation 
                    ? `${activeConversation.participants.length} participant${activeConversation.participants.length !== 1 ? 's' : ''}`
                    : `${teamMembers.filter(m => m.id !== currentUserId).length} team members available`
                  }
                </DialogDescription>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 ml-4"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? "Minimize dialog" : "Maximize dialog"}
                title={isExpanded ? "Minimize dialog" : "Maximize dialog"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Space for dialog's built-in close button */}
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-full min-h-0 overflow-hidden">
          {!activeConversation ? (
            // Team Members & Conversations List
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4">
                  {/* Recent Conversations */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Recent Conversations</h3>
                      {conversations.length > 0 && (
                        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                              title="Clear all conversations"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Clear
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear Recent Conversations</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove all recent conversations from your list. This action cannot be undone, 
                                but your message history will remain intact and conversations will reappear when you receive new messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={clearRecentConversations}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Clear All
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    {selectingConversation && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        <span className="text-xs text-muted-foreground">Opening conversation...</span>
                      </div>
                    )}
                    {conversations.length > 0 ? (
                      <div className="space-y-2">
                        {conversations
                          .slice(0, 5)
                          .filter((conversation, index, array) => 
                            // Remove duplicates by ensuring unique IDs
                            array.findIndex(c => c.id === conversation.id) === index
                          )
                          .map((conversation) => (
                          <div
                            key={`conversation-${conversation.id}`}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
                              selectingConversation && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !selectingConversation && handleConversationSelect(conversation)}
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getOtherParticipant(conversation)?.avatar} />
                                <AvatarFallback>
                                  {getOtherParticipant(conversation)?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {getOtherParticipant(conversation)?.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {getConversationDisplayName(conversation)}
                                </h4>
                                {conversation.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              
                              {conversation.lastMessage && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}{conversation.lastMessage.content}
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
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <div className="text-center space-y-2">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-sm text-muted-foreground">No recent conversations</p>
                          <p className="text-xs text-muted-foreground">Start a conversation with a team member below</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Team Members</h3>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading team members...</span>
                      </div>
                    ) : filteredMembers.length > 0 ? (
                      <div className="space-y-2">
                        {filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
                            onClick={() => startDirectMessage(member)}
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>
                                  {member.name ? member.name.split(' ').map(n => n[0]).join('') : 'U'}
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
                                <div className="flex items-center gap-2">
                                  {member.workspaceRole && (
                                    <Badge variant="outline" className="text-xs">
                                      {member.workspaceRole}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {member.isOnline ? 'Online' : member.lastSeen ? formatLastSeen(member.lastSeen) : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center space-y-2">
                          <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {searchQuery ? 'No team members match your search' : 'No team members found'}
                          </p>
                          {searchQuery ? (
                            <p className="text-xs text-muted-foreground">Try adjusting your search terms</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Current workspace: {workspaceId || (typeof window !== 'undefined' ? localStorage.getItem('currentWorkspaceId') : null) || 'Not set'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Current user: {currentUserId || 'Not logged in'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Total team members loaded: {teamMembers.length}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Chat View
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                  </div>
                ) : !activeConversation?.messages || activeConversation.messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                        <div className="absolute -top-1 -right-1">
                          <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Plus className="h-2 w-2 text-white" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-2">Start the conversation!</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                          Send a message to {getOtherParticipant(activeConversation)?.name} to begin your conversation. 
                          Your messages will be saved and remain accessible even when they're offline.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(activeConversation?.messages || []).map((message, index) => {
                      const isCurrentUser = message.senderId === currentUserId
                      const messages = activeConversation?.messages || []
                      const showDate = index === 0 || 
                        format(message.timestamp, 'yyyy-MM-dd') !== format(messages[index - 1]?.timestamp, 'yyyy-MM-dd')
                      
                      const userColors = getUserColor(message.senderId, isCurrentUser)
                      
                      return (
                        <div 
                          key={message.id}
                          className="animate-in fade-in duration-300"
                        >
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <Badge variant="outline" className="text-xs">
                                {format(message.timestamp, 'MMMM d, yyyy')}
                              </Badge>
                            </div>
                          )}
                          
                          <div className={cn(
                            "flex gap-3",
                            isCurrentUser ? "justify-end flex-row-reverse" : "justify-start"
                          )}>
                            <div className="flex flex-col items-center">
                              <Avatar className="h-8 w-8">
                                {isCurrentUser ? (
                                  <AvatarFallback className={`text-xs font-medium ${userColors.avatar}`}>
                                    {currentUserName ? currentUserName.split(' ').map(n => n[0]).join('') : 'You'}
                                  </AvatarFallback>
                                ) : (
                                  <>
                                    <AvatarImage src={message.senderAvatar} alt={message.senderName || 'Unknown'} />
                                    <AvatarFallback className={`text-xs font-medium ${userColors.avatar}`}>
                                      {(message.senderName || 'Unknown').split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </>
                                )}
                              </Avatar>
                            </div>
                            
                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              isCurrentUser ? "items-end" : "items-start"
                            )}>
                              {!isCurrentUser && (
                                <div className={`text-xs font-medium mb-1 ml-1 ${userColors.name}`}>
                                  {message.senderName || 'Unknown'}
                                </div>
                              )}
                              
                              <div className={cn(
                                "relative px-4 py-3 rounded-2xl shadow-sm",
                                isCurrentUser 
                                  ? `${userColors.bg} ${userColors.text} rounded-br-md` 
                                  : `${userColors.bg} ${userColors.text} rounded-bl-md`
                              )}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {sanitizeMessage(message.content)}
                                </p>
                                
                                {/* Message tail/pointer */}
                                <div className={cn(
                                  "absolute top-0 w-0 h-0",
                                  isCurrentUser
                                    ? `right-0 border-l-[8px] ${userColors.border.replace('border-r-', 'border-l-')} border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent -mr-2`
                                    : `left-0 border-r-[8px] ${userColors.border} border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent -ml-2`
                                )} />
                              </div>
                              
                              <div className={cn(
                                "flex items-center gap-2 text-xs px-1",
                                isCurrentUser ? `justify-end ${userColors.timestamp}` : `justify-start ${userColors.timestamp}`
                              )}>
                                <span>{formatMessageTime(message.timestamp)}</span>
                                {isCurrentUser && (
                                  <div className="flex items-center">
                                    {message.isRead ? (
                                      <>
                                        <CheckCheck className={`h-3 w-3 ${userColors.checkmarks}`} />
                                        <span className={`text-xs ml-1 ${userColors.checkmarks}`}>Read</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className={`h-3 w-3 ${userColors.checkmarks}`} />
                                        <span className={`text-xs ml-1 ${userColors.checkmarks}`}>Sent</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-background/50 backdrop-blur-sm shrink-0">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Textarea
                        placeholder={`Message ${getOtherParticipant(activeConversation)?.name || 'team member'}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="resize-none border-2 focus:border-blue-500 transition-colors max-h-32"
                        rows={1}
                        onKeyDown={handleKeyPress}
                      />
                      <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">
                        Press Enter to send
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-10 w-10">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 w-10">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Messages are saved and persist across sessions</span>
                  {getOtherParticipant(activeConversation)?.isOnline ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Circle className="h-2 w-2 fill-current" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-current text-gray-400" />
                      Offline - will receive when online
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

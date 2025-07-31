import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { 
  Message, 
  Conversation, 
  EmailFolder, 
  EmailDraft, 
  GmailMessage, 
  EmailClassification,
  MessengerState 
} from '@/types/messenger'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  isOnline: boolean
  lastSeen: Date
  workspaceRole: string
}

export function useMessenger() {
  const [state, setState] = useState<MessengerState>({
    conversations: [],
    activeConversation: null,
    messages: [],
    emailFolders: [
      { id: 'INBOX', name: 'Inbox', count: 0, unreadCount: 0, icon: 'Inbox' },
      { id: 'SENT', name: 'Sent', count: 0, unreadCount: 0, icon: 'Send' },
      { id: 'DRAFT', name: 'Drafts', count: 0, unreadCount: 0, icon: 'FileText' },
      { id: 'SPAM', name: 'Spam', count: 0, unreadCount: 0, icon: 'Shield' },
      { id: 'TRASH', name: 'Trash', count: 0, unreadCount: 0, icon: 'Trash' }
    ],
    activeFolder: 'INTERNAL',
    searchQuery: '',
    loading: false,
    composing: false,
    draftEmail: null
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

  const { toast } = useToast()

  // Get current workspace ID from localStorage or context
  useEffect(() => {
    const workspaceId = localStorage.getItem('currentWorkspaceId') || 'default-workspace'
    setCurrentWorkspaceId(workspaceId)
  }, [])

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!currentWorkspaceId) return

    try {
      const response = await fetch(`/api/messages/team-members?workspaceId=${currentWorkspaceId}`)
      const data = await response.json()
      
      if (response.ok) {
        setTeamMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }, [currentWorkspaceId])

  // Fetch conversations based on active folder
  const fetchConversations = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      if (state.activeFolder === 'INTERNAL') {
        // Fetch internal conversations
        const response = await fetch('/api/messages/internal')
        const data = await response.json()
        
        if (response.ok) {
          setState(prev => ({ 
            ...prev, 
            conversations: data.conversations,
            loading: false 
          }))
        }
      } else if (state.activeFolder === 'TEAMS') {
        // Create conversations from team members
        const teamConversations = teamMembers.map(member => ({
          id: `team-${member.id}`,
          participants: [
            {
              id: 'current-user',
              name: 'You',
              email: 'current@user.com'
            },
            {
              id: member.id,
              name: member.name,
              email: member.email,
              avatar: member.avatar
            }
          ],
          lastMessage: {
            content: member.isOnline ? 'Online now' : `Last seen ${formatTimeAgo(member.lastSeen)}`,
            timestamp: member.lastSeen,
            senderId: member.id
          },
          unreadCount: 0,
          isGroup: false,
          type: 'internal' as const,
          isOnline: member.isOnline
        }))

        setState(prev => ({ 
          ...prev, 
          conversations: teamConversations,
          loading: false 
        }))
      } else if (state.activeFolder === 'INBOX' || state.activeFolder === 'SENT' || 
          state.activeFolder === 'DRAFT' || state.activeFolder === 'SPAM' || 
          state.activeFolder === 'TRASH') {
        // Fetch Gmail messages (keeping existing mock for now)
        const response = await fetch(`/api/messages/gmail?folder=${state.activeFolder}`)
        const data = await response.json()
        
        if (response.ok) {
          const emailConversations = await Promise.all(
            data.emails.map(async (email: GmailMessage) => {
              const classification = await classifyEmail(email.snippet)
              
              const fromHeader = email.payload.headers.find(h => h.name === 'From')
              const subjectHeader = email.payload.headers.find(h => h.name === 'Subject')
              
              return {
                id: email.id,
                participants: [
                  {
                    id: 'current-user',
                    name: 'You',
                    email: 'current@user.com'
                  },
                  {
                    id: email.id + '-sender',
                    name: fromHeader?.value.split('<')[0].trim() || 'Unknown',
                    email: fromHeader?.value.match(/<(.+)>/)?.[1] || fromHeader?.value || 'unknown@email.com'
                  }
                ],
                lastMessage: {
                  content: email.snippet,
                  timestamp: new Date(parseInt(email.internalDate)),
                  senderId: email.id + '-sender'
                },
                unreadCount: email.isRead ? 0 : 1,
                isGroup: false,
                type: 'email' as const,
                emailFolder: state.activeFolder as any
              }
            })
          )
          
          setState(prev => ({ 
            ...prev, 
            conversations: emailConversations,
            loading: false 
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setState(prev => ({ ...prev, loading: false }))
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive"
      })
    }
  }, [state.activeFolder, teamMembers, toast])

  // Fetch messages for active conversation
  useEffect(() => {
    if (state.activeConversation && state.activeConversation.type === 'internal') {
      fetchMessages(state.activeConversation.id)
    }
  }, [state.activeConversation])

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/internal?conversationId=${conversationId}`)
      const data = await response.json()
      
      if (response.ok) {
        setState(prev => ({ ...prev, messages: data.messages }))
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Classify email using AI
  const classifyEmail = async (emailContent: string): Promise<EmailClassification | null> => {
    try {
      const response = await fetch('/api/messages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'classify',
          emailContent
        })
      })
      
      const data = await response.json()
      return response.ok ? data.classification : null
    } catch (error) {
      console.error('Error classifying email:', error)
      return null
    }
  }

  // Generate AI draft reply
  const generateDraftReply = async (originalContent: string, context?: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/messages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft_reply',
          emailContent: originalContent,
          context
        })
      })
      
      const data = await response.json()
      return response.ok ? data.draftReply : null
    } catch (error) {
      console.error('Error generating draft reply:', error)
      toast({
        title: "Error",
        description: "Failed to generate AI draft reply",
        variant: "destructive"
      })
      return null
    }
  }

  // Send or save email
  const sendEmail = async (emailData: EmailDraft, isDraft = false) => {
    try {
      const response = await fetch('/api/messages/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailData,
          isDraft
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message
        })
        
        if (!isDraft) {
          setState(prev => ({ 
            ...prev, 
            composing: false, 
            draftEmail: null 
          }))
        }
        
        // Refresh conversations
        fetchConversations()
        return true
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      })
      return false
    }
  }

  // Upload attachment
  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/messages/attachments', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      return response.ok ? data.url : null
    } catch (error) {
      console.error('Error uploading attachment:', error)
      toast({
        title: "Error",
        description: "Failed to upload attachment",
        variant: "destructive"
      })
      return null
    }
  }

  // Set active conversation
  const setActiveConversation = (conversation: Conversation | null) => {
    setState(prev => ({ ...prev, activeConversation: conversation }))
  }

  // Set active folder
  const setActiveFolder = (folder: string) => {
    setState(prev => ({ 
      ...prev, 
      activeFolder: folder,
      activeConversation: null 
    }))
  }

  // Set search query
  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  // Start composing
  const startComposing = (draft?: EmailDraft) => {
    setState(prev => ({ 
      ...prev, 
      composing: true, 
      draftEmail: draft || {
        to: '',
        subject: '',
        body: ''
      }
    }))
  }

  // Stop composing
  const stopComposing = () => {
    setState(prev => ({ 
      ...prev, 
      composing: false, 
      draftEmail: null 
    }))
  }

  // Update draft email
  const updateDraftEmail = (updates: Partial<EmailDraft>) => {
    setState(prev => ({
      ...prev,
      draftEmail: prev.draftEmail ? { ...prev.draftEmail, ...updates } : null
    }))
  }

  // Filter conversations based on search
  const filteredConversations = state.conversations.filter(conv => {
    if (!state.searchQuery) return true
    
    const searchLower = state.searchQuery.toLowerCase()
    const participantNames = conv.participants.map(p => p.name.toLowerCase()).join(' ')
    const participantEmails = conv.participants.map(p => p.email?.toLowerCase() || '').join(' ')
    const groupName = conv.groupName?.toLowerCase() || ''
    const lastMessage = conv.lastMessage.content.toLowerCase()
    
    return (
      participantNames.includes(searchLower) ||
      participantEmails.includes(searchLower) ||
      groupName.includes(searchLower) ||
      lastMessage.includes(searchLower)
    )
  })

  // Send internal message
  const sendInternalMessage = async (content: string, receiverId?: string) => {
    try {
      const targetReceiverId = receiverId || (state.activeConversation?.participants.find(p => p.id !== 'current-user')?.id)
      
      if (!targetReceiverId) {
        toast({
          title: "Error",
          description: "No recipient selected",
          variant: "destructive"
        })
        return false
      }

      const response = await fetch('/api/messages/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: targetReceiverId,
          content,
          conversationId: state.activeConversation?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Add message to current messages
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, data.message]
        }))
        
        // Refresh conversations to update last message
        fetchConversations()
        return true
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
      return false
    }
  }

  // Initialize
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchTeamMembers()
    }
  }, [currentWorkspaceId, fetchTeamMembers])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    ...state,
    teamMembers,
    filteredConversations,
    setActiveConversation,
    setActiveFolder,
    setSearchQuery,
    startComposing,
    stopComposing,
    updateDraftEmail,
    sendEmail,
    sendInternalMessage,
    generateDraftReply,
    uploadAttachment,
    fetchConversations,
    fetchTeamMembers,
    classifyEmail
  }
}

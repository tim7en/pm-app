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
    activeFolder: 'INBOX',
    searchQuery: '',
    loading: false,
    composing: false,
    draftEmail: null
  })

  const { toast } = useToast()

  // Fetch conversations based on active folder
  const fetchConversations = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      if (state.activeFolder === 'INBOX' || state.activeFolder === 'SENT' || 
          state.activeFolder === 'DRAFT' || state.activeFolder === 'SPAM' || 
          state.activeFolder === 'TRASH') {
        // Fetch Gmail messages
        const response = await fetch(`/api/messages/gmail?folder=${state.activeFolder}`)
        const data = await response.json()
        
        if (response.ok) {
          const emailConversations = await Promise.all(
            data.emails.map(async (email: GmailMessage) => {
              // Get AI classification for each email
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
      } else {
        // Fetch internal messages (existing functionality)
        // This would be your existing conversation fetching logic
        setState(prev => ({ ...prev, loading: false }))
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
  }, [state.activeFolder, toast])

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

  // Initialize
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    ...state,
    filteredConversations,
    setActiveConversation,
    setActiveFolder,
    setSearchQuery,
    startComposing,
    stopComposing,
    updateDraftEmail,
    sendEmail,
    generateDraftReply,
    uploadAttachment,
    fetchConversations,
    classifyEmail
  }
}

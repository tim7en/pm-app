export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
      size?: number
    }
    parts?: Array<{
      mimeType: string
      filename?: string
      body?: {
        data?: string
        size?: number
      }
    }>
  }
  internalDate: string
  labelIds: string[]
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
  hasAttachments: boolean
}

export interface EmailClassification {
  priority: 'high' | 'medium' | 'low'
  category: string
  requiresAction: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
}

export interface EmailDraft {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  threadId?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: string
  url?: string
  thumbnailUrl?: string
}

export interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
  receiver: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
  timestamp: Date
  isRead: boolean
  attachments?: Attachment[]
  type: 'internal' | 'email'
  priority?: 'high' | 'medium' | 'low'
  category?: string
  requiresAction?: boolean
  aiClassification?: EmailClassification
}

export interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
    email?: string
  }>
  lastMessage: {
    content: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
  isGroup: boolean
  groupName?: string
  type: 'internal' | 'email'
  emailFolder?: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH'
}

export interface EmailFolder {
  id: string
  name: string
  count: number
  unreadCount: number
  icon: string
}

export interface MessengerState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  emailFolders: EmailFolder[]
  activeFolder: string
  searchQuery: string
  loading: boolean
  composing: boolean
  draftEmail: EmailDraft | null
}

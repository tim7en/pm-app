export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  workspaceId: string
  attachments?: MessageAttachment[]
  mediaFiles?: MediaFile[]
  timestamp: Date
  read: boolean
  edited?: boolean
  editedAt?: Date
  replyTo?: string
  messageType: 'text' | 'media' | 'file' | 'voice'
}

export interface MessageAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  thumbnail?: string
}

export interface MediaFile {
  id: string
  type: 'image' | 'video' | 'audio'
  url: string
  thumbnail?: string
  duration?: number
  dimensions?: {
    width: number
    height: number
  }
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  lastActivity: Date
  unreadCount: number
  workspaceId: string
  type: 'direct' | 'group'
  name?: string
  avatar?: string
}

export interface GmailEmail {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    body: {
      data?: string
      size: number
    }
    parts?: any[]
  }
  internalDate: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  aiSuggestions?: {
    draftReply: string
    priority: string
    category: string
    actionRequired: boolean
    suggestedActions: string[]
  }
}

export interface EmailDraft {
  id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: MessageAttachment[]
  createdAt: Date
  updatedAt: Date
  isAiGenerated: boolean
  aiPrompt?: string
}

export interface EmailFolder {
  id: string
  name: string
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom'
  unreadCount: number
  totalCount: number
}

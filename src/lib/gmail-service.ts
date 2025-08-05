// Gmail API Integration Service
import { google } from 'googleapis'

export interface GmailConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface GmailToken {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body: {
      data?: string
      size: number
    }
    parts?: Array<{
      mimeType: string
      body: {
        data?: string
        size: number
      }
    }>
  }
  internalDate: string
  historyId: string
  sizeEstimate: number
}

export class GmailService {
  private oauth2Client: any
  private gmail: any

  constructor(config: GmailConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )
    
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  /**
   * Generate OAuth URL for Gmail authentication
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<GmailToken> {
    const { tokens } = await this.oauth2Client.getToken(code)
    this.oauth2Client.setCredentials(tokens)
    return tokens
  }

  /**
   * Set existing tokens
   */
  setTokens(tokens: GmailToken): void {
    this.oauth2Client.setCredentials(tokens)
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile() {
    try {
      const response = await this.gmail.users.getProfile({ userId: 'me' })
      return response.data
    } catch (error) {
      console.error('Error fetching Gmail profile:', error)
      throw error
    }
  }

  /**
   * Get unread emails from Gmail
   */
  async getUnreadEmails(maxResults: number = 10): Promise<any[]> {
    try {
      // First, get list of unread message IDs
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults
      })

      if (!listResponse.data.messages) {
        return []
      }

      // Then fetch full message details for each
      const messagePromises = listResponse.data.messages.map((message: any) =>
        this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        })
      )

      const messages = await Promise.all(messagePromises)
      return messages.map(msg => this.parseGmailMessage(msg.data))

    } catch (error) {
      console.error('Error fetching unread emails:', error)
      throw error
    }
  }

  /**
   * Parse Gmail message format to our standard format
   */
  private parseGmailMessage(message: GmailMessage): any {
    const headers = message.payload.headers || []
    
    const getHeader = (name: string) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
      return header ? header.value : ''
    }

    const subject = getHeader('Subject')
    const from = getHeader('From')
    const to = getHeader('To')
    const date = getHeader('Date')

    // Extract email body
    let body = ''
    if (message.payload.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    } else if (message.payload.parts) {
      // Handle multipart messages
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
          break
        }
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from,
      to: to ? [to] : [],
      body: body || message.snippet,
      snippet: message.snippet,
      timestamp: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds?.includes('UNREAD'),
      labels: message.labelIds || [],
      rawHeaders: headers.reduce((acc, header) => {
        acc[header.name] = header.value
        return acc
      }, {} as Record<string, string>)
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
    } catch (error) {
      console.error('Error marking email as read:', error)
      throw error
    }
  }

  /**
   * Add label to email
   */
  async addLabel(messageId: string, labelId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      })
    } catch (error) {
      console.error('Error adding label to email:', error)
      throw error
    }
  }

  /**
   * Create custom label for prospect stages
   */
  async createLabel(name: string, color?: string): Promise<string> {
    try {
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
          type: 'user',
          color: color ? {
            textColor: '#ffffff',
            backgroundColor: color
          } : undefined
        }
      })
      return response.data.id
    } catch (error) {
      console.error('Error creating Gmail label:', error)
      throw error
    }
  }

  /**
   * Get all labels
   */
  async getLabels(): Promise<any[]> {
    try {
      const response = await this.gmail.users.labels.list({ userId: 'me' })
      return response.data.labels || []
    } catch (error) {
      console.error('Error fetching Gmail labels:', error)
      throw error
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(): Promise<void> {
    try {
      await this.oauth2Client.getAccessToken()
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }
}

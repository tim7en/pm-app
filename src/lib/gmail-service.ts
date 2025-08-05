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
      console.log(`🏷️ Attempting to add label ${labelId} to message ${messageId}`)
      
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      })
      
      console.log(`✅ Successfully added label ${labelId} to message ${messageId}`)
      console.log('Response:', response.data)
      
    } catch (error) {
      console.error(`❌ Error adding label ${labelId} to email ${messageId}:`, error)
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
      throw error
    }
  }

  /**
   * Create custom label for prospect stages
   */
  async createLabel(name: string, color?: string): Promise<string> {
    try {
      console.log(`🏗️ Creating Gmail label: ${name} with color: ${color}`)
      
      // Gmail only allows specific color combinations
      // Let's use predefined valid color combinations
      const validColors = [
        { textColor: '#ffffff', backgroundColor: '#000000' }, // Black
        { textColor: '#ffffff', backgroundColor: '#434343' }, // Dark gray
        { textColor: '#000000', backgroundColor: '#666666' }, // Gray
        { textColor: '#000000', backgroundColor: '#999999' }, // Light gray
        { textColor: '#000000', backgroundColor: '#cccccc' }, // Very light gray
        { textColor: '#ffffff', backgroundColor: '#fb4c2f' }, // Red
        { textColor: '#ffffff', backgroundColor: '#ffad47' }, // Orange
        { textColor: '#000000', backgroundColor: '#fad165' }, // Yellow
        { textColor: '#ffffff', backgroundColor: '#16a766' }, // Green
        { textColor: '#ffffff', backgroundColor: '#42d692' }, // Light green
        { textColor: '#ffffff', backgroundColor: '#9fc6e7' }, // Light blue
        { textColor: '#ffffff', backgroundColor: '#4a86e8' }, // Blue
        { textColor: '#ffffff', backgroundColor: '#9a9cff' }, // Light purple
        { textColor: '#ffffff', backgroundColor: '#b99aff' }, // Purple
        { textColor: '#ffffff', backgroundColor: '#c27ba0' }, // Pink
        { textColor: '#ffffff', backgroundColor: '#f691b2' }  // Light pink
      ]

      // Map our color preferences to valid Gmail colors
      let selectedColor: { textColor: string; backgroundColor: string } | undefined = undefined
      if (color) {
        switch (color) {
          case '#3B82F6': // Blue
            selectedColor = validColors[11] // Blue
            break
          case '#10B981': // Green
            selectedColor = validColors[8] // Green
            break
          case '#F59E0B': // Yellow
            selectedColor = validColors[7] // Yellow
            break
          case '#8B5CF6': // Purple
            selectedColor = validColors[14] // Purple
            break
          case '#EF4444': // Red
            selectedColor = validColors[5] // Red
            break
          case '#059669': // Dark green
            selectedColor = validColors[8] // Green
            break
          case '#6B7280': // Gray
            selectedColor = validColors[3] // Gray
            break
          case '#F97316': // Orange
            selectedColor = validColors[6] // Orange
            break
          default:
            selectedColor = validColors[11] // Default to blue
        }
      }
      
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
          type: 'user',
          color: selectedColor
        }
      })
      
      console.log(`✅ Successfully created label ${name} with ID: ${response.data.id}`)
      return response.data.id
    } catch (error) {
      console.error(`❌ Error creating Gmail label ${name}:`, error)
      if (error instanceof Error) {
        console.error('Label creation error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
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
   * Get emails with pagination support for bulk processing
   */
  async getAllEmails(options: {
    maxResults?: number
    pageToken?: string
    query?: string
    includeSpamTrash?: boolean
  } = {}): Promise<{ emails: any[], nextPageToken?: string }> {
    try {
      const { maxResults = 50, pageToken, query = '', includeSpamTrash = false } = options
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        pageToken,
        q: query,
        includeSpamTrash
      })

      const messages = response.data.messages || []
      const emails: any[] = []

      // Fetch full message details in smaller batches to avoid rate limits
      const batchSize = 10
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        
        const messagePromises = batch.map(async (message) => {
          try {
            const fullMessage = await this.gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            })
            return this.parseGmailMessage(fullMessage.data as GmailMessage)
          } catch (error) {
            console.error(`Error fetching message ${message.id}:`, error)
            return null
          }
        })
        
        const batchResults = await Promise.all(messagePromises)
        emails.push(...batchResults.filter(email => email !== null))
        
        // Small delay to respect rate limits
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      return {
        emails,
        nextPageToken: response.data.nextPageToken
      }
    } catch (error) {
      console.error('Error fetching all emails:', error)
      throw error
    }
  }

  /**
   * Bulk apply labels to multiple emails with better error handling
   */
  async bulkApplyLabels(messageIds: string[], labelIds: string[]): Promise<{ successful: number, failed: number, errors: string[] }> {
    try {
      const batchSize = 50 // Smaller batch size for better reliability
      let successful = 0
      let failed = 0
      const errors: string[] = []
      
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (messageId) => {
          try {
            // Apply all provided labels to the message
            await this.gmail.users.messages.modify({
              userId: 'me',
              id: messageId,
              requestBody: {
                addLabelIds: labelIds
              }
            })
            return { success: true, messageId }
          } catch (error) {
            const errorMsg = `Failed to apply label to ${messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.error(errorMsg)
            return { success: false, messageId, error: errorMsg }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach(result => {
          if (result.success) {
            successful++
          } else {
            failed++
            errors.push(result.error || `Failed to apply label to ${result.messageId}`)
          }
        })
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < messageIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messageIds.length / batchSize)}: ${successful} successful, ${failed} failed`)
      }
      
      return { successful, failed, errors }
    } catch (error) {
      console.error('Error in bulk label application:', error)
      throw error
    }
  }

  /**
   * Apply a single label to a specific email with retry logic
   */
  async applyLabelWithRetry(messageId: string, labelId: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.addLabel(messageId, labelId)
        return true
      } catch (error) {
        console.error(`Attempt ${attempt}/${maxRetries} failed for message ${messageId}:`, error)
        
        if (attempt === maxRetries) {
          return false
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
    return false
  }

  /**
   * Create prospect stage labels if they don't exist
   */
  async createProspectLabels(): Promise<Record<string, string>> {
    try {
      console.log('🔍 Starting createProspectLabels...')
      const existingLabels = await this.getLabels()
      console.log(`📋 Found ${existingLabels.length} existing labels`)
      
      const labelMap: Record<string, string> = {}
      
      // Updated to match the 9 classification categories from AI analysis (including Other for errors)
      const prospectStages = [
        { name: 'AI/Personal', color: '#3B82F6' },           // Blue - Personal Communications
        { name: 'AI/Work', color: '#10B981' },               // Green - Work-Related  
        { name: 'AI/Spam-Promotions', color: '#F59E0B' },    // Orange - Marketing/Spam
        { name: 'AI/Social', color: '#8B5CF6' },             // Purple - Social Media
        { name: 'AI/Notifications-Updates', color: '#6B7280' }, // Gray - System Notifications
        { name: 'AI/Finance', color: '#059669' },            // Dark Green - Financial
        { name: 'AI/Job-Opportunities', color: '#EF4444' },  // Red - Career/Jobs
        { name: 'AI/Important-Follow-Up', color: '#F97316' }, // Orange - High Priority
        { name: 'AI/Other', color: '#9CA3AF' }               // Light Gray - Unclassified/Errors
      ]

      console.log(`🏗️ Processing ${prospectStages.length} prospect stages...`)

      for (const stage of prospectStages) {
        try {
          console.log(`🔍 Checking for existing label: ${stage.name}`)
          const existingLabel = existingLabels.find(label => label.name === stage.name)
          
          if (existingLabel) {
            labelMap[stage.name] = existingLabel.id
            console.log(`✅ Using existing label: ${stage.name} (${existingLabel.id})`)
          } else {
            console.log(`🏗️ Creating new label: ${stage.name}`)
            try {
              const labelId = await this.createLabel(stage.name, stage.color)
              labelMap[stage.name] = labelId
              console.log(`✅ Created new label: ${stage.name} (${labelId})`)
              
              // Small delay after creating each label
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (createError) {
              console.error(`❌ Failed to create label ${stage.name}:`, createError)
              // Continue with other labels even if one fails
            }
          }
        } catch (stageError) {
          console.error(`❌ Error processing stage ${stage.name}:`, stageError)
        }
      }

      console.log(`🎯 Final label mapping:`, labelMap)
      console.log(`📊 Created/found ${Object.keys(labelMap).length}/${prospectStages.length} labels`)
      
      return labelMap
    } catch (error) {
      console.error('❌ Error in createProspectLabels:', error)
      throw error
    }
  }

  /**
   * Verify that a label was applied to an email
   */
  async verifyLabelApplied(messageId: string, labelId: string): Promise<boolean> {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'minimal'
      })
      
      return message.data.labelIds?.includes(labelId) || false
    } catch (error) {
      console.error(`Error verifying label for message ${messageId}:`, error)
      return false
    }
  }

  /**
   * Remove labels from emails (useful for re-classification)
   */
  async removeLabels(messageIds: string[], labelIds: string[]): Promise<{ successful: number, failed: number }> {
    try {
      let successful = 0
      let failed = 0
      
      const batchSize = 50
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (messageId) => {
          try {
            await this.gmail.users.messages.modify({
              userId: 'me',
              id: messageId,
              requestBody: {
                removeLabelIds: labelIds
              }
            })
            return true
          } catch (error) {
            console.error(`Failed to remove labels from ${messageId}:`, error)
            return false
          }
        })
        
        const results = await Promise.all(batchPromises)
        successful += results.filter(r => r).length
        failed += results.filter(r => !r).length
        
        // Delay between batches
        if (i + batchSize < messageIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      return { successful, failed }
    } catch (error) {
      console.error('Error removing labels:', error)
      throw error
    }
  }

  /**
   * Get emails with specific labels
   */
  async getEmailsByLabel(labelId: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        maxResults
      })

      if (!response.data.messages) {
        return []
      }

      const messagePromises = response.data.messages.map((message: any) =>
        this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        })
      )

      const messages = await Promise.all(messagePromises)
      return messages.map(msg => this.parseGmailMessage(msg.data))
    } catch (error) {
      console.error('Error fetching emails by label:', error)
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

import DOMPurify from 'isomorphic-dompurify'

// Notification content sanitization utility
export class NotificationSecurity {
  private static instance: NotificationSecurity
  private purify: typeof DOMPurify

  private constructor() {
    this.purify = DOMPurify
    this.configurePurify()
  }

  public static getInstance(): NotificationSecurity {
    if (!NotificationSecurity.instance) {
      NotificationSecurity.instance = new NotificationSecurity()
    }
    return NotificationSecurity.instance
  }

  private configurePurify(): void {
    // Configure DOMPurify for strict sanitization
    this.purify.setConfig({
      // Only allow safe tags
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
      // Only allow safe attributes
      ALLOWED_ATTR: ['class'],
      // Remove any dangerous protocols
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      // Keep content safe
      KEEP_CONTENT: true,
      // Sanitize DOM
      SANITIZE_DOM: true,
      // Return DOM instead of string for better performance
      RETURN_DOM: false,
      // Return trusted types if available
      RETURN_TRUSTED_TYPE: true
    })
  }

  /**
   * Sanitize notification title - more restrictive
   */
  public sanitizeTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return ''
    }
    
    // For titles, we only allow plain text (no HTML)
    return this.purify.sanitize(title, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    }).trim()
  }

  /**
   * Sanitize notification message - allows basic formatting
   */
  public sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return ''
    }
    
    return this.purify.sanitize(message, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    }).trim()
  }

  /**
   * Validate notification type against allowlist
   */
  public validateNotificationType(type: string): boolean {
    const allowedTypes = ['task', 'project', 'message', 'team', 'system', 'reminder']
    return allowedTypes.includes(type)
  }

  /**
   * Validate notification priority
   */
  public validateNotificationPriority(priority: string): boolean {
    const allowedPriorities = ['low', 'medium', 'high', 'urgent']
    return allowedPriorities.includes(priority)
  }

  /**
   * Sanitize and validate entire notification object
   */
  public sanitizeNotification(notification: any): any {
    if (!notification || typeof notification !== 'object') {
      throw new Error('Invalid notification object')
    }

    // Validate required fields
    if (!notification.id || !notification.title) {
      throw new Error('Notification must have id and title')
    }

    return {
      id: String(notification.id).substring(0, 100), // Limit ID length
      title: this.sanitizeTitle(notification.title),
      message: this.sanitizeMessage(notification.message || ''),
      type: this.validateNotificationType(notification.type) ? notification.type : 'system',
      priority: this.validateNotificationPriority(notification.priority) ? notification.priority : 'medium',
      isRead: Boolean(notification.isRead),
      createdAt: notification.createdAt instanceof Date ? notification.createdAt : new Date(notification.createdAt),
      relatedId: notification.relatedId ? String(notification.relatedId).substring(0, 100) : undefined,
      relatedUrl: this.sanitizeUrl(notification.relatedUrl),
      senderName: notification.senderName ? this.sanitizeTitle(notification.senderName) : undefined,
      senderAvatar: this.sanitizeUrl(notification.senderAvatar)
    }
  }

  /**
   * Sanitize URLs to prevent javascript: and data: protocols
   */
  private sanitizeUrl(url?: string): string | undefined {
    if (!url || typeof url !== 'string') {
      return undefined
    }

    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    
    try {
      const urlObj = new URL(url)
      if (safeProtocols.includes(urlObj.protocol)) {
        return url.substring(0, 500) // Limit URL length
      }
      return undefined
    } catch {
      // Invalid URL
      return undefined
    }
  }
}

// Export singleton instance
export const notificationSecurity = NotificationSecurity.getInstance()

// Rate limiting utility for API calls
export class NotificationRateLimit {
  private static instance: NotificationRateLimit
  private requests: Map<string, number[]> = new Map()
  private readonly maxRequests = 60 // Max requests per hour per user
  private readonly timeWindow = 60 * 60 * 1000 // 1 hour in milliseconds

  private constructor() {}

  public static getInstance(): NotificationRateLimit {
    if (!NotificationRateLimit.instance) {
      NotificationRateLimit.instance = new NotificationRateLimit()
    }
    return NotificationRateLimit.instance
  }

  public isAllowed(userId: string): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    
    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < this.timeWindow)
    
    // Check if user has exceeded the limit
    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(userId, recentRequests)
    
    return true
  }

  public getRemainingRequests(userId: string): number {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    const recentRequests = userRequests.filter(timestamp => now - timestamp < this.timeWindow)
    
    return Math.max(0, this.maxRequests - recentRequests.length)
  }

  public getTimeUntilReset(userId: string): number {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    
    if (userRequests.length === 0) {
      return 0
    }

    const oldestRequest = Math.min(...userRequests)
    return Math.max(0, this.timeWindow - (now - oldestRequest))
  }
}

// Export singleton instance
export const notificationRateLimit = NotificationRateLimit.getInstance()

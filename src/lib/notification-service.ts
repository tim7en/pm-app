import { PrismaClient } from '@prisma/client'
import { getSocketInstance, emitNotificationToUser, emitNotificationCountToUser } from './socket'

// Define NotificationType enum locally to match database schema
enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_VERIFICATION_REQUIRED = 'TASK_VERIFICATION_REQUIRED',
  TASK_VERIFIED = 'TASK_VERIFIED',
  TASK_REJECTED = 'TASK_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  PROJECT_INVITE = 'PROJECT_INVITE',
  WORKSPACE_INVITE = 'WORKSPACE_INVITE',
  WORKSPACE_REMOVED = 'WORKSPACE_REMOVED',
  ROLE_CHANGE = 'ROLE_CHANGE',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING'
}

const prisma = new PrismaClient()

export interface CreateNotificationParams {
  title: string
  message: string
  type: NotificationType
  userId: string
  relatedId?: string
  relatedUrl?: string
  senderName?: string
  senderAvatar?: string
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams) {
    // Input validation
    if (!params.title || !params.message || !params.type || !params.userId) {
      throw new Error('Missing required parameters: title, message, type, and userId are required')
    }

    if (typeof params.title !== 'string' || params.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string')
    }

    if (typeof params.message !== 'string' || params.message.trim().length === 0) {
      throw new Error('Message must be a non-empty string')
    }

    if (typeof params.userId !== 'string' || params.userId.trim().length === 0) {
      throw new Error('UserId must be a non-empty string')
    }

    try {
      const notification = await prisma.notification.create({
        data: {
          title: params.title,
          message: params.message,
          type: params.type,
          userId: params.userId,
          isRead: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      })

      // Format notification for frontend
      const formattedNotification = {
        id: notification.id,
        type: this.mapNotificationType(notification.type),
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedId: params.relatedId || null,
        relatedUrl: params.relatedUrl || null,
        senderName: params.senderName || 'System',
        senderAvatar: params.senderAvatar || null
      }

      // Emit real-time notification to user
      const io = getSocketInstance()
      if (io) {
        emitNotificationToUser(io, params.userId, formattedNotification)
        
        // Also emit updated unread count
        const unreadCount = await this.getUnreadCount(params.userId)
        emitNotificationCountToUser(io, params.userId, unreadCount)
        console.log(`Emitted notification and count (${unreadCount}) to user ${params.userId}`)
      }

      return { notification, formattedNotification }
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      })

      // Format notifications for frontend
      const formattedNotifications = notifications.map(notification => ({
        id: notification.id,
        type: this.mapNotificationType(notification.type),
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedId: null, // We'll enhance this later when we add relations
        relatedUrl: this.generateRelatedUrl(notification.type, notification.id),
        senderName: 'System', // We'll enhance this when we add sender relations
        senderAvatar: null
      }))

      return formattedNotifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  /**
   * Mark notification as read with proper validation and session tracking
   */
  static async markAsRead(notificationId: string, userId: string) {
    // Input validation
    if (!notificationId || typeof notificationId !== 'string' || notificationId.trim().length === 0) {
      throw new Error('Valid notificationId is required')
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Valid userId is required')
    }

    try {
      // First verify the notification exists and belongs to the user
      const existingNotification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId
        }
      })

      if (!existingNotification) {
        console.warn(`Notification ${notificationId} not found for user ${userId}`)
        return false
      }

      if (existingNotification.isRead) {
        console.log(`Notification ${notificationId} already marked as read`)
        return true // Already read, consider it successful
      }

      // Mark as read with transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.notification.update({
          where: {
            id: notificationId,
            userId: userId,
            isRead: false // Only update if currently unread
          },
          data: {
            isRead: true
          }
        })

        return { count: 1, notification: updated }
      })

      // Emit updated unread count via socket
      if (result.count > 0) {
        const io = getSocketInstance()
        if (io) {
          const unreadCount = await this.getUnreadCount(userId)
          emitNotificationCountToUser(io, userId, unreadCount)
          console.log(`Updated notification count after marking as read: ${unreadCount}`)
        }
      }

      return result.count > 0
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for a user with proper transaction handling
   */
  static async markAllAsRead(userId: string) {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Valid userId is required')
    }

    try {
      // Use transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // First get count of unread notifications
        const unreadCount = await tx.notification.count({
          where: {
            userId: userId,
            isRead: false
          }
        })

        if (unreadCount === 0) {
          return { count: 0, updatedCount: 0 }
        }

        // Mark all unread notifications as read
        const updateResult = await tx.notification.updateMany({
          where: {
            userId: userId,
            isRead: false
          },
          data: {
            isRead: true
          }
        })

        return { count: unreadCount, updatedCount: updateResult.count }
      })

      // Emit updated unread count via socket (should be 0 now)
      if (result.updatedCount > 0) {
        const io = getSocketInstance()
        if (io) {
          emitNotificationCountToUser(io, userId, 0) // All read, so count is 0
          console.log(`Marked ${result.updatedCount} notifications as read for user ${userId}`)
        }
      }

      return result.updatedCount
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Get unread notification count with caching for performance
   */
  static async getUnreadCount(userId: string) {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.warn('Invalid userId provided to getUnreadCount')
      return 0
    }

    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      })

      console.log(`Unread notification count for user ${userId}: ${count}`)
      return count
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Sync notification count across all user sessions (for cross-device consistency)
   */
  static async syncNotificationCountForUser(userId: string) {
    if (!userId) return

    try {
      const count = await this.getUnreadCount(userId)
      const io = getSocketInstance()
      if (io) {
        // Broadcast to all sessions for this user
        emitNotificationCountToUser(io, userId, count)
        console.log(`Synced notification count (${count}) across all sessions for user ${userId}`)
      }
      return count
    } catch (error) {
      console.error('Error syncing notification count:', error)
      return 0
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async deleteOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true // Only delete read notifications
        }
      })

      return result.count
    } catch (error) {
      console.error('Error deleting old notifications:', error)
      throw error
    }
  }

  /**
   * Map database notification type to frontend type
   */
  private static mapNotificationType(type: NotificationType): string {
    const typeMap: Record<NotificationType, string> = {
      TASK_ASSIGNED: 'task',
      TASK_UPDATED: 'task',
      TASK_COMPLETED: 'task',
      TASK_DUE_SOON: 'task',
      TASK_VERIFICATION_REQUIRED: 'task',
      TASK_VERIFIED: 'task',
      TASK_REJECTED: 'task',
      COMMENT_ADDED: 'message',
      PROJECT_INVITE: 'project',
      WORKSPACE_INVITE: 'team',
      WORKSPACE_REMOVED: 'team',
      ROLE_CHANGE: 'team',
      DEADLINE_APPROACHING: 'system'
    }
    
    return typeMap[type] || 'system'
  }

  /**
   * Generate related URL based on notification type
   */
  private static generateRelatedUrl(type: NotificationType, notificationId: string): string | null {
    const urlMap: Record<NotificationType, string> = {
      TASK_ASSIGNED: '/tasks',
      TASK_UPDATED: '/tasks',
      TASK_COMPLETED: '/tasks',
      TASK_DUE_SOON: '/tasks',
      TASK_VERIFICATION_REQUIRED: '/tasks',
      TASK_VERIFIED: '/tasks',
      TASK_REJECTED: '/tasks',
      COMMENT_ADDED: '/messages',
      PROJECT_INVITE: '/projects',
      WORKSPACE_INVITE: '/workspaces',
      WORKSPACE_REMOVED: '/workspaces',
      ROLE_CHANGE: '/team',
      DEADLINE_APPROACHING: '/calendar'
    }

    return urlMap[type] || null
  }

  /**
   * Create task-related notifications
   */
  static async createTaskNotification(
    type: NotificationType,
    userId: string,
    taskTitle: string,
    taskId: string,
    senderName?: string
  ) {
    const messages: Record<NotificationType, string> = {
      TASK_ASSIGNED: `You have been assigned to task "${taskTitle}"`,
      TASK_UPDATED: `Task "${taskTitle}" has been updated`,
      TASK_COMPLETED: `Task "${taskTitle}" has been completed`,
      TASK_DUE_SOON: `Task "${taskTitle}" is due soon`,
      TASK_VERIFICATION_REQUIRED: `Task "${taskTitle}" requires verification`,
      TASK_VERIFIED: `Task "${taskTitle}" has been verified`,
      TASK_REJECTED: `Task "${taskTitle}" has been rejected`,
      COMMENT_ADDED: `New comment on task "${taskTitle}"`,
      PROJECT_INVITE: '',
      WORKSPACE_INVITE: '',
      WORKSPACE_REMOVED: '',
      ROLE_CHANGE: '',
      DEADLINE_APPROACHING: `Deadline approaching for "${taskTitle}"`
    }

    const titles: Record<NotificationType, string> = {
      TASK_ASSIGNED: 'Task Assigned',
      TASK_UPDATED: 'Task Updated',
      TASK_COMPLETED: 'Task Completed',
      TASK_DUE_SOON: 'Task Due Soon',
      TASK_VERIFICATION_REQUIRED: 'Verification Required',
      TASK_VERIFIED: 'Task Verified',
      TASK_REJECTED: 'Task Rejected',
      COMMENT_ADDED: 'New Comment',
      PROJECT_INVITE: '',
      WORKSPACE_INVITE: '',
      WORKSPACE_REMOVED: '',
      ROLE_CHANGE: '',
      DEADLINE_APPROACHING: 'Deadline Approaching'
    }

    return this.createNotification({
      title: titles[type],
      message: messages[type],
      type,
      userId,
      relatedId: taskId,
      relatedUrl: `/tasks?id=${taskId}`,
      senderName
    })
  }

  /**
   * Create project-related notifications
   */
  static async createProjectNotification(
    userId: string,
    projectName: string,
    projectId: string,
    action: 'created' | 'updated' | 'deleted' | 'invited',
    senderName?: string
  ) {
    const messages = {
      created: `New project "${projectName}" has been created`,
      updated: `Project "${projectName}" has been updated`,
      deleted: `Project "${projectName}" has been deleted`,
      invited: `You have been invited to project "${projectName}"`
    }

    const titles = {
      created: 'Project Created',
      updated: 'Project Updated', 
      deleted: 'Project Deleted',
      invited: 'Project Invitation'
    }

    return this.createNotification({
      title: titles[action],
      message: messages[action],
      type: NotificationType.PROJECT_INVITE,
      userId,
      relatedId: projectId,
      relatedUrl: `/projects?id=${projectId}`,
      senderName
    })
  }
}

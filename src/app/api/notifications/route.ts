import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { notificationSecurity, notificationRateLimit } from '@/lib/notification-security'

// Mock notification data for testing (replace with actual database queries)
const mockNotifications = [
  {
    id: '1',
    type: 'task',
    title: 'Task completed',
    message: 'Your task "Design Homepage" has been completed.',
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedId: 'task-123',
    relatedUrl: '/projects/123/tasks/456',
    senderName: 'John Doe',
    senderAvatar: '/avatars/01.png'
  },
  {
    id: '2', 
    type: 'message',
    title: 'New message',
    message: 'You have a new message from Sarah Wilson.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    relatedId: 'msg-456',
    relatedUrl: '/messages/conversation/789',
    senderName: 'Sarah Wilson',
    senderAvatar: '/avatars/02.png'
  },
  {
    id: '3',
    type: 'team',
    title: 'Team invitation',
    message: 'You have been invited to join the Marketing team.',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    relatedId: 'team-789',
    relatedUrl: '/teams/marketing',
    senderName: 'Admin',
    senderAvatar: null
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting check
    if (!notificationRateLimit.isAllowed(session.user.id)) {
      const timeUntilReset = notificationRateLimit.getTimeUntilReset(session.user.id)
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
            'X-RateLimit-Remaining': notificationRateLimit.getRemainingRequests(session.user.id).toString()
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    
    // Input validation with proper bounds
    let limit = 20 // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid limit parameter. Must be a positive integer.' },
          { status: 400 }
        )
      }
      limit = Math.min(parsedLimit, 100) // cap at 100
    }

    // Get notifications (replace with actual database query)
    let notifications = [...mockNotifications]
    
    // Apply limit
    notifications = notifications.slice(0, limit)
    
    // Sanitize all notifications
    const sanitizedNotifications = notifications.map(notification => {
      try {
        return notificationSecurity.sanitizeNotification({
          ...notification,
          createdAt: new Date(notification.createdAt)
        })
      } catch (error) {
        console.error('Failed to sanitize notification:', error)
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      notifications: sanitizedNotifications,
      total: sanitizedNotifications.length,
      limit: limit
    })

  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limiting check
    if (!notificationRateLimit.isAllowed(session.user.id)) {
      const timeUntilReset = notificationRateLimit.getTimeUntilReset(session.user.id)
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
            'X-RateLimit-Remaining': notificationRateLimit.getRemainingRequests(session.user.id).toString()
          }
        }
      )
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    // Sanitize and validate the notification
    let sanitizedNotification
    try {
      sanitizedNotification = notificationSecurity.sanitizeNotification({
        id: Date.now().toString(), // Generate ID
        ...body,
        createdAt: new Date(),
        isRead: false
      })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification data' },
        { status: 400 }
      )
    }

    // Here you would save to the database
    // For now, we'll just return the sanitized notification
    
    return NextResponse.json({
      success: true,
      notification: sanitizedNotification,
      message: 'Notification created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // CSRF Protection - require X-Requested-With header
    const requestedWith = request.headers.get('X-Requested-With')
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json(
        { success: false, error: 'CSRF protection: Missing X-Requested-With header' },
        { status: 403 }
      )
    }

    // Rate limiting check
    if (!notificationRateLimit.isAllowed(session.user.id)) {
      const timeUntilReset = notificationRateLimit.getTimeUntilReset(session.user.id)
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
            'X-RateLimit-Remaining': notificationRateLimit.getRemainingRequests(session.user.id).toString()
          }
        }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { action, notificationId } = body

    // Validate action
    const validActions = ['mark-read', 'mark-all-read', 'delete']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be one of: mark-read, mark-all-read, delete' },
        { status: 400 }
      )
    }

    // Validate notificationId for single-item actions
    if (action === 'mark-read' || action === 'delete') {
      if (!notificationId || typeof notificationId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'notificationId is required for this action' },
          { status: 400 }
        )
      }
      
      // Sanitize the ID
      const sanitizedId = notificationId.substring(0, 100).replace(/[^a-zA-Z0-9-_]/g, '')
      if (!sanitizedId) {
        return NextResponse.json(
          { success: false, error: 'Invalid notificationId format' },
          { status: 400 }
        )
      }
    }

    // Here you would update the database
    // For now, we'll just return success
    
    let responseMessage = ''
    switch (action) {
      case 'mark-read':
        responseMessage = 'Notification marked as read'
        break
      case 'mark-all-read':
        responseMessage = 'All notifications marked as read'
        break
      case 'delete':
        responseMessage = 'Notification deleted'
        break
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      action: action,
      notificationId: action === 'mark-all-read' ? undefined : notificationId
    })

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

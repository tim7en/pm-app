import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications: any[] = []

    // Get recent activity logs
    try {
      const activityLogs = await db.activityLog.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          clearedAt: 'desc'
        },
        take: Math.min(limit, 10)
      })

      activityLogs.forEach(log => {
        notifications.push({
          id: `activity-${log.id}`,
          type: 'system',
          title: log.type,
          message: log.message,
          isRead: true,
          createdAt: log.clearedAt,
          senderName: log.userName,
          senderAvatar: log.userAvatar
        })
      })
    } catch (error) {
      console.log('Activity logs not available:', error)
    }

    // Add some mock notifications for now until the messaging system is fully integrated
    const mockNotifications = [
      {
        id: 'welcome-1',
        type: 'system',
        title: 'Welcome!',
        message: 'Welcome to the project management system. Click the bell icon to see your notifications.',
        isRead: false,
        createdAt: new Date(),
        senderName: 'System'
      },
      {
        id: 'feature-2',
        type: 'system', 
        title: 'New Feature',
        message: 'The team communication system is now available. Click on team members to start conversations.',
        isRead: false,
        createdAt: new Date(Date.now() - 60000),
        senderName: 'System'
      }
    ]

    // Add mock notifications
    notifications.push(...mockNotifications)

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, limit),
      unreadCount: notifications.filter(n => !n.isRead).length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Handle different actions
    if (action === 'mark-read') {
      // For now, just return success
      return NextResponse.json({ success: true })
    }

    if (action === 'mark-all-read') {
      // For now, just return success
      // In the future, this would mark all user's notifications as read
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

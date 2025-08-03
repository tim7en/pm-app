import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get unread notification count
    const count = await NotificationService.getUnreadCount(session.user.id)

    return NextResponse.json({
      success: true,
      count: count
    })

  } catch (error) {
    console.error('Error in GET /api/notifications/count:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

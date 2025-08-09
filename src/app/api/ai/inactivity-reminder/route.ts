import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationType } from '@/types/prisma-fallback'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workspaceId, userId, minutesInactive } = body

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Workspace ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check permissions - user must be admin or owner
    const userMembership = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: { in: ['ADMIN', 'OWNER'] }
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get inactive user details
    const inactiveUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    if (!inactiveUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current work hours status
    const now = new Date()
    const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)
    const lunchStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0)
    const lunchEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0)
    const workEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0)

    const isWorkingHours = (
      (now >= workStart && now < lunchStart) || 
      (now >= lunchEnd && now < workEnd)
    )

    const currentHour = now.getHours()
    let workPhase = 'after-hours'
    if (currentHour >= 9 && currentHour < 13) {
      workPhase = 'morning'
    } else if (currentHour >= 13 && currentHour < 14) {
      workPhase = 'lunch'
    } else if (currentHour >= 14 && currentHour < 18) {
      workPhase = 'afternoon'
    }

    // Generate personalized reminder
    const reminder = await aiAssistant.generateInactivityReminder(
      inactiveUser.name || inactiveUser.email,
      Math.floor((minutesInactive || 120) / 60), // Convert to hours
      { workPhase, isWorkingHours }
    )

    // Create notification for the inactive user
    await db.notification.create({
      data: {
        title: 'Activity Reminder',
        message: reminder,
        type: NotificationType.TASK_DUE_SOON,
        userId: userId,
        isRead: false
      }
    })

    // If it's working hours and user has been inactive for more than 3 hours, notify manager
    if (isWorkingHours && minutesInactive > 180) {
      const managers = await db.workspaceMember.findMany({
        where: {
          workspaceId,
          role: { in: ['ADMIN', 'OWNER', 'PROJECT_MANAGER'] }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      for (const manager of managers) {
        await db.notification.create({
          data: {
            title: 'Team Member Inactive',
            message: `${inactiveUser.name || inactiveUser.email} has been inactive for ${Math.floor(minutesInactive / 60)} hours during work time.`,
            type: NotificationType.DEADLINE_APPROACHING,
            userId: manager.userId,
            isRead: false
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      reminder,
      notificationSent: true,
      managerNotified: isWorkingHours && minutesInactive > 180
    })
  } catch (error) {
    console.error('Inactivity reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}

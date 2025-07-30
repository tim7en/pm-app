import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

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
    const { activities } = body

    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: 'Invalid activities data' },
        { status: 400 }
      )
    }

    // Save activities to logs
    const activityLogs = activities.map(activity => ({
      type: activity.type,
      message: activity.message,
      userId: session.user.id,
      userName: activity.user.name,
      userAvatar: activity.user.avatar,
      originalTimestamp: new Date(activity.timestamp)
    }))

    await db.activityLog.createMany({
      data: activityLogs
    })

    return NextResponse.json({ success: true, count: activityLogs.length })
  } catch (error) {
    console.error('Error clearing activities:', error)
    return NextResponse.json(
      { error: 'Failed to clear activities' },
      { status: 500 }
    )
  }
}

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const logs = await db.activityLog.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        clearedAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    const total = await db.activityLog.count({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

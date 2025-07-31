import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Get all workspace members with their user details
    const workspaceMembers = await db.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    // For now, we'll simulate online status
    // In a real app, you'd track this via WebSocket connections or last activity
    const membersWithStatus = workspaceMembers.map(member => ({
      id: member.user.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      avatar: member.user.avatar,
      role: member.user.role,
      isOnline: Math.random() > 0.3, // Random online status for demo
      lastSeen: member.user.id === session.user.id ? new Date() : new Date(Date.now() - Math.random() * 86400000), // Random last seen
      workspaceRole: member.role
    }))

    return NextResponse.json({
      success: true,
      members: membersWithStatus
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

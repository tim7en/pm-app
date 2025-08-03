import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    console.log('Team members API - Session:', session ? 'Found' : 'Not found')
    
    if (!session) {
      console.log('Team members API - No session, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')
    
    console.log('Team members API - Workspace ID:', workspaceId)
    console.log('Team members API - Current user:', session.user.id)

    if (!workspaceId) {
      console.log('Team members API - No workspace ID provided')
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
            avatar: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })
    
    console.log('Team members API - Found workspace members:', workspaceMembers.length)
    console.log('Team members API - Members:', workspaceMembers.map(m => ({ 
      id: m.user?.id || 'NO_USER', 
      name: m.user?.name || m.user?.email || 'NO_NAME',
      role: m.role,
      hasUser: !!m.user
    })))

    // Filter out members without valid user data and calculate online status
    const membersWithStatus = workspaceMembers
      .filter(member => {
        if (!member.user) {
          console.warn('Found workspace member without user data:', member)
          return false
        }
        return true
      })
      .map(member => {
        // Simulate 70% chance of being online with bias towards current user being online
        const isCurrentUser = member.user.id === session.user.id
        const isOnline = isCurrentUser ? true : Math.random() > 0.3
        
        return {
          id: member.user.id,
          name: member.user.name || member.user.email,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.role, // Use the workspace member role
          isOnline: isOnline,
          lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 86400000),
          workspaceRole: member.role
        }
      })

    console.log('Team members API - Filtered members with status:', membersWithStatus.length)

    // Sort by online status first (online users first), then by name
    membersWithStatus.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1
      if (!a.isOnline && b.isOnline) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      success: true,
      members: membersWithStatus
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

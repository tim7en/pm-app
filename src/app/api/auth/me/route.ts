import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's workspaces
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const workspaces = user.workspaceMembers.map(member => ({
      id: member.workspace.id,
      name: member.workspace.name,
      role: member.role
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      },
      workspaces,
      currentWorkspaceId: session.workspaceId
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}

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

    // Get user's workspaces with detailed information
    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            userId: session.user.id
          },
          select: {
            role: true
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedWorkspaces = workspaces.map(workspace => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      role: workspace.members[0]?.role,
      memberCount: workspace._count.members,
      projectCount: workspace._count.projects,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    }))

    // Get user information
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user,
      workspaces: formattedWorkspaces,
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

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

    // Get all workspaces where the user is a member
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

    return NextResponse.json(formattedWorkspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}

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
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      )
    }

    // Create workspace and make the creator an owner
    const result = await db.$transaction(async (tx) => {
      // Create the workspace
      const workspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null
        }
      })

      // Add the creator as an owner
      const workspaceMember = await tx.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: workspace.id,
          role: 'OWNER'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          workspace: {
            select: { id: true, name: true, description: true }
          }
        }
      })

      return { workspace, workspaceMember }
    })

    return NextResponse.json({
      id: result.workspace.id,
      name: result.workspace.name,
      description: result.workspace.description,
      role: 'OWNER',
      memberCount: 1,
      projectCount: 0,
      createdAt: result.workspace.createdAt,
      updatedAt: result.workspace.updatedAt
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}

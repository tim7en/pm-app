import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// Mock users data
const mockUsers = [
  {
    id: "member-1",
    name: "Alex Johnson",
    email: "alex@company.com",
    avatar: "/avatars/05.png"
  },
  {
    id: "member-2", 
    name: "Sarah Chen",
    email: "sarah@company.com",
    avatar: "/avatars/06.png"
  },
  {
    id: "member-3",
    name: "Michael Rodriguez", 
    email: "michael@company.com",
    avatar: "/avatars/07.png"
  },
  {
    id: "member-4",
    name: "Emily Davis",
    email: "emily@company.com", 
    avatar: "/avatars/08.png"
  },
  {
    id: "member-5",
    name: "David Kim",
    email: "david@company.com",
    avatar: "/avatars/09.png"
  }
]

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Check if user is workspace owner or admin
    const userWorkspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspaceId
        }
      }
    })

    if (!userWorkspaceMember || (userWorkspaceMember.role !== 'OWNER' && userWorkspaceMember.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can add mock users' },
        { status: 403 }
      )
    }

    const createdUsers: any[] = []
    const addedToWorkspace: string[] = []

    for (const mockUser of mockUsers) {
      try {
        // Create or update the user in the database
        const user = await db.user.upsert({
          where: { id: mockUser.id },
          update: {
            name: mockUser.name,
            email: mockUser.email,
            avatar: mockUser.avatar
          },
          create: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            avatar: mockUser.avatar,
            password: null // Mock users don't have passwords
          }
        })
        createdUsers.push(user)

        // Add to workspace if not already a member
        const existingMember = await db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: mockUser.id,
              workspaceId: workspaceId
            }
          }
        })

        if (!existingMember) {
          await db.workspaceMember.create({
            data: {
              userId: mockUser.id,
              workspaceId: workspaceId,
              role: 'MEMBER',
              joinedAt: new Date()
            }
          })
          addedToWorkspace.push(user.name || user.email)
        }
      } catch (error) {
        console.error(`Error processing mock user ${mockUser.name}:`, error)
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${createdUsers.length} mock users`,
      createdUsers: createdUsers.length,
      addedToWorkspace: addedToWorkspace.length,
      addedMembers: addedToWorkspace
    })
  } catch (error) {
    console.error('Error creating mock users:', error)
    return NextResponse.json(
      { error: 'Failed to create mock users' },
      { status: 500 }
    )
  }
}

// GET endpoint to check which mock users exist
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const workspaceId = url.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get all mock users that exist in the database
    const existingMockUsers = await db.user.findMany({
      where: {
        id: {
          in: mockUsers.map(u => u.id)
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    // Check which ones are workspace members
    const workspaceMembers = await db.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId,
        userId: {
          in: mockUsers.map(u => u.id)
        }
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
      }
    })

    return NextResponse.json({
      availableMockUsers: mockUsers,
      existingInDatabase: existingMockUsers,
      workspaceMembers: workspaceMembers.map(m => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching mock users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mock users' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

// Mock team members data - keeping only 3 for cleaner testing
const mockUsers = [
  {
    id: "member-1",
    name: "Alex Johnson",
    email: "alex@company.com",
    avatar: "/avatars/01.png"
  },
  {
    id: "member-2", 
    name: "Sarah Chen",
    email: "sarah@company.com",
    avatar: "/avatars/02.png"
  },
  {
    id: "member-3",
    name: "Michael Rodriguez", 
    email: "michael@company.com",
    avatar: "/avatars/03.png"
  }
]

interface ProcessResult {
  id: string
  name: string | null
  email: string
  avatar?: string | null
  status: 'already_member' | 'added' | 'error'
  error?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    const { id: workspaceId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to add members to this workspace
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
        { error: 'Only workspace owners and admins can add mock members' },
        { status: 403 }
      )
    }

    const results: ProcessResult[] = []
    let createdUsers = 0
    let addedToWorkspace = 0

    for (const mockUser of mockUsers) {
      try {
        // Check if user already exists
        let user = await db.user.findUnique({
          where: { id: mockUser.id }
        })

        // Create user if they don't exist
        if (!user) {
          user = await db.user.create({
            data: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              avatar: mockUser.avatar,
              password: null // Mock users don't have passwords
            }
          })
          createdUsers++
          console.log(`✅ Created mock user: ${user.name}`)
        }

        // Check if user is already a workspace member
        const existingMembership = await db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: workspaceId
            }
          }
        })

        if (!existingMembership) {
          // Add user to workspace
          await db.workspaceMember.create({
            data: {
              userId: user.id,
              workspaceId: workspaceId,
              role: 'MEMBER',
              joinedAt: new Date()
            }
          })
          addedToWorkspace++
          console.log(`✅ Added ${user.name} to workspace`)
        }

        results.push({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: existingMembership ? 'already_member' : 'added'
        })

      } catch (error) {
        console.error(`Error processing mock user ${mockUser.name}:`, error)
        results.push({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${mockUsers.length} mock users. Created ${createdUsers} new users and added ${addedToWorkspace} to workspace.`,
      results,
      summary: {
        total: mockUsers.length,
        createdUsers,
        addedToWorkspace,
        alreadyMembers: mockUsers.length - addedToWorkspace
      }
    })

  } catch (error) {
    console.error('Error seeding mock members:', error)
    return NextResponse.json(
      { error: 'Failed to seed mock members' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove all mock members
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    const { id: workspaceId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to remove members from this workspace
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
        { error: 'Only workspace owners and admins can remove mock members' },
        { status: 403 }
      )
    }

    const mockUserIds = mockUsers.map(u => u.id)
    let removedFromWorkspace = 0
    let deletedUsers = 0

    // Remove mock users from workspace
    const removedMemberships = await db.workspaceMember.deleteMany({
      where: {
        workspaceId: workspaceId,
        userId: {
          in: mockUserIds
        }
      }
    })
    removedFromWorkspace = removedMemberships.count

    // Optionally delete the users completely (if they're not in other workspaces)
    for (const userId of mockUserIds) {
      try {
        // Check if user is in other workspaces
        const otherMemberships = await db.workspaceMember.findMany({
          where: {
            userId: userId,
            workspaceId: {
              not: workspaceId
            }
          }
        })

        // If user is not in any other workspace, delete the user
        if (otherMemberships.length === 0) {
          await db.user.delete({
            where: { id: userId }
          })
          deletedUsers++
          console.log(`🗑️ Deleted mock user: ${userId}`)
        }
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error)
      }
    }

    return NextResponse.json({
      message: `Successfully removed ${removedFromWorkspace} mock members from workspace and deleted ${deletedUsers} users completely.`,
      summary: {
        removedFromWorkspace,
        deletedUsers,
        mockUserIds
      }
    })

  } catch (error) {
    console.error('Error removing mock members:', error)
    return NextResponse.json(
      { error: 'Failed to remove mock members' },
      { status: 500 }
    )
  }
}

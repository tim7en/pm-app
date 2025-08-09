import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a member of this workspace
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: resolvedParams.id
        }
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    const workspace = {
      ...workspaceMember.workspace,
      role: workspaceMember.role
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Check if user has permission to update this workspace (OWNER or ADMIN)
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: resolvedParams.id
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    if (workspaceMember.role !== 'OWNER' && workspaceMember.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update workspace' },
        { status: 403 }
      )
    }

    // Update the workspace
    const updatedWorkspace = await db.workspace.update({
      where: { id: resolvedParams.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      ...updatedWorkspace,
      role: workspaceMember.role
    })
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is the owner of this workspace
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: resolvedParams.id
        }
      }
    })

    if (!workspaceMember || workspaceMember.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can delete workspaces' },
        { status: 403 }
      )
    }

    // Get all related data to clean up
    const workspace = await db.workspace.findUnique({
      where: { id: resolvedParams.id },
      include: {
        projects: {
          include: {
            tasks: {
              include: {
                comments: true,
                subtasks: true,
                tags: true
              }
            }
          }
        },
        members: true,
        invitations: true
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Delete in the correct order to handle foreign key constraints
    await db.$transaction(async (tx) => {
      // Delete task-related data
      for (const project of workspace.projects) {
        for (const task of project.tasks) {
          // Delete task tags
          await tx.taskTag.deleteMany({
            where: { taskId: task.id }
          })
          
          // Delete subtasks
          await tx.subTask.deleteMany({
            where: { taskId: task.id }
          })
          
          // Delete comments
          await tx.comment.deleteMany({
            where: { taskId: task.id }
          })
        }
        
        // Delete tasks
        await tx.task.deleteMany({
          where: { projectId: project.id }
        })
      }
      
      // Delete projects
      await tx.project.deleteMany({
        where: { workspaceId: resolvedParams.id }
      })
      
      // Delete invitations
      await tx.workspaceInvitation.deleteMany({
        where: { workspaceId: resolvedParams.id }
      })
      
      // Delete workspace members
      await tx.workspaceMember.deleteMany({
        where: { workspaceId: resolvedParams.id }
      })
      
      // Finally delete the workspace
      await tx.workspace.delete({
        where: { id: resolvedParams.id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    )
  }
}

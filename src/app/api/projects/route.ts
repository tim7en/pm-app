import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectStatus } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleProjects, getUserSystemRole } from '@/lib/roles'
import { NotificationService } from '@/lib/notification-service'

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
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const workspaceId = searchParams.get('workspaceId')
    const includeCounts = searchParams.get('includeCounts') === 'true'

    // Get all accessible projects for the user
    let projects = await getAccessibleProjects(session.user.id)
    
    // Filter by workspace if specified
    if (workspaceId) {
      projects = projects.filter(project => project.workspaceId === workspaceId)
    }
    
    // Apply other filters
    if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      projects = projects.filter(project => project.status === status)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      projects = projects.filter(project => 
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      )
    }

    // Format the response
    const formattedProjects = await Promise.all(projects.map(async project => {
      let completedTasks = 0
      
      if (includeCounts) {
        completedTasks = await db.task.count({
          where: {
            projectId: project.id,
            status: 'DONE'
          }
        })
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        workspaceId: project.workspaceId,
        ownerId: project.ownerId,
        owner: {
          id: project.owner.id,
          name: project.owner.name,
          email: project.owner.email,
          avatar: project.owner.avatar
        },
        _count: {
          tasks: project._count?.tasks || 0,
          members: project._count?.members || 0
        },
        taskCount: project._count?.tasks || 0,
        memberCount: project._count?.members || 0,
        completedTaskCount: completedTasks,
        isStarred: false, // TODO: Implement starred projects
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    }))

    return NextResponse.json(formattedProjects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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

    // Check if user can create projects - allow ADMIN, OWNER, and regular USER
    const systemRole = await getUserSystemRole(session.user.id)
    
    const body = await request.json()
    const {
      name,
      description,
      color = '#3b82f6',
      workspaceId = session.workspaceId,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // If no workspaceId in session, use the user's default workspace
    let targetWorkspaceId = workspaceId
    if (!targetWorkspaceId) {
      const workspaceMember = await db.workspaceMember.findFirst({
        where: { userId: session.user.id },
        include: { workspace: true }
      })
      
      if (!workspaceMember) {
        return NextResponse.json(
          { error: 'No workspace found for user' },
          { status: 400 }
        )
      }
      
      targetWorkspaceId = workspaceMember.workspaceId
    }

    // Verify user has access to the workspace
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: targetWorkspaceId
        }
      }
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      )
    }

    // Create the project
    const project = await db.project.create({
      data: {
        name,
        description,
        color,
        workspaceId: targetWorkspaceId,
        ownerId: session.user.id,
        status: ProjectStatus.ACTIVE
      },
      include: {
        owner: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            avatar: true 
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    })

    // Add the owner as a project admin
    await db.projectMember.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        role: 'ADMIN'
      }
    })

    // Create notification for project creation
    try {
      await NotificationService.createProjectNotification(
        session.user.id,
        project.name,
        project.id,
        'created',
        session.user.name || 'You'
      )
      console.log(`Project creation notification sent to user ${session.user.id}`)
    } catch (error) {
      console.error('Failed to create project notification:', error)
      // Don't fail the project creation if notification fails
    }

    // Format the response
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      owner: project.owner,
      taskCount: 0,
      memberCount: 1, // Owner is added as member
      completedTaskCount: 0,
      isStarred: false,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }

    return NextResponse.json(formattedProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ProjectStatus } from '@/lib/prisma-mock'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleProjects, getUserSystemRole } from '@/lib/roles'

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

    // Get all accessible projects for the user
    let projects = await getAccessibleProjects(session.user.id)
    
    // Apply filters
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
      const completedTasks = await db.task.count({
        where: {
          projectId: project.id,
          status: 'DONE'
        }
      })

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        owner: {
          id: project.owner.id,
          name: project.owner.name,
          email: project.owner.email,
          avatar: project.owner.avatar
        },
        taskCount: project._count.tasks,
        memberCount: project._count.members,
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

    // Check if user can create projects
    const systemRole = await getUserSystemRole(session.user.id)
    if (!['OWNER', 'ADMIN', 'PROJECT_MANAGER'].includes(systemRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      color = '#3b82f6',
      workspaceId = session.workspaceId,
    } = body

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'Name and workspace are required' },
        { status: 400 }
      )
    }

    // Verify user has access to the workspace
    const workspaceMember = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId
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
        workspaceId,
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

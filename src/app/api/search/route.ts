import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { getAccessibleTasks, getAccessibleProjects } from '@/lib/roles'

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
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // 'tasks', 'projects', or 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({
        tasks: [],
        projects: [],
        users: []
      })
    }

    const searchLower = query.toLowerCase()
    const results: any = {}

    // Search tasks
    if (type === 'all' || type === 'tasks') {
      const tasks = await getAccessibleTasks(session.user.id)
      results.tasks = tasks
        .filter(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, limit)
        .map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: task.project,
          assignee: task.assignee,
          creator: task.creator,
          type: 'task'
        }))
    }

    // Search projects
    if (type === 'all' || type === 'projects') {
      const projects = await getAccessibleProjects(session.user.id)
      results.projects = projects
        .filter(project => 
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, limit)
        .map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          color: project.color,
          owner: project.owner,
          type: 'project'
        }))
    }

    // Search users (team members)
    if (type === 'all' || type === 'users') {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: searchLower } },
            { email: { contains: searchLower } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        },
        take: limit
      })

      results.users = users.map(user => ({
        ...user,
        type: 'user'
      }))
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}

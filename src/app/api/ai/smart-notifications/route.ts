import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationType } from '@/lib/prisma-mock'

// POST /api/ai/smart-notifications - Generate contextual notifications
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
    const { workspaceId, notificationType, context } = body

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Check user permissions
    const userMembership = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    let notifications: Array<{
      userId: string
      title: string
      message: string
      type: NotificationType
    }> = []

    switch (notificationType) {
      case 'DAILY_SUMMARY':
        notifications = await generateDailySummaryNotifications(workspaceId)
        break
      
      case 'PRODUCTIVITY_INSIGHTS':
        notifications = await generateProductivityInsights(workspaceId, session.user.id)
        break
      
      case 'TASK_RECOMMENDATIONS':
        notifications = await generateTaskRecommendations(workspaceId, session.user.id, context)
        break
      
      case 'TEAM_COLLABORATION':
        notifications = await generateCollaborationNotifications(workspaceId)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Create notifications in database
    const createdNotifications = await Promise.all(
      notifications.map(notification =>
        db.notification.create({
          data: notification
        })
      )
    )

    return NextResponse.json({
      success: true,
      notificationsCreated: createdNotifications.length,
      notifications: createdNotifications
    })
  } catch (error) {
    console.error('Smart notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart notifications' },
      { status: 500 }
    )
  }
}

async function generateDailySummaryNotifications(workspaceId: string): Promise<Array<{
  userId: string
  title: string
  message: string
  type: NotificationType
}>> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: true }
      },
      projects: {
        include: {
          tasks: {
            where: {
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      }
    }
  })

  if (!workspace) return []

  const notifications: Array<{
    userId: string
    title: string
    message: string
    type: NotificationType
  }> = []
  const completedTasks = workspace.projects.flatMap(p => 
    p.tasks.filter(t => t.status === 'DONE')
  )

  for (const member of workspace.members) {
    const userTasks = workspace.projects.flatMap(p => 
      p.tasks.filter(t => t.assigneeId === member.userId)
    )
    const userCompletedTasks = userTasks.filter(t => t.status === 'DONE')

    if (userTasks.length > 0) {
      const summary = await aiAssistant.generateInactivityReminder(
        member.user.name || member.user.email,
        0, // Not inactivity, repurposing for daily summary
        {
          completedTasks: userCompletedTasks.length,
          totalTasks: userTasks.length,
          workspaceName: workspace.name
        }
      )

      notifications.push({
        userId: member.userId,
        title: `Daily Summary - ${workspace.name}`,
        message: `You completed ${userCompletedTasks.length} out of ${userTasks.length} tasks today. ${summary}`,
        type: NotificationType.TASK_COMPLETED
      })
    }
  }

  return notifications
}

async function generateProductivityInsights(workspaceId: string, userId: string): Promise<Array<{
  userId: string
  title: string
  message: string
  type: NotificationType
}>> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      assignedTasks: {
        where: {
          project: { workspaceId },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
          }
        },
        include: { project: true }
      }
    }
  })

  if (!user) return []

  const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE')
  const completionRate = user.assignedTasks.length > 0 
    ? Math.round((completedTasks.length / user.assignedTasks.length) * 100)
    : 0

  let insightMessage = ''
  if (completionRate >= 80) {
    insightMessage = 'Excellent productivity this week! You\'re completing tasks efficiently.'
  } else if (completionRate >= 60) {
    insightMessage = 'Good progress this week. Consider prioritizing high-impact tasks to boost efficiency.'
  } else {
    insightMessage = 'Let\'s focus on completing pending tasks. Break them into smaller, manageable steps.'
  }

  return [{
    userId,
    title: 'Weekly Productivity Insights',
    message: `Your task completion rate: ${completionRate}%. ${insightMessage}`,
    type: NotificationType.TASK_UPDATED
  }]
}

async function generateTaskRecommendations(workspaceId: string, userId: string, context: any): Promise<Array<{
  userId: string
  title: string
  message: string
  type: NotificationType
}>> {
  // Get user's recent tasks and project context
  const userTasks = await db.task.findMany({
    where: {
      assigneeId: userId,
      project: { workspaceId },
      status: { in: ['TODO', 'IN_PROGRESS'] }
    },
    include: { project: true },
    take: 10
  })

  if (userTasks.length === 0) return []

  // Generate AI recommendations based on task patterns
  const taskSuggestions = await aiAssistant.generateTasks({
    description: `Based on current tasks: ${userTasks.map(t => t.title).join(', ')}`,
    projectContext: userTasks[0]?.project.name || '',
    userRole: 'MEMBER',
    existingTasks: userTasks.map(t => ({ title: t.title, status: t.status }))
  })

  const recommendations = taskSuggestions.slice(0, 2).map(suggestion => ({
    userId,
    title: 'AI Task Recommendation',
    message: `Consider this task: "${suggestion.title}" - ${suggestion.description}`,
    type: NotificationType.TASK_ASSIGNED
  }))

  return recommendations
}

async function generateCollaborationNotifications(workspaceId: string): Promise<Array<{
  userId: string
  title: string
  message: string
  type: NotificationType
}>> {
  // Find tasks that need collaboration or are blocked
  const blockedTasks = await db.task.findMany({
    where: {
      project: { workspaceId },
      status: 'IN_PROGRESS',
      updatedAt: {
        lt: new Date(Date.now() - 48 * 60 * 60 * 1000) // No updates for 48 hours
      }
    },
    include: {
      assignee: true,
      creator: true,
      project: {
        include: {
          members: {
            include: { user: true }
          }
        }
      }
    }
  })

  const notifications: Array<{
    userId: string
    title: string
    message: string
    type: NotificationType
  }> = []

  for (const task of blockedTasks) {
    if (task.assignee && task.creator && task.assignee.id !== task.creator.id) {
      // Notify creator that assignee might need help
      notifications.push({
        userId: task.creator.id,
        title: 'Team Collaboration Needed',
        message: `"${task.title}" assigned to ${task.assignee.name} hasn't been updated in 2 days. Consider checking in.`,
        type: NotificationType.TASK_UPDATED
      })

      // Notify project members that task might be blocked
      const projectAdmins = task.project.members.filter(m => 
        m.role === 'ADMIN' && m.userId !== task.assignee?.id && m.userId !== task.creator.id
      )

      for (const admin of projectAdmins) {
        notifications.push({
          userId: admin.userId,
          title: 'Potential Task Bottleneck',
          message: `Task "${task.title}" in ${task.project.name} may need attention or collaboration support.`,
          type: NotificationType.TASK_DUE_SOON
        })
      }
    }
  }

  return notifications
}

import { NextRequest, NextResponse } from 'next/server'
import { aiAssistant } from '@/lib/ai-assistant'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Workspace health API called')
    
    const session = await getAuthSession(request)
    
    if (!session) {
      console.log('❌ No authentication session found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', session.user.email)

    // Get workspace ID from query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get workspace with all related data
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: true
          }
        },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true
              }
            }
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Check permissions - user must be admin or owner
    const userMembership = workspace.members.find(m => m.userId === session.user.id)
    if (!userMembership || (userMembership.role !== 'ADMIN' && userMembership.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Calculate workspace metrics
    const now = new Date()
    const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0) // 9 AM
    const lunchStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0) // 1 PM
    const lunchEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0) // 2 PM
    const workEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0) // 6 PM

    const isWorkingHours = (
      (now >= workStart && now < lunchStart) || 
      (now >= lunchEnd && now < workEnd)
    )

    // Get user activities for today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const userActivities = await Promise.all(
      workspace.members.map(async (member) => {
        let activities: any[] = []
        
        // Try to get activities, fallback to empty array if table doesn't exist
        try {
          activities = await (db as any).activityLog?.findMany({
            where: {
              userName: member.user.name || member.user.email,
              originalTimestamp: {
                gte: todayStart,
                lt: todayEnd
              }
            },
            orderBy: { originalTimestamp: 'desc' }
          }) || []
        } catch (error) {
          console.warn('ActivityLog table query failed:', error)
          activities = []
        }

        const lastActivity = activities[0]
        const minutesSinceLastActivity = lastActivity 
          ? Math.floor((now.getTime() - lastActivity.originalTimestamp.getTime()) / (1000 * 60))
          : 999

        // Count activities by hour
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
          const hourStart = new Date(todayStart.getTime() + hour * 60 * 60 * 1000)
          const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
          
          return activities.filter(a => 
            a.originalTimestamp >= hourStart && a.originalTimestamp < hourEnd
          ).length
        })

        // Work hours activity (9-13, 14-18)
        const morningActivity = hourlyActivity.slice(9, 13).reduce((a, b) => a + b, 0)
        const eveningActivity = hourlyActivity.slice(14, 18).reduce((a, b) => a + b, 0)
        const workHoursActivity = morningActivity + eveningActivity

        // Calculate work-life balance score
        const nonWorkActivity = hourlyActivity.slice(0, 9).reduce((a, b) => a + b, 0) +
                               hourlyActivity.slice(18).reduce((a, b) => a + b, 0)
        const workLifeBalanceScore = nonWorkActivity > 0 ? 
          Math.min(100, (nonWorkActivity / (workHoursActivity + nonWorkActivity)) * 100) : 0

        return {
          userId: member.userId,
          user: member.user,
          role: member.role,
          lastActivity: lastActivity?.originalTimestamp,
          minutesSinceLastActivity,
          isInactive: minutesSinceLastActivity > 120, // 2 hours
          todayActivities: activities.length,
          workHoursActivity,
          workLifeBalanceScore,
          hourlyActivity,
          needsBreakReminder: isWorkingHours && minutesSinceLastActivity < 10 && workHoursActivity > 20
        }
      })
    )

    // Calculate overall workspace metrics
    const totalTasks = workspace.projects.reduce((acc, p) => acc + p.tasks.length, 0)
    const completedTasks = workspace.projects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.status === 'DONE').length, 0
    )
    const overdueTasks = workspace.projects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length, 0
    )

    const workspaceData = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        memberCount: workspace.members.length,
        activeProjects: workspace.projects.length,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      userActivities,
      workingHours: {
        isCurrentlyWorkHours: isWorkingHours,
        schedule: {
          morning: '09:00-13:00',
          lunch: '13:00-14:00',
          evening: '14:00-18:00'
        }
      },
      timestamp: now.toISOString()
    }

    // Generate AI health report
    let healthReport
    try {
      healthReport = await aiAssistant.analyzeWorkspaceHealth(
        userActivities,
        [], // activities are already included in userActivities
        { start: todayStart, end: todayStart }
      )
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      // Provide fallback health report if AI fails
      healthReport = {
        overallScore: Math.round(userActivities.filter(u => !u.isInactive).length / userActivities.length * 100) || 50,
        productivityScore: Math.round(workspaceData.workspace.completionRate * 0.8 + 20),
        workLifeBalance: 75,
        recommendations: [
          'Monitor team activity levels',
          'Encourage regular breaks',
          'Check on inactive team members'
        ]
      }
    }

    return NextResponse.json({
      workspaceData,
      healthReport,
      inactiveUsers: userActivities.filter(u => u.isInactive),
      breakReminders: userActivities.filter(u => u.needsBreakReminder)
    })
  } catch (error) {
    console.error('Workspace health monitoring error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze workspace health' },
      { status: 500 }
    )
  }
}

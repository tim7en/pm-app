import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phoneNumber, message, taskId, userId } = body

    if (action === 'send_notification') {
      // Send WhatsApp notification
      const zai = await ZAI.create()
      
      // Get task details if taskId is provided
      let taskDetails = ''
      if (taskId) {
        const task = await db.task.findUnique({
          where: { id: taskId },
          include: {
            project: true,
            assignee: true
          }
        })
        
        if (task) {
          taskDetails = `
📋 *Task:* ${task.title}
📁 *Project:* ${task.project.name}
👤 *Assigned to:* ${task.assignee?.name || 'Unassigned'}
⚡ *Priority:* ${task.priority}
📅 *Due:* ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
✅ *Status:* ${task.status.replace('_', ' ')}
          `.trim()
        }
      }

      const fullMessage = `${message}\n\n${taskDetails}`

      // Use ZAI to send WhatsApp message (simulated)
      // In a real implementation, you would use WhatsApp Business API
      console.log('Sending WhatsApp message to:', phoneNumber)
      console.log('Message:', fullMessage)

      // Store the integration log
      await db.integration.create({
        data: {
          type: 'WHATSAPP',
          config: JSON.stringify({
            action: 'send_notification',
            phoneNumber,
            message: fullMessage,
            taskId,
            timestamp: new Date().toISOString()
          }),
          userId: userId || 'system'
        }
      })

      return NextResponse.json({ success: true, message: 'Notification sent' })
    }

    if (action === 'create_task') {
      // Create task from WhatsApp message
      const { title, description, projectId, priority } = body
      
      if (!title || !projectId) {
        return NextResponse.json({ error: 'Title and project ID are required' }, { status: 400 })
      }

      // Get the highest position in the project
      const lastTask = await db.task.findFirst({
        where: { projectId },
        orderBy: { position: 'desc' }
      })

      const task = await db.task.create({
        data: {
          title,
          description,
          projectId,
          creatorId: userId || 'system',
          priority: priority || 'MEDIUM',
          position: (lastTask?.position || 0) + 1,
        },
        include: {
          project: true,
          assignee: true
        }
      })

      // Log the integration
      await db.integration.create({
        data: {
          type: 'WHATSAPP',
          config: JSON.stringify({
            action: 'create_task',
            taskId: task.id,
            title,
            projectId,
            priority,
            timestamp: new Date().toISOString()
          }),
          userId: userId || 'system'
        }
      })

      return NextResponse.json({ success: true, task })
    }

    if (action === 'quick_status') {
      // Get quick status update for user
      const { userId } = body
      
      const tasks = await db.task.findMany({
        where: {
          assigneeId: userId
        },
        include: {
          project: true
        },
        orderBy: { createdAt: 'desc' }
      })

      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'DONE').length
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
      const overdueTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
      ).length

      const statusMessage = `
📊 *Your Task Summary:*
📋 Total Tasks: ${totalTasks}
✅ Completed: ${completedTasks}
🔄 In Progress: ${inProgressTasks}
⚠️ Overdue: ${overdueTasks}

📈 Completion Rate: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
      `.trim()

      return NextResponse.json({ 
        success: true, 
        message: statusMessage,
        stats: { totalTasks, completedTasks, inProgressTasks, overdueTasks }
      })
    }

    if (action === 'project_updates') {
      // Get project updates
      const { projectId } = body
      
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            include: {
              assignee: true
            }
          },
          members: {
            include: {
              user: true
            }
          }
        }
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
      const recentTasks = project.tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      const recentUpdates = recentTasks.map(task => 
        `• ${task.title} (${task.status.replace('_', ' ')}) - ${task.assignee?.name || 'Unassigned'}`
      ).join('\n')

      const projectMessage = `
📁 *Project:* ${project.name}
📊 *Progress:* ${Math.round((completedTasks / totalTasks) * 100)}% (${completedTasks}/${totalTasks})
👥 *Team:* ${project.members.length} members

*Recent Updates:*
${recentUpdates || 'No recent updates'}
      `.trim()

      return NextResponse.json({ 
        success: true, 
        message: projectMessage,
        project
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('WhatsApp integration error:', error)
    return NextResponse.json(
      { error: 'Failed to process WhatsApp integration' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's WhatsApp integrations
    const integrations = await db.integration.findMany({
      where: {
        userId,
        type: 'WHATSAPP',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Error fetching WhatsApp integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp integrations' },
      { status: 500 }
    )
  }
}
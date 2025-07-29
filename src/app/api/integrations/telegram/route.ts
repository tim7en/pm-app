import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, chatId, message, taskId, userId } = body

    if (action === 'send_notification') {
      // Send Telegram notification
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
📋 Task: ${task.title}
📁 Project: ${task.project.name}
👤 Assigned to: ${task.assignee?.name || 'Unassigned'}
⚡ Priority: ${task.priority}
📅 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
✅ Status: ${task.status.replace('_', ' ')}
          `.trim()
        }
      }

      const fullMessage = `${message}\n\n${taskDetails}`

      // Use ZAI to send Telegram message (simulated)
      // In a real implementation, you would use Telegram Bot API
      console.log('Sending Telegram message to chat:', chatId)
      console.log('Message:', fullMessage)

      // Store the integration log
      await db.integration.create({
        data: {
          type: 'TELEGRAM',
          config: JSON.stringify({
            action: 'send_notification',
            chatId,
            message: fullMessage,
            taskId,
            timestamp: new Date().toISOString()
          }),
          userId: userId || 'system'
        }
      })

      return NextResponse.json({ success: true, message: 'Notification sent' })
    }

    if (action === 'update_task') {
      // Update task from Telegram command
      const { taskId, status, comment } = body
      
      if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
      }

      const updateData: any = {}
      if (status) updateData.status = status
      
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          project: true,
          assignee: true
        }
      })

      // Add comment if provided
      if (comment) {
        await db.comment.create({
          data: {
            content: comment,
            userId: userId || 'system',
            taskId: taskId
          }
        })
      }

      // Log the integration
      await db.integration.create({
        data: {
          type: 'TELEGRAM',
          config: JSON.stringify({
            action: 'update_task',
            taskId,
            status,
            comment,
            timestamp: new Date().toISOString()
          }),
          userId: userId || 'system'
        }
      })

      return NextResponse.json({ success: true, task: updatedTask })
    }

    if (action === 'list_tasks') {
      // List tasks for a user
      const { userId, status, projectId } = body
      
      const where: any = {}
      if (userId) where.assigneeId = userId
      if (status) where.status = status
      if (projectId) where.projectId = projectId

      const tasks = await db.task.findMany({
        where,
        include: {
          project: true,
          assignee: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Limit to 10 tasks for Telegram
      })

      // Format tasks for Telegram
      const taskList = tasks.map((task, index) => {
        return `${index + 1}. ${task.title}
   📁 ${task.project.name}
   ⚡ ${task.priority} | 📅 ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
   ✅ ${task.status.replace('_', ' ')}
   👤 ${task.assignee?.name || 'Unassigned'}`
      }).join('\n\n')

      const responseMessage = tasks.length > 0 
        ? `📋 Your Tasks:\n\n${taskList}`
        : '📭 No tasks found.'

      return NextResponse.json({ success: true, message: responseMessage, tasks })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Telegram integration error:', error)
    return NextResponse.json(
      { error: 'Failed to process Telegram integration' },
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

    // Get user's Telegram integrations
    const integrations = await db.integration.findMany({
      where: {
        userId,
        type: 'TELEGRAM',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Error fetching Telegram integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Telegram integrations' },
      { status: 500 }
    )
  }
}
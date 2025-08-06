import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { hasTaskPermission } from '@/lib/roles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const taskId = id

    // Check if user has permission to view this task
    const hasPermission = await hasTaskPermission(session.user.id, taskId, 'canViewTask')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch comprehensive task data
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        tags: true,
        dependencies: {
          include: {
            dependentTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        dependsOn: {
          include: {
            precedingTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        subtasks: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Create export data structure
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        version: '1.0'
      },
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        verificationStatus: task.verificationStatus,
        verifiedAt: task.verifiedAt,
        rejectionReason: task.rejectionReason,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        creator: task.creator,
        assignee: task.assignee,
        assignees: task.assignees.map(a => ({
          user: a.user,
          assignedBy: a.assignedByUser,
          assignedAt: a.assignedAt
        })),
        project: task.project,
        tags: task.tags,
        subtasks: task.subtasks,
        dependencies: {
          dependsOn: task.dependsOn.map(dep => dep.precedingTask),
          dependentTasks: task.dependencies.map(dep => dep.dependentTask)
        }
      },
      comments: task.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
      })),
      attachments: task.attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        createdAt: attachment.createdAt,
        uploadedBy: attachment.user,
        // Note: File content is not included for security/size reasons
        // Files can be downloaded separately using the download endpoints
        downloadUrl: `/api/tasks/${taskId}/attachments/${attachment.id}`
      })),
      statistics: {
        totalComments: task.comments.length,
        totalAttachments: task.attachments.length,
        totalAttachmentSize: task.attachments.reduce((sum, att) => sum + att.fileSize, 0),
        assigneeCount: task.assignees.length + (task.assignee ? 1 : 0),
        tagCount: task.tags.length,
        subtaskCount: task.subtasks.length,
        dependencyCount: task.dependsOn.length + task.dependencies.length
      }
    }

    // Return as JSON file download
    const jsonString = JSON.stringify(exportData, null, 2)
    const buffer = Buffer.from(jsonString, 'utf-8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="task-${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error exporting task data:', error)
    return NextResponse.json(
      { error: 'Failed to export task data' },
      { status: 500 }
    )
  }
}

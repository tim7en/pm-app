import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { readFile } from 'fs/promises'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: commentId, attachmentId } = await params

    // Get attachment with comment and project info
    const attachment = await db.commentAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        comment: {
          include: {
            task: {
              include: {
                project: {
                  include: {
                    members: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!attachment || attachment.commentId !== commentId) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check if user has access to delete
    const hasAccess = attachment.comment.task.project.members.some(
      member => member.userId === session.user.id
    ) || attachment.comment.task.project.ownerId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete file from filesystem
    try {
      await unlink(attachment.filePath)
    } catch (error) {
      console.warn('File not found on filesystem:', attachment.filePath)
    }

    // Delete from database
    await db.commentAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: commentId, attachmentId } = await params

    // Get attachment with comment and project info
    const attachment = await db.commentAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        comment: {
          include: {
            task: {
              include: {
                project: {
                  include: {
                    members: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!attachment || attachment.commentId !== commentId) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check if user has access to download
    const hasAccess = attachment.comment.task.project.members.some(
      member => member.userId === session.user.id
    ) || attachment.comment.task.project.ownerId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Read and return file
    try {
      const fileBuffer = await readFile(attachment.filePath)
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': attachment.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
          'Content-Length': attachment.fileSize.toString(),
        },
      })
    } catch (error) {
      console.error('Error reading file:', error)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

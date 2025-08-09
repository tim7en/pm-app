import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: taskId, attachmentId } = params

    // Get attachment and verify access
    const attachment = await db.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: taskId,
        task: {
          OR: [
            { assigneeId: session.user.id },
            { creatorId: session.user.id },
            { 
              project: {
                OR: [
                  { ownerId: session.user.id },
                  { members: { some: { userId: session.user.id } } }
                ]
              }
            }
          ]
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      )
    }

    // Read file
    const filePath = join(process.cwd(), attachment.filePath)
    const fileBuffer = await readFile(filePath)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string  }> }
) {
  try {
    const resolvedParams = await params
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { attachmentId } = params

    // Get attachment and verify access
    const attachment = await db.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        OR: [
          { uploadedBy: session.user.id }, // File uploader can delete
          { 
            task: {
              OR: [
                { creatorId: session.user.id }, // Task creator can delete
                { 
                  project: {
                    ownerId: session.user.id // Project owner can delete
                  }
                }
              ]
            }
          }
        ]
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from database
    await db.taskAttachment.delete({
      where: { id: attachmentId }
    })

    // Optionally delete file from filesystem
    try {
      const filePath = join(process.cwd(), attachment.filePath)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError)
      // Continue anyway - database deletion is more important
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}

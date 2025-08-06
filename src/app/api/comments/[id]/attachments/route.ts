import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'

export async function POST(
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

    const commentId = id
    
    // Check if comment exists and user has access to it
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        task: {
          OR: [
            { assigneeId: session.user.id },
            { assignees: { some: { userId: session.user.id } } },
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
      },
      include: {
        task: {
          select: { id: true }
        }
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or access denied' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), 'uploads', 'comments', commentId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(uploadsDir, fileName)

    // Write file
    await writeFile(filePath, buffer)

    // Save to database
    const attachment = await db.commentAttachment.create({
      data: {
        fileName: file.name,
        filePath: `uploads/comments/${commentId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        commentId: commentId,
        uploadedBy: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Error uploading file to comment:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

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

    const commentId = id

    // Get comment attachments - verify user has access to the comment's task
    const attachments = await db.commentAttachment.findMany({
      where: { 
        commentId,
        comment: {
          task: {
            OR: [
              { assigneeId: session.user.id },
              { assignees: { some: { userId: session.user.id } } },
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
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching comment attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

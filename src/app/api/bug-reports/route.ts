import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { NotificationType } from '@prisma/client'

// POST /api/bug-reports - Submit a new bug report
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    // Parse form data
    const formData = await request.formData()
    
    // Extract text fields
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const category = formData.get('category') as string
    const stepsToReproduce = formData.get('stepsToReproduce') as string
    const expectedBehavior = formData.get('expectedBehavior') as string
    const actualBehavior = formData.get('actualBehavior') as string
    const browserInfo = formData.get('browserInfo') as string
    const reportedBy = formData.get('reportedBy') as string
    const reportedByName = formData.get('reportedByName') as string
    const reportedByEmail = formData.get('reportedByEmail') as string

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Validate priority and category
    const validPriorities = ['low', 'medium', 'high', 'critical']
    const validCategories = ['ui', 'functionality', 'performance', 'security', 'other']
    
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Handle file uploads
    const screenshots = formData.getAll('screenshots') as File[]
    const attachmentPaths: string[] = []

    if (screenshots.length > 0) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'bug-reports')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique folder for this bug report
      const reportId = `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const reportDir = path.join(uploadsDir, reportId)
      await mkdir(reportDir, { recursive: true })

      // Process each file
      for (let i = 0; i < Math.min(screenshots.length, 5); i++) {
        const file = screenshots[i]
        
        // Validate file
        if (!file || file.size === 0) continue
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} is too large. Maximum size is 10MB.` },
            { status: 400 }
          )
        }

        // Check file type
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `File ${file.name} has an unsupported file type.` },
            { status: 400 }
          )
        }

        // Generate safe filename
        const fileExtension = path.extname(file.name)
        const safeFileName = `attachment-${i + 1}-${Date.now()}${fileExtension}`
        const filePath = path.join(reportDir, safeFileName)

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Store relative path for database
        attachmentPaths.push(`/bug-reports/${reportId}/${safeFileName}`)
      }
    }

    // Save to database
    const bugReport = await db.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority: priority as any,
        category: category as any,
        stepsToReproduce: stepsToReproduce?.trim() || null,
        expectedBehavior: expectedBehavior?.trim() || null,
        actualBehavior: actualBehavior?.trim() || null,
        browserInfo: browserInfo?.trim() || null,
        attachments: JSON.stringify(attachmentPaths),
        reportedBy: session?.user?.id || null,
        reportedByName: reportedByName?.trim() || 'Anonymous',
        reportedByEmail: reportedByEmail?.trim() || null,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create notification for admins (optional)
    try {
      const adminUsers = await db.user.findMany({
        where: {
          role: 'ADMIN' // Assuming you have user roles
        }
      })

      const notificationPromises = adminUsers.map(admin => 
        db.notification.create({
          data: {
            title: 'New Bug Report',
            message: `${reportedByName || 'A user'} reported a ${priority} priority bug: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`,
            type: 'COMMENT_ADDED' as any,
            userId: admin.id
          }
        })
      )

      await Promise.all(notificationPromises)
    } catch (notificationError) {
      // Don't fail the request if notifications fail
      console.error('Failed to create admin notifications:', notificationError)
    }

    return NextResponse.json({
      success: true,
      id: bugReport.id,
      message: 'Bug report submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Bug report submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    )
  }
}

// GET /api/bug-reports - Get all bug reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin (you might need to adjust this based on your user model)
    // For now, allowing any authenticated user to see bug reports for demo purposes
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const [bugReports, total] = await Promise.all([
      db.bugReport.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      }),
      db.bugReport.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: bugReports.map(report => ({
        ...report,
        attachments: JSON.parse(report.attachments)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch bug reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bug reports' },
      { status: 500 }
    )
  }
}

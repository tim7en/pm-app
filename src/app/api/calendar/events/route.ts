import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(["MEETING", "CALL", "DEADLINE", "REMINDER"]),
  location: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
  projectId: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // TODO: Replace with actual database query after migration
    // For now, return mock data that matches the expected structure
    const mockEvents = [
      {
        id: "event-1",
        title: "Team Standup",
        description: "Daily team meeting",
        startTime: new Date("2025-07-31T09:00:00.000Z"),
        endTime: new Date("2025-07-31T09:30:00.000Z"),
        type: "MEETING",
        location: "Conference Room A",
        notificationEnabled: true,
        workspaceId: workspaceId,
        projectId: null,
        creatorId: session.user.id,
        creator: {
          id: session.user.id,
          name: session.user.name,
          avatar: session.user.avatar,
        },
        project: null,
        attendees: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "event-2",
        title: "Client Call",
        description: "Weekly client check-in",
        startTime: new Date("2025-08-01T14:00:00.000Z"),
        endTime: new Date("2025-08-01T15:00:00.000Z"),
        type: "CALL",
        location: "Zoom Meeting",
        notificationEnabled: true,
        workspaceId: workspaceId,
        projectId: projectId,
        creatorId: session.user.id,
        creator: {
          id: session.user.id,
          name: session.user.name,
          avatar: session.user.avatar,
        },
        project: projectId ? {
          id: projectId,
          name: "Sample Project",
          color: "#3b82f6",
        } : null,
        attendees: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Filter by date range if provided
    let filteredEvents = mockEvents
    if (startDate || endDate) {
      filteredEvents = mockEvents.filter(event => {
        const eventStart = new Date(event.startTime)
        if (startDate && eventStart < new Date(startDate)) return false
        if (endDate && eventStart > new Date(endDate)) return false
        return true
      })
    }

    // Filter by project if provided
    if (projectId) {
      filteredEvents = filteredEvents.filter(event => event.projectId === projectId)
    }

    return NextResponse.json(filteredEvents)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createEventSchema.parse(body)

    // TODO: Replace with actual database operations after migration
    // For now, create a mock event response
    const mockEvent = {
      id: `event-${Date.now()}`,
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      type: data.type,
      location: data.location,
      notificationEnabled: data.notificationEnabled,
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      creatorId: session.user.id,
      creator: {
        id: session.user.id,
        name: session.user.name,
        avatar: session.user.avatar,
      },
      project: data.projectId ? {
        id: data.projectId,
        name: "Sample Project",
        color: "#3b82f6",
      } : null,
      attendees: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json(mockEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

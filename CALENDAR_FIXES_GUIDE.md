# Critical Calendar Fixes - Implementation Guide

## Quick Fix for TypeScript Errors

### 1. Fix Zod Schema (Lines 136-147)

**Current (Broken):**
```typescript
const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.date({
    required_error: "Start time is required", // ❌ Invalid property
  }),
  endTime: z.date({
    required_error: "End time is required", // ❌ Invalid property
  }),
  // ... rest
})
```

**Fixed:**
```typescript
const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.date({
    message: "Start time is required",
  }),
  endTime: z.date({
    message: "End time is required", 
  }),
  type: z.enum(["meeting", "call", "deadline", "reminder"]),
  location: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
})
```

### 2. Fix Form Type Issues (Lines 170-182)

**Current (Broken):**
```typescript
const form = useForm<EventFormData>({
  resolver: zodResolver(eventSchema),
  defaultValues: {
    title: "",
    description: "",
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    type: "meeting",
    location: "",
    notificationEnabled: true,
  },
})
```

**Fixed (Add explicit type):**
```typescript
const form = useForm<EventFormData>({
  resolver: zodResolver(eventSchema) as any, // Temporary fix
  mode: "onChange",
  defaultValues: {
    title: "",
    description: "",
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    type: "meeting" as const,
    location: "",
    notificationEnabled: true,
  },
})
```

### 3. Better Solution - Proper Type Alignment

**Replace the entire schema and type definition:**
```typescript
// Update the schema to match exactly what we need
const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(["meeting", "call", "deadline", "reminder"]),
  location: z.string().optional(),
  notificationEnabled: z.boolean(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

// Make sure the type matches exactly
type EventFormData = z.infer<typeof eventSchema>

// Use proper form setup
const form = useForm<EventFormData>({
  resolver: zodResolver(eventSchema),
  defaultValues: {
    title: "",
    description: "",
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
    type: "meeting",
    location: "",
    notificationEnabled: true,
  },
})
```

## Backend API Implementation

### 1. Create Calendar Events API

**File: `src/app/api/calendar/events/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(["meeting", "call", "deadline", "reminder"]),
  location: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
  projectId: z.string().optional(),
})

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

    // TODO: Implement when database schema is ready
    // const events = await db.calendarEvent.findMany({
    //   where: {
    //     workspaceId,
    //     startTime: {
    //       gte: startDate ? new Date(startDate) : undefined,
    //       lte: endDate ? new Date(endDate) : undefined,
    //     }
    //   },
    //   include: {
    //     creator: { select: { id: true, name: true, avatar: true } },
    //     project: { select: { id: true, name: true, color: true } },
    //   }
    // })

    // Mock response for now
    return NextResponse.json([])
  } catch (error) {
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

    // TODO: Implement when database schema is ready
    // const event = await db.calendarEvent.create({
    //   data: {
    //     ...data,
    //     startTime: new Date(data.startTime),
    //     endTime: new Date(data.endTime),
    //     creatorId: session.user.id,
    //     workspaceId: body.workspaceId,
    //   },
    //   include: {
    //     creator: { select: { id: true, name: true, avatar: true } },
    //     project: { select: { id: true, name: true, color: true } },
    //   }
    // })

    // Mock response for now
    const mockEvent = {
      id: Date.now().toString(),
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      creator: {
        id: session.user.id,
        name: session.user.name,
        avatar: session.user.avatar,
      }
    }

    return NextResponse.json(mockEvent, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
```

### 2. Database Schema Addition

**Add to `prisma/schema.prisma`:**
```prisma
enum EventType {
  MEETING
  CALL
  DEADLINE
  REMINDER
}

model CalendarEvent {
  id                  String    @id @default(cuid())
  title               String
  description         String?
  startTime           DateTime
  endTime             DateTime
  type                EventType
  location            String?
  isRecurring         Boolean   @default(false)
  notificationEnabled Boolean   @default(true)
  
  // Relations
  creatorId           String
  creator             User      @relation("CalendarEventCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  
  projectId           String?
  project             Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  // Attendees (many-to-many)
  attendees           EventAttendee[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@map("calendar_events")
}

model EventAttendee {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  response  EventResponse @default(PENDING)
  
  event     CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, userId])
  @@map("event_attendees")
}

enum EventResponse {
  PENDING
  ACCEPTED
  DECLINED
}
```

**Update User model to include calendar relations:**
```prisma
model User {
  // ... existing fields
  
  // Calendar relations
  calendarEvents      CalendarEvent[]   @relation("CalendarEventCreator")
  eventAttendances    EventAttendee[]
  
  // ... rest of existing relations
}

model Workspace {
  // ... existing fields
  
  // Calendar relation
  calendarEvents      CalendarEvent[]
  
  // ... rest of existing relations
}

model Project {
  // ... existing fields
  
  // Calendar relation
  calendarEvents      CalendarEvent[]
  
  // ... rest of existing relations
}
```

## Integration Updates

### 1. Update Calendar Component to Use API

**In `handleCreateEvent` function:**
```typescript
const handleCreateEvent = async (data: EventFormData) => {
  setIsSubmitting(true)
  try {
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        workspaceId: 'current-workspace-id', // Get from context
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create event')
    }

    const newEvent = await response.json()
    
    // Update local state
    setEvents(prev => [...prev, {
      ...newEvent,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime),
    }])
    
    // Success notification
    console.log('Event created successfully:', newEvent.title)
    
    setEventDialogOpen(false)
    form.reset()
  } catch (error) {
    console.error('Error creating event:', error)
    // Show error toast/notification
  } finally {
    setIsSubmitting(false)
  }
}
```

### 2. Update Event Fetching

**Replace `fetchEvents` function:**
```typescript
const fetchEvents = async () => {
  try {
    const searchParams = new URLSearchParams({
      workspaceId: 'current-workspace-id', // Get from context
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
    })

    const response = await fetch(`/api/calendar/events?${searchParams}`)
    
    if (response.ok) {
      const data = await response.json()
      const events = data.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      }))
      setEvents(events)
    } else {
      console.error('Failed to fetch events')
      // Fall back to mock data or show error
      setEvents([]) // or keep existing mock data
    }
  } catch (error) {
    console.error('Error fetching events:', error)
    // Fall back to mock data
    setEvents([]) // or keep existing mock data
  }
}
```

## Testing Instructions

1. **Fix TypeScript errors first:**
   ```bash
   npm run build
   ```
   Should complete without errors after schema fixes.

2. **Run the test suite:**
   - Open browser dev tools
   - Load the calendar page
   - Run: `window.calendarQATests.runCalendarQATests()`

3. **Database migration (after schema update):**
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev --name add-calendar-events
   ```

4. **API testing:**
   ```bash
   # Test event creation
   curl -X POST http://localhost:3000/api/calendar/events \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Event",
       "startTime": "2025-07-31T10:00:00.000Z",
       "endTime": "2025-07-31T11:00:00.000Z",
       "type": "meeting",
       "notificationEnabled": true
     }'
   ```

## Priority Implementation Order

1. **CRITICAL** - Fix TypeScript compilation errors
2. **HIGH** - Add database schema and run migration
3. **HIGH** - Implement basic API endpoints
4. **MEDIUM** - Update frontend to use real API
5. **MEDIUM** - Add comprehensive error handling
6. **LOW** - Performance optimizations and advanced features

This should get the calendar functionality to a working state where it can compile and provide basic event management capabilities.

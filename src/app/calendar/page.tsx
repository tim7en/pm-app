"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Target,
  Flag,
  Circle,
  CheckCircle2,
  Clock,
  Users,
  FolderOpen,
  Video,
  Phone,
  Mail,
  Bell,
  Settings
} from "lucide-react"
import { TaskStatus, Priority, ProjectStatus } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: Date
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
  }
  project: {
    id: string
    name: string
    color: string
  }
  commentCount: number
  attachmentCount: number
  subtaskCount: number
  completedSubtaskCount: number
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: ProjectStatus
  taskCount: number
  completedTaskCount: number
  memberCount: number
  owner: {
    id: string
    name: string
    avatar?: string
  }
  isStarred: boolean
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: 'meeting' | 'call' | 'deadline' | 'reminder'
  attendees?: Array<{
    id: string
    name: string
    avatar?: string
  }>
  location?: string
  isRecurring?: boolean
  notificationEnabled: boolean
  projectId?: string
}

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  type: z.enum(["meeting", "call", "deadline", "reminder"]),
  location: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
})

type EventFormData = z.infer<typeof eventSchema>

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
  projects: Project[]
  events: CalendarEvent[]
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    fetchEvents()
  }, [])

  const handleCreateEvent = async (data: EventFormData) => {
    setIsSubmitting(true)
    try {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        location: data.location,
        notificationEnabled: data.notificationEnabled,
      }
      
      setEvents(prev => [...prev, newEvent])
      
      // Send notification if enabled
      if (data.notificationEnabled) {
        // Here you would integrate with your notification system
        console.log('Notification sent for event:', data.title)
      }
      
      setEventDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchEvents = async () => {
    try {
      // Mock events for now
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Team Standup",
          description: "Daily team standup meeting",
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 25), // Tomorrow + 1 hour
          type: "meeting",
          attendees: [
            { id: "1", name: "John Doe" },
            { id: "2", name: "Jane Smith" },
          ],
          location: "Conference Room A",
          notificationEnabled: true,
        },
        {
          id: "2",
          title: "Client Call",
          description: "Quarterly review with client",
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 48), // Day after tomorrow
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 50), // Day after tomorrow + 2 hours
          type: "call",
          notificationEnabled: true,
        },
        {
          id: "3",
          title: "Project Deadline",
          description: "Submit final project deliverables",
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 72), // In 3 days
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 72),
          type: "deadline",
          notificationEnabled: true,
        }
      ]
      setEvents(mockEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: CalendarDay[] = []
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonth.getDate() - i)
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
        projects: [],
        events: []
      })
    }
    
    // Add current month's days
    const today = new Date()
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i)
      const isToday = dayDate.toDateString() === today.toDateString()
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday,
        tasks: getTasksForDate(dayDate),
        projects: getProjectsForDate(dayDate),
        events: getEventsForDate(dayDate)
      })
    }
    
    // Add next month's days to fill the grid
    const totalCells = 42 // 6 rows x 7 days
    const remainingCells = totalCells - days.length
    for (let i = 1; i <= remainingCells; i++) {
      const dayDate = new Date(year, month + 1, i)
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
        projects: [],
        events: []
      })
    }
    
    return days
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const getProjectsForDate = (date: Date) => {
    // For demo purposes, let's show projects that have tasks due on this date
    return projects.filter(project => {
      const projectTasks = tasks.filter(task => 
        task.project.id === project.id && task.dueDate
      )
      return projectTasks.some(task => {
        const taskDate = new Date(task.dueDate!)
        return taskDate.toDateString() === date.toDateString()
      })
    })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-500'
      case Priority.HIGH: return 'bg-orange-500'
      case Priority.MEDIUM: return 'bg-yellow-500'
      case Priority.LOW: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'bg-gray-100 text-gray-800'
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800'
      case TaskStatus.REVIEW: return 'bg-yellow-100 text-yellow-800'
      case TaskStatus.DONE: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[dayIndex]
  }

  const calendarDays = getDaysInMonth(currentDate)
  const selectedTasks = getTasksForDate(selectedDate)
  const selectedProjects = getProjectsForDate(selectedDate)
  const selectedEvents = getEventsForDate(selectedDate)

  const upcomingDeadlines = tasks
    .filter(task => task.dueDate && new Date(task.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          tasks={tasks}
          projects={projects}
          users={[]}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Calendar</h1>
                <p className="text-muted-foreground mt-1">View deadlines and schedule</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold min-w-[200px] text-center">
                    {getMonthName(currentDate)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" onClick={() => setEventDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{tasks.filter(t => t.dueDate).length}</p>
                      <p className="text-xs text-muted-foreground">Tasks with Deadlines</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{upcomingDeadlines.length}</p>
                      <p className="text-xs text-muted-foreground">Upcoming Deadlines</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{overdueTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {tasks.filter(t => t.dueDate && t.status === TaskStatus.DONE).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed on Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day headers */}
                      {Array.from({ length: 7 }, (_, i) => (
                        <div key={i} className="text-center text-sm font-medium text-muted-foreground p-2">
                          {getDayName(i)}
                        </div>
                      ))}
                      
                      {/* Calendar days */}
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={`
                            min-h-[100px] p-2 border border-gray-100 cursor-pointer hover:bg-gray-50
                            ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                            ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                          `}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <div className="text-sm font-medium mb-1">
                            {day.date.getDate()}
                          </div>
                          
                          {/* Event indicators */}
                          <div className="space-y-1">
                            {(day.events || []).slice(0, 2).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`
                                  text-xs p-1 rounded truncate
                                  ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${event.type === 'call' ? 'bg-green-100 text-green-800' : ''}
                                  ${event.type === 'deadline' ? 'bg-red-100 text-red-800' : ''}
                                  ${event.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' : ''}
                                `}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {(day.events || []).length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{(day.events || []).length - 2} more events
                              </div>
                            )}
                          </div>
                          
                          {/* Task indicators */}
                          <div className="space-y-1">
                            {(day.tasks || []).slice(0, 3).map((task, taskIndex) => (
                              <div
                                key={taskIndex}
                                className={`
                                  w-2 h-2 rounded-full
                                  ${getPriorityColor(task.priority)}
                                `}
                                title={`${task.title} (${task.priority})`}
                              />
                            ))}
                            {(day.tasks || []).length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{(day.tasks || []).length - 3}
                              </div>
                            )}
                          </div>
                          
                          {/* Project indicators */}
                          <div className="flex gap-1 mt-1">
                            {day.projects.slice(0, 2).map((project, projectIndex) => (
                              <div
                                key={projectIndex}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                                title={project.name}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Selected Date Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Events for selected date */}
                    {selectedEvents.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Events ({selectedEvents.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.map((event) => (
                            <div key={event.id} className="p-2 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{event.title}</span>
                                <div className={`
                                  text-xs px-2 py-1 rounded-full
                                  ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${event.type === 'call' ? 'bg-green-100 text-green-800' : ''}
                                  ${event.type === 'deadline' ? 'bg-red-100 text-red-800' : ''}
                                  ${event.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' : ''}
                                `}>
                                  {event.type}
                                </div>
                              </div>
                              {event.location && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  📍 {event.location}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(event.startTime, 'p')} - {format(event.endTime, 'p')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tasks for selected date */}
                    {selectedTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Tasks ({selectedTasks.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedTasks.map((task) => (
                            <div key={task.id} className="p-2 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{task.title}</span>
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: task.project.color }}
                                  title={task.project.name}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Projects for selected date */}
                    {selectedProjects.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          Projects ({selectedProjects.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedProjects.map((project) => (
                            <div key={project.id} className="p-2 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="font-medium text-sm">{project.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTasks.length === 0 && selectedProjects.length === 0 && selectedEvents.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No events, tasks, or projects scheduled for this date
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingDeadlines.length > 0 ? (
                        upcomingDeadlines.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-2 border rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(task.dueDate!).toLocaleDateString()}
                              </p>
                            </div>
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: task.project.color }}
                              title={task.project.name}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No upcoming deadlines
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Overdue Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {overdueTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-2 border border-red-200 rounded-lg bg-red-50">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-red-600">
                                Due {new Date(task.dueDate!).toLocaleDateString()}
                              </p>
                            </div>
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: task.project.color }}
                              title={task.project.name}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Schedule a new event, meeting, or call
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter event description"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP p")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP p")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="meeting">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Meeting
                            </div>
                          </SelectItem>
                          <SelectItem value="call">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Call
                            </div>
                          </SelectItem>
                          <SelectItem value="deadline">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Deadline
                            </div>
                          </SelectItem>
                          <SelectItem value="reminder">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              Reminder
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notificationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Send Notifications</FormLabel>
                      <FormDescription className="text-sm">
                        Send email notifications for this event
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEventDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
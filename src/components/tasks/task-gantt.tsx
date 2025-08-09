"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Edit,
  Trash2,
  User,
  Clock,
  Flag
} from "lucide-react"
import { TaskStatus, Priority } from '@/lib/prisma-mock'
import { useTranslation } from "@/hooks/use-translation"

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
    workspaceId: string
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
  estimatedHours?: number
  actualHours?: number
}

interface TaskGanttProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: any) => Promise<void>
  onTaskDelete: (taskId: string) => Promise<void>
  onTaskEdit: (task: Task) => void
  currentUserId?: string
}

type ViewMode = 'week' | 'month' | 'quarter'

export function TaskGantt({ 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskEdit,
  currentUserId 
}: TaskGanttProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedTaskNewDate, setDraggedTaskNewDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
          days: eachDayOfInterval({
            start: startOfWeek(currentDate),
            end: endOfWeek(currentDate)
          })
        }
      case 'month':
        const monthStart = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
        const monthEnd = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
        return {
          start: monthStart,
          end: monthEnd,
          days: eachDayOfInterval({ start: monthStart, end: monthEnd })
        }
      case 'quarter':
        const quarterStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0)
        return {
          start: startOfWeek(quarterStart),
          end: endOfWeek(quarterEnd),
          days: eachDayOfInterval({ start: startOfWeek(quarterStart), end: endOfWeek(quarterEnd) })
        }
    }
  }

  const dateRange = getDateRange()

  // Filter tasks that have due dates within the visible range or are overdue
  const visibleTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate >= dateRange.start && taskDate <= dateRange.end
  })

  // Group tasks by project
  const tasksByProject = visibleTasks.reduce((acc, task) => {
    const projectId = task.project.id
    if (!acc[projectId]) {
      acc[projectId] = {
        project: task.project,
        tasks: []
      }
    }
    acc[projectId].tasks.push(task)
    return acc
  }, {} as Record<string, { project: any, tasks: Task[] }>)

  // Calculate task position and width
  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return { left: 0, width: 0, visible: false }
    
    const taskDate = new Date(task.dueDate)
    const totalDays = dateRange.days.length
    const dayWidth = 100 / totalDays
    
    // Find the day index
    const dayIndex = dateRange.days.findIndex(day => isSameDay(day, taskDate))
    
    if (dayIndex === -1) return { left: 0, width: 0, visible: false }
    
    // Task duration (default to 1 day if not specified)
    const duration = task.estimatedHours ? Math.max(1, Math.ceil(task.estimatedHours / 8)) : 1
    const width = Math.min(dayWidth * duration, dayWidth * (totalDays - dayIndex))
    
    return {
      left: dayIndex * dayWidth,
      width: width,
      visible: true
    }
  }

  // Get priority color
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-500 border-red-600'
      case Priority.HIGH: return 'bg-orange-500 border-orange-600'
      case Priority.MEDIUM: return 'bg-yellow-500 border-yellow-600'
      case Priority.LOW: return 'bg-green-500 border-green-600'
      default: return 'bg-gray-500 border-gray-600'
    }
  }

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'bg-gray-500'
      case TaskStatus.IN_PROGRESS: return 'bg-blue-500'
      case TaskStatus.REVIEW: return 'bg-yellow-500'
      case TaskStatus.DONE: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  // Handle navigation
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1))
        break
      case 'month':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
        break
      case 'quarter':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 3, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1))
        break
      case 'month':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
        break
      case 'quarter':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 3, 1))
        break
    }
  }

  // Handle task drag
  const handleTaskDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTaskDragEnd = async () => {
    if (draggedTask && draggedTaskNewDate) {
      try {
        await onTaskUpdate(draggedTask.id, {
          dueDate: draggedTaskNewDate
        })
      } catch (error) {
        console.error('Error updating task due date:', error)
      }
    }
    setDraggedTask(null)
    setDraggedTaskNewDate(null)
  }

  const handleDayDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDayDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedTask) {
      setDraggedTaskNewDate(day)
    }
  }

  // Get current period label
  const getCurrentPeriodLabel = () => {
    switch (viewMode) {
      case 'week':
        return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1
        return `Q${quarter} ${currentDate.getFullYear()}`
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t("tasks.ganttChart")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigatePrevious}
                className="rounded-r-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 text-sm font-medium min-w-[200px] text-center border-x">
                {getCurrentPeriodLabel()}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateNext}
                className="rounded-l-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto gantt-scroll">
          <div className="min-w-[800px] p-6">
            {/* Date Header */}
            <div className="grid grid-cols-12 gap-1 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 -my-2">
              <div className="col-span-3 font-medium text-sm text-muted-foreground flex items-center">
                Project / Task
              </div>
              <div 
                className="col-span-9 grid gap-1 gantt-grid"
                style={{ 
                  gridTemplateColumns: `repeat(${dateRange.days.length}, 1fr)`,
                  '--grid-columns': dateRange.days.length
                }}
              >
                {dateRange.days.map((day, index) => {
                  const isToday = isSameDay(day, new Date())
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "text-center text-xs p-2 rounded transition-colors",
                        isToday && "bg-primary text-primary-foreground font-medium shadow-sm",
                        isWeekend && !isToday && "gantt-weekend",
                        !isToday && !isWeekend && "text-muted-foreground hover:bg-accent/30"
                      )}
                      onDragOver={handleDayDragOver}
                      onDrop={(e) => handleDayDrop(day, e)}
                    >
                      <div className="font-medium">
                        {format(day, viewMode === 'week' ? 'EEE' : 'd')}
                      </div>
                      {viewMode === 'week' && (
                        <div className="text-[10px] opacity-70 mt-0.5">
                          {format(day, 'MMM d')}
                        </div>
                      )}
                      {viewMode === 'month' && day.getDate() === 1 && (
                        <div className="text-[10px] opacity-70 mt-0.5">
                          {format(day, 'MMM')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tasks by Project */}
            <div className="space-y-6">
              {Object.entries(tasksByProject).map(([projectId, { project, tasks }]) => (
                <div key={projectId} className="space-y-3">
                  {/* Project Header */}
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-3 flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ 
                          backgroundColor: project.color,
                          boxShadow: `0 0 8px ${project.color}40`
                        }}
                      />
                      <span className="font-semibold text-sm">{project.name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div 
                      className="col-span-9 relative h-8 bg-muted/10 rounded-sm gantt-grid"
                      style={{ '--grid-columns': dateRange.days.length }}
                    >
                      {/* Project timeline background with grid */}
                    </div>
                  </div>

                  {/* Project Tasks */}
                  {tasks.map((task, taskIndex) => {
                    const position = getTaskPosition(task)
                    if (!position.visible) return null

                    return (
                      <div key={task.id} className="grid grid-cols-12 gap-1 group">
                        <div className="col-span-3 pl-6">
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div 
                                className="text-sm cursor-pointer hover:text-primary truncate p-2 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                                onClick={() => setSelectedTask(task)}
                              >
                                <div 
                                  className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))}
                                />
                                <span className="flex-1 truncate">{task.title}</span>
                                {task.assignee && (
                                  <User className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => onTaskEdit(task)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Task
                              </ContextMenuItem>
                              <ContextMenuItem 
                                onClick={() => onTaskDelete(task.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Task
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                        <div className="col-span-9 relative h-10 flex items-center">
                          <div
                            className={cn(
                              "absolute h-7 rounded-lg border-2 cursor-move gantt-task flex items-center px-3 min-w-[80px] shadow-sm",
                              getPriorityColor(task.priority),
                              task.status === TaskStatus.DONE && "opacity-75",
                              draggedTask?.id === task.id && "gantt-task dragging"
                            )}
                            style={{
                              left: `${position.left}%`,
                              width: `${Math.max(position.width, 8)}%`,
                              animationDelay: `${taskIndex * 0.1}s`
                            }}
                            draggable
                            onDragStart={(e) => handleTaskDragStart(task, e)}
                            onDragEnd={handleTaskDragEnd}
                            title={`${task.title}\nDue: ${format(new Date(task.dueDate!), 'PPP')}\nPriority: ${task.priority}\nStatus: ${task.status}${task.assignee ? `\nAssigned to: ${task.assignee.name}` : ''}`}
                          >
                            <div className="flex items-center gap-2 text-white text-xs overflow-hidden w-full">
                              <Flag className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate flex-1 font-medium">{task.title}</span>
                              {task.subtaskCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-auto bg-white/20 text-white border-white/30">
                                  {task.completedSubtaskCount}/{task.subtaskCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {Object.keys(tasksByProject).length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-3">
                  No tasks with due dates in this period
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Tasks need due dates to appear in the Gantt chart. Set due dates for your tasks to visualize your project timeline.
                </p>
              </div>
            )}

            {/* Legend */}
            {Object.keys(tasksByProject).length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">Priority:</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>Urgent</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500" />
                        <span>High</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-500" />
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>Low</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span>Todo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>In Progress</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span>Review</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

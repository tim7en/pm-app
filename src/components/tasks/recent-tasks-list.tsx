"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TaskCard } from "./task-card"
import { useTranslation } from "@/hooks/use-translation"
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  MoreHorizontal,
  Filter,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  assigneeId?: string
  creatorId?: string
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

interface RecentTasksListProps {
  tasks: Task[]
  onTaskStatusChange: (taskId: string, status: string) => Promise<boolean>
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => Promise<boolean>
  currentUserId?: string
  maxHeight?: string
  showFilter?: boolean
}

export function RecentTasksList({
  tasks,
  onTaskStatusChange,
  onTaskEdit,
  onTaskDelete,
  currentUserId,
  maxHeight = "400px",
  showFilter = true
}: RecentTasksListProps) {
  const [filterAge, setFilterAge] = useState<'all' | '1day' | '3days' | '7days'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'status'>('recent')
  const { t } = useTranslation()

  // Calculate task age and opacity based on recency
  const getTaskAge = (task: Task) => {
    const now = new Date()
    const updatedAt = new Date(task.updatedAt)
    const createdAt = new Date(task.createdAt)
    
    // Use most recent timestamp (either created or updated)
    const latestActivity = updatedAt > createdAt ? updatedAt : createdAt
    
    const minutesAgo = differenceInMinutes(now, latestActivity)  
    const hoursAgo = Math.floor(minutesAgo / 60)
    const daysAgo = differenceInDays(now, latestActivity)
    
    return {
      minutesAgo,
      hoursAgo,
      daysAgo,
      latestActivity,
      isRecent: hoursAgo < 24,
      isNew: minutesAgo < 60
    }
  }

  // Get opacity based on task age for fade effect
  const getTaskOpacity = (task: Task) => {
    const { daysAgo, hoursAgo, isNew } = getTaskAge(task)
    
    // Completed tasks get reduced opacity regardless of age
    if (task.status === 'DONE') return 0.6
    
    // New tasks (< 1 hour) get full opacity with sparkle effect
    if (isNew) return 1.0
    
    // Recent tasks (< 1 day) get high opacity
    if (hoursAgo < 24) return 0.95
    
    // Tasks 1-3 days old get medium opacity
    if (daysAgo <= 3) return 0.85
    
    // Tasks 3-7 days old get lower opacity  
    if (daysAgo <= 7) return 0.7
    
    // Older tasks get minimum opacity
    return 0.5
  }

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]
    
    // Apply age filter
    if (filterAge !== 'all') {
      const now = new Date()
      const cutoffDays = filterAge === '1day' ? 1 : filterAge === '3days' ? 3 : 7
      
      filtered = filtered.filter(task => {
        const { daysAgo } = getTaskAge(task)
        return daysAgo <= cutoffDays
      })
    }
    
    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const ageA = getTaskAge(a)
          const ageB = getTaskAge(b)
          return ageB.latestActivity.getTime() - ageA.latestActivity.getTime()
          
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
                 
        case 'status':
          const statusOrder = { TODO: 1, IN_PROGRESS: 2, REVIEW: 3, DONE: 4 }
          return (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 0)
                 
        default:
          return 0
      }
    })
    
    return filtered
  }, [tasks, filterAge, sortBy])

  // Format relative time for display
  const formatRelativeTime = (task: Task) => {
    const { minutesAgo, hoursAgo, daysAgo, isNew } = getTaskAge(task)
    
    if (isNew) return 'Just now'
    if (minutesAgo < 60) return `${minutesAgo}m ago`
    if (hoursAgo < 24) return `${hoursAgo}h ago`
    if (daysAgo === 1) return 'Yesterday'
    if (daysAgo < 7) return `${daysAgo}d ago`
    return format(new Date(task.updatedAt), 'MMM d')
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500'
      case 'HIGH': return 'text-orange-500'
      case 'MEDIUM': return 'text-yellow-500'
      case 'LOW': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'DONE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("dashboard.recentTasks")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedTasks.length} {t("dashboard.totalTasks")} • {t("dashboard.autoFadingByAge")}
            </p>
          </div>
          
          {showFilter && (
            <div className="flex items-center gap-2">
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All time</option>
                <option value="1day">Last day</option>
                <option value="3days">Last 3 days</option>
                <option value="7days">Last week</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="recent">Most recent</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="w-full" style={{ height: maxHeight }}>
          <div className="space-y-2 pr-4">
            {filteredAndSortedTasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("dashboard.noRecentTasks")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.tasksWillAppearHere")}
                </p>
              </div>
            ) : (
              filteredAndSortedTasks.map((task) => {
                const taskAge = getTaskAge(task)
                const opacity = getTaskOpacity(task)
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "relative rounded-lg border p-3 transition-all duration-500 ease-in-out hover:shadow-md",
                      "bg-background/50 backdrop-blur-sm",
                      taskAge.isNew && "ring-2 ring-blue-200 shadow-lg"
                    )}
                    style={{ opacity }}
                  >
                    {/* New task indicator */}
                    {taskAge.isNew && (
                      <div className="absolute -top-1 -right-1">
                        <div className="flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          New
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* Task Status Checkbox */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 mt-1"
                        onClick={() => onTaskStatusChange(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                      >
                        {task.status === 'DONE' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </Button>
                      
                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium text-sm mb-1",
                              task.status === 'DONE' && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h4>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            {/* Task Meta */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: task.project.color }}
                                />
                                <span>{task.project.name}</span>
                              </div>
                              
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions and Time */}
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(task)}
                            </span>
                            
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Assignee */}
                        {task.assignee && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

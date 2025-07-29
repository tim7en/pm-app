"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2,
  Circle,
  User,
  Flag,
  ArrowUpDown,
  Plus
} from "lucide-react"
import { TaskStatus, Priority } from "@prisma/client"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskListProps {
  tasks: Array<{
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
  }>
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskDelete?: (taskId: string) => void
  onTaskEdit?: (task: any) => void
  onCreateTask?: () => void
}

const statusColors = {
  [TaskStatus.TODO]: "bg-gray-100 text-gray-800",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [TaskStatus.REVIEW]: "bg-yellow-100 text-yellow-800",
  [TaskStatus.DONE]: "bg-green-100 text-green-800",
}

const priorityColors = {
  [Priority.LOW]: "text-gray-500",
  [Priority.MEDIUM]: "text-yellow-500",
  [Priority.HIGH]: "text-orange-500",
  [Priority.URGENT]: "text-red-500",
}

const priorityLabels = {
  [Priority.LOW]: "Low",
  [Priority.MEDIUM]: "Medium",
  [Priority.HIGH]: "High",
  [Priority.URGENT]: "Urgent",
}

export function TaskList({ tasks, onTaskUpdate, onTaskDelete, onTaskEdit, onCreateTask }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case "priority":
        const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case "status":
        const statusOrder = { TODO: 1, IN_PROGRESS: 2, REVIEW: 3, DONE: 4 }
        return statusOrder[a.status] - statusOrder[b.status]
      default:
        return 0
    }
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (task: any) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value={Priority.LOW}>Low</SelectItem>
              <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={Priority.HIGH}>High</SelectItem>
              <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={onCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tasks ({sortedTasks.length})</span>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Checkbox */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={() => onTaskUpdate?.(task.id, { 
                    status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE 
                  })}
                >
                  {task.status === TaskStatus.DONE ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className={`font-medium text-sm ${task.status === TaskStatus.DONE ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${statusColors[task.status]}`}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                    <span className="text-xs text-muted-foreground">
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {task.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: task.project.color }}
                      />
                      <span>{task.project.name}</span>
                    </div>
                    
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-500' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    
                    {task.subtaskCount > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{task.completedSubtaskCount}/{task.subtaskCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {task.commentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{task.commentCount}</span>
                    </div>
                  )}
                  
                  {task.attachmentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="h-3 w-3" />
                      <span>{task.attachmentCount}</span>
                    </div>
                  )}
                  
                  {task.assignee ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Unassigned</span>
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onTaskUpdate?.(task.id, { 
                          status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE 
                        })}
                      >
                        {task.status === TaskStatus.DONE ? 'Mark as Incomplete' : 'Mark as Complete'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTaskDelete?.(task.id)} className="text-red-600">
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            
            {sortedTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  No tasks found
                </p>
                <Button variant="outline" size="sm" onClick={onCreateTask}>
                  <Plus className="h-3 w-3 mr-2" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
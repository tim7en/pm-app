"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateInitialsAvatar, getDefaultAvatarByIndex } from "@/lib/avatars"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2,
  Circle,
  User,
  UserCheck,
  Flag,
  Brain,
  Sparkles,
  Loader2
} from "lucide-react"
import { TaskStatus, Priority } from "@prisma/client"

interface TaskCardProps {
  task: {
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
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  onEdit?: (task: any) => void
  onDelete?: (taskId: string) => void
  currentUserId?: string
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

export function TaskCard({ task, onStatusChange, onEdit, onDelete, currentUserId }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAiFeedback, setShowAiFeedback] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<string>("")
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  const handleStatusToggle = async () => {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
    
    // If marking as complete, get AI feedback
    if (newStatus === TaskStatus.DONE && task.assignee?.id === currentUserId) {
      await generateAiFeedback()
    }
    
    onStatusChange?.(task.id, newStatus)
  }

  const generateAiFeedback = async () => {
    setLoadingFeedback(true)
    try {
      const response = await fetch('/api/ai/task-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          completionTime: 1 // Could be calculated from task creation/start time
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiFeedback(data.feedback)
        setShowAiFeedback(true)
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowAiFeedback(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE

  return (
    <Card 
      className="group hover-lift glass-card cursor-pointer border-2 hover:border-primary/20 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mt-0.5 flex-shrink-0 hover-lift rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusToggle()
              }}
            >
              {task.status === TaskStatus.DONE ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base transition-all duration-300 ${
                task.status === TaskStatus.DONE 
                  ? 'line-through text-muted-foreground' 
                  : 'group-hover:text-primary'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover-lift rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-0 shadow-premium">
              <DropdownMenuItem 
                onClick={() => onEdit?.(task)}
                className="gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
              >
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(task.id)}
                className="gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
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
          
          {/* Assignment badge */}
          {currentUserId && task.assignee?.id === currentUserId && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
              <UserCheck className="h-3 w-3 mr-1" />
              Assigned to you
            </Badge>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
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

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Project */}
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: task.project.color }}
              />
              <span>{task.project.name}</span>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Subtasks */}
            {task.subtaskCount > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{task.completedSubtaskCount}/{task.subtaskCount}</span>
              </div>
            )}

            {/* Comments */}
            {task.commentCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.commentCount}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachmentCount > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachmentCount}</span>
              </div>
            )}

            {/* Assignee */}
            {task.assignee ? (
              <Avatar className="h-5 w-5">
                <AvatarImage 
                  src={task.assignee.avatar || getDefaultAvatarByIndex(task.assignee.id.charCodeAt(0)).url} 
                  alt={task.assignee.name} 
                />
                <AvatarFallback className={`text-xs ${
                  task.assignee.avatar 
                    ? '' 
                    : generateInitialsAvatar(task.assignee.name).backgroundColor
                }`}>
                  {generateInitialsAvatar(task.assignee.name).initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Unassigned</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* AI Feedback Display */}
      {(showAiFeedback || loadingFeedback) && (
        <div className="px-4 pb-4">
          <Alert className="border-green-200 bg-green-50">
            <div className="flex items-center gap-2">
              {loadingFeedback ? (
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              ) : (
                <Sparkles className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium text-green-800">AI Feedback</span>
            </div>
            <AlertDescription className="mt-2 text-sm text-green-700">
              {loadingFeedback ? (
                "Generating personalized feedback..."
              ) : (
                aiFeedback
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  )
}
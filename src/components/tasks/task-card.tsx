"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Flag
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

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleStatusToggle = () => {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
    onStatusChange?.(task.id, newStatus)
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
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit?.(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusToggle()
              }}
            >
              {task.status === TaskStatus.DONE ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${task.status === TaskStatus.DONE ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(task.id)}>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
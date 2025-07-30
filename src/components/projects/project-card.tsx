"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Star,
  FolderOpen,
  Crown,
  UserCheck
} from "lucide-react"
import { ProjectStatus } from "@prisma/client"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    color: string
    status: ProjectStatus
    taskCount?: number
    completedTaskCount?: number
    memberCount?: number
    owner?: {
      id: string
      name: string
      avatar?: string
    }
    dueDate?: Date
    isStarred?: boolean
    recentActivity?: Array<{
      id: string
      type: string
      message: string
      createdAt: Date
    }>
  }
  onEdit?: (project: any) => void
  onDelete?: (projectId: string) => void
  onToggleStar?: (projectId: string) => void
  onViewTasks?: (projectId: string) => void
  currentUserId?: string
}

const statusColors = {
  [ProjectStatus.ACTIVE]: "bg-green-100 text-green-800",
  [ProjectStatus.ARCHIVED]: "bg-gray-100 text-gray-800",
  [ProjectStatus.COMPLETED]: "bg-blue-100 text-blue-800",
}

const statusLabels = {
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.ARCHIVED]: "Archived",
  [ProjectStatus.COMPLETED]: "Completed",
}

export function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onToggleStar, 
  onViewTasks,
  currentUserId 
}: ProjectCardProps) {
  const progressPercentage = (project.taskCount || 0) > 0 
    ? Math.round(((project.completedTaskCount || 0) / (project.taskCount || 1)) * 100)
    : 0

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== ProjectStatus.COMPLETED

  return (
    <Card className="group hover:shadow-md transition-all cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: project.color + '20' }}
            >
              <FolderOpen className="h-5 w-5" style={{ color: project.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">{project.name}</h3>
                {/* Project participation badges */}
                {currentUserId && project.owner?.id === currentUserId && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Creator
                  </Badge>
                )}
                {currentUserId && project.owner?.id !== currentUserId && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleStar?.(project.id)
                  }}
                >
                  <Star 
                    className={`h-4 w-4 ${project.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                  />
                </Button>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${statusColors[project.status]}`}
                >
                  {statusLabels[project.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{project.completedTaskCount || 0} of {project.taskCount || 0} tasks</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{Math.round(((project.completedTaskCount || 0) / (project.taskCount || 1)) * 100)}% complete</span>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="space-y-3">
          {/* Due Date */}
          {project.dueDate && (
            <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-4 w-4" />
              <span>Due {formatDate(project.dueDate)}</span>
              {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
            </div>
          )}

          {/* Team Members */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {project.memberCount || 0} member{(project.memberCount || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex -space-x-2">
              {project.owner && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                  <AvatarFallback className="text-xs">
                    {project.owner.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              {(project.memberCount || 0) > 1 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">+{(project.memberCount || 0) - 1}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {project.recentActivity && project.recentActivity.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recent activity</span>
              </div>
              <div className="space-y-1">
                {project.recentActivity.slice(0, 2).map((activity) => (
                  <div key={activity.id} className="text-xs text-muted-foreground">
                    {activity.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onViewTasks?.(project.id)
            }}
          >
            View Tasks
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStar?.(project.id)}>
                {project.isStarred ? 'Remove from Favorites' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(project.id)}
                className="text-red-600"
              >
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  MoreHorizontal,
  Star,
  FolderOpen,
  Crown,
  UserCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useProjectPermissions } from "@/hooks/use-permissions"
import { ProjectEditGate, ProjectDeleteGate } from "@/components/auth/permission-gate"

// Define ProjectStatus enum locally to avoid import issues
enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE", 
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED"
}

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
  onGenerateInsights?: (projectId: string, projectName: string) => void
  currentUserId?: string
}

const statusColors = {
  [ProjectStatus.ACTIVE]: "bg-green-100 text-green-800",
  [ProjectStatus.ARCHIVED]: "bg-gray-100 text-gray-800",
  [ProjectStatus.COMPLETED]: "bg-blue-100 text-blue-800",
}

export function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onToggleStar, 
  onViewTasks,
  onGenerateInsights,
  currentUserId 
}: ProjectCardProps) {
  const { t } = useTranslation()
  
  // Get project permissions
  const { 
    canEdit: canEditProject,
    canDelete: canDeleteProject,
    canManageMembers,
    loading: permissionsLoading
  } = useProjectPermissions(project.id)
  
  // Debug logging to check project data
  console.log('ProjectCard project data:', {
    id: project.id,
    name: project.name,
    taskCount: project.taskCount,
    completedTaskCount: project.completedTaskCount,
    permissions: { canEditProject, canDeleteProject, canManageMembers }
  })
  
  const statusLabels = {
    [ProjectStatus.ACTIVE]: t("projects.active"),
    [ProjectStatus.ARCHIVED]: t("projects.archived"), 
    [ProjectStatus.COMPLETED]: t("projects.completed"),
  }
  
  // const [aiAssessment, setAiAssessment] = useState<any>(null)
  // const [loadingAssessment, setLoadingAssessment] = useState(false)  // AI assessment disabled due to API key issues
  // // Generate AI assessment on hover for active projects
  // useEffect(() => {
  //   if (project.status === ProjectStatus.ACTIVE && (project.taskCount || 0) > 0) {
  //     const timer = setTimeout(() => {
  //       generateAssessment()
  //     }, 1000) // Delay to avoid excessive API calls
      
  //     return () => clearTimeout(timer)
  //   }
  // }, [project.id])

  // const generateAssessment = async () => {
  //   if (loadingAssessment || aiAssessment) return
    
  //   setLoadingAssessment(true)
  //   try {
  //     const response = await fetch(`/api/ai/assess-project?projectId=${project.id}`)
  //     if (response.ok) {
  //       const data = await response.json()
  //       setAiAssessment(data.assessment)
  //     }
  //   } catch (error) {
  //     console.error('Error generating project assessment:', error)
  //   } finally {
  //     setLoadingAssessment(false)
  //   }
  // }

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

  // Get progress icon based on completion percentage and status
  const getProgressIcon = () => {
    if (project.status === ProjectStatus.COMPLETED) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    if (progressPercentage === 0) {
      return <Circle className="h-5 w-5 text-gray-400" />
    }
    if (progressPercentage < 50) {
      return <Clock className="h-5 w-5 text-yellow-600" />
    }
    if (progressPercentage < 90) {
      return <Target className="h-5 w-5 text-blue-600" />
    }
    return <TrendingUp className="h-5 w-5 text-green-600" />
  }

  return (
    <div 
      className="group bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/20"
      onClick={() => onViewTasks?.(project.id)}
    >
      <div className="flex items-center gap-4">
        {/* Progress Icon */}
        <div className="flex-shrink-0">
          {getProgressIcon()}
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-base truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
              {project.name}
            </h3>
            
            {/* Status Badge */}
            <Badge 
              variant="secondary" 
              className={`text-xs ${statusColors[project.status]} flex-shrink-0`}
            >
              {statusLabels[project.status]}
            </Badge>

            {/* Project participation badges */}
            {currentUserId && project.owner?.id === currentUserId && (
              <Badge variant="outline" className="text-xs font-medium text-amber-600 border-amber-200 bg-amber-50 flex-shrink-0">
                <Crown className="h-3 w-3 mr-1" />
                {t("projects.creator")}
              </Badge>
            )}
            {currentUserId && project.owner?.id !== currentUserId && (
              <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 flex-shrink-0">
                <UserCheck className="h-3 w-3 mr-1" />
                {t("projects.member")}
              </Badge>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground truncate mb-3">
              {project.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {project.completedTaskCount || 0} / {project.taskCount || 0} {t("projects.tasks")}
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Due Date */}
          {project.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(project.dueDate)}</span>
            </div>
          )}

          {/* Team Members */}
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {project.memberCount || 0}
            </span>
            <div className="flex -space-x-1">
              {project.owner && (
                <Avatar className="h-5 w-5 border border-background">
                  <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                  <AvatarFallback className="text-xs">
                    {project.owner.name ? project.owner.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              {(project.memberCount || 0) > 1 && (
                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-xs font-medium">+{(project.memberCount || 0) - 1}</span>
                </div>
              )}
            </div>
          </div>

          {/* Star Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 hover-lift rounded-lg"
            onClick={(e) => {
              e.stopPropagation()
              onToggleStar?.(project.id)
            }}
          >
            <Star 
              className={`h-3 w-3 ${project.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
            />
          </Button>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                disabled={permissionsLoading}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onViewTasks?.(project.id)
                }}
              >
                {t("projects.viewTasks")}
              </DropdownMenuItem>
              <ProjectEditGate 
                projectId={project.id}
                fallback={null}
              >
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(project)
                  }}
                >
                  {t("projects.editProject")}
                </DropdownMenuItem>
              </ProjectEditGate>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar?.(project.id)
                }}
              >
                {project.isStarred ? t("projects.removeFromFavorites") : t("projects.addToFavorites")}
              </DropdownMenuItem>
              
              <ProjectDeleteGate 
                projectId={project.id}
                fallback={null}
              >
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(project.id)
                  }}
                  className="text-red-600"
                >
                  {t("projects.deleteProject")}
                </DropdownMenuItem>
              </ProjectDeleteGate>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
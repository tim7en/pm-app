"use client"

import { useState, useEffect } from "react"
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
  UserCheck,
  Brain,
  TrendingUp,
  Target,
  Zap
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

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
  
  // Debug logging to check project data
  console.log('ProjectCard project data:', {
    id: project.id,
    name: project.name,
    taskCount: project.taskCount,
    completedTaskCount: project.completedTaskCount
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

  return (
    <Card 
      className="group hover-lift glass-card overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 cursor-pointer"
      onClick={() => onViewTasks?.(project.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${project.color}20 0%, ${project.color}10 100%)`,
                border: `1px solid ${project.color}30`
              }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: project.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg break-words line-clamp-2 mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                    {project.name}
                  </h3>
                  {/* Project participation badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentUserId && project.owner?.id === currentUserId && (
                      <Badge variant="outline" className="text-xs font-medium text-amber-600 border-amber-200 bg-amber-50 flex-shrink-0 hover:bg-amber-100 transition-colors">
                        <Crown className="h-3 w-3 mr-1" />
                        {t("projects.creator")}
                      </Badge>
                    )}
                    {currentUserId && project.owner?.id !== currentUserId && (
                      <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 flex-shrink-0 hover:bg-blue-100 transition-colors">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {t("projects.member")}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover-lift rounded-lg"
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
                <p className="text-sm text-muted-foreground break-words line-clamp-2 mb-2 overflow-hidden">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${statusColors[project.status]} flex-shrink-0`}
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
            <span className="text-muted-foreground">{t("projects.progress")}</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{project.completedTaskCount || 0} {t("projects.of")} {project.taskCount || 0} {t("projects.tasks")}</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>{progressPercentage}% {t("projects.complete")}</span>
            </div>
          </div>
        </div>

        {/* AI Assessment - Commented out automatic generation */}
        {/* 
        {(aiAssessment || loadingAssessment) && project.status === ProjectStatus.ACTIVE && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Insights</span>
            </div>
            
            {loadingAssessment ? (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Analyzing project efficiency...
              </div>
            ) : aiAssessment && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">Efficiency:</span>
                    <span className="text-xs font-medium">{aiAssessment.efficiencyScore || 'N/A'}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Trend:</span>
                    <span className="text-xs font-medium">{aiAssessment.trend || 'Stable'}</span>
                  </div>
                </div>
                
                {aiAssessment.quickInsight && (
                  <div className="flex items-start gap-1">
                    <Zap className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {aiAssessment.quickInsight}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        */}

        {/* Meta Information */}
        <div className="space-y-3">
          {/* Due Date */}
          {project.dueDate && (
            <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-4 w-4" />
              <span>{t("projects.due")} {formatDate(project.dueDate)}</span>
              {isOverdue && <Badge variant="destructive" className="text-xs">{t("projects.overdue")}</Badge>}
            </div>
          )}

          {/* Team Members */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {project.memberCount || 0} {t("projects.members", { count: project.memberCount || 0 })}
              </span>
            </div>
            <div className="flex -space-x-2">
              {project.owner && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                  <AvatarFallback className="text-xs">
                    {project.owner.name ? project.owner.name.split(' ').map(n => n[0]).join('') : 'U'}
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
                <span className="text-sm text-muted-foreground">{t("projects.recentActivity")}</span>
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
            {t("projects.viewTasks")}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onGenerateInsights?.(project.id, project.name)
            }}
            className="flex items-center gap-1"
          >
            <Brain className="h-4 w-4" />
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
                {t("projects.editProject")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStar?.(project.id)}>
                {project.isStarred ? t("projects.removeFromFavorites") : t("projects.addToFavorites")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(project.id)}
                className="text-red-600"
              >
                {t("projects.deleteProject")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
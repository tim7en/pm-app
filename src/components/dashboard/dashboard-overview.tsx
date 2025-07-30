import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { ProjectCard } from "@/components/projects/project-card"
import { ActivityFeed } from "./activity-feed"
// import { AIWorkspaceMonitor } from "./ai-workspace-monitor"
import { TeamMembers } from "./team-members"
import { Plus, CheckCircle, Clock, AlertTriangle, Users, FolderOpen, Calendar } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"
import { useState, useEffect } from "react"

interface DashboardOverviewProps {
  tasks: any[]
  projects: any[]
  activities: ActivityItem[]
  onTaskStatusChange: (taskId: string, status: string) => Promise<boolean>
  onTaskEdit: (task: any) => void
  onTaskDelete: (taskId: string) => Promise<boolean>
  onProjectEdit: (project: any) => void
  onProjectDelete: (projectId: string) => Promise<boolean>
  onProjectToggleStar: (projectId: string) => void
  onCreateProject: () => void
  onClearActivity?: () => void
  onRestoreActivity?: () => void
  activitiesCleared?: boolean
  onViewTasks?: (projectId: string) => void
  onGenerateInsights?: (projectId: string, projectName: string) => void
  currentUserId?: string
  workspaceId?: string
}

export function DashboardOverview({ 
  tasks, 
  projects, 
  activities,
  onTaskStatusChange,
  onTaskEdit,
  onTaskDelete,
  onProjectEdit,
  onProjectDelete,
  onProjectToggleStar,
  onCreateProject,
  onClearActivity,
  onRestoreActivity,
  activitiesCleared,
  onViewTasks,
  onGenerateInsights,
  currentUserId,
  workspaceId
}: DashboardOverviewProps) {
  
  // Calculate quick stats
  const completedTasks = tasks.filter(task => task.status === 'DONE').length
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
  const overdueTasks = tasks.filter(task => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  }).length
  const activeProjects = projects.filter(p => p.status === 'ACTIVE')

  // Recent tasks - prioritize user's assigned tasks, then created tasks, then others
  const getUserRecentTasks = () => {
    if (!currentUserId) return tasks.slice(0, 6)
    
    const assignedTasks = tasks.filter(task => task.assigneeId === currentUserId)
    const createdTasks = tasks.filter(task => task.creatorId === currentUserId && task.assigneeId !== currentUserId)
    const otherTasks = tasks.filter(task => task.assigneeId !== currentUserId && task.creatorId !== currentUserId)
    
    // Combine and limit to 6 for better display
    const recentTasks = [...assignedTasks, ...createdTasks, ...otherTasks].slice(0, 6)
    return recentTasks
  }
  
  const recentTasks = getUserRecentTasks()

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-primary">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-500">{inProgressTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FolderOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-green-500">{activeProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks and Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">My Recent Tasks</CardTitle>
                  <CardDescription>
                    Your assigned and created tasks
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/tasks" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    View All
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onStatusChange={onTaskStatusChange}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks yet</p>
                  <p className="text-sm text-muted-foreground">Create your first task to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <CardDescription>
                    Projects you own and participate in
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={onCreateProject} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeProjects.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                    {activeProjects.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project}
                        onEdit={onProjectEdit}
                        onDelete={onProjectDelete}
                        onToggleStar={onProjectToggleStar}
                        onViewTasks={onViewTasks}
                        onGenerateInsights={onGenerateInsights}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active projects</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={onCreateProject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity and Team */}
        <div className="space-y-6">
          <ActivityFeed 
            activities={activities} 
            currentUserId={currentUserId}
            onClearActivity={onClearActivity}
            onRestoreActivity={onRestoreActivity}
            activitiesCleared={activitiesCleared}
          />
          
          <TeamMembers 
            workspaceId={workspaceId}
            maxHeight="400px"
          />
          
          {/* Commented out AI Workspace Monitor for now */}
          {/* 
          <AIWorkspaceMonitor 
            workspaceId={workspaceId}
          />
          */}
        </div>
      </div>
    </div>
  )
}

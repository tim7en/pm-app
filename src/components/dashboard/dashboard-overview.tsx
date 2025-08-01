import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { ProjectCard } from "@/components/projects/project-card"
import { ActivityFeed } from "./activity-feed"
import { RecentTasksList } from "@/components/tasks/recent-tasks-list"
import { ExpandableChatWindow } from "./expandable-chat-window"
import { TeamChatDialog } from "@/components/messages/team-chat-dialog"
import { TeamMembers } from "./team-members"
import { Plus, CheckCircle, Clock, AlertTriangle, Users, FolderOpen, Calendar, MessageSquare } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"
import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"

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
  const [chatWindowOpen, setChatWindowOpen] = useState(false)
  const { t } = useTranslation()
  
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
    
    // Combine and limit to 10 for better display in scrollable list
    const recentTasks = [...assignedTasks, ...createdTasks, ...otherTasks].slice(0, 10)
    return recentTasks
  }

  const recentTasks = getUserRecentTasks()

  const handleStartChat = (memberId: string) => {
    setChatWindowOpen(true)
    // The chat window will handle member selection
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.completed")}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.inProgress")}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">{inProgressTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 group-hover:from-red-500/30 group-hover:to-red-600/30 transition-all duration-300">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.overdue")}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">{overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift glass-card group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 group-hover:from-violet-500/30 group-hover:to-violet-600/30 transition-all duration-300">
                <FolderOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.activeProjects")}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">{activeProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tasks and Projects */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Tasks with Dynamic Fading */}
          <div className="animate-slide-up">
            <RecentTasksList 
              tasks={recentTasks}
              onTaskStatusChange={onTaskStatusChange}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              currentUserId={currentUserId}
              maxHeight="450px"
              showFilter={true}
            />
          </div>

          {/* Active Projects */}
          <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {t("dashboard.activeProjects")}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {t("dashboard.projectsYouOwnAndParticipate")}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCreateProject} 
                  className="flex items-center gap-2 hover-lift border-2 hover:border-primary/50"
                >
                  <Plus className="h-4 w-4" />
                  {t("dashboard.newProject")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeProjects.length > 0 ? (
                <div className="max-h-96 overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2">
                    {activeProjects.map((project, index) => (
                      <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <ProjectCard 
                          project={project}
                          onEdit={onProjectEdit}
                          onDelete={onProjectDelete}
                          onToggleStar={onProjectToggleStar}
                          onViewTasks={onViewTasks}
                          onGenerateInsights={onGenerateInsights}
                          currentUserId={currentUserId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-3">{t("dashboard.noActiveProjects")}</p>
                  <Button 
                    variant="default" 
                    size="lg"
                    className="mt-2 hover-lift"
                    onClick={onCreateProject}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t("dashboard.createYourFirstProject")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity and Team */}
        <div className="space-y-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <ActivityFeed 
              activities={activities} 
              currentUserId={currentUserId}
              onClearActivity={onClearActivity}
              onRestoreActivity={onRestoreActivity}
              activitiesCleared={activitiesCleared}
            />
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <TeamMembers 
              workspaceId={workspaceId}
              maxHeight="400px"
              onStartChat={handleStartChat}
            />
          </div>

          {/* Team Communication */}
          <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                {t("dashboard.teamCommunication")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("dashboard.chatWithTeamMembers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => setChatWindowOpen(true)}
                  className="w-full hover-lift"
                  size="lg"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t("dashboard.openTeamChat")}
                </Button>
                
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                  {t("dashboard.messagesPersistInfo")}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Commented out AI Workspace Monitor for now */}
          {/* 
          <AIWorkspaceMonitor 
            workspaceId={workspaceId}
          />
          */}
        </div>
      </div>

      {/* Expandable Chat Window */}
      {/* Team Chat Dialog */}
      <TeamChatDialog
        isOpen={chatWindowOpen}
        onOpenChange={setChatWindowOpen}
        workspaceId={workspaceId}
      />
    </div>
  )
}

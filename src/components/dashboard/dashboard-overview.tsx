import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { ProjectCard } from "@/components/projects/project-card"
import { ActivityFeed } from "./activity-feed"
import { RecentTasksList } from "@/components/tasks/recent-tasks-list"
import { ExpandableChatWindow } from "./expandable-chat-window"
import { TeamChatDialog } from "@/components/messages/team-chat-dialog"
// import { AIWorkspaceMonitor } from "./ai-workspace-monitor"
import { TeamMembers } from "./team-members"
import { Plus, CheckCircle, Clock, AlertTriangle, Users, FolderOpen, Calendar, MessageSquare } from "lucide-react"
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
  const [chatWindowOpen, setChatWindowOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
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

  // Fetch team members for chat functionality
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!workspaceId) return
      
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members`)
        if (response.ok) {
          const data = await response.json()
          
          // Transform the data to match our interface
          const transformedMembers = data.map((member: any) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatar: member.user.avatar,
            role: member.role,
            isOnline: Math.random() > 0.3, // Simulate online status - 70% chance online
            lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random last seen within 24h
            department: ['Engineering', 'Design', 'Product', 'Marketing', 'Sales'][Math.floor(Math.random() * 5)],
            title: ['Developer', 'Designer', 'Product Manager', 'Marketing Specialist', 'Sales Rep'][Math.floor(Math.random() * 5)]
          }))
          
          setTeamMembers(transformedMembers)
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }

    fetchTeamMembers()
  }, [workspaceId])
  
  const recentTasks = getUserRecentTasks()

  const handleStartChat = (memberId: string) => {
    setChatWindowOpen(true)
    // The chat window will handle member selection
  }

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
          {/* Recent Tasks with Dynamic Fading */}
          <RecentTasksList 
            tasks={recentTasks}
            onTaskStatusChange={onTaskStatusChange}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            currentUserId={currentUserId}
            maxHeight="450px"
            showFilter={true}
          />

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
            onStartChat={handleStartChat}
          />

          {/* Team Communication */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Team Communication
              </CardTitle>
              <CardDescription>
                Chat with your team members in real-time. Messages are saved and accessible even when team members are offline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team members online:</span>
                  <span className="font-medium">
                    {teamMembers.filter(m => m.isOnline).length} of {teamMembers.length}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setChatWindowOpen(true)}
                    className="flex-1"
                    size="lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Team Chat
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  💡 Messages persist across sessions - your team can read messages even if they were offline when you sent them.
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { ProjectCard } from "@/components/projects/project-card"
import { ActivityFeed } from "./activity-feed"
import { AIWorkspaceMonitor } from "./ai-workspace-monitor"
import { Plus, Brain, TrendingUp, Target, Lightbulb, Sparkles } from "lucide-react"
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
  currentUserId,
  workspaceId
}: DashboardOverviewProps) {
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  // Generate AI insights for dashboard
  useEffect(() => {
    generateAiInsights()
  }, [projects.length, tasks.length])

  const generateAiInsights = async () => {
    if (projects.length === 0) return
    
    setLoadingInsights(true)
    try {
      // Get insights for the most active project
      const activeProject = projects.find(p => p.status === 'ACTIVE') || projects[0]
      if (activeProject) {
        const response = await fetch(`/api/ai/assess-project?projectId=${activeProject.id}`)
        if (response.ok) {
          const data = await response.json()
          setAiInsights(data.assessment)
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  // Recent tasks - prioritize user's assigned tasks, then created tasks, then others
  const getUserRecentTasks = () => {
    if (!currentUserId) return tasks.slice(0, 8) // Show more tasks when scrollable
    
    const assignedTasks = tasks.filter(task => task.assigneeId === currentUserId)
    const createdTasks = tasks.filter(task => task.creatorId === currentUserId && task.assigneeId !== currentUserId)
    const otherTasks = tasks.filter(task => task.assigneeId !== currentUserId && task.creatorId !== currentUserId)
    
    // Combine and limit to 8 total for better display with scrolling
    const recentTasks = [...assignedTasks, ...createdTasks, ...otherTasks].slice(0, 8)
    return recentTasks
  }
  
  const recentTasks = getUserRecentTasks()
  
  // Active projects
  const activeProjects = projects.filter(p => p.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      {aiInsights && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Intelligent analysis of your workspace productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efficiency Score</p>
                  <p className="font-semibold">{aiInsights.efficiencyScore || 'N/A'}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Trend</p>
                  <p className="font-semibold">{aiInsights.trend || 'Stable'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Focus Area</p>
                  <p className="font-semibold">{aiInsights.focusArea || 'Balanced'}</p>
                </div>
              </div>
            </div>
            
            {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Smart Recommendations
                </h4>
                <div className="space-y-1">
                  {aiInsights.recommendations.slice(0, 2).map((rec: string, index: number) => (
                    <p key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 font-medium">•</span>
                      {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {loadingInsights && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Analyzing workspace productivity...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Your assigned and created tasks, prioritized for your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
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
                  {recentTasks.length === 8 && tasks.length > 8 && (
                    <div className="text-center pt-3 border-t mt-3">
                      <p className="text-xs text-muted-foreground">
                        Showing {recentTasks.length} of {tasks.length} tasks • Visit Tasks page for more
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed & AI Monitor */}
        <div className="space-y-6">
          <ActivityFeed 
            activities={activities} 
            currentUserId={currentUserId}
            onClearActivity={onClearActivity}
          />
          
          {/* AI Workspace Monitor */}
          <AIWorkspaceMonitor 
            workspaceId={workspaceId}
            refreshInterval={5}
          />
        </div>
      </div>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>
            Projects you own and participate in - manage your work efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onEdit={onProjectEdit}
                onDelete={onProjectDelete}
                onToggleStar={onProjectToggleStar}
                currentUserId={currentUserId}
              />
            ))}
            <Card 
              className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors"
              onClick={onCreateProject}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px]">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Create New Project</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

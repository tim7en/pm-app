import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/tasks/task-card"
import { ProjectCard } from "@/components/projects/project-card"
import { ActivityFeed } from "./activity-feed"
import { Plus } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"

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
  currentUserId
}: DashboardOverviewProps) {
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

        {/* Activity Feed */}
        <ActivityFeed 
          activities={activities} 
          currentUserId={currentUserId}
          onClearActivity={onClearActivity}
        />
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

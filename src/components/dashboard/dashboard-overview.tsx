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
  onCreateProject
}: DashboardOverviewProps) {
  // Recent tasks (limit to 5 for display)
  const recentTasks = tasks.slice(0, 5)
  
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
              <CardDescription>Your latest tasks and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={onTaskStatusChange}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={activities} />
      </div>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Your ongoing projects and progress</CardDescription>
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

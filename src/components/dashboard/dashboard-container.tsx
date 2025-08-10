"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Building2 } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { EnhancedProjectCreation } from "@/components/projects/enhanced-project-creation"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { TaskReassignDialog } from "@/components/tasks/task-reassign-dialog"
import { ProjectInsightsDialog } from "@/components/projects/project-insights-dialog"

import { DashboardHeader } from "./dashboard-header"
import { DashboardStatsCards } from "./dashboard-stats"
import { DashboardOverview } from "./dashboard-overview"
import { TaskManagement } from "./task-management"
import { ProjectManagement } from "./project-management"
import { ActivityFeed, ActivityFeedFull } from "./activity-feed"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"

export function DashboardContainer() {
  const { user, currentWorkspaceId, currentWorkspace } = useAuth()
  const { t } = useTranslation()
  const {
    stats,
    recentActivity,
    projects,
    tasks,
    users,
    isLoading,
    activitiesCleared,
    refreshData,
    fetchProjects,
    fetchTasks,
    addRealtimeActivity,
    clearRecentActivity,
    restoreRecentActivity,
    setRecentActivity
  } = useDashboardData()

  const {
    isSubmitting,
    handleCreateProject,
    handleUpdateProject,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteProject,
    handleDeleteTask,
    handleTaskStatusChange,
    handleImportData
  } = useDashboardActions()

  const router = useRouter()
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [reassignTaskData, setReassignTaskData] = useState<{
    taskId: string
    taskTitle: string
    currentAssigneeId?: string
  } | null>(null)
  const [taskView, setTaskView] = useState<"list" | "board">("list")
  const [insightsDialog, setInsightsDialog] = useState<{
    open: boolean
    projectId: string
    projectName: string
  }>({
    open: false,
    projectId: '',
    projectName: ''
  })

  const onCreateProject = async (projectData: any, tasks?: any[], calendarEvents?: any[]): Promise<any> => {
    console.log('onCreateProject called with:', projectData)
    const createdProject = await handleCreateProject(projectData)
    console.log('Project creation result:', createdProject)
    
    if (createdProject && user) {
      // Add real-time activity for project creation
      addRealtimeActivity({
        id: `realtime-project-created-${Date.now()}`,
        type: 'project', 
        message: `created project '${projectData.name}'`,
        user: {
          name: user.name || 'You',
          avatar: user.avatar || ''
        },
        timestamp: new Date()
      })
      
      // Refresh projects data
      console.log('Refreshing projects after creation...')
      await fetchProjects()
      
      // Also refresh all data to ensure consistency
      await refreshData()
      
      // TODO: Handle tasks and calendar events creation
      if (tasks && tasks.length > 0) {
        console.log('Creating AI-generated tasks:', tasks)
        // Implementation for bulk task creation will be added here
      }
      
      if (calendarEvents && calendarEvents.length > 0) {
        console.log('Creating calendar events:', calendarEvents)
        // Implementation for calendar event creation will be added here
      }
      
      return createdProject
    } else {
      console.error('Project creation failed')
      return null
    }
  }

  const onUpdateProject = async (projectData: any) => {
    if (!editingProject) return
    const success = await handleUpdateProject(editingProject.id, projectData)
    if (success) {
      await fetchProjects()
      setEditingProject(null)
    }
  }

  const onCreateTask = async (taskData: any) => {
    const success = await handleCreateTask(taskData)
    if (success && user) {
      // Add real-time activity for task creation
      addRealtimeActivity({
        id: `realtime-task-created-${Date.now()}`,
        type: 'task',
        message: `created task '${taskData.title}'`,
        user: {
          name: user.name || 'You',
          avatar: user.avatar || ''
        },
        timestamp: new Date()
      })
      
      // Emit task created event for notification system
      window.dispatchEvent(new CustomEvent('taskCreated', { 
        detail: { taskData, userId: user.id } 
      }))
      console.log('Emitted taskCreated event for notification refresh')
      
      // Refresh both tasks and projects since project cards show task completion progress
      await Promise.all([
        fetchTasks(),
        fetchProjects() // This will update the task counts on project cards
      ])
    }
  }

  const onUpdateTask = async (taskData: any) => {
    if (!editingTask) return
    const success = await handleUpdateTask(editingTask.id, taskData)
    if (success) {
      // Refresh both tasks and projects since project cards show task completion progress
      await Promise.all([
        fetchTasks(),
        fetchProjects() // This will update the task completion counts on project cards
      ])
      setEditingTask(null)
    }
  }

  const onDeleteProject = async (projectId: string) => {
    const success = await handleDeleteProject(projectId)
    if (success) {
      await fetchProjects()
    }
    return success
  }

  const onDeleteTask = async (taskId: string) => {
    const success = await handleDeleteTask(taskId)
    if (success) {
      // Refresh both tasks and projects since project cards show task completion progress
      await Promise.all([
        fetchTasks(),
        fetchProjects() // This will update the task counts on project cards
      ])
    }
    return success
  }

  const onTaskStatusChange = async (taskId: string, status: string) => {
    const success = await handleTaskStatusChange(taskId, status)
    if (success) {
      // Find the task that was updated
      const task = tasks.find(t => t.id === taskId)
      if (task && user) {
        // Add real-time activity
        let message = `updated task '${task.title}'`
        if (status === 'DONE') {
          message = `completed task '${task.title}'`
        } else if (status === 'IN_PROGRESS') {
          message = `started working on '${task.title}'`
        }
        
        addRealtimeActivity({
          id: `realtime-task-${taskId}-${Date.now()}`,
          type: 'task',
          message: message,
          user: {
            name: user.name || 'You',
            avatar: user.avatar || ''
          },
          timestamp: new Date()
        })
      }
      // Refresh both tasks and projects since project cards show task completion progress
      await Promise.all([
        fetchTasks(),
        fetchProjects() // This will update the task completion counts on project cards
      ])
    }
    return success
  }

  const onTaskUpdate = async (taskId: string, updates: any) => {
    const success = await handleUpdateTask(taskId, updates)
    if (success) {
      // Refresh both tasks and projects since project cards show task completion progress
      await Promise.all([
        fetchTasks(),
        fetchProjects() // This will update the task completion counts on project cards
      ])
    }
    return success
  }

  const onTaskReassign = (taskId: string, currentAssigneeId?: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    setReassignTaskData({
      taskId,
      taskTitle: task.title,
      currentAssigneeId
    })
    setReassignDialogOpen(true)
  }

  const onReassignComplete = async (taskId: string, newAssigneeIds?: string[]) => {
    // Refresh tasks to get updated assignee information
    await fetchTasks()
  }

  const onImportData = async (data: any) => {
    await handleImportData(data)
    await refreshData()
  }

  const onClearActivity = async () => {
    if (!user || recentActivity.length === 0) return
    
    try {
      // Clear activities immediately to prevent re-appearance
      const activitiesToArchive = [...recentActivity]
      clearRecentActivity()
      
      // Archive current activities to logs
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: activitiesToArchive.map(activity => ({
            type: activity.type,
            message: activity.message,
            userId: user.id,
            timestamp: activity.timestamp,
            user: activity.user
          }))
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Activities archived:', result)
        
        // Add confirmation activity only if archiving was successful
        const confirmationActivity = {
          id: `activity-cleared-${Date.now()}`,
          type: 'workspace' as const,
          message: `cleared and archived ${result.count || activitiesToArchive.length} activities to logs`,
          user: {
            name: user.name || 'You',
            avatar: user.avatar || ''
          },
          timestamp: new Date()
        }

        // Set only the confirmation activity
        setRecentActivity([confirmationActivity])
        
        // Auto-clear the confirmation message after 5 seconds
        setTimeout(() => {
          setRecentActivity([])
        }, 5000)
        
      } else {
        const error = await response.json()
        console.error('Failed to archive activities:', error)
        throw new Error(error.error || 'Failed to archive activities')
      }
    } catch (error) {
      console.error('Failed to clear activity:', error)
      
      // Restore activities if archiving failed and show error
      const errorActivity = {
        id: `activity-clear-error-${Date.now()}`,
        type: 'notification' as const,
        message: 'System failed to clear activity feed - please try again',
        user: {
          name: 'System',
          avatar: ''
        },
        timestamp: new Date()
      }
      
      // Show only the error message, don't restore old activities to prevent confusion
      setRecentActivity([errorActivity])
      
      // Auto-clear the error message after 10 seconds
      setTimeout(() => {
        setRecentActivity([])
      }, 10000)
    }
  }

  const onViewTasks = (projectId: string) => {
    router.push(`/tasks?project=${projectId}`)
  }

  const onGenerateInsights = async (projectId: string, projectName: string) => {
    setInsightsDialog({
      open: true,
      projectId,
      projectName
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // Add workspace validation
  if (!currentWorkspace) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Please select a workspace to continue, or create a new one to get started.
                </p>
                <Button 
                  onClick={() => router.push('/workspaces')}
                  className="mr-2"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  View Workspaces
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Premium background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header 
          tasks={tasks}
          projects={projects}
          users={users}
          onImportData={onImportData}
          onProjectCreated={async () => {
            console.log('Header: Project created, refreshing data...')
            await fetchProjects()
            await fetchTasks() // Also refresh tasks in case task counts affect progress
            await refreshData() // Refresh all data to ensure consistency
          }}
        />
        
        <main id="dashboard-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="animate-fade-in">
              <DashboardHeader 
                onCreateTask={() => setTaskDialogOpen(true)} 
                onCreateProject={() => setProjectDialogOpen(true)}
              />
            </div>

            {/* Stats Cards */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <DashboardStatsCards stats={stats} />
            </div>

            {/* Main Content Tabs */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Tabs defaultValue="overview" className="space-y-6 lg:space-y-8 premium-tabs">
                <TabsList className="grid w-full grid-cols-4 glass-card border-0 shadow-premium p-1 h-10 lg:h-12">
                  <TabsTrigger 
                    value="overview" 
                    className="transition-all duration-300 font-medium rounded-lg h-8 lg:h-10 text-sm lg:text-base"
                  >
                    {t("dashboard.overview")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tasks"
                    className="transition-all duration-300 font-medium rounded-lg h-8 lg:h-10 text-sm lg:text-base"
                  >
                    {t("dashboard.myTasks")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="projects"
                    className="transition-all duration-300 font-medium rounded-lg h-8 lg:h-10 text-sm lg:text-base"
                  >
                    {t("dashboard.projects")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity"
                    className="transition-all duration-300 font-medium rounded-lg h-8 lg:h-10 text-sm lg:text-base"
                  >
                    {t("dashboard.activity")}
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="overview" className="space-y-6 lg:space-y-8">
                <DashboardOverview
                  tasks={tasks}
                  projects={projects}
                  activities={recentActivity}
                  workspaceId={currentWorkspaceId || undefined}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskEdit={(task) => {
                    setEditingTask(task)
                    setTaskDialogOpen(true)
                  }}
                  onTaskDelete={onDeleteTask}
                  onProjectEdit={(project) => {
                    setEditingProject(project)
                    setProjectDialogOpen(true)
                  }}
                  onProjectDelete={onDeleteProject}
                  onProjectToggleStar={async (projectId) => {
                    try {
                      const response = await fetch(`/api/projects/${projectId}/star`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      if (response.ok) {
                        await fetchProjects() // Refresh projects to show updated star status
                      }
                    } catch (error) {
                      console.error('Failed to toggle star:', error)
                    }
                  }}
                  onCreateProject={() => setProjectDialogOpen(true)}
                  onClearActivity={onClearActivity}
                  onRestoreActivity={restoreRecentActivity}
                  activitiesCleared={activitiesCleared}
                  onViewTasks={onViewTasks}
                  onGenerateInsights={onGenerateInsights}
                  currentUserId={user?.id}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6 lg:space-y-8">
                <TaskManagement
                  tasks={tasks}
                  projects={projects}
                  taskView={taskView}
                  onTaskViewChange={setTaskView}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskUpdate={onTaskUpdate}
                  onTaskDelete={onDeleteTask}
                  onTaskReassign={onTaskReassign}
                  onCreateTask={(status) => {
                    if (status) {
                      setEditingTask({ status, projectId: projects[0]?.id || '' })
                    }
                    setTaskDialogOpen(true)
                  }}
                />
              </TabsContent>

              <TabsContent value="projects" className="space-y-6 lg:space-y-8">
                <ProjectManagement
                  projects={projects}
                  onProjectEdit={(project) => {
                    setEditingProject(project)
                    setProjectDialogOpen(true)
                  }}
                  onProjectDelete={onDeleteProject}
                  onProjectToggleStar={async (projectId) => {
                    try {
                      const response = await fetch(`/api/projects/${projectId}/star`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      if (response.ok) {
                        await fetchProjects() // Refresh projects to show updated star status
                      }
                    } catch (error) {
                      console.error('Failed to toggle star:', error)
                    }
                  }}
                  onViewTasks={onViewTasks}
                  onGenerateInsights={onGenerateInsights}
                  currentUserId={user?.id}
                />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 lg:space-y-8">
                <ActivityFeed 
                  activities={recentActivity} 
                  currentUserId={user?.id}
                  onClearActivity={onClearActivity}
                />
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </main>
      </div>

      {/* Project Creation - Enhanced for new, Standard for editing */}
      {!editingProject ? (
        <EnhancedProjectCreation
          open={projectDialogOpen}
          onOpenChange={setProjectDialogOpen}
          onCreateProject={onCreateProject}
          projects={projects}
          workspaceMembers={users}
        />
      ) : (
        <ProjectDialog
          open={projectDialogOpen}
          onOpenChange={(open) => {
            setProjectDialogOpen(open)
            if (!open) setEditingProject(null)
          }}
          project={editingProject}
          onSubmit={onUpdateProject}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)  
          if (!open) setEditingTask(null)
        }}
        task={editingTask}
        projects={projects}
        onSubmit={editingTask ? onUpdateTask : onCreateTask}
        isSubmitting={isSubmitting}
      />

      {/* Task Reassign Dialog */}
      {reassignTaskData && (
        <TaskReassignDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          taskId={reassignTaskData.taskId}
          taskTitle={reassignTaskData.taskTitle}
          currentAssigneeId={reassignTaskData.currentAssigneeId}
          onReassignComplete={onReassignComplete}
        />
      )}

      {/* Project Insights Dialog */}
      <ProjectInsightsDialog
        open={insightsDialog.open}
        onOpenChange={(open) => setInsightsDialog(prev => ({ ...prev, open }))}
        projectId={insightsDialog.projectId}
        projectName={insightsDialog.projectName}
      />
    </div>
  )
}

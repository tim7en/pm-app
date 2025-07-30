"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { TaskDialog } from "@/components/tasks/task-dialog"

import { DashboardHeader } from "./dashboard-header"
import { DashboardStatsCards } from "./dashboard-stats"
import { DashboardOverview } from "./dashboard-overview"
import { TaskManagement } from "./task-management"
import { ProjectManagement } from "./project-management"
import { ActivityFeed, ActivityFeedFull } from "./activity-feed"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"
import { useAuth } from "@/contexts/AuthContext"

export function DashboardContainer() {
  const { user, currentWorkspaceId, currentWorkspace } = useAuth()
  const {
    stats,
    recentActivity,
    projects,
    tasks,
    users,
    isLoading,
    refreshData,
    fetchProjects,
    fetchTasks,
    addRealtimeActivity,
    clearRecentActivity,
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

  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [taskView, setTaskView] = useState<"list" | "board">("list")

  const onCreateProject = async (projectData: any) => {
    const success = await handleCreateProject(projectData)
    if (success && user) {
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
      await fetchProjects()
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
      await fetchTasks()
    }
  }

  const onUpdateTask = async (taskData: any) => {
    if (!editingTask) return
    const success = await handleUpdateTask(editingTask.id, taskData)
    if (success) {
      await fetchTasks()
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
      await fetchTasks()
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
      await fetchTasks()
    }
    return success
  }

  const onTaskUpdate = async (taskId: string, updates: any) => {
    const success = await handleUpdateTask(taskId, updates)
    if (success) {
      await fetchTasks()
    }
    return success
  }

  const onImportData = async (data: any) => {
    await handleImportData(data)
    await refreshData()
  }

  const onClearActivity = async () => {
    if (!user || recentActivity.length === 0) return
    
    try {
      // Archive current activities to logs
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: recentActivity.map(activity => ({
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
        
        // Clear all activities first
        clearRecentActivity()
        
        // Add confirmation activity
        const confirmationActivity = {
          id: `activity-cleared-${Date.now()}`,
          type: 'workspace' as const,
          message: `cleared and archived ${result.count || recentActivity.length} activities to logs`,
          user: {
            name: user.name || 'You',
            avatar: user.avatar || ''
          },
          timestamp: new Date()
        }

        // Set only the confirmation activity
        setRecentActivity([confirmationActivity])
        
      } else {
        const error = await response.json()
        console.error('Failed to archive activities:', error)
        throw new Error(error.error || 'Failed to archive activities')
      }
    } catch (error) {
      console.error('Failed to clear activity:', error)
      // Show error message to user
      addRealtimeActivity({
        id: `activity-clear-error-${Date.now()}`,
        type: 'notification',
        message: 'failed to clear activity feed - please try again',
        user: {
          name: 'System',
          avatar: ''
        },
        timestamp: new Date()
      })
    }
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          tasks={tasks}
          projects={projects}
          users={users}
          onImportData={onImportData}
        />
        
        <main id="dashboard-content" className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <DashboardHeader onCreateTask={() => setTaskDialogOpen(true)} />

            {/* Stats Cards */}
            <DashboardStatsCards stats={stats} />

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">My Tasks</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
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
                  onProjectToggleStar={(projectId) => {
                    console.log('Toggle star:', projectId)
                  }}
                  onCreateProject={() => setProjectDialogOpen(true)}
                  onClearActivity={onClearActivity}
                  currentUserId={user?.id}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TaskManagement
                  tasks={tasks}
                  projects={projects}
                  taskView={taskView}
                  onTaskViewChange={setTaskView}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskUpdate={onTaskUpdate}
                  onTaskDelete={onDeleteTask}
                  onCreateTask={(status) => {
                    if (status) {
                      setEditingTask({ status, projectId: projects[0]?.id || '' })
                    }
                    setTaskDialogOpen(true)
                  }}
                />
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <ProjectManagement
                  projects={projects}
                  onProjectEdit={(project) => {
                    setEditingProject(project)
                    setProjectDialogOpen(true)
                  }}
                  onProjectDelete={onDeleteProject}
                  onProjectToggleStar={(projectId) => {
                    console.log('Toggle star:', projectId)
                  }}
                />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <ActivityFeed 
                  activities={recentActivity} 
                  currentUserId={user?.id}
                  onClearActivity={onClearActivity}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open)
          if (!open) setEditingProject(null)
        }}
        project={editingProject}
        onSubmit={editingProject ? onUpdateProject : onCreateProject}
        isSubmitting={isSubmitting}
      />

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
    </div>
  )
}

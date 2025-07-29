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
import { ActivityFeedFull } from "./activity-feed"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"

export function DashboardContainer() {
  const {
    stats,
    recentActivity,
    projects,
    tasks,
    users,
    isLoading,
    refreshData,
    fetchProjects,
    fetchTasks
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
    if (success) {
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
    if (success) {
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
      await fetchTasks()
    }
    return success
  }

  const onImportData = async (data: any) => {
    await handleImportData(data)
    await refreshData()
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
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TaskManagement
                  tasks={tasks}
                  projects={projects}
                  taskView={taskView}
                  onTaskViewChange={setTaskView}
                  onTaskStatusChange={onTaskStatusChange}
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
                <ActivityFeedFull activities={recentActivity} />
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
        users={users}
        onSubmit={editingTask ? onUpdateTask : onCreateTask}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

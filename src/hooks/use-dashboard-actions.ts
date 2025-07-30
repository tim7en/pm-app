"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export const useDashboardActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, currentWorkspaceId } = useAuth()

  const handleCreateProject = async (projectData: any) => {
    setIsSubmitting(true)
    try {
      // Ensure only valid project fields are sent
      const cleanProjectData = {
        name: projectData.name,
        description: projectData.description,
        color: projectData.color || '#3b82f6',
        workspaceId: projectData.workspaceId || currentWorkspaceId
      }
      
      console.log('Creating project with data:', cleanProjectData)
      console.log('Current workspace ID:', currentWorkspaceId)
      
      if (!cleanProjectData.workspaceId) {
        console.error('No workspace ID available for project creation')
        return false
      }
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanProjectData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Project creation failed:', errorData)
        return false
      }
      
      const createdProject = await response.json()
      console.log('Project created successfully:', createdProject)
      return true
    } catch (error) {
      console.error('Error creating project:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProject = async (projectId: string, projectData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error updating project:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTask = async (taskData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          creatorId: 'default-user-id'
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Error creating task:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error updating task:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return false
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      return response.ok
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return false
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      return response.ok
    } catch (error) {
      console.error('Error deleting task:', error)
      return false
    }
  }

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      return response.ok
    } catch (error) {
      console.error('Error updating task status:', error)
      return false
    }
  }

  const handleImportData = async (data: any) => {
    try {
      // Import projects first
      if (data.projects && data.projects.length > 0) {
        for (const project of data.projects) {
          await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: project.name,
              description: project.description,
              color: project.color,
              status: project.status,
              workspaceId: 'default-workspace-id',
              ownerId: 'default-user-id'
            })
          })
        }
      }

      // Import tasks
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              projectId: task.projectId,
              assigneeId: task.assigneeId,
              creatorId: 'default-user-id'
            })
          })
        }
      }

      console.log('Data imported successfully')
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      throw error
    }
  }

  return {
    isSubmitting,
    handleCreateProject,
    handleUpdateProject,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteProject,
    handleDeleteTask,
    handleTaskStatusChange,
    handleImportData
  }
}

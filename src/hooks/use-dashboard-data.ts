"use client"

import { useState, useEffect } from "react"
import { io as socketIoClient, Socket } from "socket.io-client"
import { useAuth } from "@/contexts/AuthContext"

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalProjects: number
  activeProjects: number
  teamMembers: number
  notifications: number
  unreadMessages: number
}

export interface ActivityItem {
  id: string
  type: 'task' | 'project' | 'comment' | 'integration' | 'team' | 'workspace' | 'notification'
  message: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
}

export const useDashboardData = () => {
  const { currentWorkspace } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    activeProjects: 0,
    teamMembers: 0,
    notifications: 0,
    unreadMessages: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentWorkspace) {
      // Initialize socket connection for real-time updates
      const newSocket = socketIoClient(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
      setSocket(newSocket)

      // Fetch initial data
      fetchInitialData()

      // Listen for real-time updates
      newSocket.on('task_updated', (data) => {
        setStats(prev => ({
          ...prev,
          totalTasks: data.totalTasks || prev.totalTasks,
          completedTasks: data.completedTasks || prev.completedTasks,
          inProgressTasks: data.inProgressTasks || prev.inProgressTasks
        }))
      })

      newSocket.on('new_activity', (activity) => {
        setRecentActivity(prev => [activity, ...prev.slice(0, 9)])
      })

      return () => {
        newSocket.close()
      }
    }
  }, [currentWorkspace])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchUsers()
      ])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!currentWorkspace) return []
    
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  const fetchTasks = async () => {
    if (!currentWorkspace) return []
    
    try {
      const response = await fetch(`/api/tasks?workspaceId=${currentWorkspace.id}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  }

  const fetchUsers = async () => {
    try {
      // Mock users for now
      const mockUsers = [
        { id: "1", name: "John Doe", avatar: "" },
        { id: "2", name: "Jane Smith", avatar: "" },
        { id: "3", name: "Mike Johnson", avatar: "" }
      ]
      setUsers(mockUsers)
      return mockUsers
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  const generateActivitiesFromData = (projectsData: any[], tasksData: any[], usersData: any[]): ActivityItem[] => {
    const activities: ActivityItem[] = []
    const now = new Date()

    // Generate activities from recent tasks (last 30 days to ensure we have data)
    tasksData.forEach(task => {
      if (!task.createdAt) return // Skip if no creation date
      
      const taskCreated = new Date(task.createdAt)
      const taskUpdated = new Date(task.updatedAt || task.createdAt)
      const daysDiff = (now.getTime() - taskUpdated.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff <= 30) { // Show activities from last 30 days to have more data
        // Task creation activity
        activities.push({
          id: `task-created-${task.id}`,
          type: 'task',
          message: `created task '${task.title}'`,
          user: {
            name: task.creator?.name || 'Unknown User',
            avatar: task.creator?.avatar || ''
          },
          timestamp: taskCreated
        })

        // Task update activity (if different from creation)
        if (taskUpdated.getTime() !== taskCreated.getTime() || task.status === 'DONE') {
          let message = `updated task '${task.title}'`
          if (task.status === 'DONE') {
            message = `completed task '${task.title}'`
          } else if (task.status === 'IN_PROGRESS') {
            message = `started working on '${task.title}'`
          }

          activities.push({
            id: `task-updated-${task.id}`,
            type: 'task',
            message: message,
            user: {
              name: task.assignee?.name || task.creator?.name || 'Unknown User',
              avatar: task.assignee?.avatar || task.creator?.avatar || ''
            },
            timestamp: taskUpdated
          })
        }

        // Task assignment activity
        if (task.assignee && task.assignee.id !== task.creator?.id) {
          activities.push({
            id: `task-assigned-${task.id}`,
            type: 'task',
            message: `assigned task '${task.title}' to ${task.assignee.name}`,
            user: {
              name: task.creator?.name || 'Unknown User',
              avatar: task.creator?.avatar || ''
            },
            timestamp: new Date(taskUpdated.getTime() - 1000 * 60) // Slightly before update
          })
        }
      }
    })

    // Generate activities from recent projects (last 30 days)
    projectsData.forEach(project => {
      if (!project.createdAt) return // Skip if no creation date
      
      const projectCreated = new Date(project.createdAt)
      const projectUpdated = new Date(project.updatedAt || project.createdAt)
      const daysDiff = (now.getTime() - projectUpdated.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff <= 30) {
        // Project creation activity
        activities.push({
          id: `project-created-${project.id}`,
          type: 'project',
          message: `created project '${project.name}'`,
          user: {
            name: project.owner?.name || 'Unknown User',
            avatar: project.owner?.avatar || ''
          },
          timestamp: projectCreated
        })

        // Project update activity (if different from creation)
        if (projectUpdated.getTime() !== projectCreated.getTime()) {
          let message = `updated project '${project.name}'`
          if (project.status === 'COMPLETED') {
            message = `completed project '${project.name}'`
          } else if (project.status === 'ARCHIVED') {
            message = `archived project '${project.name}'`
          }

          activities.push({
            id: `project-updated-${project.id}`,
            type: 'project',
            message: message,
            user: {
              name: project.owner?.name || 'Unknown User',
              avatar: project.owner?.avatar || ''
            },
            timestamp: projectUpdated
          })
        }
      }
    })

    // Add some workspace activities based on data patterns
    if (usersData.length > 0) {
      activities.push({
        id: 'workspace-activity',
        type: 'workspace',
        message: `workspace has ${usersData.length} active members`,
        user: {
          name: 'System',
          avatar: ''
        },
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 6) // 6 hours ago
      })
    }

    // Sort by timestamp (most recent first) and limit to 15 items
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)
  }

  const updateStats = (projectsData: any[], tasksData: any[]) => {
    const totalTasks = tasksData.length
    const completedTasks = tasksData.filter(t => t.status === 'DONE').length
    const inProgressTasks = tasksData.filter(t => t.status === 'IN_PROGRESS').length
    const overdueTasks = tasksData.filter(t => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    }).length
    const totalProjects = projectsData.length
    const activeProjects = projectsData.filter(p => p.status === 'ACTIVE').length
    const teamMembers = users.length

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      teamMembers,
      notifications: 0,
      unreadMessages: 0
    })

    // Generate real activities from the data
    const generatedActivities = generateActivitiesFromData(projectsData, tasksData, users)
    setRecentActivity(generatedActivities)
  }

  // Update stats when projects or tasks change
  useEffect(() => {
    updateStats(projects, tasks)
  }, [projects, tasks, users])

  const refreshData = async () => {
    await fetchInitialData()
  }

  return {
    stats,
    recentActivity,
    socket,
    projects,
    tasks,
    users,
    isLoading,
    fetchProjects,
    fetchTasks,
    fetchUsers,
    refreshData,
    setProjects,
    setTasks,
    setUsers,
    addRealtimeActivity: (activity: ActivityItem) => {
      setRecentActivity(prev => [activity, ...prev].slice(0, 15))
    }
  }
}

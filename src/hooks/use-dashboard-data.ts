"use client"

import { useState, useEffect } from "react"
import { io as socketIoClient, Socket } from "socket.io-client"

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
  type: 'task' | 'project' | 'comment' | 'integration'
  message: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
}

export const useDashboardData = () => {
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
  }, [])

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
    try {
      const response = await fetch('/api/projects')
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
    try {
      const response = await fetch('/api/tasks')
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
    setUsers
  }
}

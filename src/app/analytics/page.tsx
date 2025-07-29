"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle2, 
  Clock, 
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award,
  AlertTriangle
} from "lucide-react"
import { TaskStatus, Priority, ProjectStatus } from "@prisma/client"
import { useAPI } from "@/hooks/use-api"

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate?: Date
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
  }
  project: {
    id: string
    name: string
    color: string
  }
  commentCount: number
  attachmentCount: number
  subtaskCount: number
  completedSubtaskCount: number
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  createdAt: Date
  completedAt?: Date
}

interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: ProjectStatus
  taskCount: number
  completedTaskCount: number
  memberCount: number
  owner: {
    id: string
    name: string
    avatar?: string
  }
  isStarred: boolean
  createdAt: Date
  completedAt?: Date
}

interface AnalyticsData {
  taskStats: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
    avgCompletionTime: number
  }
  projectStats: {
    total: number
    active: number
    completed: number
    completionRate: number
  }
  productivityMetrics: {
    tasksCompletedThisWeek: number
    tasksCompletedThisMonth: number
    productivityTrend: number
    avgTasksPerDay: number
  }
  priorityDistribution: {
    urgent: number
    high: number
    medium: number
    low: number
  }
}

export default function AnalyticsPage() {
  const { apiCall } = useAPI()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      const [tasksResponse, projectsResponse] = await Promise.all([
        apiCall('/api/tasks'),
        apiCall('/api/projects')
      ])

      if (tasksResponse.ok && projectsResponse.ok) {
        const tasksData = await tasksResponse.json()
        const projectsData = await projectsResponse.json()
        
        setTasks(tasksData)
        setProjects(projectsData)
        calculateAnalytics(tasksData, projectsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (tasksData: Task[], projectsData: Project[]) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Task statistics
    const completedTasks = tasksData.filter(t => t.status === TaskStatus.DONE)
    const inProgressTasks = tasksData.filter(t => t.status === TaskStatus.IN_PROGRESS)
    const overdueTasks = tasksData.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
    )

    // Calculate completion times
    const completionTimes = completedTasks
      .filter(t => t.completedAt)
      .map(t => new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime())
    const avgCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
      : 0

    // Project statistics
    const activeProjects = projectsData.filter(p => p.status === ProjectStatus.ACTIVE)
    const completedProjects = projectsData.filter(p => p.status === ProjectStatus.COMPLETED)

    // Productivity metrics
    const tasksCompletedThisWeek = completedTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) >= weekAgo
    ).length

    const tasksCompletedThisMonth = completedTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) >= monthAgo
    ).length

    // Simple productivity trend calculation
    const lastWeekTasks = completedTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) >= weekAgo
    ).length
    const previousWeekTasks = completedTasks.filter(t => 
      t.completedAt && new Date(t.completedAt) >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && new Date(t.completedAt) < weekAgo
    ).length
    const productivityTrend = previousWeekTasks > 0 
      ? ((lastWeekTasks - previousWeekTasks) / previousWeekTasks) * 100 
      : 0

    // Priority distribution
    const priorityDistribution = {
      urgent: tasksData.filter(t => t.priority === Priority.URGENT).length,
      high: tasksData.filter(t => t.priority === Priority.HIGH).length,
      medium: tasksData.filter(t => t.priority === Priority.MEDIUM).length,
      low: tasksData.filter(t => t.priority === Priority.LOW).length
    }

    const analyticsData: AnalyticsData = {
      taskStats: {
        total: tasksData.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        overdue: overdueTasks.length,
        completionRate: tasksData.length > 0 ? (completedTasks.length / tasksData.length) * 100 : 0,
        avgCompletionTime: avgCompletionTime / (1000 * 60 * 60 * 24) // Convert to days
      },
      projectStats: {
        total: projectsData.length,
        active: activeProjects.length,
        completed: completedProjects.length,
        completionRate: projectsData.length > 0 ? (completedProjects.length / projectsData.length) * 100 : 0
      },
      productivityMetrics: {
        tasksCompletedThisWeek,
        tasksCompletedThisMonth,
        productivityTrend,
        avgTasksPerDay: tasksCompletedThisMonth / 30
      },
      priorityDistribution
    }

    setAnalytics(analyticsData)
  }

  const formatDays = (days: number) => {
    if (days < 1) return `${Math.round(days * 24)}h`
    return `${Math.round(days)}d`
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500'
    if (trend < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  if (loading || !analytics) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground mt-1">Track your productivity and project metrics</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.taskStats.completionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.taskStats.completed} of {analytics.taskStats.total} tasks
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.projectStats.active}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.projectStats.completionRate.toFixed(1)}% completion rate
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productivity</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.productivityMetrics.tasksCompletedThisWeek}</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks completed this week
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analytics.productivityMetrics.productivityTrend)}
                    <span className={`text-xs ${getTrendColor(analytics.productivityMetrics.productivityTrend)}`}>
                      {analytics.productivityMetrics.productivityTrend > 0 ? '+' : ''}{analytics.productivityMetrics.productivityTrend.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDays(analytics.taskStats.avgCompletionTime)}</div>
                  <p className="text-xs text-muted-foreground">
                    Average time to complete tasks
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>Overview of current task statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span className="text-sm">To Do</span>
                      </div>
                      <span className="text-sm font-medium">
                        {tasks.filter(t => t.status === TaskStatus.TODO).length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.taskStats.inProgress}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Review</span>
                      </div>
                      <span className="text-sm font-medium">
                        {tasks.filter(t => t.status === TaskStatus.REVIEW).length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.taskStats.completed}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Overdue</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.taskStats.overdue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>Task priority breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Urgent</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.priorityDistribution.urgent}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm">High</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.priorityDistribution.high}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Medium</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.priorityDistribution.medium}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Low</span>
                      </div>
                      <span className="text-sm font-medium">{analytics.priorityDistribution.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Productivity Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Productivity Metrics</CardTitle>
                <CardDescription>Your productivity trends and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.productivityMetrics.tasksCompletedThisWeek}
                    </div>
                    <p className="text-sm text-muted-foreground">Tasks this week</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.productivityMetrics.tasksCompletedThisMonth}
                    </div>
                    <p className="text-sm text-muted-foreground">Tasks this month</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.productivityMetrics.avgTasksPerDay.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg. tasks per day</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.taskStats.overdue}
                    </div>
                    <p className="text-sm text-muted-foreground">Overdue tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest task and project updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === TaskStatus.DONE ? 'bg-green-500' :
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' :
                        task.status === TaskStatus.REVIEW ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.project.name} • {task.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
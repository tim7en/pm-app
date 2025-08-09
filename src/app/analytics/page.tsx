"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ProductivityDashboard } from "@/components/dashboard/productivity-dashboard"
import { useTranslation } from "@/hooks/use-translation"
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
  AlertTriangle,
  Brain,
  Coffee,
  Heart
} from "lucide-react"
import { TaskStatus, Priority, ProjectStatus } from "@/types/prisma-fallback"
import { useAPI } from "@/hooks/use-api"
import { useAuth } from "@/contexts/AuthContext"

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
  const { t } = useTranslation()
  const { apiCall } = useAPI()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    // Debug authentication state
    console.log('Analytics Auth Debug:', {
      isAuthenticated,
      authLoading,
      user: user?.email,
      token: typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
    })

    // Only fetch data if user is authenticated
    if (isAuthenticated && !authLoading) {
      console.log('Fetching analytics data for authenticated user')
      fetchData()
    } else if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, stopping loading')
      setLoading(false)
    }
  }, [timeRange, isAuthenticated, authLoading])

  const fetchData = async () => {
    try {
      console.log('Starting fetchData - making API calls...')
      const [tasksResponse, projectsResponse] = await Promise.all([
        apiCall('/api/tasks'),
        apiCall('/api/projects')
      ])

      console.log('API responses:', {
        tasksStatus: tasksResponse.status,
        projectsStatus: projectsResponse.status,
        tasksOk: tasksResponse.ok,
        projectsOk: projectsResponse.ok
      })

      if (tasksResponse.ok && projectsResponse.ok) {
        const tasksData = await tasksResponse.json()
        const projectsData = await projectsResponse.json()
        
        console.log('Data loaded successfully:', {
          tasksCount: tasksData.length,
          projectsCount: projectsData.length
        })
        
        setTasks(tasksData)
        setProjects(projectsData)
        calculateAnalytics(tasksData, projectsData)
      } else {
        console.error('API calls failed:', {
          tasksStatus: tasksResponse.status,
          projectsStatus: projectsResponse.status
        })
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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access analytics and AI insights.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Go to Login
            </Button>
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
                <h1 className="text-3xl font-bold">{t("analytics.analyticsInsights")}</h1>
                <p className="text-muted-foreground mt-1">{t("analytics.trackProductivity")}</p>
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
                <Button variant="outline" size="sm" disabled>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Export Report
                  <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                </Button>
              </div>
            </div>

            {/* Tabs for different analytics views */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="productivity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Workspace Health
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">

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
              </TabsContent>

              <TabsContent value="ai-insights" className="space-y-6">
                {/* AI Features Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">AI Task Generation</CardTitle>
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Active</div>
                      <p className="text-xs text-muted-foreground">
                        Intelligent task suggestions ready
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Project Assessment</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">Real-time</div>
                      <p className="text-xs text-muted-foreground">
                        Efficiency analysis available
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Task Feedback</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">Smart</div>
                      <p className="text-xs text-muted-foreground">
                        Personalized completion insights
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Workspace Health</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">Monitoring</div>
                      <p className="text-xs text-muted-foreground">
                        Work-life balance tracking
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Features Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI-Powered Task Generation
                      </CardTitle>
                      <CardDescription>
                        Generate intelligent task suggestions based on project context
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">How it works:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Analyzes your project context and existing tasks</li>
                          <li>• Considers team roles and workload distribution</li>
                          <li>• Generates 3-5 actionable, specific tasks</li>
                          <li>• Suggests priority levels and time estimates</li>
                        </ul>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        API: /api/ai/generate-tasks
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Project Efficiency Assessment
                      </CardTitle>
                      <CardDescription>
                        Real-time analysis of project health and completion rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Key Metrics:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Task completion velocity</li>
                          <li>• Resource allocation efficiency</li>
                          <li>• Bottleneck identification</li>
                          <li>• Timeline prediction accuracy</li>
                        </ul>
                      </div>
                      <Badge variant="outline" className="text-blue-600">
                        API: /api/ai/assess-project
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Task Completion Feedback
                      </CardTitle>
                      <CardDescription>
                        Personalized encouragement and performance insights
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Feedback Features:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Personalized completion messages</li>
                          <li>• Performance streak tracking</li>
                          <li>• Productivity trend analysis</li>
                          <li>• Motivational insights</li>
                        </ul>
                      </div>
                      <Badge variant="outline" className="text-purple-600">
                        API: /api/ai/task-feedback
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5" />
                        Smart Break Reminders
                      </CardTitle>
                      <CardDescription>
                        Work-life balance optimization with intelligent reminders
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Balance Features:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 1-2 hour work block detection</li>
                          <li>• 15-20 minute break suggestions</li>
                          <li>• Overwork pattern identification</li>
                          <li>• Manager notification system</li>
                        </ul>
                      </div>
                      <Badge variant="outline" className="text-orange-600">
                        API: /api/ai/inactivity-reminder
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="productivity" className="space-y-6">
                {/* Productivity Dashboard will go here once we have workspace context */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Workspace Health Monitoring
                    </CardTitle>
                    <CardDescription>
                      Coming soon: Real-time productivity insights and work-life balance analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Enhanced Productivity Dashboard</h3>
                      <p className="text-muted-foreground mb-4">
                        Track team activity during work hours (9-13, 14-18), monitor work-life balance, 
                        and receive AI-powered recommendations for optimal productivity.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 border rounded-lg">
                          <Clock className="h-6 w-6 text-blue-500 mb-2" />
                          <h4 className="font-medium mb-1">Work Hours Tracking</h4>
                          <p className="text-sm text-muted-foreground">
                            Monitor activity during core hours with lunch break detection
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Users className="h-6 w-6 text-green-500 mb-2" />
                          <h4 className="font-medium mb-1">Team Activity</h4>
                          <p className="text-sm text-muted-foreground">
                            Real-time team member activity and productivity metrics
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-orange-500 mb-2" />
                          <h4 className="font-medium mb-1">Smart Alerts</h4>
                          <p className="text-sm text-muted-foreground">
                            Automated reminders and manager notifications
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Coffee,
  Brain,
  Target,
  Heart
} from 'lucide-react'

interface UserActivity {
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  role: string
  lastActivity: string | null
  minutesSinceLastActivity: number
  isInactive: boolean
  todayActivities: number
  workHoursActivity: number
  workLifeBalanceScore: number
  hourlyActivity: number[]
  needsBreakReminder: boolean
}

interface WorkspaceHealth {
  workspaceData: {
    workspace: {
      id: string
      name: string
      memberCount: number
      activeProjects: number
      totalTasks: number
      completedTasks: number
      overdueTasks: number
      completionRate: number
    }
    userActivities: UserActivity[]
    workingHours: {
      isCurrentlyWorkHours: boolean
      schedule: {
        morning: string
        lunch: string
        evening: string
      }
    }
    timestamp: string
  }
  healthReport: {
    overallScore: number
    productivityScore: number
    workLifeBalance: number
    recommendations: string[]
    hourlyActivity: Array<{
      hour: number
      activity: number
      users: number
    }>
  }
  inactiveUsers: UserActivity[]
  breakReminders: UserActivity[]
}

interface ProductivityDashboardProps {
  workspaceId: string
}

export function ProductivityDashboard({ workspaceId }: ProductivityDashboardProps) {
  const [healthData, setHealthData] = useState<WorkspaceHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/workspace-health?workspaceId=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workspace health data')
      }
      const data = await response.json()
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sendInactivityReminder = async (userId: string, minutesInactive: number) => {
    try {
      const response = await fetch('/api/ai/inactivity-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId,
          minutesInactive
        })
      })

      if (response.ok) {
        // Refresh data after sending reminder
        fetchHealthData()
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
    }
  }

  useEffect(() => {
    fetchHealthData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!healthData) {
    return (
      <Alert>
        <AlertDescription>No workspace health data available</AlertDescription>
      </Alert>
    )
  }

  const { workspaceData, healthReport, inactiveUsers, breakReminders } = healthData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspace Analytics</h2>
          <p className="text-muted-foreground">
            Real-time productivity insights for {workspaceData.workspace.name}
          </p>
        </div>
        <Button onClick={fetchHealthData} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthReport.overallScore}%</div>
            <Progress value={healthReport.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthReport.productivityScore}%</div>
            <Progress value={healthReport.productivityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work-Life Balance</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthReport.workLifeBalance}%</div>
            <Progress value={healthReport.workLifeBalance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceData.userActivities.filter(u => !u.isInactive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {workspaceData.workspace.memberCount} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Hours Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Hours Status
          </CardTitle>
          <CardDescription>Current time: {new Date(workspaceData.timestamp).toLocaleTimeString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={workspaceData.workingHours.isCurrentlyWorkHours ? "default" : "secondary"}>
              {workspaceData.workingHours.isCurrentlyWorkHours ? "Work Hours" : "Off Hours"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Schedule: {workspaceData.workingHours.schedule.morning} • 
              {workspaceData.workingHours.schedule.lunch} (Lunch) • 
              {workspaceData.workingHours.schedule.evening}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {healthReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthReport.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Break Reminders */}
      {breakReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Break Reminders ({breakReminders.length})
            </CardTitle>
            <CardDescription>Team members who might need a break</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakReminders.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      {user.user.name?.[0] || user.user.email[0]}
                    </div>
                    <div>
                      <p className="font-medium">{user.user.name || user.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.workHoursActivity} activities today • Very active
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Needs Break</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Inactive Team Members ({inactiveUsers.length})
            </CardTitle>
            <CardDescription>Members inactive for more than 2 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveUsers.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {user.user.name?.[0] || user.user.email[0]}
                    </div>
                    <div>
                      <p className="font-medium">{user.user.name || user.user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Inactive for {Math.floor(user.minutesSinceLastActivity / 60)}h {user.minutesSinceLastActivity % 60}m
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendInactivityReminder(user.userId, user.minutesSinceLastActivity)}
                  >
                    Send Reminder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Activity Overview</CardTitle>
          <CardDescription>Individual productivity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspaceData.userActivities.map((user) => (
              <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {user.user.name?.[0] || user.user.email[0]}
                  </div>
                  <div>
                    <p className="font-medium">{user.user.name || user.user.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{user.todayActivities}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{user.workHoursActivity}</p>
                    <p className="text-xs text-muted-foreground">Work Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{user.workLifeBalanceScore}%</p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                  <Badge variant={user.isInactive ? "destructive" : "default"}>
                    {user.isInactive ? "Inactive" : "Active"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

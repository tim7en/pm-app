'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Coffee,
  Heart,
  Target,
  RefreshCw
} from 'lucide-react'

interface WorkspaceHealthData {
  overallScore: number
  productivityScore: number
  workLifeBalance: number
  activeUsers: number
  totalUsers: number
  isWorkingHours: boolean
  inactiveUsers: number
  needsBreakUsers: number
  recommendations: string[]
}

interface AIWorkspaceMonitorProps {
  workspaceId?: string
  // Remove auto-refresh interval - only manual refresh
}

export function AIWorkspaceMonitor({ workspaceId }: AIWorkspaceMonitorProps) {
  const [healthData, setHealthData] = useState<WorkspaceHealthData | null>(null)
  const [loading, setLoading] = useState(false)  // Start with false, not true
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Auto-fetch data when workspaceId is available
    if (workspaceId) {
      fetchHealthData()
    }
  }, [workspaceId])

  const fetchHealthData = async () => {
    if (!workspaceId) {
      console.log('❌ No workspaceId provided')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching workspace health data for:', workspaceId)
      
      // Get auth token from localStorage or cookies
      const authToken = localStorage.getItem('auth-token') 
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const url = `/api/ai/workspace-health?workspaceId=${workspaceId}`
      console.log('🌐 Fetching URL:', url)
      
      const response = await fetch(url, { headers })
      
      console.log('📡 API Response status:', response.status)
      console.log('📡 Response headers:', response.headers)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        const errorMessage = errorData.error || `Failed to fetch workspace health data (${response.status})`
        console.error('❌ API Error:', errorMessage)
        throw new Error(errorMessage)
      }
      
      const responseText = await response.text()
      console.log('📄 Raw response:', responseText.substring(0, 200) + '...')
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError)
        throw new Error('Invalid JSON response from server')
      }
      
      console.log('✅ Health data received:', data)
      
      // Transform API response to component format
      const healthData: WorkspaceHealthData = {
        overallScore: data.healthReport?.overallScore || 0,
        productivityScore: data.healthReport?.productivityScore || 0,
        workLifeBalance: data.healthReport?.workLifeBalance || 0,
        activeUsers: data.workspaceData?.userActivities?.filter((u: any) => !u.isInactive)?.length || 0,
        totalUsers: data.workspaceData?.workspace?.memberCount || 0,
        isWorkingHours: data.workspaceData?.workingHours?.isCurrentlyWorkHours || false,
        inactiveUsers: data.inactiveUsers?.length || 0,
        needsBreakUsers: data.breakReminders?.length || 0,
        recommendations: data.healthReport?.recommendations || []
      }
      
      console.log('🔄 Transformed health data:', healthData)
      setHealthData(healthData)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('❌ fetchHealthData error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  if (!workspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Workspace Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Select a workspace to view AI-powered health insights
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Workspace Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHealthData}
            className="mt-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show initial state when no data is loaded yet
  if (!healthData && !loading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Workspace Monitor
              </CardTitle>
              <CardDescription>
                Click refresh to view AI-powered productivity and wellness insights
              </CardDescription>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={fetchHealthData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Get Insights
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 text-blue-400" />
            <p>Ready to analyze your workspace health</p>
            <p className="text-xs mt-1">Click "Get Insights" to start monitoring</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Workspace Monitor
            </CardTitle>
            <CardDescription>
              Real-time productivity and wellness insights
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchHealthData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading && !healthData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : healthData && (
          <>
            {/* Work Hours Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Work Hours Status</span>
              </div>
              <Badge variant={healthData.isWorkingHours ? "default" : "secondary"}>
                {healthData.isWorkingHours ? "Active Hours" : "Off Hours"}
              </Badge>
            </div>

            {/* Health Scores */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg border">
                <Target className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className={`text-lg font-bold ${getScoreColor(healthData.overallScore)}`}>
                  {healthData.overallScore}%
                </div>
                <div className="text-xs text-muted-foreground">Overall Health</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className={`text-lg font-bold ${getScoreColor(healthData.productivityScore)}`}>
                  {healthData.productivityScore}%
                </div>
                <div className="text-xs text-muted-foreground">Productivity</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border">
                <Heart className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <div className={`text-lg font-bold ${getScoreColor(healthData.workLifeBalance)}`}>
                  {healthData.workLifeBalance}%
                </div>
                <div className="text-xs text-muted-foreground">Work-Life Balance</div>
              </div>
            </div>

            {/* Team Activity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Activity
                </span>
                <span className="text-sm text-muted-foreground">
                  {healthData.activeUsers}/{healthData.totalUsers} active
                </span>
              </div>
              <Progress 
                value={(healthData.activeUsers / healthData.totalUsers) * 100} 
                className="h-2"
              />
            </div>

            {/* Alerts */}
            {(healthData.inactiveUsers > 0 || healthData.needsBreakUsers > 0) && (
              <div className="space-y-2">
                {healthData.inactiveUsers > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.inactiveUsers} team member{healthData.inactiveUsers > 1 ? 's' : ''} inactive for 2+ hours
                    </AlertDescription>
                  </Alert>
                )}
                
                {healthData.needsBreakUsers > 0 && (
                  <Alert>
                    <Coffee className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {healthData.needsBreakUsers} team member{healthData.needsBreakUsers > 1 ? 's' : ''} may need a break
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* AI Recommendations */}
            {healthData.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  AI Recommendations
                </h4>
                <div className="space-y-1">
                  {healthData.recommendations.slice(0, 2).map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

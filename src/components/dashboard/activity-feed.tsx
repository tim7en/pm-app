import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Zap, CheckCircle2, FolderOpen, MessageCircle, Users, Bell, GitBranch, Archive, Activity } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"
import { useState } from "react"

interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
  currentUserId?: string
  onClearActivity?: () => void
  onRestoreActivity?: () => void
  activitiesCleared?: boolean
}

export function ActivityFeed({ activities, className, currentUserId, onClearActivity, onRestoreActivity, activitiesCleared }: ActivityFeedProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Process and prioritize activities for the current user
  const getProcessedActivities = () => {
    if (activities.length === 0) {
      return []
    }
    
    // Sort activities by timestamp (most recent first)
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    // Limit to 15 most recent activities for better performance
    return sortedActivities.slice(0, 15)
  }
  
  const activityData = getProcessedActivities()
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'project':
        return <FolderOpen className="h-4 w-4 text-blue-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case 'integration':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'team':
        return <Users className="h-4 w-4 text-indigo-500" />
      case 'workspace':
        return <GitBranch className="h-4 w-4 text-cyan-500" />
      case 'notification':
        return <Bell className="h-4 w-4 text-orange-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Task'
      case 'project': return 'Project'
      case 'comment': return 'Comment'
      case 'integration': return 'Integration'
      case 'team': return 'Team'
      case 'workspace': return 'Workspace'
      case 'notification': return 'Notification'
      default: return 'Activity'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {activityData.length > 0 
                ? `${activityData.length} recent updates from tasks, projects, and team activities` 
                : "Activity updates will appear here"
              }
            </CardDescription>
          </div>
          {activityData.length > 0 && onClearActivity && (
            <Button
              variant="outline"
              size="sm" 
              onClick={onClearActivity}
              className="text-xs"
            >
              <Archive className="h-3 w-3 mr-1" />
              Clear & Archive
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activityData.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {activityData.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span> {activity.message}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {activityData.length >= 8 && (
              <div className="text-center pt-3 border-t mt-3">
                <p className="text-xs text-muted-foreground">
                  Recent activity from tasks, projects, and team workspace
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            {activitiesCleared ? (
              <>
                <Archive className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Activities have been cleared and archived
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can restore recent activities if needed
                </p>
                {onRestoreActivity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRestoreActivity}
                    className="mt-3"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Restore Activities
                  </Button>
                )}
              </>
            ) : (
              <>
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recent activity to show
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity from your workspace will appear here
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityFeedFullProps {
  activities: ActivityItem[]
}

export function ActivityFeedFull({ activities }: ActivityFeedFullProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Use real activity data only
  const activityData: ActivityItem[] = activities

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Real-time updates from your projects and team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activityData.length > 0 ? (
          activityData.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name || 'User'} />
                <AvatarFallback>
                  {activity.user.name ? activity.user.name.split(' ').map(n => n[0]).join('') : 'U'}
                </AvatarFallback>
              </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{activity.user.name || 'Unknown User'}</span>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {activity.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">Activity will appear here as you work on tasks and projects</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

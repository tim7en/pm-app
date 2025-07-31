import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Zap, CheckCircle2, FolderOpen, MessageCircle, Users, Bell, GitBranch, Archive, Activity } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"
import { useTranslation } from "@/hooks/use-translation"
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
  const { t } = useTranslation()
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return t("dashboard.timeFormat.justNow")
    if (minutes < 60) return t("dashboard.timeFormat.minutesAgo", { minutes })
    if (hours < 24) return t("dashboard.timeFormat.hoursAgo", { hours })
    return t("dashboard.timeFormat.daysAgo", { days })
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
      case 'task': return t("dashboard.activityTypes.task")
      case 'project': return t("dashboard.activityTypes.project")
      case 'comment': return t("dashboard.activityTypes.comment")
      case 'integration': return t("dashboard.activityTypes.integration")
      case 'team': return t("dashboard.activityTypes.team")
      case 'workspace': return t("dashboard.activityTypes.workspace")
      case 'notification': return t("dashboard.activityTypes.notification")
      default: return t("dashboard.activityTypes.activity")
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
            <CardDescription>
              {activityData.length > 0 
                ? t("dashboard.activityFeed.recentUpdatesCount", { count: activityData.length })
                : t("dashboard.activityUpdatesWillAppearHere")
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
              {t("dashboard.activityFeed.clearAndArchive")}
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
                  {t("dashboard.activityFeed.recentActivityFromWorkspace")}
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
                  {t("dashboard.activitiesCleared")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.canRestoreRecentActivities")}
                </p>
                {onRestoreActivity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRestoreActivity}
                    className="mt-3"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    {t("dashboard.restoreActivities")}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.activityFeed.noRecentActivity")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.activityFeed.workspaceActivityWillAppearHere")}
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
  const { t } = useTranslation()
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return t("dashboard.timeFormat.justNow")
    if (minutes < 60) return t("dashboard.timeFormat.minutesAgo", { minutes })
    if (hours < 24) return t("dashboard.timeFormat.hoursAgo", { hours })
    return t("dashboard.timeFormat.daysAgo", { days })
  }

  // Use real activity data only
  const activityData: ActivityItem[] = activities

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.activityFeed.activityFeed")}</CardTitle>
        <CardDescription>{t("dashboard.activityFeed.realTimeUpdates")}</CardDescription>
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
            <p className="text-muted-foreground">{t("dashboard.activityFeed.noRecentActivity")}</p>
            <p className="text-sm text-muted-foreground">{t("dashboard.activityFeed.activityWillAppearHere")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

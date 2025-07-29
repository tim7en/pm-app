import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Zap } from "lucide-react"
import { ActivityItem } from "@/hooks/use-dashboard-data"

interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
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

  // Mock activity data if none provided
  const activityData: ActivityItem[] = activities.length > 0 ? activities : [
    {
      id: "1",
      type: "task",
      message: "completed task 'Design new landing page'",
      user: { name: "John Doe", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      id: "2",
      type: "comment",
      message: "commented on 'Fix authentication bug'",
      user: { name: "Jane Smith", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },
    {
      id: "3",
      type: "integration",
      message: "Telegram notification sent for overdue task",
      user: { name: "System", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      id: "4",
      type: "project",
      message: "created new project 'Marketing Campaign'",
      user: { name: "Mike Johnson", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Real-time updates from your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activityData.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback className="text-xs">
                {activity.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span> {activity.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
            {activity.type === 'integration' && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
        ))}
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

  // Mock activity data if none provided
  const activityData: ActivityItem[] = activities.length > 0 ? activities : [
    {
      id: "1",
      type: "task",
      message: "completed task 'Design new landing page'",
      user: { name: "John Doe", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
      id: "2",
      type: "comment",
      message: "commented on 'Fix authentication bug'",
      user: { name: "Jane Smith", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    },
    {
      id: "3",
      type: "integration",
      message: "Telegram notification sent for overdue task",
      user: { name: "System", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: "4",
      type: "project",
      message: "created new project 'Marketing Campaign'",
      user: { name: "Mike Johnson", avatar: "" },
      timestamp: new Date(Date.now() - 1000 * 60 * 60)
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Real-time updates from your projects and team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activityData.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback>
                {activity.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{activity.user.name}</span>
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
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  Filter,
  Search,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  Info,
  Clock,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Notification {
  id: string
  title: string
  message: string
  type: 'task' | 'project' | 'team' | 'system' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  sender?: {
    name: string
    avatar?: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterRead, setFilterRead] = useState("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "New Task Assigned",
          message: "You have been assigned to 'Design new landing page'",
          type: "task",
          priority: "medium",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          isRead: false,
          actionUrl: "/tasks",
          sender: {
            name: "Jane Smith",
            avatar: "/avatars/02.png"
          }
        },
        {
          id: "2",
          title: "Project Deadline Approaching",
          message: "Marketing Campaign project deadline is in 2 days",
          type: "project",
          priority: "high",
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          isRead: false,
          actionUrl: "/projects"
        },
        {
          id: "3",
          title: "Team Meeting Reminder",
          message: "Daily standup meeting starts in 30 minutes",
          type: "reminder",
          priority: "medium",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isRead: true,
          actionUrl: "/calendar"
        },
        {
          id: "4",
          title: "New Team Member",
          message: "Sarah Wilson has joined the Marketing team",
          type: "team",
          priority: "low",
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isRead: true,
          actionUrl: "/team"
        },
        {
          id: "5",
          title: "System Maintenance",
          message: "Scheduled maintenance this weekend from 2 AM to 4 AM",
          type: "system",
          priority: "medium",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          isRead: false
        },
        {
          id: "6",
          title: "Task Completed",
          message: "John Doe completed 'Fix authentication bug'",
          type: "task",
          priority: "low",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          isRead: true,
          sender: {
            name: "John Doe",
            avatar: "/avatars/01.png"
          }
        },
        {
          id: "7",
          title: "Overdue Task Alert",
          message: "3 tasks are now overdue and require attention",
          type: "task",
          priority: "urgent",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          isRead: false,
          actionUrl: "/tasks"
        },
        {
          id: "8",
          title: "Project Update",
          message: "Website Redesign project is 75% complete",
          type: "project",
          priority: "medium",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          isRead: true,
          actionUrl: "/projects"
        }
      ]
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || notification.type === filterType
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority
    const matchesRead = filterRead === "all" || 
                        (filterRead === "read" && notification.isRead) ||
                        (filterRead === "unread" && !notification.isRead)
    
    return matchesSearch && matchesType && matchesPriority && matchesRead
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return <Target className="h-4 w-4" />
      case 'project': return <Calendar className="h-4 w-4" />
      case 'team': return <Users className="h-4 w-4" />
      case 'reminder': return <Clock className="h-4 w-4" />
      case 'system': return <Info className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white'
    switch (type) {
      case 'task': return 'bg-blue-50'
      case 'project': return 'bg-purple-50'
      case 'team': return 'bg-green-50'
      case 'reminder': return 'bg-yellow-50'
      case 'system': return 'bg-gray-50'
      default: return 'bg-white'
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground mt-1">Stay updated with your team and projects</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={markAllAsRead}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
                <Button variant="outline" onClick={clearAllNotifications}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{notifications.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-red-500"></div>
                    <div>
                      <p className="text-2xl font-bold">{unreadCount}</p>
                      <p className="text-xs text-muted-foreground">Unread</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length}
                      </p>
                      <p className="text-xs text-muted-foreground">High Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {notifications.filter(n => {
                          const diff = Date.now() - n.timestamp.getTime()
                          return diff < 1000 * 60 * 60 * 24 // Last 24 hours
                        }).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Last 24h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="reminder">Reminders</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md ${getNotificationBgColor(notification.type, notification.isRead)} ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.priority)} bg-opacity-10`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${!notification.isRead ? 'text-blue-600' : ''}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            {notification.sender && (
                              <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
                                  <AvatarFallback>
                                    {notification.sender.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  From {notification.sender.name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                {notification.actionUrl && (
                                  <DropdownMenuItem>
                                    <Target className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                notification.priority === 'urgent' ? 'border-red-500 text-red-700' :
                                notification.priority === 'high' ? 'border-orange-500 text-orange-700' :
                                notification.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                                'border-green-500 text-green-700'
                              }`}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                          
                          {notification.actionUrl && (
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredNotifications.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterType !== "all" || filterPriority !== "all" || filterRead !== "all"
                      ? "Try adjusting your search or filters"
                      : "You're all caught up! No new notifications."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
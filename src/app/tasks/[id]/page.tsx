"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useAPI } from "@/hooks/use-api"
import { TaskDataManager } from "@/components/tasks/task-data-manager"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Flag, 
  User, 
  Users,
  Building,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Edit,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskStatus, Priority } from '@/lib/prisma-mock'
import { format } from "date-fns"

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export default function TaskDetailPage({ params }: TaskPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { apiCall } = useAPI()
  const { isAuthenticated, isLoading, currentWorkspace, user } = useAuth()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  // Resolve params for Next.js 15 compatibility
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }
    
    if (isAuthenticated && currentWorkspace) {
      fetchTask()
    }
  }, [isAuthenticated, isLoading, currentWorkspace, resolvedParams?.id])

  const fetchTask = async () => {
    if (!resolvedParams?.id) return
    
    try {
      const response = await apiCall(`/api/tasks/${resolvedParams.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTask(data)
      } else if (response.status === 404) {
        setError('Task not found')
      } else if (response.status === 403) {
        setError('You do not have permission to view this task')
      } else {
        setError('Failed to load task')
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      setError('Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return <Circle className="h-4 w-4 text-gray-500" />
      case TaskStatus.IN_PROGRESS:
        return <Circle className="h-4 w-4 text-blue-500" />
      case TaskStatus.REVIEW:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case TaskStatus.DONE:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "bg-gray-100 text-gray-800"
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800"
      case TaskStatus.REVIEW:
        return "bg-yellow-100 text-yellow-800"
      case TaskStatus.DONE:
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return "bg-green-100 text-green-800"
      case Priority.MEDIUM:
        return "bg-yellow-100 text-yellow-800"
      case Priority.HIGH:
        return "bg-orange-100 text-orange-800"
      case Priority.URGENT:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Error Loading Task</h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!task) {
    return null
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
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tasks
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                    {task.description && (
                      <p className="text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Task Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Creator
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.creator?.avatar} />
                        <AvatarFallback className="text-xs">
                          {task.creator?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{task.creator?.name}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Assignees
                    </div>
                    <div className="flex items-center gap-1">
                      {task.assignees?.length > 0 ? (
                        task.assignees.slice(0, 3).map((assignee: any, index: number) => (
                          <Avatar key={assignee.user.id} className="h-6 w-6">
                            <AvatarImage src={assignee.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {assignee.user.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))
                      ) : task.assignee ? (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                      {task.assignees?.length > 3 && (
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 text-xs">
                          +{task.assignees.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      Project
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: task.project?.color || '#6b7280' }}
                      />
                      {task.project?.name}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </div>
                    <span className="text-sm font-medium">
                      {task.dueDate 
                        ? format(new Date(task.dueDate), 'MMM d, yyyy')
                        : 'No due date'
                      }
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag: any) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline"
                          style={{ 
                            borderColor: tag.color,
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Data Manager */}
            <TaskDataManager
              taskId={task.id}
              task={task}
              onUpdate={fetchTask}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

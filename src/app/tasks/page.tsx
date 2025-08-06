"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { TaskList } from "@/components/tasks/task-list"
import { TaskBoard } from "@/components/tasks/task-board"
import { TaskGantt } from "@/components/tasks/task-gantt"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { TaskReassignDialog } from "@/components/tasks/task-reassign-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAPI } from "@/hooks/use-api"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  ArrowUpDown
} from "lucide-react"
import { TaskStatus, Priority } from "@prisma/client"

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
    workspaceId: string
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
}

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { apiCall } = useAPI()
  const { isAuthenticated, isLoading, currentWorkspace, user } = useAuth()
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus | undefined>(undefined)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [reassignTaskData, setReassignTaskData] = useState<{
    taskId: string
    taskTitle: string
    currentAssigneeId?: string
    currentAssigneeIds?: string[]
  } | null>(null)
  const [taskView, setTaskView] = useState<"list" | "board" | "gantt">("list")
  const [openCommentsTab, setOpenCommentsTab] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    assignee: "all",
    project: searchParams.get('project') || "all"
  })

  const convertTaskForDialog = (task: Task) => {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.project.id,
      assigneeId: task.assignee?.id,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      tags: task.tags.map(tag => ({ name: tag.name, color: tag.color })),
      subtasks: [] // We'll need to fetch subtasks separately or include them in the API
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }
    
    if (isAuthenticated && currentWorkspace) {
      fetchTasks()
      fetchProjects()
      fetchUsers()
    }
  }, [isAuthenticated, isLoading, currentWorkspace, router])

  // Listen for global comment notifications
  useEffect(() => {
    const handleNewComment = (event: CustomEvent) => {
      const data = event.detail
      // Show toast notification for new comments on tasks
      toast({
        title: "New Comment",
        description: `${data.commenterName} commented on "${data.taskTitle}"`,
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const task = tasks.find(t => t.id === data.taskId)
              if (task) {
                handleTaskEditWithComments(task)
              }
            }}
          >
            View
          </Button>
        ),
      })
      // Refresh tasks to update comment count
      fetchTasks()
    }

    window.addEventListener('newComment', handleNewComment as EventListener)
    
    return () => {
      window.removeEventListener('newComment', handleNewComment as EventListener)
    }
  }, [tasks, toast])

  const fetchTasks = async () => {
    if (!currentWorkspace) return
    
    try {
      console.log('Fetching tasks with authentication...')
      const response = await apiCall(`/api/tasks?workspaceId=${currentWorkspace.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Tasks fetched successfully:', data.length)
        setTasks(data)
      } else {
        console.error('Failed to fetch tasks:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await apiCall(`/api/projects?workspaceId=${currentWorkspace.id}&includeCounts=true`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchUsers = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await apiCall(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.ok) {
        const data = await response.json()
        // Transform the workspace members data to match the expected format
        // The API already returns flattened data with member.id, member.name, etc.
        const users = data.map((member: any) => ({
          id: member.id,
          name: member.name || member.email,
          email: member.email,
          avatar: member.avatar || "",
          role: member.role,
          joinedAt: member.joinedAt
        }))
        setUsers(users)
      } else {
        console.error('Failed to fetch workspace members:', response.status, response.statusText)
        // Fallback to empty array if API fails
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error)
      // Fallback to empty array if API fails
      setUsers([])
    }
  }

  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await apiCall('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        await fetchTasks()
        setTaskDialogOpen(false)
        setEditingTask(null)
        toast({
          title: "Task created",
          description: "Task has been created successfully.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTask = async (taskData: any) => {
    try {
      const response = await apiCall(`/api/tasks/${editingTask?.id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        await fetchTasks()
        setEditingTask(null)
        toast({
          title: "Task updated",
          description: "Task has been updated successfully.",
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        toast({
          title: "Task updated",
          description: "The task has been updated successfully.",
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Task deleted",
          description: "The task has been deleted successfully.",
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the task",
        variant: "destructive",
      })
    }
  }

  const handleTaskReassign = (taskId: string, currentAssigneeId?: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Get current assignees from the task
    const currentAssigneeIds: string[] = []
    
    // Support both legacy assigneeId and new assignees array
    // Use type assertion since the Task type might not include assignees yet
    const taskWithAssignees = task as any
    if (taskWithAssignees.assignees && taskWithAssignees.assignees.length > 0) {
      currentAssigneeIds.push(...taskWithAssignees.assignees.map((a: any) => a.user.id))
    } else if (task.assignee?.id) {
      currentAssigneeIds.push(task.assignee.id)
    }
    
    setReassignTaskData({
      taskId,
      taskTitle: task.title,
      currentAssigneeId,
      currentAssigneeIds
    })
    setReassignDialogOpen(true)
  }

  const handleReassignComplete = async (taskId: string, newAssigneeIds?: string[]) => {
    // Refresh tasks to get updated assignee information
    await fetchTasks()
  }

  const handleTaskEditWithComments = (task: any) => {
    setEditingTask(task)
    setOpenCommentsTab(true)
    setTaskDialogOpen(true)
  }

  const filteredTasks = tasks.filter(task => {
    // Handle assignee filter logic
    let assigneeMatch = true
    if (filters.assignee !== "all") {
      if (filters.assignee === "unassigned") {
        assigneeMatch = !task.assignee
      } else {
        assigneeMatch = task.assignee?.id === filters.assignee
      }
    }

    return (
      (!filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
       (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()))) &&
      (filters.status === "all" || task.status === filters.status) &&
      (filters.priority === "all" || task.priority === filters.priority) &&
      assigneeMatch &&
      (filters.project === "all" || task.project.id === filters.project)
    )
  })

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    review: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
  }

  // Show loading spinner while authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onProjectCreated={fetchProjects} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{t("tasks.myTasks")}</h1>
                <p className="text-muted-foreground mt-1">{t("tasks.taskManagement")}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {t("common.filter")}
                </Button>
              </div>
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-2xl font-bold">{taskStats.todo}</p>
                      <p className="text-xs text-muted-foreground">{t("tasks.todo")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">{t("tasks.inProgress")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{taskStats.review}</p>
                      <p className="text-xs text-muted-foreground">{t("tasks.review")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{taskStats.done}</p>
                      <p className="text-xs text-muted-foreground">{t("tasks.done")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{taskStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("common.filter")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={t("tasks.searchTasks")}
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tasks.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tasks.allStatuses")}</SelectItem>
                      <SelectItem value={TaskStatus.TODO}>{t("tasks.todo")}</SelectItem>
                      <SelectItem value={TaskStatus.IN_PROGRESS}>{t("tasks.inProgress")}</SelectItem>
                      <SelectItem value={TaskStatus.REVIEW}>{t("tasks.review")}</SelectItem>
                      <SelectItem value={TaskStatus.DONE}>{t("tasks.done")}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tasks.priority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tasks.allPriorities")}</SelectItem>
                      <SelectItem value={Priority.LOW}>{t("tasks.low")}</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>{t("tasks.medium")}</SelectItem>
                      <SelectItem value={Priority.HIGH}>{t("tasks.high")}</SelectItem>
                      <SelectItem value={Priority.URGENT}>{t("tasks.urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.assignee} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tasks.assignee")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tasks.allAssignees")}</SelectItem>
                      <SelectItem value="unassigned">{t("tasks.unassigned")}</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tasks.project")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tasks.allProjects")}</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Task View */}
            <Tabs value={taskView} onValueChange={(value) => setTaskView(value as "list" | "board" | "gantt")}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="list">{t("tasks.listView")}</TabsTrigger>
                  <TabsTrigger value="board">{t("tasks.boardView")}</TabsTrigger>
                  <TabsTrigger value="gantt">{t("tasks.ganttView")}</TabsTrigger>
                </TabsList>
                
                <div className="text-sm text-muted-foreground">
                  {t("tasks.showingTasks", { 
                    start: filteredTasks.length, 
                    end: filteredTasks.length, 
                    total: tasks.length 
                  })}
                </div>
              </div>
              
              <TabsContent value="list" className="mt-6">
                <TaskList 
                  tasks={filteredTasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleDeleteTask}
                  onTaskEdit={(task) => {
                    setEditingTask(task)
                    setOpenCommentsTab(false)
                    setTaskDialogOpen(true)
                  }}
                  onTaskView={(taskId) => {
                    router.push(`/tasks/${taskId}`)
                  }}
                  onTaskEditWithComments={handleTaskEditWithComments}
                  onCreateTask={() => {
                    setInitialTaskStatus(undefined)
                    setTaskDialogOpen(true)
                  }}
                  onTaskReassign={handleTaskReassign}
                  currentUserId={user?.id}
                />
              </TabsContent>
              
              <TabsContent value="board" className="mt-6">
                <TaskBoard 
                  tasks={filteredTasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleDeleteTask}
                  onCreateTask={(status) => {
                    setInitialTaskStatus(status)
                    setTaskDialogOpen(true)
                  }}
                  currentUserId={user?.id}
                />
              </TabsContent>

              <TabsContent value="gantt" className="mt-6">
                <TaskGantt 
                  tasks={filteredTasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleDeleteTask}
                  onTaskEdit={(task) => {
                    setEditingTask(task)
                    setTaskDialogOpen(true)
                  }}
                  currentUserId={user?.id}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) {
            setEditingTask(null)
            setInitialTaskStatus(undefined)
            setOpenCommentsTab(false)
          }
        }}
        task={editingTask ? convertTaskForDialog(editingTask) : undefined}
        initialStatus={initialTaskStatus}
        initialTab={openCommentsTab ? "comments" : "details"}
        projects={projects}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Task Reassign Dialog */}
      {reassignTaskData && (
        <TaskReassignDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          taskId={reassignTaskData.taskId}
          taskTitle={reassignTaskData.taskTitle}
          currentAssigneeId={reassignTaskData.currentAssigneeId}
          currentAssigneeIds={reassignTaskData.currentAssigneeIds}
          onReassignComplete={handleReassignComplete}
        />
      )}
    </div>
  )
}
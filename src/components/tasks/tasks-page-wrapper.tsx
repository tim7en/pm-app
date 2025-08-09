"use client"

import { useState, useEffect, Suspense } from "react"
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
import { useAuth } from "@/contexts/AuthContext"
import { useAPI } from "@/hooks/use-api"
import { useSocket } from "@/hooks/use-socket"
import { useTranslation } from "@/hooks/use-translation"
import { 
  Search, 
  Filter, 
  Plus, 
  Circle, 
  CheckCircle2, 
  ArrowUpDown, 
  AlertCircle,
  FolderOpen,
  ListChecks
} from "lucide-react"
import { TaskStatus, Priority } from '@/lib/prisma-mock'

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
  assignees?: {
    id: string
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }[]
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
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  commentCount: number
  attachmentCount: number
  subtaskCount: number
  completedSubtaskCount: number
}

function TasksPageContent() {
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
  const [openCommentsTab, setOpenCommentsTab] = useState(false)
  const [taskView, setTaskView] = useState<"list" | "board" | "gantt">("list")
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    project: "all",
    assignee: "all"
  })

  const { socket } = useSocket()

  // Get task parameters from URL
  const taskId = searchParams.get('taskId')
  const projectId = searchParams.get('project')

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    review: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
  }

  // Get task status color
  const getTaskStatusColor = (status: TaskStatus) => {
    return {
      [TaskStatus.TODO]: "bg-gray-100 text-gray-800",
      [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
      [TaskStatus.REVIEW]: "bg-yellow-100 text-yellow-800",
      [TaskStatus.DONE]: "bg-green-100 text-green-800",
    }[status] || "bg-gray-100 text-gray-800"
  }

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const handleTaskCreated = (newTask: Task) => {
      setTasks(prev => [newTask, ...prev])
      toast({
        title: "Task created",
        description: `"${newTask.title}" has been created`,
      })
    }

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ))
    }

    const handleTaskDeleted = (deletedTaskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== deletedTaskId))
    }

    if (!socket) return

    socket.on('taskCreated', handleTaskCreated)
    socket.on('taskUpdated', handleTaskUpdated)
    socket.on('taskDeleted', handleTaskDeleted)

    return () => {
      socket.off('taskCreated', handleTaskCreated)
      socket.off('taskUpdated', handleTaskUpdated)
      socket.off('taskDeleted', handleTaskDeleted)
    }
  }, [socket, toast])

  // Load tasks and related data
  useEffect(() => {
    if (!currentWorkspace) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [tasksResponse, projectsResponse, usersResponse] = await Promise.all([
          apiCall(`/api/tasks?workspace=${currentWorkspace.id}`),
          apiCall(`/api/projects?workspace=${currentWorkspace.id}`),
          apiCall(`/api/workspaces/${currentWorkspace.id}/members`)
        ])

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData)
        }

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setProjects(projectsData)
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.map((member: any) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatar: member.user.avatar,
            role: member.role
          })))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentWorkspace, apiCall, toast])

  // Handle opening task dialog from URL parameters
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setEditingTask(task)
        setOpenCommentsTab(false)
        setTaskDialogOpen(true)
        // Clear URL parameter after opening
        router.replace('/tasks', { scroll: false })
      }
    }
  }, [taskId, tasks, router])

  // Apply project filter from URL
  useEffect(() => {
    if (projectId) {
      setFilters(prev => ({ ...prev, project: projectId }))
    }
  }, [projectId])

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status !== "all" && task.status !== filters.status) return false
    if (filters.priority !== "all" && task.priority !== filters.priority) return false
    if (filters.project !== "all" && task.project.id !== filters.project) return false
    if (filters.assignee !== "all") {
      const hasAssignee = task.assignee?.id === filters.assignee || 
                         task.assignees?.some(a => a.user.id === filters.assignee)
      if (!hasAssignee) return false
    }
    return true
  })

  // Task CRUD operations
  const handleCreateTask = async (taskData: any) => {
    if (!currentWorkspace) return

    try {
      const response = await apiCall('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...taskData,
          workspaceId: currentWorkspace.id,
          status: initialTaskStatus || TaskStatus.TODO
        }),
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [newTask, ...prev])
        setTaskDialogOpen(false)
        setEditingTask(null)
        setInitialTaskStatus(undefined)
        toast({
          title: "Task created",
          description: `"${newTask.title}" has been created successfully.`,
        })
      } else {
        throw new Error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return

    try {
      const response = await apiCall(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ))
        setTaskDialogOpen(false)
        setEditingTask(null)
        toast({
          title: "Task updated",
          description: `"${updatedTask.title}" has been updated successfully.`,
        })
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev => prev.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        ))
        toast({
          title: "Task updated",
          description: "Task has been updated successfully.",
        })
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await apiCall(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        toast({
          title: "Task deleted",
          description: "Task has been deleted successfully.",
        })
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTaskEditWithComments = (task: Task) => {
    setEditingTask(task)
    setOpenCommentsTab(true)
    setTaskDialogOpen(true)
  }

  // Transform Task to TaskDialog format
  const transformTaskForDialog = (task: Task | null) => {
    if (!task) return undefined
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.project.id,
      assigneeId: task.assignee?.id,
      assigneeIds: task.assignees?.map(a => a.user.id),
      assignees: task.assignees,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      tags: task.tags.map(tag => ({ name: tag.name, color: tag.color })),
      subtasks: task.subtasks?.map(sub => ({ title: sub.title, isCompleted: sub.completed })) || []
    }
  }

  const handleTaskReassign = (taskId: string, currentAssigneeId?: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    setReassignTaskData({
      taskId: task.id,
      taskTitle: task.title,
      currentAssigneeId: currentAssigneeId,
      currentAssigneeIds: task.assignees?.map(a => a.user.id) || []
    })
    setReassignDialogOpen(true)
  }

  const handleReassignComplete = () => {
    setReassignDialogOpen(false)
    setReassignTaskData(null)
    // Refresh tasks to get updated assignee information
    if (currentWorkspace) {
      apiCall(`/api/tasks?workspace=${currentWorkspace.id}`)
        .then(response => response.json())
        .then(data => setTasks(data))
    }
  }

  // Loading and authentication guards
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
                  <p className="text-muted-foreground">Please log in to view your tasks.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          tasks={tasks}
          projects={projects}
          users={users}
        />
        
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
                  
                  <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("projects.project")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("projects.allProjects")}</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.assignee} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("tasks.assignee")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("tasks.allAssignees")}</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
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
                    setOpenCommentsTab(false)
                    setTaskDialogOpen(true)
                  }}
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
        task={transformTaskForDialog(editingTask)}
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

// Wrap the component with Suspense boundary
export default function TasksPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading tasks...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  )
}

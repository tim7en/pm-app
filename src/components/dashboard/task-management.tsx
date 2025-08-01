import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/tasks/task-list"
import { TaskBoard } from "@/components/tasks/task-board"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, User, UserCheck, Clock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"

interface TaskManagementProps {
  tasks: any[]
  projects: any[]
  taskView: "list" | "board"
  onTaskViewChange: (view: "list" | "board") => void
  onTaskStatusChange: (taskId: string, status: string) => Promise<boolean>
  onTaskUpdate: (taskId: string, updates: any) => Promise<boolean>
  onTaskDelete: (taskId: string) => Promise<boolean>
  onCreateTask: (status?: string) => void
}

export function TaskManagement({
  tasks,
  projects,
  taskView,
  onTaskViewChange,
  onTaskStatusChange,
  onTaskUpdate,
  onTaskDelete,
  onCreateTask
}: TaskManagementProps) {
  const { user } = useAuth()
  const { t } = useTranslation()
  
  if (!user) return null

  // Separate tasks into assigned and created categories
  // Fix: Ensure we're checking the assigneeId correctly
  const assignedTasks = tasks.filter(task => {
    // Only include tasks that are specifically assigned to the current user
    return task.assigneeId && task.assigneeId === user.id
  })
  
  const createdTasks = tasks.filter(task => {
    // Only include tasks created by the current user that are assigned to someone else
    return task.creatorId === user.id && task.assigneeId !== user.id
  })
  
  // Calculate stats for assigned tasks
  const assignedStats = {
    total: assignedTasks.length,
    completed: assignedTasks.filter(task => task.status === 'DONE').length,
    inProgress: assignedTasks.filter(task => task.status === 'IN_PROGRESS').length,
    pending: assignedTasks.filter(task => task.status === 'TODO').length,
  }
  
  // Calculate stats for created tasks
  const createdStats = {
    total: createdTasks.length,
    completed: createdTasks.filter(task => task.status === 'DONE').length,
    inProgress: createdTasks.filter(task => task.status === 'IN_PROGRESS').length,
    pending: createdTasks.filter(task => task.status === 'TODO').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("dashboard.myTasks")}</h2>
          <p className="text-muted-foreground">{t("tasks.taskManagement")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={taskView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onTaskViewChange("list")}
          >
            {t("tasks.listView")}
          </Button>
          <Button
            variant={taskView === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => onTaskViewChange("board")}
          >
            {t("tasks.boardView")}
          </Button>
          <Button size="sm" onClick={() => onCreateTask()}>
            <Plus className="h-4 w-4 mr-2" />
            {t("tasks.newTask")}
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("tasks.assignedTo")} {t("dashboard.me")}</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedStats.total}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{assignedStats.completed} {t("dashboard.completed")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>{assignedStats.inProgress} {t("dashboard.inProgress")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>{assignedStats.pending} {t("tasks.todo")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("tasks.createdBy")} {t("dashboard.me")}</CardTitle>
            <User className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{createdStats.total}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{createdStats.completed} {t("dashboard.completed")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>{createdStats.inProgress} {t("dashboard.inProgress")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>{createdStats.pending} {t("tasks.todo")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Categories */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {t("tasks.assignedTo")} {t("dashboard.me")} ({assignedStats.total})
          </TabsTrigger>
          <TabsTrigger value="created" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("tasks.createdBy")} {t("dashboard.me")} ({createdStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t("tasks.tasksAssignedToYou")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("tasks.tasksNeedToComplete")}
              </p>
            </div>
          </div>
          
          {taskView === "list" ? (
            <TaskList
              tasks={assignedTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onCreateTask={() => onCreateTask()}
              currentUserId={user.id}
              taskType="assigned"
            />
          ) : (
            <TaskBoard
              tasks={assignedTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onCreateTask={(status) => onCreateTask(status)}
              currentUserId={user.id}
            />
          )}
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t("tasks.tasksCreatedByYou")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("tasks.tasksCreatedAndAssigned")}
              </p>
            </div>
          </div>
          
          {taskView === "list" ? (
            <TaskList
              tasks={createdTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onCreateTask={() => onCreateTask()}
              currentUserId={user.id}
              taskType="created"
            />
          ) : (
            <TaskBoard
              tasks={createdTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onCreateTask={(status) => onCreateTask(status)}
              currentUserId={user.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

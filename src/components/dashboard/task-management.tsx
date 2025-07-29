import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/tasks/task-list"
import { TaskBoard } from "@/components/tasks/task-board"
import { Plus } from "lucide-react"

interface TaskManagementProps {
  tasks: any[]
  projects: any[]
  taskView: "list" | "board"
  onTaskViewChange: (view: "list" | "board") => void
  onTaskStatusChange: (taskId: string, status: string) => Promise<boolean>
  onTaskDelete: (taskId: string) => Promise<boolean>
  onCreateTask: (status?: string) => void
}

export function TaskManagement({
  tasks,
  projects,
  taskView,
  onTaskViewChange,
  onTaskStatusChange,
  onTaskDelete,
  onCreateTask
}: TaskManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Tasks</h2>
          <p className="text-muted-foreground">Manage and track your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={taskView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onTaskViewChange("list")}
          >
            List
          </Button>
          <Button
            variant={taskView === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => onTaskViewChange("board")}
          >
            Board
          </Button>
          <Button size="sm" onClick={() => onCreateTask()}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {taskView === "list" ? (
        <TaskList
          tasks={tasks}
          onTaskUpdate={onTaskStatusChange}
          onTaskDelete={onTaskDelete}
          onCreateTask={() => onCreateTask()}
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          onTaskUpdate={onTaskStatusChange}
          onTaskDelete={onTaskDelete}
          onCreateTask={(status) => onCreateTask(status)}
        />
      )}
    </div>
  )
}

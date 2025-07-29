"use client"

import { useDroppable } from '@dnd-kit/core'
import { TaskStatus, Priority } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Plus
} from "lucide-react"
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskCard } from "./sortable-task-card"

interface DroppableColumnProps {
  status: TaskStatus
  title: string
  color: string
  tasks: Array<{
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
  }>
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskDelete?: (taskId: string) => void
  onCreateTask?: (status: TaskStatus) => void
}

export function DroppableColumn({ 
  status, 
  title, 
  color, 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onCreateTask 
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[300px] flex flex-col"
    >
      <Card className={`flex-1 flex flex-col ${isOver ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">
                {title}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onCreateTask?.(status)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Clear Column</DropdownMenuItem>
                  <DropdownMenuItem>Archive Completed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-3 pt-0 space-y-3 overflow-y-auto">
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onStatusChange={(taskId, status) => onTaskUpdate?.(taskId, { status })}
                onEdit={(task) => console.log('Edit task:', task)}
                onDelete={onTaskDelete}
              />
            ))}
          </SortableContext>
          
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                No tasks in this column
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateTask?.(status)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
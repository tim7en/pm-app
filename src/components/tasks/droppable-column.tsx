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
  currentUserId?: string
}

export function DroppableColumn({ 
  status, 
  title, 
  color, 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onCreateTask,
  currentUserId
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className="w-full h-full flex flex-col"
    >
      <Card className={`h-full flex flex-col hover-lift transition-all duration-300 ${isOver ? 'ring-2 ring-primary shadow-premium' : 'shadow-md'}`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                {title}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                {tasks.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/10"
                onClick={() => onCreateTask?.(status)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10">
                    <MoreHorizontal className="h-3.5 w-3.5" />
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
        
        <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin">
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <div key={task.id} className="animate-fade-in">
                <SortableTaskCard
                  task={task}
                  onStatusChange={(taskId, status) => onTaskUpdate?.(taskId, { status })}
                  onEdit={(task) => onTaskUpdate?.(task.id, task)}
                  onDelete={onTaskDelete}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </SortableContext>
          
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="p-3 rounded-full bg-muted/30 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                No tasks yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateTask?.(status)}
                className="hover-lift"
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
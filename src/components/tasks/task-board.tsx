"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskCard } from "./task-card"
import { SortableTaskCard } from "./sortable-task-card"
import { DroppableColumn } from "./droppable-column"
import { TaskStatus, Priority } from "@prisma/client"

interface TaskBoardProps {
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

const statusColumns = [
  { id: TaskStatus.TODO, title: "To Do", color: "bg-gray-100 text-gray-800" },
  { id: TaskStatus.IN_PROGRESS, title: "In Progress", color: "bg-blue-100 text-blue-800" },
  { id: TaskStatus.REVIEW, title: "Review", color: "bg-yellow-100 text-yellow-800" },
  { id: TaskStatus.DONE, title: "Done", color: "bg-green-100 text-green-800" },
]

export function TaskBoard({ tasks, onTaskUpdate, onTaskDelete, onCreateTask }: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (over) {
      const overId = over.id as string
      
      // Check if the over element is a column (status)
      if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
        // Set the column as the drop target
        return
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over) {
      const activeId = active.id as string
      const overId = over.id as string
      
      // Check if the drop target is a status column
      if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
        const newStatus = overId as TaskStatus
        onTaskUpdate?.(activeId, { status: newStatus })
      }
    }
    
    setActiveId(null)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full gap-4">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            
            return (
              <DroppableColumn
                key={column.id}
                status={column.id}
                title={column.title}
                color={column.color}
                tasks={columnTasks}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                onCreateTask={onCreateTask}
              />
            )
          })}
        </div>
      </div>
      
      <DragOverlay>
        {activeId ? (
          <TaskCard
            task={tasks.find(task => task.id === activeId)!}
            onStatusChange={(taskId, status) => onTaskUpdate?.(taskId, { status })}
            onEdit={(task) => console.log('Edit task:', task)}
            onDelete={onTaskDelete}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
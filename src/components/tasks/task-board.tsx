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
import { useTranslation } from "@/hooks/use-translation"

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
  currentUserId?: string
}

const statusColumns = [
  { id: TaskStatus.TODO, title: "tasks.todo", color: "bg-gray-100 text-gray-800" },
  { id: TaskStatus.IN_PROGRESS, title: "tasks.inProgress", color: "bg-blue-100 text-blue-800" },
  { id: TaskStatus.REVIEW, title: "tasks.review", color: "bg-yellow-100 text-yellow-800" },
  { id: TaskStatus.DONE, title: "tasks.done", color: "bg-green-100 text-green-800" },
]

export function TaskBoard({ tasks, onTaskUpdate, onTaskDelete, onCreateTask, currentUserId }: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { t } = useTranslation()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    setActiveId(activeId)
    
    // Add visual feedback
    const activeTask = tasks.find(task => task.id === activeId)
    if (activeTask) {
      console.log(`Starting drag for task: ${activeTask.title}`)
    }
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
    
    if (over && active.id !== over.id) {
      const activeId = active.id as string
      const overId = over.id as string
      
      // Find the task being dragged
      const activeTask = tasks.find(task => task.id === activeId)
      if (!activeTask) {
        console.warn('Active task not found:', activeId)
        setActiveId(null)
        return
      }
      
      // Check if the drop target is a status column
      if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
        const newStatus = overId as TaskStatus
        console.log(`Moving task ${activeId} from ${activeTask.status} to ${newStatus}`)
        
        // Only update if status actually changed
        if (activeTask.status !== newStatus) {
          onTaskUpdate?.(activeId, { status: newStatus })
        }
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
      <div className="w-full h-[600px] overflow-x-auto overflow-y-hidden border rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 task-board-scroll">
        <div className="flex h-full gap-6 p-4 min-w-max">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            
            return (
              <div key={column.id} className="task-column">
                <DroppableColumn
                  status={column.id}
                  title={t(column.title)}
                  color={column.color}
                  tasks={columnTasks}
                  onTaskUpdate={onTaskUpdate}
                  onTaskDelete={onTaskDelete}
                  onCreateTask={() => onCreateTask?.(column.id)}
                  currentUserId={currentUserId}
                />
              </div>
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
            currentUserId={currentUserId}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
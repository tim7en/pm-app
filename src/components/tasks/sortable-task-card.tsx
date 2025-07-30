"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './task-card'
import { TaskStatus, Priority } from "@prisma/client"

interface SortableTaskCardProps {
  task: {
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
  }
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  onEdit?: (task: any) => void
  onDelete?: (taskId: string) => void
  currentUserId?: string
}

export function SortableTaskCard({ task, onStatusChange, onEdit, onDelete, currentUserId }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <TaskCard
        task={task}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        currentUserId={currentUserId}
      />
    </div>
  )
}
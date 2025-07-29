"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Subtask {
  id: string
  title: string
  isCompleted: boolean
}

interface TaskSubtasksProps {
  taskId: string
  subtasks: Subtask[]
  canEdit: boolean
  onUpdate: () => void
}

export function TaskSubtasks({ taskId, subtasks, canEdit, onUpdate }: TaskSubtasksProps) {
  const [newSubtask, setNewSubtask] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtask.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newSubtask.trim() })
      })

      if (response.ok) {
        setNewSubtask("")
        setIsAdding(false)
        onUpdate()
        toast({
          title: "Subtask added",
          description: "The subtask has been added successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to add subtask",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding subtask:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isCompleted })
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update subtask",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating subtask:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        onUpdate()
        toast({
          title: "Subtask deleted",
          description: "The subtask has been deleted successfully",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete subtask",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting subtask:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing Subtasks */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <Checkbox
              checked={subtask.isCompleted}
              onCheckedChange={(checked) => 
                handleToggleSubtask(subtask.id, checked as boolean)
              }
              disabled={!canEdit}
            />
            <span 
              className={`flex-1 text-sm ${
                subtask.isCompleted 
                  ? 'line-through text-gray-500' 
                  : 'text-gray-700'
              }`}
            >
              {subtask.title}
            </span>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      {canEdit && (
        <div className="space-y-2">
          {isAdding ? (
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <Input
                placeholder="Enter subtask title..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Add
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewSubtask("")
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full justify-start gap-2 text-gray-500 hover:text-gray-700"
            >
              <Plus size={16} />
              Add subtask
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

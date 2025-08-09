"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAPI } from "@/hooks/use-api"
import { useSocketContext } from "@/contexts/SocketContext"
import { TaskStatus } from '@/lib/prisma-mock'
import { useTranslation } from "@/hooks/use-translation"

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface TaskCommentsProps {
  taskId: string
  comments: Comment[]
  onUpdate: () => void
  canComment?: boolean
  currentStatus?: TaskStatus
  canChangeStatus?: boolean
  onStatusChange?: (newStatus: TaskStatus) => void
}

export function TaskComments({ 
  taskId, 
  comments, 
  onUpdate, 
  canComment = true, 
  currentStatus,
  canChangeStatus = true,
  onStatusChange
}: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(currentStatus || TaskStatus.TODO)
  const { toast } = useToast()
  const { apiCall } = useAPI()
  const { socket } = useSocketContext()
  const { t } = useTranslation()

  // Listen for real-time comment updates
  useEffect(() => {
    if (!socket) return

    // Join task-specific room for real-time updates
    socket.emit('join-task', taskId)

    // Listen for new comments on this task
    const handleCommentUpdated = (data: any) => {
      if (data.taskId === taskId) {
        // Refresh comments when a new comment is added
        onUpdate()
        
        // Show toast notification for new comments (but not for our own comments)
        if (data.newComment && data.newComment.user.id !== socket.id) {
          toast({
            title: "New Comment",
            description: `${data.newComment.user.name} added a comment`,
          })
        }
      }
    }

    socket.on('comment-updated', handleCommentUpdated)

    return () => {
      socket.off('comment-updated', handleCommentUpdated)
      socket.emit('leave-task', taskId)
    }
  }, [socket, taskId, onUpdate, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await apiCall(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      if (response.ok) {
        setNewComment("")
        onUpdate()
        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully.",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update selected status when current status changes
  useEffect(() => {
    if (currentStatus) {
      setSelectedStatus(currentStatus)
    }
  }, [currentStatus])

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === currentStatus || !canChangeStatus) return

    try {
      const response = await apiCall(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (response.ok) {
        setSelectedStatus(newStatus)
        
        if (onStatusChange) {
          onStatusChange(newStatus)
        }

        // Update parent component to reflect status change
        onUpdate()

        toast({
          title: "Status updated",
          description: `Task status changed to ${getStatusLabel(newStatus)}`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update task status",
          variant: "destructive",
        })
        // Reset to current status on error
        setSelectedStatus(currentStatus || TaskStatus.TODO)
      }
    } catch (error) {
      console.error('Error changing status:', error)
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
      // Reset to current status on error
      setSelectedStatus(currentStatus || TaskStatus.TODO)
    }
  }

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return t("tasks.todo")
      case TaskStatus.IN_PROGRESS: return t("tasks.inProgress")
      case TaskStatus.REVIEW: return t("tasks.review")
      case TaskStatus.DONE: return t("tasks.done")
      default: return status
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return <Clock className="h-4 w-4" />
      case TaskStatus.IN_PROGRESS: return <ArrowRight className="h-4 w-4" />
      case TaskStatus.REVIEW: return <AlertCircle className="h-4 w-4" />
      case TaskStatus.DONE: return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Change Section */}
      {canChangeStatus && currentStatus && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon(selectedStatus)}
              Change Task Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(currentStatus)}
                <span className="text-sm font-medium">{getStatusLabel(currentStatus)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Change to:</span>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("tasks.todo")}
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      {t("tasks.inProgress")}
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskStatus.REVIEW}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {t("tasks.review")}
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskStatus.DONE}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t("tasks.done")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback className="text-xs">
                  {comment.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.user.name || 'Unknown User'}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy at h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="sm" 
              disabled={!newComment.trim() || isSubmitting}
              className="gap-2"
            >
              <Send size={16} />
              {isSubmitting ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-muted-foreground border rounded-lg">
          <p className="text-sm">You don't have permission to add comments to this task.</p>
        </div>
      )}
    </div>
  )
}

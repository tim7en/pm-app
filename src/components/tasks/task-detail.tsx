"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Flag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { TaskVerification } from "./task-verification"
import { TaskComments } from "./task-comments"
import { TaskSubtasks } from "./task-subtasks"
import { TaskStatus, Priority, TaskVerificationStatus } from '@/lib/prisma-mock'

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
    email: string
    avatar?: string 
  }
  creator: { 
    id: string
    name: string 
    email: string
    avatar?: string 
  }
  project: {
    id: string
    name: string
    color: string
  }
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  verificationStatus: TaskVerificationStatus
  verifiedBy?: {
    id: string
    name: string
  }
  verifiedAt?: Date
  rejectionReason?: string
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: Date
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
  subtasks: Array<{
    id: string
    title: string
    isCompleted: boolean
  }>
  attachments?: Array<{
    id: string
    name: string
    url: string
    size: number
  }>
  commentCount: number
  subtaskCount: number
  completedSubtaskCount: number
}

interface TaskDetailProps {
  task: Task
  canVerifyTasks: boolean
  canEditTask: boolean
  onTaskUpdated: () => void
  onClose: () => void
}

interface HeaderProps {
  tasks?: any[]
  projects?: any[]
  users?: any[]
  onImportData?: (data: any) => Promise<void>
  onProjectCreated?: () => void
}

export function TaskDetail({ 
  task, 
  canVerifyTasks, 
  canEditTask, 
  onTaskUpdated, 
  onClose 
}: TaskDetailProps) {
  const { toast } = useToast()
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO': return "bg-gray-100 text-gray-800"
      case 'IN_PROGRESS': return "bg-blue-100 text-blue-800"
      case 'REVIEW': return "bg-yellow-100 text-yellow-800"
      case 'AWAITING_VERIFICATION': return "bg-purple-100 text-purple-800"
      case 'VERIFIED': return "bg-green-100 text-green-800"
      case 'DONE': return "bg-green-100 text-green-800"
      case 'REJECTED': return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW': return "text-gray-500"
      case 'MEDIUM': return "text-yellow-500"
      case 'HIGH': return "text-orange-500"
      case 'URGENT': return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle size={16} />
      default: return <Flag size={16} />
    }
  }

  const getStatusDisplayName = (status: TaskStatus) => {
    switch (status) {
      case 'TODO': return 'To Do'
      case 'IN_PROGRESS': return 'In Progress'
      case 'REVIEW': return 'In Review'
      case 'AWAITING_VERIFICATION': return 'Awaiting Verification'
      case 'VERIFIED': return 'Verified'
      case 'DONE': return 'Done'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const handleTaskVerification = async (verified: boolean, reason?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verified, rejectionReason: reason })
      })
      
      if (response.ok) {
        toast({
          title: verified ? "Task verified" : "Task rejected",
          description: verified 
            ? "The task has been marked as verified" 
            : "The task has been rejected and returned to in-progress",
          variant: verified ? "default" : "destructive",
        })
        setVerificationOpen(false)
        onTaskUpdated()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to verify task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying task:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={getStatusColor(task.status)}
            >
              {getStatusDisplayName(task.status)}
            </Badge>
            <div className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              <span className="text-sm font-medium">{task.priority}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User size={16} />
              <span>Created by {task.creator.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          {(task.status === 'AWAITING_VERIFICATION' || task.verificationStatus !== 'PENDING') && (
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.verificationStatus === 'PENDING' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-yellow-500" />
                        <span className="text-sm">Awaiting verification</span>
                      </div>
                      {canVerifyTasks && (
                        <Button 
                          onClick={() => setVerificationOpen(true)} 
                          variant="outline" 
                          size="sm"
                          className="gap-2"
                          disabled={isLoading}
                        >
                          <CheckCircle size={16} />
                          Verify Task
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {task.verificationStatus === 'VERIFIED' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm text-green-700">
                        Verified by {task.verifiedBy?.name}
                        {task.verifiedAt && ` on ${format(new Date(task.verifiedAt), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                  
                  {task.verificationStatus === 'REJECTED' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <XCircle size={16} className="text-red-500" />
                        <span className="text-sm text-red-700">
                          Rejected by {task.verifiedBy?.name}
                          {task.verifiedAt && ` on ${format(new Date(task.verifiedAt), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                      {task.rejectionReason && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-sm text-red-800">{task.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Subtasks ({task.completedSubtaskCount}/{task.subtaskCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskSubtasks
                  taskId={task.id}
                  subtasks={task.subtasks}
                  canEdit={canEditTask}
                  onUpdate={onTaskUpdated}
                />
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip size={20} />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Paperclip size={16} />
                        <span className="text-sm">{attachment.name}</span>
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(attachment.size)})
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({task.commentCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskComments
                taskId={task.id}
                comments={task.comments}
                onUpdate={onTaskUpdated}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div>
                <label className="text-sm font-medium text-gray-500">Assignee</label>
                <div className="mt-1">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Due Date */}
              <div>
                <label className="text-sm font-medium text-gray-500">Due Date</label>
                <div className="mt-1">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No due date</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Project */}
              <div>
                <label className="text-sm font-medium text-gray-500">Project</label>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: task.project.color }}
                    />
                    <span className="text-sm">{task.project.name}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        variant="secondary"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verification Dialog */}
      <TaskVerification
        taskId={task.id}
        taskTitle={task.title}
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onVerify={handleTaskVerification}
      />
    </div>
  )
}
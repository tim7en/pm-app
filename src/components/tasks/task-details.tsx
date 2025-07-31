"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  MoreVertical,
  CheckCircle,
  Circle,
  AlertTriangle,
  Flag,
  User,
  Plus,
  Send,
  Edit3,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Comment {
  id: string
  content: string
  author: { name: string; avatar: string }
  createdAt: Date
}

interface SubTask {
  id: string
  title: string
  isCompleted: boolean
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: { name: string; avatar: string }
  creator: { name: string; avatar: string }
  dueDate: Date
  createdAt: Date
  comments: Comment[]
  subtasks: SubTask[]
  attachments?: { name: string; size: string; url: string }[]
  tags?: string[]
}

interface TaskDetailsProps {
  task: Task
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onCommentAdd?: (taskId: string, content: string) => void
  onSubTaskAdd?: (taskId: string, title: string) => void
  onSubTaskToggle?: (taskId: string, subTaskId: string) => void
}

export function TaskDetails({ 
  task, 
  onTaskUpdate, 
  onCommentAdd, 
  onSubTaskAdd, 
  onSubTaskToggle 
}: TaskDetailsProps) {
  const [newComment, setNewComment] = useState("")
  const [newSubTask, setNewSubTask] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo": return "bg-gray-100 text-gray-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-green-100 text-green-800"
      case "blocked": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low": return "text-gray-500"
      case "medium": return "text-yellow-500"
      case "high": return "text-orange-500"
      case "urgent": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      onCommentAdd?.(task.id, newComment.trim())
      setNewComment("")
    }
  }

  const handleSubTaskSubmit = () => {
    if (newSubTask.trim()) {
      onSubTaskAdd?.(task.id, newSubTask.trim())
      setNewSubTask("")
    }
  }

  const handleTaskSave = () => {
    onTaskUpdate?.(task.id, editedTask)
    setIsEditing(false)
  }

  const completedSubTasks = task.subtasks.filter(st => st.isCompleted).length
  const totalSubTasks = task.subtasks.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                className="text-2xl font-bold"
              />
              <Textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                placeholder="Task description..."
                rows={3}
              />
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleTaskSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    Duplicate Task
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Move to Project
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-red-600">
                    Delete Task
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {isEditing ? (
                  <Select 
                    value={editedTask.status} 
                    onValueChange={(value) => setEditedTask({...editedTask, status: value as Task["status"]})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                )}
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                {isEditing ? (
                  <Select 
                    value={editedTask.priority} 
                    onValueChange={(value) => setEditedTask({...editedTask, priority: value as Task["priority"]})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1">
                    <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                    <span className={`text-sm capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assignee</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.assignee.name}</span>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Due Date</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.creator.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.creator.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{formatDate(task.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Subtasks
                <span className="text-sm font-normal text-muted-foreground">
                  {completedSubTasks} of {totalSubTasks} completed
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress Bar */}
              {totalSubTasks > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(completedSubTasks / totalSubTasks) * 100}%` 
                    }}
                  />
                </div>
              )}

              {/* Subtask List */}
              <div className="space-y-2">
                {task.subtasks.map((subTask) => (
                  <div key={subTask.id} className="flex items-center gap-3">
                    <button
                      onClick={() => onSubTaskToggle?.(task.id, subTask.id)}
                      className="flex-shrink-0"
                    >
                      {subTask.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${
                      subTask.isCompleted ? "line-through text-muted-foreground" : ""
                    }`}>
                      {subTask.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubTaskSubmit()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSubTaskSubmit}
                  size="sm"
                  disabled={!newSubTask.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback className="text-xs">
                        {comment.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      Download
                      <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                <MessageSquare className="w-4 h-4 mr-2" />
                Share Task
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
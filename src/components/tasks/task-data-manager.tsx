"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { TaskAttachments } from "./task-attachments"
import { TaskComments } from "./task-comments"
import { 
  Download, 
  Upload, 
  FileText, 
  MessageSquare,
  Users,
  Shield,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface TaskDataManagerProps {
  taskId: string
  task: {
    id: string
    title: string
    status: string
    assignee?: {
      id: string
      name: string
    }
    assignees?: Array<{
      user: {
        id: string
        name: string
      }
    }>
    creator: {
      id: string
      name: string
    }
    project: {
      id: string
      name: string
      ownerId: string
    }
  }
  onUpdate?: () => void
}

export function TaskDataManager({ taskId, task, onUpdate }: TaskDataManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState({
    canUpload: false,
    canDownload: false,
    canComment: false,
    canDelete: false
  })

  useEffect(() => {
    checkPermissions()
    fetchComments()
    fetchAttachments()
  }, [taskId, user])

  const checkPermissions = () => {
    if (!user) return

    const isTaskCreator = task.creator.id === user.id
    const isTaskAssignee = task.assignee?.id === user.id
    const isMultiAssignee = task.assignees?.some(a => a.user.id === user.id)
    const isProjectOwner = task.project.ownerId === user.id
    
    // Users involved in task completion can:
    // - Upload/download files
    // - Add comments
    // - Creator and project owner can delete
    const isInvolved = isTaskCreator || isTaskAssignee || isMultiAssignee || isProjectOwner

    setPermissions({
      canUpload: isInvolved,
      canDownload: isInvolved,
      canComment: isInvolved,
      canDelete: isTaskCreator || isProjectOwner
    })
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDataUpdate = () => {
    fetchComments()
    fetchAttachments()
    onUpdate?.()
  }

  const exportTaskData = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/export`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `task-${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-export.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Export successful",
          description: "Task data has been exported successfully."
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export task data.",
        variant: "destructive"
      })
    }
  }

  const getUserInvolvementStatus = () => {
    if (!user) return null

    const isCreator = task.creator.id === user.id
    const isAssignee = task.assignee?.id === user.id
    const isMultiAssignee = task.assignees?.some(a => a.user.id === user.id)
    const isProjectOwner = task.project.ownerId === user.id

    if (isCreator) return { role: "Creator", icon: <Users className="h-4 w-4" /> }
    if (isAssignee || isMultiAssignee) return { role: "Assignee", icon: <CheckCircle2 className="h-4 w-4" /> }
    if (isProjectOwner) return { role: "Project Owner", icon: <Shield className="h-4 w-4" /> }
    
    return { role: "Observer", icon: <AlertCircle className="h-4 w-4" /> }
  }

  const involvementStatus = getUserInvolvementStatus()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Access Status Card */}
      {involvementStatus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {involvementStatus.icon}
                <span className="font-medium">Your Role: {involvementStatus.role}</span>
                <Badge variant={permissions.canUpload ? "default" : "secondary"}>
                  {permissions.canUpload ? "Full Access" : "View Only"}
                </Badge>
              </div>
              {permissions.canDownload && (
                <Button variant="outline" size="sm" onClick={exportTaskData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Data Management Tabs */}
      <Tabs defaultValue="attachments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attachments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attachments" className="mt-6">
          <TaskAttachments
            taskId={taskId}
            attachments={attachments}
            onAttachmentUpdate={handleDataUpdate}
            canUpload={permissions.canUpload}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Task Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskComments
                taskId={taskId}
                comments={comments}
                onUpdate={handleDataUpdate}
                canComment={permissions.canComment}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Files:</span>
              <Badge variant="outline">{attachments.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comments:</span>
              <Badge variant="outline">{comments.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Size:</span>
              <Badge variant="outline">
                {attachments.reduce((sum, att) => sum + (att.fileSize || 0), 0) > 0
                  ? `${(attachments.reduce((sum, att) => sum + (att.fileSize || 0), 0) / 1024 / 1024).toFixed(2)} MB`
                  : '0 MB'
                }
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Your Access:</span>
              <Badge variant={permissions.canUpload ? "default" : "secondary"}>
                {permissions.canUpload ? "Read/Write" : "Read Only"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

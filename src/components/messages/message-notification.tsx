"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Bell } from "lucide-react"
import { TeamChatDialog } from "@/components/messages/team-chat-dialog"
import { useAuth } from "@/contexts/AuthContext"

interface MessageNotificationProps {
  workspaceId?: string
}

export function MessageNotification({ workspaceId }: MessageNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { currentWorkspace } = useAuth()
  
  const targetWorkspaceId = workspaceId || currentWorkspace?.id

  // Check for unread messages when component mounts and workspace changes
  useEffect(() => {
    if (targetWorkspaceId) {
      checkUnreadMessages()
      
      // Set up interval to check for new messages every 30 seconds
      const interval = setInterval(checkUnreadMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [targetWorkspaceId])

  const checkUnreadMessages = async () => {
    if (!targetWorkspaceId || isLoading) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages/unread?workspaceId=${targetWorkspaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.totalUnreadCount || 0)
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset unread count when dialog is opened
  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open)
    if (open) {
      // Reset count when dialog opens (user is now viewing messages)
      setTimeout(() => {
        setUnreadCount(0)
      }, 1000)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsDialogOpen(true)}
        title="Team Messages"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Messages</span>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <TeamChatDialog
        isOpen={isDialogOpen}
        onOpenChange={handleDialogOpen}
        workspaceId={targetWorkspaceId}
      />
    </>
  )
}

"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { 
  Bell, 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Calendar,
  ExternalLink,
  Check,
  CheckCheck,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { notificationSecurity } from "@/lib/notification-security"
import { InvitationNotifications, useInvitationCount } from "@/components/notifications/invitation-notifications"

interface Notification {
  id: string
  type: 'task' | 'project' | 'message' | 'team' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  relatedId?: string
  relatedUrl?: string
  senderName?: string
  senderAvatar?: string
}

interface NotificationsDropdownProps {
  className?: string
}

// Memoized notification item component for better performance
const NotificationItem = React.memo(({ 
  notification, 
  onMarkAsRead, 
  isLoading 
}: { 
  notification: Notification
  onMarkAsRead: (id: string) => void
  isLoading: boolean
}) => {
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'task':
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case 'project':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'team':
        return <Users className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.relatedUrl) {
      // Use router.push instead of window.location for better UX
      try {
        const url = new URL(notification.relatedUrl, window.location.origin)
        if (url.origin === window.location.origin) {
          // Internal URL - use router navigation
          window.location.href = notification.relatedUrl
        }
      } catch {
        // Invalid URL - ignore
        console.warn('Invalid notification URL:', notification.relatedUrl)
      }
    }
  }, [notification.id, notification.isRead, notification.relatedUrl, onMarkAsRead])

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.isRead && "bg-blue-50/50 border-l-2 border-l-blue-500",
        isLoading && "opacity-50 pointer-events-none"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={`${notification.title}. ${notification.isRead ? 'Read' : 'Unread'} notification.`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {notification.senderAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.senderAvatar} />
              <AvatarFallback className="text-xs">
                {notification.senderName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate">
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {format(notification.createdAt, 'MMM d, HH:mm')}
            </span>
            
            {notification.relatedUrl && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

NotificationItem.displayName = 'NotificationItem'

export const NotificationsDropdown = React.memo(({ className }: NotificationsDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { count: invitationCount, refetch: refetchInvitations } = useInvitationCount()

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
      refetchInvitations()
    }
  }, [isOpen, refetchInvitations])

  const loadNotifications = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=15')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.notifications)) {
        // Sanitize notification content for XSS protection
        const sanitizedNotifications = data.notifications.map((notif: any) => {
          try {
            return notificationSecurity.sanitizeNotification({
              ...notif,
              createdAt: new Date(notif.createdAt)
            })
          } catch (error) {
            console.warn('Failed to sanitize notification:', error)
            return null
          }
        }).filter(Boolean) // Remove any null entries from failed sanitization
        
        setNotifications(sanitizedNotifications)
      } else {
        throw new Error('Invalid notification data received')
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive"
      })
      setNotifications([]) // Reset to empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!notificationId || typeof notificationId !== 'string') {
      console.warn('Invalid notification ID provided')
      return
    }

    // Optimistic update
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify({ 
          action: 'mark-read',
          notificationId: notificationId 
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: false } : n
        )
      )
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }, [toast])

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    if (unreadNotifications.length === 0) return

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ action: 'mark-all-read' })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`)
      }
      
      toast({
        title: "Success",
        description: `Marked ${unreadNotifications.length} notifications as read`
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(n => {
          const wasUnread = unreadNotifications.some(unread => unread.id === n.id)
          return wasUnread ? { ...n, isRead: false } : n
        })
      )
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      })
    }
  }, [notifications, toast])

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  )

  const totalCount = unreadCount + invitationCount

  const handleInvitationUpdate = () => {
    refetchInvitations()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
              {totalCount > 99 ? '99+' : totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div>
              {/* Invitation Notifications */}
              <InvitationNotifications 
                onInvitationUpdate={handleInvitationUpdate}
                className="p-2"
              />
              
              {/* Regular Notifications */}
              {invitationCount > 0 && notifications.length > 0 && (
                <div className="px-4">
                  <Separator className="my-2" />
                </div>
              )}
              
              {notifications.length === 0 && invitationCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {(notifications.length > 0 || invitationCount > 0) && (
          <div className="p-3 border-t">
            <Link href="/notifications" className="block">
              <Button variant="ghost" className="w-full text-xs h-8">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

NotificationsDropdown.displayName = 'NotificationsDropdown'

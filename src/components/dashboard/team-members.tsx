"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
import { EditPositionDialog } from "@/components/workspace/edit-position-dialog"
import { 
  Users, 
  Circle, 
  Mail, 
  MessageSquare, 
  Video,
  MoreHorizontal,
  UserPlus,
  Crown,
  Shield,
  User,
  Edit,
  Building2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  isOnline: boolean
  lastSeen?: Date
  department?: string
  title?: string
  unreadCount?: number
}

interface TeamMembersProps {
  workspaceId?: string
  maxHeight?: string
  onStartChat?: (memberId: string) => void
}

export function TeamMembers({ workspaceId, maxHeight = "400px", onStartChat }: TeamMembersProps) {
  const { t } = useTranslation()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editPositionDialogOpen, setEditPositionDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const { currentWorkspaceId, user } = useAuth()
  
  const targetWorkspaceId = workspaceId || currentWorkspaceId

  // Check if current user can edit positions (is owner or admin)
  const currentUserMember = members.find(m => m.id === user?.id)
  const canEditPositions = currentUserMember?.role === 'OWNER' || currentUserMember?.role === 'ADMIN'

  useEffect(() => {
    if (targetWorkspaceId) {
      fetchTeamMembers()
      loadUnreadCounts()
      
      // Set up interval to refresh online status every 30 seconds
      const interval = setInterval(() => {
        fetchTeamMembers()
        loadUnreadCounts()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [targetWorkspaceId])

  const fetchTeamMembers = async () => {
    if (!targetWorkspaceId) return
    
    try {
      const response = await fetch(`/api/workspaces/${targetWorkspaceId}/members`)
      if (response.ok) {
        const data = await response.json()
        console.log('Raw team members data:', data) // Debug log
        
        // Filter out any null/undefined members and safely transform the data
        const transformedMembers: TeamMember[] = data
          .filter((member: any) => member && (member.user || member.id)) // Filter out null/undefined entries
          .map((member: any) => {
            // Handle both nested (member.user.*) and flat (member.*) structures
            const userId = member.user?.id || member.id || member.userId
            const userName = member.user?.name || member.name
            const userEmail = member.user?.email || member.email
            const userAvatar = member.user?.avatar || member.avatar
            
            if (!userId || !userName || !userEmail) {
              console.warn('Incomplete member data:', member)
              return null
            }
            
            return {
              id: userId,
              name: userName,
              email: userEmail,
              avatar: userAvatar,
              role: member.role,
              isOnline: Math.random() > 0.3, // Simulate online status - 70% chance online
              lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random last seen within 24h
              department: member.department, // Use actual database value
              title: member.title // Use actual database value
            }
          })
          .filter((member): member is TeamMember => member !== null) // Type-safe filter to remove nulls
        
        console.log('Transformed members:', transformedMembers) // Debug log
        
        // Sort by online status first, then by role
        transformedMembers.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          
          const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 }
          return roleOrder[a.role] - roleOrder[b.role]
        })
        
        setMembers(transformedMembers)
      } else {
        console.error('Failed to fetch team members:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCounts = async () => {
    if (!targetWorkspaceId || !user?.id) return
    
    try {
      const response = await fetch('/api/messages/internal?unreadOnly=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.conversations) {
          const counts: Record<string, number> = {}
          data.conversations.forEach((conv: any) => {
            // Find the other participant (not current user)
            const otherParticipant = conv.participants.find((p: any) => p.id !== user.id)
            if (otherParticipant && conv.unreadCount > 0) {
              counts[otherParticipant.id] = conv.unreadCount
            }
          })
          setUnreadCounts(counts)
        }
      }
    } catch (error) {
      console.error('Error loading unread counts:', error)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return t("dashboard.owner")
      case 'ADMIN':
        return 'ADMIN' // Keep ADMIN in English or add translation if needed
      case 'MEMBER':
        return 'MEMBER' // Keep MEMBER in English or add translation if needed
      default:
        return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-3 w-3 text-amber-500" />
      case 'ADMIN':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const onlineCount = members.filter(m => m.isOnline).length
  const totalCount = members.length

  const handleInviteSuccess = () => {
    fetchTeamMembers()
  }

  const handleEditPosition = (member: TeamMember) => {
    setSelectedMember(member)
    setEditPositionDialogOpen(true)
  }

  const handlePositionEditSuccess = () => {
    fetchTeamMembers()
    setEditPositionDialogOpen(false)
    setSelectedMember(null)
  }

  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              {t("dashboard.teamMembers")}
            </CardTitle>
            <CardDescription>
              {onlineCount} {t("dashboard.membersOnline", { count: totalCount })}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t("dashboard.invite")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-full" style={{ maxHeight }}>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" style={{ width: '60%' }} />
                    <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: '40%' }} />
                  </div>
                </div>
              ))
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noTeamMembersFound")}</p>
              </div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-sm">
                        {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : member.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <Circle 
                        className={`h-3 w-3 ${member.isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">
                        {member.name || member.email || 'Unknown User'}
                        {member.id === user?.id && (
                          <span className="text-xs text-muted-foreground ml-1">(You)</span>
                        )}
                      </p>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0 ${getRoleBadgeColor(member.role)}`}
                      >
                        {getRoleLabel(member.role)}
                      </Badge>
                      {unreadCounts[member.id] && unreadCounts[member.id] > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCounts[member.id]} new
                        </Badge>
                      )}
                      {member.isOnline ? (
                        <span className="text-xs text-green-600 font-medium">{t("common.online")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {member.lastSeen && formatLastSeen(member.lastSeen)}
                        </span>
                      )}
                    </div>
                    {(member.title || member.department) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {member.title && member.department 
                            ? `${member.title} • ${member.department}`
                            : member.title || member.department
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${unreadCounts[member.id] ? 'text-red-600 hover:text-red-700' : ''}`}
                        onClick={() => onStartChat?.(member.id)}
                        title={unreadCounts[member.id] ? `${unreadCounts[member.id]} unread messages` : "Start chat"}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {unreadCounts[member.id] && unreadCounts[member.id] > 0 && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                          {unreadCounts[member.id] > 9 ? '9+' : unreadCounts[member.id]}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onStartChat?.(member.id)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Start Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Video className="h-4 w-4 mr-2" />
                          Start Video Call
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {canEditPositions && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditPosition(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Position
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>
                          View Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
    
    <InviteMemberDialog
      open={inviteDialogOpen}
      onOpenChange={setInviteDialogOpen}
      onInviteSuccess={handleInviteSuccess}
      workspaceId={workspaceId || currentWorkspaceId || undefined}
    />
    
    {selectedMember && (
      <EditPositionDialog
        open={editPositionDialogOpen}
        onOpenChange={setEditPositionDialogOpen}
        member={selectedMember}
        workspaceId={targetWorkspaceId || ''}
        onSuccess={handlePositionEditSuccess}
      />
    )}
    </>
  )
}

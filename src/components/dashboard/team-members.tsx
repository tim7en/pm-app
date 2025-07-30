"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog"
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
  User
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"

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
}

interface TeamMembersProps {
  workspaceId?: string
  maxHeight?: string
}

export function TeamMembers({ workspaceId, maxHeight = "400px" }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const { currentWorkspaceId, user } = useAuth()
  
  const targetWorkspaceId = workspaceId || currentWorkspaceId

  useEffect(() => {
    if (targetWorkspaceId) {
      fetchTeamMembers()
      
      // Set up interval to refresh online status every 30 seconds
      const interval = setInterval(fetchTeamMembers, 30000)
      return () => clearInterval(interval)
    }
  }, [targetWorkspaceId])

  const fetchTeamMembers = async () => {
    if (!targetWorkspaceId) return
    
    try {
      const response = await fetch(`/api/workspaces/${targetWorkspaceId}/members`)
      if (response.ok) {
        const data = await response.json()
        
        // Transform the data and simulate online status
        const transformedMembers: TeamMember[] = data.map((member: any) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.role,
          isOnline: Math.random() > 0.3, // Simulate online status - 70% chance online
          lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random last seen within 24h
          department: ['Engineering', 'Design', 'Product', 'Marketing', 'Sales'][Math.floor(Math.random() * 5)],
          title: ['Developer', 'Designer', 'Product Manager', 'Marketing Specialist', 'Sales Rep'][Math.floor(Math.random() * 5)]
        }))
        
        // Sort by online status first, then by role
        transformedMembers.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          
          const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 }
          return roleOrder[a.role] - roleOrder[b.role]
        })
        
        setMembers(transformedMembers)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setIsLoading(false)
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

  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {onlineCount} of {totalCount} members online
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
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
                <p className="text-sm text-muted-foreground">No team members found</p>
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
                        {member.role}
                      </Badge>
                      {member.isOnline ? (
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {member.lastSeen && formatLastSeen(member.lastSeen)}
                        </span>
                      )}
                    </div>
                    {member.title && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {member.title} • {member.department}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
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
                        <DropdownMenuItem>
                          <Video className="h-4 w-4 mr-2" />
                          Start Video Call
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
    </>
  )
}

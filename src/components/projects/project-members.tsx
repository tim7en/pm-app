"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Crown, Shield, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProjectRole } from '@/lib/prisma-mock'

interface ProjectMember {
  id: string
  userId: string
  role: ProjectRole
  joinedAt: Date
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface ProjectMembersProps {
  projectId: string
  projectOwnerId: string
  currentUserId: string
  userRole: ProjectRole | null
}

const roleIcons = {
  ADMIN: Crown,
  MEMBER: User,
  VIEWER: Shield,
}

const roleColors = {
  ADMIN: "bg-purple-100 text-purple-800",
  MEMBER: "bg-blue-100 text-blue-800",
  VIEWER: "bg-gray-100 text-gray-800",
}

export function ProjectMembers({ 
  projectId, 
  projectOwnerId, 
  currentUserId, 
  userRole 
}: ProjectMembersProps) {
  const { toast } = useToast()
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<ProjectRole>(ProjectRole.MEMBER)

  const canManageMembers = currentUserId === projectOwnerId || userRole === "ADMIN"

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole
        })
      })

      if (response.ok) {
        toast({
          title: "Member invited",
          description: "The member has been successfully added to the project",
        })
        setInviteDialogOpen(false)
        setInviteEmail("")
        setInviteRole(ProjectRole.MEMBER)
        fetchMembers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to invite member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: ProjectRole) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        toast({
          title: "Role updated",
          description: "The member's role has been updated successfully",
        })
        fetchMembers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Member removed",
          description: `${memberName} has been removed from the project`,
        })
        fetchMembers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading members...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Members ({members.length})</CardTitle>
          {canManageMembers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to this project and assign their role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as ProjectRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember}>
                    Send Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const isOwner = member.userId === projectOwnerId
            
            return (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.avatar} />
                    <AvatarFallback>
                      {member.user.name ? member.user.name.split(' ').map(n => n[0]).join('') : member.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.user.name || member.user.email || 'Unknown User'}</span>
                      {isOwner && (
                        <div title="Project Owner">
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{member.user.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={roleColors[member.role]}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {member.role}
                  </Badge>
                  
                  {canManageMembers && !isOwner && member.userId !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, ProjectRole.ADMIN)}>
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, ProjectRole.MEMBER)}>
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, ProjectRole.VIEWER)}>
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id, member.user.name)}
                          className="text-red-600"
                        >
                          Remove from Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
          
          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No team members yet.</p>
              {canManageMembers && (
                <p className="text-sm">Invite members to start collaborating!</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

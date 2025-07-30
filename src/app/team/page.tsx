"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { generateInitialsAvatar, getDefaultAvatarByIndex } from "@/lib/avatars"
import { 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  Settings,
  Search,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Video,
  Filter,
  Shield,
  Trash2,
  Edit
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

const inviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface WorkspaceMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: "OWNER" | "ADMIN" | "MEMBER"
  joinedAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [showInvitations, setShowInvitations] = useState(false)
  
  const { toast } = useToast()
  const { user, currentWorkspace, refreshWorkspaces } = useAuth()
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  })

  useEffect(() => {
    if (currentWorkspace) {
      fetchWorkspaceMembers()
      fetchInvitations()
    }
  }, [currentWorkspace])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchWorkspaceMembers = async () => {
    if (!currentWorkspace) {
      console.error('No current workspace')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
        
        // Find current user's role in this workspace
        const currentMember = data.find((member: WorkspaceMember) => member.user.id === user?.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
        }
      } else {
        console.error('Failed to fetch workspace members')
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error)
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (data: InviteFormData) => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      })
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          role: data.role,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInviteDialogOpen(false)
        form.reset()
        toast({
          title: "Success",
          description: result.message || `Successfully invited ${data.email} to the team`,
        })
        // Refresh invitations list to show new pending invitations
        fetchInvitations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to invite user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      toast({
        title: "Error",
        description: "Failed to invite user",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!currentWorkspace) {
      toast({
        title: "Error",  
        description: "No workspace selected",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        const updatedMember = await response.json()
        setMembers(prev => prev.map(member => 
          member.id === memberId ? updatedMember : member
        ))
        toast({
          title: "Success",
          description: "Member role updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update member role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.id !== memberId))
        toast({
          title: "Success",
          description: "Member removed from team successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleLeaveWorkspace = async () => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to leave this workspace? All your activity history will be removed.")) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/leave`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "You have left the workspace successfully",
        })
        // Redirect to another workspace or dashboard
        window.location.href = '/'
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to leave workspace",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error leaving workspace:', error)
      toast({
        title: "Error",
        description: "Failed to leave workspace",
        variant: "destructive",
      })
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Invitation accepted successfully:', result)
        
        toast({
          title: "Success",
          description: "Invitation accepted! Welcome to the team!",
        })
        
        // Refresh all data in parallel
        const refreshPromises = [
          fetchInvitations(),
          fetchWorkspaceMembers(),
          refreshWorkspaces()
        ]
        
        await Promise.all(refreshPromises)
        console.log('All data refreshed after accepting invitation')
        
        // If the invitation response includes workspace info, we could auto-switch to it
        if (result.workspace) {
          console.log('New workspace available:', result.workspace.name)
        }
      } else {
        const error = await response.json()
        console.error('Failed to accept invitation:', error)
        toast({
          title: "Error",
          description: error.error || "Failed to accept invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      })
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation declined",
        })
        fetchInvitations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to decline invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      })
    }
  }

  const filteredMembers = members.filter(member => {
    // Ensure member and member.user exist before accessing properties
    if (!member || !member.user) {
      return false
    }
    
    const userName = member.user.name || ''
    const userEmail = member.user.email || ''
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || member.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800"
      case "ADMIN":
        return "bg-blue-100 text-blue-800"
      case "MEMBER":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Loading team members...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Team</h1>
                <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
              </div>
              <div className="flex gap-2">
                {invitations.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInvitations(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Invitations ({invitations.length})
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={handleLeaveWorkspace}
                  className="text-red-600 hover:bg-red-50"
                >
                  Leave Workspace
                </Button>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{members.length}</p>
                      <p className="text-xs text-muted-foreground">Total Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {members.filter(m => m.role === 'MEMBER').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">∞</p>
                      <p className="text-xs text-muted-foreground">Invite Capacity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={member.user.avatar || getDefaultAvatarByIndex(member.user.id.charCodeAt(0)).url} 
                            alt={member.user.name || member.user.email} 
                          />
                          <AvatarFallback className={
                            member.user.avatar 
                              ? '' 
                              : generateInitialsAvatar(member.user.name || member.user.email).backgroundColor
                          }>
                            {generateInitialsAvatar(member.user.name || member.user.email).initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{member.user.name || member.user.email}</CardTitle>
                          <CardDescription>{member.user.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        {user?.id !== member.user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Video className="mr-2 h-4 w-4" />
                                Start Call
                              </DropdownMenuItem>
                              {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && member.role !== 'OWNER' && (
                                <>
                                  <DropdownMenuItem onClick={() => {
                                    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                                    handleUpdateRole(member.id, newRole)
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {member.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Joined: {formatJoinedDate(member.joinedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No team members found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterRole !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Get started by inviting your first team member"
                    }
                  </p>
                  {(!searchQuery && filterRole === "all") && (
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Team Member
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite an existing user to join your team by email. They must already have an account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter user's email (e.g., zusabi@gmail.com)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MEMBER">
                          <div className="flex flex-col">
                            <span>Member</span>
                            <span className="text-xs text-muted-foreground">Can view and edit assigned tasks</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex flex-col">
                            <span>Admin</span>
                            <span className="text-xs text-muted-foreground">Can manage projects and team members</span>
                          </div>
                        </SelectItem>
                        {currentUserRole === 'OWNER' && (
                          <SelectItem value="OWNER">
                            <div className="flex flex-col">
                              <span>Owner</span>
                              <span className="text-xs text-muted-foreground">Full access to workspace</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? "Inviting..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Invitations Dialog */}
      <Dialog open={showInvitations} onOpenChange={setShowInvitations}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Invitations</DialogTitle>
            <DialogDescription>
              Review and respond to your workspace invitations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending invitations
              </p>
            ) : (
              invitations.map((invitation: any) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{invitation.workspace.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.inviter.name} ({invitation.inviter.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Role: <Badge variant="outline">{invitation.role}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

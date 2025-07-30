"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  UserPlus,
  Users,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
  Building2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ADMIN"], {
    required_error: "Please select a role",
  }),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface WorkspaceMember {
  id: string
  userId: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

interface PendingInvite {
  id: string
  email: string
  role: "ADMIN" | "MEMBER"
  invitedAt: string
  invitedBy: {
    name: string | null
    email: string
  }
}

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  
  const { toast } = useToast()
  const { currentWorkspace } = useAuth()
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  })

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers()
      fetchPendingInvites()
    }
  }, [currentWorkspace])

  const fetchMembers = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchPendingInvites = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invites`)
      if (response.ok) {
        const data = await response.json()
        setPendingInvites(data)
      }
    } catch (error) {
      console.error('Error fetching pending invites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (data: InviteFormData) => {
    if (!currentWorkspace) return

    setInviting(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation sent successfully",
        })
        form.reset()
        fetchPendingInvites()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!currentWorkspace) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member role updated successfully",
        })
        fetchMembers()
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
    if (!currentWorkspace) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member removed successfully",
        })
        fetchMembers()
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

  const handleCancelInvite = async (inviteId: string) => {
    if (!currentWorkspace) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invites/${inviteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation cancelled successfully",
        })
        fetchPendingInvites()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to cancel invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />
      case 'MEMBER':
        return <Shield className="h-4 w-4 text-gray-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      case 'MEMBER':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const canManageMembers = currentWorkspace?.role === 'OWNER' || currentWorkspace?.role === 'ADMIN'

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
                <p className="text-muted-foreground">Please select a workspace to manage members.</p>
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Workspace Members</h1>
                  <p className="text-muted-foreground">Manage members and their permissions</p>
                </div>
              </div>
              
              {canManageMembers && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>

            {/* Invite Member */}
            {canManageMembers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite New Member
                  </CardTitle>
                  <CardDescription>
                    Send an invitation to add a new member to your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleInviteMember)} className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter email address" 
                                type="email"
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
                          <FormItem className="w-32">
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={inviting}>
                        <Mail className="w-4 h-4 mr-2" />
                        {inviting ? "Sending..." : "Send Invite"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Current Members */}
            <Card>
              <CardHeader>
                <CardTitle>Current Members</CardTitle>
                <CardDescription>
                  Members who have access to this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading members...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {canManageMembers && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.avatar || undefined} />
                                <AvatarFallback>
                                  {member.user.name?.charAt(0) || member.user.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.user.name || "Unnamed User"}</p>
                                <p className="text-sm text-muted-foreground">{member.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </TableCell>
                          {canManageMembers && (
                            <TableCell>
                              {member.role !== 'OWNER' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {member.role === 'MEMBER' && (
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateMemberRole(member.id, 'ADMIN')}
                                      >
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Make Admin
                                      </DropdownMenuItem>
                                    )}
                                    {member.role === 'ADMIN' && (
                                      <DropdownMenuItem
                                        onClick={() => handleUpdateMemberRole(member.id, 'MEMBER')}
                                      >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Make Member
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveMember(member.id)}
                                      className="text-destructive"
                                    >
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Remove Member
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {canManageMembers && pendingInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Invitations that have been sent but not yet accepted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Invited By</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {invite.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(invite.role)}>
                              {invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invite.invitedBy.name || invite.invitedBy.email}
                          </TableCell>
                          <TableCell>
                            {new Date(invite.invitedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel the invitation for {invite.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelInvite(invite.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Yes, cancel invitation
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

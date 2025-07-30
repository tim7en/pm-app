"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Building2,
  Plus,
  Users,
  FolderOpen,
  Settings,
  MoreHorizontal,
  Crown,
  ShieldCheck,
  Shield,
  Calendar,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
})

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>

interface ExtendedWorkspace {
  id: string
  name: string
  description?: string
  role: string
  memberCount: number
  projectCount: number
  taskCount: number
  createdAt: string
  recentActivity?: {
    projectsCreated: number
    tasksCompleted: number
    membersJoined: number
  }
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<ExtendedWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const { refreshWorkspaces, setCurrentWorkspace } = useAuth()
  const router = useRouter()
  
  const form = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        
        // Fetch additional stats for each workspace
        const workspacesWithStats = await Promise.all(
          data.map(async (workspace: any) => {
            try {
              const [membersRes, projectsRes, tasksRes] = await Promise.all([
                fetch(`/api/workspaces/${workspace.id}/members`),
                fetch(`/api/projects?workspaceId=${workspace.id}`),
                fetch(`/api/tasks?workspaceId=${workspace.id}`)
              ])

              const [members, projects, tasks] = await Promise.all([
                membersRes.ok ? membersRes.json() : [],
                projectsRes.ok ? projectsRes.json() : [],
                tasksRes.ok ? tasksRes.json() : []
              ])

              return {
                ...workspace,
                memberCount: members.length,
                projectCount: projects.length,
                taskCount: tasks.length,
                recentActivity: {
                  projectsCreated: projects.filter((p: any) => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(p.createdAt) > weekAgo
                  }).length,
                  tasksCompleted: tasks.filter((t: any) => t.status === 'COMPLETED').length,
                  membersJoined: members.filter((m: any) => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(m.joinedAt) > weekAgo
                  }).length
                }
              }
            } catch (error) {
              console.error('Error fetching stats for workspace:', workspace.id, error)
              return {
                ...workspace,
                memberCount: 0,
                projectCount: 0,
                taskCount: 0,
                recentActivity: {
                  projectsCreated: 0,
                  tasksCompleted: 0,
                  membersJoined: 0
                }
              }
            }
          })
        )
        
        setWorkspaces(workspacesWithStats)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (data: CreateWorkspaceFormData) => {
    setCreating(true)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const newWorkspace = await response.json()
        toast({
          title: "Success",
          description: "Workspace created successfully",
        })
        form.reset()
        setCreateDialogOpen(false)
        await refreshWorkspaces()
        fetchWorkspaces()
        
        // Switch to the new workspace
        setCurrentWorkspace(newWorkspace.id)
        router.push('/dashboard')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create workspace",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleSwitchWorkspace = (workspaceId: string) => {
    setCurrentWorkspace(workspaceId)
    router.push('/dashboard')
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Workspaces</h1>
                  <p className="text-muted-foreground">Manage and switch between your workspaces</p>
                </div>
              </div>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                      Create a new workspace to organize your projects and team.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateWorkspace)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Workspace Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter workspace name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the purpose of this workspace..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit" disabled={creating}>
                          {creating ? "Creating..." : "Create Workspace"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Workspaces Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((workspace) => (
                  <Card key={workspace.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg truncate">{workspace.name}</CardTitle>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSwitchWorkspace(workspace.id)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Switch to Workspace
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/workspace/settings')}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/workspace/members')}>
                              <Users className="h-4 w-4 mr-2" />
                              Members
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(workspace.role)} className="flex items-center gap-1">
                          {getRoleIcon(workspace.role)}
                          {workspace.role}
                        </Badge>
                      </div>
                      
                      {workspace.description && (
                        <CardDescription className="line-clamp-2">
                          {workspace.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent onClick={() => handleSwitchWorkspace(workspace.id)}>
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{workspace.memberCount}</p>
                          <p className="text-xs text-muted-foreground">Members</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{workspace.projectCount}</p>
                          <p className="text-xs text-muted-foreground">Projects</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{workspace.taskCount}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      {workspace.recentActivity && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-muted-foreground">Recent activity:</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <p className="font-medium text-green-600">+{workspace.recentActivity.projectsCreated}</p>
                              <p className="text-muted-foreground">Projects</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-blue-600">{workspace.recentActivity.tasksCompleted}</p>
                              <p className="text-muted-foreground">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-purple-600">+{workspace.recentActivity.membersJoined}</p>
                              <p className="text-muted-foreground">Members</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="flex items-center gap-2 mt-4 pt-2 border-t text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(workspace.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && workspaces.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Workspaces Found</h2>
                <p className="text-muted-foreground mb-4">Create your first workspace to get started.</p>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Workspace
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

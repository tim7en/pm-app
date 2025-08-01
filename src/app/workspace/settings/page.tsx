"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings,
  Save,
  Trash2,
  Building2,
  AlertTriangle,
  Users,
  FolderOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
})

type WorkspaceFormData = z.infer<typeof workspaceSchema>

interface WorkspaceStats {
  memberCount: number
  projectCount: number
  taskCount: number
  createdAt: string
  updatedAt: string
}

export default function WorkspaceSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  
  const { toast } = useToast()
  const { currentWorkspace, refreshWorkspaces } = useAuth()
  const router = useRouter()
  
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    if (currentWorkspace) {
      form.setValue("name", currentWorkspace.name)
      form.setValue("description", currentWorkspace.description || "")
      fetchWorkspaceStats()
    } else {
      setLoading(false)
    }
  }, [currentWorkspace, form])

  const fetchWorkspaceStats = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      
      // Fetch members, projects, and tasks counts
      const [membersResponse, projectsResponse, tasksResponse] = await Promise.all([
        fetch(`/api/workspaces/${currentWorkspace.id}/members`),
        fetch(`/api/projects?workspaceId=${currentWorkspace.id}&includeCounts=true`),
        fetch(`/api/tasks?workspaceId=${currentWorkspace.id}`)
      ])

      const [members, projects, tasks] = await Promise.all([
        membersResponse.ok ? membersResponse.json() : [],
        projectsResponse.ok ? projectsResponse.json() : [],
        tasksResponse.ok ? tasksResponse.json() : []
      ])

      setStats({
        memberCount: members.length,
        projectCount: projects.length,
        taskCount: tasks.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching workspace stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWorkspace = async (data: WorkspaceFormData) => {
    if (!currentWorkspace) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await refreshWorkspaces()
        toast({
          title: "Success",
          description: "Workspace updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update workspace",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating workspace:', error)
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Workspace deleted successfully",
        })
        
        // Refresh workspaces to remove the deleted workspace from the list
        try {
          await refreshWorkspaces()
        } catch (error) {
          console.error('Failed to refresh workspaces after deletion:', error)
        }
        
        router.push("/workspaces")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete workspace",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
      toast({
        title: "Error",
        description: "Failed to delete workspace",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
                <p className="text-muted-foreground">Please select a workspace to view settings.</p>
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
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Workspace Settings</h1>
                <p className="text-muted-foreground">Manage your workspace configuration and settings</p>
              </div>
            </div>

            {/* Workspace Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Workspace Information
                </CardTitle>
                <CardDescription>
                  Update your workspace name and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateWorkspace)} className="space-y-4">
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

                    <Button type="submit" disabled={updating}>
                      <Save className="w-4 h-4 mr-2" />
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Workspace Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Statistics</CardTitle>
                  <CardDescription>
                    Overview of your workspace activity and usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.memberCount}</p>
                        <p className="text-sm text-muted-foreground">Members</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <FolderOpen className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.projectCount}</p>
                        <p className="text-sm text-muted-foreground">Projects</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Settings className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{stats.taskCount}</p>
                        <p className="text-sm text-muted-foreground">Tasks</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p>{new Date(stats.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Updated</Label>
                      <p>{new Date(stats.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {currentWorkspace.role === 'OWNER' && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Permanent actions that cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                      <div>
                        <h4 className="font-medium">Delete Workspace</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this workspace and all its data. This cannot be undone.
                        </p>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Workspace
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the
                              workspace "{currentWorkspace.name}" and remove all associated projects,
                              tasks, and member data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteWorkspace}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleting}
                            >
                              {deleting ? "Deleting..." : "Delete Workspace"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

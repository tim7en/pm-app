"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAPI } from "@/hooks/use-api"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen,
  Users,
  Calendar,
  Star,
  TrendingUp,
  Target
} from "lucide-react"
import { ProjectStatus } from "@prisma/client"

interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: ProjectStatus
  taskCount: number
  completedTaskCount: number
  memberCount: number
  owner: {
    id: string
    name: string
    avatar?: string
  }
  isStarred: boolean
  recentActivity?: Array<{
    id: string
    type: string
    message: string
    createdAt: Date
  }>
}

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { apiCall } = useAPI()
  const { isAuthenticated, isLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    owner: "all"
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth')
      return
    }
    
    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isAuthenticated, isLoading, router])

  const fetchProjects = async () => {
    try {
      const response = await apiCall('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (projectData: any) => {
    try {
      const response = await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...projectData,
          workspaceId: 'default-workspace-id',
          ownerId: 'default-user-id'
        })
      })
      
      if (response.ok) {
        await fetchProjects()
        setProjectDialogOpen(false)
        setEditingProject(null)
        toast({
          title: "Project created",
          description: "Project has been created successfully.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the project",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProject = async (projectData: any) => {
    try {
      const response = await apiCall(`/api/projects/${editingProject?.id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData)
      })
      
      if (response.ok) {
        await fetchProjects()
        setEditingProject(null)
        setProjectDialogOpen(false)
        toast({
          title: "Project updated",
          description: "Project has been updated successfully.",
        })
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all tasks within this project.')) return
    
    try {
      const response = await apiCall(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Project deleted",
          description: "The project and all its tasks have been deleted successfully.",
        })
        await fetchProjects()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the project",
        variant: "destructive",
      })
    }
  }

  const handleViewTasks = (projectId: string) => {
    router.push(`/tasks?project=${projectId}`)
  }

  const handleToggleStar = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isStarred: !project.isStarred })
        })
        
        if (response.ok) {
          await fetchProjects()
        }
      }
    } catch (error) {
      console.error('Error toggling project star:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    return (
      (!filters.search || project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
       (project.description && project.description.toLowerCase().includes(filters.search.toLowerCase()))) &&
      (filters.status === "all" || project.status === filters.status) &&
      (filters.owner === "all" || project.owner.id === filters.owner)
    )
  })

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    archived: projects.filter(p => p.status === ProjectStatus.ARCHIVED).length,
    starred: projects.filter(p => p.isStarred).length,
  }

  const starredProjects = projects.filter(p => p.isStarred)
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE)

  // Show loading spinner while authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onProjectCreated={fetchProjects} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Projects</h1>
                <p className="text-muted-foreground mt-1">Manage and track all your projects</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm" onClick={() => setProjectDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{projectStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{projectStats.active}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{projectStats.completed}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-2xl font-bold">{projectStats.archived}</p>
                      <p className="text-xs text-muted-foreground">Archived</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{projectStats.starred}</p>
                      <p className="text-xs text-muted-foreground">Starred</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={ProjectStatus.ARCHIVED}>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.owner} onValueChange={(value) => setFilters(prev => ({ ...prev, owner: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                      {Array.from(
                        new Map(projects.map(p => [p.owner.id, p.owner])).values()
                      ).map(owner => (
                        <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Starred Projects */}
            {starredProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold">Starred Projects</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {starredProjects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project}
                      onEdit={(project) => {
                        setEditingProject(project)
                        setProjectDialogOpen(true)
                      }}
                      onDelete={handleDeleteProject}
                      onToggleStar={handleToggleStar}
                      onViewTasks={handleViewTasks}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Projects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold">Active Projects</h2>
                  <Badge variant="secondary">{activeProjects.length}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    onEdit={(project) => {
                      setEditingProject(project)
                      setProjectDialogOpen(true)
                    }}
                    onDelete={handleDeleteProject}
                    onToggleStar={handleToggleStar}
                    onViewTasks={handleViewTasks}
                  />
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.status !== "all" || filters.owner !== "all" 
                      ? "Try adjusting your filters to see more projects."
                      : "Get started by creating your first project."
                    }
                  </p>
                  <Button onClick={() => setProjectDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open)
          if (!open) setEditingProject(null)
        }}
        project={editingProject || undefined}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
      />
    </div>
  )
}
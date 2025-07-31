"use client"

import { useState } from "react"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, SortAsc, Grid, List } from "lucide-react"
import { ProjectStatus } from "@prisma/client"
import { useTranslation } from "@/hooks/use-translation"

interface ProjectMember {
  id: string
  name: string
  avatar: string
  role: string
}

interface Project {
  id: string
  name: string
  description: string
  color: string
  status: ProjectStatus
  progress: number
  taskCount: number
  memberCount: number
  members: ProjectMember[]
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
}

interface ProjectListProps {
  projects: Project[]
  onProjectCreate?: () => void
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void
  currentUserId?: string
}

export function ProjectList({ projects, onProjectCreate, onProjectUpdate, currentUserId }: ProjectListProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("updatedAt")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "createdAt":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "updatedAt":
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case "progress":
          return b.progress - a.progress
        default:
          return 0
      }
    })

  const projectCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    archived: projects.filter(p => p.status === ProjectStatus.ARCHIVED).length,
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return "bg-green-100 text-green-800"
      case ProjectStatus.ARCHIVED: return "bg-gray-100 text-gray-800"
      case ProjectStatus.COMPLETED: return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage and organize your projects</p>
        </div>
        <Button onClick={onProjectCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{projectCounts.all}</div>
          <div className="text-sm text-muted-foreground">Total Projects</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{projectCounts.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{projectCounts.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{projectCounts.archived}</div>
          <div className="text-sm text-muted-foreground">Archived</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("projects.searchProjects")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={ProjectStatus.ARCHIVED}>Archived</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="updatedAt">Updated Date</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(projectCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="capitalize">{status}</span>
            <Badge variant="secondary" className={
              statusFilter === status ? "bg-primary-foreground/20" : ""
            }>
              {count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No projects found. Try adjusting your filters or create a new project.
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

// Project List Item Component
function ProjectListItem({ project }: { project: Project }) {
  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return "bg-green-100 text-green-800"
      case ProjectStatus.ARCHIVED: return "bg-gray-100 text-gray-800"
      case ProjectStatus.COMPLETED: return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color }}
          >
            <span className="text-white font-semibold text-lg">
              {project.name.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
            
            <p className="text-muted-foreground mb-3">{project.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">{project.progress}%</span>
                <span>Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{project.taskCount}</span>
                <span>Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{project.memberCount}</span>
                <span>Members</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => (
              <div key={member.id} className="h-8 w-8 rounded-full border-2 border-background">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            ))}
            {project.memberCount > 3 && (
              <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{project.memberCount - 3}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
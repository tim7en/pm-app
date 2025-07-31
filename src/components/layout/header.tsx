"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { DownloadMenu } from "@/components/layout/download-menu"
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { 
  Search, 
  Bell, 
  Plus, 
  Calendar, 
  Users, 
  MessageSquare,
  Settings,
  LogOut
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  tasks?: any[]
  projects?: any[]
  users?: any[]
  onImportData?: (data: any) => Promise<void>
  onProjectCreated?: () => void
}

export function Header({ tasks, projects, users, onImportData, onProjectCreated }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, logout, getAuthHeaders } = useAuth()
  const { toast } = useToast()

  const handleCreateProject = async (projectData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(projectData)
      })
      
      if (response.ok) {
        const newProject = await response.json()
        setProjectDialogOpen(false)
        toast({
          title: "Project created",
          description: `Project "${newProject.name}" has been created successfully.`,
        })
        // Call the callback to refresh data
        if (onProjectCreated) {
          onProjectCreated()
        }
      } else {
        const data = await response.json()
        console.error('Error creating project:', data.error)
        toast({
          title: "Failed to create project",
          description: data.error || "An error occurred while creating the project.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Failed to create project",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredTasks = (tasks || []).filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProjects = (projects || []).filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = (users || []).filter(user => 
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PM</span>
          </div>
          <span className="font-semibold text-lg">Project Manager</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, tasks, or people..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setProjectDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </Link>
          </Button>

          <Button variant="ghost" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </Button>

          {/* Import/Export */}
          <DownloadMenu 
            tasks={tasks} 
            projects={projects} 
            users={users}
            onImportData={onImportData}
          />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
                  <AvatarFallback>
                    {getUserInitials(user?.name || null)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Feedback</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmitting}
      />
    </header>
  )
}
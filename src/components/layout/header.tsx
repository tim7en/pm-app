"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { EnhancedProjectCreation } from "@/components/projects/enhanced-project-creation"
import { DownloadMenu } from "@/components/layout/download-menu"
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"
import { MessageNotification } from "@/components/messages/message-notification"
import { BugReportDialog } from "@/components/bug-report/bug-report-dialog"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { 
  Search, 
  Bell, 
  Plus, 
  Calendar, 
  Users, 
  MessageSquare,
  Settings,
  LogOut,
  Bug
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
  const { t } = useTranslation()

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
          title: t("header.projectCreated"),
          description: t("header.projectCreatedSuccess", { name: newProject.name }),
        })
        // Call the callback to refresh data
        if (onProjectCreated) {
          onProjectCreated()
        }
      } else {
        const data = await response.json()
        console.error('Error creating project:', data.error)
        toast({
          title: t("header.projectCreationFailed"),
          description: data.error || t("header.projectCreationError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: t("header.projectCreationFailed"),
        description: t("header.unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnhancedCreateProject = async (projectData: any, tasks?: any[], calendarEvents?: any[]): Promise<any> => {
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
          title: t("header.projectCreated"),
          description: t("header.projectCreatedSuccess", { name: newProject.name }),
        })
        // Call the callback to refresh data
        if (onProjectCreated) {
          onProjectCreated()
        }
        
        // Return the created project for further processing
        return newProject
      } else {
        const data = await response.json()
        console.error('Error creating project:', data.error)
        toast({
          title: t("header.projectCreationFailed"),
          description: data.error || t("header.projectCreationError"),
          variant: "destructive",
        })
        return null
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: t("header.projectCreationFailed"),
        description: t("header.unexpectedError"),
        variant: "destructive",
      })
      return null
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
        title: t("header.logoutFailed"),
        description: t("header.logoutError"),
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
    <header className="border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 shadow-sm">
      <div className="flex h-16 items-center px-6 gap-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
            <span className="text-primary-foreground font-bold text-base">PM</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t("header.projectManager")}
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("header.searchPlaceholder")}
              className="pl-12 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2 hover-lift shadow-md">
                <Plus className="h-4 w-4" />
                {t("header.create")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-0 shadow-premium">
              <DropdownMenuItem 
                onClick={() => setProjectDialogOpen(true)}
                className="gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{t("header.newProject")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-3 p-3 rounded-lg opacity-60">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-muted/20 to-muted/10">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">{t("header.newTask")}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{t("header.soon")}</Badge>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Navigation */}
          <Button variant="ghost" size="sm" asChild className="hover-lift rounded-xl">
            <Link href="/calendar" className="gap-2 px-4">
              <Calendar className="h-4 w-4" />
              {t("navigation.calendar")}
            </Link>
          </Button>

          <Button variant="ghost" size="sm" className="gap-2 hover-lift rounded-xl px-4" asChild>
            <Link href="/team">
              <Users className="h-4 w-4" />
              {t("navigation.team")}
            </Link>
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

          {/* Team Messages */}
          <MessageNotification />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Bug Report Button */}
          <BugReportDialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              title={t("header.reportBug")}
            >
              <Bug className="h-4 w-4" />
            </Button>
          </BugReportDialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-lift">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                    {getUserInitials(user?.name || null)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 glass-card border-0 shadow-premium" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-base font-semibold leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-sm leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild className="gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                <Link href="/settings">
                  <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{t("ui.settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-3 p-3 rounded-lg opacity-60">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-muted/20 to-muted/10">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">{t("header.feedback")}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{t("header.soon")}</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                <div className="p-1.5 rounded-md bg-gradient-to-br from-destructive/20 to-destructive/10">
                  <LogOut className="h-4 w-4 text-destructive" />
                </div>
                <span className="font-medium">{t("ui.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Project Creation */}
      <EnhancedProjectCreation
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onCreateProject={handleEnhancedCreateProject}
        projects={projects}
        workspaceMembers={users}
      />
    </header>
  )
}
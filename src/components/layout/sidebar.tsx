"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Home, 
  CheckSquare, 
  FolderOpen, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Plus,
  Users,
  BarChart3,
  Bell,
  Search,
  LogOut,
  Mail,
  Building2,
  UserCog,
  Cog
} from "lucide-react"
import { WorkspaceSelector } from "./workspace-selector"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"
import { projectColorGenerator } from "@/lib/project-color-generator"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, currentWorkspace, refreshWorkspaces } = useAuth()
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [workspaceProjects, setWorkspaceProjects] = useState<any[]>([])

  // Dynamic navigation items with translations
  const navigation = [
    { name: t('navigation.dashboard'), href: "/", icon: Home },
    { name: t('navigation.tasks'), href: "/tasks", icon: CheckSquare },
    { name: t('navigation.projects'), href: "/projects", icon: FolderOpen },
    { name: t('navigation.team'), href: "/team", icon: Users },
    { name: t('navigation.calendar'), href: "/calendar", icon: Calendar },
    { name: t('navigation.messages'), href: "/messages", icon: MessageSquare },
    // { name: "Email Co-Pilot", href: "/email-cleanup", icon: Mail }, // Temporarily disabled
    { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3 },
    { name: t('ui.settings'), href: "/settings", icon: Settings },
  ]

  const workspaceNavigation = [
    { name: t('navigation.workspaces'), href: "/workspaces", icon: Building2 },
    { name: t('navigation.workspaceSettings'), href: "/workspace/settings", icon: Cog },
    { name: t('navigation.memberManagement'), href: "/workspace/members", icon: UserCog },
  ]

  // Fetch workspace projects when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchWorkspaceProjects()
    }
  }, [currentWorkspace])

  const fetchWorkspaceProjects = async () => {
    if (!currentWorkspace || !user) return
    
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}&includeCounts=true`)
      if (response.ok) {
        const projects = await response.json()
        
        // Reset color generator for consistent colors
        projectColorGenerator.resetUsedColors()
        
        // Assign dynamic colors to projects and separate by ownership
        const projectsWithColors = projects.map((project: any) => ({
          ...project,
          dynamicColor: project.color || projectColorGenerator.generateProjectColor(project.name, project.id),
          taskCount: project._count?.tasks || 0
        }))
        
        // Separate owned vs participated projects
        const ownedProjects = projectsWithColors.filter((p: any) => p.ownerId === user.id || p.owner?.id === user.id)
        const participatedProjects = projectsWithColors.filter((p: any) => 
          (p.ownerId !== user.id && p.owner?.id !== user.id) && 
          (p.members?.some((m: any) => m.userId === user.id) || p.workspaceId === currentWorkspace.id)
        )
        
        // Combine with owned projects first, limit total to 12 for scrolling
        const combinedProjects = [
          ...ownedProjects.slice(0, 8),
          ...participatedProjects.slice(0, 4)
        ]
        
        setWorkspaceProjects(combinedProjects)
      }
    } catch (error) {
      console.error('Failed to fetch workspace projects:', error)
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-background/95 backdrop-blur-md border-r border-border/50 shadow-sm transition-all duration-300 overflow-hidden",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-base">PM</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Project Manager
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto hover-lift rounded-xl"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Workspace Selector */}
      {!isCollapsed && (
        <div className="flex-shrink-0">
          <WorkspaceSelector />
        </div>
      )}

      {/* Scrollable Navigation Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {/* Main Navigation */}
        <nav className="p-6 space-y-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover-lift",
                  isActive 
                    ? "bg-gradient-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Workspace Management */}
        {!isCollapsed && (
          <div className="px-6 pb-6">
            <div className="pt-6 mt-6 border-t border-border/50">
              <div className="flex items-center mb-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Workspace
                </h3>
              </div>
              <div className="space-y-2">
                {workspaceNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href === "/workspace/settings" && pathname.startsWith("/workspace/settings")) ||
                    (item.href === "/workspace/members" && pathname.startsWith("/workspace/members"))
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover-lift",
                        isActive 
                          ? "bg-gradient-primary text-primary-foreground shadow-md" 
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        {!isCollapsed && currentWorkspace && (
          <div className="px-6 pb-6">
            <div className="pt-6 mt-6 border-t border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Projects
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:bg-accent/50 transition-colors rounded-md"
                  onClick={() => router.push('/projects')}
                  title="View all projects"
                  aria-label="View all projects"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Scrollable Projects List */}
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 space-y-1 pr-1">
                {workspaceProjects.length > 0 ? (
                  (() => {
                    const ownedProjects = workspaceProjects.filter((p: any) => 
                      p.ownerId === user?.id || p.owner?.id === user?.id
                    )
                    const participatedProjects = workspaceProjects.filter((p: any) => 
                      (p.ownerId !== user?.id && p.owner?.id !== user?.id)
                    )
                    
                    return (
                      <>
                        {/* Owned Projects */}
                        {ownedProjects.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ 
                                  backgroundColor: '#10b981', // Green for owned projects
                                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)'
                                }}
                              ></div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Projects</span>
                            </div>
                            <div className="space-y-1">
                              {ownedProjects.map((project: any) => (
                                <div key={project.id} className="group relative">
                                  <Link
                                    href={`/tasks?project=${project.id}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] cursor-pointer"
                                    title={`View tasks for ${project.name} (Owner)`}  
                                    aria-label={`View tasks for ${project.name} project`}
                                  >
                                    <div 
                                      className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-4.5 group-hover:h-4.5 group-hover:shadow-lg shadow-md" 
                                      style={{ 
                                        backgroundColor: project.dynamicColor,
                                        boxShadow: `0 0 8px ${project.dynamicColor}60, 0 2px 4px ${project.dynamicColor}30`
                                      }}
                                    />
                                    <span 
                                      className="flex-1 truncate font-semibold transition-colors duration-200"
                                      style={{ 
                                        color: project.dynamicColor
                                      }}
                                    >
                                      {project.name}
                                    </span>
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs transition-all duration-200 group-hover:scale-110 font-medium shadow-sm"
                                      style={{
                                        backgroundColor: `${project.dynamicColor}18`,
                                        color: project.dynamicColor,
                                        borderColor: `${project.dynamicColor}40`,
                                        boxShadow: `0 1px 2px ${project.dynamicColor}20`
                                      }}
                                    >
                                      {project.taskCount}
                                    </Badge>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Team Projects */}
                        {participatedProjects.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ 
                                  backgroundColor: '#3b82f6', // Blue for team projects
                                  boxShadow: '0 0 6px rgba(59, 130, 246, 0.4)'
                                }}
                              ></div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Projects</span>
                            </div>
                            <div className="space-y-1">
                              {participatedProjects.map((project: any) => (
                                <div key={project.id} className="group relative">
                                  <Link
                                    href={`/tasks?project=${project.id}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] cursor-pointer opacity-95 hover:opacity-100"
                                    title={`View tasks for ${project.name} (Member)`}  
                                  >
                                    <div 
                                      className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-4.5 group-hover:h-4.5 group-hover:shadow-lg shadow-sm ring-1 ring-white/10" 
                                      style={{ 
                                        backgroundColor: project.dynamicColor,
                                        boxShadow: `0 0 6px ${project.dynamicColor}50, 0 1px 3px ${project.dynamicColor}25`
                                      }}
                                    />
                                    <span 
                                      className="flex-1 truncate font-medium transition-colors duration-200"
                                      style={{ 
                                        color: `${project.dynamicColor}E6`
                                      }}
                                    >
                                      {project.name}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs transition-all duration-200 group-hover:scale-110 border-opacity-60 font-normal"
                                      style={{
                                        borderColor: `${project.dynamicColor}50`,
                                        color: `${project.dynamicColor}B0`,
                                        backgroundColor: `${project.dynamicColor}08`
                                      }}
                                    >
                                      {project.taskCount}
                                    </Badge>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()
                ) : (
                  <div className="px-3 py-6 text-center">
                    <div className="p-3 rounded-full bg-muted/30 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <FolderOpen className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">No projects yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/projects')}
                      className="text-xs hover-lift"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Project
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
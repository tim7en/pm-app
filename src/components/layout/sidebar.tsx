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
    { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3 },
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
      "flex flex-col h-full bg-background/95 backdrop-blur-md border-r border-border/50 shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
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
      {!isCollapsed && <WorkspaceSelector />}

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
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

        {/* Workspace Management */}
        {!isCollapsed && (
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
        )}

        {!isCollapsed && currentWorkspace && (
          <div className="pt-6 mt-6 border-t border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Projects
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-accent/50 transition-colors"
                onClick={() => router.push('/projects')}
                title="View all projects"
                aria-label="View all projects"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1 pr-1">
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
                        <>
                          <div className="flex items-center gap-2 px-2 py-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ 
                                backgroundColor: '#10b981' // Consistent green for owned projects
                              }}
                            ></div>
                            <span className="text-xs font-medium text-muted-foreground">My Projects</span>
                          </div>
                          {ownedProjects.map((project: any) => (
                            <div key={project.id} className="group relative">
                              <Link
                                href={`/tasks?project=${project.id}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] cursor-pointer"
                                title={`View tasks for ${project.name} (Owner)`}  
                                aria-label={`View tasks for ${project.name} project`}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-4 group-hover:h-4 group-hover:shadow-lg" 
                                  style={{ 
                                    backgroundColor: project.dynamicColor,
                                    boxShadow: `0 0 8px ${project.dynamicColor}40`
                                  }}
                                />
                                <span 
                                  className="flex-1 truncate font-medium transition-colors duration-200"
                                  style={{ 
                                    color: `${project.dynamicColor}CC`
                                  }}
                                >
                                  {project.name}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs transition-all duration-200 group-hover:scale-110"
                                  style={{
                                    backgroundColor: `${project.dynamicColor}20`,
                                    color: project.dynamicColor
                                  }}
                                >
                                  {project.taskCount}
                                </Badge>
                              </Link>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Participated Projects */}
                      {participatedProjects.length > 0 && (
                        <>
                          {ownedProjects.length > 0 && <div className="my-2 border-t"></div>}
                          <div className="flex items-center gap-2 px-2 py-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ 
                                backgroundColor: '#3b82f6' // Consistent blue for team projects
                              }}
                            ></div>
                            <span className="text-xs font-medium text-muted-foreground">Team Projects</span>
                          </div>
                          {participatedProjects.map((project: any) => (
                            <div key={project.id} className="group relative">
                              <Link
                                href={`/tasks?project=${project.id}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] cursor-pointer opacity-90 hover:opacity-100"
                                title={`View tasks for ${project.name} (Member)`}  
                              >
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-4 group-hover:h-4 group-hover:shadow-lg border border-white/20" 
                                  style={{ 
                                    backgroundColor: project.dynamicColor,
                                    boxShadow: `0 0 6px ${project.dynamicColor}30`
                                  }}
                                />
                                <span 
                                  className="flex-1 truncate font-normal transition-colors duration-200"
                                  style={{ 
                                    color: `${project.dynamicColor}B0`
                                  }}
                                >
                                  {project.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs transition-all duration-200 group-hover:scale-110 border-opacity-50"
                                  style={{
                                    borderColor: `${project.dynamicColor}60`,
                                    color: `${project.dynamicColor}90`
                                  }}
                                >
                                  {project.taskCount}
                                </Badge>
                              </Link>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )
                })()
              ) : (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No projects yet
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="User" />
            <AvatarFallback>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/team">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Team</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>{t('ui.notifications')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="w-full">
                  <LanguageSelector className="w-full justify-start p-0 h-auto font-normal" />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('ui.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
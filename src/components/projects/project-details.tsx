"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ProjectMembers } from "./project-members"
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  MoreVertical,
  Settings,
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  Clock,
  Target,
  Flag
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProjectRole } from "@/lib/prisma-mock"

interface ProjectMember {
  id: string
  name: string
  email: string
  avatar: string
  role: "owner" | "admin" | "member" | "guest"
  joinedAt: Date
}

interface ProjectTask {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  assignee?: ProjectMember
  dueDate: Date
  createdAt: Date
}

interface ProjectStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  upcomingTasks: number
}

interface Project {
  id: string
  name: string
  description: string
  color: string
  status: "active" | "archived" | "completed"
  progress: number
  taskCount: number
  memberCount: number
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  members: ProjectMember[]
  tasks: ProjectTask[]
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  tags?: string[]
  stats: ProjectStats
}

interface ProjectDetailsProps {
  project: Project
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void
  onMemberAdd?: (projectId: string, email: string, role: string) => void
  onMemberRemove?: (projectId: string, memberId: string) => void
}

export function ProjectDetails({ 
  project, 
  onProjectUpdate, 
  onMemberAdd, 
  onMemberRemove 
}: ProjectDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "archived": return "bg-gray-100 text-gray-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: ProjectMember["role"]) => {
    switch (role) {
      case "owner": return "bg-purple-100 text-purple-800"
      case "admin": return "bg-blue-100 text-blue-800"
      case "member": return "bg-green-100 text-green-800"
      case "guest": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleProjectSave = () => {
    onProjectUpdate?.(project.id, editedProject)
    setIsEditing(false)
  }

  const handleMemberAdd = () => {
    if (newMemberEmail.trim()) {
      onMemberAdd?.(project.id, newMemberEmail.trim(), newMemberRole)
      setNewMemberEmail("")
      setNewMemberRole("member")
    }
  }

  const taskStatusCounts = {
    todo: project.tasks.filter(t => t.status === "todo").length,
    in_progress: project.tasks.filter(t => t.status === "in_progress").length,
    completed: project.tasks.filter(t => t.status === "completed").length,
    blocked: project.tasks.filter(t => t.status === "blocked").length,
  }

  const recentTasks = project.tasks
    .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color }}
          >
            <span className="text-white font-bold text-2xl">
              {project.name.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editedProject.name}
                  onChange={(e) => setEditedProject({...editedProject, name: e.target.value})}
                  className="text-2xl font-bold"
                />
                <Textarea
                  value={editedProject.description}
                  onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleProjectSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    Duplicate Project
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Archive Project
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-red-600">
                    Delete Project
                    <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Project Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{project.stats.totalTasks}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{project.stats.completedTasks}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{project.stats.overdueTasks}</div>
                      <div className="text-sm text-muted-foreground">Overdue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{project.stats.upcomingTasks}</div>
                      <div className="text-sm text-muted-foreground">Upcoming</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(taskStatusCounts).map(([status, count]) => (
                      <div key={status} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold mb-1">{count}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {status.replace("_", " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Recent Tasks
                    </span>
                    <Button variant="outline" size="sm">View All Tasks</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name ? task.assignee.name.split(" ").map(n => n[0]).join("") : 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      All Tasks
                    </span>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {task.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name ? task.assignee.name.split(" ").map(n => n[0]).join("") : 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <ProjectMembers
                projectId={project.id}
                projectOwnerId={project.owner?.id || project.ownerId}
                currentUserId="current-user-id" // This should come from auth context
                userRole={ProjectRole.ADMIN} // This should come from user's role in project
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Project Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Project Name</label>
                        <Input value={project.name} disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select value={project.status} disabled>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={project.description} disabled rows={3} />
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-red-600">Danger Zone</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                        Archive Project
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                        Delete Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(project.updatedAt)}</span>
              </div>
              {project.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm">{formatDate(project.dueDate)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks</span>
                <span className="text-sm">{project.taskCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <span className="text-sm">{project.memberCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                <MessageSquare className="w-4 h-4 mr-2" />
                Share Project
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Users className="w-4 h-4 mr-2" />
                Invite Members
                <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
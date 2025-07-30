"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Calendar, User, Flag, Plus, Tag } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

const priorityOptions = [
  { name: "Low", value: "LOW", color: "#10b981" },
  { name: "Medium", value: "MEDIUM", color: "#f59e0b" },
  { name: "High", value: "HIGH", color: "#ef4444" },
  { name: "Urgent", value: "URGENT", color: "#dc2626" }
]

interface CreateTaskModalProps {
  projects: Array<{ id: string; name: string; color: string; workspaceId: string }>
  onCreateTask: (task: {
    title: string
    description?: string
    projectId: string
    assigneeId?: string
    priority: string
    dueDate?: Date
    tags: Array<{ name: string; color: string }>
  }) => void
  children: React.ReactNode
}

interface WorkspaceMember {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: string
}

export function CreateTaskModal({ projects, onCreateTask, children }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assigneeId: "",
    priority: "MEDIUM",
    dueDate: undefined as Date | undefined,
    tags: [] as Array<{ name: string; color: string }>
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [newTag, setNewTag] = useState("")

  // Fetch workspace members when project is selected
  useEffect(() => {
    if (formData.projectId) {
      const selectedProject = projects.find(p => p.id === formData.projectId)
      if (selectedProject) {
        fetchWorkspaceMembers(selectedProject.workspaceId)
      }
    } else {
      setWorkspaceMembers([])
    }
  }, [formData.projectId, projects])

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (response.ok) {
        const members = await response.json()
        setWorkspaceMembers(members)
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.projectId) return

    onCreateTask({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      projectId: formData.projectId,
      assigneeId: formData.assigneeId || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate,
      tags: formData.tags
    })

    // Reset form
    setFormData({
      title: "",
      description: "",
      projectId: "",
      assigneeId: "",
      priority: "MEDIUM",
      dueDate: undefined,
      tags: []
    })
    setNewTag("")
    setOpen(false)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.find(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, { name: newTag.trim(), color: "#6b7280" }]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }))
  }

  const selectedProject = projects.find(p => p.id === formData.projectId)
  const selectedMember = workspaceMembers.find(m => m.user.id === formData.assigneeId)
  const selectedPriority = priorityOptions.find(p => p.value === formData.priority)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task and assign it to team members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your task..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedProject ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: selectedProject.color }}
                        />
                        {selectedProject.name}
                      </>
                    ) : (
                      "Select project"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setFormData(prev => ({ ...prev, projectId: project.id }))}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedMember ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs">
                          {(selectedMember.user.name || selectedMember.user.email).split(' ').map(n => n[0]).join('')}
                        </div>
                        {selectedMember.user.name || selectedMember.user.email}
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        {loadingMembers ? "Loading..." : "Unassigned"}
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={() => setFormData(prev => ({ ...prev, assigneeId: "" }))}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Unassigned
                  </DropdownMenuItem>
                  {formData.projectId ? (
                    workspaceMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.user.id}
                        onClick={() => setFormData(prev => ({ ...prev, assigneeId: member.user.id }))}
                        className="flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          {(member.user.name || member.user.email).split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{member.user.name || member.user.email}</div>
                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      <div className="text-muted-foreground text-sm">Select a project first</div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedPriority ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: selectedPriority.color }}
                        />
                        {selectedPriority.name}
                      </>
                    ) : (
                      "Select priority"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {priorityOptions.map((priority) => (
                    <DropdownMenuItem
                      key={priority.value}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                </Button>
                
                {showCalendar && (
                  <Card className="absolute top-full mt-1 z-50 w-auto">
                    <CardContent className="p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => {
                          setFormData(prev => ({ ...prev, dueDate: date }))
                          setShowCalendar(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.name)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim() || !formData.projectId}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
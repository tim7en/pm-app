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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Palette, Plus, Users } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useAuth } from "@/contexts/AuthContext"

const colorOptions = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" }
]

interface Workspace {
  id: string
  name: string
  description?: string
}

interface CreateProjectModalProps {
  onCreateProject: (project: {
    name: string
    description?: string
    color: string
    dueDate?: Date
    workspaceId?: string
  }) => void
  children: React.ReactNode
}

export function CreateProjectModal({ onCreateProject, children }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    dueDate: undefined as Date | undefined,
    workspaceId: ""
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const { currentWorkspaceId } = useAuth()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    // Set default workspace when available
    if (currentWorkspaceId && !formData.workspaceId) {
      setFormData(prev => ({ ...prev, workspaceId: currentWorkspaceId }))
    }
  }, [currentWorkspaceId, formData.workspaceId])

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onCreateProject({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
      dueDate: formData.dueDate,
      workspaceId: formData.workspaceId || currentWorkspaceId || undefined
    })

    // Reset form
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      dueDate: undefined,
      workspaceId: currentWorkspaceId || ""
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your tasks and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Team/Workspace *</Label>
            <Select 
              value={formData.workspaceId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, workspaceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team">
                  {workspaces.find(w => w.id === formData.workspaceId)?.name || "Select a team"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-xs text-muted-foreground">{workspace.description}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: formData.color }}
                  />
                  {colorOptions.find(c => c.value === formData.color)?.name || "Custom"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {colorOptions.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className="flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
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

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
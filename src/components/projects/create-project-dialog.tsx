"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  FolderOpen, 
  Plus, 
  Calendar,
  Palette,
  Users,
  AlertCircle,
  Crown,
  Shield
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface CreateProjectDialogProps {
  onCreateProject: (project: any) => void
  children?: React.ReactNode
}

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

export function CreateProjectDialog({ onCreateProject, children }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [canCreateProject, setCanCreateProject] = useState(false)
  const { user, currentWorkspace } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    dueDate: ""
  })

  // Check user permissions when workspace changes
  useEffect(() => {
    if (currentWorkspace && user) {
      checkUserPermissions()
    }
  }, [currentWorkspace, user])

  const checkUserPermissions = async () => {
    if (!currentWorkspace || !user) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.ok) {
        const members = await response.json()
        const currentMember = members.find((member: any) => member.id === user.id)
        if (currentMember) {
          setUserRole(currentMember.role)
          setCanCreateProject(['OWNER', 'ADMIN'].includes(currentMember.role))
        } else {
          setUserRole(null)
          setCanCreateProject(false)
        }
      }
    } catch (error) {
      console.error('Error checking user permissions:', error)
      setCanCreateProject(false)
    }
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      })
      return
    }

    if (!canCreateProject) {
      toast({
        title: "Permission Denied",
        description: "Only workspace owners and admins can create projects",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await onCreateProject({
        ...formData,
        workspaceId: currentWorkspace?.id
      })
      setOpen(false)
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
        dueDate: ""
      })
      toast({
        title: "Success",
        description: "Project created successfully",
      })
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedColor = colorOptions.find(c => c.value === formData.color)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project to organize your tasks and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        
        {!canCreateProject ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-medium">
                    You don't have permission to create projects in this workspace.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Only workspace owners and administrators can create new projects. 
                    Your current role: <Badge variant="outline" className="ml-1">
                      {userRole === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                      {userRole === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                      {userRole || 'Unknown'}
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contact your workspace administrator to request project creation permissions.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="Enter project name..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this project about?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: formData.color }}
                  />
                  {selectedColor?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {colorOptions.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className="gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Team Collaboration</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be able to invite team members and assign tasks after creating the project.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !canCreateProject}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
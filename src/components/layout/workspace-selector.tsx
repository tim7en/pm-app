"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, ChevronDown, Plus, Users, FolderOpen, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export function WorkspaceSelector() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace } = useAuth()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsCreating(true)
    try {
      await createWorkspace(formData.name.trim(), formData.description.trim() || undefined)
      setIsDialogOpen(false)
      setFormData({ name: "", description: "" })
      toast({
        title: "Success",
        description: "Workspace created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workspace",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "MEMBER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Show create workspace prompt if no workspaces exist
  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="p-3 border-b">
        <div className="text-center py-4">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No workspaces found</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create First Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Your First Workspace</DialogTitle>
                <DialogDescription>
                  Create a workspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. My Company, Personal Projects"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this workspace for?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || !formData.name.trim()}>
                    {isCreating ? "Creating..." : "Create Workspace"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // If workspaces exist but no current workspace is set, show loading
  if (!currentWorkspace) {
    return (
      <div className="p-3 border-b">
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start h-auto p-2 hover:bg-accent/50">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {currentWorkspace.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-medium text-sm truncate w-full">{currentWorkspace.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Badge className={`text-xs px-1.5 py-0.5 h-auto font-normal ${getRoleColor(currentWorkspace.role)}`}>
                    {currentWorkspace.role}
                  </Badge>
                  <span>•</span>
                  <span>{currentWorkspace.memberCount} members</span>
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="start" sideOffset={4}>
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Switch Workspace
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => setCurrentWorkspace(workspace.id)}
                className="flex items-center justify-between p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {workspace.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm truncate">{workspace.name}</span>
                      {workspace.id === currentWorkspace?.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={`text-xs px-1.5 py-0.5 h-auto font-normal ${getRoleColor(workspace.role)}`}>
                        {workspace.role}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace.memberCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {workspace.projectCount}
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create New Workspace
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. My Company, Personal Projects"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this workspace for?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || !formData.name.trim()}>
                    {isCreating ? "Creating..." : "Create Workspace"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

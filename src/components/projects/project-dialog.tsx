"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProjectStatus } from "@prisma/client"
import { useAuth } from "@/contexts/AuthContext"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  status: z.nativeEnum(ProjectStatus).optional(),
  workspaceId: z.string().min(1, "Team selection is required"),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface Workspace {
  id: string
  name: string
  description?: string
}

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: {
    id: string
    name: string
    description?: string
    color: string
    status: ProjectStatus
    workspaceId?: string
  }
  onSubmit: (data: ProjectFormData) => Promise<void>
  isSubmitting?: boolean
}

const colorOptions = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
]

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  isSubmitting = false,
}: ProjectDialogProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const { currentWorkspaceId } = useAuth()
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      color: project?.color || "#3b82f6",
      status: project?.status || ProjectStatus.ACTIVE,
      workspaceId: project?.workspaceId || currentWorkspaceId || "",
    },
  })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    // Set default workspace when available and not editing
    if (currentWorkspaceId && !project && !form.getValues('workspaceId')) {
      form.setValue('workspaceId', currentWorkspaceId)
    }
  }, [currentWorkspaceId, project, form])

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

  const handleSubmit = async (data: ProjectFormData) => {
    await onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {project
              ? "Update the project details below."
              : "Fill in the details to create a new project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team/Workspace</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team">
                          {workspaces.find(w => w.id === field.value)?.name || "Select a team"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={cn(
                          "w-full h-10 rounded-md border-2 transition-all",
                          field.value === color.value
                            ? "border-primary scale-105"
                            : "border-transparent hover:border-muted-foreground"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => field.onChange(color.value)}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : project ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
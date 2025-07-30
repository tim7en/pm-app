"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TaskStatus, Priority } from "@prisma/client"
import { useAuth } from "@/contexts/AuthContext"
import { TaskAttachments } from "./task-attachments"

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional(),
  priority: z.nativeEnum(Priority),
  dueDate: z.date().optional(),
  status: z.nativeEnum(TaskStatus),
  tags: z.array(z.object({
    name: z.string().min(1, "Tag name is required"),
    color: z.string().min(1, "Color is required"),
  })).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1, "Subtask title is required"),
    isCompleted: z.boolean(),
  })).optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

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

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: {
    id: string
    title: string
    description?: string
    projectId: string
    assigneeId?: string
    priority: Priority
    dueDate?: Date
    status: TaskStatus
    tags: Array<{ name: string; color: string }>
    subtasks: Array<{ title: string; isCompleted: boolean }>
  }
  projects: Array<{ 
    id: string
    name: string
    color: string
    workspaceId: string
    owner?: { id: string; name: string }
    isOwner?: boolean
  }>
  onSubmit: (data: TaskFormData) => Promise<void>
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

export function TaskDialog({
  open,
  onOpenChange,
  task,
  projects,
  onSubmit,
  isSubmitting = false,
}: TaskDialogProps) {
  const { user, currentWorkspace } = useAuth()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [userRole, setUserRole] = useState<string>('MEMBER')
  const [selectedProjectOwnership, setSelectedProjectOwnership] = useState<boolean>(false)

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      projectId: task?.projectId || projects[0]?.id || "",
      assigneeId: task?.assigneeId || "unassigned",
      priority: task?.priority || Priority.MEDIUM,
      dueDate: task?.dueDate || undefined,
      status: task?.status || TaskStatus.TODO,
      tags: task?.tags || [],
      subtasks: task?.subtasks || [],
    },
  })

  // Watch project changes to fetch workspace members and check ownership
  const watchedProjectId = form.watch("projectId")

  useEffect(() => {
    if (currentWorkspace && user) {
      // Get user's role in current workspace
      fetchUserRole()
    }
  }, [currentWorkspace, user])

  useEffect(() => {
    if (watchedProjectId) {
      const selectedProject = projects.find(p => p.id === watchedProjectId)
      if (selectedProject) {
        fetchWorkspaceMembers(selectedProject.workspaceId)
        // Check if user is project owner
        setSelectedProjectOwnership(selectedProject.owner?.id === user?.id || selectedProject.isOwner === true)
      }
    } else {
      setWorkspaceMembers([])
      setSelectedProjectOwnership(false)
    }
  }, [watchedProjectId, projects, user])

  const fetchUserRole = async () => {
    if (!currentWorkspace || !user) return
    
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.ok) {
        const members = await response.json()
        const currentMember = members.find((member: any) => member.user.id === user.id)
        if (currentMember) {
          setUserRole(currentMember.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

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

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: "tags",
  })

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: "subtasks",
  })

  const handleSubmit = async (data: TaskFormData) => {
    // Check if user can create tasks for this project
    const selectedProject = projects.find(p => p.id === data.projectId)
    const isProjectOwner = selectedProject?.owner?.id === user?.id || selectedProject?.isOwner === true
    const canCreateTask = userRole === 'OWNER' || userRole === 'ADMIN' || isProjectOwner

    if (!canCreateTask) {
      // This shouldn't happen if UI is properly restricted, but as a safeguard
      return
    }

    // Convert "unassigned" to undefined for the API
    const processedData = {
      ...data,
      assigneeId: data.assigneeId === "unassigned" ? undefined : data.assigneeId
    }
    await onSubmit(processedData)
    form.reset()
    onOpenChange(false)
  }

  // Filter projects based on user role
  const availableProjects = projects.filter(project => {
    // OWNER and ADMIN can create tasks in any project
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      return true
    }
    // MEMBER can only create tasks in projects they own
    return project.owner?.id === user?.id || project.isOwner === true
  })

  // Filter assignees based on user role and project ownership
  const availableAssignees = workspaceMembers.filter(member => {
    // If user is OWNER/ADMIN or project owner, they can assign to anyone
    if (userRole === 'OWNER' || userRole === 'ADMIN' || selectedProjectOwnership) {
      return true
    }
    // Otherwise, can only assign to themselves
    return member.user.id === user?.id
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
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
                      placeholder="Enter task description"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProjects.length > 0 ? (
                          availableProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__no_projects__" disabled>
                            No projects available for task creation
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingMembers ? "Loading..." : "Select assignee"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {form.watch("projectId") ? (
                          availableAssignees.length > 0 ? (
                            availableAssignees.map((member) => (
                              <SelectItem key={member.user.id} value={member.user.id}>
                                <div className="flex items-center gap-2">
                                  <span>{member.user.name || member.user.email}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({member.role})
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_members__" disabled>
                              {userRole === 'MEMBER' && !selectedProjectOwnership 
                                ? "You can only assign tasks to yourself" 
                                : "No members available"}
                            </SelectItem>
                          )
                        ) : (
                          <SelectItem value="__select_project__" disabled>
                            Select a project first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Priority.LOW}>Low</SelectItem>
                        <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={Priority.HIGH}>High</SelectItem>
                        <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div>
              <FormLabel>Tags</FormLabel>
              <div className="space-y-2">
                {tagFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`tags.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Tag name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`tags.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-20">
                                <SelectValue placeholder="Color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: color.value }}
                                    />
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTag(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTag({ name: "", color: "#3b82f6" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <FormLabel>Subtasks</FormLabel>
              <div className="space-y-2">
                {subtaskFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Subtask title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSubtask({ title: "", isCompleted: false })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subtask
                </Button>
              </div>
            </div>

            {/* Attachments - only show for existing tasks */}
            {task && (
              <div>
                <FormLabel>Attachments</FormLabel>
                <TaskAttachments taskId={task.id} />
              </div>
            )}

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
                {isSubmitting ? "Saving..." : task ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
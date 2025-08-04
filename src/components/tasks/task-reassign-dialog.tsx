"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { useAPI } from "@/hooks/use-api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Check, User, UserX, Loader2, X } from "lucide-react"

interface TaskReassignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  currentAssigneeId?: string
  currentAssigneeIds?: string[] // Support for multiple current assignees
  onReassignComplete?: (taskId: string, newAssigneeIds?: string[]) => void
}

interface WorkspaceMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

export function TaskReassignDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  currentAssigneeId,
  currentAssigneeIds,
  onReassignComplete
}: TaskReassignDialogProps) {
  const { t } = useTranslation()
  const { apiCall } = useAPI()
  const { currentWorkspace } = useAuth()
  const { toast } = useToast()
  
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [reassigning, setReassigning] = useState(false)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    currentAssigneeIds || (currentAssigneeId ? [currentAssigneeId] : [])
  )

  useEffect(() => {
    if (open && currentWorkspace?.id) {
      fetchWorkspaceMembers()
    }
  }, [open, currentWorkspace?.id])

  const fetchWorkspaceMembers = async () => {
    setLoading(true)
    try {
      const response = await apiCall(`/api/workspaces/${currentWorkspace?.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else {
        toast({
          title: t("error.title"),
          description: t("error.fetchingMembers"),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching workspace members:', error)
      toast({
        title: t("error.title"),
        description: t("error.fetchingMembers"),
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleReassign = async () => {
    setReassigning(true)
    try {
      // Use the new assignees endpoint for multi-assignee support
      if (selectedAssigneeIds.length > 0) {
        // Replace all assignees with the selected ones
        const response = await apiCall(`/api/tasks/${taskId}/assignees`, {
          method: 'POST',
          body: JSON.stringify({
            userIds: selectedAssigneeIds
          })
        })

        if (response.ok) {
          const result = await response.json()
          const assigneeNames = selectedAssigneeIds
            .map(id => members.find(m => m.id === id)?.name || t("tasks.unknown"))
            .join(", ")
          
          toast({
            title: t("tasks.taskReassigned"),
            description: result.message || t("tasks.taskAssignedTo", { name: assigneeNames })
          })
          
          onReassignComplete?.(taskId, selectedAssigneeIds)
          onOpenChange(false)
        } else {
          const errorData = await response.json().catch(() => ({}))
          toast({
            title: t("error.title"),
            description: errorData.message || t("error.reassigningTask"),
            variant: "destructive"
          })
        }
      } else {
        // Remove all assignees by calling DELETE
        const response = await apiCall(`/api/tasks/${taskId}/assignees`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const result = await response.json()
          toast({
            title: t("tasks.taskReassigned"),
            description: result.message || t("tasks.taskUnassigned")
          })
          
          onReassignComplete?.(taskId, [])
          onOpenChange(false)
        } else {
          const errorData = await response.json().catch(() => ({}))
          toast({
            title: t("error.title"),
            description: errorData.message || t("error.reassigningTask"),
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error reassigning task:', error)
      toast({
        title: t("error.title"),
        description: t("error.reassigningTask"),
        variant: "destructive"
      })
    }
    setReassigning(false)
  }

  const currentAssigneeIdsList = currentAssigneeIds || (currentAssigneeId ? [currentAssigneeId] : [])
  const currentAssignees = members.filter(m => currentAssigneeIdsList.includes(m.id))
  const selectedAssignees = members.filter(m => selectedAssigneeIds.includes(m.id))
  
  // Helper function to toggle assignee selection
  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssigneeIds(prev => 
      prev.includes(assigneeId) 
        ? prev.filter(id => id !== assigneeId)
        : [...prev, assigneeId]
    )
  }

  // Helper function to remove assignee
  const removeAssignee = (assigneeId: string) => {
    setSelectedAssigneeIds(prev => prev.filter(id => id !== assigneeId))
  }

  // Helper function to check if assignees have changed
  const hasAssigneesChanged = () => {
    const current = new Set(currentAssigneeIdsList)
    const selected = new Set(selectedAssigneeIds)
    return current.size !== selected.size || [...current].some(id => !selected.has(id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("tasks.reassignTask")}</DialogTitle>
          <DialogDescription>
            {t("tasks.reassignTaskDesc", { title: taskTitle })}
          </DialogDescription>
        </DialogHeader>

        {currentAssignees.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("tasks.currentAssignees")}</p>
            <div className="flex flex-wrap gap-2">
              {currentAssignees.map((assignee) => (
                <div key={assignee.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignee.avatar} alt={assignee.name} />
                    <AvatarFallback className="text-xs">
                      {assignee.name ? assignee.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignee.name}</span>
                  <Badge variant="secondary" className="text-xs">{assignee.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected assignees display */}
        {selectedAssignees.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("tasks.newAssignees")}</p>
            <div className="flex flex-wrap gap-2">
              {selectedAssignees.map((assignee) => (
                <Badge key={assignee.id} variant="default" className="flex items-center gap-1">
                  {assignee.name || assignee.email}
                  <button
                    type="button"
                    onClick={() => removeAssignee(assignee.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("tasks.selectAssignees")}</p>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Command className="rounded-lg border">
                <CommandInput placeholder={t("tasks.searchMembers")} />
                <CommandList>
                  <CommandEmpty>{t("tasks.noMembersFound")}</CommandEmpty>
                  <CommandGroup>
                    {/* Option to unassign all */}
                    <CommandItem
                      value="unassigned"
                      onSelect={() => setSelectedAssigneeIds([])}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        <UserX className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t("tasks.unassigned")}</p>
                        <p className="text-xs text-muted-foreground">{t("tasks.removeAllAssignees")}</p>
                      </div>
                      {selectedAssigneeIds.length === 0 && <Check className="h-4 w-4" />}
                    </CommandItem>
                    
                    {/* Workspace members */}
                    {members.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={`${member.name} ${member.email}`}
                        onSelect={() => toggleAssignee(member.id)}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.name ? member.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        {selectedAssigneeIds.includes(member.id) && <Check className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>

          {/* Status message */}
          {hasAssigneesChanged() && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedAssigneeIds.length === 0 
                    ? t("tasks.taskWillBeUnassigned") 
                    : t("tasks.assigneesWillBeUpdated")}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedAssigneeIds.length === 0
                    ? t("tasks.noAssigneeSelected")
                    : `${selectedAssigneeIds.length} assignee(s) selected`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reassigning}>
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleReassign} 
            disabled={reassigning || !hasAssigneesChanged()}
          >
            {reassigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {reassigning ? t("tasks.reassigning") : t("tasks.reassign")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

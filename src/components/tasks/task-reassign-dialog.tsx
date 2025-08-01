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
import { Check, User, UserX, Loader2 } from "lucide-react"

interface TaskReassignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  currentAssigneeId?: string
  onReassignComplete?: (taskId: string, newAssigneeId?: string) => void
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
  onReassignComplete
}: TaskReassignDialogProps) {
  const { t } = useTranslation()
  const { apiCall } = useAPI()
  const { currentWorkspace } = useAuth()
  const { toast } = useToast()
  
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [reassigning, setReassigning] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(currentAssigneeId)

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
      const response = selectedMemberId 
        ? await apiCall(`/api/tasks/${taskId}/assign`, {
            method: 'POST',
            body: JSON.stringify({
              assigneeId: selectedMemberId
            })
          })
        : await apiCall(`/api/tasks/${taskId}/assign`, {
            method: 'DELETE'
          })

      if (response.ok) {
        const result = await response.json()
        const assigneeName = selectedMemberId 
          ? members.find(m => m.id === selectedMemberId)?.name || t("tasks.unknown")
          : t("tasks.unassigned")
        
        toast({
          title: t("tasks.taskReassigned"),
          description: result.message || (selectedMemberId 
            ? t("tasks.taskAssignedTo", { name: assigneeName })
            : t("tasks.taskUnassigned"))
        })
        
        onReassignComplete?.(taskId, selectedMemberId)
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: t("error.title"),
          description: errorData.message || t("error.reassigningTask"),
          variant: "destructive"
        })
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

  const currentAssignee = members.find(m => m.id === currentAssigneeId)
  const selectedMember = members.find(m => m.id === selectedMemberId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("tasks.reassignTask")}</DialogTitle>
          <DialogDescription>
            {t("tasks.reassignTaskDesc", { title: taskTitle })}
          </DialogDescription>
        </DialogHeader>

        {currentAssignee && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentAssignee.avatar} alt={currentAssignee.name} />
              <AvatarFallback className="text-xs">
                {currentAssignee.name ? currentAssignee.name.split(' ').map(n => n[0]).join('') : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{t("tasks.currentlyAssignedTo")}</p>
              <p className="text-sm text-muted-foreground">{currentAssignee.name}</p>
            </div>
            <Badge variant="secondary">{currentAssignee.role}</Badge>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("tasks.selectNewAssignee")}</p>
            
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
                    {/* Option to unassign */}
                    <CommandItem
                      value="unassigned"
                      onSelect={() => setSelectedMemberId(undefined)}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        <UserX className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t("tasks.unassigned")}</p>
                        <p className="text-xs text-muted-foreground">{t("tasks.removeAssignment")}</p>
                      </div>
                      {!selectedMemberId && <Check className="h-4 w-4" />}
                    </CommandItem>
                    
                    {/* Workspace members */}
                    {members.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={`${member.name} ${member.email}`}
                        onSelect={() => setSelectedMemberId(member.id)}
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
                        {selectedMemberId === member.id && <Check className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>

          {selectedMember && selectedMember.id !== currentAssigneeId && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                <AvatarFallback className="text-xs">
                  {selectedMember.name ? selectedMember.name.split(' ').map(n => n[0]).join('') : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{t("tasks.willBeAssignedTo")}</p>
                <p className="text-sm text-blue-700">{selectedMember.name}</p>
              </div>
            </div>
          )}

          {!selectedMemberId && currentAssigneeId && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                <UserX className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">{t("tasks.taskWillBeUnassigned")}</p>
                <p className="text-sm text-orange-700">{t("tasks.noAssigneeSelected")}</p>
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
            disabled={reassigning || selectedMemberId === currentAssigneeId}
          >
            {reassigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {reassigning ? t("tasks.reassigning") : t("tasks.reassign")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

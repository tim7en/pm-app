"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Mail, UserPlus } from "lucide-react"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ADMIN"]),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteSuccess?: () => void
  workspaceId?: string
}

export function InviteMemberDialog({ 
  open, 
  onOpenChange, 
  onInviteSuccess,
  workspaceId
}: InviteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { currentWorkspace, getAuthHeaders } = useAuth()
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER" as const,
    },
  })

  const handleInviteMember = async (data: InviteFormData) => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const targetWorkspaceId = workspaceId || currentWorkspace.id
      
      const response = await fetch(`/api/workspaces/${targetWorkspaceId}/members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Invitation sent",
          description: result.message || `Successfully invited ${data.email} to the workspace`,
        })
        form.reset()
        onOpenChange(false)
        onInviteSuccess?.()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to send invitation",
          description: error.error || "Failed to invite user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error inviting member:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentWorkspace?.name || 'the workspace'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleInviteMember)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter email address"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

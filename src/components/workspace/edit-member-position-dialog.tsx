"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

const positionSchema = z.object({
  title: z.string().optional(),
  department: z.string().optional(),
})

type PositionFormData = z.infer<typeof positionSchema>

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  isOnline: boolean
  lastSeen?: Date
  department?: string
  title?: string
}

interface EditMemberPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMember | null
  workspaceId: string
  onSuccess: () => void
}

const departmentOptions = [
  "Engineering",
  "Design", 
  "Product",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Customer Success",
  "Other"
]

const titleOptions = [
  "Software Engineer",
  "Senior Software Engineer",
  "Lead Software Engineer",
  "Engineering Manager",
  "DevOps Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Product Designer",
  "Senior Designer",
  "Design Lead",
  "Product Manager",
  "Senior Product Manager",
  "Product Owner",
  "Marketing Manager",
  "Marketing Specialist",
  "Content Manager",
  "Sales Representative",
  "Sales Manager",
  "Account Manager",
  "Customer Success Manager",
  "HR Manager",
  "Recruiter",
  "Finance Manager",
  "Accountant",
  "Operations Manager",
  "Project Manager",
  "Scrum Master",
  "Other"
]

export function EditMemberPositionDialog({ 
  open, 
  onOpenChange, 
  member, 
  workspaceId, 
  onSuccess 
}: EditMemberPositionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: member?.title || "",
      department: member?.department || "",
    },
  })

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        title: member.title || "",
        department: member.department || "",
      })
    }
  }, [member, form])

  const handleSubmit = async (data: PositionFormData) => {
    if (!member) return

    setIsSubmitting(true)
    try {
      // Find the member ID from workspace members API
      const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members`)
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch workspace members')
      }
      
      const members = await membersResponse.json()
      const workspaceMember = members.find((m: any) => m.user.id === member.id)
      
      if (!workspaceMember) {
        throw new Error('Member not found in workspace')
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/members/${workspaceMember.id}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title?.trim() || null,
          department: data.department?.trim() || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member position updated successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update member position",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating member position:', error)
      toast({
        title: "Error",
        description: "Failed to update member position",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Position</DialogTitle>
          <DialogDescription>
            Update the position and department for {member.name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      <SelectItem value="">No title</SelectItem>
                      {titleOptions.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
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
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No department</SelectItem>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isSubmitting ? "Updating..." : "Update Position"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

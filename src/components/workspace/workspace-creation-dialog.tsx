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
import { Building2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"

interface WorkspaceCreationDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WorkspaceCreationDialog({ 
  children, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: WorkspaceCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const { createWorkspace } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsCreating(true)
    try {
      await createWorkspace(formData.name.trim(), formData.description.trim() || undefined)
      setOpen(false)
      setFormData({ name: "", description: "" })
      toast({
        title: t("workspace.success"),
        description: t("workspace.workspaceCreatedSuccessfully"),
      })
    } catch (error) {
      toast({
        title: t("workspace.error"),
        description: error instanceof Error ? error.message : t("workspace.failedToCreateWorkspace"),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("workspace.createNewWorkspace")}
          </DialogTitle>
          <DialogDescription>
            {t("workspace.createNewWorkspaceToOrganize")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("workspace.workspaceNameRequired")}</Label>
            <Input
              id="name"
              placeholder={t("workspace.workspaceNamePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("workspace.descriptionOptional")}</Label>
            <Textarea
              id="description"
              placeholder={t("workspace.workspaceDescriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("workspace.cancel")}
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim()}>
              {isCreating ? t("workspace.creating") : t("workspace.createWorkspace")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

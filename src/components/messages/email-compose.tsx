import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Save, 
  X, 
  Paperclip, 
  Bot, 
  Loader2,
  FileText,
  Image,
  Video,
  Music
} from 'lucide-react'
import { EmailDraft, Attachment } from '@/types/messenger'
import { cn } from '@/lib/utils'

interface EmailComposeProps {
  draft: EmailDraft
  isOpen: boolean
  onClose: () => void
  onSend: (draft: EmailDraft) => Promise<boolean>
  onSaveDraft: (draft: EmailDraft) => Promise<boolean>
  onDraftChange: (updates: Partial<EmailDraft>) => void
  onGenerateReply: (originalContent: string) => Promise<string | null>
  onUploadAttachment: (file: File) => Promise<string | null>
}

export function EmailCompose({
  draft,
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  onDraftChange,
  onGenerateReply,
  onUploadAttachment
}: EmailComposeProps) {
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingReply, setGeneratingReply] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSend = async () => {
    setSending(true)
    try {
      const success = await onSend(draft)
      if (success) {
        setAttachments([])
      }
    } finally {
      setSending(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await onSaveDraft(draft)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateReply = async () => {
    if (!draft.body) return
    
    setGeneratingReply(true)
    try {
      const reply = await onGenerateReply(draft.body)
      if (reply) {
        onDraftChange({ body: reply })
      }
    } finally {
      setGeneratingReply(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const url = await onUploadAttachment(file)
      if (url) {
        const attachment: Attachment = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type,
          size: formatFileSize(file.size),
          url
        }
        setAttachments(prev => [...prev, attachment])
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    return FileText
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Compose Email</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={draft.to || ''}
              onChange={(e) => onDraftChange({ to: e.target.value })}
            />
          </div>

          {/* CC/BCC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cc">CC</Label>
              <Input
                id="cc"
                type="email"
                placeholder="cc@example.com"
                value={draft.cc || ''}
                onChange={(e) => onDraftChange({ cc: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bcc">BCC</Label>
              <Input
                id="bcc"
                type="email"
                placeholder="bcc@example.com"
                value={draft.bcc || ''}
                onChange={(e) => onDraftChange({ bcc: e.target.value })}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={draft.subject || ''}
              onChange={(e) => onDraftChange({ subject: e.target.value })}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Message</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReply}
                disabled={generatingReply || !draft.body}
              >
                {generatingReply ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                Generate AI Reply
              </Button>
            </div>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-[200px] resize-none"
              value={draft.body || ''}
              onChange={(e) => onDraftChange({ body: e.target.value })}
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-2">
                {attachments.map((attachment) => {
                  const IconComponent = getFileIcon(attachment.type)
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 border rounded-lg"
                    >
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* File upload input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </CardContent>

        <Separator />

        {/* Footer */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving || !draft.to || !draft.subject}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={sending || !draft.to || !draft.subject || !draft.body}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

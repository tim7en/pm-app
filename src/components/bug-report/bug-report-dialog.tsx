"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Bug, 
  Upload, 
  X, 
  Camera,
  FileText,
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface BugReportDialogProps {
  children?: React.ReactNode
  className?: string
}

interface BugReport {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'ui' | 'functionality' | 'performance' | 'security' | 'other'
  stepsToReproduce: string
  expectedBehavior: string
  actualBehavior: string
  browserInfo: string
  screenshots: File[]
}

export function BugReportDialog({ children, className }: BugReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const [bugReport, setBugReport] = useState<BugReport>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'functionality',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    browserInfo: getBrowserInfo(),
    screenshots: []
  })

  function getBrowserInfo() {
    if (typeof window === 'undefined') return 'Unknown'
    
    const { userAgent } = navigator
    const { screen } = window
    
    return `${userAgent} | Screen: ${screen.width}x${screen.height} | URL: ${window.location.href}`
  }

  const handleInputChange = (field: keyof BugReport, value: string) => {
    setBugReport(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload images or PDF files.`,
          variant: "destructive"
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum file size is 10MB.`,
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    setBugReport(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, ...validFiles].slice(0, 5) // Max 5 files
    }))
  }

  const removeFile = (index: number) => {
    setBugReport(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const captureScreenshot = async () => {
    try {
      // Modern browsers support screen capture API
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' }
        })
        
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()
        
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(video, 0, 0)
            canvas.toBlob(blob => {
              if (blob) {
                const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })
                setBugReport(prev => ({
                  ...prev,
                  screenshots: [...prev.screenshots, file].slice(0, 5)
                }))
              }
            }, 'image/png')
          }
          
          // Stop all video tracks
          stream.getVideoTracks().forEach(track => track.stop())
        })
      } else {
        toast({
          title: "Screenshot not supported",
          description: "Your browser doesn't support screen capture. Please upload a screenshot manually.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error)
      toast({
        title: "Screenshot failed",
        description: "Failed to capture screenshot. Please try uploading manually.",
        variant: "destructive"
      })
    }
  }

  const validateForm = (): boolean => {
    if (!bugReport.title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for the bug report.",
        variant: "destructive"
      })
      return false
    }
    
    if (!bugReport.description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of the bug.",
        variant: "destructive"
      })
      return false
    }
    
    if (bugReport.description.trim().length < 10) {
      toast({
        title: "Description too short",
        description: "Please provide a more detailed description (at least 10 characters).",
        variant: "destructive"
      })
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Add text fields
      formData.append('title', bugReport.title.trim())
      formData.append('description', bugReport.description.trim())
      formData.append('priority', bugReport.priority)
      formData.append('category', bugReport.category)
      formData.append('stepsToReproduce', bugReport.stepsToReproduce.trim())
      formData.append('expectedBehavior', bugReport.expectedBehavior.trim())
      formData.append('actualBehavior', bugReport.actualBehavior.trim())
      formData.append('browserInfo', bugReport.browserInfo)
      formData.append('reportedBy', user?.id || 'anonymous')
      formData.append('reportedByName', user?.name || 'Anonymous User')
      formData.append('reportedByEmail', user?.email || '')
      
      // Add screenshots
      bugReport.screenshots.forEach((file, index) => {
        formData.append(`screenshots`, file)
      })
      
      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit bug report')
      }
      
      const result = await response.json()
      
      toast({
        title: "Bug report submitted!",
        description: `Your bug report has been submitted successfully. Report ID: ${result.id}`,
      })
      
      // Reset form
      setBugReport({
        title: '',
        description: '',
        priority: 'medium',
        category: 'functionality',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        browserInfo: getBrowserInfo(),
        screenshots: []
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Bug report submission failed:', error)
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit bug report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ui': return '🎨'
      case 'functionality': return '⚙️'
      case 'performance': return '⚡'
      case 'security': return '🔒'
      default: return '📋'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            size="sm" 
            className={`fixed bottom-4 right-4 z-50 shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
            aria-label="Report a bug"
          >
            <Bug className="h-4 w-4 mr-2" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs you encounter. Include as much detail as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Bug Title *
            </Label>
            <Input
              id="title"
              placeholder="Brief description of the bug"
              value={bugReport.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {bugReport.title.length}/200 characters
            </p>
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
              <Select value={bugReport.priority} onValueChange={(value: any) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select value={bugReport.category} onValueChange={(value: any) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ui">UI/Design</SelectItem>
                  <SelectItem value="functionality">Functionality</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Bug Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the bug in detail..."
              value={bugReport.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {bugReport.description.length}/2000 characters
            </p>
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="steps" className="text-sm font-medium">
              Steps to Reproduce
            </Label>
            <Textarea
              id="steps"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              value={bugReport.stepsToReproduce}
              onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {bugReport.stepsToReproduce.length}/1000 characters
            </p>
          </div>

          {/* Expected vs Actual Behavior */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected" className="text-sm font-medium">
                Expected Behavior
              </Label>
              <Textarea
                id="expected"
                placeholder="What should happen?"
                value={bugReport.expectedBehavior}
                onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                className="min-h-[60px] resize-none"
                maxLength={500}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="actual" className="text-sm font-medium">
                Actual Behavior
              </Label>
              <Textarea
                id="actual"
                placeholder="What actually happens?"
                value={bugReport.actualBehavior}
                onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                className="min-h-[60px] resize-none"
                maxLength={500}
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Screenshots & Attachments
            </Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images and PDF files up to 10MB each (max 5 files)
                  </p>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Browse Files
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureScreenshot}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Screenshot
                  </Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Uploaded Files */}
            {bugReport.screenshots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attached Files:</p>
                <div className="space-y-2">
                  {bugReport.screenshots.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Browser Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Browser Information
            </Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-mono break-all">
                {bugReport.browserInfo}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Report Summary</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(bugReport.priority)}>
                  {bugReport.priority.toUpperCase()}
                </Badge>
                <span>{getCategoryIcon(bugReport.category)} {bugReport.category.toUpperCase()}</span>
                <span>📎 {bugReport.screenshots.length} files</span>
              </div>
              <p>Reporter: {user?.name || 'Anonymous'} ({user?.email || 'No email'})</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !bugReport.title.trim() || !bugReport.description.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Bug Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

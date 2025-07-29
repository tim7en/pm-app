"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle } from "lucide-react"

interface TaskVerificationProps {
  taskId: string
  taskTitle: string
  isOpen: boolean
  onClose: () => void
  onVerify: (verified: boolean, reason?: string) => Promise<void>
}

export function TaskVerification({ taskId, taskTitle, isOpen, onClose, onVerify }: TaskVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [verifying, setVerifying] = useState(true)
  
  const handleVerify = async (verified: boolean) => {
    if (!verified) {
      setVerifying(false)
      return
    }
    
    setIsSubmitting(true)
    try {
      await onVerify(true)
      onClose()
    } catch (error) {
      console.error("Verification failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    
    setIsSubmitting(true)
    try {
      await onVerify(false, rejectionReason)
      onClose()
    } catch (error) {
      console.error("Rejection failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleClose = () => {
    setRejectionReason("")
    setVerifying(true)
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {verifying ? "Verify Task Completion" : "Provide Rejection Reason"}
          </DialogTitle>
        </DialogHeader>
        
        {verifying ? (
          <div className="space-y-4 py-4">
            <p>Are you sure you want to verify the completion of:</p>
            <p className="font-medium">{taskTitle}</p>
            <p className="text-sm text-muted-foreground">
              Verifying this task will mark it as complete and notify the assignee.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason why this task does not meet the requirements:
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
            />
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          {verifying ? (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleVerify(false)} 
                disabled={isSubmitting}
                className="gap-2"
              >
                <XCircle size={16} />
                Reject
              </Button>
              <Button 
                variant="default" 
                onClick={() => handleVerify(true)} 
                disabled={isSubmitting}
                className="gap-2"
              >
                <CheckCircle size={16} />
                Verify
              </Button>
            </>
          ) : (
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              Submit Rejection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  UserPlus, 
  Check, 
  X, 
  Clock,
  Building2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/use-translation'
import { format } from 'date-fns'

interface WorkspaceInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  status: 'PENDING'
  createdAt: string
  expiresAt: string
  workspace: {
    id: string
    name: string
    description: string | null
  }
  inviter: {
    id: string
    name: string | null
    email: string
  }
}

interface InvitationNotificationsProps {
  className?: string
  onInvitationUpdate?: () => void
}

export function InvitationNotifications({ 
  className = "",
  onInvitationUpdate 
}: InvitationNotificationsProps) {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { user, refreshWorkspaces } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchInvitations = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data || [])
      } else {
        console.error('Failed to fetch invitations')
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [user])

  const handleAcceptInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: t('invitations.acceptSuccess'),
          description: t('invitations.welcomeMessage', { workspaceName: result.workspace?.name || 'the team' }),
        })
        
        // Remove the accepted invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        onInvitationUpdate?.()
        
        // Refresh workspaces to show the new workspace immediately
        try {
          await refreshWorkspaces()
        } catch (error) {
          console.error('Failed to refresh workspaces after accepting invitation:', error)
        }
      } else {
        const error = await response.json()
        toast({
          title: t('invitations.acceptError'),
          description: error.error || t('invitations.acceptErrorMessage'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: t('invitations.genericError'),
        description: t('invitations.acceptErrorMessage'),
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: t('invitations.declineSuccess'),
          description: t('invitations.declineMessage'),
        })
        
        // Remove the declined invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        onInvitationUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: t('invitations.declineError'),
          description: error.error || t('invitations.declineErrorMessage'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast({
        title: t('invitations.genericError'),
        description: t('invitations.declineErrorMessage'),
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return null // Don't render anything if no invitations
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="border-l-4 border-l-blue-500 bg-blue-50/50" role="article" aria-label={`Workspace invitation to ${invitation.workspace.name}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-blue-900">
                      {t('invitations.workspaceInvitation')}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {invitation.role}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{invitation.workspace.name}</span>
                    </div>
                    
                    {invitation.workspace.description && (
                      <p className="text-xs text-muted-foreground pl-5">
                        {invitation.workspace.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 pl-5">
                      <span className="text-xs text-muted-foreground">
                        {t('invitations.invitedBy', { name: invitation.inviter.name || invitation.inviter.email })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t('invitations.expires', { date: format(new Date(invitation.expiresAt), 'MMM dd, yyyy') })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm" 
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="h-7 text-xs"
                      aria-label={`Accept invitation to ${invitation.workspace.name}`}
                    >
                      {actionLoading === invitation.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                          {t('invitations.processing')}
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          {t('invitations.accept')}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="h-7 text-xs"
                      aria-label={`Decline invitation to ${invitation.workspace.name}`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('invitations.decline')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Invitation counter hook for showing the count in notification bell
export function useInvitationCount() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()

  const fetchCount = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setCount(data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching invitation count:', error)
    }
  }

  useEffect(() => {
    fetchCount()
  }, [user])

  return { count, refetch: fetchCount }
}

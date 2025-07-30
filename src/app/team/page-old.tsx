"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { WorkspaceTeamManagement } from "@/components/teams/workspace-team-management"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@prisma/client"

export default function TeamPage() {
  const { user, currentWorkspaceId } = useAuth()
  const [userRole, setUserRole] = useState<Role | null>(null)

  useEffect(() => {
    // Get user's role in current workspace
    const fetchUserRole = async () => {
      if (!currentWorkspaceId || !user) return
      
      try {
        const response = await fetch(`/api/workspaces/${currentWorkspaceId}/members`)
        if (response.ok) {
          const members = await response.json()
          const currentUserMember = members.find((member: any) => member.userId === user.id)
          if (currentUserMember) {
            setUserRole(currentUserMember.role)
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    fetchUserRole()
  }, [currentWorkspaceId, user])

  if (!user || !currentWorkspaceId) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                <p className="text-muted-foreground">Please wait while we load your team information.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <WorkspaceTeamManagement
              workspaceId={currentWorkspaceId}
              currentUserId={user.id}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
// import { EmailCleanupCoPilot } from '@/components/email-cleanup/email-cleanup-copilot'
// import { EmailCleanupProvider } from '@/contexts/email-cleanup-context'

export default function EmailCleanupPage() {
  // Temporarily disable email cleanup functionality
  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header />
        
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-semibold text-muted-foreground mb-4">
              Email Co-Pilot Temporarily Unavailable
            </h1>
            <p className="text-muted-foreground">
              This feature is currently disabled for maintenance.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

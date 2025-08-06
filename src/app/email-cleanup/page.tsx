"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { EmailCleanupCoPilot } from '@/components/email-cleanup/email-cleanup-copilot'
import { EmailCleanupProvider } from '@/contexts/email-cleanup-context'

export default function EmailCleanupPage() {
  return (
    <EmailCleanupProvider>
      <div className="flex h-screen bg-background relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
        
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Header />
          
          {/* Email Cleanup Content */}
          <main className="flex-1 overflow-y-auto">
            <EmailCleanupCoPilot />
          </main>
        </div>
      </div>
    </EmailCleanupProvider>
  )
}

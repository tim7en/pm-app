"use client"

export const dynamic = 'force-dynamic'

import { DashboardContainer } from "@/components/dashboard/dashboard-container"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && !user) {
      router.push('/landing')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to landing page
  }

  return <DashboardContainer />
}

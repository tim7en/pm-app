"use client"

import { DashboardContainer } from "@/components/dashboard/dashboard-container"
import { withAuth } from "@/contexts/AuthContext"

function Home() {
  return <DashboardContainer />
}

export default withAuth(Home)

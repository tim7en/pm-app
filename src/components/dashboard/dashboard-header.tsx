import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

interface DashboardHeaderProps {
  onCreateTask: () => void
}

export function DashboardHeader({ onCreateTask }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button size="sm" onClick={onCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  )
}

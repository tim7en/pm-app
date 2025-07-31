import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DashboardSearch } from "./dashboard-search"
import { useTranslation } from "@/hooks/use-translation"

interface DashboardHeaderProps {
  onCreateTask: () => void
}

export function DashboardHeader({ onCreateTask }: DashboardHeaderProps) {
  const { t } = useTranslation()
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.welcomeBack")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.dashboardSubtitle")}</p>
      </div>
      <div className="flex items-center gap-4">
        <DashboardSearch />
        <Button size="sm" onClick={onCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          {t("dashboard.newTask")}
        </Button>
      </div>
    </div>
  )
}

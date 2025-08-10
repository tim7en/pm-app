import { Button } from "@/components/ui/button"
import { Plus, FolderPlus } from "lucide-react"
import { DashboardSearch } from "./dashboard-search"
import { useTranslation } from "@/hooks/use-translation"

interface DashboardHeaderProps {
  onCreateTask: () => void
  onCreateProject: () => void
}

export function DashboardHeader({ onCreateTask, onCreateProject }: DashboardHeaderProps) {
  const { t } = useTranslation()
  
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{t("dashboard.welcomeBack")}</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">{t("dashboard.dashboardSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden sm:block">
            <DashboardSearch />
          </div>
          <Button size="sm" onClick={onCreateTask} className="text-sm">
            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">{t("dashboard.newTask")}</span>
            <span className="sm:hidden">Task</span>
          </Button>
          <Button 
            size="sm" 
            onClick={onCreateProject}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-white text-sm"
          >
            <FolderPlus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">{t("header.newProject")}</span>
            <span className="sm:hidden">Project</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      <div className="sm:hidden mt-4">
        <DashboardSearch />
      </div>
    </>
  )
}

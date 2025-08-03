import { ProjectCard } from "@/components/projects/project-card"

interface ProjectManagementProps {
  projects: any[]
  onProjectEdit: (project: any) => void
  onProjectDelete: (projectId: string) => Promise<boolean>
  onProjectToggleStar: (projectId: string) => void
  onViewTasks?: (projectId: string) => void
  onGenerateInsights?: (projectId: string, projectName: string) => void
  currentUserId?: string
}

export function ProjectManagement({
  projects,
  onProjectEdit,
  onProjectDelete,
  onProjectToggleStar,
  onViewTasks,
  onGenerateInsights,
  currentUserId
}: ProjectManagementProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onEdit={onProjectEdit}
              onDelete={onProjectDelete}
              onToggleStar={onProjectToggleStar}
              onViewTasks={onViewTasks}
              onGenerateInsights={onGenerateInsights}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export interface ExportData {
  tasks: any[]
  projects: any[]
  users: any[]
  exportDate: string
  version: string
}

export const exportData = (tasks: any[], projects: any[], users: any[]) => {
  const data: ExportData = {
    tasks,
    projects,
    users,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }

  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `task-manager-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportTasksCSV = (tasks: any[]) => {
  if (tasks.length === 0) return

  const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee', 'Project', 'Created At']
  const csvContent = [
    headers.join(','),
    ...tasks.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      task.assignee?.name || 'Unassigned',
      task.project?.name || 'No Project',
      new Date(task.createdAt).toLocaleDateString()
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportProjectsCSV = (projects: any[]) => {
  if (projects.length === 0) return

  const headers = ['ID', 'Name', 'Description', 'Status', 'Owner', 'Task Count', 'Created At']
  const csvContent = [
    headers.join(','),
    ...projects.map(project => [
      project.id,
      `"${project.name.replace(/"/g, '""')}"`,
      `"${(project.description || '').replace(/"/g, '""')}"`,
      project.status,
      project.owner?.name || 'No Owner',
      project.taskCount || 0,
      new Date(project.createdAt).toLocaleDateString()
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const importDataFromFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // Validate the data structure
        if (!data.tasks || !data.projects || !data.users) {
          throw new Error('Invalid export file format')
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse export file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
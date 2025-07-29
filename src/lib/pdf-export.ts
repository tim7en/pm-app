import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportTasksToPDF = async (tasks: any[], projects: any[]) => {
  const pdf = new jsPDF()
  
  // Title
  pdf.setFontSize(20)
  pdf.text('Tasks Report', 20, 30)
  
  // Date
  pdf.setFontSize(12)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
  
  // Summary Statistics
  pdf.setFontSize(14)
  pdf.text('Summary', 20, 65)
  
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'DONE').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const overdueTasks = tasks.filter(t => {
    return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
  }).length
  
  pdf.setFontSize(10)
  pdf.text(`Total Tasks: ${totalTasks}`, 20, 80)
  pdf.text(`Completed: ${completedTasks}`, 20, 90)
  pdf.text(`In Progress: ${inProgressTasks}`, 20, 100)
  pdf.text(`Overdue: ${overdueTasks}`, 20, 110)
  
  // Tasks by Status
  pdf.setFontSize(14)
  pdf.text('Tasks by Status', 20, 130)
  
  const statusCounts = {
    'TODO': tasks.filter(t => t.status === 'TODO').length,
    'IN_PROGRESS': tasks.filter(t => t.status === 'IN_PROGRESS').length,
    'REVIEW': tasks.filter(t => t.status === 'REVIEW').length,
    'DONE': tasks.filter(t => t.status === 'DONE').length
  }
  
  pdf.setFontSize(10)
  let yPos = 145
  Object.entries(statusCounts).forEach(([status, count]) => {
    pdf.text(`${status.replace('_', ' ')}: ${count}`, 20, yPos)
    yPos += 10
  })
  
  // Tasks by Priority
  pdf.setFontSize(14)
  pdf.text('Tasks by Priority', 20, yPos + 10)
  yPos += 25
  
  const priorityCounts = {
    'LOW': tasks.filter(t => t.priority === 'LOW').length,
    'MEDIUM': tasks.filter(t => t.priority === 'MEDIUM').length,
    'HIGH': tasks.filter(t => t.priority === 'HIGH').length,
    'URGENT': tasks.filter(t => t.priority === 'URGENT').length
  }
  
  pdf.setFontSize(10)
  Object.entries(priorityCounts).forEach(([priority, count]) => {
    pdf.text(`${priority}: ${count}`, 20, yPos)
    yPos += 10
  })
  
  // Detailed Tasks List
  if (yPos > 250) {
    pdf.addPage()
    yPos = 30
  }
  
  pdf.setFontSize(14)
  pdf.text('Detailed Tasks', 20, yPos)
  yPos += 20
  
  pdf.setFontSize(8)
  pdf.text('Title', 20, yPos)
  pdf.text('Status', 80, yPos)
  pdf.text('Priority', 110, yPos)
  pdf.text('Due Date', 140, yPos)
  pdf.text('Assignee', 170, yPos)
  yPos += 10
  
  // Draw line
  pdf.line(20, yPos, 190, yPos)
  yPos += 5
  
  tasks.forEach(task => {
    if (yPos > 280) {
      pdf.addPage()
      yPos = 30
    }
    
    const title = task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'
    const assignee = task.assignee?.name || 'Unassigned'
    
    pdf.text(title, 20, yPos)
    pdf.text(task.status.replace('_', ' '), 80, yPos)
    pdf.text(task.priority, 110, yPos)
    pdf.text(dueDate, 140, yPos)
    pdf.text(assignee.length > 15 ? assignee.substring(0, 15) + '...' : assignee, 170, yPos)
    yPos += 8
  })
  
  // Save the PDF
  pdf.save(`tasks-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportProjectsToPDF = async (projects: any[]) => {
  const pdf = new jsPDF()
  
  // Title
  pdf.setFontSize(20)
  pdf.text('Projects Report', 20, 30)
  
  // Date
  pdf.setFontSize(12)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
  
  // Summary Statistics
  pdf.setFontSize(14)
  pdf.text('Summary', 20, 65)
  
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount || 0), 0)
  
  pdf.setFontSize(10)
  pdf.text(`Total Projects: ${totalProjects}`, 20, 80)
  pdf.text(`Active Projects: ${activeProjects}`, 20, 90)
  pdf.text(`Completed Projects: ${completedProjects}`, 20, 100)
  pdf.text(`Total Tasks: ${totalTasks}`, 20, 110)
  
  // Projects by Status
  pdf.setFontSize(14)
  pdf.text('Projects by Status', 20, 130)
  
  const statusCounts = {
    'ACTIVE': projects.filter(p => p.status === 'ACTIVE').length,
    'ARCHIVED': projects.filter(p => p.status === 'ARCHIVED').length,
    'COMPLETED': projects.filter(p => p.status === 'COMPLETED').length
  }
  
  pdf.setFontSize(10)
  let yPos = 145
  Object.entries(statusCounts).forEach(([status, count]) => {
    pdf.text(`${status}: ${count}`, 20, yPos)
    yPos += 10
  })
  
  // Detailed Projects List
  if (yPos > 250) {
    pdf.addPage()
    yPos = 30
  }
  
  pdf.setFontSize(14)
  pdf.text('Detailed Projects', 20, yPos)
  yPos += 20
  
  pdf.setFontSize(8)
  pdf.text('Name', 20, yPos)
  pdf.text('Status', 80, yPos)
  pdf.text('Tasks', 110, yPos)
  pdf.text('Owner', 140, yPos)
  pdf.text('Created', 170, yPos)
  yPos += 10
  
  // Draw line
  pdf.line(20, yPos, 190, yPos)
  yPos += 5
  
  projects.forEach(project => {
    if (yPos > 280) {
      pdf.addPage()
      yPos = 30
    }
    
    const name = project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name
    const owner = project.owner?.name || 'No owner'
    const created = new Date(project.createdAt).toLocaleDateString()
    
    pdf.text(name, 20, yPos)
    pdf.text(project.status, 80, yPos)
    pdf.text(`${project.taskCount || 0}`, 110, yPos)
    pdf.text(owner.length > 12 ? owner.substring(0, 12) + '...' : owner, 140, yPos)
    pdf.text(created, 170, yPos)
    yPos += 8
  })
  
  // Save the PDF
  pdf.save(`projects-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportDashboardToPDF = async (elementId: string, filename: string = 'dashboard') => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found')
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw error
  }
}
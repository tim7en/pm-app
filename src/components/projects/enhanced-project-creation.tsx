"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Brain, 
  Plus, 
  Sparkles, 
  Target, 
  Users, 
  Calendar,
  Zap,
  Star,
  ArrowRight
} from "lucide-react"
import { ProjectDialog } from "./project-dialog"
import { AIProjectCreationWizard } from "./ai-project-creation-wizard"
import { useTranslation } from "@/hooks/use-translation"

interface EnhancedProjectCreationProps {
  onCreateProject: (projectData: any, tasks?: any[], calendarEvents?: any[]) => Promise<any> // Changed to return the project data
  projects?: any[]
  workspaceMembers?: any[]
  children?: React.ReactNode
  // External dialog control props
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EnhancedProjectCreation({
  onCreateProject,
  projects = [],
  workspaceMembers = [],
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: EnhancedProjectCreationProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const [standardDialogOpen, setStandardDialogOpen] = useState(false)
  const [aiWizardOpen, setAiWizardOpen] = useState(false)
  const { t } = useTranslation()

  // Use external control if provided, otherwise use internal state
  const mainDialogOpen = externalOpen !== undefined ? externalOpen : internalDialogOpen
  const setMainDialogOpen = externalOnOpenChange || setInternalDialogOpen

  const handleAIProjectCreation = async (projectData: any, tasks: any[], calendarEvents: any[]) => {
    try {
      // First create the project
      const createdProject = await onCreateProject(projectData)
      if (!createdProject || !createdProject.id) throw new Error('Project creation failed - no project ID returned')

      console.log('✅ Project created successfully:', createdProject.id)

      // Then create tasks
      if (tasks.length > 0) {
        console.log(`🔄 Creating ${tasks.length} tasks for project ${createdProject.id}`)
        let successfulTasks = 0
        
        for (const task of tasks) {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...task,
                projectId: createdProject.id, // Use the actual project ID
                workspaceId: projectData.workspaceId,
                dueDate: task.dueDate?.toISOString(),
              })
            })
            if (response.ok) {
              successfulTasks++
              console.log(`✅ Created task: ${task.title}`)
            } else {
              const errorData = await response.json()
              console.error(`❌ Failed to create task "${task.title}":`, errorData.error)
            }
          } catch (error) {
            console.error(`❌ Error creating task "${task.title}":`, error)
          }
        }
        console.log(`📋 Successfully created ${successfulTasks}/${tasks.length} tasks`)
      }

      // Then create calendar events
      if (calendarEvents.length > 0) {
        console.log(`🔄 Creating ${calendarEvents.length} calendar events for project ${createdProject.id}`)
        let successfulEvents = 0
        
        // Map event types to API-expected types
        const mapEventType = (type: string) => {
          switch (type.toLowerCase()) {
            case 'meeting':
              return 'MEETING'
            case 'review':
              return 'MEETING'
            case 'planning':
              return 'MEETING'
            case 'milestone':
              return 'DEADLINE'
            default:
              return 'MEETING'
          }
        }
        
        for (const event of calendarEvents) {
          try {
            // Ensure proper date handling for calendar events
            const startTime = new Date(event.startTime || event.date)
            let endTime = new Date(event.endTime || event.date)
            
            // Ensure endTime is after startTime (required by API validation)
            if (endTime <= startTime) {
              // Add duration from event, or default to 1 hour
              const durationHours = event.duration || 1
              endTime = new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000))
            }
            
            console.log(`📅 Creating calendar event: ${event.title}`)
            console.log(`   ⏰ Start: ${startTime.toISOString()}`)
            console.log(`   ⏰ End: ${endTime.toISOString()}`)
            console.log(`   📍 Type: ${mapEventType(event.type)}`)
            
            const response = await fetch('/api/calendar/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: event.title,
                description: event.description,
                projectId: createdProject.id, // Use the actual project ID
                workspaceId: projectData.workspaceId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                type: mapEventType(event.type), // Map the type to API-expected values
                location: event.location,
                notificationEnabled: event.notificationEnabled !== false, // Default to true
              })
            })
            
            if (response.ok) {
              successfulEvents++
              console.log(`✅ Created calendar event: ${event.title}`)
            } else {
              const errorData = await response.json()
              console.error(`❌ Failed to create calendar event "${event.title}":`, errorData.error)
            }
          } catch (error) {
            console.error(`❌ Error creating calendar event "${event.title}":`, error)
          }
        }
        console.log(`📅 Successfully created ${successfulEvents}/${calendarEvents.length} calendar events`)
      }

      setAiWizardOpen(false)
      setMainDialogOpen(false)
      
      console.log('🎉 AI project creation completed successfully!')
    } catch (error) {
      console.error('❌ AI project creation error:', error)
      throw error
    }
  }

  const handleStandardProjectCreation = async (projectData: any) => {
    const createdProject = await onCreateProject(projectData)
    if (createdProject && createdProject.id) {
      setStandardDialogOpen(false)
      setMainDialogOpen(false)
    }
  }

  return (
    <>
      <Dialog open={mainDialogOpen} onOpenChange={setMainDialogOpen}>
        {children && (
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
        )}
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("projects.createNew")}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t("projects.chooseCreationMethod")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* AI-Powered Creation - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 hover:border-blue-300 hover:shadow-xl transition-all duration-500 cursor-pointer group"
                onClick={() => {
                  setMainDialogOpen(false)
                  setAiWizardOpen(true)
                }}
              >
                {/* Recommended Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 font-semibold shadow-md">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {t("ai.recommended")}
                  </Badge>
                </div>
                
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg">
                        <Brain className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          {t("ai.wizard.aiPoweredCreation")}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {t("ai.wizard.aiCreationDesc")}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span>{t("ai.wizard.features.smartTasks")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span>{t("ai.wizard.features.timelineOptimization")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>{t("ai.wizard.features.calendarIntegration")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span>{t("ai.wizard.features.teamAssignments")}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMainDialogOpen(false)
                          setAiWizardOpen(true)
                        }}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        {t("ai.wizard.startAICreation")}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Standard Creation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  setMainDialogOpen(false)
                  setStandardDialogOpen(true)
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl group-hover:scale-105 transition-transform duration-300">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {t("projects.standardCreation")}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("projects.standardCreationDesc")}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{t("projects.traditional")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{t("projects.manualSetup")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMainDialogOpen(false)
                        setStandardDialogOpen(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("projects.createStandard")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t("ai.wizard.chooseBestOption")}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard Project Dialog */}
      <ProjectDialog
        open={standardDialogOpen}
        onOpenChange={setStandardDialogOpen}
        onSubmit={handleStandardProjectCreation}
      />

      {/* AI Project Creation Wizard */}
      <AIProjectCreationWizard
        open={aiWizardOpen}
        onOpenChange={setAiWizardOpen}
        onSubmit={handleAIProjectCreation}
        projects={projects}
        workspaceMembers={workspaceMembers}
      />
    </>
  )
}

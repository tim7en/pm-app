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
  onCreateProject: (projectData: any, tasks?: any[], calendarEvents?: any[]) => Promise<boolean>
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
      const success = await onCreateProject(projectData)
      if (!success) throw new Error('Project creation failed')

      // Then create tasks
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...task,
                projectId: projectData.id || 'new-project', // This would be the actual project ID
                dueDate: task.dueDate?.toISOString(),
              })
            })
            if (!response.ok) {
              console.error('Failed to create task:', task.title)
            }
          } catch (error) {
            console.error('Error creating task:', error)
          }
        }
      }

      // Then create calendar events
      if (calendarEvents.length > 0) {
        for (const event of calendarEvents) {
          try {
            const response = await fetch('/api/calendar/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...event,
                projectId: projectData.id || 'new-project',
                workspaceId: projectData.workspaceId,
                startTime: new Date(event.startTime).toISOString(),
                endTime: new Date(event.endTime).toISOString(),
              })
            })
            if (!response.ok) {
              console.error('Failed to create calendar event:', event.title)
            }
          } catch (error) {
            console.error('Error creating calendar event:', error)
          }
        }
      }

      setAiWizardOpen(false)
      setMainDialogOpen(false)
    } catch (error) {
      console.error('AI project creation error:', error)
      throw error
    }
  }

  const handleStandardProjectCreation = async (projectData: any) => {
    const success = await onCreateProject(projectData)
    if (success) {
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t("projects.createNew")}
            </DialogTitle>
            <DialogDescription>
              {t("projects.chooseCreationMethod")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-6">
            {/* AI-Powered Creation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:border-blue-300 hover:shadow-xl transition-all duration-500 cursor-pointer group"
                onClick={() => {
                  setMainDialogOpen(false)
                  setAiWizardOpen(true)
                }}
              >
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse">
                    {t("ai.recommended")}
                  </Badge>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full mb-4 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-center text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t("ai.wizard.aiPoweredCreation")}
                  </CardTitle>
                  <CardDescription className="text-center text-sm leading-relaxed">
                    {t("ai.wizard.aiCreationDesc")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center gap-3 text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm" />
                      <span className="font-medium">{t("ai.wizard.features.smartTasks")}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3 text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-sm" />
                      <span className="font-medium">{t("ai.wizard.features.timelineOptimization")}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3 text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm" />
                      <span className="font-medium">{t("ai.wizard.features.calendarIntegration")}</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3 text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-sm" />
                      <span className="font-medium">{t("ai.wizard.features.teamAssignments")}</span>
                    </motion.div>
                  </div>

                  <div className="pt-4 border-t border-blue-200/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span className="font-medium">{t("ai.wizard.aiPowered")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{t("ai.recommended")}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMainDialogOpen(false)
                      setAiWizardOpen(true)
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {t("ai.wizard.startAICreation")}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
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
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-center">
                    {t("projects.standardCreation")}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {t("projects.standardCreationDesc")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>{t("projects.features.basicSetup")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>{t("projects.features.manualTasks")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>{t("projects.features.customTimeline")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span>{t("projects.features.fullControl")}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>{t("projects.traditional")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{t("projects.manualSetup")}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMainDialogOpen(false)
                      setStandardDialogOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("projects.createStandard")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="flex items-center justify-center pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
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

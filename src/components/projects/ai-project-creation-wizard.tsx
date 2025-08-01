"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Brain, 
  Sparkles, 
  Calendar as CalendarIcon,
  Users,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Wand2,
  Rocket,
  Lightbulb,
  MapPin,
  Mail,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  Plus
} from "lucide-react"
import { format, addDays, addWeeks, addMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.date().optional(),
  workspaceId: z.string().min(1, "Workspace is required"),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface GeneratedTask {
  id: string
  title: string
  description: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  estimatedHours: number
  dependsOn?: string[]
  assigneeId?: string
  dueDate?: Date
  category: string
  tags: string[]
  status: "TODO" | "IN_PROGRESS" | "DONE"
}

interface AIProjectCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (projectData: any, tasks: GeneratedTask[], calendarEvents: any[]) => Promise<void>
  projects?: any[]
  workspaceMembers?: any[]
}

enum WizardStep {
  PROJECT_INFO = 0,
  AI_ANALYSIS = 1,
  TASK_GENERATION = 2,
  TASK_REVIEW = 3,
  CALENDAR_INTEGRATION = 4,
  FINAL_REVIEW = 5,
  CREATING = 6,
  SUCCESS = 7
}

const projectCategories = [
  { value: "software", label: "Software Development", icon: "💻" },
  { value: "marketing", label: "Marketing Campaign", icon: "📈" },
  { value: "design", label: "Design Project", icon: "🎨" },
  { value: "research", label: "Research & Development", icon: "🔬" },
  { value: "event", label: "Event Planning", icon: "🎉" },
  { value: "business", label: "Business Development", icon: "💼" },
  { value: "training", label: "Training & Education", icon: "📚" },
  { value: "other", label: "Other", icon: "📋" }
]

export function AIProjectCreationWizard({
  open,
  onOpenChange,
  onSubmit,
  projects = [],
  workspaceMembers = []
}: AIProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(WizardStep.PROJECT_INFO)
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string>>({})
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { user, currentWorkspaceId } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      priority: "MEDIUM",
      workspaceId: currentWorkspaceId || "",
    },
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(WizardStep.PROJECT_INFO)
      setGeneratedTasks([])
      setCalendarEvents([])
      setAiAnalysis(null)
      setSelectedTasks(new Set())
      setTaskAssignments({})
      setProgress(0)
      form.reset()
    }
  }, [open, form])

  // Auto-select all tasks initially
  useEffect(() => {
    if (generatedTasks.length > 0) {
      setSelectedTasks(new Set(generatedTasks.map(task => task.id)))
    }
  }, [generatedTasks])

  const stepTitles = {
    [WizardStep.PROJECT_INFO]: t("ai.wizard.projectInfo"),
    [WizardStep.AI_ANALYSIS]: t("ai.wizard.aiAnalysis"),
    [WizardStep.TASK_GENERATION]: t("ai.wizard.taskGeneration"),
    [WizardStep.TASK_REVIEW]: t("ai.wizard.taskReview"),
    [WizardStep.CALENDAR_INTEGRATION]: t("ai.wizard.calendarIntegration"),
    [WizardStep.FINAL_REVIEW]: t("ai.wizard.finalReview"),
    [WizardStep.CREATING]: t("ai.wizard.creating"),
    [WizardStep.SUCCESS]: t("ai.wizard.success")
  }

  const stepDescriptions = {
    [WizardStep.PROJECT_INFO]: t("ai.wizard.welcomeDesc"),
    [WizardStep.AI_ANALYSIS]: t("ai.wizard.analyzingDesc"),
    [WizardStep.TASK_GENERATION]: t("ai.wizard.generatingTasksDesc"),
    [WizardStep.TASK_REVIEW]: t("ai.wizard.reviewTasksDesc"),
    [WizardStep.CALENDAR_INTEGRATION]: t("ai.wizard.calendarIntegrationDesc"),
    [WizardStep.FINAL_REVIEW]: t("ai.wizard.finalReviewDesc"),
    [WizardStep.CREATING]: t("ai.wizard.creatingDesc"),
    [WizardStep.SUCCESS]: t("ai.wizard.successDesc")
  }

  const nextStep = () => {
    console.log('🔄 nextStep called, current step:', currentStep, 'max step:', WizardStep.SUCCESS)
    if (currentStep < WizardStep.SUCCESS) {
      const newStep = currentStep + 1
      const newProgress = ((newStep) / WizardStep.SUCCESS) * 100
      console.log('➡️ Advancing from step', currentStep, 'to step', newStep, 'progress:', newProgress + '%')
      setCurrentStep(newStep)
      setProgress(newProgress)
    } else {
      console.log('⚠️ Already at final step, cannot advance further')
    }
  }

  const prevStep = () => {
    if (currentStep > WizardStep.PROJECT_INFO) {
      setCurrentStep(currentStep - 1)
      setProgress(((currentStep - 1) / WizardStep.SUCCESS) * 100)
    }
  }

  const generateAITasks = async (projectData: ProjectFormData) => {
    console.log('🚀 Starting AI task generation...', { projectData })
    setIsGenerating(true)
    try {
      // For demo purposes, use mock data based on project description keywords
      // In production, this would call the actual AI API
      console.log('📦 Importing mock data...')
      const { mockProjectScenarios, generateProjectInsights } = await import('@/data/ai-mock-data')
      console.log('✅ Mock data imported successfully', { scenarioCount: mockProjectScenarios.length })
      
      // Simple keyword matching to select appropriate mock scenario
      let selectedScenario = mockProjectScenarios[0] // default
      
      const description = projectData.description.toLowerCase()
      console.log('🔍 Analyzing project description:', description)
      
      if (description.includes('ecommerce') || description.includes('shopping') || description.includes('store')) {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'ecommerce-platform') || selectedScenario
        console.log('🛒 Selected e-commerce scenario')
      } else if (description.includes('mobile') || description.includes('app') || description.includes('fitness')) {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'mobile-fitness-app') || selectedScenario
        console.log('📱 Selected mobile app scenario')
      } else if (description.includes('ai') || description.includes('chatbot') || description.includes('bot')) {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'ai-chatbot') || selectedScenario
        console.log('🤖 Selected AI chatbot scenario')
      } else {
        console.log('📋 Using default scenario')
      }
      
      console.log('🎯 Selected scenario:', selectedScenario.name)
      
      // Simulate API delay for realistic experience
      console.log('⏳ Simulating AI analysis delay...')
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Set AI analysis with mock data
      console.log('🧠 Generating AI insights...')
      const insights = generateProjectInsights(selectedScenario)
      setAiAnalysis({
        complexity: selectedScenario.aiAnalysis.complexity,
        estimatedHours: selectedScenario.aiAnalysis.estimatedHours,
        recommendedTeamSize: selectedScenario.aiAnalysis.teamSize,
        keyTechnologies: selectedScenario.aiAnalysis.keyTechnologies,
        riskAssessment: selectedScenario.aiAnalysis.riskLevel,
        timeline: selectedScenario.expectedDuration,
        recommendations: selectedScenario.aiAnalysis.recommendations,
        insights: insights
      })
      console.log('✅ AI analysis set successfully')

      // Simulate task generation delay
      console.log('⏳ Simulating task generation delay...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Convert mock tasks to the expected format
      console.log('📋 Converting tasks to expected format...')
      const tasks = selectedScenario.generatedTasks.map((task, index) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dependsOn: task.dependsOn || [],
        assigneeId: undefined, // Will be assigned later
        dueDate: projectData.dueDate ? new Date(projectData.dueDate.getTime() + (index * 24 * 60 * 60 * 1000)) : undefined,
        category: task.category,
        tags: task.tags,
        status: 'TODO' as const
      }))
      
      console.log('✅ Generated tasks:', tasks.length, 'tasks')
      setGeneratedTasks(tasks)
      
      // Generate calendar events
      console.log('📅 Generating calendar events...')
      const events = selectedScenario.calendarEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        duration: event.duration,
        type: event.type,
        attendees: event.attendees
      }))
      
      console.log('✅ Generated calendar events:', events.length, 'events')
      setCalendarEvents(events)

      // Advance to next step after successful generation
      console.log('➡️ Advancing to next step...')
      nextStep()
      console.log('✅ AI task generation completed successfully!')

    } catch (error) {
      console.error('❌ AI task generation failed:', error)
      
      // Fallback: Generate basic tasks
      console.log('🔄 Using fallback task generation...')
      const fallbackTasks = [
        {
          id: '1',
          title: t("ai.tasks.planning"),
          description: t("ai.tasks.planningDesc"),
          priority: 'HIGH' as const,
          estimatedHours: 8,
          dependsOn: [],
          category: 'Planning',
          tags: ['planning', 'setup'],
          status: 'TODO' as const
        },
        {
          id: '2',
          title: t("ai.tasks.development"),
          description: t("ai.tasks.developmentDesc"),
          priority: 'HIGH' as const,
          estimatedHours: 40,
          dependsOn: ['1'],
          category: 'Development',
          tags: ['development', 'core'],
          status: 'TODO' as const
        },
        {
          id: '3',
          title: t("ai.tasks.testing"),
          description: t("ai.tasks.testingDesc"),
          priority: 'MEDIUM' as const,
          estimatedHours: 16,
          dependsOn: ['2'],
          category: 'Testing',
          tags: ['testing', 'qa'],
          status: 'TODO' as const
        }
      ]
      
      setGeneratedTasks(fallbackTasks)
      setAiAnalysis({
        complexity: 'Medium',
        estimatedHours: 64,
        recommendedTeamSize: 2,
        keyTechnologies: ['React', 'Node.js'],
        riskAssessment: 'Low',
        timeline: '4-6 weeks',
        recommendations: [t("ai.error.generation")]
      })

      toast({
        title: t("ai.error.title"),
        description: t("ai.error.generation"),
        variant: "destructive"
      })
    }
    setIsGenerating(false)
  }

  const generateCalendarEvents = (tasks: GeneratedTask[], projectDueDate?: Date) => {
    const events: any[] = []
    const today = new Date()
    
    // Create project kickoff event
    events.push({
      id: `project-kickoff-${Date.now()}`,
      title: t("ai.calendar.kickoff"),
      description: t("ai.calendar.kickoffDesc"),
      startTime: today,
      endTime: addDays(today, 1),
      type: "MEETING",
      notificationEnabled: true
    })

    // Create milestone events based on task dependencies
    const milestones = tasks.filter(task => 
      task.category === "milestone" || 
      task.priority === "HIGH" ||
      tasks.some(t => t.dependsOn?.includes(task.id))
    )

    milestones.forEach((milestone, index) => {
      const startDate = addWeeks(today, (index + 1) * 2)
      events.push({
        id: `milestone-${milestone.id}`,
        title: `${t("ai.calendar.milestone")}: ${milestone.title}`,
        description: milestone.description,
        startTime: startDate,
        endTime: startDate,
        type: "DEADLINE",
        notificationEnabled: true
      })
    })

    // Create review meetings
    if (projectDueDate) {
      const reviewDate = addDays(projectDueDate, -7)
      events.push({
        id: `project-review-${Date.now()}`,
        title: t("ai.calendar.finalReview"),
        description: t("ai.calendar.finalReviewDesc"),
        startTime: reviewDate,
        endTime: reviewDate,
        type: "MEETING",
        notificationEnabled: true
      })
    }

    return events
  }

  const handleSubmit = async () => {
    const formData = form.getValues()
    const selectedTasksList = generatedTasks.filter(task => selectedTasks.has(task.id))
    
    // Apply task assignments
    const tasksWithAssignments = selectedTasksList.map(task => ({
      ...task,
      assigneeId: taskAssignments[task.id] || undefined
    }))

    setCurrentStep(WizardStep.CREATING)
    
    try {
      await onSubmit(formData, tasksWithAssignments, calendarEvents)
      setCurrentStep(WizardStep.SUCCESS)
      toast({
        title: t("ai.success.title"),
        description: t("ai.success.projectCreated")
      })
    } catch (error) {
      console.error('Project creation error:', error)
      toast({
        title: t("ai.error.title"),
        description: t("ai.error.creation"),
        variant: "destructive"
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-green-100 text-green-800"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800"
      case "HIGH": return "bg-orange-100 text-orange-800"
      case "URGENT": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.PROJECT_INFO:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold">{t("ai.wizard.welcome")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.welcomeDesc")}</p>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.name")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t("ai.wizard.projectNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.description")} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("ai.wizard.descriptionPlaceholder")}
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("projects.category")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("projects.selectCategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectCategories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("tasks.priority")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">{t("tasks.lowPriority")}</SelectItem>
                            <SelectItem value="MEDIUM">{t("tasks.mediumPriority")}</SelectItem>
                            <SelectItem value="HIGH">{t("tasks.highPriority")}</SelectItem>
                            <SelectItem value="URGENT">{t("tasks.urgentPriority")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("projects.dueDate")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("projects.pickDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </motion.div>
        )

      case WizardStep.AI_ANALYSIS:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">{t("ai.wizard.analyzing")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.analyzingDesc")}</p>
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.projectScopeAnalysis")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-3 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.teamAnalysis")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-3 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.timelineOptimization")}</span>
              </motion.div>
            </div>

            <Button
              onClick={() => generateAITasks(form.getValues())}
              disabled={isGenerating}
              className="mt-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("ai.wizard.generating")}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {t("ai.wizard.startGeneration")}
                </>
              )}
            </Button>
          </motion.div>
        )

      case WizardStep.TASK_GENERATION:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto"
            >
              <Wand2 className="w-8 h-8 text-white" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">{t("ai.wizard.generatingTasks")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.generatingTasksDesc")}</p>
            </div>

            <div className="max-w-md mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(progress)}% {t("common.complete")}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>{t("ai.wizard.creatingTasks")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{t("ai.wizard.optimizingTimeline")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-purple-500" />
                <span>{t("ai.wizard.assigningMembers")}</span>
              </motion.div>
            </div>
          </motion.div>
        )

      case WizardStep.TASK_REVIEW:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{t("ai.wizard.reviewTasks")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.reviewTasksDesc")}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTasks.size === generatedTasks.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTasks(new Set(generatedTasks.map(task => task.id)))
                    } else {
                      setSelectedTasks(new Set())
                    }
                  }}
                />
                <span className="text-sm font-medium">
                  {t("ai.wizard.selectAll")} ({generatedTasks.length} {t("tasks.tasks")})
                </span>
              </div>
              
              <Badge variant="outline">
                {selectedTasks.size} {t("ai.wizard.selected")}
              </Badge>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              <AnimatePresence>
                {generatedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "border rounded-lg p-4",
                      selectedTasks.has(task.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedTasks)
                          if (checked) {
                            newSelected.add(task.id)
                          } else {
                            newSelected.delete(task.id)
                          }
                          setSelectedTasks(newSelected)
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedHours}h</span>
                          </div>
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{format(task.dueDate, "MMM dd")}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{task.category}</span>
                          </div>
                        </div>

                        {/* Task assignment */}
                        <div className="pt-2">
                          <Select
                            value={taskAssignments[task.id] || ""}
                            onValueChange={(value) => {
                              setTaskAssignments(prev => ({
                                ...prev,
                                [task.id]: value
                              }))
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={t("tasks.assignTo")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">{t("tasks.unassigned")}</SelectItem>
                              {workspaceMembers.map((member) => (
                                <SelectItem key={member.id} value={member.user.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={member.user.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.user.name || member.user.email}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )

      case WizardStep.CALENDAR_INTEGRATION:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{t("ai.wizard.calendarIntegration")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.calendarDesc")}</p>
            </div>

            <div className="grid gap-4">
              {calendarEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(event.startTime), "MMM dd, yyyy")}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {t("ai.wizard.emailNotifications")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.notifyTeam")}</span>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.weeklyDigest")}</span>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.milestoneReminders")}</span>
                    <Checkbox defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case WizardStep.FINAL_REVIEW:
        const formData = form.getValues()
        const selectedTasksList = generatedTasks.filter(task => selectedTasks.has(task.id))
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{t("ai.wizard.finalReview")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.finalReviewDesc")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("projects.projectDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">{t("projects.name")}:</span>
                    <p className="text-sm text-muted-foreground">{formData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t("projects.category")}:</span>
                    <p className="text-sm text-muted-foreground">
                      {projectCategories.find(c => c.value === formData.category)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t("tasks.priority")}:</span>
                    <Badge className={getPriorityColor(formData.priority)}>
                      {formData.priority}
                    </Badge>
                  </div>
                  {formData.dueDate && (
                    <div>
                      <span className="text-sm font-medium">{t("projects.dueDate")}:</span>
                      <p className="text-sm text-muted-foreground">
                        {format(formData.dueDate, "PPP")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("ai.wizard.summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("tasks.tasks")}:</span>
                    <Badge variant="outline">{selectedTasksList.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.calendarEvents")}:</span>
                    <Badge variant="outline">{calendarEvents.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.estimatedHours")}:</span>
                    <Badge variant="outline">
                      {selectedTasksList.reduce((total, task) => total + task.estimatedHours, 0)}h
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("ai.wizard.assignedMembers")}:</span>
                    <Badge variant="outline">
                      {new Set(Object.values(taskAssignments).filter(Boolean)).size}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                {t("ai.wizard.readyToCreate")}
              </span>
            </div>
          </motion.div>
        )

      case WizardStep.CREATING:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto"
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
            
            <div>
              <h3 className="text-2xl font-bold mb-2">{t("ai.wizard.creating")}</h3>
              <p className="text-muted-foreground">{t("ai.wizard.creatingDesc")}</p>
            </div>

            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.creatingProject")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.creatingTasks")}</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center justify-center gap-2 text-sm"
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>{t("ai.wizard.schedulingEvents")}</span>
              </motion.div>
            </div>
          </motion.div>
        )

      case WizardStep.SUCCESS:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-green-600 mb-2"
              >
                {t("ai.wizard.successTitle")}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-muted-foreground"
              >
                {t("ai.wizard.successDesc")}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-4"
            >
              <Button onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </motion.div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            {stepTitles[currentStep]}
          </DialogTitle>
          <DialogDescription>
            {stepDescriptions[currentStep]}
          </DialogDescription>
          {currentStep < WizardStep.CREATING && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1}/{WizardStep.SUCCESS + 1}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-1">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {currentStep < WizardStep.CREATING && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === WizardStep.PROJECT_INFO || isGenerating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === WizardStep.PROJECT_INFO && (
                <Button
                  onClick={async () => {
                    const isValid = await form.trigger()
                    if (isValid) {
                      nextStep()
                    }
                  }}
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === WizardStep.TASK_REVIEW && (
                <Button onClick={nextStep} disabled={selectedTasks.size === 0}>
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === WizardStep.CALENDAR_INTEGRATION && (
                <Button onClick={nextStep}>
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === WizardStep.FINAL_REVIEW && (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  <Rocket className="w-4 h-4 mr-2" />
                  {t("ai.wizard.createProject")}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

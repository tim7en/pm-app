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
import { projectColorGenerator } from "@/lib/project-color-generator"

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
  { value: "concept", label: "Concept Note/Proposal", icon: "📄" },
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
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
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
      setSelectedEvents(new Set())
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

  // Auto-select all calendar events initially
  useEffect(() => {
    if (calendarEvents.length > 0) {
      setSelectedEvents(new Set(calendarEvents.map(event => event.id)))
    }
  }, [calendarEvents])

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
      
      // Enhanced matching logic considering both category and description
      let selectedScenario = mockProjectScenarios[0] // default
      
      const description = projectData.description.toLowerCase()
      const category = projectData.category.toLowerCase()
      console.log('🔍 Analyzing project:', { category, description: description.substring(0, 100) + '...' })
      
      // First try to match by category
      if (category === 'marketing') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'marketing-campaign') || selectedScenario
        console.log('📈 Selected marketing campaign scenario')
      } else if (category === 'event') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'event-planning') || selectedScenario
        console.log('🎉 Selected event planning scenario')
      } else if (category === 'business') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'business-development') || selectedScenario
        console.log('💼 Selected business development scenario')
      } else if (category === 'research') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'research-project') || selectedScenario
        console.log('🔬 Selected research project scenario')
      } else if (category === 'design') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'concept-note-development') || selectedScenario
        console.log('📝 Selected concept note development scenario')
      } else if (category === 'concept') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'concept-note-development') || selectedScenario
        console.log('📄 Selected concept note development scenario')
      } else if (category === 'training') {
        selectedScenario = mockProjectScenarios.find(s => s.id === 'training-program') || selectedScenario
        console.log('📚 Selected training program scenario')
      } else if (category === 'software') {
        // For software, use description keywords to pick the right type
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
          selectedScenario = mockProjectScenarios.find(s => s.id === 'ecommerce-platform') || selectedScenario
          console.log('🛒 Selected default software scenario (e-commerce)')
        }
      } else {
        // Fallback to description-based matching for other categories
        if (description.includes('research') || description.includes('study') || description.includes('analysis') || description.includes('survey')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'research-project') || selectedScenario
          console.log('🔬 Selected research scenario by description')
        } else if (description.includes('concept') || description.includes('proposal') || description.includes('note') || description.includes('document')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'concept-note-development') || selectedScenario
          console.log('📝 Selected concept note scenario by description')
        } else if (description.includes('training') || description.includes('education') || description.includes('learning') || description.includes('curriculum')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'training-program') || selectedScenario
          console.log('📚 Selected training scenario by description')
        } else if (description.includes('marketing') || description.includes('campaign') || description.includes('promotion')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'marketing-campaign') || selectedScenario
          console.log('� Selected marketing scenario by description')
        } else if (description.includes('event') || description.includes('conference') || description.includes('meeting')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'event-planning') || selectedScenario
          console.log('🎉 Selected event scenario by description')
        } else if (description.includes('business') || description.includes('partnership') || description.includes('development')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'business-development') || selectedScenario
          console.log('💼 Selected business scenario by description')
        } else if (description.includes('ecommerce') || description.includes('shopping') || description.includes('store')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'ecommerce-platform') || selectedScenario
          console.log('🛒 Selected e-commerce scenario by description')
        } else if (description.includes('mobile') || description.includes('app') || description.includes('fitness')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'mobile-fitness-app') || selectedScenario
          console.log('📱 Selected mobile app scenario by description')
        } else if (description.includes('ai') || description.includes('chatbot') || description.includes('bot')) {
          selectedScenario = mockProjectScenarios.find(s => s.id === 'ai-chatbot') || selectedScenario
          console.log('🤖 Selected AI chatbot scenario by description')
        } else {
          // Default to research project for general cases
          selectedScenario = mockProjectScenarios.find(s => s.id === 'research-project') || selectedScenario
          console.log('� Using default scenario (research project)')
        }
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
      
      // Convert mock tasks to the expected format with intelligent scheduling
      console.log('📋 Converting tasks to expected format with smart scheduling...')
      
      // Calculate intelligent task scheduling based on project deadline and priority
      type MockTask = {
        id: string
        title: string
        description: string
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
        estimatedHours: number
        dependsOn?: string[]
        category: string
        tags: string[]
        phase: string
      }
      
      type ScheduledTask = MockTask & {
        dueDate: Date
        scheduledDays: number
        originalIndex: number
      }
      
      const calculateTaskSchedule = (tasks: MockTask[], projectDueDate: Date | undefined, projectPriority: string): ScheduledTask[] => {
        if (!projectDueDate) {
          console.log('⚠️ No project deadline provided, using default scheduling')
          return tasks.map((task, index) => ({
            ...task,
            dueDate: addDays(new Date(), index * 2), // Default: space tasks 2 days apart
            scheduledDays: 2,
            originalIndex: index
          }))
        }

        const today = new Date()
        const totalProjectDays = Math.max(1, Math.floor((projectDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
        
        console.log(`📅 Project timeline: ${totalProjectDays} days until deadline (${projectDueDate.toDateString()})`)
        
        // Priority-based urgency multipliers
        const urgencyMultipliers = {
          'URGENT': 0.6,    // Complete in 60% of available time
          'HIGH': 0.75,     // Complete in 75% of available time  
          'MEDIUM': 0.85,   // Complete in 85% of available time
          'LOW': 0.95       // Use almost all available time
        }
        
        const urgencyMultiplier = urgencyMultipliers[projectPriority as keyof typeof urgencyMultipliers] || 0.85
        const effectiveProjectDays = Math.floor(totalProjectDays * urgencyMultiplier)
        
        console.log(`⚡ Urgency adjustment: ${projectPriority} priority → ${effectiveProjectDays} days for execution (${(urgencyMultiplier * 100).toFixed(0)}% of timeline)`)
        
        // Create dependency map
        const dependencyMap = new Map<string, string[]>()
        tasks.forEach(task => {
          dependencyMap.set(task.id, task.dependsOn || [])
        })
        
        // Topological sort to order tasks by dependencies
        const sortedTasks: MockTask[] = []
        const visited = new Set<string>()
        const temp = new Set<string>()
        
        const visit = (taskId: string): void => {
          if (temp.has(taskId)) return // Circular dependency, skip
          if (visited.has(taskId)) return
          
          temp.add(taskId)
          const task = tasks.find(t => t.id === taskId)
          if (task) {
            (dependencyMap.get(taskId) || []).forEach((depId: string) => visit(depId))
            temp.delete(taskId)
            visited.add(taskId)
            sortedTasks.push(task)
          }
        }
        
        tasks.forEach(task => visit(task.id))
        
        // Calculate dates for sorted tasks
        let currentDate = new Date(today)
        const scheduledTasks: ScheduledTask[] = []
        
        for (const task of sortedTasks) {
          // Task priority affects individual scheduling
          const taskPriorityDays = {
            'URGENT': 1,      // Complete urgent tasks quickly
            'HIGH': 2,        // High priority tasks get 2 days
            'MEDIUM': 3,      // Medium priority tasks get 3 days  
            'LOW': 4          // Low priority tasks get 4 days
          }
          
          const baseDays = taskPriorityDays[task.priority] || 3
          
          // Adjust based on estimated hours (more hours = more days)
          const estimatedDays = Math.max(1, Math.ceil(task.estimatedHours / 8)) // 8 hours per day
          const actualDays = Math.max(baseDays, estimatedDays)
          
          const taskDueDate = addDays(currentDate, actualDays)
          
          // Ensure we don't exceed the project deadline
          const finalDueDate = taskDueDate > projectDueDate ? projectDueDate : taskDueDate
          
          scheduledTasks.push({
            ...task,
            dueDate: finalDueDate,
            scheduledDays: actualDays,
            originalIndex: tasks.indexOf(task)
          })
          
          // Move current date forward, but with some overlap for parallel work
          currentDate = addDays(currentDate, Math.max(1, Math.floor(actualDays * 0.7))) // 30% overlap
        }
        
        console.log(`📋 Scheduled ${scheduledTasks.length} tasks over ${effectiveProjectDays} days`)
        console.log('📅 Task scheduling summary:')
        scheduledTasks.slice(0, 5).forEach(task => {
          console.log(`   • ${task.title}: ${task.dueDate?.toDateString()} (${task.priority} priority, ${task.estimatedHours}h)`)
        })
        
        return scheduledTasks
      }
      
      const scheduledTasks = calculateTaskSchedule(selectedScenario.generatedTasks, projectData.dueDate, projectData.priority)
      
      const tasks = scheduledTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dependsOn: task.dependsOn || [],
        assigneeId: undefined, // Will be assigned later
        dueDate: task.dueDate,
        category: task.category,
        tags: task.tags,
        status: 'TODO' as const
      }))
      
      console.log('✅ Generated tasks:', tasks.length, 'tasks')
      setGeneratedTasks(tasks)
      
      // Generate calendar events with proper deadline integration
      console.log('📅 Generating calendar events with deadline awareness...')
      console.log('🎯 Project deadline:', projectData.dueDate?.toDateString())
      console.log('⚡ Project priority:', projectData.priority)
      
      // Convert scheduled tasks to GeneratedTask format for calendar generation
      const generatedTasksForCalendar: GeneratedTask[] = scheduledTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        dependsOn: task.dependsOn || [],
        assigneeId: undefined,
        dueDate: task.dueDate,
        category: task.category,
        tags: task.tags,
        status: 'TODO' as const
      }))
      
      // Generate intelligent calendar events that respect project deadlines
      const events = generateCalendarEvents(generatedTasksForCalendar, projectData.dueDate, projectData)
      
      // Generate consistent project color for all events
      const projectColor = projectColorGenerator.generateProjectColor(
        projectData.name || "Untitled Project", 
        currentWorkspaceId || "default"
      )
      
      // Also include scenario-specific events but with proper date alignment and consistent colors
      const scenarioEvents = selectedScenario.calendarEvents.map((event, index) => {
        const today = new Date()
        const deadline = projectData.dueDate || addDays(today, 30)
        
        console.log(`📅 Processing scenario event: ${event.title}`)
        console.log(`   🎯 Project deadline: ${deadline.toDateString()}`)
        
        // Distribute scenario events evenly within project timeline
        const totalDays = Math.max(1, Math.floor((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
        const eventSpacing = Math.max(1, Math.floor(totalDays / (selectedScenario.calendarEvents.length + 1)))
        const eventDate = addDays(today, (index + 1) * eventSpacing)
        
        // Ensure event doesn't exceed deadline
        const finalEventDate = eventDate > deadline ? addDays(deadline, -1) : eventDate
        
        // Set proper meeting times based on event type
        const startTime = new Date(finalEventDate)
        startTime.setHours(10 + (index % 6), 0, 0, 0) // Stagger times between 10 AM - 4 PM
        
        const endTime = new Date(startTime)
        const duration = event.duration || 1 // Default to 1 hour
        endTime.setHours(startTime.getHours() + duration, 0, 0, 0)
        
        // Enhance description with deadline awareness
        const daysUntilDeadline = Math.floor((deadline.getTime() - finalEventDate.getTime()) / (24 * 60 * 60 * 1000))
        const enhancedDescription = `${event.description} | Project deadline: ${deadline.toDateString()} (${daysUntilDeadline} days remaining)`
        
        console.log(`   📅 Scheduled for: ${finalEventDate.toDateString()} (${daysUntilDeadline} days before deadline)`)
        
        return {
          id: event.id,
          title: event.title,
          description: enhancedDescription,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          type: event.type,
          attendees: event.attendees,
          color: projectColor,
          notificationEnabled: true
        }
      })
      
      // Combine generated events with scenario events
      const allEvents = [...events, ...scenarioEvents]
      
      console.log('✅ Generated calendar events:', allEvents.length, 'events')
      console.log('📅 Event timeline:')
      allEvents.slice(0, 5).forEach(event => {
        console.log(`   • ${event.title}: ${event.startTime?.toDateString()} (${event.type})`)
      })
      
      setCalendarEvents(allEvents)

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
      
      // Generate fallback calendar events with project color
      const projectFormData = form.getValues()
      const fallbackEvents = generateCalendarEvents(fallbackTasks, projectFormData.dueDate, projectFormData)
      setCalendarEvents(fallbackEvents)
      
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

  const generateCalendarEvents = (tasks: GeneratedTask[], projectDueDate?: Date, projectFormData?: ProjectFormData) => {
    const events: any[] = []
    const today = new Date()
    
    // Generate a consistent project color for calendar events
    const projectColor = projectColorGenerator.generateProjectColor(
      projectFormData?.name || "Untitled Project", 
      currentWorkspaceId || "default"
    )
    
    // Create project kickoff event
    const kickoffStart = new Date(today)
    kickoffStart.setHours(9, 0, 0, 0) // Set to 9 AM
    const kickoffEnd = new Date(kickoffStart)
    kickoffEnd.setHours(10, 0, 0, 0) // 1 hour duration
    
    events.push({
      id: `project-kickoff-${Date.now()}`,
      title: t("ai.calendar.kickoff"),
      description: t("ai.calendar.kickoffDesc"),
      startTime: kickoffStart,
      endTime: kickoffEnd,
      duration: 1, // 1 hour
      type: "MEETING",
      color: projectColor,
      notificationEnabled: true
    })

    // Create milestone events based on task dependencies
    const milestones = tasks.filter(task => 
      task.category === "milestone" || 
      task.priority === "HIGH" ||
      tasks.some(t => t.dependsOn?.includes(task.id))
    )

    milestones.forEach((milestone, index) => {
      const milestoneDate = addWeeks(today, (index + 1) * 2)
      milestoneDate.setHours(17, 0, 0, 0) // Set to 5 PM for deadline
      const milestoneEnd = new Date(milestoneDate)
      milestoneEnd.setHours(17, 30, 0, 0) // 30 minutes for deadline review
      
      events.push({
        id: `milestone-${milestone.id}`,
        title: `${t("ai.calendar.milestone")}: ${milestone.title}`,
        description: milestone.description,
        startTime: milestoneDate,
        endTime: milestoneEnd,
        duration: 0.5, // 30 minutes
        type: "DEADLINE",
        color: projectColor,
        notificationEnabled: true
      })
    })

    // Create review meetings
    if (projectDueDate) {
      const reviewDate = addDays(projectDueDate, -7)
      reviewDate.setHours(14, 0, 0, 0) // Set to 2 PM
      const reviewEnd = new Date(reviewDate)
      reviewEnd.setHours(16, 0, 0, 0) // 2 hours duration
      
      events.push({
        id: `project-review-${Date.now()}`,
        title: t("ai.calendar.finalReview"),
        description: t("ai.calendar.finalReviewDesc"),
        startTime: reviewDate,
        endTime: reviewEnd,
        duration: 2, // 2 hours
        type: "MEETING",
        color: projectColor,
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
      assigneeId: taskAssignments[task.id] && taskAssignments[task.id] !== "unassigned" ? taskAssignments[task.id] : undefined
    }))

    // Filter calendar events to only include selected ones
    const selectedEventsList = calendarEvents.filter(event => selectedEvents.has(event.id))

    setCurrentStep(WizardStep.CREATING)
    
    try {
      await onSubmit(formData, tasksWithAssignments, selectedEventsList)
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2 
                }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
              >
                {t("ai.wizard.welcome")}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto"
              >
                {t("ai.wizard.welcomeDesc")}
              </motion.p>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          {t("projects.name")} *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t("ai.wizard.projectNamePlaceholder")} 
                            className="h-10 text-sm border-2 focus:border-blue-500 transition-all duration-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-purple-500" />
                          {t("projects.description")} *
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("ai.wizard.descriptionPlaceholder")}
                            rows={3}
                            className="text-sm border-2 focus:border-purple-500 transition-all duration-300 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            {t("projects.category")} *
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-2 focus:border-green-500">
                                <SelectValue placeholder={t("projects.selectCategory")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projectCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-3 py-1">
                                    <span className="text-lg">{category.icon}</span>
                                    <span className="font-medium">{category.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            {t("tasks.priority")}
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-2 focus:border-orange-500">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  {t("tasks.lowPriority")}
                                </div>
                              </SelectItem>
                              <SelectItem value="MEDIUM">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  {t("tasks.mediumPriority")}
                                </div>
                              </SelectItem>
                              <SelectItem value="HIGH">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                  {t("tasks.highPriority")}
                                </div>
                              </SelectItem>
                              <SelectItem value="URGENT">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  {t("tasks.urgentPriority")}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                >
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-blue-500" />
                          {t("projects.dueDate")}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-10 pl-4 text-left font-normal border-2 hover:border-blue-500 transition-all duration-300",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                                    {format(field.value, "PPP")}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>{t("projects.pickDate")}</span>
                                  </div>
                                )}
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
                </motion.div>
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
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-center gap-2"
              >
                <CalendarIcon className="w-4 h-4 text-green-500" />
                <span>{t("ai.wizard.schedulingEvents")}</span>
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
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {t("ai.wizard.reviewTasks")}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                {t("ai.wizard.reviewTasksDesc")}
              </p>
            </div>

            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedTasks.size === generatedTasks.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTasks(new Set(generatedTasks.map(task => task.id)))
                    } else {
                      setSelectedTasks(new Set())
                    }
                  }}
                  className="border-2 border-blue-500 data-[state=checked]:bg-blue-500"
                />
                <span className="text-base font-semibold text-blue-900">
                  {t("ai.wizard.selectAll")} ({generatedTasks.length} {t("tasks.tasks")})
                </span>
              </div>
              
              <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-semibold px-3 py-1">
                {selectedTasks.size} {t("ai.wizard.selected")}
              </Badge>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-4 bg-white/50">
              <AnimatePresence>
                {generatedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "border rounded-lg p-4 transition-all duration-200",
                      selectedTasks.has(task.id) 
                        ? "border-blue-500 bg-blue-50 shadow-sm" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                        <div className="pt-2 border-t border-gray-100">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {t("tasks.assignTo")}
                          </label>
                          <Select
                            value={taskAssignments[task.id] || "unassigned"}
                            onValueChange={(value) => {
                              setTaskAssignments(prev => ({
                                ...prev,
                                [task.id]: value === "unassigned" ? "" : value
                              }))
                            }}
                          >
                            <SelectTrigger className="h-8 bg-white">
                              <SelectValue placeholder={t("tasks.unassigned")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs">?</span>
                                  </div>
                                  <span>{t("tasks.unassigned")}</span>
                                </div>
                              </SelectItem>
                              {workspaceMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={member.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {member.name?.charAt(0) || member.email?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.name || member.email}</span>
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

            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedEvents.size === calendarEvents.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedEvents(new Set(calendarEvents.map(event => event.id)))
                    } else {
                      setSelectedEvents(new Set())
                    }
                  }}
                  className="border-2 border-blue-500 data-[state=checked]:bg-blue-500"
                />
                <span className="text-base font-semibold text-blue-900">
                  {t("ai.wizard.selectAll")} ({calendarEvents.length} {t("ai.wizard.events")})
                </span>
              </div>
              
              <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-semibold px-3 py-1">
                {selectedEvents.size} {t("ai.wizard.selected")}
              </Badge>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-4 bg-white/50">
              <AnimatePresence>
                {calendarEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "border rounded-lg p-4 transition-all duration-200",
                      selectedEvents.has(event.id) 
                        ? "border-blue-500 bg-blue-50 shadow-sm" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedEvents)
                          if (checked) {
                            newSelected.add(event.id)
                          } else {
                            newSelected.delete(event.id)
                          }
                          setSelectedEvents(newSelected)
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: event.color || "#6b7280" }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {format(new Date(event.startTime || event.date), "MMM dd, yyyy")}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
                    <Badge variant="outline">{selectedEvents.size}</Badge>
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white to-gray-50 flex flex-col">
        <DialogHeader className="pb-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <motion.div
              animate={{ rotate: currentStep === WizardStep.AI_ANALYSIS ? 360 : 0 }}
              transition={{ duration: 2, repeat: currentStep === WizardStep.AI_ANALYSIS ? Infinity : 0, ease: "linear" }}
              className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              {stepTitles[currentStep]}
            </span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {stepDescriptions[currentStep]}
          </DialogDescription>
          {currentStep < WizardStep.CREATING && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 relative">
                <Progress value={progress} className="h-2 bg-gray-200" />
                <motion.div
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600">
                  {currentStep + 1}/{WizardStep.SUCCESS + 1}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: WizardStep.SUCCESS + 1 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        i <= currentStep 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-110" 
                          : "bg-gray-300 scale-90"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div 
            className="h-full overflow-y-auto px-1 pr-4 scroll-smooth" 
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#cbd5e0 #f7fafc',
              maxHeight: 'calc(95vh - 250px)' // Reduced from 300px for better space usage
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: #f7fafc;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #a0aec0;
              }
            `}</style>
            <div className="pb-4">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {currentStep < WizardStep.CREATING && (
          <div className="flex items-center justify-between pt-6 border-t border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-r from-gray-50 to-white px-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === WizardStep.PROJECT_INFO || isGenerating}
              className="group hover:bg-gray-100 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              {t("common.back")}
            </Button>

            <div className="flex items-center gap-3">
              {currentStep === WizardStep.PROJECT_INFO && (
                <Button
                  onClick={async () => {
                    const isValid = await form.trigger()
                    if (isValid) {
                      nextStep()
                    }
                  }}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}

              {currentStep === WizardStep.AI_ANALYSIS && (
                <Button 
                  onClick={nextStep}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}

              {currentStep === WizardStep.TASK_GENERATION && (
                <Button 
                  onClick={nextStep}
                  className="group bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}

              {currentStep === WizardStep.TASK_REVIEW && (
                <Button 
                  onClick={nextStep} 
                  disabled={selectedTasks.size === 0}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}

              {currentStep === WizardStep.CALENDAR_INTEGRATION && (
                <Button 
                  onClick={nextStep}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t("common.next")}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}

              {currentStep === WizardStep.FINAL_REVIEW && (
                <Button 
                  onClick={handleSubmit} 
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                >
                  <Rocket className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
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

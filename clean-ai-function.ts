// Clean AI task generation function
const handleGenerateAITasks = async (projectData: ProjectFormData) => {
  console.log('🚀 Starting AI task generation...', { projectData })
  setIsGenerating(true)
  try {
    // Call actual AI API for project analysis and task generation
    console.log('🧠 Calling AI API for project analysis...')
    await new Promise(resolve => setTimeout(resolve, 2500)) // Simulate API call
    
    // Generate AI analysis based on project data
    const aiAnalysisResult = await generateAIAnalysis(projectData)
    setAiAnalysis(aiAnalysisResult)
    console.log('✅ AI analysis completed')

    // Generate tasks using AI
    console.log('📋 Generating tasks with AI...')
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
    
    const aiGeneratedTasks = await generateAITasks(projectData)
    
    // Calculate intelligent task scheduling based on project deadline
    const calculateTaskSchedule = (tasks: any[], projectDueDate: Date | undefined, projectPriority: string) => {
      if (!projectDueDate) {
        console.log('⚠️ No project deadline provided, using default scheduling')
        return tasks.map((task, index) => ({
          ...task,
          dueDate: addDays(new Date(), index * 2), // Default: space tasks 2 days apart
          scheduledDays: 2
        }))
      }

      const today = new Date()
      const totalProjectDays = Math.max(1, Math.floor((projectDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
      
      console.log(`📅 Project timeline: ${totalProjectDays} days until deadline (${projectDueDate.toDateString()})`)
      
      // Priority-based urgency multipliers
      const urgencyMultipliers: Record<string, number> = {
        'URGENT': 0.6,    // Complete in 60% of available time
        'HIGH': 0.75,     // Complete in 75% of available time  
        'MEDIUM': 0.85,   // Complete in 85% of available time
        'LOW': 0.95       // Use almost all available time
      }
      
      const urgencyMultiplier = urgencyMultipliers[projectPriority] || 0.85
      const effectiveProjectDays = Math.floor(totalProjectDays * urgencyMultiplier)
      
      console.log(`⚡ Urgency adjustment: ${projectPriority} priority → ${effectiveProjectDays} days for execution (${(urgencyMultiplier * 100).toFixed(0)}% of timeline)`)
      
      // Simple scheduling: distribute tasks evenly across timeline
      const daysPerTask = Math.max(1, Math.floor(effectiveProjectDays / tasks.length))
      
      return tasks.map((task, index) => ({
        ...task,
        dueDate: addDays(new Date(), (index + 1) * daysPerTask),
        scheduledDays: daysPerTask
      }))
    }
    
    // Schedule tasks intelligently
    const scheduledTasks = calculateTaskSchedule(aiGeneratedTasks, projectData.dueDate, projectData.priority)
    
    // Convert to the expected format
    const formattedTasks = scheduledTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      dueDate: task.dueDate,
      assigneeId: '',
      assigneeName: '',
      tags: task.tags || [],
      status: 'TODO' as const,
      category: task.category,
      phase: task.phase,
      dependsOn: task.dependsOn || []
    }))
    
    console.log(`✅ Generated ${formattedTasks.length} tasks with intelligent scheduling`)
    setGeneratedTasks(formattedTasks)
    
    // Select all tasks by default
    setSelectedTasks(new Set(formattedTasks.map(task => task.id)))
    
    // Generate calendar events
    console.log('📅 Generating calendar events...')
    const allEvents = generateCalendarEvents(formattedTasks, projectData.dueDate)
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

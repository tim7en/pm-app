import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import OpenAI from 'openai'
import { addDays, addWeeks } from 'date-fns'

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

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

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      name: projectName,
      description,
      category,
      priority,
      dueDate,
      analysis,
      language = 'en'
    } = body

    if (!projectName || !description) {
      return NextResponse.json(
        { error: 'Project name and description are required' },
        { status: 400 }
      )
    }

    try {
      // Create comprehensive prompt for task generation
      const systemPrompt = getSystemPrompt(language)
      const userPrompt = createUserPrompt(projectName, description, category, priority, dueDate, analysis, language)

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      })

      const tasksText = completion.choices[0]?.message?.content

      if (!tasksText) {
        throw new Error('No tasks generated')
      }

      // Parse the generated tasks
      const tasks = parseGeneratedTasks(tasksText, dueDate)
      const timeline = generateTimeline(tasks, dueDate)

      return NextResponse.json({ tasks, timeline })
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Fallback to rule-based task generation
      const tasks = generateFallbackTasks(projectName, description, category, priority, dueDate, language)
      const timeline = generateTimeline(tasks, dueDate)
      
      return NextResponse.json({ tasks, timeline })
    }

  } catch (error) {
    console.error('AI task generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate task suggestions' },
      { status: 500 }
    )
  }
}

function getSystemPrompt(language: string): string {
  const prompts = {
    en: `You are an expert AI project manager specialized in breaking down complex projects into actionable tasks. Generate 8-15 comprehensive tasks in the following JSON format:

[
  {
    "title": "Task name",
    "description": "Detailed description",
    "priority": "LOW|MEDIUM|HIGH|URGENT",
    "estimatedHours": number,
    "category": "planning|development|testing|review|deployment|etc",
    "tags": ["tag1", "tag2"],
    "dependsOn": ["Previous Task Title"]
  }
]

Ensure tasks are:
- Specific and actionable
- Properly sequenced with dependencies
- Include realistic time estimates
- Cover all project phases
- Include quality assurance steps`,

    ru: `Вы экспертный ИИ проект-менеджер, специализирующийся на разбивке сложных проектов на выполнимые задачи. Сгенерируйте 8-15 комплексных задач в следующем JSON формате:

[
  {
    "title": "Название задачи",
    "description": "Подробное описание",
    "priority": "LOW|MEDIUM|HIGH|URGENT",
    "estimatedHours": число,
    "category": "planning|development|testing|review|deployment|etc",
    "tags": ["тег1", "тег2"],
    "dependsOn": ["Название предыдущей задачи"]
  }
]

Убедитесь, что задачи:
- Конкретные и выполнимые
- Правильно упорядочены с зависимостями
- Включают реалистичные временные оценки
- Покрывают все фазы проекта
- Включают шаги обеспечения качества`,

    uz: `Сиз мураккаб проектларни амалий вазифаларга бўлишга ихтисослашган мутахассис ЯИ проект менежерисиз. Қуйидаги JSON форматида 8-15 комплекс вазифани яратинг:

[
  {
    "title": "Вазифа номи",
    "description": "Батафсил тавсиф",
    "priority": "LOW|MEDIUM|HIGH|URGENT",
    "estimatedHours": сон,
    "category": "planning|development|testing|review|deployment|etc",
    "tags": ["тег1", "тег2"],
    "dependsOn": ["Олдинги вазифа номи"]
  }
]

Вазифалар қуйидагиларни таъминласин:
- Конкрет ва амалий бўлиши
- Боғлиқликлар билан тўғри тартибланиши
- Реалистик вақт баҳолашларини киритиши
- Барча проект босқичларини қамраши
- Сифат таъминлаш қадамларини киритиши`
  }

  return prompts[language as keyof typeof prompts] || prompts.en
}

function createUserPrompt(projectName: string, description: string, category: string, priority: string, dueDate: string | null, analysis: any, language: string): string {
  const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'
  
  return `Generate comprehensive tasks for:

Project: ${projectName}
Description: ${description}
Category: ${category}
Priority: ${priority}
Due Date: ${dueDateText}

${analysis ? `Analysis Context:
- Complexity: ${analysis.complexity}
- Timeline: ${analysis.timeline}
- Risks: ${analysis.risks}
` : ''}

Generate tasks that cover the complete project lifecycle from initiation to completion.`
}

function parseGeneratedTasks(tasksText: string, projectDueDate: string | null): GeneratedTask[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = tasksText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsedTasks = JSON.parse(jsonMatch[0])
      return parsedTasks.map((task: any, index: number) => ({
        id: `task-${index + 1}`,
        title: task.title || `Task ${index + 1}`,
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        estimatedHours: task.estimatedHours || 8,
        category: task.category || 'general',
        tags: Array.isArray(task.tags) ? task.tags : [],
        dependsOn: Array.isArray(task.dependsOn) ? task.dependsOn : [],
        status: 'TODO' as const,
        dueDate: calculateTaskDueDate(index, parsedTasks.length, projectDueDate)
      }))
    }
  } catch (error) {
    console.error('JSON parsing error:', error)
  }
  
  // Fallback parsing if JSON extraction fails
  return parseTextTasks(tasksText, projectDueDate)
}

function parseTextTasks(tasksText: string, projectDueDate: string | null): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  const lines = tasksText.split('\n')
  let currentTask: Partial<GeneratedTask> = {}
  let taskIndex = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.match(/^(\d+\.|\*|\-)/)) {
      // New task detected
      if (currentTask.title) {
        tasks.push(createTaskFromPartial(currentTask, taskIndex, projectDueDate))
        taskIndex++
      }
      currentTask = {
        title: trimmedLine.replace(/^(\d+\.|\*|\-)\s*/, ''),
        category: 'general',
        priority: 'MEDIUM',
        estimatedHours: 8,
        tags: [],
        status: 'TODO'
      }
    }
  }

  // Add the last task
  if (currentTask.title) {
    tasks.push(createTaskFromPartial(currentTask, taskIndex, projectDueDate))
  }

  return tasks.length > 0 ? tasks : []
}

function createTaskFromPartial(partial: Partial<GeneratedTask>, index: number, projectDueDate: string | null): GeneratedTask {
  return {
    id: `task-${index + 1}`,
    title: partial.title || `Task ${index + 1}`,
    description: partial.description || `Task ${index + 1} description`,
    priority: partial.priority || 'MEDIUM',
    estimatedHours: partial.estimatedHours || 8,
    category: partial.category || 'general',
    tags: partial.tags || [],
    dependsOn: partial.dependsOn || [],
    status: 'TODO',
    dueDate: calculateTaskDueDate(index, 10, projectDueDate)
  }
}

function calculateTaskDueDate(taskIndex: number, totalTasks: number, projectDueDate: string | null): Date | undefined {
  if (!projectDueDate) return undefined
  
  const endDate = new Date(projectDueDate)
  const startDate = new Date()
  
  // Distribute tasks evenly across the project timeline
  const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysPerTask = Math.max(1, Math.floor(totalDays / totalTasks))
  
  return addDays(startDate, (taskIndex + 1) * daysPerTask)
}

function generateFallbackTasks(projectName: string, description: string, category: string, priority: string, dueDate: string | null, language: string): GeneratedTask[] {
  const taskTemplates = getFallbackTaskTemplates(language, category)
  
  return taskTemplates.map((template, index) => ({
    id: `task-${index + 1}`,
    title: template.title.replace('{{projectName}}', projectName),
    description: template.description.replace('{{projectName}}', projectName).replace('{{description}}', description),
    priority: template.priority,
    estimatedHours: template.estimatedHours,
    category: template.category,
    tags: template.tags,
    dependsOn: template.dependsOn,
    status: 'TODO' as const,
    dueDate: calculateTaskDueDate(index, taskTemplates.length, dueDate)
  }))
}

function getFallbackTaskTemplates(language: string, category: string) {
  const templates = {
    en: {
      software: [
        {
          title: 'Requirements Analysis for {{projectName}}',
          description: 'Analyze and document detailed requirements for {{projectName}}',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'planning',
          tags: ['planning', 'requirements'],
          dependsOn: []
        },
        {
          title: 'System Architecture Design',
          description: 'Design system architecture and technical specifications',
          priority: 'HIGH' as const,
          estimatedHours: 20,
          category: 'design',
          tags: ['architecture', 'design'],
          dependsOn: ['Requirements Analysis for {{projectName}}']
        },
        {
          title: 'Development Environment Setup',
          description: 'Set up development tools and environment',
          priority: 'MEDIUM' as const,
          estimatedHours: 8,
          category: 'setup',
          tags: ['setup', 'tools'],
          dependsOn: []
        },
        {
          title: 'Core Development',
          description: 'Implement core functionality and features',
          priority: 'HIGH' as const,
          estimatedHours: 40,
          category: 'development',
          tags: ['development', 'implementation'],
          dependsOn: ['System Architecture Design', 'Development Environment Setup']
        },
        {
          title: 'Testing and Quality Assurance',
          description: 'Comprehensive testing and quality validation',
          priority: 'HIGH' as const,
          estimatedHours: 24,
          category: 'testing',
          tags: ['testing', 'qa'],
          dependsOn: ['Core Development']
        },
        {
          title: 'Documentation',
          description: 'Create user and technical documentation',
          priority: 'MEDIUM' as const,
          estimatedHours: 16,
          category: 'documentation',
          tags: ['documentation'],
          dependsOn: ['Core Development']
        },
        {
          title: 'Deployment and Launch',
          description: 'Deploy to production and launch project',
          priority: 'HIGH' as const,
          estimatedHours: 12,
          category: 'deployment',
          tags: ['deployment', 'launch'],
          dependsOn: ['Testing and Quality Assurance', 'Documentation']
        }
      ],
      marketing: [
        {
          title: 'Market Research for {{projectName}}',
          description: 'Conduct market research and competitive analysis',
          priority: 'HIGH' as const,
          estimatedHours: 20,
          category: 'research',
          tags: ['research', 'market'],
          dependsOn: []
        },
        {
          title: 'Strategy Development',
          description: 'Develop marketing strategy and campaign plan',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'strategy',
          tags: ['strategy', 'planning'],
          dependsOn: ['Market Research for {{projectName}}']
        },
        {
          title: 'Content Creation',
          description: 'Create marketing content and materials',
          priority: 'MEDIUM' as const,
          estimatedHours: 32,
          category: 'content',
          tags: ['content', 'creative'],
          dependsOn: ['Strategy Development']
        },
        {
          title: 'Campaign Launch',
          description: 'Launch marketing campaign across channels',
          priority: 'HIGH' as const,
          estimatedHours: 12,
          category: 'launch',
          tags: ['launch', 'execution'],
          dependsOn: ['Content Creation']
        },
        {
          title: 'Performance Analysis',
          description: 'Monitor and analyze campaign performance',
          priority: 'MEDIUM' as const,
          estimatedHours: 8,
          category: 'analysis',
          tags: ['analytics', 'reporting'],
          dependsOn: ['Campaign Launch']
        }
      ]
    }
  }

  const langTemplates = templates[language as keyof typeof templates] || templates.en
  return langTemplates[category as keyof typeof langTemplates] || langTemplates.software
}

function generateTimeline(tasks: GeneratedTask[], projectDueDate: string | null) {
  const startDate = new Date()
  const endDate = projectDueDate ? new Date(projectDueDate) : addWeeks(startDate, 12)
  
  return {
    startDate,
    endDate,
    totalTasks: tasks.length,
    estimatedHours: tasks.reduce((total, task) => total + task.estimatedHours, 0),
    phases: [
      {
        name: 'Planning',
        tasks: tasks.filter(t => t.category === 'planning').length,
        duration: '1-2 weeks'
      },
      {
        name: 'Implementation',
        tasks: tasks.filter(t => ['development', 'implementation', 'content'].includes(t.category)).length,
        duration: '4-8 weeks'
      },
      {
        name: 'Quality Assurance',
        tasks: tasks.filter(t => ['testing', 'qa', 'review'].includes(t.category)).length,
        duration: '1-2 weeks'
      },
      {
        name: 'Launch',
        tasks: tasks.filter(t => ['deployment', 'launch'].includes(t.category)).length,
        duration: '1 week'
      }
    ]
  }
}

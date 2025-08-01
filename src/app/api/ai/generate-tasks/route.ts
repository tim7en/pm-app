import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import OpenAI from 'openai'
import { addDays, addWeeks, addMonths } from 'date-fns'

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
    en: `You are an expert AI project manager specialized in breaking down complex projects into actionable, well-structured tasks. You excel at creating comprehensive task lists that include realistic time estimates, proper dependencies, and strategic prioritization.

Your task generation follows these principles:
- Create specific, actionable tasks with clear deliverables
- Establish realistic time estimates based on industry standards
- Identify task dependencies and logical sequencing
- Balance workload distribution across team members
- Include quality assurance and review tasks
- Consider risk mitigation and contingency planning
- Incorporate regular communication and status updates

Output Format: Generate tasks as a JSON-like structure with the following fields for each task:
- title: Clear, action-oriented task name
- description: Detailed description of what needs to be done
- priority: LOW/MEDIUM/HIGH/URGENT
- estimatedHours: Realistic time estimate
- category: Task category (planning, development, testing, review, etc.)
- tags: Relevant tags for organization
- dependsOn: Array of task IDs this task depends on (use task titles as references)

Generate 8-15 tasks that comprehensively cover the project scope.`,

    ru: `Вы - экспертный ИИ проект-менеджер, специализирующийся на разбивке сложных проектов на выполнимые, хорошо структурированные задачи. Вы превосходно создаете комплексные списки задач, включающие реалистичные временные оценки, правильные зависимости и стратегическую приоритизацию.

Ваша генерация задач следует этим принципам:
- Создавать конкретные, выполнимые задачи с четкими результатами
- Устанавливать реалистичные временные оценки на основе отраслевых стандартов
- Определять зависимости задач и логическую последовательность
- Балансировать распределение рабочей нагрузки между членами команды
- Включать задачи обеспечения качества и обзора
- Учитывать смягчение рисков и планирование на случай непредвиденных обстоятельств
- Включать регулярную коммуникацию и обновления статуса

Формат вывода: Генерируйте задачи как JSON-подобную структуру со следующими полями для каждой задачи:
- title: Четкое, ориентированное на действие название задачи
- description: Подробное описание того, что нужно сделать
- priority: LOW/MEDIUM/HIGH/URGENT
- estimatedHours: Реалистичная временная оценка
- category: Категория задачи (планирование, разработка, тестирование, обзор и т.д.)
- tags: Соответствующие теги для организации
- dependsOn: Массив ID задач, от которых зависит данная задача (используйте названия задач как ссылки)

Сгенерируйте 8-15 задач, которые комплексно покрывают объем проекта.`,

    uz: `Сиз мураккаб проектларни амалий, яхши тузилган вазифаларга бўлишга ихтисослашган мутахассис ЯИ проект менежерисиз. Сиз реалистик вақт баҳолашлари, тўғри боғлиқликлар ва стратегик устувор белгилашни ўз ичига олган комплекс вазифалар рўйхатини яратишда зўрсиз.

Сизнинг вазифаларни яратишингиз қуйидаги принципларга амал қилади:
- Аниқ натижалар билан конкрет, амалга ошириладиган вазифаларни яратиш
- Соҳа стандартлари асосида реалистик вақт баҳолашларини белгилаш
- Вазифалар боғлиқлиги ва мантиқий кетма-кетликни аниқлаш
- Жамоа аъзолари ўртасида иш юкини мувозанатлаш
- Сифатни таъминлаш ва кўриб чиқиш вазифаларини киритиш
- Хавфларни камайтириш ва олдини олиш режалашни ҳисобга олиш
- Мунтазам алоқа ва ҳолат янгиланишларини киритиш

Чиқиш формати: Вазифаларни ҳар бир вазифа учун қуйидаги майдонлар билан JSON-га ўхшаш тузилма сифатида яратинг:
- title: Аниқ, ҳаракатга йўналтирилган вазифа номи
- description: Нима қилиш кераклигининг батафсил тавсифи
- priority: LOW/MEDIUM/HIGH/URGENT
- estimatedHours: Реалистик вақт баҳолаши
- category: Вазифа категорияси (режалаштириш, ишлаб чиқиш, синов, кўриб чиқиш ва ҳ.к.)
- tags: Ташкил этиш учун тегишли теглар
- dependsOn: Ушбу вазифа боғлиқ бўлган вазифа IDлари массиви (вазифа номларини ҳавола сифатида ишлатинг)

Проект қамровини комплекс қоплайдиган 8-15 вазифани яратинг.`
  }

  return prompts[language as keyof typeof prompts] || prompts.en
}

function createUserPrompt(projectName: string, description: string, category: string, priority: string, dueDate: string | null, analysis: any, language: string): string {
  const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'
  
  return `Generate a comprehensive task breakdown for the following project:

**Project Information:**
- Name: ${projectName}
- Description: ${description}
- Category: ${category}
- Priority: ${priority}
- Due Date: ${dueDateText}

**AI Analysis Context:**
${analysis ? `
- Complexity: ${analysis.complexity || 'Medium complexity project'}
- Timeline: ${analysis.timeline || 'Standard timeline expected'}
- Key Milestones: ${analysis.milestones || 'Standard milestones'}
- Identified Risks: ${analysis.risks || 'Standard project risks'}
- Success Metrics: ${analysis.successMetrics || 'Standard success metrics'}
` : 'No analysis provided - use standard project breakdown approach.'}

Please generate a detailed task breakdown that:
1. Covers all aspects of project delivery from planning to completion
2. Includes realistic time estimates (in hours)
3. Establishes proper task dependencies
4. Balances different types of work (planning, execution, review, documentation)
5. Considers the project category and priority level
6. Includes quality assurance and testing tasks where appropriate
7. Incorporates communication and stakeholder management tasks

Format each task clearly with all required fields.`
}

function parseGeneratedTasks(tasksText: string, projectDueDate: string | null): GeneratedTask[] {
  const tasks: GeneratedTask[] = []
  
  try {
    // Try to parse as JSON first
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
  } catch {
    // Fall back to text parsing
  }

  // Parse text-based task list
  const lines = tasksText.split('\n')
  let currentTask: Partial<GeneratedTask> = {}
  let taskIndex = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.match(/^(\d+\.|\*|\-)/)) {
      // New task detected
      if (currentTask.title) {
        tasks.push(createTaskFromPartial(currentTask, taskIndex, tasks.length, projectDueDate))
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
    } else if (trimmedLine.toLowerCase().includes('description:')) {
      currentTask.description = trimmedLine.replace(/description:\s*/i, '')
    } else if (trimmedLine.toLowerCase().includes('priority:')) {
      const priority = trimmedLine.replace(/priority:\s*/i, '').toUpperCase()
      if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
        currentTask.priority = priority as any
      }
    } else if (trimmedLine.toLowerCase().includes('hours:')) {
      const hours = parseInt(trimmedLine.replace(/.*hours:\s*/i, ''))
      if (!isNaN(hours)) {
        currentTask.estimatedHours = hours
      }
    }
  }

  // Add the last task
  if (currentTask.title) {
    tasks.push(createTaskFromPartial(currentTask, taskIndex, tasks.length, projectDueDate))
  }

  return tasks.length > 0 ? tasks : generateFallbackTasks('Project', 'Description', 'software', 'MEDIUM', projectDueDate, 'en')
}

function createTaskFromPartial(partial: Partial<GeneratedTask>, index: number, totalTasks: number, projectDueDate: string | null): GeneratedTask {
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
    dueDate: calculateTaskDueDate(index, totalTasks, projectDueDate)
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
  const taskTemplates = getTaskTemplates(language)
  const categoryTasks = taskTemplates[category as keyof typeof taskTemplates] || taskTemplates.software
  
  return categoryTasks.map((template, index) => ({
    id: `task-${index + 1}`,
    title: template.title.replace('{{projectName}}', projectName),
    description: template.description.replace('{{projectName}}', projectName).replace('{{description}}', description),
    priority: template.priority,
    estimatedHours: template.estimatedHours,
    category: template.category,
    tags: template.tags,
    dependsOn: template.dependsOn,
    status: 'TODO' as const,
    dueDate: calculateTaskDueDate(index, categoryTasks.length, dueDate)
  }))
}

function getTaskTemplates(language: string) {
  const templates = {
    en: {
      software: [
        {
          title: 'Project Planning and Requirements Analysis',
          description: 'Define project scope, gather requirements, and create detailed specifications for {{projectName}}',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'planning',
          tags: ['planning', 'requirements'],
          dependsOn: []
        },
        {
          title: 'Technical Architecture Design',
          description: 'Design system architecture, database schema, and technical specifications',
          priority: 'HIGH' as const,
          estimatedHours: 20,
          category: 'design',
          tags: ['architecture', 'design'],
          dependsOn: ['Project Planning and Requirements Analysis']
        },
        {
          title: 'Development Environment Setup',
          description: 'Set up development environment, tools, and deployment pipeline',
          priority: 'MEDIUM' as const,
          estimatedHours: 8,
          category: 'setup',
          tags: ['setup', 'environment'],
          dependsOn: ['Technical Architecture Design']
        },
        {
          title: 'Core Functionality Development',
          description: 'Implement main features and core functionality of the application',
          priority: 'HIGH' as const,
          estimatedHours: 40,
          category: 'development',
          tags: ['development', 'core'],
          dependsOn: ['Development Environment Setup']
        },
        {
          title: 'User Interface Implementation',
          description: 'Create user interface components and integrate with backend services',
          priority: 'HIGH' as const,
          estimatedHours: 32,
          category: 'frontend',
          tags: ['ui', 'frontend'],
          dependsOn: ['Core Functionality Development']
        },
        {
          title: 'Testing and Quality Assurance',
          description: 'Comprehensive testing including unit tests, integration tests, and user acceptance testing',
          priority: 'HIGH' as const,
          estimatedHours: 24,
          category: 'testing',
          tags: ['testing', 'qa'],
          dependsOn: ['User Interface Implementation']
        },
        {
          title: 'Documentation Creation',
          description: 'Create user documentation, technical documentation, and deployment guides',
          priority: 'MEDIUM' as const,
          estimatedHours: 16,
          category: 'documentation',
          tags: ['documentation'],
          dependsOn: ['Core Functionality Development']
        },
        {
          title: 'Performance Optimization',
          description: 'Optimize application performance, database queries, and user experience',
          priority: 'MEDIUM' as const,
          estimatedHours: 12,
          category: 'optimization',
          tags: ['performance', 'optimization'],
          dependsOn: ['Testing and Quality Assurance']
        },
        {
          title: 'Security Review and Implementation',
          description: 'Conduct security audit and implement necessary security measures',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'security',
          tags: ['security', 'audit'],
          dependsOn: ['Testing and Quality Assurance']
        },
        {
          title: 'Deployment and Launch',
          description: 'Deploy application to production environment and conduct launch activities',
          priority: 'HIGH' as const,
          estimatedHours: 12,
          category: 'deployment',
          tags: ['deployment', 'launch'],
          dependsOn: ['Security Review and Implementation', 'Performance Optimization']
        }
      ],
      marketing: [
        {
          title: 'Market Research and Analysis',
          description: 'Conduct comprehensive market research and competitive analysis for {{projectName}}',
          priority: 'HIGH' as const,
          estimatedHours: 20,
          category: 'research',
          tags: ['research', 'analysis'],
          dependsOn: []
        },
        {
          title: 'Campaign Strategy Development',
          description: 'Develop comprehensive marketing strategy and campaign objectives',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'strategy',
          tags: ['strategy', 'planning'],
          dependsOn: ['Market Research and Analysis']
        },
        {
          title: 'Content Creation and Development',
          description: 'Create marketing materials, content, and creative assets',
          priority: 'HIGH' as const,
          estimatedHours: 32,
          category: 'content',
          tags: ['content', 'creative'],
          dependsOn: ['Campaign Strategy Development']
        },
        {
          title: 'Digital Marketing Setup',
          description: 'Set up digital marketing channels, tracking, and automation tools',
          priority: 'MEDIUM' as const,
          estimatedHours: 12,
          category: 'digital',
          tags: ['digital', 'setup'],
          dependsOn: ['Content Creation and Development']
        },
        {
          title: 'Campaign Launch and Execution',
          description: 'Launch marketing campaign across selected channels and platforms',
          priority: 'HIGH' as const,
          estimatedHours: 16,
          category: 'execution',
          tags: ['launch', 'execution'],
          dependsOn: ['Digital Marketing Setup']
        },
        {
          title: 'Performance Monitoring and Analytics',
          description: 'Monitor campaign performance and analyze key metrics',
          priority: 'HIGH' as const,
          estimatedHours: 8,
          category: 'analytics',
          tags: ['analytics', 'monitoring'],
          dependsOn: ['Campaign Launch and Execution']
        }
      ]
    },
    // Add Russian and Uzbek templates...
  }

  return templates[language as keyof typeof templates] || templates.en
}

function generateTimeline(tasks: GeneratedTask[], projectDueDate: string | null) {
  const startDate = new Date()
  const endDate = projectDueDate ? new Date(projectDueDate) : addMonths(startDate, 3)
  
  return {
    startDate,
    endDate,
    totalTasks: tasks.length,
    estimatedHours: tasks.reduce((total, task) => total + task.estimatedHours, 0),
    phases: [
      {
        name: 'Planning & Setup',
        tasks: tasks.filter(t => ['planning', 'setup', 'research'].includes(t.category)).length,
        duration: '1-2 weeks'
      },
      {
        name: 'Development & Implementation',
        tasks: tasks.filter(t => ['development', 'implementation', 'content'].includes(t.category)).length,
        duration: '4-8 weeks'
      },
      {
        name: 'Testing & Quality Assurance',
        tasks: tasks.filter(t => ['testing', 'qa', 'review'].includes(t.category)).length,
        duration: '1-2 weeks'
      },
      {
        name: 'Launch & Deployment',
        tasks: tasks.filter(t => ['deployment', 'launch'].includes(t.category)).length,
        duration: '1 week'
      }
    ]
  }
}

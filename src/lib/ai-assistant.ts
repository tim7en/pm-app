import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY_2) {
  console.warn('OPENAI_API_KEY_2 is not set. AI features will be limited.')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_2 || 'dummy-key',
})

export interface TaskGenerationRequest {
  description: string
  projectContext?: string
  userRole?: string
  existingTasks?: Array<{
    title: string
    description?: string
    status: string
  }>
}

export interface TaskSuggestion {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  estimatedHours: number
  dependencies?: string[]
  tags?: string[]
}

export interface EfficiencyAssessment {
  overallScore: number
  projectAlignment: number
  completionRate: number
  timeEfficiency: number
  recommendations: string[]
  insights: string[]
}

export interface WorkspaceHealthReport {
  overallHealth: number
  activeUsers: number
  inactiveUsers: string[]
  productivityScore: number
  workLifeBalance: number
  recommendations: string[]
  hourlyActivity: Array<{
    hour: number
    activity: number
    users: number
  }>
}

export class AIAssistant {
  // Generate task suggestions based on user input
  async generateTasks(request: TaskGenerationRequest): Promise<TaskSuggestion[]> {
    try {
      const prompt = `
You are an expert project manager AI assistant. Based on the following information, generate 3-5 specific, actionable tasks:

Description: ${request.description}
Project Context: ${request.projectContext || 'Not specified'}
User Role: ${request.userRole || 'Team Member'}
Existing Tasks: ${request.existingTasks?.map(t => `- ${t.title} (${t.status})`).join('\n') || 'None'}

Please generate tasks that are:
1. Specific and actionable
2. Properly prioritized
3. Realistic in scope
4. Complementary to existing tasks

Respond with a JSON array of tasks in this format:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "priority": "HIGH|MEDIUM|LOW|URGENT",
    "estimatedHours": number,
    "dependencies": ["Optional dependency"],
    "tags": ["relevant", "tags"]
  }
]
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      try {
        return JSON.parse(response)
      } catch (parseError) {
        // Fallback parsing - extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse AI response')
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      throw new Error('Failed to generate task suggestions')
    }
  }

  // Assess project efficiency and alignment
  async assessProjectEfficiency(
    projectData: any,
    completedTasks: any[],
    timeline: { start: Date; end?: Date }
  ): Promise<EfficiencyAssessment> {
    try {
      const prompt = `
Analyze this project's efficiency and alignment:

Project: ${projectData.name}
Description: ${projectData.description}
Status: ${projectData.status}
Timeline: ${timeline.start.toDateString()} - ${timeline.end?.toDateString() || 'Ongoing'}

Completed Tasks:
${completedTasks.map(task => `
- ${task.title} (Priority: ${task.priority}, Completed: ${new Date(task.updatedAt).toDateString()})
  Description: ${task.description || 'No description'}
`).join('\n')}

Provide a comprehensive efficiency assessment. Respond with JSON:
{
  "overallScore": number (0-100),
  "projectAlignment": number (0-100),
  "completionRate": number (0-100),
  "timeEfficiency": number (0-100),
  "recommendations": ["specific recommendations"],
  "insights": ["key insights about the project"]
}
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      try {
        return JSON.parse(response)
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        throw new Error('Could not parse AI response')
      }
    } catch (error) {
      console.error('Error assessing project efficiency:', error)
      throw new Error('Failed to assess project efficiency')
    }
  }

  // Generate feedback for task completion
  async generateTaskCompletionFeedback(
    task: any,
    completionTime: number,
    userPerformance: any
  ): Promise<string> {
    try {
      const prompt = `
A user just completed a task. Generate encouraging and constructive feedback:

Task: ${task.title}
Description: ${task.description}
Priority: ${task.priority}
Time Taken: ${completionTime} hours
User's Recent Performance: ${JSON.stringify(userPerformance)}

Generate a friendly, encouraging message that:
1. Acknowledges the completion
2. Provides constructive feedback
3. Suggests improvements if needed
4. Maintains motivation

Keep it concise and positive (2-3 sentences).
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
      })

      return completion.choices[0]?.message?.content || "Great job completing this task! Keep up the excellent work."
    } catch (error) {
      console.error('Error generating feedback:', error)
      return "Excellent work on completing this task! Your dedication to getting things done is appreciated."
    }
  }

  // Analyze workspace health and productivity
  async analyzeWorkspaceHealth(
    users: any[],
    activities: any[],
    timeRange: { start: Date; end: Date }
  ): Promise<WorkspaceHealthReport> {
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY_2 === 'dummy-key' || process.env.OPENAI_API_KEY_2 === 'your-openai-api-key-here') {
        console.warn('OpenAI API key not configured, using fallback health report')
        return this.getFallbackHealthReport(users)
      }

      const workHours = {
        morning: { start: 9, end: 13 },
        lunch: { start: 13, end: 14 },
        afternoon: { start: 14, end: 18 }
      }

      const prompt = `
Analyze workspace health and productivity:

Work Hours: 9-13, 13-14 (lunch), 14-18
Users: ${users.length} total
Time Range: ${timeRange.start.toDateString()} - ${timeRange.end.toDateString()}

Recent Activities:
${activities.slice(0, 20).map(activity => `
- ${activity.user.name}: ${activity.message} (${new Date(activity.timestamp).toLocaleString()})
`).join('\n')}

Focus on:
1. Work-life balance (1-2 hours work, 15-20 min breaks)
2. Activity during work hours
3. User engagement patterns
4. Productivity recommendations

Respond with JSON:
{
  "overallHealth": number (0-100),
  "activeUsers": number,
  "inactiveUsers": ["user names who need check-ins"],
  "productivityScore": number (0-100),
  "workLifeBalance": number (0-100),
  "recommendations": ["specific recommendations"],
  "hourlyActivity": [
    {"hour": 9, "activity": 75, "users": 5},
    {"hour": 10, "activity": 85, "users": 6}
  ]
}
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No response from AI')

      try {
        return JSON.parse(response)
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        
        // Fallback response
        return this.getFallbackHealthReport(users)
      }
    } catch (error) {
      console.error('Error analyzing workspace health:', error)
      return this.getFallbackHealthReport(users)
    }
  }

  // Fallback health report when AI is not available
  private getFallbackHealthReport(users: any[]): WorkspaceHealthReport {
    return {
      overallHealth: 75,
      activeUsers: users.length,
      inactiveUsers: [],
      productivityScore: 80,
      workLifeBalance: 70,
      recommendations: [
        'Configure OpenAI API key for detailed AI insights',
        'Monitor team activity patterns regularly',
        'Encourage regular breaks during work hours'
      ],
      hourlyActivity: Array.from({ length: 9 }, (_, i) => ({
        hour: i + 9,
        activity: Math.floor(Math.random() * 40) + 60,
        users: Math.max(1, Math.floor(Math.random() * users.length))
      }))
    }
  }

  // Generate reminder message for inactive users
  async generateInactivityReminder(
    userName: string,
    inactiveDuration: number,
    workContext: any
  ): Promise<string> {
    try {
      const prompt = `
Generate a friendly reminder for an inactive team member:

User: ${userName}
Inactive for: ${inactiveDuration} hours
Work Context: ${JSON.stringify(workContext)}

Create a supportive message that:
1. Checks in on their wellbeing
2. Asks about ongoing work
3. Offers assistance
4. Maintains a positive tone

Keep it professional but caring (2-3 sentences).
`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      })

      return completion.choices[0]?.message?.content || 
        `Hi ${userName}! We noticed you've been quiet today. How are things going with your current tasks? Let us know if you need any support!`
    } catch (error) {
      console.error('Error generating reminder:', error)
      return `Hi ${userName}! Just checking in - how are your tasks progressing today? Feel free to reach out if you need any assistance!`
    }
  }
}

export const aiAssistant = new AIAssistant()

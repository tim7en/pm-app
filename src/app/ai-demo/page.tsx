'use client'

import { useState } from 'react'
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Target, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Users,
  TrendingUp,
  Heart,
  Coffee,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

export default function AIDemo() {
  const [activeDemo, setActiveDemo] = useState<string>('task-generation')
  const [loading, setLoading] = useState(false)
  const [taskDescription, setTaskDescription] = useState('Implement user authentication system with JWT tokens and role-based permissions')
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([])

  const demoData = {
    'task-generation': {
      title: '🧠 AI Task Generation',
      description: 'Generate intelligent task suggestions based on project context',
      icon: Brain,
      color: 'bg-blue-500',
      example: [
        {
          title: 'Implement JWT middleware for authentication',
          description: 'Create middleware to verify JWT tokens and protect routes',
          priority: 'HIGH',
          estimatedHours: 4,
          tags: ['backend', 'security', 'authentication']
        },
        {
          title: 'Build user login/signup forms',
          description: 'Create responsive forms with validation and error handling',
          priority: 'MEDIUM',
          estimatedHours: 6,
          tags: ['frontend', 'ui', 'forms']
        },
        {
          title: 'Setup role-based access control',
          description: 'Implement permission system for different user roles',
          priority: 'HIGH',
          estimatedHours: 8,
          tags: ['backend', 'permissions', 'security']
        }
      ]
    },
    'project-assessment': {
      title: '📊 Project Efficiency Assessment',
      description: 'Real-time project health analysis and recommendations',
      icon: Target,
      color: 'bg-green-500',
      example: {
        overallScore: 87,
        taskCompletionRate: 92,
        productivityScore: 85,
        recommendations: [
          'Consider parallel development for UI and API components',
          'Add automated testing to reduce review time',
          'Schedule daily standups to identify blockers early'
        ]
      }
    },
    'workspace-health': {
      title: '🏥 Workspace Health Monitoring',
      description: 'Monitor team productivity and work-life balance',
      icon: Heart,
      color: 'bg-red-500',
      example: {
        overallHealth: 85,
        productivityScore: 90,
        workLifeBalance: 78,
        teamStatus: [
          { name: 'John Smith', status: 'active', activities: 15, balance: 85 },
          { name: 'Sarah Johnson', status: 'needs-break', activities: 32, balance: 45 },
          { name: 'Mike Chen', status: 'inactive', activities: 2, balance: 90 },
          { name: 'Lisa Brown', status: 'active', activities: 18, balance: 80 }
        ]
      }
    },
    'task-feedback': {
      title: '💬 Task Completion Feedback',
      description: 'Personalized encouragement and performance insights',
      icon: Sparkles,
      color: 'bg-purple-500',
      example: {
        message: "Excellent work! You completed this complex authentication system 25% faster than your average. Your consistent performance this week shows great momentum. You're on a 5-task completion streak! 🚀",
        insights: {
          streak: 5,
          speedImprovement: 25,
          qualityScore: 95
        }
      }
    },
    'inactivity-reminders': {
      title: '⚡ Smart Inactivity Reminders',
      description: 'Work-life balance optimization with intelligent notifications',
      icon: Coffee,
      color: 'bg-orange-500',
      example: {
        reminder: "Hi Mike! We noticed you've been away for a while. Hope everything is going well! If you need any support with your current tasks or have any blockers, feel free to reach out. We're here to help! 😊",
        managerNotification: "Team Update: Mike Chen has been inactive for 3 hours during work time. A gentle reminder has been sent.",
        workHours: {
          morning: '9:00-13:00',
          lunch: '13:00-14:00',
          evening: '14:00-18:00'
        }
      }
    }
  }

  const generateTasks = async () => {
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Use example data for demo
    setGeneratedTasks(demoData['task-generation'].example)
    setLoading(false)
  }

  const getCurrentDemo = () => demoData[activeDemo as keyof typeof demoData]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🎯 Project Manager AI Agent Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of AI-driven project management with intelligent task generation, 
            efficiency assessment, and work-life balance monitoring
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(demoData).map(([key, demo]) => {
            const IconComponent = demo.icon
            return (
              <Button
                key={key}
                variant={activeDemo === key ? "default" : "outline"}
                onClick={() => setActiveDemo(key)}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {demo.title.split(' ').slice(1).join(' ')}
              </Button>
            )
          })}
        </div>

        {/* Main Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Demo Controls */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(getCurrentDemo().icon, { className: "h-6 w-6" })}
                {getCurrentDemo().title}
              </CardTitle>
              <CardDescription>
                {getCurrentDemo().description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeDemo === 'task-generation' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Description</label>
                    <Textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Describe what you want to accomplish..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Context</label>
                    <Input placeholder="Project Manager - Project Management Platform" />
                  </div>
                  <Button 
                    onClick={generateTasks} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Tasks...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate AI Tasks
                      </>
                    )}
                  </Button>
                </div>
              )}

              {activeDemo === 'project-assessment' && (
                <div className="space-y-4">
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      AI analyzes project completion rates, resource allocation, and identifies bottlenecks
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyze Project Health
                  </Button>
                </div>
              )}

              {activeDemo === 'workspace-health' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <div className="text-sm font-medium">Work Hours</div>
                      <div className="text-xs text-gray-500">9-13, 14-18</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <div className="text-sm font-medium">Active Team</div>
                      <div className="text-xs text-gray-500">3 of 4</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <div className="text-sm font-medium">Alerts</div>
                      <div className="text-xs text-gray-500">1 inactive</div>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Monitor Workspace Health
                  </Button>
                </div>
              )}

              {(activeDemo === 'task-feedback' || activeDemo === 'inactivity-reminders') && (
                <div className="space-y-4">
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      {activeDemo === 'task-feedback' 
                        ? 'AI provides personalized feedback based on performance history and completion patterns'
                        : 'Smart system detects work patterns and sends gentle reminders for optimal work-life balance'
                      }
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full">
                    {activeDemo === 'task-feedback' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Generate Completion Feedback
                      </>
                    ) : (
                      <>
                        <Coffee className="h-4 w-4 mr-2" />
                        Send Smart Reminder
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Demo Results */}
          <Card>
            <CardHeader>
              <CardTitle>Live Demo Results</CardTitle>
              <CardDescription>
                See how Project Manager AI processes and responds to your requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeDemo === 'task-generation' && (
                <div className="space-y-4">
                  {generatedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Generate AI Tasks" to see intelligent task suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-600">✅ Generated Tasks:</h4>
                      {generatedTasks.map((task, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium">{task.title}</h5>
                            <Badge variant={task.priority === 'HIGH' ? 'destructive' : 'default'}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimatedHours}h
                            </span>
                            <div className="flex gap-1">
                              {task.tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeDemo === 'project-assessment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">87%</div>
                      <div className="text-sm">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm">Completion Rate</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🎯 AI Recommendations:</h4>
                    <ul className="space-y-1 text-sm">
                      {(getCurrentDemo().example as any).recommendations?.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeDemo === 'workspace-health' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-xl font-bold text-green-600">85%</div>
                      <div className="text-xs">Health</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="text-xl font-bold text-blue-600">90%</div>
                      <div className="text-xs">Productivity</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <div className="text-xl font-bold text-purple-600">78%</div>
                      <div className="text-xs">Balance</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">👥 Team Status:</h4>
                    <div className="space-y-2">
                      {(getCurrentDemo().example as any).teamStatus?.map((member: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                              {member.name[0]}
                            </div>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <Badge variant={
                            member.status === 'active' ? 'default' : 
                            member.status === 'needs-break' ? 'secondary' : 'destructive'
                          }>
                            {member.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeDemo === 'task-feedback' && (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {(getCurrentDemo().example as any)?.message || 'AI feedback generated!'}
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">5</div>
                      <div className="text-xs">Task Streak</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="font-bold text-green-600">+25%</div>
                      <div className="text-xs">Speed Up</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <div className="font-bold text-purple-600">95%</div>
                      <div className="text-xs">Quality</div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemo === 'inactivity-reminders' && (
                <div className="space-y-4">
                  <Alert className="border-orange-200 bg-orange-50">
                    <Coffee className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      {(getCurrentDemo().example as any)?.reminder || 'Smart reminder generated!'}
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    <strong>Manager Notification:</strong><br />
                    {(getCurrentDemo().example as any)?.managerNotification || 'Manager has been notified.'}
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium mb-2">⏰ Work Schedule</h4>
                    <div className="flex justify-center gap-2 text-xs">
                      <Badge variant="outline">Morning: 9-13</Badge>
                      <Badge variant="outline">Lunch: 13-14</Badge>
                      <Badge variant="outline">Evening: 14-18</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">🚀 Project Manager AI Agent Features</CardTitle>
            <CardDescription className="text-center">
              Complete AI-powered project management with work-life balance focus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(demoData).map(([key, demo]) => {
                const IconComponent = demo.icon
                return (
                  <div key={key} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-full ${demo.color} flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium mb-2 text-sm">{demo.title}</h4>
                    <p className="text-xs text-gray-600">{demo.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Enhanced AI Project Creation with Dropdown Prefill Options
// This is a proposed enhancement to the existing AI wizard

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Code, Smartphone, Globe, Brain, ShoppingCart, BarChart } from "lucide-react"

// Enhanced project templates with comprehensive details
export const enhancedProjectTemplates = [
  {
    id: 'ecommerce-platform',
    name: 'E-commerce Platform',
    icon: <ShoppingCart className="w-5 h-5" />,
    description: 'Build a complete online store with product catalog, payment processing, and admin dashboard',
    category: 'software',
    priority: 'HIGH',
    estimatedWeeks: '12-16',
    suggestedTech: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    targetIndustry: 'Retail',
    complexity: 'High',
    teamSize: '4-6',
    keyFeatures: [
      'Product catalog management',
      'Shopping cart & checkout',
      'Payment processing',
      'Order management',
      'Admin dashboard',
      'User authentication'
    ],
    sampleDescription: 'Create a modern e-commerce platform with React frontend, Node.js backend, PostgreSQL database. Include user authentication, product catalog, shopping cart, payment processing with Stripe, order management, and comprehensive admin dashboard.',
    tasks: {
      planning: 3,
      backend: 8,
      frontend: 6,
      integration: 4,
      testing: 3,
      deployment: 1
    }
  },
  {
    id: 'mobile-fitness-app',
    name: 'Mobile Fitness App',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Cross-platform mobile app for fitness tracking with workouts, nutrition, and social features',
    category: 'software',
    priority: 'MEDIUM',
    estimatedWeeks: '10-14',
    suggestedTech: ['React Native', 'Express.js', 'MongoDB', 'Firebase'],
    targetIndustry: 'Health & Fitness',
    complexity: 'Medium',
    teamSize: '3-4',
    keyFeatures: [
      'Workout tracking',
      'Nutrition logging',
      'Progress analytics',
      'Social sharing',
      'Push notifications',
      'Offline support'
    ],
    sampleDescription: 'Develop a cross-platform mobile fitness application using React Native. Include workout tracking, nutrition logging, progress analytics, social features, push notifications, and offline capability.',
    tasks: {
      planning: 2,
      backend: 5,
      mobile: 7,
      integration: 3,
      testing: 2,
      deployment: 1
    }
  },
  {
    id: 'ai-chatbot-system',
    name: 'AI Chatbot System',
    icon: <Brain className="w-5 h-5" />,
    description: 'Intelligent customer support chatbot with NLP, knowledge base, and escalation features',
    category: 'software',
    priority: 'URGENT',
    estimatedWeeks: '8-12',
    suggestedTech: ['Python', 'OpenAI API', 'FastAPI', 'PostgreSQL'],
    targetIndustry: 'Customer Service',
    complexity: 'Very High',
    teamSize: '3-5',
    keyFeatures: [
      'Natural language processing',
      'Knowledge base integration',
      'Multi-language support',
      'Escalation to humans',
      'Analytics dashboard',
      'API integration'
    ],
    sampleDescription: 'Build an intelligent AI chatbot system using OpenAI GPT-4 for customer support. Include natural language processing, knowledge base integration, multi-language support, escalation workflows, and comprehensive analytics.',
    tasks: {
      planning: 2,
      ai_development: 6,
      backend: 4,
      frontend: 3,
      integration: 3,
      testing: 2
    }
  },
  {
    id: 'data-analytics-dashboard',
    name: 'Data Analytics Dashboard',
    icon: <BarChart className="w-5 h-5" />,
    description: 'Business intelligence dashboard with real-time data visualization and reporting',
    category: 'software',
    priority: 'HIGH',
    estimatedWeeks: '6-10',
    suggestedTech: ['React', 'D3.js', 'Python', 'PostgreSQL'],
    targetIndustry: 'Business Intelligence',
    complexity: 'High',
    teamSize: '3-4',
    keyFeatures: [
      'Real-time data visualization',
      'Interactive charts',
      'Custom reporting',
      'Data export',
      'User permissions',
      'API integrations'
    ],
    sampleDescription: 'Create a comprehensive data analytics dashboard with real-time visualization, interactive charts using D3.js, custom reporting capabilities, and secure user management.',
    tasks: {
      planning: 2,
      data_modeling: 3,
      backend: 4,
      frontend: 6,
      visualization: 4,
      testing: 1
    }
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    icon: <Globe className="w-5 h-5" />,
    description: 'Multi-channel digital marketing campaign with automation and analytics',
    category: 'marketing',
    priority: 'MEDIUM',
    estimatedWeeks: '4-8',
    suggestedTech: ['HubSpot', 'Google Analytics', 'Mailchimp', 'Facebook Ads'],
    targetIndustry: 'Marketing',
    complexity: 'Medium',
    teamSize: '2-3',
    keyFeatures: [
      'Multi-channel campaigns',
      'Email automation',
      'Social media integration',
      'Performance tracking',
      'A/B testing',
      'Lead generation'
    ],
    sampleDescription: 'Launch a comprehensive digital marketing campaign across email, social media, and paid advertising channels with automation, analytics, and lead generation.',
    tasks: {
      strategy: 2,
      content_creation: 4,
      campaign_setup: 3,
      automation: 2,
      analytics: 2,
      optimization: 1
    }
  },
  {
    id: 'custom-project',
    name: 'Custom Project',
    icon: <Code className="w-5 h-5" />,
    description: 'Create a custom project based on your specific requirements',
    category: 'other',
    priority: 'MEDIUM',
    estimatedWeeks: 'TBD',
    suggestedTech: [],
    targetIndustry: 'Custom',
    complexity: 'Medium',
    teamSize: 'TBD',
    keyFeatures: [],
    sampleDescription: '',
    tasks: {}
  }
]

// Technology stack options
export const technologyStacks = [
  {
    id: 'react-node',
    name: 'React + Node.js',
    description: 'Modern web application stack',
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    bestFor: ['Web Applications', 'SPAs', 'API Development'],
    complexity: 'Medium',
    icon: '⚛️'
  },
  {
    id: 'nextjs-full',
    name: 'Next.js Full Stack',
    description: 'Complete React framework with SSR',
    technologies: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
    bestFor: ['SSR Applications', 'E-commerce', 'SEO-focused sites'],
    complexity: 'Medium-High',
    icon: '▲'
  },
  {
    id: 'python-django',
    name: 'Python + Django',
    description: 'Robust backend framework',
    technologies: ['Python', 'Django', 'PostgreSQL', 'Redis'],
    bestFor: ['Backend APIs', 'Admin Panels', 'Data Processing'],
    complexity: 'Medium',
    icon: '🐍'
  },
  {
    id: 'mobile-native',
    name: 'React Native',
    description: 'Cross-platform mobile development',
    technologies: ['React Native', 'Expo', 'Firebase', 'AsyncStorage'],
    bestFor: ['Mobile Apps', 'Cross-platform', 'MVP Development'],
    complexity: 'Medium-High',
    icon: '📱'
  },
  {
    id: 'ai-ml-stack',
    name: 'AI/ML Stack',
    description: 'Machine learning and AI development',
    technologies: ['Python', 'FastAPI', 'TensorFlow', 'OpenAI API'],
    bestFor: ['AI Applications', 'Chatbots', 'Data Analysis'],
    complexity: 'High',
    icon: '🤖'
  }
]

// Industry-specific configurations
export const industries = [
  { id: 'ecommerce', name: 'E-commerce & Retail', icon: '🛒', color: '#059669' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#dc2626' },
  { id: 'fintech', name: 'Finance & Fintech', icon: '💰', color: '#2563eb' },
  { id: 'education', name: 'Education & E-learning', icon: '📚', color: '#7c3aed' },
  { id: 'entertainment', name: 'Entertainment & Media', icon: '🎬', color: '#ea580c' },
  { id: 'saas', name: 'SaaS & B2B Tools', icon: '⚙️', color: '#374151' },
  { id: 'marketing', name: 'Marketing & Advertising', icon: '📈', color: '#16a34a' },
  { id: 'other', name: 'Other', icon: '🔧', color: '#6b7280' }
]

// Project complexity levels
export const complexityLevels = [
  {
    id: 'simple',
    name: 'Simple',
    description: 'Basic functionality, minimal integrations',
    estimatedHours: '40-80',
    teamSize: '1-2',
    duration: '2-4 weeks',
    color: '#22c55e'
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Standard features, some integrations',
    estimatedHours: '80-200',
    teamSize: '2-4',
    duration: '4-10 weeks',
    color: '#f59e0b'
  },
  {
    id: 'complex',
    name: 'Complex',
    description: 'Advanced features, multiple integrations',
    estimatedHours: '200-400',
    teamSize: '3-6',
    duration: '10-20 weeks',
    color: '#ef4444'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Large-scale, highly customized solution',
    estimatedHours: '400+',
    teamSize: '5-10',
    duration: '20+ weeks',
    color: '#8b5cf6'
  }
]

// Enhanced AI Project Creation Component with Dropdown Prefills
export function EnhancedAIProjectWizard() {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedTechStack, setSelectedTechStack] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedComplexity, setSelectedComplexity] = useState('')

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = enhancedProjectTemplates.find(t => t.id === templateId)
    if (template) {
      // Auto-populate related fields
      setSelectedIndustry(template.targetIndustry.toLowerCase().replace(' & ', '-'))
      setSelectedComplexity(template.complexity.toLowerCase())
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Choose Project Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project template to get started..." />
            </SelectTrigger>
            <SelectContent>
              {enhancedProjectTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-3 py-2">
                    {template.icon}
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Key Features</h4>
                  <ul className="space-y-1">
                    {enhancedProjectTemplates
                      .find(t => t.id === selectedTemplate)
                      ?.keyFeatures.slice(0, 3)
                      .map((feature, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Project Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>Duration: {enhancedProjectTemplates.find(t => t.id === selectedTemplate)?.estimatedWeeks} weeks</div>
                    <div>Team Size: {enhancedProjectTemplates.find(t => t.id === selectedTemplate)?.teamSize} people</div>
                    <div>Complexity: <Badge variant="outline">{enhancedProjectTemplates.find(t => t.id === selectedTemplate)?.complexity}</Badge></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTechStack} onValueChange={setSelectedTechStack}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your preferred technology stack..." />
            </SelectTrigger>
            <SelectContent>
              {technologyStacks.map((stack) => (
                <SelectItem key={stack.id} value={stack.id}>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-lg">{stack.icon}</span>
                    <div>
                      <div className="font-medium">{stack.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {stack.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 3: Industry & Complexity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Target Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select target industry..." />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    <div className="flex items-center gap-2">
                      <span>{industry.icon}</span>
                      <span>{industry.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Complexity</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
              <SelectTrigger>
                <SelectValue placeholder="Select complexity level..." />
              </SelectTrigger>
              <SelectContent>
                {complexityLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    <div className="py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="font-medium">{level.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {level.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {level.duration} • {level.teamSize} people • {level.estimatedHours} hours
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* AI Generation Preview */}
      {selectedTemplate && selectedTechStack && selectedIndustry && selectedComplexity && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Brain className="w-5 h-5" />
              AI Generation Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-green-700">
                Based on your selections, AI will generate:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Tasks</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(enhancedProjectTemplates.find(t => t.id === selectedTemplate)?.tasks || {}).reduce((a: number, b: number) => a + b, 0)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Technologies</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {technologyStacks.find(s => s.id === selectedTechStack)?.technologies.length || 0}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm">Calendar Events</div>
                  <div className="text-2xl font-bold text-purple-600">8-12</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedAIProjectWizard

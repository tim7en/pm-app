'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowRight, 
  Bot, 
  CheckCircle, 
  Clock, 
  FileText, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Users, 
  Zap,
  Calendar,
  Target,
  Search,
  Lock,
  Globe,
  Star,
  ChevronRight,
  Play,
  Upload,
  Download,
  Archive,
  MessageSquare,
  Paperclip
} from 'lucide-react'

export default function LandingPage() {
  const [activePhase, setActivePhase] = useState(0)

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart Task Management",
      description: "AI-powered task breakdown with dynamic activity feeds and real-time collaboration"
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: "File Attachments",
      description: "Upload, download, and manage files directly within tasks with 10MB storage per file"
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Universal Search",
      description: "Search across tasks, projects, and team members with intelligent filtering and results"
    },
    {
      icon: <Archive className="h-6 w-6" />,
      title: "Activity Logging",
      description: "Clear and archive activity feeds with persistent storage and audit trails"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Management",
      description: "Default avatars, role-based permissions, and seamless team collaboration"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Dynamic Analytics",
      description: "Real-time dashboard with live data generation from actual project activities"
    }
  ]

  const aiWorkflowSteps = [
    {
      title: "Task Creation & Assignment",
      description: "Create tasks with file attachments and assign to team members",
      aiAction: "AI analyzes task context and suggests optimal workflow structures",
      example: "Transform complex projects into manageable subtasks with file organization"
    },
    {
      title: "Real-time Collaboration",
      description: "Team members receive notifications and can access shared files instantly",
      aiAction: "Smart activity tracking with searchable history and archival",
      example: "Automatic progress updates and file versioning across team workspace"
    },
    {
      title: "Progress Analytics",
      description: "Dynamic dashboards showing real task completion and team performance",
      aiAction: "AI-generated insights from actual project data and team patterns",
      example: "Predictive analytics for project timelines and resource allocation"
    },
    {
      title: "Document Management",
      description: "Upload and organize project materials",
      aiAction: "AI scans, classifies, and auto-organizes files",
      example: "Auto-naming: ProjectName_Subtask_Employee_Date.xlsx"
    },
    {
      title: "Intelligent Tracking",
      description: "Centralized knowledge repository",
      aiAction: "Semantic search and material indexing",
      example: "Find any document with natural language queries"
    },
    {
      title: "Quality Assurance",
      description: "PM reviews and verifies deliverables",
      aiAction: "Automated quality checks and approval workflows",
      example: "AI flags incomplete or inconsistent deliverables"
    }
  ]

  const roadmapPhases = [
    {
      phase: "Phase 1",
      title: "Foundations & Views",
      timeline: "Q1 2025",
      progress: 85,
      status: "In Progress",
      features: [
        "Unlimited projects/tasks/logs",
        "File storage (100MB/file)",
        "List & Board (Kanban) views",
        "Task assignment & due dates",
        "Mobile apps MVP"
      ]
    },
    {
      phase: "Phase 2", 
      title: "Productivity & Collaboration",
      timeline: "Q2 2025",
      progress: 25,
      status: "Planning",
      features: [
        "Activity logs & custom templates",
        "Task dependencies",
        "Timeline (Gantt) & Calendar views",
        "Advanced search",
        "Forms & approvals",
        "Unlimited guests"
      ]
    },
    {
      phase: "Phase 3",
      title: "Automation & Integrations", 
      timeline: "Q3 2025",
      progress: 5,
      status: "Upcoming",
      features: [
        "Rules engine & workflow automation",
        "100+ app integrations",
        "Time tracking integrations",
        "Jira Cloud/Server integration",
        "Proofing workflows"
      ]
    },
    {
      phase: "Phase 4",
      title: "AI & Advanced Reporting",
      timeline: "Q4 2025",
      progress: 0,
      status: "Planned",
      features: [
        "AI Smart fields & editor",
        "AI summaries & answers",
        "AI Studio with credits",
        "Advanced reporting dashboards",
        "Tableau & PowerBI integration"
      ]
    },
    {
      phase: "Phase 5",
      title: "Enterprise & Compliance",
      timeline: "Q1 2026",
      progress: 0,
      status: "Future",
      features: [
        "SOC 2 & HIPAA compliance",
        "SAML SSO & SCIM",
        "Custom branding",
        "24/7 premium support",
        "Cross-region backups"
      ]
    }
  ]

  const coreFeatures = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: "AI-Powered Task Breakdown",
      description: "Transform high-level objectives into actionable, structured subtasks automatically"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Intelligent Document Management", 
      description: "AI scans, classifies, and organizes project files with semantic search capabilities"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-time Progress Tracking",
      description: "Live updates, milestone notifications, and comprehensive project analytics"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Role-based Collaboration",
      description: "Assign team members with granular permissions and automated workflows"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Workflow Automation",
      description: "Rules engine with triggers, actions, and seamless third-party integrations"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Enterprise Security",
      description: "SOC 2, HIPAA compliance with SAML SSO and comprehensive audit trails"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PM-App
            </span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#ai-workflow" className="text-gray-600 hover:text-blue-600 transition-colors">AI Workflow</a>
            <a href="#roadmap" className="text-gray-600 hover:text-blue-600 transition-colors">Roadmap</a>
          </nav>
          <div className="flex space-x-3">
            <Link href="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Star className="mr-1 h-3 w-3" />
            Complete Project Management Suite
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Project Manager
            <br />
            Project Excellence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete project management platform with file attachments, universal search, 
            activity logging, and intelligent team collaboration tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
                <Play className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              <Calendar className="mr-2 h-5 w-5" />
              View Features
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Project Management Suite</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for modern project management with advanced file handling and team collaboration
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Section */}
      <section id="ai-workflow" className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Streamlined Project Workflow</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Project Manager transforms your project lifecycle with intelligent task management, 
              file organization, and real-time team collaboration
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Workflow Steps */}
              <div className="space-y-6">
                {aiWorkflowSteps.map((step, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all duration-300 ${
                      activePhase === index 
                        ? 'ring-2 ring-blue-500 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setActivePhase(index)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          activePhase === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      <div className="flex items-center text-sm text-blue-600">
                        <Bot className="h-4 w-4 mr-1" />
                        {step.aiAction}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Step Details */}
              <div className="lg:sticky lg:top-24">
                <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <div className="flex items-center mb-4">
                    <Bot className="h-8 w-8 mr-3" />
                    <h3 className="text-2xl font-bold">AI in Action</h3>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">
                    {aiWorkflowSteps[activePhase]?.title}
                  </h4>
                  <p className="text-blue-100 mb-4">
                    {aiWorkflowSteps[activePhase]?.aiAction}
                  </p>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm font-medium mb-2">Example:</p>
                    <p className="text-blue-100">
                      {aiWorkflowSteps[activePhase]?.example}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Roadmap */}
      <section id="roadmap" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Development Roadmap 2025</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our journey to becoming the most advanced AI-powered project management platform
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {roadmapPhases.map((phase, index) => (
              <div key={index} className="relative mb-12 last:mb-0">
                {/* Timeline Line */}
                {index < roadmapPhases.length - 1 && (
                  <div className="absolute left-6 top-24 w-0.5 h-full bg-gray-200 -z-10"></div>
                )}
                
                <div className="flex gap-8">
                  {/* Timeline Dot */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      phase.progress > 50 
                        ? 'bg-green-500' 
                        : phase.progress > 0 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}>
                      {phase.progress > 90 ? <CheckCircle className="h-6 w-6" /> : index + 1}
                    </div>
                  </div>

                  {/* Phase Content */}
                  <Card className="flex-1 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge 
                            variant={
                              phase.status === 'In Progress' ? 'default' :
                              phase.status === 'Planning' ? 'secondary' :
                              phase.status === 'Upcoming' ? 'outline' :
                              'outline'
                            }
                            className="mb-2"
                          >
                            {phase.status}
                          </Badge>
                          <CardTitle className="text-2xl">{phase.phase}: {phase.title}</CardTitle>
                          <CardDescription className="text-lg font-medium text-blue-600">
                            {phase.timeline}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-700">{phase.progress}%</div>
                          <div className="text-sm text-gray-500">Complete</div>
                        </div>
                      </div>
                      <Progress value={phase.progress} className="w-full" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-2">
                        {phase.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-2">
                            <CheckCircle className={`h-4 w-4 ${
                              phase.progress > 50 ? 'text-green-500' : 'text-gray-300'
                            }`} />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Achievements Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What We've Built</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Project Manager is a fully functional project management platform with all the features modern teams need
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Paperclip className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>File Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Upload, download, and manage files directly within tasks. 10MB file limit with secure storage.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Universal Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Search across tasks, projects, and team members with real-time results and intelligent filtering.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Activity Logging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Clear and archive activity feeds with persistent storage. Full audit trail of all project activities.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Default avatars, role-based permissions, seamless invitations, and real-time collaboration tools.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle>Live Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Dynamic dashboards with real-time data generation from actual project activities and team performance.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle>Smart Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Comprehensive task management with drag-and-drop boards, priority levels, and automated notifications.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Badge className="bg-green-100 text-green-700 px-4 py-2 text-lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              All Features Fully Functional & Ready to Use
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Experience Project Manager?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join us and experience complete project management with all features fully functional. 
              Start managing your projects with advanced file handling, search, and team collaboration today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3">
                  <Play className="mr-2 h-5 w-5" />
                  Get Started Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-3">
                <Target className="mr-2 h-5 w-5" />
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Project Manager</span>
              </div>
              <p className="text-gray-400">
                Complete project management platform for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-gray-400">
                <div>Features</div>
                <div>Pricing</div>
                <div>API</div>
                <div>Integrations</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>About</div>
                <div>Blog</div>
                <div>Careers</div>
                <div>Contact</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <div className="space-y-2 text-gray-400">
                <div>Documentation</div>
                <div>Help Center</div>
                <div>Status</div>
                <div>Security</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <p className="text-gray-400">© 2025 Project Manager. All rights reserved.</p>
            <div className="flex space-x-6 text-gray-400">
              <div>Privacy Policy</div>
              <div>Terms of Service</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

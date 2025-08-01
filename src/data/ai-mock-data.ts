// Mock data for AI Project Generation Demo
// This file contains realistic project scenarios and AI-generated content

export interface MockProjectScenario {
  id: string
  name: string
  description: string
  category: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  expectedTasks: number
  expectedDuration: string
  aiAnalysis: {
    complexity: "Low" | "Medium" | "High" | "Very High"
    estimatedHours: number
    riskLevel: "Low" | "Medium" | "High"
    teamSize: number
    keyTechnologies: string[]
    recommendations: string[]
  }
  generatedTasks: Array<{
    id: string
    title: string
    description: string
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    estimatedHours: number
    dependsOn?: string[]
    category: string
    tags: string[]
    phase: string
  }>
  calendarEvents: Array<{
    id: string
    title: string
    description: string
    date: Date
    duration: number
    type: "meeting" | "milestone" | "review" | "planning"
    attendees: string[]
  }>
}

export const mockProjectScenarios: MockProjectScenario[] = [
  {
    id: "ecommerce-platform",
    name: "E-commerce Platform",
    description: "Build a modern e-commerce platform with React, Node.js, and PostgreSQL. Include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.",
    category: "Web Development",
    priority: "HIGH",
    expectedTasks: 25,
    expectedDuration: "12-16 weeks",
    aiAnalysis: {
      complexity: "High",
      estimatedHours: 480,
      riskLevel: "Medium",
      teamSize: 4,
      keyTechnologies: ["React", "Node.js", "PostgreSQL", "Stripe API", "Redis"],
      recommendations: [
        "Consider using Next.js for better SEO and performance",
        "Implement comprehensive testing strategy early",
        "Plan for scalable database architecture",
        "Set up CI/CD pipeline from the start",
        "Consider microservices architecture for payment processing"
      ]
    },
    generatedTasks: [
      {
        id: "task-1",
        title: "Project Setup and Architecture Planning",
        description: "Initialize project structure, set up development environment, and create technical architecture documentation",
        priority: "HIGH",
        estimatedHours: 8,
        category: "Setup",
        tags: ["architecture", "setup", "documentation"],
        phase: "Planning"
      },
      {
        id: "task-2",
        title: "Database Schema Design",
        description: "Design and implement PostgreSQL database schema for users, products, orders, and inventory management",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["task-1"],
        category: "Backend",
        tags: ["database", "postgresql", "schema"],
        phase: "Foundation"
      },
      {
        id: "task-3",
        title: "User Authentication System",
        description: "Implement JWT-based authentication with registration, login, password reset, and email verification",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["task-2"],
        category: "Backend",
        tags: ["auth", "jwt", "security"],
        phase: "Core Features"
      },
      {
        id: "task-4",
        title: "Product Catalog API",
        description: "Create RESTful API endpoints for product CRUD operations, categories, and search functionality",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["task-2"],
        category: "Backend",
        tags: ["api", "products", "rest"],
        phase: "Core Features"
      },
      {
        id: "task-5",
        title: "Frontend UI Components Library",
        description: "Build reusable React components using Tailwind CSS for consistent design system",
        priority: "MEDIUM",
        estimatedHours: 24,
        dependsOn: ["task-1"],
        category: "Frontend",
        tags: ["react", "components", "tailwind"],
        phase: "UI Development"
      },
      {
        id: "task-6",
        title: "Product Listing and Search Interface",
        description: "Implement product listing page with filtering, sorting, and search functionality",
        priority: "HIGH",
        estimatedHours: 18,
        dependsOn: ["task-4", "task-5"],
        category: "Frontend",
        tags: ["ui", "search", "products"],
        phase: "UI Development"
      },
      {
        id: "task-7",
        title: "Shopping Cart System",
        description: "Build shopping cart functionality with add/remove items, quantity updates, and persistence",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["task-3", "task-5"],
        category: "Frontend",
        tags: ["cart", "state-management", "persistence"],
        phase: "Core Features"
      },
      {
        id: "task-8",
        title: "Payment Integration",
        description: "Integrate Stripe payment processing with secure checkout flow and order confirmation",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["task-7"],
        category: "Backend",
        tags: ["payment", "stripe", "security"],
        phase: "Payment System"
      },
      {
        id: "task-9",
        title: "Order Management System",
        description: "Implement order tracking, status updates, and order history for users and admins",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["task-8"],
        category: "Backend",
        tags: ["orders", "tracking", "admin"],
        phase: "Order Management"
      },
      {
        id: "task-10",
        title: "Admin Dashboard",
        description: "Create comprehensive admin panel for managing products, orders, users, and analytics",
        priority: "MEDIUM",
        estimatedHours: 30,
        dependsOn: ["task-4", "task-9"],
        category: "Frontend",
        tags: ["admin", "dashboard", "analytics"],
        phase: "Admin Features"
      },
      {
        id: "task-11",
        title: "Inventory Management",
        description: "Implement stock tracking, low inventory alerts, and automated reorder notifications",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["task-4"],
        category: "Backend",
        tags: ["inventory", "alerts", "automation"],
        phase: "Advanced Features"
      },
      {
        id: "task-12",
        title: "Email Notification System",
        description: "Set up email notifications for order confirmations, shipping updates, and marketing campaigns",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["task-8"],
        category: "Backend",
        tags: ["email", "notifications", "marketing"],
        phase: "Communication"
      },
      {
        id: "task-13",
        title: "Performance Optimization",
        description: "Implement caching strategies, image optimization, and database query optimization",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["task-6", "task-10"],
        category: "Optimization",
        tags: ["performance", "caching", "optimization"],
        phase: "Optimization"
      },
      {
        id: "task-14",
        title: "Security Audit and Testing",
        description: "Conduct security review, implement rate limiting, input validation, and penetration testing",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["task-8", "task-13"],
        category: "Security",
        tags: ["security", "testing", "validation"],
        phase: "Security & Testing"
      },
      {
        id: "task-15",
        title: "Mobile Responsiveness",
        description: "Ensure complete mobile responsiveness and implement Progressive Web App features",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["task-6", "task-7"],
        category: "Frontend",
        tags: ["mobile", "responsive", "pwa"],
        phase: "Mobile Optimization"
      }
    ],
    calendarEvents: [
      {
        id: "kickoff",
        title: "Project Kickoff Meeting",
        description: "Initial team meeting to review project scope, architecture, and assign responsibilities",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 120,
        type: "meeting",
        attendees: ["Team Lead", "Backend Developer", "Frontend Developer", "UI/UX Designer"]
      },
      {
        id: "arch-review",
        title: "Architecture Review",
        description: "Review database schema and system architecture decisions",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        duration: 90,
        type: "review",
        attendees: ["Team Lead", "Backend Developer", "System Architect"]
      },
      {
        id: "sprint-1",
        title: "Sprint 1 Planning",
        description: "Plan first sprint focusing on project setup and core backend features",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        duration: 60,
        type: "planning",
        attendees: ["Full Team"]
      },
      {
        id: "milestone-1",
        title: "Core Backend Milestone",
        description: "Review completion of authentication and product API systems",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
        duration: 60,
        type: "milestone",
        attendees: ["Team Lead", "Backend Developer", "QA Engineer"]
      },
      {
        id: "ui-review",
        title: "UI/UX Design Review",
        description: "Review and approve user interface designs and user experience flow",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        duration: 90,
        type: "review",
        attendees: ["UI/UX Designer", "Frontend Developer", "Product Manager"]
      },
      {
        id: "milestone-2",
        title: "Frontend Core Features",
        description: "Review product listing, cart, and basic user interface completion",
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 5 weeks
        duration: 60,
        type: "milestone",
        attendees: ["Full Team"]
      }
    ]
  },
  {
    id: "mobile-fitness-app",
    name: "Mobile Fitness Tracking App",
    description: "Create a cross-platform mobile app using React Native for fitness tracking, workout plans, nutrition logging, and social features with real-time sync.",
    category: "Mobile Development",
    priority: "MEDIUM",
    expectedTasks: 20,
    expectedDuration: "10-12 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 320,
      riskLevel: "Low",
      teamSize: 3,
      keyTechnologies: ["React Native", "Firebase", "AsyncStorage", "HealthKit", "Google Fit"],
      recommendations: [
        "Focus on offline functionality for better user experience",
        "Implement proper data synchronization strategy",
        "Consider using expo for faster development",
        "Plan for both iOS and Android platform differences",
        "Implement comprehensive analytics for user behavior"
      ]
    },
    generatedTasks: [
      {
        id: "mobile-task-1",
        title: "React Native Project Setup",
        description: "Initialize React Native project with navigation, state management, and development environment",
        priority: "HIGH",
        estimatedHours: 6,
        category: "Setup",
        tags: ["react-native", "setup", "navigation"],
        phase: "Initial Setup"
      },
      {
        id: "mobile-task-2",
        title: "User Authentication Flow",
        description: "Implement user registration, login, and profile management with Firebase Auth",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["mobile-task-1"],
        category: "Authentication",
        tags: ["auth", "firebase", "user-management"],
        phase: "Core Features"
      },
      {
        id: "mobile-task-3",
        title: "Workout Tracking Interface",
        description: "Create UI for logging workouts, exercises, sets, reps, and weights with timer functionality",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["mobile-task-2"],
        category: "Features",
        tags: ["ui", "workouts", "tracking"],
        phase: "Core Features"
      },
      {
        id: "mobile-task-4",
        title: "Nutrition Logging System",
        description: "Build calorie and macro tracking with food database integration and barcode scanning",
        priority: "MEDIUM",
        estimatedHours: 24,
        dependsOn: ["mobile-task-2"],
        category: "Features",
        tags: ["nutrition", "calories", "barcode"],
        phase: "Extended Features"
      },
      {
        id: "mobile-task-5",
        title: "Progress Analytics Dashboard",
        description: "Create charts and graphs showing workout progress, weight trends, and goal achievements",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["mobile-task-3", "mobile-task-4"],
        category: "Analytics",
        tags: ["charts", "progress", "analytics"],
        phase: "Analytics"
      },
      {
        id: "mobile-task-6",
        title: "Social Features",
        description: "Implement friend system, workout sharing, and achievement badges",
        priority: "LOW",
        estimatedHours: 18,
        dependsOn: ["mobile-task-5"],
        category: "Social",
        tags: ["social", "friends", "achievements"],
        phase: "Social Features"
      },
      {
        id: "mobile-task-7",
        title: "Offline Data Sync",
        description: "Implement offline storage and sync functionality for seamless user experience",
        priority: "HIGH",
        estimatedHours: 14,
        dependsOn: ["mobile-task-3"],
        category: "Sync",
        tags: ["offline", "sync", "storage"],
        phase: "Data Management"
      },
      {
        id: "mobile-task-8",
        title: "Push Notifications",
        description: "Set up workout reminders, achievement notifications, and social activity alerts",
        priority: "MEDIUM",
        estimatedHours: 10,
        dependsOn: ["mobile-task-6"],
        category: "Notifications",
        tags: ["push", "notifications", "reminders"],
        phase: "Engagement"
      }
    ],
    calendarEvents: [
      {
        id: "mobile-kickoff",
        title: "Mobile App Kickoff",
        description: "Project initiation and team alignment for fitness app development",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        type: "meeting",
        attendees: ["Mobile Developer", "UI/UX Designer", "Product Manager"]
      },
      {
        id: "mobile-prototype",
        title: "Prototype Review",
        description: "Review initial app prototype and user flow",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 60,
        type: "review",
        attendees: ["Mobile Developer", "UI/UX Designer", "Stakeholder"]
      }
    ]
  },
  {
    id: "ai-chatbot",
    name: "AI Customer Support Chatbot",
    description: "Develop an intelligent chatbot using OpenAI GPT-4 for customer support with natural language processing, knowledge base integration, and escalation to human agents.",
    category: "AI/ML",
    priority: "URGENT",
    expectedTasks: 15,
    expectedDuration: "8-10 weeks",
    aiAnalysis: {
      complexity: "Very High",
      estimatedHours: 280,
      riskLevel: "High",
      teamSize: 3,
      keyTechnologies: ["OpenAI API", "Python", "FastAPI", "Vector DB", "React"],
      recommendations: [
        "Start with a comprehensive knowledge base",
        "Implement proper conversation context management",
        "Plan for scalable vector database architecture",
        "Consider implementing fallback mechanisms",
        "Focus on conversation quality metrics from day one"
      ]
    },
    generatedTasks: [
      {
        id: "ai-task-1",
        title: "AI Architecture Planning",
        description: "Design chatbot architecture with conversation flow, NLP pipeline, and integration points",
        priority: "URGENT",
        estimatedHours: 8,
        category: "Planning",
        tags: ["architecture", "ai", "planning"],
        phase: "Foundation"
      },
      {
        id: "ai-task-2",
        title: "Knowledge Base Development",
        description: "Create and structure company knowledge base with FAQ, policies, and product information",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["ai-task-1"],
        category: "Content",
        tags: ["knowledge-base", "content", "faq"],
        phase: "Content Creation"
      },
      {
        id: "ai-task-3",
        title: "OpenAI Integration",
        description: "Implement OpenAI GPT-4 integration with proper prompt engineering and response handling",
        priority: "URGENT",
        estimatedHours: 20,
        dependsOn: ["ai-task-1"],
        category: "AI",
        tags: ["openai", "gpt4", "integration"],
        phase: "AI Implementation"
      },
      {
        id: "ai-task-4",
        title: "Conversation Context Management",
        description: "Build system to maintain conversation context and user session state",
        priority: "HIGH",
        estimatedHours: 14,
        dependsOn: ["ai-task-3"],
        category: "Backend",
        tags: ["context", "session", "state"],
        phase: "Core Logic"
      },
      {
        id: "ai-task-5",
        title: "Chat Interface Development",
        description: "Create responsive chat interface with typing indicators, message history, and rich media support",
        priority: "HIGH",
        estimatedHours: 18,
        dependsOn: ["ai-task-4"],
        category: "Frontend",
        tags: ["chat", "ui", "interface"],
        phase: "User Interface"
      },
      {
        id: "ai-task-6",
        title: "Human Escalation System",
        description: "Implement intelligent routing to human agents when AI cannot resolve issues",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["ai-task-5"],
        category: "Integration",
        tags: ["escalation", "human-agents", "routing"],
        phase: "Advanced Features"
      },
      {
        id: "ai-task-7",
        title: "Analytics and Monitoring",
        description: "Set up conversation analytics, performance monitoring, and quality metrics tracking",
        priority: "MEDIUM",
        estimatedHours: 10,
        dependsOn: ["ai-task-6"],
        category: "Analytics",
        tags: ["analytics", "monitoring", "metrics"],
        phase: "Monitoring"
      }
    ],
    calendarEvents: [
      {
        id: "ai-kickoff",
        title: "AI Chatbot Project Kickoff",
        description: "Strategic planning session for AI chatbot implementation",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        type: "meeting",
        attendees: ["AI Engineer", "Backend Developer", "Product Manager", "Customer Success"]
      },
      {
        id: "ai-prototype",
        title: "AI Prototype Demo",
        description: "Demonstrate initial chatbot capabilities and gather feedback",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "milestone",
        attendees: ["Full Team", "Stakeholders"]
      }
    ]
  }
]

// Sample team members for assignment
export const mockTeamMembers = [
  {
    id: "member-1",
    name: "Alex Johnson",
    email: "alex@company.com",
    role: "Full Stack Developer",
    skills: ["React", "Node.js", "PostgreSQL", "AWS"],
    availability: 40,
    currentWorkload: "Medium"
  },
  {
    id: "member-2",
    name: "Sarah Chen",
    email: "sarah@company.com",
    role: "Frontend Developer",
    skills: ["React", "TypeScript", "Tailwind CSS", "Mobile"],
    availability: 35,
    currentWorkload: "Low"
  },
  {
    id: "member-3",
    name: "Michael Rodriguez",
    email: "michael@company.com",
    role: "Backend Developer",
    skills: ["Python", "FastAPI", "PostgreSQL", "Redis"],
    availability: 40,
    currentWorkload: "High"
  },
  {
    id: "member-4",
    name: "Emily Davis",
    email: "emily@company.com",
    role: "UI/UX Designer",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
    availability: 30,
    currentWorkload: "Medium"
  },
  {
    id: "member-5",
    name: "David Kim",
    email: "david@company.com",
    role: "DevOps Engineer",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    availability: 40,
    currentWorkload: "Low"
  }
]

// Helper function to get a random project scenario
export const getRandomProjectScenario = (): MockProjectScenario => {
  const randomIndex = Math.floor(Math.random() * mockProjectScenarios.length)
  return mockProjectScenarios[randomIndex]
}

// Helper function to get project scenario by category
export const getProjectScenarioByCategory = (category: string): MockProjectScenario | undefined => {
  return mockProjectScenarios.find(scenario => 
    scenario.category.toLowerCase().includes(category.toLowerCase())
  )
}

// AI-generated project insights
export const generateProjectInsights = (scenario: MockProjectScenario) => {
  return {
    timeline: `Based on AI analysis, this project will take approximately ${scenario.expectedDuration} with ${scenario.aiAnalysis.teamSize} team members.`,
    complexity: `Project complexity is rated as ${scenario.aiAnalysis.complexity} due to ${scenario.aiAnalysis.keyTechnologies.join(', ')} technology stack.`,
    risks: `Risk level is ${scenario.aiAnalysis.riskLevel}. Main concerns include integration complexity and timeline dependencies.`,
    recommendations: scenario.aiAnalysis.recommendations,
    estimatedCost: `Estimated development cost: $${(scenario.aiAnalysis.estimatedHours * 75).toLocaleString()} (based on ${scenario.aiAnalysis.estimatedHours} hours at $75/hour)`,
    teamComposition: `Recommended team: ${scenario.aiAnalysis.teamSize} developers including full-stack, frontend, and backend specialists.`
  }
}

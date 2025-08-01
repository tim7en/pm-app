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
  },
  {
    id: "marketing-campaign",
    name: "Product Launch Marketing Campaign",
    description: "Launch a comprehensive marketing campaign for a new product including market research, content creation, social media strategy, PR outreach, and performance tracking.",
    category: "Marketing",
    priority: "HIGH",
    expectedTasks: 18,
    expectedDuration: "8-10 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 240,
      riskLevel: "Low",
      teamSize: 4,
      keyTechnologies: ["Google Analytics", "Social Media Platforms", "Email Marketing Tools", "CRM"],
      recommendations: [
        "Start with thorough market research and competitor analysis",
        "Develop clear brand messaging and positioning",
        "Create content calendar with consistent posting schedule",
        "Set up proper tracking and analytics from day one",
        "Plan for crisis communication and response strategy"
      ]
    },
    generatedTasks: [
      {
        id: "marketing-task-1",
        title: "Market Research and Analysis",
        description: "Conduct comprehensive market research including competitor analysis, target audience research, and market positioning study",
        priority: "HIGH",
        estimatedHours: 16,
        category: "Research",
        tags: ["research", "competitors", "audience"],
        phase: "Foundation"
      },
      {
        id: "marketing-task-2",
        title: "Brand Messaging and Positioning",
        description: "Develop core brand messages, value propositions, and positioning statements for the product launch",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["marketing-task-1"],
        category: "Strategy",
        tags: ["branding", "messaging", "positioning"],
        phase: "Strategy Development"
      },
      {
        id: "marketing-task-3",
        title: "Content Strategy and Calendar",
        description: "Create content strategy and detailed calendar for blog posts, social media, email campaigns, and PR materials",
        priority: "HIGH",
        estimatedHours: 14,
        dependsOn: ["marketing-task-2"],
        category: "Content",
        tags: ["content", "calendar", "strategy"],
        phase: "Content Planning"
      },
      {
        id: "marketing-task-4",
        title: "Social Media Campaign Setup",
        description: "Set up and optimize social media profiles, create posting schedule, and prepare launch content",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["marketing-task-3"],
        category: "Social Media",
        tags: ["social", "setup", "content"],
        phase: "Channel Setup"
      },
      {
        id: "marketing-task-5",
        title: "Email Marketing Campaign",
        description: "Design email templates, set up automation sequences, and create subscriber acquisition strategy",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["marketing-task-3"],
        category: "Email Marketing",
        tags: ["email", "templates", "automation"],
        phase: "Channel Setup"
      },
      {
        id: "marketing-task-6",
        title: "PR and Media Outreach",
        description: "Identify media contacts, craft press releases, and execute PR outreach strategy",
        priority: "MEDIUM",
        estimatedHours: 20,
        dependsOn: ["marketing-task-2"],
        category: "Public Relations",
        tags: ["pr", "media", "outreach"],
        phase: "Public Relations"
      },
      {
        id: "marketing-task-7",
        title: "Influencer Partnership Program",
        description: "Identify and reach out to relevant influencers, negotiate partnerships, and manage collaboration campaigns",
        priority: "LOW",
        estimatedHours: 24,
        dependsOn: ["marketing-task-4"],
        category: "Influencer Marketing",
        tags: ["influencers", "partnerships", "collaboration"],
        phase: "Partnerships"
      },
      {
        id: "marketing-task-8",
        title: "Launch Event Planning",
        description: "Plan and coordinate product launch event including venue, speakers, logistics, and promotional materials",
        priority: "HIGH",
        estimatedHours: 28,
        dependsOn: ["marketing-task-6"],
        category: "Events",
        tags: ["event", "launch", "coordination"],
        phase: "Launch Execution"
      },
      {
        id: "marketing-task-9",
        title: "Performance Tracking Setup",
        description: "Set up analytics, tracking pixels, and reporting dashboards to measure campaign performance",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["marketing-task-4", "marketing-task-5"],
        category: "Analytics",
        tags: ["analytics", "tracking", "reporting"],
        phase: "Measurement"
      },
      {
        id: "marketing-task-10",
        title: "Customer Feedback Collection",
        description: "Design and implement systems to collect customer feedback, reviews, and testimonials",
        priority: "MEDIUM",
        estimatedHours: 10,
        dependsOn: ["marketing-task-8"],
        category: "Customer Success",
        tags: ["feedback", "reviews", "testimonials"],
        phase: "Post-Launch"
      }
    ],
    calendarEvents: [
      {
        id: "marketing-kickoff",
        title: "Marketing Campaign Kickoff",
        description: "Initial team meeting to review campaign strategy and assign responsibilities",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        type: "meeting",
        attendees: ["Marketing Manager", "Content Creator", "Social Media Manager", "PR Specialist"]
      },
      {
        id: "content-review",
        title: "Content Review Meeting",
        description: "Review and approve content calendar and initial creative materials",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 60,
        type: "review",
        attendees: ["Marketing Team", "Creative Team", "Brand Manager"]
      },
      {
        id: "launch-preparation",
        title: "Launch Preparation Meeting",
        description: "Final preparation meeting before product launch",
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        duration: 120,
        type: "planning",
        attendees: ["Full Marketing Team", "Product Team", "Sales Team"]
      }
    ]
  },
  {
    id: "event-planning",
    name: "Corporate Conference Planning",
    description: "Plan and execute a two-day corporate conference including venue booking, speaker coordination, catering, registration, and post-event follow-up.",
    category: "Event Planning",
    priority: "HIGH",
    expectedTasks: 22,
    expectedDuration: "12-16 weeks",
    aiAnalysis: {
      complexity: "High",
      estimatedHours: 320,
      riskLevel: "Medium",
      teamSize: 5,
      keyTechnologies: ["Event Management Software", "Registration Platforms", "AV Equipment", "Live Streaming"],
      recommendations: [
        "Book venue and key speakers as early as possible",
        "Create detailed timeline with buffer time for delays",
        "Prepare contingency plans for weather and technical issues",
        "Set up registration and communication systems early",
        "Plan comprehensive post-event follow-up strategy"
      ]
    },
    generatedTasks: [
      {
        id: "event-task-1",
        title: "Event Concept and Budget Planning",
        description: "Define event objectives, theme, target audience, and establish comprehensive budget breakdown",
        priority: "HIGH",
        estimatedHours: 12,
        category: "Planning",
        tags: ["concept", "budget", "objectives"],
        phase: "Initial Planning"
      },
      {
        id: "event-task-2",
        title: "Venue Research and Booking",
        description: "Research suitable venues, conduct site visits, negotiate contracts, and secure booking",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["event-task-1"],
        category: "Venue",
        tags: ["venue", "booking", "contracts"],
        phase: "Venue Securing"
      },
      {
        id: "event-task-3",
        title: "Speaker Identification and Outreach",
        description: "Identify keynote speakers and panelists, reach out with invitations, and secure commitments",
        priority: "HIGH",
        estimatedHours: 24,
        dependsOn: ["event-task-1"],
        category: "Speakers",
        tags: ["speakers", "outreach", "coordination"],
        phase: "Speaker Acquisition"
      },
      {
        id: "event-task-4",
        title: "Registration System Setup",
        description: "Set up online registration platform, create registration forms, and establish payment processing",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["event-task-2"],
        category: "Registration",
        tags: ["registration", "platform", "payments"],
        phase: "Systems Setup"
      },
      {
        id: "event-task-5",
        title: "Marketing and Promotion Strategy",
        description: "Develop marketing materials, create promotional timeline, and execute outreach campaigns",
        priority: "MEDIUM",
        estimatedHours: 22,
        dependsOn: ["event-task-3", "event-task-4"],
        category: "Marketing",
        tags: ["marketing", "promotion", "outreach"],
        phase: "Promotion"
      },
      {
        id: "event-task-6",
        title: "Catering and Menu Planning",
        description: "Select catering vendor, plan menus for breaks and meals, accommodate dietary restrictions",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["event-task-2"],
        category: "Catering",
        tags: ["catering", "menu", "dietary"],
        phase: "Service Planning"
      },
      {
        id: "event-task-7",
        title: "Audio-Visual and Technology Setup",
        description: "Coordinate AV equipment, lighting, live streaming setup, and technical rehearsals",
        priority: "HIGH",
        estimatedHours: 18,
        dependsOn: ["event-task-2"],
        category: "Technology",
        tags: ["av", "technology", "streaming"],
        phase: "Technical Setup"
      },
      {
        id: "event-task-8",
        title: "Attendee Communication Plan",
        description: "Create communication timeline, send regular updates, and provide event information to attendees",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["event-task-4"],
        category: "Communication",
        tags: ["communication", "updates", "information"],
        phase: "Attendee Management"
      },
      {
        id: "event-task-9",
        title: "Logistics and Day-of Coordination",
        description: "Coordinate all day-of-event logistics including setup, staff assignments, and timeline management",
        priority: "HIGH",
        estimatedHours: 32,
        dependsOn: ["event-task-6", "event-task-7"],
        category: "Logistics",
        tags: ["logistics", "coordination", "staff"],
        phase: "Event Execution"
      },
      {
        id: "event-task-10",
        title: "Post-Event Follow-up and Analysis",
        description: "Send thank you messages, collect feedback, analyze attendance data, and prepare final report",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["event-task-9"],
        category: "Follow-up",
        tags: ["follow-up", "feedback", "analysis"],
        phase: "Post-Event"
      }
    ],
    calendarEvents: [
      {
        id: "event-kickoff",
        title: "Conference Planning Kickoff",
        description: "Initial planning meeting to establish goals, timeline, and team responsibilities",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        type: "meeting",
        attendees: ["Event Manager", "Marketing Lead", "Operations Manager", "Logistics Coordinator"]
      },
      {
        id: "venue-selection",
        title: "Venue Selection Meeting",
        description: "Final venue selection and contract negotiation meeting",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "milestone",
        attendees: ["Event Manager", "Operations Manager", "Finance Team"]
      },
      {
        id: "speaker-coordination",
        title: "Speaker Coordination Call",
        description: "Coordination call with confirmed speakers to discuss logistics and requirements",
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        duration: 60,
        type: "meeting",
        attendees: ["Event Manager", "Speakers", "AV Team"]
      },
      {
        id: "final-walkthrough",
        title: "Final Event Walkthrough",
        description: "Final venue walkthrough and rehearsal before the event",
        date: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        duration: 180,
        type: "review",
        attendees: ["Full Event Team", "Venue Staff", "Speakers"]
      }
    ]
  },
  {
    id: "business-development",
    name: "Strategic Partnership Development",
    description: "Identify, evaluate, and establish strategic partnerships to expand market reach, including partner research, proposal development, negotiation, and onboarding.",
    category: "Business Development",
    priority: "MEDIUM",
    expectedTasks: 16,
    expectedDuration: "16-20 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 280,
      riskLevel: "Medium",
      teamSize: 3,
      keyTechnologies: ["CRM Software", "Data Analytics Tools", "Contract Management", "Communication Platforms"],
      recommendations: [
        "Develop clear partnership criteria and evaluation framework",
        "Create standardized partnership proposal templates",
        "Establish legal review process for all partnerships",
        "Set up tracking system for partnership performance",
        "Plan comprehensive partner onboarding program"
      ]
    },
    generatedTasks: [
      {
        id: "bd-task-1",
        title: "Partnership Strategy Development",
        description: "Define partnership objectives, target partner profiles, and success metrics for strategic alliances",
        priority: "HIGH",
        estimatedHours: 16,
        category: "Strategy",
        tags: ["strategy", "objectives", "metrics"],
        phase: "Strategic Planning"
      },
      {
        id: "bd-task-2",
        title: "Market and Partner Research",
        description: "Conduct comprehensive research to identify potential strategic partners in target markets",
        priority: "HIGH",
        estimatedHours: 24,
        dependsOn: ["bd-task-1"],
        category: "Research",
        tags: ["research", "market-analysis", "partners"],
        phase: "Partner Identification"
      },
      {
        id: "bd-task-3",
        title: "Partner Evaluation Framework",
        description: "Create scoring system and evaluation criteria to assess potential partners objectively",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["bd-task-1"],
        category: "Framework",
        tags: ["evaluation", "criteria", "scoring"],
        phase: "Assessment Tools"
      },
      {
        id: "bd-task-4",
        title: "Initial Partner Outreach",
        description: "Develop outreach templates and initiate contact with high-priority potential partners",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["bd-task-2", "bd-task-3"],
        category: "Outreach",
        tags: ["outreach", "templates", "contact"],
        phase: "Initial Contact"
      },
      {
        id: "bd-task-5",
        title: "Partnership Proposal Development",
        description: "Create detailed partnership proposals outlining mutual benefits, terms, and collaboration framework",
        priority: "HIGH",
        estimatedHours: 28,
        dependsOn: ["bd-task-4"],
        category: "Proposals",
        tags: ["proposals", "benefits", "framework"],
        phase: "Proposal Creation"
      },
      {
        id: "bd-task-6",
        title: "Due Diligence Process",
        description: "Conduct thorough due diligence on interested partners including financial, legal, and operational review",
        priority: "HIGH",
        estimatedHours: 32,
        dependsOn: ["bd-task-5"],
        category: "Due Diligence",
        tags: ["due-diligence", "financial", "legal"],
        phase: "Partner Validation"
      },
      {
        id: "bd-task-7",
        title: "Contract Negotiation",
        description: "Lead contract negotiations, define terms and conditions, and finalize partnership agreements",
        priority: "HIGH",
        estimatedHours: 24,
        dependsOn: ["bd-task-6"],
        category: "Negotiation",
        tags: ["negotiation", "contracts", "agreements"],
        phase: "Agreement Finalization"
      },
      {
        id: "bd-task-8",
        title: "Partner Onboarding Program",
        description: "Develop and execute comprehensive onboarding program for new strategic partners",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["bd-task-7"],
        category: "Onboarding",
        tags: ["onboarding", "program", "integration"],
        phase: "Partner Integration"
      },
      {
        id: "bd-task-9",
        title: "Performance Tracking System",
        description: "Set up systems to monitor partnership performance, ROI, and success metrics",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["bd-task-8"],
        category: "Tracking",
        tags: ["tracking", "performance", "roi"],
        phase: "Performance Management"
      },
      {
        id: "bd-task-10",
        title: "Relationship Management Plan",
        description: "Create ongoing relationship management strategy to maintain and grow partnerships",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["bd-task-9"],
        category: "Management",
        tags: ["relationship", "management", "growth"],
        phase: "Ongoing Management"
      }
    ],
    calendarEvents: [
      {
        id: "bd-kickoff",
        title: "Partnership Development Kickoff",
        description: "Initial strategy session to define partnership goals and approach",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        type: "meeting",
        attendees: ["BD Manager", "Sales Director", "Legal Counsel", "Marketing Lead"]
      },
      {
        id: "partner-review",
        title: "Partner Portfolio Review",
        description: "Review identified partners and prioritize outreach efforts",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        duration: 60,
        type: "review",
        attendees: ["BD Team", "Sales Team", "Executive Sponsor"]
      },
      {
        id: "negotiation-prep",
        title: "Contract Negotiation Preparation",
        description: "Prepare negotiation strategy and terms for priority partnerships",
        date: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        duration: 120,
        type: "planning",
        attendees: ["BD Manager", "Legal Team", "Finance Team"]
      }
    ]
  },
  {
    id: "research-project",
    name: "Market Research Study",
    description: "Conduct comprehensive market research on consumer behavior trends, competitive landscape analysis, and market opportunity assessment for strategic decision making.",
    category: "Research & Development",
    priority: "HIGH",
    expectedTasks: 14,
    expectedDuration: "8-12 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 180,
      riskLevel: "Low",
      teamSize: 3,
      keyTechnologies: ["Survey Tools", "Data Analytics", "Statistical Software", "Report Templates"],
      recommendations: [
        "Define clear research objectives and success metrics upfront",
        "Use mixed-method approach combining quantitative and qualitative research",
        "Ensure sample size is statistically significant for target market",
        "Plan for multiple data collection phases to validate findings",
        "Create actionable recommendations based on research insights"
      ]
    },
    generatedTasks: [
      {
        id: "research-task-1",
        title: "Research Scope and Methodology Definition",
        description: "Define research objectives, target demographics, methodology approach, and establish success criteria",
        priority: "HIGH",
        estimatedHours: 12,
        category: "Planning",
        tags: ["methodology", "scope", "objectives"],
        phase: "Research Planning"
      },
      {
        id: "research-task-2",
        title: "Literature Review and Secondary Research",
        description: "Conduct comprehensive literature review of existing studies, industry reports, and market data",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["research-task-1"],
        category: "Secondary Research",
        tags: ["literature", "secondary-data", "analysis"],
        phase: "Background Research"
      },
      {
        id: "research-task-3",
        title: "Survey Design and Questionnaire Development",
        description: "Create survey instruments, questionnaires, and interview guides for primary data collection",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["research-task-2"],
        category: "Survey Design",
        tags: ["survey", "questionnaire", "instruments"],
        phase: "Data Collection Design"
      },
      {
        id: "research-task-4",
        title: "Sample Selection and Recruitment",
        description: "Identify target respondents, recruit survey participants, and schedule interviews or focus groups",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["research-task-3"],
        category: "Recruitment",
        tags: ["sampling", "recruitment", "participants"],
        phase: "Participant Acquisition"
      },
      {
        id: "research-task-5",
        title: "Primary Data Collection",
        description: "Execute surveys, conduct interviews, run focus groups, and gather primary research data",
        priority: "HIGH",
        estimatedHours: 24,
        dependsOn: ["research-task-4"],
        category: "Data Collection",
        tags: ["surveys", "interviews", "data-gathering"],
        phase: "Data Collection"
      },
      {
        id: "research-task-6",
        title: "Data Analysis and Statistical Processing",
        description: "Analyze collected data using statistical methods, identify patterns, and extract key insights",
        priority: "HIGH",
        estimatedHours: 22,
        dependsOn: ["research-task-5"],
        category: "Data Analysis",
        tags: ["statistics", "analysis", "insights"],
        phase: "Data Analysis"
      },
      {
        id: "research-task-7",
        title: "Competitive Analysis",
        description: "Analyze competitor strategies, market positioning, pricing, and identify competitive advantages",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["research-task-2"],
        category: "Competitive Analysis",
        tags: ["competitors", "positioning", "strategy"],
        phase: "Market Analysis"
      },
      {
        id: "research-task-8",
        title: "Findings Synthesis and Report Writing",
        description: "Synthesize research findings, create comprehensive report with recommendations and actionable insights",
        priority: "HIGH",
        estimatedHours: 20,
        dependsOn: ["research-task-6", "research-task-7"],
        category: "Report Writing",
        tags: ["report", "synthesis", "recommendations"],
        phase: "Documentation"
      },
      {
        id: "research-task-9",
        title: "Presentation Preparation",
        description: "Create executive presentation, visual aids, and prepare stakeholder presentation materials",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["research-task-8"],
        category: "Presentation",
        tags: ["presentation", "visual-aids", "stakeholders"],
        phase: "Communication"
      },
      {
        id: "research-task-10",
        title: "Stakeholder Review and Feedback",
        description: "Present findings to stakeholders, gather feedback, and refine recommendations based on input",
        priority: "MEDIUM",
        estimatedHours: 8,
        dependsOn: ["research-task-9"],
        category: "Review",
        tags: ["stakeholders", "feedback", "refinement"],
        phase: "Validation"
      }
    ],
    calendarEvents: [
      {
        id: "research-kickoff",
        title: "Research Project Kickoff",
        description: "Initial meeting to align on research objectives and methodology",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        type: "meeting",
        attendees: ["Research Lead", "Market Analyst", "Data Specialist", "Project Sponsor"]
      },
      {
        id: "methodology-review",
        title: "Research Methodology Review",
        description: "Review and approve research methodology and data collection approach",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 60,
        type: "review",
        attendees: ["Research Team", "Academic Advisor", "Project Sponsor"]
      },
      {
        id: "interim-findings",
        title: "Interim Findings Presentation",
        description: "Present preliminary findings and gather stakeholder feedback",
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "milestone",
        attendees: ["Full Research Team", "Stakeholders", "Executive Team"]
      },
      {
        id: "final-presentation",
        title: "Final Research Presentation",
        description: "Present complete research findings and recommendations",
        date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
        duration: 120,
        type: "milestone",
        attendees: ["All Stakeholders", "Executive Team", "Research Team"]
      }
    ]
  },
  {
    id: "concept-note-development",
    name: "Project Concept Note Development",
    description: "Develop a comprehensive project concept note including problem analysis, proposed solutions, implementation strategy, budget, and impact assessment for funding or approval.",
    category: "Design Project",
    priority: "MEDIUM",
    expectedTasks: 12,
    expectedDuration: "6-8 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 150,
      riskLevel: "Low",
      teamSize: 2,
      keyTechnologies: ["Document Templates", "Research Tools", "Project Management", "Budget Software"],
      recommendations: [
        "Start with thorough problem analysis and stakeholder mapping",
        "Include clear logical framework and theory of change",
        "Develop realistic budget with detailed cost breakdowns",
        "Plan for monitoring and evaluation from the beginning",
        "Ensure alignment with organizational goals and donor priorities"
      ]
    },
    generatedTasks: [
      {
        id: "concept-task-1",
        title: "Problem Analysis and Context Study",
        description: "Conduct thorough analysis of the problem, root causes, and contextual factors affecting the issue",
        priority: "HIGH",
        estimatedHours: 16,
        category: "Analysis",
        tags: ["problem-analysis", "context", "research"],
        phase: "Foundation"
      },
      {
        id: "concept-task-2",
        title: "Stakeholder Mapping and Analysis",
        description: "Identify key stakeholders, analyze their interests, influence, and potential impact on the project",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["concept-task-1"],
        category: "Stakeholder Analysis",
        tags: ["stakeholders", "mapping", "influence"],
        phase: "Stakeholder Assessment"
      },
      {
        id: "concept-task-3",
        title: "Literature Review and Best Practices",
        description: "Review existing literature, similar projects, and identify best practices and lessons learned",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["concept-task-1"],
        category: "Research",
        tags: ["literature", "best-practices", "lessons-learned"],
        phase: "Background Research"
      },
      {
        id: "concept-task-4",
        title: "Solution Design and Intervention Strategy",
        description: "Design proposed solutions, intervention logic, and implementation strategy based on analysis",
        priority: "HIGH",
        estimatedHours: 18,
        dependsOn: ["concept-task-2", "concept-task-3"],
        category: "Solution Design",
        tags: ["solutions", "strategy", "intervention"],
        phase: "Solution Development"
      },
      {
        id: "concept-task-5",
        title: "Logical Framework Development",
        description: "Create detailed logical framework with objectives, outcomes, outputs, and key performance indicators",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["concept-task-4"],
        category: "Planning Framework",
        tags: ["logframe", "objectives", "indicators"],
        phase: "Framework Development"
      },
      {
        id: "concept-task-6",
        title: "Budget Development and Costing",
        description: "Develop comprehensive budget with detailed cost estimates for all project components",
        priority: "HIGH",
        estimatedHours: 14,
        dependsOn: ["concept-task-5"],
        category: "Budget Planning",
        tags: ["budget", "costing", "financial-planning"],
        phase: "Financial Planning"
      },
      {
        id: "concept-task-7",
        title: "Risk Assessment and Mitigation",
        description: "Identify potential risks, assess their likelihood and impact, and develop mitigation strategies",
        priority: "MEDIUM",
        estimatedHours: 10,
        dependsOn: ["concept-task-4"],
        category: "Risk Management",
        tags: ["risk-assessment", "mitigation", "contingency"],
        phase: "Risk Management"
      },
      {
        id: "concept-task-8",
        title: "Monitoring and Evaluation Framework",
        description: "Design M&E framework with indicators, data collection methods, and evaluation timeline",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["concept-task-5"],
        category: "M&E Planning",
        tags: ["monitoring", "evaluation", "indicators"],
        phase: "M&E Framework"
      },
      {
        id: "concept-task-9",
        title: "Implementation Timeline and Milestones",
        description: "Create detailed implementation timeline with key milestones and deliverables",
        priority: "MEDIUM",
        estimatedHours: 8,
        dependsOn: ["concept-task-6"],
        category: "Timeline Planning",
        tags: ["timeline", "milestones", "scheduling"],
        phase: "Timeline Development"
      },
      {
        id: "concept-task-10",
        title: "Concept Note Writing and Documentation",
        description: "Compile all components into a comprehensive, well-structured concept note document",
        priority: "HIGH",
        estimatedHours: 16,
        dependsOn: ["concept-task-7", "concept-task-8", "concept-task-9"],
        category: "Documentation",
        tags: ["writing", "documentation", "compilation"],
        phase: "Documentation"
      },
      {
        id: "concept-task-11",
        title: "Review and Quality Assurance",
        description: "Conduct thorough review, quality check, and refinement of the concept note",
        priority: "MEDIUM",
        estimatedHours: 8,
        dependsOn: ["concept-task-10"],
        category: "Quality Assurance",
        tags: ["review", "quality", "refinement"],
        phase: "Quality Control"
      },
      {
        id: "concept-task-12",
        title: "Stakeholder Validation and Finalization",
        description: "Present concept note to stakeholders, incorporate feedback, and finalize document",
        priority: "HIGH",
        estimatedHours: 6,
        dependsOn: ["concept-task-11"],
        category: "Validation",
        tags: ["validation", "feedback", "finalization"],
        phase: "Final Approval"
      }
    ],
    calendarEvents: [
      {
        id: "concept-kickoff",
        title: "Concept Development Kickoff",
        description: "Initial planning meeting to scope the concept note development process",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        type: "meeting",
        attendees: ["Project Lead", "Subject Matter Expert", "Program Manager", "Stakeholder Representative"]
      },
      {
        id: "stakeholder-consultation",
        title: "Stakeholder Consultation Workshop",
        description: "Workshop to gather stakeholder input on problem analysis and proposed solutions",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 180,
        type: "meeting",
        attendees: ["All Key Stakeholders", "Project Team", "Facilitator"]
      },
      {
        id: "draft-review",
        title: "Draft Concept Note Review",
        description: "Review meeting for the draft concept note with key stakeholders",
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        duration: 120,
        type: "review",
        attendees: ["Project Team", "Program Manager", "Technical Advisor", "Donor Representative"]
      },
      {
        id: "final-validation",
        title: "Final Concept Note Validation",
        description: "Final validation meeting before concept note submission",
        date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "milestone",
        attendees: ["All Stakeholders", "Executive Team", "Project Team"]
      }
    ]
  },
  {
    id: "training-program",
    name: "Professional Training Program Development",
    description: "Design and develop a comprehensive professional training program including curriculum design, learning materials, assessment methods, and delivery strategy for skill development.",
    category: "Training & Education",
    priority: "MEDIUM",
    expectedTasks: 16,
    expectedDuration: "10-14 weeks",
    aiAnalysis: {
      complexity: "Medium",
      estimatedHours: 220,
      riskLevel: "Low",
      teamSize: 4,
      keyTechnologies: ["Learning Management Systems", "Content Creation Tools", "Assessment Platforms", "Video Production"],
      recommendations: [
        "Start with comprehensive needs assessment and learner analysis",
        "Use adult learning principles and modern pedagogical approaches",
        "Design for multiple learning styles and accessibility needs",
        "Include practical exercises and real-world applications",
        "Plan for ongoing evaluation and continuous improvement"
      ]
    },
    generatedTasks: [
      {
        id: "training-task-1",
        title: "Training Needs Assessment",
        description: "Conduct comprehensive needs assessment to identify skill gaps and training requirements",
        priority: "HIGH",
        estimatedHours: 16,
        category: "Needs Analysis",
        tags: ["needs-assessment", "skill-gaps", "requirements"],
        phase: "Analysis Phase"
      },
      {
        id: "training-task-2",
        title: "Learner Profile and Audience Analysis",
        description: "Analyze target audience characteristics, learning preferences, and constraints",
        priority: "HIGH",
        estimatedHours: 12,
        dependsOn: ["training-task-1"],
        category: "Audience Analysis",
        tags: ["learner-profile", "audience", "preferences"],
        phase: "Analysis Phase"
      },
      {
        id: "training-task-3",
        title: "Learning Objectives and Outcomes Definition",
        description: "Define clear, measurable learning objectives and expected outcomes for the training program",
        priority: "HIGH",
        estimatedHours: 10,
        dependsOn: ["training-task-2"],
        category: "Objective Setting",
        tags: ["objectives", "outcomes", "goals"],
        phase: "Design Foundation"
      },
      {
        id: "training-task-4",
        title: "Curriculum Structure and Module Design",
        description: "Design overall curriculum structure, break down into modules, and sequence learning progression",
        priority: "HIGH",
        estimatedHours: 18,
        dependsOn: ["training-task-3"],
        category: "Curriculum Design",
        tags: ["curriculum", "modules", "structure"],
        phase: "Curriculum Development"
      },
      {
        id: "training-task-5",
        title: "Content Development and Materials Creation",
        description: "Develop training content, create learning materials, presentations, and resource documents",
        priority: "HIGH",
        estimatedHours: 32,
        dependsOn: ["training-task-4"],
        category: "Content Creation",
        tags: ["content", "materials", "resources"],
        phase: "Content Development"
      },
      {
        id: "training-task-6",
        title: "Interactive Exercises and Activities Design",
        description: "Design hands-on exercises, case studies, role-plays, and interactive learning activities",
        priority: "MEDIUM",
        estimatedHours: 20,
        dependsOn: ["training-task-5"],
        category: "Activity Design",
        tags: ["exercises", "activities", "interactive"],
        phase: "Activity Development"
      },
      {
        id: "training-task-7",
        title: "Assessment and Evaluation Methods",
        description: "Develop assessment criteria, evaluation methods, and certification requirements",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["training-task-3"],
        category: "Assessment Design",
        tags: ["assessment", "evaluation", "certification"],
        phase: "Assessment Development"
      },
      {
        id: "training-task-8",
        title: "Delivery Platform and Technology Setup",
        description: "Set up learning management system, online platforms, and technology infrastructure",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["training-task-5"],
        category: "Technology Setup",
        tags: ["lms", "platform", "technology"],
        phase: "Technology Implementation"
      },
      {
        id: "training-task-9",
        title: "Trainer Guide and Facilitation Materials",
        description: "Create comprehensive trainer guides, facilitation notes, and instructor resources",
        priority: "MEDIUM",
        estimatedHours: 18,
        dependsOn: ["training-task-6"],
        category: "Trainer Resources",
        tags: ["trainer-guide", "facilitation", "instructor"],
        phase: "Trainer Preparation"
      },
      {
        id: "training-task-10",
        title: "Pilot Testing and Feedback Collection",
        description: "Conduct pilot training sessions, collect participant feedback, and identify improvements",
        priority: "HIGH",
        estimatedHours: 24,
        dependsOn: ["training-task-8", "training-task-9"],
        category: "Pilot Testing",
        tags: ["pilot", "testing", "feedback"],
        phase: "Testing Phase"
      },
      {
        id: "training-task-11",
        title: "Program Refinement and Optimization",
        description: "Refine training program based on pilot feedback and optimize content and delivery",
        priority: "MEDIUM",
        estimatedHours: 16,
        dependsOn: ["training-task-10"],
        category: "Refinement",
        tags: ["refinement", "optimization", "improvement"],
        phase: "Optimization"
      },
      {
        id: "training-task-12",
        title: "Launch Strategy and Marketing Plan",
        description: "Develop launch strategy, marketing materials, and participant recruitment plan",
        priority: "MEDIUM",
        estimatedHours: 12,
        dependsOn: ["training-task-11"],
        category: "Launch Planning",
        tags: ["launch", "marketing", "recruitment"],
        phase: "Launch Preparation"
      },
      {
        id: "training-task-13",
        title: "Program Documentation and SOPs",
        description: "Create comprehensive program documentation, standard operating procedures, and quality guidelines",
        priority: "MEDIUM",
        estimatedHours: 14,
        dependsOn: ["training-task-11"],
        category: "Documentation",
        tags: ["documentation", "sops", "guidelines"],
        phase: "Documentation"
      },
      {
        id: "training-task-14",
        title: "Continuous Improvement Framework",
        description: "Establish framework for ongoing program evaluation, updates, and continuous improvement",
        priority: "LOW",
        estimatedHours: 8,
        dependsOn: ["training-task-13"],
        category: "Quality Assurance",
        tags: ["improvement", "evaluation", "framework"],
        phase: "Sustainability"
      }
    ],
    calendarEvents: [
      {
        id: "training-kickoff",
        title: "Training Program Development Kickoff",
        description: "Initial meeting to scope training program development and establish team roles",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        type: "meeting",
        attendees: ["Training Manager", "Instructional Designer", "Subject Matter Expert", "Program Sponsor"]
      },
      {
        id: "curriculum-review",
        title: "Curriculum Design Review",
        description: "Review and approve curriculum structure and learning objectives",
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "review",
        attendees: ["Training Team", "Academic Advisor", "Industry Expert"]
      },
      {
        id: "content-review",
        title: "Training Content Review Workshop",
        description: "Collaborative review of training materials and content quality",
        date: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000),
        duration: 180,
        type: "review",
        attendees: ["Full Training Team", "Subject Matter Experts", "Quality Reviewer"]
      },
      {
        id: "pilot-session",
        title: "Pilot Training Session",
        description: "Conduct pilot training session with sample participants",
        date: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000),
        duration: 240,
        type: "milestone",
        attendees: ["Training Team", "Pilot Participants", "Observers"]
      },
      {
        id: "program-launch",
        title: "Training Program Launch Meeting",
        description: "Final preparation meeting before full program launch",
        date: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
        duration: 90,
        type: "milestone",
        attendees: ["All Stakeholders", "Training Team", "Management"]
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

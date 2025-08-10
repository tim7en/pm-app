# 🗄️ PM-App Database Architecture Mindmap

## 📊 **DATABASE OVERVIEW**
```
🏗️ PM-App Database Architecture
├── 🗃️ Provider: PostgreSQL
├── 🔧 ORM: Prisma Client
├── 📊 Total Models: 23
├── 🌐 Architecture: Multi-tenant
└── 🔐 Features: Authentication, Project Management, Real-time Communication
```

---

## 🎯 **CORE ENTITY RELATIONSHIPS**

### 🏢 **WORKSPACE HIERARCHY**
```
Workspace (Root Entity)
├── 👥 WorkspaceMembers
│   ├── User (Many-to-Many via WorkspaceMember)
│   ├── Role (OWNER, ADMIN, MEMBER, GUEST)
│   └── Position (title, department)
├── 📋 Projects
│   ├── ProjectMembers
│   ├── Tasks
│   └── Calendar Events
├── ✉️ WorkspaceInvitations
└── 📅 CalendarEvents
```

### 👤 **USER ENTITY (Central Hub)**
```
User (id: cuid)
├── 🔐 Authentication
│   ├── email (unique)
│   ├── password (bcrypt hashed)
│   ├── googleId (OAuth)
│   ├── resetToken
│   └── Security (failedLoginAttempts, lockedUntil)
├── 👤 Profile
│   ├── name, avatar, company
│   ├── position, phone, location
│   ├── bio, timezone, language
│   └── role (Role enum)
├── 🏢 Workspace Relations
│   ├── workspaceMembers[]
│   └── sentInvitations[]
├── 📋 Project Relations
│   ├── ownedProjects[]
│   ├── projectMembers[]
│   └── calendarEvents[]
├── ✅ Task Relations
│   ├── assignedTasks[]
│   ├── taskAssignees[]
│   ├── createdTasks[]
│   ├── verifiedTasks[]
│   └── comments[]
├── 💬 Communication
│   ├── conversationParticipant[]
│   ├── sentMessages[]
│   └── notifications[]
├── 🐛 Bug Reports
│   ├── reportedBugs[]
│   └── assignedBugs[]
└── 📎 File Management
    ├── uploadedFiles[]
    └── uploadedCommentFiles[]
```

---

## 📋 **PROJECT MANAGEMENT CORE**

### 🎯 **PROJECT STRUCTURE**
```
Project
├── 📊 Basic Info
│   ├── id, name, description
│   ├── color, status (ProjectStatus)
│   ├── startDate, dueDate
│   └── timestamps
├── 👥 Ownership
│   ├── owner (User)
│   ├── workspace (Workspace)
│   └── members (ProjectMember[])
├── 📝 Content
│   ├── tasks (Task[])
│   ├── sections (Section[])
│   └── timeline (ProjectTimeline[])
└── 📅 Integration
    └── calendarEvents[]
```

### ✅ **TASK MANAGEMENT SYSTEM**
```
Task (Complex Entity)
├── 📝 Content
│   ├── title, description
│   ├── status (TaskStatus: TODO → IN_PROGRESS → REVIEW → DONE)
│   ├── priority (Priority: LOW, MEDIUM, HIGH, URGENT)
│   └── position (for ordering)
├── 👥 Assignment
│   ├── assigneeId (deprecated - legacy)
│   ├── assignees (TaskAssignee[]) - Multi-assignment
│   ├── creator (User)
│   └── assignedBy tracking
├── 🏗️ Organization
│   ├── project (Project)
│   ├── section (Section - optional)
│   └── dependencies (TaskDependency[])
├── ⏰ Timeline
│   ├── dueDate
│   ├── estimatedHours
│   ├── actualHours
│   └── completedAt
├── ✅ Verification System
│   ├── verificationStatus (PENDING, VERIFIED, REJECTED)
│   ├── verifiedBy (User)
│   ├── verifiedAt
│   └── rejectionReason
├── 📝 Content Extensions
│   ├── comments (Comment[])
│   ├── subtasks (SubTask[])
│   ├── tags (TaskTag[])
│   └── attachments (TaskAttachment[])
└── 🔗 Dependencies
    ├── dependencies[] (tasks that depend on this)
    └── dependsOn[] (tasks this depends on)
```

---

## 💬 **COMMUNICATION SYSTEM**

### 📞 **MESSAGING ARCHITECTURE**
```
Communication Hub
├── 💬 Conversations
│   ├── id, name (for groups)
│   ├── isGroup (boolean)
│   ├── type (INTERNAL, EXTERNAL)
│   └── participants (ConversationParticipant[])
├── 📨 Messages
│   ├── content
│   ├── sender (User)
│   ├── conversation (Conversation)
│   ├── isRead (boolean)
│   └── timestamps
├── 👥 Participants
│   ├── conversation
│   ├── user
│   ├── joinedAt
│   └── lastReadAt
└── 🔔 Notifications
    ├── title, message
    ├── type (NotificationType enum)
    ├── user
    ├── isRead
    └── createdAt
```

---

## 📅 **CALENDAR & EVENTS**

### 📆 **EVENT MANAGEMENT**
```
Calendar System
├── 📅 CalendarEvent
│   ├── title, description
│   ├── startTime, endTime
│   ├── type (MEETING, CALL, DEADLINE, REMINDER)
│   ├── location
│   ├── isRecurring
│   ├── notificationEnabled
│   ├── creator (User)
│   ├── project (Project - optional)
│   ├── workspace (Workspace)
│   └── attendees (EventAttendee[])
└── 👥 EventAttendee
    ├── event (CalendarEvent)
    ├── user (User)
    └── response (PENDING, ACCEPTED, DECLINED)
```

---

## 🐛 **BUG TRACKING SYSTEM**

### 🔍 **BUG REPORT STRUCTURE**
```
Bug Management
└── 🐛 BugReport
    ├── 📝 Content
    │   ├── title, description
    │   ├── stepsToReproduce
    │   ├── expectedBehavior
    │   ├── actualBehavior
    │   └── browserInfo
    ├── 📊 Classification
    │   ├── priority (BugPriority)
    │   ├── category (BugCategory)
    │   └── status (BugStatus)
    ├── 👤 Reporter Info
    │   ├── reportedBy (User - optional)
    │   ├── reportedByName
    │   └── reportedByEmail
    ├── 👨‍💼 Assignment
    │   ├── assignedTo (User)
    │   ├── resolution
    │   └── resolvedAt
    └── 📎 Attachments (JSON array)
```

---

## 🔧 **DATABASE CONNECTION & HANDLING**

### 🔌 **CONNECTION LAYER**
```
Database Connection Architecture
├── 🎯 Primary Connection
│   ├── /src/lib/prisma.ts (Main client)
│   ├── /src/lib/db.ts (Enhanced client)
│   └── Singleton pattern (dev mode)
├── ⚙️ Configuration
│   ├── Environment: DATABASE_URL
│   ├── Provider: PostgreSQL
│   ├── Connection pooling
│   └── Logging (dev: queries, prod: errors)
├── 🧪 Testing
│   ├── test-db-connection.js
│   ├── Mock client (/src/lib/prisma-mock.ts)
│   └── Connection verification
└── 🌱 Data Management
    ├── prisma/seed.ts (Database seeding)
    ├── Migrations (prisma migrate)
    └── Schema updates (prisma db push)
```

### 🔐 **PRISMA CLIENT SETUP**
```javascript
// Main Prisma Client Configuration
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query'] : ['error'],
    datasources: {
      db: { url: process.env.DATABASE_URL }
    }
  })

// Singleton pattern for development
if (process.env.NODE_ENV !== 'production') 
  globalForPrisma.prisma = prisma
```

---

## 📊 **ENUMS & STATUS MANAGEMENT**

### 🏷️ **ENUMERATION TYPES**
```
System Enums
├── 👤 User Roles
│   └── Role: OWNER, ADMIN, PROJECT_MANAGER, PROJECT_OFFICER, MEMBER, GUEST
├── 📋 Project Management
│   ├── ProjectRole: ADMIN, MANAGER, OFFICER, MEMBER, VIEWER
│   ├── ProjectStatus: PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
│   ├── TaskStatus: TODO, IN_PROGRESS, REVIEW, AWAITING_VERIFICATION, VERIFIED, DONE, REJECTED
│   ├── TaskVerificationStatus: PENDING, VERIFIED, REJECTED
│   └── Priority: LOW, MEDIUM, HIGH, URGENT
├── 💬 Communication
│   ├── NotificationType: TASK_ASSIGNED, TASK_UPDATED, PROJECT_INVITE, etc.
│   ├── ConversationType: INTERNAL, EXTERNAL
│   └── InvitationStatus: PENDING, ACCEPTED, DECLINED, EXPIRED
├── 📅 Calendar
│   ├── EventType: MEETING, CALL, DEADLINE, REMINDER
│   └── EventResponse: PENDING, ACCEPTED, DECLINED
├── 🐛 Bug Tracking
│   ├── BugPriority: LOW, MEDIUM, HIGH, CRITICAL
│   ├── BugCategory: UI, FUNCTIONALITY, PERFORMANCE, SECURITY, OTHER
│   └── BugStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED, DUPLICATE
└── 🔌 Integrations
    └── IntegrationType: TELEGRAM, WHATSAPP
```

---

## 🔐 **SECURITY & DATA INTEGRITY**

### 🛡️ **DATABASE SECURITY FEATURES**
```
Security Implementation
├── 🔐 Authentication
│   ├── Password hashing (bcrypt)
│   ├── Failed login tracking
│   ├── Account lockout mechanism
│   └── Password reset tokens
├── 🔑 Authorization
│   ├── Role-based access control
│   ├── Workspace-level isolation
│   ├── Project-level permissions
│   └── Multi-tenant architecture
├── 🗑️ Data Cleanup
│   ├── Cascade deletions
│   ├── Soft deletes (where applicable)
│   ├── Orphan prevention
│   └── Referential integrity
└── 📊 Audit Trail
    ├── Activity logs
    ├── Timestamp tracking
    ├── User action logging
    └── Change history
```

---

## 🚀 **PERFORMANCE OPTIMIZATIONS**

### ⚡ **DATABASE PERFORMANCE**
```
Performance Features
├── 🔍 Indexing Strategy
│   ├── Primary keys (CUID)
│   ├── Unique constraints
│   ├── Foreign key indexes
│   └── Composite indexes
├── 🔗 Relationship Optimization
│   ├── Efficient joins
│   ├── Selective includes
│   ├── Pagination support
│   └── Count aggregations
├── 📊 Query Optimization
│   ├── Prisma query optimization
│   ├── N+1 query prevention
│   ├── Batch operations
│   └── Connection pooling
└── 📈 Monitoring
    ├── Query logging (development)
    ├── Performance metrics
    ├── Connection monitoring
    └── Error tracking
```

---

## 🔄 **DATA FLOW PATTERNS**

### 📈 **APPLICATION DATA FLOW**
```
Data Flow Architecture
├── 🌐 API Layer
│   ├── Next.js API routes
│   ├── Authentication middleware
│   ├── Validation layers
│   └── Error handling
├── 🏗️ Business Logic
│   ├── Service functions
│   ├── Data transformations
│   ├── Business rules
│   └── Workflow management
├── 🗄️ Data Access Layer
│   ├── Prisma client operations
│   ├── Query builders
│   ├── Transaction management
│   └── Connection handling
└── 💾 Database Layer
    ├── PostgreSQL engine
    ├── Schema enforcement
    ├── Constraint validation
    └── Data persistence
```

---

## 🎯 **DEPLOYMENT & ENVIRONMENT**

### 🚀 **DATABASE DEPLOYMENT**
```
Deployment Strategy
├── 🏗️ Development
│   ├── SQLite (local development)
│   ├── Prisma Studio (GUI)
│   ├── Database seeding
│   └── Migration development
├── 🧪 Testing
│   ├── Test database isolation
│   ├── Mock implementations
│   ├── Transaction rollbacks
│   └── Data fixtures
├── 🌐 Production
│   ├── PostgreSQL (production)
│   ├── Connection pooling
│   ├── Backup strategies
│   ├── Migration deployment
│   └── Health monitoring
└── 🔧 Management Tools
    ├── Prisma CLI
    ├── Database migrations
    ├── Schema introspection
    └── Data browser
```

---

## 📋 **SUMMARY STATISTICS**

### 📊 **DATABASE METRICS**
```
Database Overview
├── 📊 Models: 23 total
├── 🔗 Relationships: 50+ foreign keys
├── 📋 Enums: 15 types
├── 🔐 Security: Multi-layer protection
├── ⚡ Performance: Optimized indexes
├── 🧪 Testing: Comprehensive coverage
└── 🚀 Production: Ready for scale
```

### 🏗️ **MODEL BREAKDOWN**
```
Entity Categories
├── 👤 User Management (4 models)
│   └── User, WorkspaceMember, ProjectMember, WorkspaceInvitation
├── 📋 Project Management (8 models)
│   └── Workspace, Project, Task, TaskAssignee, SubTask, Section, TaskTag, TaskDependency
├── 💬 Communication (5 models)
│   └── Conversation, ConversationParticipant, Message, Notification, ActivityLog
├── 📎 File Management (2 models)
│   └── TaskAttachment, CommentAttachment
├── 📅 Calendar System (2 models)
│   └── CalendarEvent, EventAttendee
├── 🐛 Bug Tracking (1 model)
│   └── BugReport
└── ⚙️ System Features (1 model)
    └── Integration, ProjectTimeline
```

---

**🎯 This mindmap represents the complete database architecture of your PM-App, showing how all 23 models interconnect to create a robust project management system with multi-tenant support, real-time communication, and comprehensive task management capabilities.**

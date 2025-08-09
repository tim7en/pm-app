# 🗄️ PM-App Database Mindmap

## 📊 Database Overview
**Provider:** PostgreSQL  
**ORM:** Prisma  
**Total Tables:** 23  
**Key Features:** Multi-tenancy, Authentication, Project Management, Real-time Messaging, Calendar Events, Bug Tracking

---

## 🏗️ Core Entity Structure

```
📦 PM-APP DATABASE
│
├── 👥 USER MANAGEMENT
│   ├── 🧑‍💼 User (Core entity)
│   │   ├── Basic Info (id, email, name, password, avatar, role)
│   │   ├── Profile (company, position, phone, location, bio, timezone, language)
│   │   ├── OAuth (googleId, oauthProvider, emailVerified)
│   │   ├── Security (resetToken, lastLoginAt, failedLoginAttempts, lockedUntil)
│   │   └── Timestamps (createdAt, updatedAt)
│   │
│   ├── 🏢 Workspace (Multi-tenant organization)
│   │   ├── Basic Info (id, name, description, avatar)
│   │   └── Timestamps (createdAt, updatedAt)
│   │
│   ├── 👥 WorkspaceMember (Join table)
│   │   ├── Relations (userId → User, workspaceId → Workspace)
│   │   ├── Role (Role enum: OWNER, ADMIN, PROJECT_MANAGER, etc.)
│   │   └── Position (title, department, joinedAt)
│   │
│   └── 📨 WorkspaceInvitation
│       ├── Basic Info (email, role, status, expiresAt)
│       └── Relations (workspaceId → Workspace, invitedBy → User)
│
├── 📋 PROJECT MANAGEMENT
│   ├── 📁 Project
│   │   ├── Basic Info (id, name, description, color, status)
│   │   ├── Dates (startDate, dueDate, createdAt, updatedAt)
│   │   └── Relations (ownerId → User, workspaceId → Workspace)
│   │
│   ├── 👤 ProjectMember (Join table)
│   │   ├── Relations (userId → User, projectId → Project)
│   │   ├── Role (ProjectRole enum: ADMIN, MANAGER, OFFICER, etc.)
│   │   └── Timing (joinedAt)
│   │
│   ├── 📚 Section (Task organization)
│   │   ├── Basic Info (id, name, position)
│   │   └── Relations (projectId → Project)
│   │
│   └── 📊 ProjectTimeline
│       ├── Timeline Info (title, description, startDate, endDate, color)
│       └── Relations (projectId → Project)
│
├── ✅ TASK MANAGEMENT
│   ├── 📝 Task (Main task entity)
│   │   ├── Basic Info (id, title, description, status, priority)
│   │   ├── Assignment (assigneeId - deprecated, creatorId, position)
│   │   ├── Dates (dueDate, completedAt, verifiedAt)
│   │   ├── Verification (verificationStatus, verifiedById, rejectionReason)
│   │   ├── Time Tracking (estimatedHours, actualHours)
│   │   └── Relations (projectId → Project, sectionId → Section)
│   │
│   ├── 👥 TaskAssignee (New multi-assignee system)
│   │   ├── Assignment Info (taskId → Task, userId → User)
│   │   └── Tracking (assignedAt, assignedBy → User)
│   │
│   ├── ☑️ SubTask
│   │   ├── Basic Info (id, title, isCompleted)
│   │   └── Relations (taskId → Task)
│   │
│   ├── 🏷️ TaskTag
│   │   ├── Tag Info (name, color)
│   │   └── Relations (taskId → Task)
│   │
│   ├── 🔗 TaskDependency (Task relationships)
│   │   └── Relations (precedingTaskId → Task, dependentTaskId → Task)
│   │
│   └── 📎 TaskAttachment
│       ├── File Info (fileName, filePath, fileSize, mimeType)
│       └── Relations (taskId → Task, uploadedBy → User)
│
├── 💬 COMMUNICATION
│   ├── 📝 Comment
│   │   ├── Content Info (id, content)
│   │   ├── Relations (userId → User, taskId → Task)
│   │   └── Timestamps (createdAt, updatedAt)
│   │
│   ├── 📎 CommentAttachment
│   │   ├── File Info (fileName, filePath, fileSize, mimeType)
│   │   └── Relations (commentId → Comment, uploadedBy → User)
│   │
│   ├── 💬 Conversation (Direct/Group messaging)
│   │   ├── Basic Info (id, name, isGroup, type)
│   │   └── Timestamps (createdAt, updatedAt)
│   │
│   ├── 👥 ConversationParticipant (Join table)
│   │   ├── Relations (conversationId → Conversation, userId → User)
│   │   └── Activity (joinedAt, lastReadAt)
│   │
│   └── 📨 Message
│       ├── Content Info (id, content, isRead)
│       ├── Relations (conversationId → Conversation, senderId → User)
│       └── Timestamps (createdAt, updatedAt)
│
├── 📅 CALENDAR SYSTEM
│   ├── 📅 CalendarEvent
│   │   ├── Event Info (id, title, description, location)
│   │   ├── Timing (startTime, endTime, isRecurring)
│   │   ├── Settings (type, notificationEnabled)
│   │   └── Relations (creatorId → User, projectId → Project, workspaceId → Workspace)
│   │
│   └── 👥 EventAttendee (Join table)
│       ├── Relations (eventId → CalendarEvent, userId → User)
│       └── Response (EventResponse enum: PENDING, ACCEPTED, DECLINED)
│
├── 🔔 NOTIFICATION SYSTEM
│   ├── 🔔 Notification
│   │   ├── Content Info (id, title, message, type, isRead)
│   │   └── Relations (userId → User)
│   │
│   └── 📊 ActivityLog
│       ├── Activity Info (type, message, userName, userAvatar)
│       ├── User Info (userId)
│       └── Timing (clearedAt, originalTimestamp)
│
├── 🐛 BUG TRACKING
│   └── 🐛 BugReport
│       ├── Basic Info (id, title, description, priority, category, status)
│       ├── Details (stepsToReproduce, expectedBehavior, actualBehavior, browserInfo)
│       ├── Attachments (attachments JSON array)
│       ├── Reporter Info (reportedBy, reportedByName, reportedByEmail)
│       ├── Resolution (assignedTo, resolution, resolvedAt)
│       └── Relations (reporter → User, assignee → User)
│
└── 🔌 INTEGRATIONS
    └── 🔌 Integration
        ├── Integration Info (id, type, config JSON, isActive)
        └── Relations (userId → User)
```

---

## 🔗 Key Relationships

### Primary Relationships
- **User ↔ Workspace**: Many-to-Many via `WorkspaceMember`
- **User ↔ Project**: Many-to-Many via `ProjectMember`
- **User ↔ Task**: Many-to-Many via `TaskAssignee` (new system)
- **Project → Tasks**: One-to-Many
- **Task → Comments**: One-to-Many
- **Task → SubTasks**: One-to-Many

### Secondary Relationships
- **Workspace → Projects**: One-to-Many
- **Project → Sections**: One-to-Many
- **Section → Tasks**: One-to-Many
- **Task → TaskTags**: One-to-Many
- **Task → TaskDependencies**: Many-to-Many (self-referencing)
- **User → Notifications**: One-to-Many
- **User → CalendarEvents**: One-to-Many (as creator)
- **CalendarEvent ↔ User**: Many-to-Many via `EventAttendee`

---

## 📊 Enums and Status Values

### User Roles
```
Role: OWNER | ADMIN | PROJECT_MANAGER | PROJECT_OFFICER | MEMBER | GUEST
ProjectRole: ADMIN | MANAGER | OFFICER | MEMBER | VIEWER
```

### Task Management
```
TaskStatus: TODO | IN_PROGRESS | REVIEW | AWAITING_VERIFICATION | VERIFIED | DONE | REJECTED
TaskVerificationStatus: PENDING | VERIFIED | REJECTED
Priority: LOW | MEDIUM | HIGH | URGENT
```

### Project States
```
ProjectStatus: PLANNING | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED
```

### Communication
```
ConversationType: INTERNAL | EXTERNAL
NotificationType: TASK_ASSIGNED | TASK_UPDATED | COMMENT_ADDED | MESSAGE | etc.
```

### Calendar Events
```
EventType: MEETING | CALL | DEADLINE | REMINDER
EventResponse: PENDING | ACCEPTED | DECLINED
```

### Bug Tracking
```
BugPriority: LOW | MEDIUM | HIGH | CRITICAL
BugCategory: UI | FUNCTIONALITY | PERFORMANCE | SECURITY | OTHER
BugStatus: OPEN | IN_PROGRESS | RESOLVED | CLOSED | DUPLICATE
```

---

## 🔄 Data Flow Patterns

### Task Assignment Flow
1. **Task Creation**: User creates task in Project/Section
2. **Assignment**: Multiple users assigned via `TaskAssignee`
3. **Progress**: Task status updated through workflow
4. **Verification**: Completed tasks require verification
5. **Comments**: Discussion via `Comment` with attachments

### Workspace Organization
1. **Workspace Creation**: Owner creates workspace
2. **Member Invitation**: Via `WorkspaceInvitation`
3. **Project Creation**: Within workspace context
4. **Permission Hierarchy**: Workspace → Project → Task levels

### Real-time Communication
1. **Conversations**: Direct or group messaging
2. **Participants**: Via `ConversationParticipant`
3. **Messages**: Timestamped with read status
4. **Notifications**: System-generated alerts

---

## 🎯 Database Optimization Notes

### Indexes (Implicit from Prisma)
- All `@id` fields have primary key indexes
- All `@unique` constraints have unique indexes
- Foreign key relationships have indexes

### Key Performance Considerations
- **User Relations**: Heavy use of join tables for many-to-many relationships
- **Task Queries**: Section-based organization for efficient filtering
- **Real-time Features**: Message and notification tables for live updates
- **File Storage**: Attachment metadata in DB, files on filesystem/cloud

### Scalability Features
- **Multi-tenancy**: Workspace-based data isolation
- **Soft Deletes**: Most relations use `onDelete: Cascade` or `SetNull`
- **Timestamp Tracking**: All entities have creation/update timestamps
- **JSON Fields**: Flexible configuration storage (Integration.config, BugReport.attachments)

---

*This mindmap represents the complete database structure of the PM-App project management system as of August 2025.*

# Project Management API Reference Guide

This document provides a comprehensive reference for all API endpoints in the Project Management application, including permission levels and access controls.

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Permission System](#permission-system)
3. [Tasks API](#tasks-api)
4. [Projects API](#projects-api)
5. [Workspaces API](#workspaces-api)
6. [Team Management API](#team-management-api)
7. [Messages API](#messages-api)
8. [Calendar API](#calendar-api)
9. [Notifications API](#notifications-api)
10. [Bug Reports API](#bug-reports-api)
11. [Payments & Billing API](#payments--billing-api)
12. [AI Usage & Credits API](#ai-usage--credits-api)
13. [Referral Program API](#referral-program-api)
14. [Donations API](#donations-api)
15. [Google Drive Integration API](#google-drive-integration-api)
16. [Storage Management API](#storage-management-api)
17. [Response Formats](#response-formats)
18. [Error Codes](#error-codes)

---

## Authentication & Security

All API endpoints require authentication unless otherwise specified.

### Authentication Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Session Management
- Session-based authentication using `getAuthSession()`
- JWT tokens for API access
- OAuth integration (Google)

---

## Permission System

The application implements a hierarchical permission system with multiple levels:

### System Roles (Global)
- **OWNER**: Full system access
- **ADMIN**: Administrative privileges across workspaces
- **PROJECT_MANAGER**: Can manage projects and teams
- **PROJECT_OFFICER**: Limited project management
- **MEMBER**: Basic user access
- **GUEST**: Read-only access

### Workspace Roles
- **OWNER**: Full workspace control
- **ADMIN**: Workspace administration
- **PROJECT_MANAGER**: Project creation and management
- **PROJECT_OFFICER**: Limited project oversight
- **MEMBER**: Basic workspace participation
- **GUEST**: Read-only workspace access

### Project Roles
- **ADMIN**: Full project control
- **MANAGER**: Project management and member assignment
- **OFFICER**: Task oversight and verification
- **MEMBER**: Task participation
- **VIEWER**: Read-only project access

### Permission Inheritance
- Workspace OWNER → Project ADMIN
- Workspace ADMIN → Project MANAGER
- Workspace MEMBER → Project MEMBER

---

## Tasks API

### Base URL: `/api/tasks`

#### GET /api/tasks
Retrieve tasks based on filters and user permissions.

**Query Parameters:**
- `projectId` (string, optional): Filter by project
- `workspaceId` (string, optional): Filter by workspace
- `status` (TaskStatus, optional): Filter by status
- `priority` (Priority, optional): Filter by priority
- `search` (string, optional): Search in title/description

**Permissions:**
- Users can only see tasks in projects they have access to
- System ADMIN/OWNER can see all tasks

**Response:**
```json
[
  {
    "id": "task_id",
    "title": "Task Title",
    "description": "Task description",
    "status": "TODO|IN_PROGRESS|REVIEW|AWAITING_VERIFICATION|VERIFIED|DONE|REJECTED",
    "priority": "LOW|MEDIUM|HIGH|URGENT",
    "dueDate": "2024-01-01T00:00:00Z",
    "assignee": {
      "id": "user_id",
      "name": "User Name",
      "avatar": "avatar_url"
    },
    "creator": {
      "id": "user_id",
      "name": "Creator Name",
      "avatar": "avatar_url"
    },
    "project": {
      "id": "project_id",
      "name": "Project Name",
      "color": "#3b82f6",
      "workspaceId": "workspace_id"
    },
    "commentCount": 5,
    "attachmentCount": 2,
    "subtaskCount": 3,
    "completedSubtaskCount": 1,
    "tags": [
      {
        "id": "tag_id",
        "name": "Tag Name",
        "color": "#ff0000"
      }
    ]
  }
]
```

#### POST /api/tasks
Create a new task.

**Required Permissions:**
- Project MEMBER or higher
- Must be member of the target project

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "projectId": "project_id",
  "assigneeId": "user_id",
  "priority": "MEDIUM",
  "dueDate": "2024-01-01T00:00:00Z",
  "status": "TODO",
  "tags": [
    {
      "name": "Tag Name",
      "color": "#ff0000"
    }
  ]
}
```

#### PUT /api/tasks/[id]
Update an existing task.

**Required Permissions:**
- Task creator can edit their own tasks
- Task assignee can update status and progress
- Project MANAGER+ can edit any task in the project
- System ADMIN can edit any task

**Request Body:** Same as POST (partial updates allowed)

#### DELETE /api/tasks/[id]
Delete a task.

**Required Permissions:**
- Task creator can delete their own tasks
- Project ADMIN can delete any task in the project
- System ADMIN can delete any task

---

## Projects API

### Base URL: `/api/projects`

#### GET /api/projects
Retrieve projects based on user access.

**Query Parameters:**
- `workspaceId` (string, optional): Filter by workspace
- `status` (ProjectStatus, optional): Filter by status
- `search` (string, optional): Search in name/description
- `includeCounts` (boolean, optional): Include task counts

**Permissions:**
- Users see projects they're members of or own
- Workspace members see workspace projects
- System ADMIN sees all projects

**Response:**
```json
[
  {
    "id": "project_id",
    "name": "Project Name",
    "description": "Project description",
    "color": "#3b82f6",
    "status": "PLANNING|ACTIVE|ON_HOLD|COMPLETED|ARCHIVED",
    "workspaceId": "workspace_id",
    "startDate": "2024-01-01T00:00:00Z",
    "dueDate": "2024-12-31T00:00:00Z",
    "owner": {
      "id": "user_id",
      "name": "Owner Name",
      "email": "owner@example.com",
      "avatar": "avatar_url"
    },
    "workspace": {
      "id": "workspace_id",
      "name": "Workspace Name"
    },
    "taskCount": 25,
    "completedTasks": 10,
    "memberCount": 5
  }
]
```

#### POST /api/projects
Create a new project.

**Required Permissions:**
- Workspace PROJECT_MANAGER or higher
- Must be member of the target workspace

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Project description",
  "workspaceId": "workspace_id",
  "color": "#3b82f6",
  "startDate": "2024-01-01T00:00:00Z",
  "dueDate": "2024-12-31T00:00:00Z"
}
```

#### PUT /api/projects/[id]
Update a project.

**Required Permissions:**
- Project ADMIN
- Workspace ADMIN+
- System ADMIN

#### DELETE /api/projects/[id]
Delete a project.

**Required Permissions:**
- Project owner
- Workspace OWNER
- System ADMIN

### Project Members

#### GET /api/projects/[id]/members
Get project members.

**Permissions:** Project VIEWER or higher

#### POST /api/projects/[id]/members
Add project member.

**Required Permissions:** Project MANAGER or higher

**Request Body:**
```json
{
  "userId": "user_id",
  "role": "MEMBER|MANAGER|ADMIN|VIEWER"
}
```

#### PUT /api/projects/[id]/members/[userId]
Update member role.

**Required Permissions:** Project ADMIN

#### DELETE /api/projects/[id]/members/[userId]
Remove project member.

**Required Permissions:** Project ADMIN

---

## Workspaces API

### Base URL: `/api/workspaces`

#### GET /api/workspaces
Get user's accessible workspaces.

**Permissions:** Must be authenticated

**Response:**
```json
[
  {
    "id": "workspace_id",
    "name": "Workspace Name",
    "description": "Workspace description",
    "avatar": "avatar_url",
    "role": "OWNER|ADMIN|PROJECT_MANAGER|PROJECT_OFFICER|MEMBER|GUEST",
    "memberCount": 15,
    "projectCount": 8
  }
]
```

#### POST /api/workspaces
Create a new workspace.

**Required Permissions:** Authenticated user

**Request Body:**
```json
{
  "name": "Workspace Name",
  "description": "Workspace description"
}
```

#### GET /api/workspaces/[id]
Get workspace details.

**Required Permissions:** Workspace member

#### PUT /api/workspaces/[id]
Update workspace.

**Required Permissions:** Workspace ADMIN or higher

#### DELETE /api/workspaces/[id]
Delete workspace.

**Required Permissions:** Workspace OWNER

### Workspace Members

#### GET /api/workspaces/[id]/members
Get workspace members.

**Required Permissions:** Workspace member

**Response:**
```json
[
  {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "avatar_url",
    "role": "OWNER|ADMIN|PROJECT_MANAGER|PROJECT_OFFICER|MEMBER|GUEST",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/workspaces/[id]/members
Invite user to workspace.

**Required Permissions:** Workspace ADMIN or higher

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "MEMBER"
}
```

#### PUT /api/workspaces/[id]/members/[userId]
Update member role.

**Required Permissions:** Workspace OWNER

#### DELETE /api/workspaces/[id]/members/[userId]
Remove workspace member.

**Required Permissions:** Workspace ADMIN or higher

### Workspace Invitations

#### GET /api/workspaces/[id]/invites
Get pending invitations.

**Required Permissions:** Workspace ADMIN or higher

#### POST /api/invitations/[id]/accept
Accept workspace invitation.

**Required Permissions:** Invitation recipient

#### POST /api/invitations/[id]/decline
Decline workspace invitation.

**Required Permissions:** Invitation recipient

---

## Team Management API

### User Search

#### GET /api/users/search
Search for users to invite.

**Query Parameters:**
- `q` (string): Search query
- `workspaceId` (string, optional): Exclude existing members

**Required Permissions:** Authenticated user

**Response:**
```json
[
  {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "avatar_url"
  }
]
```

---

## Messages API

### Base URL: `/api/messages`

#### Internal Messages

#### GET /api/messages/internal
Get internal messages/conversations.

**Query Parameters:**
- `conversationId` (string, optional): Get specific conversation
- `participantId` (string, optional): Get conversation with specific user

**Required Permissions:** Must be conversation participant

**Response:**
```json
{
  "conversations": [
    {
      "id": "conversation_id",
      "name": "Conversation Name",
      "isGroup": true,
      "type": "INTERNAL",
      "participants": [
        {
          "id": "user_id",
          "name": "User Name",
          "avatar": "avatar_url"
        }
      ],
      "lastMessage": {
        "content": "Last message content",
        "timestamp": "2024-01-01T00:00:00Z",
        "senderId": "user_id"
      },
      "unreadCount": 3
    }
  ]
}
```

#### POST /api/messages/internal
Send internal message.

**Request Body:**
```json
{
  "conversationId": "conversation_id",
  "content": "Message content",
  "participantIds": ["user_id1", "user_id2"]
}
```

#### External Messages (Gmail Integration)

#### GET /api/messages/gmail
Get Gmail messages.

**Required Permissions:** User with Gmail integration

#### POST /api/messages/gmail
Send Gmail message.

**Required Permissions:** User with Gmail integration

### Team Members for Messaging

#### GET /api/messages/team-members
Get team members for messaging.

**Required Permissions:** Workspace member

**Response:**
```json
[
  {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "avatar_url",
    "status": "online|offline|away",
    "workspaces": ["workspace_id1", "workspace_id2"]
  }
]
```

#### GET /api/messages/unread
Get unread message count.

**Required Permissions:** Authenticated user

---

## Calendar API

### Base URL: `/api/calendar`

#### GET /api/calendar/events
Get calendar events.

**Query Parameters:**
- `workspaceId` (string): Workspace ID
- `start` (string): Start date (ISO)
- `end` (string): End date (ISO)
- `projectId` (string, optional): Filter by project

**Required Permissions:** Workspace member

**Response:**
```json
[
  {
    "id": "event_id",
    "title": "Event Title",
    "description": "Event description",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T11:00:00Z",
    "type": "MEETING|CALL|DEADLINE|REMINDER",
    "location": "Meeting Room 1",
    "isRecurring": false,
    "creator": {
      "id": "user_id",
      "name": "Creator Name"
    },
    "project": {
      "id": "project_id",
      "name": "Project Name"
    },
    "attendees": [
      {
        "id": "user_id",
        "name": "Attendee Name",
        "response": "PENDING|ACCEPTED|DECLINED"
      }
    ]
  }
]
```

#### POST /api/calendar/events
Create calendar event.

**Required Permissions:** Workspace member

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T11:00:00Z",
  "type": "MEETING",
  "location": "Meeting Room 1",
  "workspaceId": "workspace_id",
  "projectId": "project_id",
  "attendeeIds": ["user_id1", "user_id2"]
}
```

---

## Notifications API

### Base URL: `/api/notifications`

#### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `unread` (boolean, optional): Filter unread notifications
- `type` (NotificationType, optional): Filter by type

**Required Permissions:** Authenticated user

**Response:**
```json
[
  {
    "id": "notification_id",
    "title": "Notification Title",
    "message": "Notification message",
    "type": "TASK_ASSIGNED|TASK_UPDATED|COMMENT_ADDED|PROJECT_INVITE|WORKSPACE_INVITE",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### PUT /api/notifications/[id]/read
Mark notification as read.

**Required Permissions:** Notification owner

#### POST /api/notifications/mark-all-read
Mark all notifications as read.

**Required Permissions:** Authenticated user

---

## Bug Reports API

### Base URL: `/api/bug-reports`

#### GET /api/bug-reports
Get bug reports.

**Query Parameters:**
- `status` (BugStatus, optional): Filter by status
- `priority` (BugPriority, optional): Filter by priority
- `category` (BugCategory, optional): Filter by category

**Required Permissions:** 
- Any user can see their own reports
- ADMIN can see all reports

**Response:**
```json
[
  {
    "id": "bug_id",
    "title": "Bug Title",
    "description": "Bug description",
    "priority": "LOW|MEDIUM|HIGH|CRITICAL",
    "category": "UI|FUNCTIONALITY|PERFORMANCE|SECURITY|OTHER",
    "status": "OPEN|IN_PROGRESS|RESOLVED|CLOSED|DUPLICATE",
    "reportedByName": "Reporter Name",
    "reportedByEmail": "reporter@example.com",
    "assignee": {
      "id": "user_id",
      "name": "Assignee Name"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/bug-reports
Create bug report.

**Required Permissions:** Any user (including anonymous)

**Request Body:**
```json
{
  "title": "Bug Title",
  "description": "Bug description",
  "priority": "MEDIUM",
  "category": "FUNCTIONALITY",
  "stepsToReproduce": "Steps to reproduce",
  "expectedBehavior": "Expected behavior",
  "actualBehavior": "Actual behavior",
  "browserInfo": "Browser information"
}
```

---

## Payments & Billing API

### Base URL: `/api/billing`

#### Subscription Management

#### GET /api/billing/subscriptions
Get user/workspace subscription details.

**Query Parameters:**
- `workspaceId` (string, optional): Get workspace subscription (requires workspace admin)

**Required Permissions:** 
- Individual: Authenticated user (own subscription)
- Workspace: Workspace ADMIN or higher

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "userId": "user_id",
    "workspaceId": "workspace_id",
    "plan": "FREE|INDIVIDUAL_PRO|TEAM_STANDARD|TEAM_PREMIUM|ENTERPRISE",
    "status": "ACTIVE|CANCELED|PAST_DUE|INCOMPLETE|TRIALING",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-01-31T23:59:59Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": "2024-01-15T23:59:59Z",
    "pricing": {
      "amount": 2999,
      "currency": "USD",
      "interval": "month",
      "intervalCount": 1
    },
    "usage": {
      "users": 5,
      "maxUsers": 10,
      "storage": 2048,
      "maxStorage": 10240,
      "aiCredits": 50,
      "maxAiCredits": 100
    }
  }
}
```

#### POST /api/billing/subscriptions
Create or upgrade subscription.

**Required Permissions:** 
- Individual: Authenticated user
- Workspace: Workspace OWNER

**Request Body:**
```json
{
  "plan": "INDIVIDUAL_PRO",
  "workspaceId": "workspace_id",
  "paymentMethodId": "pm_123",
  "couponCode": "SAVE20",
  "billingInterval": "month|year"
}
```

#### PUT /api/billing/subscriptions/[id]
Update subscription (upgrade/downgrade).

**Required Permissions:** Subscription owner or workspace OWNER

#### DELETE /api/billing/subscriptions/[id]
Cancel subscription.

**Required Permissions:** Subscription owner or workspace OWNER

### Payment Methods

#### GET /api/billing/payment-methods
Get user's payment methods.

**Required Permissions:** Authenticated user

**Response:**
```json
[
  {
    "id": "pm_123",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    },
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/billing/payment-methods
Add payment method.

**Request Body:**
```json
{
  "paymentMethodId": "pm_123",
  "setAsDefault": true
}
```

#### DELETE /api/billing/payment-methods/[id]
Remove payment method.

### Invoices & Billing History

#### GET /api/billing/invoices
Get billing history.

**Query Parameters:**
- `workspaceId` (string, optional): Get workspace invoices
- `limit` (number, optional): Limit results (max 100)
- `startDate` (string, optional): Filter from date
- `endDate` (string, optional): Filter to date

**Response:**
```json
[
  {
    "id": "inv_123",
    "number": "INV-2024-001",
    "status": "PAID|PENDING|FAILED|REFUNDED",
    "amount": 2999,
    "currency": "USD",
    "description": "Team Standard Plan - January 2024",
    "paidAt": "2024-01-01T00:00:00Z",
    "dueDate": "2024-01-31T23:59:59Z",
    "downloadUrl": "https://api.example.com/invoices/inv_123.pdf"
  }
]
```

#### GET /api/billing/invoices/[id]/download
Download invoice PDF.

### Usage Analytics

#### GET /api/billing/usage
Get current billing period usage.

**Query Parameters:**
- `workspaceId` (string, optional): Get workspace usage

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "usage": {
    "users": {
      "current": 5,
      "max": 10,
      "overageRate": 5.00
    },
    "storage": {
      "used": 2048,
      "limit": 10240,
      "unit": "MB",
      "overageRate": 0.10
    },
    "aiCredits": {
      "used": 50,
      "limit": 100,
      "overageRate": 0.02
    },
    "apiCalls": {
      "used": 5000,
      "limit": 10000,
      "overageRate": 0.001
    }
  },
  "projectedCost": {
    "base": 29.99,
    "overages": 5.50,
    "total": 35.49,
    "currency": "USD"
  }
}
```

---

## AI Usage & Credits API

### Base URL: `/api/ai`

#### Credits Management

#### GET /api/ai/credits
Get AI credits balance and usage.

**Query Parameters:**
- `workspaceId` (string, optional): Get workspace credits

**Required Permissions:** 
- Individual: Authenticated user
- Workspace: Workspace member

**Response:**
```json
{
  "balance": {
    "current": 75,
    "limit": 100,
    "resetDate": "2024-02-01T00:00:00Z"
  },
  "usage": {
    "thisMonth": 25,
    "lastMonth": 45,
    "breakdown": {
      "taskGeneration": 15,
      "smartNotifications": 5,
      "projectAnalysis": 3,
      "chatAssistant": 2
    }
  },
  "pricing": {
    "creditCost": 0.02,
    "currency": "USD",
    "packSizes": [
      { "credits": 100, "price": 1.99, "bonus": 0 },
      { "credits": 500, "price": 8.99, "bonus": 50 },
      { "credits": 1000, "price": 15.99, "bonus": 150 }
    ]
  }
}
```

#### POST /api/ai/credits/purchase
Purchase additional AI credits.

**Request Body:**
```json
{
  "packageId": "pack_500",
  "workspaceId": "workspace_id",
  "paymentMethodId": "pm_123"
}
```

#### GET /api/ai/usage-history
Get detailed AI usage history.

**Query Parameters:**
- `startDate` (string): Start date (ISO)
- `endDate` (string): End date (ISO)
- `service` (string, optional): Filter by AI service
- `workspaceId` (string, optional): Workspace filter

**Response:**
```json
[
  {
    "id": "usage_123",
    "service": "TASK_GENERATION",
    "description": "Generated 5 tasks for Project Alpha",
    "creditsUsed": 3,
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "projectId": "proj_123",
      "tasksGenerated": 5,
      "complexity": "medium"
    }
  }
]
```

### AI Services

#### POST /api/ai/task-generation
Generate tasks using AI (costs credits).

**Request Body:**
```json
{
  "projectId": "proj_123",
  "description": "Build user authentication system",
  "complexity": "high",
  "estimatedTasks": 10,
  "workspaceId": "workspace_id"
}
```

#### POST /api/ai/smart-insights
Get AI-powered project insights.

**Request Body:**
```json
{
  "projectId": "proj_123",
  "analysisType": "performance|timeline|risks|recommendations",
  "workspaceId": "workspace_id"
}
```

---

## Referral Program API

### Base URL: `/api/referrals`

#### Referral Management

#### GET /api/referrals/stats
Get user's referral statistics.

**Required Permissions:** Authenticated user

**Response:**
```json
{
  "referralCode": "REF_USER123",
  "stats": {
    "totalReferrals": 15,
    "successfulReferrals": 12,
    "pendingReferrals": 2,
    "totalEarnings": 180.00,
    "currentMonthEarnings": 45.00,
    "availableBalance": 95.50,
    "paidOut": 84.50
  },
  "referralUrl": "https://app.example.com/signup?ref=REF_USER123",
  "rewards": {
    "referrerBonus": 15.00,
    "refereeDiscount": 10.00,
    "minimumPayout": 50.00,
    "payoutMethods": ["STRIPE", "PAYPAL", "BANK_TRANSFER"]
  }
}
```

#### GET /api/referrals/history
Get referral history.

**Query Parameters:**
- `status` (string, optional): Filter by status (PENDING|CONFIRMED|PAID)
- `limit` (number, optional): Limit results

**Response:**
```json
[
  {
    "id": "ref_123",
    "refereeEmail": "user@example.com",
    "refereeName": "John Doe",
    "status": "CONFIRMED",
    "signupDate": "2024-01-15T00:00:00Z",
    "confirmationDate": "2024-01-16T00:00:00Z",
    "reward": {
      "amount": 15.00,
      "currency": "USD",
      "paidAt": "2024-02-01T00:00:00Z"
    },
    "referee": {
      "plan": "INDIVIDUAL_PRO",
      "subscriptionValue": 29.99
    }
  }
]
```

#### POST /api/referrals/generate-link
Generate custom referral link.

**Request Body:**
```json
{
  "campaign": "holiday-2024",
  "customCode": "SAVE20",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### POST /api/referrals/payout
Request payout of referral earnings.

**Request Body:**
```json
{
  "amount": 95.50,
  "method": "STRIPE|PAYPAL|BANK_TRANSFER",
  "accountDetails": {
    "email": "user@example.com",
    "accountId": "acct_123"
  }
}
```

---

## Donations API

### Base URL: `/api/donations`

#### Donation Management

#### GET /api/donations/campaigns
Get active donation campaigns.

**Query Parameters:**
- `status` (string, optional): Filter by status (ACTIVE|COMPLETED|DRAFT|PAUSED)
- `category` (string, optional): Filter by category
- `workspaceId` (string, optional): Get workspace-specific campaigns

**Required Permissions:** Public endpoint (no authentication required)

**Response:**
```json
[
  {
    "id": "campaign_123",
    "title": "Support Open Source Development",
    "description": "Help us continue building amazing project management tools for everyone",
    "category": "DEVELOPMENT|CHARITY|COMMUNITY|EDUCATION|EMERGENCY",
    "status": "ACTIVE",
    "goal": {
      "amount": 10000.00,
      "currency": "USD",
      "raised": 3450.50,
      "percentage": 34.5,
      "donorCount": 47
    },
    "timeline": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "daysRemaining": 120
    },
    "creator": {
      "id": "user_123",
      "name": "PM App Team",
      "avatar": "https://example.com/avatar.jpg",
      "verified": true
    },
    "rewards": [
      {
        "minAmount": 25.00,
        "title": "Bronze Supporter",
        "description": "Get a supporter badge and early access to new features",
        "estimatedDelivery": "immediate"
      },
      {
        "minAmount": 100.00,
        "title": "Silver Supporter",
        "description": "All bronze rewards + premium themes and priority support",
        "estimatedDelivery": "immediate"
      }
    ],
    "featuredImage": "https://example.com/campaign-image.jpg",
    "tags": ["opensource", "productivity", "tools"]
  }
]
```

#### POST /api/donations/campaigns
Create a new donation campaign.

**Required Permissions:** 
- Individual: Premium subscriber
- Workspace: Workspace ADMIN or higher

**Request Body:**
```json
{
  "title": "Support Our Mission",
  "description": "Detailed description of the campaign and how funds will be used",
  "category": "DEVELOPMENT",
  "goal": {
    "amount": 5000.00,
    "currency": "USD"
  },
  "timeline": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-06-30T23:59:59Z"
  },
  "workspaceId": "workspace_123",
  "rewards": [
    {
      "minAmount": 25.00,
      "title": "Early Supporter",
      "description": "Special recognition and updates",
      "maxBackers": 100
    }
  ],
  "featuredImage": "campaign-image-url",
  "tags": ["opensource", "community"]
}
```

#### GET /api/donations/campaigns/[id]
Get detailed campaign information.

**Response:**
```json
{
  "id": "campaign_123",
  "title": "Support Open Source Development",
  "description": "Detailed campaign description...",
  "fullDescription": "Extended description with formatting...",
  "category": "DEVELOPMENT",
  "status": "ACTIVE",
  "goal": {
    "amount": 10000.00,
    "currency": "USD",
    "raised": 3450.50,
    "percentage": 34.5,
    "donorCount": 47
  },
  "timeline": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "daysRemaining": 120,
    "createdAt": "2023-12-15T00:00:00Z"
  },
  "creator": {
    "id": "user_123",
    "name": "PM App Team",
    "avatar": "https://example.com/avatar.jpg",
    "verified": true,
    "totalCampaigns": 3,
    "totalRaised": 25000.00
  },
  "rewards": [
    {
      "id": "reward_1",
      "minAmount": 25.00,
      "title": "Bronze Supporter",
      "description": "Get a supporter badge and early access to new features",
      "maxBackers": 500,
      "currentBackers": 32,
      "estimatedDelivery": "immediate",
      "isAvailable": true
    }
  ],
  "updates": [
    {
      "id": "update_1",
      "title": "50% Milestone Reached!",
      "content": "Thanks to all our supporters...",
      "createdAt": "2024-01-15T10:00:00Z",
      "isPublic": true
    }
  ],
  "media": {
    "featuredImage": "https://example.com/campaign-image.jpg",
    "gallery": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "video": "https://example.com/campaign-video.mp4"
  },
  "social": {
    "shares": 156,
    "likes": 89,
    "comments": 23
  },
  "stats": {
    "views": 2450,
    "uniqueVisitors": 1876,
    "conversionRate": 2.5
  }
}
```

#### PUT /api/donations/campaigns/[id]
Update campaign details.

**Required Permissions:** Campaign creator or system admin

#### DELETE /api/donations/campaigns/[id]
Delete or archive campaign.

**Required Permissions:** Campaign creator or system admin

### Donation Processing

#### POST /api/donations/donate
Make a donation to a campaign.

**Request Body:**
```json
{
  "campaignId": "campaign_123",
  "amount": 50.00,
  "currency": "USD",
  "rewardId": "reward_1",
  "paymentMethodId": "pm_123",
  "isAnonymous": false,
  "message": "Keep up the great work!",
  "dedicationTo": "In memory of John Doe",
  "donorInfo": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "address": {
      "country": "US",
      "state": "CA",
      "city": "San Francisco"
    }
  },
  "recurringSettings": {
    "isRecurring": true,
    "frequency": "monthly",
    "endDate": "2024-12-31T23:59:59Z"
  },
  "taxReceiptRequested": true
}
```

**Response:**
```json
{
  "donation": {
    "id": "donation_123",
    "campaignId": "campaign_123",
    "amount": 50.00,
    "currency": "USD",
    "status": "COMPLETED",
    "isAnonymous": false,
    "message": "Keep up the great work!",
    "reward": {
      "id": "reward_1",
      "title": "Bronze Supporter",
      "fulfillmentStatus": "PENDING"
    },
    "createdAt": "2024-01-15T14:30:00Z",
    "transactionId": "txn_stripe_123"
  },
  "receipt": {
    "id": "receipt_123",
    "number": "RCP-2024-001",
    "downloadUrl": "https://api.example.com/receipts/receipt_123.pdf",
    "taxDeductible": true,
    "taxDeductibleAmount": 50.00
  },
  "recognition": {
    "publicThankYou": true,
    "badgeEarned": "SUPPORTER",
    "certificateUrl": "https://api.example.com/certificates/cert_123.pdf"
  }
}
```

#### GET /api/donations/history
Get user's donation history.

**Query Parameters:**
- `status` (string, optional): Filter by status
- `startDate` (string, optional): Filter from date
- `endDate` (string, optional): Filter to date
- `campaignId` (string, optional): Filter by campaign

**Required Permissions:** Authenticated user (own donations only)

**Response:**
```json
[
  {
    "id": "donation_123",
    "campaign": {
      "id": "campaign_123",
      "title": "Support Open Source Development",
      "status": "ACTIVE"
    },
    "amount": 50.00,
    "currency": "USD",
    "status": "COMPLETED",
    "createdAt": "2024-01-15T14:30:00Z",
    "reward": {
      "title": "Bronze Supporter",
      "fulfillmentStatus": "FULFILLED"
    },
    "isRecurring": false,
    "taxReceiptUrl": "https://api.example.com/receipts/receipt_123.pdf"
  }
]
```

### Donor Recognition & Rewards

#### GET /api/donations/leaderboard
Get campaign donor leaderboard.

**Query Parameters:**
- `campaignId` (string): Campaign ID
- `timeframe` (string, optional): Filter by timeframe (all|month|week)
- `limit` (number, optional): Limit results (max 100)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "donor": {
        "name": "Anonymous",
        "isAnonymous": true,
        "avatar": null
      },
      "totalDonated": 500.00,
      "donationCount": 1,
      "topSupporter": true,
      "badges": ["TOP_DONOR", "EARLY_SUPPORTER"]
    },
    {
      "rank": 2,
      "donor": {
        "name": "John Smith",
        "isAnonymous": false,
        "avatar": "https://example.com/avatar.jpg",
        "verified": true
      },
      "totalDonated": 250.00,
      "donationCount": 5,
      "topSupporter": false,
      "badges": ["LOYAL_SUPPORTER", "MONTHLY_DONOR"]
    }
  ],
  "stats": {
    "totalDonors": 47,
    "averageDonation": 73.41,
    "recurringDonors": 12,
    "firstTimeDonors": 35
  }
}
```

#### GET /api/donations/badges
Get user's donation badges and achievements.

**Required Permissions:** Authenticated user

**Response:**
```json
{
  "badges": [
    {
      "id": "SUPPORTER",
      "name": "Supporter",
      "description": "Made your first donation",
      "icon": "https://example.com/badges/supporter.svg",
      "earnedAt": "2024-01-15T14:30:00Z",
      "level": 1
    },
    {
      "id": "LOYAL_SUPPORTER",
      "name": "Loyal Supporter",
      "description": "Made 5 or more donations",
      "icon": "https://example.com/badges/loyal.svg",
      "earnedAt": "2024-02-01T10:00:00Z",
      "level": 2
    }
  ],
  "progress": [
    {
      "badgeId": "TOP_DONOR",
      "name": "Top Donor",
      "description": "Donate $1000 or more",
      "progress": 650.00,
      "target": 1000.00,
      "percentage": 65.0
    }
  ],
  "stats": {
    "totalDonated": 650.00,
    "campaignsSupported": 3,
    "donationCount": 8,
    "firstDonationAt": "2024-01-15T14:30:00Z",
    "impact": {
      "featuresUnlocked": 12,
      "developmentHours": 45,
      "communitiesHelped": 3
    }
  }
}
```

### Recurring Donations

#### GET /api/donations/recurring
Get user's recurring donations.

**Required Permissions:** Authenticated user

**Response:**
```json
[
  {
    "id": "recurring_123",
    "campaign": {
      "id": "campaign_123",
      "title": "Support Open Source Development",
      "status": "ACTIVE"
    },
    "amount": 25.00,
    "currency": "USD",
    "frequency": "monthly",
    "status": "ACTIVE",
    "nextDonation": "2024-02-15T14:30:00Z",
    "createdAt": "2024-01-15T14:30:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "totalDonated": 125.00,
    "donationCount": 5,
    "paymentMethod": {
      "id": "pm_123",
      "type": "card",
      "last4": "4242"
    }
  }
]
```

#### PUT /api/donations/recurring/[id]
Update recurring donation settings.

**Request Body:**
```json
{
  "amount": 35.00,
  "frequency": "monthly",
  "paymentMethodId": "pm_456",
  "endDate": "2025-01-31T23:59:59Z"
}
```

#### DELETE /api/donations/recurring/[id]
Cancel recurring donation.

**Required Permissions:** Donation owner

### Campaign Management (for creators)

#### GET /api/donations/campaigns/[id]/analytics
Get detailed campaign analytics.

**Required Permissions:** Campaign creator or workspace admin

**Response:**
```json
{
  "overview": {
    "totalRaised": 3450.50,
    "donorCount": 47,
    "averageDonation": 73.41,
    "goalProgress": 34.5,
    "daysRemaining": 120
  },
  "timeline": {
    "dailyDonations": [
      {
        "date": "2024-01-01",
        "amount": 125.00,
        "donorCount": 3
      }
    ],
    "milestones": [
      {
        "percentage": 25,
        "amount": 2500.00,
        "reachedAt": "2024-01-10T15:30:00Z"
      }
    ]
  },
  "donors": {
    "byAmount": {
      "under25": 15,
      "25to100": 20,
      "100to500": 10,
      "over500": 2
    },
    "byLocation": {
      "US": 25,
      "UK": 8,
      "CA": 6,
      "other": 8
    },
    "newVsReturning": {
      "new": 35,
      "returning": 12
    }
  },
  "rewards": [
    {
      "id": "reward_1",
      "title": "Bronze Supporter",
      "claimedCount": 32,
      "revenue": 1600.00
    }
  ],
  "projections": {
    "estimatedFinal": 8500.00,
    "probabilityOfSuccess": 75.5,
    "recommendedActions": [
      "Share on social media",
      "Send update to existing donors"
    ]
  }
}
```

#### POST /api/donations/campaigns/[id]/updates
Post campaign update.

**Request Body:**
```json
{
  "title": "50% Milestone Reached!",
  "content": "Thanks to all our supporters, we've reached 50% of our goal...",
  "isPublic": true,
  "notifyDonors": true,
  "media": [
    "https://example.com/update-image.jpg"
  ]
}
```

#### GET /api/donations/campaigns/[id]/donors
Get campaign donor list (for creator).

**Query Parameters:**
- `includeAnonymous` (boolean, optional): Include anonymous donors
- `sortBy` (string, optional): Sort by (amount|date|name)
- `rewardId` (string, optional): Filter by reward tier

**Required Permissions:** Campaign creator

### Tax & Receipts

#### GET /api/donations/tax-summary
Get annual tax summary for donations.

**Query Parameters:**
- `year` (number): Tax year
- `format` (string, optional): Response format (json|pdf)

**Required Permissions:** Authenticated user

**Response:**
```json
{
  "year": 2024,
  "totalDonations": 850.00,
  "taxDeductibleAmount": 850.00,
  "currency": "USD",
  "donations": [
    {
      "campaignTitle": "Support Open Source Development",
      "amount": 250.00,
      "date": "2024-01-15T14:30:00Z",
      "receiptNumber": "RCP-2024-001",
      "taxDeductible": true
    }
  ],
  "downloadUrl": "https://api.example.com/tax-summary/2024.pdf"
}
```

#### GET /api/donations/receipts/[id]
Download donation receipt.

**Required Permissions:** Receipt owner or campaign creator

---

## Google Drive Integration API

### Base URL: `/api/integrations/google-drive`

#### Authentication & Setup

#### GET /api/integrations/google-drive/auth-url
Get Google Drive OAuth URL.

**Required Permissions:** Authenticated user

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "state": "state_token_123"
}
```

#### POST /api/integrations/google-drive/callback
Handle OAuth callback.

**Request Body:**
```json
{
  "code": "auth_code_123",
  "state": "state_token_123"
}
```

#### GET /api/integrations/google-drive/status
Get integration status.

**Response:**
```json
{
  "isConnected": true,
  "connectedAt": "2024-01-01T00:00:00Z",
  "permissions": ["drive.file", "drive.readonly"],
  "quota": {
    "used": 5368709120,
    "total": 16106127360,
    "available": 10737418240,
    "unit": "bytes"
  },
  "syncSettings": {
    "autoSync": true,
    "syncFrequency": "hourly",
    "lastSync": "2024-01-15T14:30:00Z"
  }
}
```

#### DELETE /api/integrations/google-drive/disconnect
Disconnect Google Drive integration.

### File Management

#### GET /api/integrations/google-drive/files
List Google Drive files.

**Query Parameters:**
- `folderId` (string, optional): List files in specific folder
- `search` (string, optional): Search query
- `mimeType` (string, optional): Filter by file type
- `limit` (number, optional): Limit results

**Response:**
```json
{
  "files": [
    {
      "id": "drive_file_123",
      "name": "Project Requirements.docx",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size": 1048576,
      "createdTime": "2024-01-01T00:00:00Z",
      "modifiedTime": "2024-01-15T10:30:00Z",
      "webViewLink": "https://drive.google.com/file/d/123/view",
      "downloadUrl": "https://drive.google.com/uc?id=123",
      "thumbnailLink": "https://drive.google.com/thumbnail?id=123",
      "permissions": ["view", "edit", "share"],
      "isAttachedToTask": false
    }
  ],
  "nextPageToken": "next_page_123",
  "hasMore": true
}
```

#### POST /api/integrations/google-drive/upload
Upload file to Google Drive.

**Request Body (multipart/form-data):**
```
file: [File]
parentFolderId: "folder_123"
name: "Custom Name.pdf"
description: "Uploaded from PM App"
```

#### GET /api/integrations/google-drive/download/[fileId]
Download file from Google Drive.

**Query Parameters:**
- `format` (string, optional): Export format for Google Docs/Sheets

### Task Integration

#### POST /api/integrations/google-drive/attach-to-task
Attach Google Drive file to task.

**Request Body:**
```json
{
  "taskId": "task_123",
  "fileId": "drive_file_123",
  "fileName": "Requirements.docx",
  "shareSettings": {
    "allowEdit": false,
    "requireAuth": true
  }
}
```

#### GET /api/tasks/[id]/drive-files
Get Google Drive files attached to task.

**Response:**
```json
[
  {
    "id": "attachment_123",
    "driveFileId": "drive_file_123",
    "fileName": "Requirements.docx",
    "fileSize": 1048576,
    "mimeType": "application/docx",
    "attachedAt": "2024-01-15T10:30:00Z",
    "attachedBy": {
      "id": "user_123",
      "name": "John Doe"
    },
    "permissions": {
      "canView": true,
      "canEdit": false,
      "canShare": true
    },
    "links": {
      "view": "https://drive.google.com/file/d/123/view",
      "edit": "https://docs.google.com/document/d/123/edit"
    }
  }
]
```

### Folder Management

#### POST /api/integrations/google-drive/create-workspace-folder
Create dedicated folder for workspace.

**Request Body:**
```json
{
  "workspaceId": "workspace_123",
  "folderName": "PM App - Workspace Alpha",
  "parentFolderId": "parent_folder_id",
  "permissions": {
    "workspaceMembers": "edit",
    "projectManagers": "organize",
    "viewers": "view"
  }
}
```

#### GET /api/integrations/google-drive/workspace-folders
Get workspace-specific folders.

**Query Parameters:**
- `workspaceId` (string): Workspace ID

---

## Storage Management API

### Base URL: `/api/storage`

#### Storage Analytics

#### GET /api/storage/usage
Get storage usage statistics.

**Query Parameters:**
- `workspaceId` (string, optional): Get workspace storage
- `breakdown` (boolean, optional): Include detailed breakdown

**Required Permissions:** 
- Individual: Authenticated user
- Workspace: Workspace member

**Response:**
```json
{
  "usage": {
    "total": 2048,
    "limit": 10240,
    "unit": "MB",
    "percentage": 20.0
  },
  "breakdown": {
    "taskAttachments": 1024,
    "driveCache": 512,
    "userAvatars": 256,
    "projectAssets": 256
  },
  "largestFiles": [
    {
      "id": "file_123",
      "name": "presentation.pptx",
      "size": 50,
      "type": "task_attachment",
      "taskId": "task_123",
      "uploadedBy": "user_123",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "projections": {
    "monthlyGrowth": 15.5,
    "estimatedDaysUntilFull": 45
  }
}
```

#### POST /api/storage/cleanup
Clean up unnecessary files.

**Request Body:**
```json
{
  "actions": ["temp_files", "old_thumbnails", "deleted_tasks"],
  "dryRun": true,
  "olderThan": "30d"
}
```

#### GET /api/storage/files
List and manage uploaded files.

**Query Parameters:**
- `type` (string, optional): Filter by type (task_attachment|avatar|project_asset)
- `workspaceId` (string, optional): Filter by workspace
- `sortBy` (string, optional): Sort by (size|date|name)
- `limit` (number, optional): Limit results

### File Operations

#### POST /api/storage/upload
Upload file to application storage.

**Request Body (multipart/form-data):**
```
file: [File]
type: "task_attachment"
taskId: "task_123"
workspaceId: "workspace_123"
```

#### DELETE /api/storage/files/[id]
Delete uploaded file.

**Required Permissions:** File owner or workspace admin

---

## Response Formats

### Success Response
```json
{
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Pagination
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Error Codes

### Authentication Errors
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found

### Validation Errors
- `400` - Bad request / Invalid input
- `422` - Validation failed

### Server Errors
- `500` - Internal server error
- `503` - Service unavailable

### Business Logic Errors
- `WORKSPACE_ACCESS_DENIED` - User doesn't have workspace access
- `PROJECT_ACCESS_DENIED` - User doesn't have project access
- `TASK_UPDATE_DENIED` - User cannot update this task
- `INVALID_ROLE_ASSIGNMENT` - Cannot assign this role
- `MEMBER_LIMIT_EXCEEDED` - Workspace member limit reached
- `INSUFFICIENT_CREDITS` - Not enough AI credits for operation
- `PAYMENT_REQUIRED` - Subscription upgrade required
- `STORAGE_LIMIT_EXCEEDED` - Storage quota exceeded
- `INVALID_REFERRAL_CODE` - Referral code not found or expired
- `DRIVE_NOT_CONNECTED` - Google Drive integration required

---

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user
- **Search endpoints**: 30 requests per minute per user
- **Email sending**: 5 requests per minute per user
- **AI service endpoints**: 20 requests per minute per user
- **Payment endpoints**: 5 requests per minute per user
- **Google Drive sync**: 60 requests per hour per user

---

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **SQL Injection Prevention**: Using Prisma ORM with parameterized queries
3. **XSS Prevention**: Output encoding and CSP headers
4. **CSRF Protection**: CSRF tokens for state-changing operations
5. **Rate Limiting**: Applied to prevent abuse
6. **Data Encryption**: Sensitive data encrypted at rest
7. **Audit Logging**: All critical actions are logged
8. **PCI Compliance**: Secure payment processing via Stripe
9. **OAuth Security**: Secure token management for Google Drive
10. **Webhook Security**: Signature verification for all webhooks

---

## Integration Status

### ✅ Production Ready
- **Tasks API**: Fully implemented with advanced features
- **Projects API**: Complete with member management
- **Workspaces API**: Full CRUD with invitation system
- **Messages API**: Internal + Gmail integration
- **Notifications API**: Advanced with rate limiting
- **Authentication**: Robust JWT + OAuth system

### ⚠️ Partially Implemented
- **Calendar API**: Mock implementation - needs database integration
- **Bug Reports API**: Basic implementation - could use enhancement

### 🚧 Requires Implementation
- **Payments & Billing API**: Schema designed, implementation needed
- **AI Usage & Credits API**: Framework ready, needs service integration
- **Referral Program API**: Database schema ready, API endpoints needed
- **Google Drive Integration API**: Complete specification provided
- **Storage Management API**: Designed for file management

### 📋 Implementation Priority
1. **High Priority**: Complete Calendar API implementation
2. **Medium Priority**: Implement Payment system for monetization
3. **Medium Priority**: Add AI Credits system for usage billing
4. **Low Priority**: Referral program for growth
5. **Low Priority**: Google Drive integration for enhanced storage

---

## WebSocket Events

### Real-time Updates
- `task:updated` - Task status/assignment changes
- `message:new` - New message received
- `notification:new` - New notification
- `project:updated` - Project changes
- `user:online` - User status changes

### Event Format
```json
{
  "event": "task:updated",
  "data": {
    "taskId": "task_id",
    "changes": {
      "status": "DONE"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

This reference guide covers all major API endpoints and their permission requirements. For specific implementation details, refer to the individual route files in `/src/app/api/`.

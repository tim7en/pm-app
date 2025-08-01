# Task Assignment System with Notifications

This document explains the improved task assignment system that includes proper authorization, notifications, and workspace management.

## Overview

The task assignment system has been updated to:
1. Only allow assignment to workspace members
2. Automatically notify users when assigned to tasks
3. Optionally add users to workspaces when assigning tasks (for admins/owners)
4. Send notifications when users join workspaces through task assignment

## API Endpoints

### Task Assignment
- **POST** `/api/tasks/{taskId}/assign`
- **DELETE** `/api/tasks/{taskId}/assign` (for unassigning)

### Mock Member Seeding
- **POST** `/api/workspaces/{workspaceId}/seed-mock-members`

## How to Test Task Assignment

### 1. Add Mock Members to Your Workspace

1. Go to the **Team** page in your workspace
2. Click the **"Add Mock Members"** button (only visible to workspace owners/admins)
3. This will create 3 mock users and add them as workspace members:
   - Alex Johnson (member-1)
   - Sarah Chen (member-2)
   - Michael Rodriguez (member-3)

### 1.1. Clear Mock Members

1. Go to the **Team** page in your workspace
2. Click the **"Clear Mock Members"** button (only visible to workspace owners/admins)
3. This will remove all mock members from the workspace and delete them if they're not in other workspaces

### 2. Assign Tasks

Now you can assign tasks to these mock members:

1. Go to any task
2. Use the assignment dropdown/interface
3. Select one of the mock members
4. The system will:
   - Assign the task
   - Send a notification to the assigned user
   - Show a success message

### 3. Notifications

When a task is assigned:
- The assigned user receives a **"New Task Assigned"** notification
- If the user was added to the workspace during assignment, they also receive a **"Added to Workspace"** notification
- Notifications include:
  - Task title and project name
  - Link to the task
  - Sender information (who assigned the task)

## Authorization Rules

### Task Assignment Permissions

- **Workspace Owners/Admins**: Can assign tasks to any workspace member, and can add new users to workspace when assigning
- **Project Owners**: Can assign tasks in their projects to any workspace member
- **Regular Members**: Can only assign tasks to themselves (unless they own the project)

### Mock Member Addition

- Only workspace **Owners** and **Admins** can add mock members
- Mock members are added as regular **MEMBER** role users

## Technical Details

### API Request Format

```javascript
// Assign task
POST /api/tasks/12345/assign
{
  "assigneeId": "member-1"
}

// Unassign task
DELETE /api/tasks/12345/assign
```

### Response Format

```javascript
{
  "task": {
    // Updated task object with assignee info
  },
  "message": "Task assigned to Alex Johnson (user notified)"
}
```

### Error Handling

Common error scenarios:
- **401**: User not authenticated
- **403**: Insufficient permissions
- **404**: Task or assignee not found
- **400**: Invalid request data

## Notification Types

- **TASK_ASSIGNED**: When a task is assigned to a user
- **WORKSPACE_INVITE**: When a user is added to a workspace through task assignment

## Best Practices

1. **Add mock members first** before testing task assignments
2. **Use different user roles** to test various permission scenarios
3. **Check notifications** to ensure users are properly notified
4. **Test both assignment and unassignment** workflows
5. **Verify that only workspace members** appear in assignment dropdowns

## Troubleshooting

### "User not found" Error
- Make sure the user exists as a workspace member
- Use the "Add Mock Members" button to create test users

### "Not authorized" Error
- Check user permissions (only owners/admins/project owners can assign to others)
- Verify the user is a member of the workspace

### Notifications Not Working
- Check that the notification system is properly configured
- Verify WebSocket connections for real-time notifications
- Check the notifications API endpoint

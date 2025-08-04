# Access Control Implementation for Invited Team Members

## Overview
This document summarizes the implementation of strict access control for invited team members, ensuring they can only see tasks where they are assigned and projects where they have tasks, rather than all tasks within projects they are members of.

## Changes Made

### 1. Updated `getAccessibleTasks` Function (`src/lib/roles.ts`)

**Before**: Invited members could see all tasks from projects they were members of.

**After**: Role-based access control with three tiers:

#### System Admins (ADMIN, OWNER)
- Can see all tasks in the system

#### Project Managers (PROJECT_MANAGER, PROJECT_OFFICER)
- Can see tasks from projects they have access to
- Can see tasks they are assigned to, created, own projects, or are project members
- Can see tasks from workspaces where they are owners/admins

#### Invited Members (MEMBER, GUEST)
- **Restricted to only tasks they are directly involved with:**
  - Tasks assigned to them (legacy single assignee)
  - Tasks assigned to them (new multi-assignee system)
  - Tasks they created
  - Tasks from projects they own (in case they own a project but have MEMBER role)

### 2. Updated `getAccessibleProjects` Function (`src/lib/roles.ts`)

**Before**: Invited members could see all projects they were members of.

**After**: Role-based project visibility:

#### System Admins (ADMIN, OWNER)
- Can see all projects in the system

#### Project Managers (PROJECT_MANAGER, PROJECT_OFFICER)
- Can see projects they own, are members of, or have workspace admin access to

#### Invited Members (MEMBER, GUEST)
- **Only see projects where they have assigned tasks:**
  - Projects they own
  - Projects with tasks assigned to them (legacy single assignee)
  - Projects with tasks assigned to them (multi-assignee)
  - Projects with tasks they created

### 3. Enhanced Individual Task Endpoint Security (`src/app/api/tasks/[id]/route.ts`)

**Before**: Basic workspace membership check - any workspace member could access any task.

**After**: Comprehensive role-based access control:

- Added `getUserSystemRole` import
- Implemented the same three-tier access control as `getAccessibleTasks`
- Added multi-assignee support in access checks
- Enhanced security to prevent unauthorized access to individual tasks

### 4. Updated Task Reassign Dialog (`src/components/tasks/task-reassign-dialog.tsx`)

**Enhanced for Multi-Assignee Support:**
- Support for multiple current assignees via `currentAssigneeIds` prop
- Updated interface to show selected assignees as badges with remove buttons
- Toggle functionality for selecting/deselecting assignees
- Visual feedback showing assignment changes
- Uses new `/api/tasks/[id]/assignees` endpoint instead of legacy assign endpoint
- Backward compatible with existing single assignee system

## Security Benefits

### For Invited Members (MEMBER/GUEST roles):
1. **Task Isolation**: Can only see tasks they are specifically assigned to or created
2. **Project Filtering**: Only see projects that contain their tasks
3. **No Task Browsing**: Cannot browse or discover tasks assigned to other team members
4. **Maintained Collaboration**: Can still collaborate on tasks they are involved with

### For Higher Roles:
1. **Preserved Access**: PROJECT_MANAGER, PROJECT_OFFICER, ADMIN, and OWNER roles maintain their existing access levels
2. **Proper Hierarchy**: Clear distinction between management and member roles
3. **Workspace Control**: Workspace owners/admins retain full control over their workspaces

## API Endpoints Secured

1. **GET /api/tasks**: Uses `getAccessibleTasks` for filtering
2. **GET /api/tasks/[id]**: Enhanced with role-based access control
3. **GET /api/projects**: Uses `getAccessibleProjects` for filtering
4. **POST /api/tasks/[id]/assignees**: Multi-assignee support for reassignment

## Backward Compatibility

- Existing single assignee system continues to work
- Existing API calls remain functional
- Legacy `currentAssigneeId` prop supported in dialogs
- Database supports both single and multi-assignee models

## Testing

All access control changes have been validated with comprehensive tests covering:
- Role differentiation logic
- Task filtering for different user types
- Project visibility restrictions
- Individual task endpoint security
- Multi-assignee support

## Usage

### For Task Reassignment:
```tsx
<TaskReassignDialog
  open={open}
  onOpenChange={setOpen}
  taskId={taskId}
  taskTitle={taskTitle}
  currentAssigneeIds={task.assignees?.map(a => a.userId)} // New multi-assignee
  // OR currentAssigneeId={task.assigneeId} // Legacy single assignee
  onReassignComplete={(taskId, newAssigneeIds) => {
    // Handle reassignment completion
  }}
/>
```

### Role-based Task Access:
The system automatically applies the appropriate access control based on the user's system role:
- ADMIN/OWNER: See all tasks
- PROJECT_MANAGER/PROJECT_OFFICER: See project-related tasks
- MEMBER/GUEST: See only assigned/created tasks

## Impact

This implementation ensures that invited team members have a focused, secure experience where they only see the tasks and projects they need to work on, preventing information disclosure and maintaining proper project boundaries while preserving the collaborative nature of the platform for authorized tasks.

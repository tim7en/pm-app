# Permission System Documentation

## Overview
This project implements a comprehensive role-based access control (RBAC) system for managing project and task permissions. The system provides fine-grained access control across the application with multiple layers of permission checking.

## Architecture

### Core Components

1. **Permission Functions** (`/src/lib/roles.ts`)
   - Core business logic for permission checking
   - Role-based access control for projects and tasks
   - Workspace-level permission management

2. **API Endpoints** (`/src/app/api/permissions/route.ts`)
   - RESTful API for permission checking
   - Bulk permission retrieval
   - Frontend integration support

3. **React Hooks** (`/src/hooks/use-permissions.ts`)
   - Frontend permission state management
   - Cached permission checking
   - Real-time permission updates

4. **Permission Gates** (`/src/components/auth/permission-gate.tsx`)
   - Conditional component rendering
   - UI access control
   - Fallback content support

## User Roles

### Project-Level Roles
- **OWNER**: Full control over project and all tasks
- **MANAGER**: Can manage project settings and tasks
- **MEMBER**: Can view project and edit assigned tasks
- **GUEST**: Read-only access to project

### Workspace-Level Roles
- **ADMIN**: Full system access across all workspaces
- **USER**: Standard user with project-specific permissions

## Permissions Matrix

### Project Permissions
| Permission | Owner | Manager | Member | Guest |
|------------|-------|---------|--------|-------|
| View | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |

### Task Permissions
| Permission | Owner | Manager | Assignee | Member | Guest |
|------------|-------|---------|----------|--------|-------|
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Verify | ✅ | ✅ | ❌ | ❌ | ❌ |

## Usage Guide

### 1. Backend Permission Checking

```typescript
// Single permission check
import { canEditProject, canVerifyTask } from '@/lib/roles'

const userId = 'user-id'
const projectId = 'project-id'
const taskId = 'task-id'

// Check project permission
if (await canEditProject(userId, projectId)) {
  // User can edit this project
}

// Check task permission
if (await canVerifyTask(userId, taskId)) {
  // User can verify this task
}
```

### 2. Frontend Hooks

```typescript
import { useProjectPermissions, useTaskPermissions } from '@/hooks/use-permissions'

function ProjectComponent({ projectId }: { projectId: string }) {
  const { 
    canEdit, 
    canDelete, 
    canManageMembers,
    canCreateTasks,
    loading 
  } = useProjectPermissions(projectId)

  if (loading) return <div>Loading permissions...</div>

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
      {canManageMembers && <MemberManagement />}
      {canCreateTasks && <CreateTaskButton />}
    </div>
  )
}
```

### 3. Permission Gates

```typescript
import { 
  PermissionGate, 
  ProjectEditGate, 
  TaskVerifyGate 
} from '@/components/auth/permission-gate'

function UIComponent() {
  return (
    <div>
      {/* Simple permission gate */}
      <PermissionGate 
        projectId="project-id" 
        requireProjectPermission="edit"
        fallback={<div>No permission to edit</div>}
      >
        <EditProjectForm />
      </PermissionGate>

      {/* Specific permission gates */}
      <ProjectEditGate 
        projectId="project-id"
        fallback={<Button disabled>Edit (No Permission)</Button>}
      >
        <Button>Edit Project</Button>
      </ProjectEditGate>

      <TaskVerifyGate taskId="task-id">
        <VerifyTaskButton />
      </TaskVerifyGate>
    </div>
  )
}
```

### 4. API Integration

```typescript
// Single permission check
const response = await fetch('/api/permissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'project',
    action: 'edit',
    resourceId: 'project-id'
  })
})
const { hasPermission } = await response.json()

// Bulk permission check
const response = await fetch('/api/permissions?projectId=xxx&taskId=yyy')
const { projectPermissions, taskPermissions } = await response.json()
```

## Available Permission Functions

### Project Permissions
- `canViewProject(userId, projectId)` - Can view project details
- `canEditProject(userId, projectId)` - Can modify project settings
- `canDeleteProject(userId, projectId)` - Can delete the project
- `canManageProjectMembers(userId, projectId)` - Can add/remove members
- `canCreateTasks(userId, projectId)` - Can create new tasks

### Task Permissions
- `canViewTask(userId, taskId)` - Can view task details
- `canEditTask(userId, taskId)` - Can modify task content
- `canDeleteTask(userId, taskId)` - Can delete the task
- `canAssignTask(userId, taskId)` - Can assign task to users
- `canChangeTaskStatus(userId, taskId)` - Can update task status
- `canVerifyTask(userId, taskId)` - Can mark task as verified

### Bulk Permission Functions
- `getUserProjectPermissions(userId, projectId)` - Get all project permissions
- `getUserTaskPermissions(userId, taskId)` - Get all task permissions

## Database Schema

The permission system relies on the following database relationships:

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  workspaces    WorkspaceMember[]
  projects      ProjectMember[]
  assignedTasks TaskAssignment[]
}

model Project {
  id          String          @id @default(cuid())
  name        String
  workspaceId String
  workspace   Workspace       @relation(fields: [workspaceId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
}

model ProjectMember {
  id        String      @id @default(cuid())
  userId    String
  projectId String
  role      ProjectRole @default(MEMBER)
  user      User        @relation(fields: [userId], references: [id])
  project   Project     @relation(fields: [projectId], references: [id])
}

enum ProjectRole {
  OWNER
  MANAGER
  MEMBER
  GUEST
}

enum WorkspaceRole {
  ADMIN
  USER
}
```

## Security Considerations

1. **Server-Side Validation**: All permission checks are performed server-side
2. **Role Hierarchy**: Permissions follow a clear hierarchy (Owner > Manager > Member > Guest)
3. **Workspace Isolation**: Users can only access projects within their workspace
4. **API Protection**: All API endpoints validate permissions before data access
5. **UI Security**: Frontend gates prevent unauthorized UI elements from rendering

## Testing

The system includes comprehensive test coverage:

- Permission function testing
- API endpoint testing  
- Role-based access scenarios
- Edge case handling
- Database relationship validation

Run tests with:
```bash
node test-permissions.js
```

## Demo

Visit `/demo/permissions` to see an interactive demonstration of the permission system in action.

## Future Enhancements

1. **Custom Roles**: Allow workspace admins to create custom roles
2. **Permission Inheritance**: Implement role inheritance patterns
3. **Audit Logging**: Track permission changes and access attempts
4. **Time-based Permissions**: Support temporary access grants
5. **Resource-level Permissions**: Fine-grained permissions per resource type

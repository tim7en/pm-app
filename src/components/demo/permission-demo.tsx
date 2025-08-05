import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  PermissionGate,
  ProjectEditGate,
  ProjectDeleteGate,
  ProjectMemberManagementGate,
  TaskEditGate,
  TaskAssignGate,
  TaskVerifyGate
} from '@/components/auth/permission-gate'
import { useProjectPermissions, useTaskPermissions } from '@/hooks/use-permissions'
import { 
  Edit, 
  Trash2, 
  Users, 
  UserPlus, 
  CheckCircle, 
  Settings,
  Plus,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react'

interface PermissionDemoProps {
  projectId?: string
  taskId?: string
}

export function PermissionDemo({ projectId, taskId }: PermissionDemoProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [testMode, setTestMode] = useState<'normal' | 'simulation'>('normal')
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  
  const { 
    permissions: projectPermissions, 
    loading: projectLoading,
    canEdit: canEditProject,
    canDelete: canDeleteProject,
    canManageMembers,
    canCreateTasks,
    error: projectError
  } = useProjectPermissions(projectId)

  const { 
    permissions: taskPermissions, 
    loading: taskLoading,
    canEdit: canEditTask,
    canDelete: canDeleteTask,
    canAssign: canAssignTask,
    canVerify: canVerifyTask,
    error: taskError
  } = useTaskPermissions(taskId)

  // Test API connectivity
  const testPermissionAPI = async () => {
    if (!projectId) return
    
    setApiStatus('testing')
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          action: 'edit',
          resourceId: projectId
        })
      })
      
      if (response.ok) {
        setApiStatus('success')
        setTimeout(() => setApiStatus('idle'), 2000)
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      console.error('API test failed:', error)
      setApiStatus('error')
    }
  }

  const refreshPermissions = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Permission System Demo</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates the permission-based access control system.
            Buttons and actions will only appear if you have the required permissions.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPermissions}
            disabled={projectLoading || taskLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testPermissionAPI}
            disabled={apiStatus === 'testing'}
          >
            {apiStatus === 'testing' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Test API
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${projectLoading ? 'bg-yellow-500' : projectError ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="font-medium">Project Permissions</span>
            {projectLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {projectLoading ? 'Loading...' : projectError ? 'Error loading' : 'Ready'}
          </p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${taskLoading ? 'bg-yellow-500' : taskError ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="font-medium">Task Permissions</span>
            {taskLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {taskLoading ? 'Loading...' : taskError ? 'Error loading' : 'Ready'}
          </p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus === 'testing' ? 'bg-yellow-500' : 
              apiStatus === 'success' ? 'bg-green-500' : 
              apiStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="font-medium">API Status</span>
            {apiStatus === 'testing' && <RefreshCw className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {apiStatus === 'testing' ? 'Testing...' : 
             apiStatus === 'success' ? 'Connected' : 
             apiStatus === 'error' ? 'Failed' : 'Not tested'}
          </p>
        </Card>
      </div>

      {/* Error Alerts */}
      {(projectError || taskError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {projectError && `Project permissions error: ${projectError}`}
            {taskError && `Task permissions error: ${taskError}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Project Permissions Section */}
      {projectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Project Permissions
            </CardTitle>
            <CardDescription>
              Project ID: {projectId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Permission Status */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">View:</span> 
                    <Badge variant={canEditProject ? "default" : "secondary"}>
                      {canEditProject ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Edit:</span> 
                    <Badge variant={canEditProject ? "default" : "secondary"}>
                      {canEditProject ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Delete:</span> 
                    <Badge variant={canDeleteProject ? "default" : "secondary"}>
                      {canDeleteProject ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Manage Members:</span> 
                    <Badge variant={canManageMembers ? "default" : "secondary"}>
                      {canManageMembers ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Create Tasks:</span> 
                    <Badge variant={canCreateTasks ? "default" : "secondary"}>
                      {canCreateTasks ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Raw Data:</span> 
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => console.log('Project Permissions:', projectPermissions)}
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Permission-gated buttons */}
                <div className="flex flex-wrap gap-2">
                  <ProjectEditGate 
                    projectId={projectId}
                    fallback={
                      <Button variant="outline" disabled>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project (No Permission)
                      </Button>
                    }
                  >
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  </ProjectEditGate>

                  <ProjectDeleteGate 
                    projectId={projectId}
                    fallback={
                      <Button variant="outline" disabled>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project (No Permission)
                      </Button>
                    }
                  >
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </Button>
                  </ProjectDeleteGate>

                  <ProjectMemberManagementGate 
                    projectId={projectId}
                    fallback={
                      <Button variant="outline" disabled>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Members (No Permission)
                      </Button>
                    }
                  >
                    <Button variant="secondary">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  </ProjectMemberManagementGate>

                  <PermissionGate
                    projectId={projectId}
                    requireProjectPermission="createTasks"
                    fallback={
                      <Button variant="outline" disabled>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task (No Permission)
                      </Button>
                    }
                  >
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Permissions Section */}
      {taskId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Task Permissions
            </CardTitle>
            <CardDescription>
              Task ID: {taskId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taskLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Permission Status */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">View:</span> 
                    <Badge variant={canEditTask ? "default" : "secondary"}>
                      {canEditTask ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Edit:</span> 
                    <Badge variant={canEditTask ? "default" : "secondary"}>
                      {canEditTask ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Delete:</span> 
                    <Badge variant={canDeleteTask ? "default" : "secondary"}>
                      {canDeleteTask ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Assign:</span> 
                    <Badge variant={canAssignTask ? "default" : "secondary"}>
                      {canAssignTask ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Verify:</span> 
                    <Badge variant={canVerifyTask ? "default" : "secondary"}>
                      {canVerifyTask ? '✅ Allowed' : '❌ Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Raw Data:</span> 
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => console.log('Task Permissions:', taskPermissions)}
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Permission-gated buttons */}
                <div className="flex flex-wrap gap-2">
                  <TaskEditGate 
                    taskId={taskId}
                    fallback={
                      <Button variant="outline" disabled>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Task (No Permission)
                      </Button>
                    }
                  >
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Task
                    </Button>
                  </TaskEditGate>

                  <PermissionGate
                    taskId={taskId}
                    requireTaskPermission="delete"
                    fallback={
                      <Button variant="outline" disabled>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Task (No Permission)
                      </Button>
                    }
                  >
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                  </PermissionGate>

                  <TaskAssignGate 
                    taskId={taskId}
                    fallback={
                      <Button variant="outline" disabled>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Task (No Permission)
                      </Button>
                    }
                  >
                    <Button variant="secondary">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Task
                    </Button>
                  </TaskAssignGate>

                  <TaskVerifyGate 
                    taskId={taskId}
                    fallback={
                      <Button variant="outline" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Task (No Permission)
                      </Button>
                    }
                  >
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Task
                    </Button>
                  </TaskVerifyGate>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Permission System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Using Permission Hooks</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { useProjectPermissions, useTaskPermissions } from '@/hooks/use-permissions'

const { canEdit, canDelete, loading } = useProjectPermissions(projectId)
const { canAssign, canVerify } = useTaskPermissions(taskId)`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Using Permission Gates</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { PermissionGate, ProjectEditGate } from '@/components/auth/permission-gate'

<ProjectEditGate projectId={projectId} fallback={<div>No permission</div>}>
  <Button>Edit Project</Button>
</ProjectEditGate>

<PermissionGate taskId={taskId} requireTaskPermission="verify">
  <Button>Verify Task</Button>
</PermissionGate>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. API Permission Checks</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`// Single permission check
POST /api/permissions
{
  "type": "project",
  "action": "edit",
  "resourceId": "project-id"
}

// Bulk permission check
GET /api/permissions?projectId=xxx&taskId=yyy`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionDemo

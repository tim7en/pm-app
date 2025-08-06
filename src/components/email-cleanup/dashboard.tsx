import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Tags, 
  Brain, 
  History,
  RotateCcw,
  Settings
} from 'lucide-react'
import { LabelManager } from './label-manager'
import { LabelCleanupInterface } from './label-cleanup'
import { PromptGenerator } from './prompt-generator'

interface OperationHistory {
  id: string
  type: 'classify' | 'label_apply' | 'label_remove' | 'label_create' | 'label_delete' | 'label_merge'
  timestamp: string
  description: string
  sessionId: string
  canRollback: boolean
  isRolledBack: boolean
  affectedCount: number
  metadata: Record<string, any>
}

interface OperationStats {
  totalOperations: number
  rollbackableOperations: number
  rolledBackOperations: number
  successfulRollbacks: number
  failedRollbacks: number
}

export function EmailCleanupDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [operations, setOperations] = useState<OperationHistory[]>([])
  const [stats, setStats] = useState<OperationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId] = useState('user_123') // Mock user ID

  useEffect(() => {
    loadOperationHistory()
  }, [])

  const loadOperationHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/email/operations?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setOperations(data.operations)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load operation history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (operationId: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/email/operations?operationId=${operationId}&userId=${userId}`,
        { method: 'DELETE' }
      )
      
      const data = await response.json()
      
      if (data.success) {
        // Reload operation history
        await loadOperationHistory()
        // Show success message
      } else {
        console.error('Rollback failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to rollback operation:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'classify': return <Brain className="w-4 h-4" />
      case 'label_apply': return <Tags className="w-4 h-4" />
      case 'label_create': return <Tags className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'classify': return 'bg-blue-100 text-blue-800'
      case 'label_apply': return 'bg-green-100 text-green-800'
      case 'label_create': return 'bg-purple-100 text-purple-800'
      case 'label_remove': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Cleanup Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your email classifications, labels, and AI prompts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadOperationHistory}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <History className="w-4 h-4 mr-2" />
            Refresh History
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Operations</p>
                  <p className="text-2xl font-bold">{stats.totalOperations}</p>
                </div>
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rollbackable</p>
                  <p className="text-2xl font-bold text-green-600">{stats.rollbackableOperations}</p>
                </div>
                <RotateCcw className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rolled Back</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.rolledBackOperations}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful Rollbacks</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.successfulRollbacks}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Rollbacks</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedRollbacks}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="labels">Label Manager</TabsTrigger>
          <TabsTrigger value="cleanup">Label Cleanup</TabsTrigger>
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common email cleanup tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('labels')}
                >
                  <Tags className="w-4 h-4 mr-2" />
                  Manage Custom Labels
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('cleanup')}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Clean Up Duplicate Labels
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('prompts')}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Customize AI Prompts
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('history')}
                >
                  <History className="w-4 h-4 mr-2" />
                  View Operation History
                </Button>
              </CardContent>
            </Card>

            {/* Recent Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>
                  Latest email processing activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : operations.length > 0 ? (
                  <div className="space-y-3">
                    {operations.slice(0, 5).map((operation) => (
                      <div 
                        key={operation.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getOperationIcon(operation.type)}
                          <div>
                            <p className="font-medium text-sm">{operation.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(operation.timestamp)} • {operation.affectedCount} emails
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getOperationColor(operation.type)}>
                            {operation.type.replace('_', ' ')}
                          </Badge>
                          {operation.canRollback && !operation.isRolledBack && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRollback(operation.id)}
                              disabled={loading}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No operations yet</p>
                    <p className="text-sm">Start by processing some emails</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Alerts */}
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Email cleanup system is operational. All components are functioning normally.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <CardTitle>Label Management</CardTitle>
              <CardDescription>
                Create, edit, and organize your custom email labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup">
          <Card>
            <CardHeader>
              <CardTitle>Label Cleanup</CardTitle>
              <CardDescription>
                Detect and resolve label conflicts and duplicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelCleanupInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompt Management</CardTitle>
              <CardDescription>
                Customize and test AI prompts for email classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Operation History</CardTitle>
              <CardDescription>
                View and manage all email processing operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Progress value={33} className="w-full" />
                  <p className="text-center text-muted-foreground">Loading operation history...</p>
                </div>
              ) : operations.length > 0 ? (
                <div className="space-y-4">
                  {operations.map((operation) => (
                    <div 
                      key={operation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {getOperationIcon(operation.type)}
                        <div>
                          <p className="font-medium">{operation.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatTimestamp(operation.timestamp)}</span>
                            <span>{operation.affectedCount} emails affected</span>
                            <span>Session: {operation.sessionId.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getOperationColor(operation.type)}>
                          {operation.type.replace('_', ' ')}
                        </Badge>
                        {operation.isRolledBack && (
                          <Badge variant="outline" className="text-orange-600">
                            Rolled Back
                          </Badge>
                        )}
                        {operation.canRollback && !operation.isRolledBack && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRollback(operation.id)}
                            disabled={loading}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Operations Found</h3>
                  <p>Operation history will appear here after you start processing emails</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

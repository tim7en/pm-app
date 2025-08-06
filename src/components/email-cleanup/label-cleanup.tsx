'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertTriangle,
  Merge,
  Trash2,
  Undo,
  Shield,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  Copy,
  Eye,
  History,
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'

interface LabelConflict {
  id: string
  type: 'duplicate' | 'similar' | 'unused' | 'invalid'
  severity: 'high' | 'medium' | 'low'
  labels: string[]
  description: string
  recommendation: string
  emailsAffected: number
}

interface CleanupOperation {
  id: string
  type: 'merge' | 'delete' | 'rename' | 'deactivate'
  sourceLabels: string[]
  targetLabel?: string
  description: string
  emailsAffected: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  timestamp: string
  canRollback: boolean
}

interface LabelUsageStats {
  labelId: string
  labelName: string
  emailCount: number
  lastUsed: string
  averageUsagePerMonth: number
  isOrphaned: boolean
  isDuplicate: boolean
  hasConflicts: boolean
}

export function LabelCleanupInterface() {
  const [conflicts, setConflicts] = useState<LabelConflict[]>([])
  const [operations, setOperations] = useState<CleanupOperation[]>([])
  const [usageStats, setUsageStats] = useState<LabelUsageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([])
  const [activeOperation, setActiveOperation] = useState<CleanupOperation | null>(null)
  const [showOperationDialog, setShowOperationDialog] = useState(false)
  const [operationProgress, setOperationProgress] = useState(0)
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadConflicts(),
        loadOperations(),
        loadUsageStats()
      ])
    } catch (error) {
      console.error('Failed to load cleanup data:', error)
      toast.error('Failed to load cleanup data')
    } finally {
      setLoading(false)
    }
  }

  const loadConflicts = async () => {
    // Mock data - replace with actual API call
    const mockConflicts: LabelConflict[] = [
      {
        id: 'conflict-1',
        type: 'duplicate',
        severity: 'high',
        labels: ['AI/Cold-Outreach', 'Custom/Cold-Outreach', 'Cold-Prospects'],
        description: 'Multiple labels for cold outreach emails causing confusion',
        recommendation: 'Merge into single "AI/Cold-Outreach" label',
        emailsAffected: 324
      },
      {
        id: 'conflict-2',
        type: 'unused',
        severity: 'medium',
        labels: ['Old/Archived-2023', 'Temp/Test-Label'],
        description: 'Labels not used in the last 6 months',
        recommendation: 'Delete unused labels to reduce clutter',
        emailsAffected: 0
      },
      {
        id: 'conflict-3',
        type: 'similar',
        severity: 'medium',
        labels: ['AI/Interested', 'Custom/Potential-Interest'],
        description: 'Similar labels that might be duplicates',
        recommendation: 'Review and potentially merge similar labels',
        emailsAffected: 186
      },
      {
        id: 'conflict-4',
        type: 'invalid',
        severity: 'low',
        labels: ['Custom/VIP Clients', 'AI/Follow Up'],
        description: 'Labels with inconsistent naming conventions',
        recommendation: 'Rename to follow standard format',
        emailsAffected: 67
      }
    ]
    setConflicts(mockConflicts)
  }

  const loadOperations = async () => {
    // Mock data - replace with actual API call
    const mockOperations: CleanupOperation[] = [
      {
        id: 'op-1',
        type: 'merge',
        sourceLabels: ['Custom/VIP-Old', 'Custom/Important-Clients'],
        targetLabel: 'Custom/VIP-Clients',
        description: 'Merged duplicate VIP client labels',
        emailsAffected: 42,
        status: 'completed',
        timestamp: '2024-01-20T10:30:00Z',
        canRollback: true
      },
      {
        id: 'op-2',
        type: 'delete',
        sourceLabels: ['Temp/Testing'],
        description: 'Deleted temporary testing label',
        emailsAffected: 5,
        status: 'completed',
        timestamp: '2024-01-19T15:45:00Z',
        canRollback: false
      }
    ]
    setOperations(mockOperations)
  }

  const loadUsageStats = async () => {
    // Mock data - replace with actual API call
    const mockStats: LabelUsageStats[] = [
      {
        labelId: 'ai-cold-outreach',
        labelName: 'AI/Cold-Outreach',
        emailCount: 245,
        lastUsed: '2024-01-20T15:30:00Z',
        averageUsagePerMonth: 89,
        isOrphaned: false,
        isDuplicate: true,
        hasConflicts: true
      },
      {
        labelId: 'old-archived',
        labelName: 'Old/Archived-2023',
        emailCount: 0,
        lastUsed: '2023-12-15T10:00:00Z',
        averageUsagePerMonth: 0,
        isOrphaned: true,
        isDuplicate: false,
        hasConflicts: false
      }
    ]
    setUsageStats(mockStats)
  }

  const scanForConflicts = async () => {
    try {
      setScanning(true)
      toast.info('Scanning for label conflicts...')
      
      // Simulate scanning progress
      for (let i = 0; i <= 100; i += 10) {
        setOperationProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Reload conflicts after scanning
      await loadConflicts()
      
      toast.success('Conflict scan completed')
    } catch (error) {
      console.error('Failed to scan conflicts:', error)
      toast.error('Failed to scan for conflicts')
    } finally {
      setScanning(false)
      setOperationProgress(0)
    }
  }

  const createMergeOperation = (conflict: LabelConflict) => {
    const operation: CleanupOperation = {
      id: `merge-${Date.now()}`,
      type: 'merge',
      sourceLabels: conflict.labels.slice(1), // All except first label
      targetLabel: conflict.labels[0], // Keep first label as target
      description: `Merge ${conflict.labels.length} labels: ${conflict.labels.join(', ')}`,
      emailsAffected: conflict.emailsAffected,
      status: 'pending',
      timestamp: new Date().toISOString(),
      canRollback: true
    }
    
    setActiveOperation(operation)
    setShowOperationDialog(true)
  }

  const createDeleteOperation = (conflict: LabelConflict) => {
    const operation: CleanupOperation = {
      id: `delete-${Date.now()}`,
      type: 'delete',
      sourceLabels: conflict.labels,
      description: `Delete ${conflict.labels.length} unused labels: ${conflict.labels.join(', ')}`,
      emailsAffected: conflict.emailsAffected,
      status: 'pending',
      timestamp: new Date().toISOString(),
      canRollback: false
    }
    
    setActiveOperation(operation)
    setShowOperationDialog(true)
  }

  const executeOperation = async (operation: CleanupOperation) => {
    try {
      toast.info(`Executing ${operation.type} operation...`)
      
      // Simulate operation progress
      for (let i = 0; i <= 100; i += 20) {
        setOperationProgress(i)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Update operation status
      const completedOperation = {
        ...operation,
        status: 'completed' as const
      }
      
      setOperations(prev => [...prev, completedOperation])
      
      // Remove resolved conflicts
      if (operation.type === 'merge' || operation.type === 'delete') {
        setConflicts(prev => prev.filter(c => 
          !c.labels.some(label => operation.sourceLabels.includes(label))
        ))
      }
      
      setShowOperationDialog(false)
      setActiveOperation(null)
      setOperationProgress(0)
      
      toast.success(`${operation.type} operation completed successfully`)
    } catch (error) {
      console.error('Failed to execute operation:', error)
      toast.error('Failed to execute operation')
    }
  }

  const rollbackOperation = async (operationId: string) => {
    try {
      const operation = operations.find(op => op.id === operationId)
      if (!operation || !operation.canRollback) {
        toast.error('Cannot rollback this operation')
        return
      }

      toast.info('Rolling back operation...')
      
      // Simulate rollback progress
      for (let i = 0; i <= 100; i += 25) {
        setOperationProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Update operation status
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, status: 'cancelled' as const }
          : op
      ))
      
      setOperationProgress(0)
      toast.success('Operation rolled back successfully')
    } catch (error) {
      console.error('Failed to rollback operation:', error)
      toast.error('Failed to rollback operation')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-orange-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate':
        return <Copy className="h-4 w-4" />
      case 'similar':
        return <Eye className="h-4 w-4" />
      case 'unused':
        return <Trash2 className="h-4 w-4" />
      case 'invalid':
        return <XCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const filteredConflicts = conflicts.filter(conflict => {
    const matchesSeverity = severityFilter === 'all' || conflict.severity === severityFilter
    const matchesType = typeFilter === 'all' || conflict.type === typeFilter
    const matchesSearch = searchTerm === '' || 
      conflict.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      conflict.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSeverity && matchesType && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Label Cleanup</h2>
          <p className="text-muted-foreground">
            Identify and resolve label conflicts and issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={scanForConflicts}
            disabled={scanning}
          >
            {scanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {scanning ? 'Scanning...' : 'Scan for Issues'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {(scanning || operationProgress > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {scanning ? 'Scanning for conflicts...' : 'Processing operation...'}
                  </span>
                  <span className="text-sm text-muted-foreground">{operationProgress}%</span>
                </div>
                <Progress value={operationProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {conflicts.filter(c => c.severity === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Info className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                <p className="text-2xl font-bold">
                  {conflicts.filter(c => c.severity === 'medium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
                <p className="text-2xl font-bold">
                  {conflicts.filter(c => c.severity === 'low').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <History className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Operations</p>
                <p className="text-2xl font-bold">{operations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conflicts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="duplicate">Duplicates</SelectItem>
            <SelectItem value="similar">Similar</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detected Issues ({filteredConflicts.length})</h3>
        
        {filteredConflicts.map((conflict) => (
          <Card key={conflict.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getSeverityIcon(conflict.severity)}
                    {getTypeIcon(conflict.type)}
                    <h4 className="font-medium capitalize">{conflict.type} Issue</h4>
                    <Badge 
                      variant={conflict.severity === 'high' ? 'destructive' : 
                              conflict.severity === 'medium' ? 'default' : 'secondary'}
                    >
                      {conflict.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {conflict.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {conflict.labels.map((label, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Affects {conflict.emailsAffected.toLocaleString()} emails
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> {conflict.recommendation}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-6">
                  {(conflict.type === 'duplicate' || conflict.type === 'similar') && (
                    <Button
                      size="sm"
                      onClick={() => createMergeOperation(conflict)}
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Labels
                    </Button>
                  )}
                  
                  {conflict.type === 'unused' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => createDeleteOperation(conflict)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Labels
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredConflicts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-4">
              {conflicts.length === 0 
                ? 'Run a scan to check for label conflicts and issues'
                : 'All conflicts have been resolved or filtered out'
              }
            </p>
            {conflicts.length === 0 && (
              <Button onClick={scanForConflicts}>
                <Search className="h-4 w-4 mr-2" />
                Scan for Issues
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Operation History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Operations ({operations.length})</h3>
        
        {operations.map((operation) => (
          <Card key={operation.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      variant={operation.status === 'completed' ? 'default' : 
                              operation.status === 'failed' ? 'destructive' : 
                              operation.status === 'cancelled' ? 'secondary' : 'outline'}
                    >
                      {operation.status}
                    </Badge>
                    <span className="font-medium capitalize">{operation.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(operation.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {operation.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Affected {operation.emailsAffected.toLocaleString()} emails
                  </p>
                </div>
                
                {operation.canRollback && operation.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rollbackOperation(operation.id)}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Rollback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {operations.length === 0 && (
          <div className="text-center py-8">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No operations performed yet</p>
          </div>
        )}
      </div>

      {/* Operation Dialog */}
      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {activeOperation?.type} Operation</DialogTitle>
            <DialogDescription>
              Review the operation details before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {activeOperation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Operation Details</h4>
                <p className="text-sm text-muted-foreground">
                  {activeOperation.description}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Affected Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {activeOperation.sourceLabels.map((label, index) => (
                    <Badge key={index} variant="outline">
                      {label}
                    </Badge>
                  ))}
                  {activeOperation.targetLabel && (
                    <>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                      <Badge variant="default">
                        {activeOperation.targetLabel}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {activeOperation.emailsAffected > 0 
                        ? `This will affect ${activeOperation.emailsAffected.toLocaleString()} emails`
                        : 'No emails will be affected'
                      }
                    </p>
                    {!activeOperation.canRollback && (
                      <p className="text-xs text-yellow-700 mt-1">
                        This operation cannot be undone
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => activeOperation && executeOperation(activeOperation)}
              variant={activeOperation?.type === 'delete' ? 'destructive' : 'default'}
            >
              Confirm {activeOperation?.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

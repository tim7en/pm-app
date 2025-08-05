import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle, Mail, Settings, RefreshCw, Eye, Zap, Filter, BarChart3 } from 'lucide-react'

interface BulkAnalysisParams {
  maxEmails: number
  applyLabels: boolean
  skipClassified: boolean
  query: string
  batchSize: number
}

interface AnalysisProgress {
  current: number
  total: number
  percentage: number
  isRunning: boolean
  currentBatch: number
  totalBatches: number
  emailsPerSecond: number
  timeRemaining: number
}

interface ClassifiedEmail {
  id: string
  subject: string
  from: string
  snippet: string
  timestamp: string
  classification: {
    category: string
    confidence: number
    priority: string
    sentiment: number
    prospectStage: string
    isProspect: boolean
    requiresAction: boolean
  }
  appliedLabel?: string
  labelApplySuccess?: boolean
  alreadyClassified?: boolean
}

interface BulkAnalysisResult {
  totalProcessed: number
  totalClassified: number
  labelsApplied: number
  errors: number
  results: ClassifiedEmail[]
  nextPageToken?: string
  summary: {
    totalProcessed: number
    processed: number
    classified: number
    prospects: number
    highPriority: number
    labelsApplied: number
    errors: number
    skippedAlreadyClassified: number
  }
}

export function BulkEmailAnalyzer({ authTokens }: { authTokens: any }) {
  const [params, setParams] = useState<BulkAnalysisParams>({
    maxEmails: 50,
    applyLabels: true,
    skipClassified: true,
    query: 'is:unread',
    batchSize: 10
  })
  
  const [progress, setProgress] = useState<AnalysisProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    isRunning: false,
    currentBatch: 0,
    totalBatches: 0,
    emailsPerSecond: 0,
    timeRemaining: 0
  })
  
  const [results, setResults] = useState<ClassifiedEmail[]>([])
  const [analysisResult, setAnalysisResult] = useState<BulkAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [hasMoreEmails, setHasMoreEmails] = useState(true)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Update parameters handler
  const updateParam = <K extends keyof BulkAnalysisParams>(
    key: K, 
    value: BulkAnalysisParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  // Calculate progress metrics
  const updateProgress = (current: number, total: number, batchNum: number) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0
    const elapsed = Date.now() - startTimeRef.current
    const emailsPerSecond = current > 0 ? current / (elapsed / 1000) : 0
    const remaining = current > 0 ? ((total - current) / emailsPerSecond) : 0
    
    setProgress(prev => ({
      ...prev,
      current,
      total,
      percentage,
      currentBatch: batchNum,
      emailsPerSecond: Math.round(emailsPerSecond * 10) / 10,
      timeRemaining: Math.round(remaining)
    }))
  }

  // Start bulk analysis
  const startAnalysis = async () => {
    if (!authTokens) {
      setError('Gmail connection required')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResults([])
    setAnalysisResult(null)
    startTimeRef.current = Date.now()
    
    setProgress({
      current: 0,
      total: params.maxEmails,
      percentage: 0,
      isRunning: true,
      currentBatch: 0,
      totalBatches: Math.ceil(params.maxEmails / params.batchSize),
      emailsPerSecond: 0,
      timeRemaining: 0
    })

    try {
      const requestBody = {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        maxEmails: params.maxEmails,
        applyLabels: params.applyLabels,
        query: params.query,
        pageToken: nextPageToken,
        skipClassified: params.skipClassified,
        batchSize: params.batchSize
      }

      console.log('🚀 Starting bulk analysis with params:', requestBody)

      const response = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setAnalysisResult(data.result)
        setResults(data.result.results || [])
        setNextPageToken(data.nextPageToken)
        setHasMoreEmails(!!data.nextPageToken)
        
        // Final progress update
        updateProgress(
          data.result.totalProcessed, 
          data.result.totalProcessed, 
          Math.ceil(data.result.totalProcessed / params.batchSize)
        )
        
        console.log('✅ Analysis completed:', data.summary)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (err) {
      console.error('❌ Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsAnalyzing(false)
      setProgress(prev => ({ ...prev, isRunning: false }))
    }
  }

  // Continue analysis (load more emails)
  const continueAnalysis = async () => {
    if (!nextPageToken || !hasMoreEmails) return
    
    const remainingEmails = params.maxEmails - results.length
    if (remainingEmails <= 0) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: Math.min(remainingEmails, params.batchSize),
          applyLabels: params.applyLabels,
          query: params.query,
          pageToken: nextPageToken,
          skipClassified: params.skipClassified
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const newResults = [...results, ...(data.result.results || [])]
        setResults(newResults)
        setNextPageToken(data.nextPageToken)
        setHasMoreEmails(!!data.nextPageToken && newResults.length < params.maxEmails)
        
        // Update analysis result with combined data
        setAnalysisResult(prev => prev ? {
          ...prev,
          totalProcessed: prev.totalProcessed + data.result.totalProcessed,
          totalClassified: prev.totalClassified + data.result.totalClassified,
          labelsApplied: prev.labelsApplied + data.result.labelsApplied,
          errors: prev.errors + data.result.errors,
          results: newResults,
          summary: {
            ...prev.summary,
            totalProcessed: prev.summary.totalProcessed + data.summary.totalProcessed,
            processed: prev.summary.processed + data.summary.processed,
            classified: prev.summary.classified + data.summary.classified,
            prospects: prev.summary.prospects + data.summary.prospects,
            highPriority: prev.summary.highPriority + data.summary.highPriority,
            labelsApplied: prev.summary.labelsApplied + data.summary.labelsApplied,
            errors: prev.summary.errors + data.summary.errors,
            skippedAlreadyClassified: (prev.summary.skippedAlreadyClassified || 0) + (data.summary.skippedAlreadyClassified || 0)
          }
        } : data.result)
      } else {
        throw new Error(data.error || 'Failed to continue analysis')
      }
    } catch (err) {
      console.error('❌ Continue analysis error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-scroll to latest results
  useEffect(() => {
    if (scrollAreaRef.current && results.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [results])

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Get classification color
  const getClassificationColor = (category: string) => {
    const colors: Record<string, string> = {
      'high-priority-personal': 'bg-red-100 text-red-800',
      'climate-finance-work': 'bg-green-100 text-green-800',
      'academic-research': 'bg-purple-100 text-purple-800',
      'international-organizations': 'bg-blue-100 text-blue-800',
      'consulting-opportunities': 'bg-emerald-100 text-emerald-800',
      'personal-finance': 'bg-yellow-100 text-yellow-800',
      'professional-network': 'bg-indigo-100 text-indigo-800',
      'media-outreach': 'bg-teal-100 text-teal-800',
      'administrative': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Email Analysis Configuration
          </CardTitle>
          <CardDescription>
            Configure parameters for bulk email processing and AI classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Max Emails */}
            <div className="space-y-2">
              <Label htmlFor="maxEmails">Max Emails to Process</Label>
              <Input
                id="maxEmails"
                type="number"
                min="1"
                max="1000"
                value={params.maxEmails}
                onChange={(e) => updateParam('maxEmails', parseInt(e.target.value) || 50)}
                disabled={isAnalyzing}
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Select 
                value={params.batchSize.toString()} 
                onValueChange={(value) => updateParam('batchSize', parseInt(value))}
                disabled={isAnalyzing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 emails/batch</SelectItem>
                  <SelectItem value="10">10 emails/batch</SelectItem>
                  <SelectItem value="20">20 emails/batch</SelectItem>
                  <SelectItem value="50">50 emails/batch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Query Filter */}
            <div className="space-y-2">
              <Label htmlFor="query">Gmail Query Filter</Label>
              <Select 
                value={params.query} 
                onValueChange={(value) => updateParam('query', value)}
                disabled={isAnalyzing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is:unread">Unread emails only</SelectItem>
                  <SelectItem value="is:inbox">Inbox emails</SelectItem>
                  <SelectItem value="">All emails</SelectItem>
                  <SelectItem value="has:attachment">With attachments</SelectItem>
                  <SelectItem value="from:@gmail.com">From Gmail addresses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Apply Labels Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="applyLabels"
                checked={params.applyLabels}
                onCheckedChange={(checked) => updateParam('applyLabels', checked)}
                disabled={isAnalyzing}
              />
              <Label htmlFor="applyLabels">Apply Gmail Labels</Label>
            </div>

            {/* Skip Classified Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="skipClassified"
                checked={params.skipClassified}
                onCheckedChange={(checked) => updateParam('skipClassified', checked)}
                disabled={isAnalyzing}
              />
              <Label htmlFor="skipClassified">Skip Already Classified</Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={startAnalysis}
              disabled={isAnalyzing || !authTokens}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
            
            {hasMoreEmails && results.length > 0 && (
              <Button 
                onClick={continueAnalysis}
                disabled={isAnalyzing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Load More Emails
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Panel */}
      {(progress.isRunning || progress.current > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {progress.current}/{progress.total} emails</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
            
            {progress.isRunning && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Batch:</span>
                  <div className="font-medium">{progress.currentBatch}/{progress.totalBatches}</div>
                </div>
                <div>
                  <span className="text-gray-600">Speed:</span>
                  <div className="font-medium">{progress.emailsPerSecond} emails/s</div>
                </div>
                <div>
                  <span className="text-gray-600">Time Remaining:</span>
                  <div className="font-medium">{formatTimeRemaining(progress.timeRemaining)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium text-blue-600">Processing...</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.summary.processed}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResult.summary.classified}</div>
                <div className="text-sm text-gray-600">Classified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analysisResult.summary.prospects}</div>
                <div className="text-sm text-gray-600">Prospects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysisResult.summary.highPriority}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{analysisResult.summary.labelsApplied}</div>
                <div className="text-sm text-gray-600">Labels Applied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{analysisResult.summary.skippedAlreadyClassified || 0}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Results with Scrolling */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Classified Emails ({results.length})
            </CardTitle>
            <CardDescription>
              Real-time results as emails are processed and classified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96" ref={scrollAreaRef}>
              <div className="space-y-3">
                {results.map((email, index) => (
                  <div 
                    key={email.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={getClassificationColor(email.classification.category)}
                          >
                            {email.classification.category.replace('-', ' ')}
                          </Badge>
                          
                          <Badge 
                            variant={email.classification.priority === 'high' ? 'destructive' : 'secondary'}
                          >
                            {email.classification.priority} priority
                          </Badge>
                          
                          <Badge variant="outline">
                            {Math.round(email.classification.confidence * 100)}% confidence
                          </Badge>
                          
                          {email.appliedLabel && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {email.labelApplySuccess ? '✓ Labeled' : '✗ Label Failed'}
                            </Badge>
                          )}
                          
                          {email.alreadyClassified && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              Already Classified
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium truncate">{email.subject}</h4>
                        <p className="text-sm text-gray-600 mb-1">From: {email.from}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{email.snippet}</p>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500 flex-shrink-0">
                        <div>#{index + 1}</div>
                        {email.classification.sentiment !== undefined && (
                          <div className="mt-1">
                            Sentiment: {email.classification.sentiment > 0 ? '😊' : email.classification.sentiment < 0 ? '😟' : '😐'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator at bottom while processing */}
                {isAnalyzing && (
                  <div className="p-4 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Processing more emails...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

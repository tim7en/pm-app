"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Brain,
  TrendingUp,
  Users,
  Clock,
  Target,
  Filter,
  RefreshCw,
  Settings,
  Zap,
  BarChart3,
  PieChart,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Calendar,
  Download,
  Upload,
  Play,
  Pause,
  SkipForward,
  Tag,
  Search,
  Loader2
} from 'lucide-react'

// Available AI models for classification
const AI_MODELS = [
  { value: "openai", label: "OpenAI GPT-4" },
  { value: "zai", label: "Z.AI GLM-4-32B" },
  { value: "auto", label: "Auto (OpenAI → Z.AI fallback)" }
]

interface BulkProcessingStats {
  totalEmails: number
  processed: number
  classified: number
  prospects: number
  labelsApplied: number
  errors: number
  progress: number
}

interface EmailResult {
  id: string
  subject: string
  from: string
  snippet: string
  timestamp: Date
  classification?: {
    category: string
    confidence: number
    priority: string
    sentiment: number
    prospectStage: string
    isProspect: boolean
    requiresAction: boolean
  }
  appliedLabel?: string
  error?: string
}

export default function BulkEmailProcessor() {
  // Gmail Connection State
  const [gmailConnected, setGmailConnected] = useState(false)
  const [authTokens, setAuthTokens] = useState<any>(null)
  const [gmailProfile, setGmailProfile] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Bulk Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [processingStats, setProcessingStats] = useState<BulkProcessingStats>({
    totalEmails: 0,
    processed: 0,
    classified: 0,
    prospects: 0,
    labelsApplied: 0,
    errors: 0,
    progress: 0
  })

  // Configuration
  const [maxEmails, setMaxEmails] = useState(100)
  const [applyLabels, setApplyLabels] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [emailFilter, setEmailFilter] = useState('all') // all, unread, sent, etc.
  const [aiModel, setAiModel] = useState('auto') // AI model selection

    // Results
  const [results, setResults] = useState<EmailResult[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)

  // Gmail OAuth Flow
  const connectGmail = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/email/gmail/connect')
      const data = await response.json()
      
      if (data.success) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect to Gmail. Please try again.')
      setIsConnecting(false)
    }
  }

  const checkOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (error) {
      alert(`Gmail connection failed: ${error}`)
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }
    
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname)
      exchangeCodeForTokens(code)
    }
  }

  const exchangeCodeForTokens = async (code: string) => {
    try {
      const response = await fetch('/api/email/gmail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAuthTokens(data.tokens)
        setGmailProfile(data.profile)
        setGmailConnected(true)
        alert(`Gmail connected successfully! Email: ${data.profile.emailAddress}`)
      } else {
        alert('Failed to connect Gmail: ' + data.error)
      }
    } catch (error) {
      console.error('Error exchanging tokens:', error)
      alert('Failed to complete Gmail connection.')
    }
  }

  // Bulk Email Processing
  const startBulkProcessing = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    setIsProcessing(true)
    setIsPaused(false)
    setResults([])
    setProcessingStats({
      totalEmails: 0,
      processed: 0,
      classified: 0,
      prospects: 0,
      labelsApplied: 0,
      errors: 0,
      progress: 0
    })

    try {
      // Build query based on filters
      let query = searchQuery
      if (emailFilter === 'unread') query += ' is:unread'
      if (emailFilter === 'sent') query += ' in:sent'
      if (emailFilter === 'important') query += ' is:important'

      const response = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails,
          applyLabels,
          query,
          pageToken: null,
          aiModel
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResults(data.result.results)
        setNextPageToken(data.nextPageToken)
        setProcessingStats({
          totalEmails: data.summary.processed,
          processed: data.summary.processed,
          classified: data.summary.classified,
          prospects: data.summary.prospects,
          labelsApplied: data.summary.labelsApplied,
          errors: data.summary.errors,
          progress: 100
        })
      } else {
        alert('Failed to process emails: ' + data.error)
      }
    } catch (error) {
      console.error('Error processing emails:', error)
      alert('Failed to process emails.')
    } finally {
      setIsProcessing(false)
    }
  }

  const pauseProcessing = () => {
    setIsPaused(true)
    // In a real implementation, this would pause the ongoing process
  }

  const resumeProcessing = () => {
    setIsPaused(false)
    // Continue processing from where it left off
  }

  const processMoreEmails = async () => {
    if (!nextPageToken) return
    
    // Process next batch using the pageToken
    // Similar to startBulkProcessing but with nextPageToken
  }

  const testGmailIntegration = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    try {
      // Test basic connection
      const testResponse = await fetch('/api/email/gmail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'test-connection'
        })
      })

      const testData = await testResponse.json()
      
      if (testData.success) {
        alert(`Gmail Connection Test Successful!\n\nEmail: ${testData.result.email}\nTotal Messages: ${testData.result.totalMessages}\nTotal Threads: ${testData.result.totalThreads}`)
        
        // Test label creation
        const labelResponse = await fetch('/api/email/gmail/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: authTokens.accessToken,
            refreshToken: authTokens.refreshToken,
            action: 'create-test-labels'
          })
        })

        const labelData = await labelResponse.json()
        if (labelData.success) {
          alert(`Labels Created Successfully!\n\nCreated ${labelData.result.labelsCreated} AI classification labels in your Gmail account.`)
        }
      } else {
        alert('Gmail connection test failed: ' + testData.error)
      }
    } catch (error) {
      console.error('Error testing Gmail integration:', error)
      alert('Failed to test Gmail integration.')
    }
  }

  // Apply AI labels to already processed emails
  const applyLabelsToProcessedEmails = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    if (results.length === 0) {
      alert('No processed emails found. Please run classification first.')
      return
    }

    const emailsWithClassification = results.filter(result => result.classification?.prospectStage)
    
    if (emailsWithClassification.length === 0) {
      alert('No emails with AI classifications found.')
      return
    }

    if (!confirm(`Apply AI labels to ${emailsWithClassification.length} classified emails in your Gmail account?`)) {
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: emailsWithClassification.length,
          applyLabels: true,
          emailsToProcess: emailsWithClassification.map(result => ({
            id: result.id,
            subject: result.subject,
            body: result.snippet,
            from: result.from,
            classification: result.classification!.prospectStage
          }))
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully applied labels!\n\nProcessed: ${data.summary.totalProcessed}\nLabels Applied: ${data.summary.labelsApplied}\nErrors: ${data.summary.errors}`)
      } else {
        alert('Failed to apply labels: ' + data.error)
      }
    } catch (error) {
      console.error('Error applying labels:', error)
      alert('Failed to apply labels to Gmail.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Test label application on a specific email
  const testLabelApplication = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    // Get the first email ID for testing
    try {
      const emailsResponse = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: 1,
          applyLabels: false,
          query: 'is:unread'
        })
      })

      const emailsData = await emailsResponse.json()
      
      if (emailsData.success && emailsData.result.results.length > 0) {
        const testEmail = emailsData.result.results[0]
        
        // Test label application
        const labelResponse = await fetch('/api/email/gmail/test-labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: authTokens.accessToken,
            refreshToken: authTokens.refreshToken,
            messageId: testEmail.id
          })
        })

        const labelData = await labelResponse.json()
        
        if (labelData.success) {
          alert(`Label Test Successful!\n\nTest Email: ${testEmail.subject}\nLabel Applied: ${labelData.result.testLabelApplied}\nLabel Verified: ${labelData.result.testLabelVerified}\nLabels Created: ${labelData.result.labelsCreated}`)
        } else {
          alert('Label test failed: ' + labelData.error)
        }
      } else {
        alert('No emails found for testing. Please make sure you have at least one unread email.')
      }
    } catch (error) {
      console.error('Error testing label application:', error)
      alert('Failed to test label application.')
    }
  }

  // Debug Gmail integration
  const debugGmailIntegration = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    try {
      console.log('🧪 Starting Gmail debug tests...')
      
      // Test 1: Connection
      console.log('Test 1: Connection')
      const connectionTest = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'test-connection'
        })
      })
      const connectionResult = await connectionTest.json()
      console.log('Connection test result:', connectionResult)

      // Test 2: Permissions
      console.log('Test 2: Permissions')
      const permissionTest = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'test-permissions'
        })
      })
      const permissionResult = await permissionTest.json()
      console.log('Permission test result:', permissionResult)

      // Test 3: Label Application
      console.log('Test 3: Label Application')
      const labelTest = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'test-label-application'
        })
      })
      const labelResult = await labelTest.json()
      console.log('Label application test result:', labelResult)

      // Test 4: List existing labels
      console.log('Test 4: List Labels')
      const listTest = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'list-existing-labels'
        })
      })
      const listResult = await listTest.json()
      console.log('List labels test result:', listResult)

      // Show summary
      const summary = `Gmail Debug Results:

🔗 Connection: ${connectionResult.success ? '✅ SUCCESS' : '❌ FAILED'}
📧 Email: ${connectionResult.result?.email || 'N/A'}

🔐 Permissions: ${permissionResult.success ? '✅ SUCCESS' : '❌ FAILED'}
📖 Read: ${permissionResult.result?.readPermission ? '✅' : '❌'}
🏷️ Label Creation: ${permissionResult.result?.labelCreationPermission ? '✅' : '❌'}

🧪 Label Application: ${labelResult.success ? '✅ SUCCESS' : '❌ FAILED'}
✉️ Test Email: ${labelResult.result?.emailSubject || 'N/A'}
🏷️ Applied: ${labelResult.result?.applicationSuccess ? '✅' : '❌'}
🔍 Verified: ${labelResult.result?.verificationSuccess ? '✅' : '❌'}

📋 Labels: ${listResult.success ? '✅ SUCCESS' : '❌ FAILED'}
🏷️ Total Labels: ${listResult.result?.totalLabels || 0}
🤖 AI Labels: ${listResult.result?.aiLabels?.length || 0}

${!connectionResult.success ? '\n❌ Connection Error: ' + connectionResult.error : ''}
${!permissionResult.success ? '\n❌ Permission Error: ' + permissionResult.error : ''}
${!labelResult.success ? '\n❌ Label Error: ' + labelResult.error : ''}
${!listResult.success ? '\n❌ List Error: ' + listResult.error : ''}

Check the browser console for detailed logs.`

      alert(summary)
    } catch (error) {
      console.error('Error in Gmail debug:', error)
      alert('Failed to run Gmail debug tests. Check console for details.')
    }
  }

  // Simple label creation test
  const testSimpleLabelCreation = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    try {
      console.log('🧪 Testing simple label creation...')
      
      const response = await fetch('/api/email/gmail/simple-label-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken
        })
      })
      
      const data = await response.json()
      console.log('Simple label test result:', data)
      
      if (data.success) {
        const result = data.result
        alert(`Label Creation Test Successful! ✅

📊 Results:
• Existing Labels: ${result.existingLabelsCount}
• Existing AI Labels: ${result.existingAiLabels.length}
• Test Label Created: ${result.testLabelCreated ? 'YES' : 'NO'}
• Prospect Labels Created: ${result.prospectLabelsCreated}/8

🏷️ AI Labels Found:
${result.existingAiLabels.map(l => `• ${l.name}`).join('\n')}

✅ This means Gmail label creation is working!`)
      } else {
        alert(`Label Creation Test Failed ❌

Error: ${data.error}

${data.errorDetails ? `Details: ${data.errorDetails.message}` : ''}

Check the browser console for more details.`)
      }
    } catch (error) {
      console.error('Error testing simple label creation:', error)
      alert('Failed to test label creation. Check console for details.')
    }
  }

  // Comprehensive AI Classification and Labeling Test
  const testCompleteAIPipeline = async () => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    // Test functions removed - setTestingInProgress no longer exists
    // setTestingInProgress(true)
    try {
      console.log('🧪 Testing complete AI classification and labeling pipeline...')
      
      // Step 1: Test AI Classification
      console.log('Step 1: Testing AI Classification...')
      const testEmails = [
        {
          subject: "Interested in your consulting services",
          body: "Hi, I saw your company online and I'm interested in learning more about your consulting services. Could you send me a proposal?",
          from: "prospect1@company.com",
          expectedStage: "prospect-lead"
        },
        {
          subject: "Project update meeting request", 
          body: "Hi, we need to schedule our monthly project review meeting. Can we discuss the progress on the current deliverables this week?",
          from: "client@existingcompany.com",
          expectedStage: "active-client"
        }
      ]

      const classificationResults: Array<{
        email: string
        classified?: string
        expected?: string
        confidence?: number
        success: boolean
        error?: string
      }> = []
      
      for (const email of testEmails) {
        try {
          const response = await fetch('/api/ai/analyze-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: email.subject,
              body: email.body,
              from: email.from
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            classificationResults.push({
              email: email.subject,
              classified: result.suggestedStage,
              expected: email.expectedStage,
              confidence: result.confidence,
              success: true
            })
          } else {
            classificationResults.push({
              email: email.subject,
              error: `HTTP ${response.status}`,
              success: false
            })
          }
        } catch (error) {
          classificationResults.push({
            email: email.subject,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          })
        }
      }

      // Step 2: Test Label Creation
      console.log('Step 2: Testing Gmail Label Creation...')
      const labelResponse = await fetch('/api/email/gmail/simple-label-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken
        })
      })
      
      const labelData = await labelResponse.json()
      
      // Step 3: Test Complete Pipeline with Real Emails (small batch)
      console.log('Step 3: Testing complete pipeline with real emails...')
      const pipelineResponse = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: 5, // Small test batch
          applyLabels: true,
          query: ''
        })
      })
      
      const pipelineData = await pipelineResponse.json()

      // Display comprehensive results
      const classificationSuccess = classificationResults.filter(r => r.success).length
      const labelSuccess = labelData.success
      const pipelineSuccess = pipelineData.success

      alert(`Complete AI Pipeline Test Results 🧪

📊 AI Classification Test:
• Tests Run: ${classificationResults.length}
• Successful: ${classificationSuccess}
• Failed: ${classificationResults.length - classificationSuccess}

${classificationResults.map(r => 
  r.success 
    ? `✅ "${r.email}": ${r.classified} (conf: ${Math.round((r.confidence || 0) * 100)}%)`
    : `❌ "${r.email}": ${r.error}`
).join('\n')}

🏷️ Gmail Label Creation Test:
${labelSuccess ? '✅ SUCCESS' : '❌ FAILED'}
${labelSuccess ? `• Labels Created: ${labelData.result?.prospectLabelsCreated}/8` : `• Error: ${labelData.error}`}

🔄 Complete Pipeline Test:
${pipelineSuccess ? '✅ SUCCESS' : '❌ FAILED'}
${pipelineSuccess 
  ? `• Emails Processed: ${pipelineData.result?.totalProcessed}
• Classifications: ${pipelineData.result?.totalClassified}
• Labels Applied: ${pipelineData.result?.labelsApplied}
• Errors: ${pipelineData.result?.errors}` 
  : `• Error: ${pipelineData.error}`}

${(classificationSuccess === classificationResults.length && labelSuccess && pipelineSuccess)
  ? '🎉 ALL TESTS PASSED! The AI classification and Gmail labeling pipeline is working correctly.'
  : '⚠️ Some tests failed. Check the console for detailed error logs.'}`)

    } catch (error) {
      console.error('Error testing complete AI pipeline:', error)
      alert('Failed to test complete pipeline. Check console for details.')
    } finally {
      // Test functions removed - setTestingInProgress no longer exists
      // setTestingInProgress(false)
    }
  }

  useEffect(() => {
    checkOAuthCallback()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Co-Pilot</h1>
            <p className="text-gray-600">AI-powered bulk email classification and management</p>
          </div>
          {gmailConnected && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">Gmail Connected</span>
              </div>
              <Badge variant="outline">{gmailProfile?.emailAddress}</Badge>
            </div>
          )}
        </div>

        {/* Gmail Connection */}
        {!gmailConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Connect Gmail Account</span>
              </CardTitle>
              <CardDescription>
                Connect your Gmail account to start bulk email classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={connectGmail} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Connect Gmail
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Processing Configuration */}
        {gmailConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Bulk Processing Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Emails</label>
                  <Input
                    type="number"
                    value={maxEmails}
                    onChange={(e) => setMaxEmails(parseInt(e.target.value))}
                    min={1}
                    max={1000}
                  />
                </div>
                
                {/* AI Model Selection */}
                <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Model
                  </label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-700">
                    Choose your AI provider
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Filter</label>
                  <Select value={emailFilter} onValueChange={setEmailFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emails</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="sent">Sent Emails</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Query</label>
                  <Input
                    placeholder="e.g., from:prospect@company.com"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    checked={applyLabels}
                    onCheckedChange={setApplyLabels}
                  />
                  <Label className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">Apply Gmail labels automatically</span>
                  </Label>
                </div>
                <p className="text-sm text-blue-700">
                  When enabled, AI classifications will be automatically applied as labels in your Gmail account.
                  Labels like "AI/Qualified", "AI/Cold-Outreach", etc. will be created and applied to emails.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={startBulkProcessing}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      {applyLabels ? 'Classify & Apply to Gmail' : 'Classify Emails Only'}
                    </>
                  )}
                </Button>

              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Processing Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  {!isPaused ? (
                    <Button size="sm" variant="outline" onClick={pauseProcessing}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={resumeProcessing}>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={processingStats.progress} className="w-full" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{processingStats.processed}</div>
                  <div className="text-sm text-gray-600">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{processingStats.classified}</div>
                  <div className="text-sm text-gray-600">Classified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{processingStats.prospects}</div>
                  <div className="text-sm text-gray-600">Prospects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{processingStats.labelsApplied}</div>
                  <div className="text-sm text-gray-600">Labels Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{processingStats.errors}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Classification Results</span>
                  </CardTitle>
                  <CardDescription>
                    {results.length} emails processed and classified
                  </CardDescription>
                </div>
                <Button
                  onClick={applyLabelsToProcessedEmails}
                  disabled={isProcessing || !results.some(r => r.classification?.prospectStage)}
                  variant="outline"
                  size="sm"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Apply Labels to Gmail
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.slice(0, 20).map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium truncate">{email.subject}</h4>
                        <p className="text-sm text-gray-600">{email.from}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {email.classification && (
                          <>
                            <Badge 
                              variant={email.classification.isProspect ? "default" : "secondary"}
                            >
                              {email.classification.prospectStage}
                            </Badge>
                            {email.appliedLabel && (
                              <Badge variant="outline">
                                <Tag className="h-3 w-3 mr-1" />
                                {email.appliedLabel}
                              </Badge>
                            )}
                          </>
                        )}
                        {email.error && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{email.snippet}</p>
                    {email.classification && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Confidence: {(email.classification.confidence * 100).toFixed(0)}%</span>
                        <span>Priority: {email.classification.priority}</span>
                        <span>Sentiment: {email.classification.sentiment > 0 ? 'Positive' : email.classification.sentiment < 0 ? 'Negative' : 'Neutral'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {nextPageToken && (
                <div className="mt-4 text-center">
                  <Button onClick={processMoreEmails} variant="outline">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Process More Emails
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
  )
}

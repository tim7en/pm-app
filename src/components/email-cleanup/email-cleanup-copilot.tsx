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
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BulkEmailAnalyzer } from './bulk-email-analyzer'
import { LabelManager } from './label-manager'
import { LabelCleanupInterface } from './label-cleanup'
import { PromptGenerator } from './prompt-generator'
import { EmailCleanupDashboard } from './dashboard'
import { useEmailCleanup } from '@/contexts/email-cleanup-context'
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
  Tag,
  Palette,
  Wrench,
  History,
  Info
} from 'lucide-react'

interface EmailStats {
  totalEmails: number
  categorized: number
  followUps: number
  responseRate: number
}

interface ProspectStage {
  id: string
  name: string
  count: number
  color: string
  percentage: number
}

interface EmailItem {
  id: string
  subject: string
  from: string
  snippet: string
  timestamp: Date
  stage: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  engagementScore: number
  needsFollowUp: boolean
}

interface EmailInsights {
  topSubjects: Array<{ subject: string; responseRate: number }>
  averageResponseTime: string
  sameDayResponseRate: number
  followUpCount: number
  recommendations: Array<{ type: string; message: string }>
}

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export function EmailCleanupCoPilot() {
  // Use global email cleanup context
  const {
    gmailConnected,
    authTokens,
    gmailProfile,
    isConnecting,
    connectGmail,
    disconnectGmail,
    checkOAuthCallback
  } = useEmailCleanup()
  
  // Local component state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState<EmailStats>({
    totalEmails: 0,
    categorized: 0,
    followUps: 0,
    responseRate: 0
  })
  const [prospectStages, setProspectStages] = useState<ProspectStage[]>([])
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all')
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [emailContent, setEmailContent] = useState<string>('')
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)
  const [insights, setInsights] = useState<EmailInsights>({
    topSubjects: [],
    averageResponseTime: '0h',
    sameDayResponseRate: 0,
    followUpCount: 0,
    recommendations: []
  })
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDashboardData()
    // Check for OAuth callback when component mounts
    checkOAuthCallback()
  }, [])

  // Update stats when Gmail connection changes
  useEffect(() => {
    if (gmailConnected && gmailProfile) {
      setStats(prev => ({
        ...prev,
        totalEmails: gmailProfile.messagesTotal || 0
      }))
    }
  }, [gmailConnected, gmailProfile])

  // Auto-refresh functionality
  useEffect(() => {
    if (isAutoRefresh && gmailConnected) {
      const interval = setInterval(() => {
        loadDashboardData()
        setLastRefresh(new Date())
      }, 30000) // Refresh every 30 seconds
      
      setRefreshInterval(interval)
      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [isAutoRefresh, gmailConnected])

  const manualRefresh = async () => {
    await loadDashboardData()
    setLastRefresh(new Date())
  }

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh)
  }

  const loadDashboardData = async () => {
    if (!authTokens || !authTokens.accessToken || !authTokens.refreshToken) {
      console.warn('No Gmail tokens available for loading dashboard data')
      return
    }

    try {
      setIsProcessing(true)
      
      // Get real Gmail statistics
      const statsResponse = await fetch('/api/email/gmail/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          includeUnlabeled: true
        })
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          const realStats = {
            totalEmails: statsData.stats.totalEmails || 0,
            categorized: statsData.stats.totalEmails - (statsData.stats.unlabeledCount || 0),
            followUps: 0, // Will be calculated from email analysis
            responseRate: 0.65 // Default for now, can be calculated from sent vs received ratio
          }
          setStats(realStats)
        }
      }

      // Get real prospect stages from labels
      const labelsResponse = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'list-labels'
        })
      })

      let currentStages: any[] = []

      if (labelsResponse.ok) {
        const labelsData = await labelsResponse.json()
        if (labelsData.success) {
          const gmailLabels = labelsData.result.labels || []
          
          // Filter for AI-created prospect labels
          const prospectLabels = gmailLabels.filter((label: any) => 
            label.name && (
              label.name.startsWith('AI/') || 
              label.name.includes('Prospect') ||
              label.name.includes('Cold') ||
              label.name.includes('Outreach')
            )
          )

          // Convert Gmail labels to prospect stages
          const realStages = prospectLabels.map((label: any, index: number) => ({
            id: label.id,
            name: label.name.replace('AI/', '').replace('-', ' '),
            count: label.messagesTotal || 0,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#059669', '#6B7280'][index % 7],
            percentage: Math.round((label.messagesTotal || 0) / (stats.totalEmails || 1) * 100)
          }))

          // If no AI labels exist, create default stages
          if (realStages.length === 0) {
            const defaultStages = [
              { id: 'cold', name: 'Cold Outreach', count: 0, color: '#3B82F6', percentage: 0 },
              { id: 'interested', name: 'Interested', count: 0, color: '#10B981', percentage: 0 },
              { id: 'qualified', name: 'Qualified', count: 0, color: '#F59E0B', percentage: 0 },
              { id: 'proposal', name: 'Proposal', count: 0, color: '#8B5CF6', percentage: 0 },
              { id: 'negotiation', name: 'Negotiation', count: 0, color: '#EF4444', percentage: 0 },
              { id: 'won', name: 'Closed Won', count: 0, color: '#059669', percentage: 0 },
              { id: 'lost', name: 'Closed Lost', count: 0, color: '#6B7280', percentage: 0 }
            ]
            currentStages = defaultStages
            setProspectStages(defaultStages)
          } else {
            currentStages = realStages
            setProspectStages(realStages)
          }
        }
      }

      // Get real recent emails (increased to show more emails)
      const emailsResponse = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'sample-emails',
          sampleSize: 100 // Increased from 20 to 100 for better email list
        })
      })

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json()
        if (emailsData.success) {
          const gmailEmails = emailsData.result.emails || []
          
          // Convert Gmail emails to dashboard format
          const realEmails = gmailEmails.map((email: any) => {
            // Determine stage from labels
            let stage = 'unknown'
            if (email.labelIds && currentStages.length > 0) {
              const aiLabel = email.labelIds.find((labelId: string) => {
                const matchingStage = currentStages.find(s => s.id === labelId)
                return matchingStage
              })
              if (aiLabel) {
                stage = aiLabel
              }
            }

            // Calculate urgency based on email content and recency
            const daysSinceReceived = (Date.now() - new Date(email.internalDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
            let urgency = 'low'
            if (daysSinceReceived < 1) urgency = 'urgent'
            else if (daysSinceReceived < 3) urgency = 'high'
            else if (daysSinceReceived < 7) urgency = 'medium'

            return {
              id: email.id,
              subject: email.subject || 'No Subject',
              from: email.from || 'Unknown Sender',
              snippet: email.snippet || 'No preview available',
              timestamp: new Date(email.internalDate || Date.now()),
              stage,
              urgency: urgency as any,
              engagementScore: Math.random(), // TODO: Calculate based on thread length, response time, etc.
              needsFollowUp: daysSinceReceived > 3 && !email.labelIds?.includes('SENT')
            }
          })

          setEmails(realEmails)
          
          // Calculate insights from real email data
          const calculateInsights = (emails: any[]) => {
            // Analyze subject lines and their patterns
            const subjectMap = new Map<string, number>()
            emails.forEach(email => {
              const subject = email.subject || 'No Subject'
              // Group similar subjects (first 20 chars)
              const key = subject.substring(0, 20).toLowerCase()
              subjectMap.set(key, (subjectMap.get(key) || 0) + 1)
            })
            
            const topSubjects = Array.from(subjectMap.entries())
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([subject, count]) => ({
                subject: subject,
                responseRate: 0.6 + Math.random() * 0.3 // Simulated response rate
              }))

            // Calculate follow-ups needed
            const followUpCount = realEmails.filter(email => email.needsFollowUp).length
            
            // Generate recommendations based on real data
            const recommendations: Array<{ type: string; message: string }> = []
            if (followUpCount > 0) {
              recommendations.push({
                type: 'follow-up',
                message: `Consider following up on ${followUpCount} emails that haven't received responses.`
              })
            }
            
            if (realEmails.length > 50) {
              recommendations.push({
                type: 'efficiency',
                message: `You have ${realEmails.length} emails. Consider using AI bulk classification to organize them.`
              })
            }

            return {
              topSubjects,
              averageResponseTime: '2.4h', // TODO: Calculate from actual thread data
              sameDayResponseRate: Math.round((realEmails.filter(e => e.urgency === 'urgent').length / realEmails.length) * 100),
              followUpCount,
              recommendations
            }
          }

          setInsights(calculateInsights(realEmails))
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Fallback to empty state rather than mock data
      setStats({ totalEmails: 0, categorized: 0, followUps: 0, responseRate: 0 })
      setProspectStages([])
      setEmails([])
      setInsights({
        topSubjects: [],
        averageResponseTime: '0h',
        sameDayResponseRate: 0,
        followUpCount: 0,
        recommendations: []
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const connectEmailAccount = async (provider: 'gmail' | 'outlook') => {
    if (provider === 'gmail') {
      await connectGmail()
    } else {
      alert(`${provider} integration coming soon!`)
    }
  }

  const processEmails = async () => {
    if (!authTokens || !authTokens.accessToken || !authTokens.refreshToken) {
      console.warn('No Gmail tokens available for processing emails')
      return
    }

    try {
      setIsProcessing(true)
      
      // Run real email bulk analysis
      const analysisResponse = await fetch('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: 50, // Process up to 50 emails
          applyLabels: true, // Apply labels to categorize emails
          skipClassified: true, // Skip already processed emails
          batchSize: 10,
          aiModel: 'auto', // Use auto-fallback for best results
          query: '' // Process all emails
        })
      })

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        if (analysisData.success) {
          console.log('✅ Email processing completed:', analysisData.summary)
          
          // Reload dashboard data to reflect the new analysis
          await loadDashboardData()
          
          // Show success message
          alert(`Email processing completed!\n\nProcessed: ${analysisData.summary.processed}\nClassified: ${analysisData.summary.classified}\nLabels Applied: ${analysisData.summary.labelsApplied}`)
        } else {
          throw new Error(analysisData.error || 'Analysis failed')
        }
      } else {
        throw new Error('Failed to start email analysis')
      }
      
    } catch (error) {
      console.error('Failed to process emails:', error)
      alert('Failed to process emails: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
    }
  }

  const readEmail = async (emailId: string) => {
    if (!authTokens || !emailId) return

    try {
      setIsLoadingEmail(true)
      setSelectedEmail(null)
      setEmailContent('')

      // Fetch full email content
      const response = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'get-email',
          messageId: emailId
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedEmail(data.result.email)
          setEmailContent(data.result.email.body || data.result.email.snippet || 'No content available')
        } else {
          console.error('Failed to fetch email:', data.error)
          alert('Failed to load email content')
        }
      } else {
        throw new Error('Failed to fetch email')
      }
    } catch (error) {
      console.error('Error reading email:', error)
      alert('Error loading email content')
    } finally {
      setIsLoadingEmail(false)
    }
  }

  const refreshLabels = async () => {
    if (!authTokens) return

    try {
      const response = await fetch('/api/email/gmail/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'list-labels'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Trigger a refresh in label manager by updating a timestamp
          setLastRefresh(new Date())
        }
      }
    } catch (error) {
      console.error('Error refreshing labels:', error)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (selectedStage !== 'all' && email.stage !== selectedStage) return false
    if (selectedUrgency !== 'all' && email.urgency !== selectedUrgency) return false
    return true
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Cleanup Co-Pilot
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered email organization and prospect management
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={processEmails}
            disabled={isProcessing || !gmailConnected}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Analyze Emails'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={manualRefresh}
            disabled={isProcessing || !gmailConnected}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button 
            variant={isAutoRefresh ? "default" : "outline"}
            onClick={toggleAutoRefresh}
            disabled={!gmailConnected}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Auto {isAutoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {gmailConnected && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!gmailConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>Connect your email account to start organizing your emails</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => connectEmailAccount('gmail')}
                disabled={isProcessing || isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Gmail'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => connectEmailAccount('outlook')}
                disabled={isProcessing || isConnecting}
              >
                Connect Outlook
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Analyzer</TabsTrigger>
          <TabsTrigger value="labels">Label Manager</TabsTrigger>
          <TabsTrigger value="cleanup">Label Cleanup</TabsTrigger>
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="emails">Email List</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <EmailCleanupDashboard />
        </TabsContent>

        {/* Bulk Email Analyzer Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <BulkEmailAnalyzer />
        </TabsContent>

        {/* Label Manager Tab */}
        <TabsContent value="labels" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Label Management
                  </CardTitle>
                  <CardDescription>
                    Create, edit, and organize your custom email labels
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={refreshLabels}
                  disabled={!gmailConnected}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Labels
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LabelManager key={lastRefresh.getTime()} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Label Cleanup Tab */}
        <TabsContent value="cleanup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Label Cleanup
              </CardTitle>
              <CardDescription>
                Detect and resolve label conflicts, duplicates, and naming issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LabelCleanupInterface />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Prompt Management
              </CardTitle>
              <CardDescription>
                Customize and test AI prompts for email classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email List Tab */}
        <TabsContent value="emails" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Prospect Stage</label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {prospectStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Urgency</label>
                  <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="All urgency levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Emails ({filteredEmails.length})</CardTitle>
                  <CardDescription>
                    {stats.totalEmails} total emails • {emails.filter(e => e.needsFollowUp).length} need follow-up
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={manualRefresh}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEmails([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEmails.map(email => (
                  <div key={email.id} className="border rounded-lg p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{email.subject}</h4>
                          <Badge 
                            variant="secondary" 
                            className={URGENCY_COLORS[email.urgency]}
                          >
                            {email.urgency}
                          </Badge>
                          {email.needsFollowUp && (
                            <Badge variant="outline">Follow-up needed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{email.from}</p>
                        <p className="text-sm">{email.snippet}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {email.timestamp.toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Engagement:</span>
                            <Progress 
                              value={email.engagementScore * 100} 
                              className="w-16 h-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => readEmail(email.id)}
                          disabled={isLoadingEmail}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Email Performance Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your email patterns and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Best performing subjects */}
                <div>
                  <h4 className="font-medium mb-3">Top Email Subject Patterns</h4>
                  <div className="space-y-2">
                    {insights.topSubjects.length > 0 ? insights.topSubjects.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="text-sm">{item.subject}...</span>
                        <Badge variant="default">{Math.round(item.responseRate * 100)}% pattern frequency</Badge>
                      </div>
                    )) : (
                      <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                        No email data available. Connect your Gmail account to see insights.
                      </div>
                    )}
                  </div>
                </div>

                {/* Response time analysis */}
                <div>
                  <h4 className="font-medium mb-3">Email Activity Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl font-bold">{insights.averageResponseTime}</div>
                      <div className="text-sm text-muted-foreground">Average processing time</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl font-bold">{insights.sameDayResponseRate}%</div>
                      <div className="text-sm text-muted-foreground">Urgent emails</div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <h4 className="font-medium mb-3">AI Recommendations</h4>
                  <div className="space-y-3">
                    {insights.recommendations.length > 0 ? insights.recommendations.map((rec, index) => (
                      <Alert key={index}>
                        {rec.type === 'follow-up' ? <Zap className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        <AlertDescription>
                          {rec.message}
                        </AlertDescription>
                      </Alert>
                    )) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Process some emails to get AI-powered recommendations.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                AI-suggested response templates based on email context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Follow-up Template",
                    category: "follow-up",
                    subject: "Following up on my previous email",
                    preview: "Hi [Name], I wanted to follow up on my previous email regarding..."
                  },
                  {
                    name: "Introduction Template",
                    category: "introduction",
                    subject: "Introduction - [Your Company]",
                    preview: "Hi [Name], I hope this email finds you well. I'm reaching out because..."
                  },
                  {
                    name: "Proposal Template",
                    category: "proposal",
                    subject: "Proposal for [Project Name]",
                    preview: "Dear [Name], Thank you for your interest in our services. Please find..."
                  }
                ].map((template, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{template.subject}</p>
                    <p className="text-sm text-muted-foreground mb-3">{template.preview}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Use Template</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Co-Pilot Settings</CardTitle>
              <CardDescription>
                Configure how the AI analyzes and categorizes your emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connected Accounts */}
              <div>
                <h4 className="font-medium mb-3">Connected Email Accounts</h4>
                <div className="space-y-2">
                  {gmailConnected ? (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div className="flex flex-col">
                          <span>{gmailProfile?.emailAddress || 'Gmail Account'}</span>
                          <span className="text-xs text-muted-foreground">
                            {stats.totalEmails} emails • {prospectStages.length} stages
                          </span>
                        </div>
                        <Badge variant="outline">Gmail</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={manualRefresh}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={disconnectGmail}>
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border rounded border-dashed">
                      <p className="text-sm text-muted-foreground mb-2">No email accounts connected</p>
                      <Button size="sm" onClick={() => connectEmailAccount('gmail')}>
                        Connect Gmail
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-refresh Settings */}
              <div>
                <h4 className="font-medium mb-3">Auto-refresh Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">Auto-refresh data</span>
                      <p className="text-xs text-muted-foreground">Automatically refresh every 30 seconds</p>
                    </div>
                    <Button 
                      variant={isAutoRefresh ? "default" : "outline"} 
                      size="sm"
                      onClick={toggleAutoRefresh}
                      disabled={!gmailConnected}
                    >
                      {isAutoRefresh ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last refresh</span>
                    <span className="text-xs text-muted-foreground">
                      {lastRefresh.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h4 className="font-medium mb-3">Data Export</h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const data = {
                          stats,
                          emails: emails.length,
                          insights,
                          labels: prospectStages,
                          exportedAt: new Date().toISOString()
                        }
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `email-copilot-data-${new Date().toISOString().split('T')[0]}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      disabled={!gmailConnected}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Current Data
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const csv = [
                          'Subject,From,Date,Urgency,Stage,NeedsFollowUp',
                          ...emails.map(email => 
                            `"${email.subject}","${email.from}","${email.timestamp.toISOString()}","${email.urgency}","${email.stage}","${email.needsFollowUp}"`
                          )
                        ].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `emails-${new Date().toISOString().split('T')[0]}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      disabled={!gmailConnected || emails.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Email List (CSV)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {emails.length > 0 
                      ? `Ready to export ${emails.length} emails and ${prospectStages.length} labels`
                      : 'No data to export - connect Gmail and load emails first'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Email Reading Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedEmail?.subject || 'Email Content'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmail?.from && `From: ${selectedEmail.from}`}
              {selectedEmail?.date && ` • ${new Date(selectedEmail.date).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingEmail ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading email content...
              </div>
            ) : emailContent ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="whitespace-pre-wrap text-sm">
                  {emailContent}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No content available
              </div>
            )}
            
            {selectedEmail && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Reply
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Add Label
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Reader Dialog */}
      <Dialog open={selectedEmail !== null} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmail?.subject || 'Email'}
            </DialogTitle>
            <DialogDescription>
              From: {selectedEmail?.from} • {selectedEmail?.timestamp ? new Date(selectedEmail.timestamp).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingEmail ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading email content...</span>
              </div>
            ) : selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">Email Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">From:</span> {selectedEmail.from}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {selectedEmail.timestamp ? new Date(selectedEmail.timestamp).toLocaleString() : 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {selectedEmail.to || 'You'}
                    </div>
                    <div>
                      <span className="font-medium">Labels:</span> 
                      <div className="flex gap-1 mt-1">
                        {selectedEmail.labelIds && selectedEmail.labelIds.length > 0 ? 
                          selectedEmail.labelIds.map((labelId: string) => (
                            <Badge key={labelId} variant="outline" className="text-xs">
                              {labelId}
                            </Badge>
                          )) : 
                          <span className="text-muted-foreground">None</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Content</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="whitespace-pre-wrap text-sm" 
                         dangerouslySetInnerHTML={{ __html: emailContent || selectedEmail.snippet || 'No content available' }}>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmailCleanupCoPilot

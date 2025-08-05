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
  Upload
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

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

export function EmailCleanupCoPilot() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isConnected, setIsConnected] = useState(false)
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

  // Gmail Integration State
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailProfile, setGmailProfile] = useState<any>(null)
  const [authTokens, setAuthTokens] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Gmail Integration Functions
  const connectGmail = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/email/gmail/connect')
      const data = await response.json()
      
      if (data.success) {
        // Open OAuth URL in new window
        window.open(data.authUrl, 'gmail-oauth', 'width=600,height=700')
        
        // Listen for the OAuth callback
        const checkForCode = setInterval(() => {
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          
          if (code) {
            clearInterval(checkForCode)
            exchangeCodeForTokens(code)
          }
        }, 1000)
        
        setTimeout(() => clearInterval(checkForCode), 300000) // 5 min timeout
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect to Gmail. Please try again.')
    } finally {
      setIsConnecting(false)
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

  const analyzeGmailEmails = async (count = 10) => {
    if (!authTokens) {
      alert('Please connect Gmail first')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/email/gmail/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          count
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalysisResults(data)
        setStats(prev => ({
          ...prev,
          totalEmails: data.summary.totalEmails,
          categorizedEmails: data.summary.categorized,
          followUpOpportunities: data.summary.insights.prospectCount,
          averageResponseTime: Math.floor(Math.random() * 24) // Mock response time
        }))
        
        // Update emails list with analyzed results
        const emailItems = data.results.map((email: any) => ({
          id: email.id,
          subject: email.subject,
          sender: email.from,
          timestamp: new Date(email.timestamp),
          prospectStage: email.analysis?.prospectStage || 'unknown',
          confidence: email.analysis?.confidence || 0,
          priority: email.analysis?.priority || 'medium',
          snippet: email.snippet,
          category: email.analysis?.category || 'uncategorized',
          sentiment: email.analysis?.sentiment || 0,
          followUpSuggestion: email.analysis?.suggestedActions?.join(', ') || '',
          urgencyLevel: email.analysis?.priority === 'high' ? 'urgent' : 'medium'
        }))
        
        setEmails(emailItems)
        alert(`Successfully analyzed ${data.summary.totalEmails} emails!`)
      } else {
        alert('Failed to analyze emails: ' + data.error)
      }
    } catch (error) {
      console.error('Error analyzing emails:', error)
      alert('Failed to analyze emails. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual implementation
      const mockStats = {
        totalEmails: 1247,
        categorized: 892,
        followUps: 34,
        responseRate: 0.67
      }
      
      const mockStages = [
        { id: 'cold', name: 'Cold Outreach', count: 245, color: '#3B82F6', percentage: 27 },
        { id: 'interested', name: 'Interested', count: 186, color: '#10B981', percentage: 21 },
        { id: 'qualified', name: 'Qualified', count: 124, color: '#F59E0B', percentage: 14 },
        { id: 'proposal', name: 'Proposal', count: 98, color: '#8B5CF6', percentage: 11 },
        { id: 'negotiation', name: 'Negotiation', count: 67, color: '#EF4444', percentage: 8 },
        { id: 'won', name: 'Closed Won', count: 89, color: '#059669', percentage: 10 },
        { id: 'lost', name: 'Closed Lost', count: 83, color: '#6B7280', percentage: 9 }
      ]

      const mockEmails = Array.from({ length: 20 }, (_, i) => ({
        id: `email-${i}`,
        subject: `Re: Proposal discussion ${i + 1}`,
        from: `prospect${i + 1}@company.com`,
        snippet: 'Thank you for the detailed proposal. We need to discuss some points with our team...',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        stage: mockStages[Math.floor(Math.random() * mockStages.length)].id,
        urgency: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
        engagementScore: Math.random(),
        needsFollowUp: Math.random() > 0.7
      }))

      setStats(mockStats)
      setProspectStages(mockStages)
      setEmails(mockEmails)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const connectEmailAccount = async (provider: 'gmail' | 'outlook') => {
    try {
      setIsProcessing(true)
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsConnected(true)
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to connect email account:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const processEmails = async () => {
    try {
      setIsProcessing(true)
      // Simulate email processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to process emails:', error)
    } finally {
      setIsProcessing(false)
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
            disabled={isProcessing || !isConnected}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Analyze Emails'}
          </Button>
          
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>Connect your email account to start organizing your emails</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => connectEmailAccount('gmail')}
                disabled={isProcessing}
              >
                Connect Gmail
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => connectEmailAccount('outlook')}
                disabled={isProcessing}
              >
                Connect Outlook
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="gmail">Gmail Test</TabsTrigger>
          <TabsTrigger value="emails">Email List</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmails.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorized</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.categorized.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.categorized / stats.totalEmails) * 100)}% organized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.followUps}</div>
                <p className="text-xs text-muted-foreground">Opportunities identified</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.responseRate * 100)}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Prospect Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Prospect Stage Distribution
              </CardTitle>
              <CardDescription>
                Current distribution of emails across prospect stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prospectStages.map(stage => (
                  <div key={stage.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={stage.percentage} 
                        className="w-20 h-2"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emails.slice(0, 5).map(email => (
                  <div key={email.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="font-medium truncate">{email.subject}</p>
                      <p className="text-sm text-muted-foreground">{email.from}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={URGENCY_COLORS[email.urgency]}
                      >
                        {email.urgency}
                      </Badge>
                      {email.needsFollowUp && (
                        <Badge variant="outline">Follow-up</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gmail Integration Tab */}
        <TabsContent value="gmail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Real Gmail Integration Test
              </CardTitle>
              <CardDescription>
                Connect your Gmail account and test AI classification on real unread emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${gmailConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <div className="font-medium">
                      {gmailConnected ? 'Gmail Connected' : 'Gmail Not Connected'}
                    </div>
                    {gmailProfile && (
                      <div className="text-sm text-muted-foreground">
                        {gmailProfile.emailAddress} • {gmailProfile.messagesTotal} total messages
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={connectGmail} 
                  disabled={isConnecting || gmailConnected}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : gmailConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Connect Gmail
                    </>
                  )}
                </Button>
              </div>

              {/* Analysis Controls */}
              {gmailConnected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analyze Unread Emails</CardTitle>
                      <CardDescription>
                        Test AI classification on your real unread emails
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          onClick={() => analyzeGmailEmails(5)}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          5 Emails
                        </Button>
                        <Button 
                          onClick={() => analyzeGmailEmails(10)}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          10 Emails
                        </Button>
                        <Button 
                          onClick={() => analyzeGmailEmails(20)}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          20 Emails
                        </Button>
                      </div>
                      
                      <Button 
                        onClick={() => analyzeGmailEmails(10)}
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing Emails...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Start AI Analysis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Analysis Results */}
                  {analysisResults && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Analysis Results</CardTitle>
                        <CardDescription>
                          AI classification results from your Gmail
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Total Analyzed</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {analysisResults.summary.totalEmails}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Prospects Found</div>
                            <div className="text-2xl font-bold text-green-600">
                              {analysisResults.summary.insights.prospectCount}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">High Priority</div>
                            <div className="text-2xl font-bold text-red-600">
                              {analysisResults.summary.insights.highPriorityCount}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Action Required</div>
                            <div className="text-2xl font-bold text-orange-600">
                              {analysisResults.summary.insights.actionRequiredCount}
                            </div>
                          </div>
                        </div>
                        
                        {/* Category Breakdown */}
                        <div>
                          <div className="font-medium mb-2">Categories Found:</div>
                          <div className="space-y-1">
                            {Object.entries(analysisResults.summary.categoryBreakdown || {}).map(([category, count]) => (
                              <div key={category} className="flex justify-between text-sm">
                                <span className="capitalize">{category.replace('-', ' ')}</span>
                                <span className="font-medium">{String(count)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Setup Instructions */}
              {!gmailConnected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Setup Instructions</CardTitle>
                    <CardDescription>
                      To test with real Gmail emails, you need to configure API access
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs">1</div>
                        <div>
                          <div className="font-medium">Create Google Cloud Project</div>
                          <div className="text-muted-foreground">Enable Gmail API in Google Cloud Console</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs">2</div>
                        <div>
                          <div className="font-medium">Configure OAuth2 Credentials</div>
                          <div className="text-muted-foreground">Set up OAuth2 client ID and secret</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs">3</div>
                        <div>
                          <div className="font-medium">Set Environment Variables</div>
                          <div className="text-muted-foreground">Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs">4</div>
                        <div>
                          <div className="font-medium">Test Connection</div>
                          <div className="text-muted-foreground">Click "Connect Gmail" to authorize access</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <div className="font-medium">Demo Mode</div>
                      </div>
                      <div className="text-sm text-yellow-700">
                        This component includes mock data for demonstration. Configure real API access to test with your Gmail account.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
              <CardTitle>Emails ({filteredEmails.length})</CardTitle>
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
                        <Button variant="ghost" size="sm">
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
                  <h4 className="font-medium mb-3">Top Performing Subject Lines</h4>
                  <div className="space-y-2">
                    {[
                      { subject: "Quick question about your needs", rate: 0.84 },
                      { subject: "Following up on our conversation", rate: 0.72 },
                      { subject: "Proposal for your review", rate: 0.68 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="text-sm">{item.subject}</span>
                        <Badge variant="default">{Math.round(item.rate * 100)}% response rate</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response time analysis */}
                <div>
                  <h4 className="font-medium mb-3">Response Time Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl font-bold">2.4h</div>
                      <div className="text-sm text-muted-foreground">Average response time</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl font-bold">73%</div>
                      <div className="text-sm text-muted-foreground">Same-day responses</div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <h4 className="font-medium mb-3">AI Recommendations</h4>
                  <div className="space-y-3">
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Consider following up on 12 emails that haven't received responses in over 3 days.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        Your response rate increases by 23% when you respond within 2 hours.
                      </AlertDescription>
                    </Alert>
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
                  {isConnected ? (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>user@company.com</span>
                        <Badge variant="outline">Gmail</Badge>
                      </div>
                      <Button variant="outline" size="sm">Disconnect</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No email accounts connected</p>
                  )}
                </div>
              </div>

              {/* Processing Settings */}
              <div>
                <h4 className="font-medium mb-3">Processing Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-categorize new emails</span>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send follow-up reminders</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h4 className="font-medium mb-3">Data Export</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Insights
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EmailCleanupCoPilot

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Brain,
  Edit,
  Save,
  Copy,
  RefreshCw,
  Eye,
  TestTube,
  Settings,
  Plus,
  Trash2,
  ArrowRight,
  Code,
  Lightbulb,
  Target,
  Zap,
  BarChart,
  Download,
  Upload,
  PlayCircle,
  StopCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface AIPrompt {
  id: string
  name: string
  description: string
  prompt: string
  categories: string[]
  accuracy: number
  usageCount: number
  lastUsed: string
  isActive: boolean
  isDefault: boolean
  createdBy: string
  version: string
}

interface LabelMapping {
  id: string
  aiCategory: string
  gmailLabel: string
  color: string
  confidence: number
  description: string
  isActive: boolean
  emailCount: number
}

interface TestResult {
  id: string
  promptId: string
  testEmails: number
  accuracy: number
  categoriesFound: string[]
  confusionMatrix: Record<string, Record<string, number>>
  timestamp: string
  duration: number
}

const DEFAULT_CATEGORIES = [
  'Personal',
  'Work', 
  'Spam/Promotions',
  'Social',
  'Notifications/Updates',
  'Finance',
  'Job Opportunities', 
  'Important/Follow Up',
  'Other'
]

const SAMPLE_EMAILS = [
  {
    subject: "Quarterly Sales Report Review",
    body: "Hi team, please review the attached Q4 sales report before our meeting tomorrow at 2 PM.",
    from: "manager@company.com",
    expectedCategory: "Work"
  },
  {
    subject: "Your credit card statement is ready",
    body: "Your January statement is now available. Login to view your transactions and balance.",
    from: "statements@bank.com", 
    expectedCategory: "Finance"
  },
  {
    subject: "Limited time offer - 50% off everything!",
    body: "Don't miss out on our biggest sale of the year. Shop now and save big!",
    from: "deals@retailer.com",
    expectedCategory: "Spam/Promotions"
  }
]

export function PromptGenerator() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [mappings, setMappings] = useState<LabelMapping[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('prompts')
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  
  // Form states
  const [promptForm, setPromptForm] = useState({
    name: '',
    description: '',
    prompt: '',
    categories: DEFAULT_CATEGORIES
  })
  
  const [mappingForm, setMappingForm] = useState({
    aiCategory: '',
    gmailLabel: '',
    color: '#3B82F6',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadPrompts(),
        loadMappings(),
        loadTestResults()
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompts = async () => {
    // Mock data - replace with actual API call
    const mockPrompts: AIPrompt[] = [
      {
        id: 'default-prompt',
        name: 'Default Email Classifier',
        description: 'Standard prompt for general email classification',
        prompt: `You are an expert AI email analyst. Analyze the following email and classify it into exactly one of these categories:

1. Personal - Personal communications from friends and family
2. Work - Business emails related to work projects and professional matters
3. Spam/Promotions - Marketing emails, advertisements, and promotional content
4. Social - Social media notifications and community communications
5. Notifications/Updates - System notifications and service updates
6. Finance - Banking, payment, and financial communications
7. Job Opportunities - Career and employment related emails
8. Important/Follow Up - High priority items requiring immediate attention
9. Other - Emails that don't fit into other categories

Respond with JSON only: {"category": "chosen_category", "confidence": 0.85, "reasoning": "explanation"}`,
        categories: DEFAULT_CATEGORIES,
        accuracy: 92.5,
        usageCount: 1247,
        lastUsed: '2024-01-20T15:30:00Z',
        isActive: true,
        isDefault: true,
        createdBy: 'System',
        version: '1.0'
      },
      {
        id: 'sales-prompt',
        name: 'Sales-Focused Classifier',
        description: 'Optimized for sales and business development emails',
        prompt: `You are a sales-focused AI email analyst. Your primary goal is to identify sales opportunities and classify emails for business development.

Analyze this email and classify it into one of these sales-oriented categories:

1. Cold Outreach - Initial contact from potential prospects
2. Interested Prospect - Prospects showing interest or engagement
3. Qualified Lead - Prospects ready for sales conversation
4. Proposal Stage - Prospects reviewing proposals or quotes
5. Negotiation - Active deal discussions and contract negotiations
6. Closed Won - Successful deals and new customers
7. Closed Lost - Lost opportunities and rejections
8. Existing Client - Communications from current customers
9. Partner/Vendor - Business partner and vendor communications

Focus on identifying buying signals, engagement level, and sales stage progression.

Respond with JSON only: {"category": "chosen_category", "confidence": 0.85, "prospect_score": 0.75, "reasoning": "explanation"}`,
        categories: ['Cold Outreach', 'Interested Prospect', 'Qualified Lead', 'Proposal Stage', 'Negotiation', 'Closed Won', 'Closed Lost', 'Existing Client', 'Partner/Vendor'],
        accuracy: 89.3,
        usageCount: 543,
        lastUsed: '2024-01-19T14:20:00Z',
        isActive: false,
        isDefault: false,
        createdBy: 'sales@company.com',
        version: '2.1'
      }
    ]
    setPrompts(mockPrompts)
  }

  const loadMappings = async () => {
    // Mock data - replace with actual API call
    const mockMappings: LabelMapping[] = [
      {
        id: 'map-1',
        aiCategory: 'Work',
        gmailLabel: 'AI/Work',
        color: '#3B82F6',
        confidence: 0.92,
        description: 'Business and professional emails',
        isActive: true,
        emailCount: 234
      },
      {
        id: 'map-2', 
        aiCategory: 'Important/Follow Up',
        gmailLabel: 'AI/Important',
        color: '#EF4444',
        confidence: 0.87,
        description: 'High priority emails requiring attention',
        isActive: true,
        emailCount: 67
      },
      {
        id: 'map-3',
        aiCategory: 'Spam/Promotions', 
        gmailLabel: 'AI/Spam-Promotions',
        color: '#6B7280',
        confidence: 0.95,
        description: 'Marketing and promotional content',
        isActive: true,
        emailCount: 456
      }
    ]
    setMappings(mockMappings)
  }

  const loadTestResults = async () => {
    // Mock data - replace with actual API call
    const mockResults: TestResult[] = [
      {
        id: 'test-1',
        promptId: 'default-prompt',
        testEmails: 100,
        accuracy: 92.5,
        categoriesFound: ['Work', 'Personal', 'Spam/Promotions', 'Finance'],
        confusionMatrix: {
          'Work': { 'Work': 23, 'Personal': 1, 'Other': 1 },
          'Personal': { 'Personal': 18, 'Work': 2 },
          'Spam/Promotions': { 'Spam/Promotions': 30, 'Other': 1 }
        },
        timestamp: '2024-01-20T10:00:00Z',
        duration: 45000
      }
    ]
    setTestResults(mockResults)
  }

  const handleCreatePrompt = async () => {
    try {
      if (!promptForm.name || !promptForm.prompt) {
        toast.error('Please fill in required fields')
        return
      }

      const newPrompt: AIPrompt = {
        id: `prompt-${Date.now()}`,
        name: promptForm.name,
        description: promptForm.description,
        prompt: promptForm.prompt,
        categories: promptForm.categories,
        accuracy: 0,
        usageCount: 0,
        lastUsed: '',
        isActive: false,
        isDefault: false,
        createdBy: 'user@company.com',
        version: '1.0'
      }

      setPrompts(prev => [...prev, newPrompt])
      
      // Reset form
      setPromptForm({
        name: '',
        description: '',
        prompt: '',
        categories: DEFAULT_CATEGORIES
      })
      
      toast.success('Prompt created successfully')
    } catch (error) {
      console.error('Failed to create prompt:', error)
      toast.error('Failed to create prompt')
    }
  }

  const handleUpdatePrompt = async () => {
    try {
      if (!selectedPrompt) return

      const updatedPrompt = {
        ...selectedPrompt,
        name: promptForm.name,
        description: promptForm.description,
        prompt: promptForm.prompt,
        categories: promptForm.categories,
        version: `${parseFloat(selectedPrompt.version) + 0.1}`
      }

      setPrompts(prev => prev.map(p => 
        p.id === selectedPrompt.id ? updatedPrompt : p
      ))
      
      setIsEditDialogOpen(false)
      setSelectedPrompt(null)
      
      toast.success('Prompt updated successfully')
    } catch (error) {
      console.error('Failed to update prompt:', error)
      toast.error('Failed to update prompt')
    }
  }

  const handleCreateMapping = async () => {
    try {
      if (!mappingForm.aiCategory || !mappingForm.gmailLabel) {
        toast.error('Please fill in required fields')
        return
      }

      const newMapping: LabelMapping = {
        id: `mapping-${Date.now()}`,
        aiCategory: mappingForm.aiCategory,
        gmailLabel: mappingForm.gmailLabel,
        color: mappingForm.color,
        confidence: 0,
        description: mappingForm.description,
        isActive: true,
        emailCount: 0
      }

      setMappings(prev => [...prev, newMapping])
      
      // Reset form
      setMappingForm({
        aiCategory: '',
        gmailLabel: '',
        color: '#3B82F6',
        description: ''
      })
      
      toast.success('Mapping created successfully')
    } catch (error) {
      console.error('Failed to create mapping:', error)
      toast.error('Failed to create mapping')
    }
  }

  const handleTestPrompt = async (promptId: string) => {
    try {
      setTesting(true)
      setTestProgress(0)
      
      toast.info('Testing prompt with sample emails...')
      
      // Simulate testing progress
      for (let i = 0; i <= 100; i += 10) {
        setTestProgress(i)
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Mock test result
      const testResult: TestResult = {
        id: `test-${Date.now()}`,
        promptId,
        testEmails: SAMPLE_EMAILS.length,
        accuracy: 88 + Math.random() * 10, // Random accuracy between 88-98%
        categoriesFound: ['Work', 'Finance', 'Spam/Promotions'],
        confusionMatrix: {
          'Work': { 'Work': 1, 'Personal': 0 },
          'Finance': { 'Finance': 1, 'Other': 0 },
          'Spam/Promotions': { 'Spam/Promotions': 1, 'Other': 0 }
        },
        timestamp: new Date().toISOString(),
        duration: 3000
      }
      
      setTestResults(prev => [...prev, testResult])
      
      toast.success(`Test completed! Accuracy: ${testResult.accuracy.toFixed(1)}%`)
    } catch (error) {
      console.error('Failed to test prompt:', error)
      toast.error('Failed to test prompt')
    } finally {
      setTesting(false)
      setTestProgress(0)
    }
  }

  const openEditDialog = (prompt: AIPrompt) => {
    setSelectedPrompt(prompt)
    setPromptForm({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      categories: prompt.categories
    })
    setIsEditDialogOpen(true)
  }

  const activatePrompt = async (promptId: string) => {
    try {
      // Deactivate all other prompts
      setPrompts(prev => prev.map(p => ({
        ...p,
        isActive: p.id === promptId
      })))
      
      toast.success('Prompt activated successfully')
    } catch (error) {
      console.error('Failed to activate prompt:', error)
      toast.error('Failed to activate prompt')
    }
  }

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
          <h2 className="text-2xl font-bold">AI Prompt Generator</h2>
          <p className="text-muted-foreground">
            Create and manage AI classification prompts and label mappings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="mappings">Label Mappings</TabsTrigger>
          <TabsTrigger value="testing">Testing & Results</TabsTrigger>
        </TabsList>

        {/* AI Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prompt List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Prompts</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Prompt
                </Button>
              </div>
              
              {prompts.map((prompt) => (
                <Card key={prompt.id} className={prompt.isActive ? 'ring-2 ring-blue-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{prompt.name}</h4>
                          {prompt.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                          {prompt.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {prompt.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>v{prompt.version}</span>
                          <span>{prompt.accuracy}% accuracy</span>
                          <span>{prompt.usageCount} uses</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={prompt.isActive ? 'outline' : 'default'}
                          onClick={() => prompt.isActive ? {} : activatePrompt(prompt.id)}
                          disabled={prompt.isActive}
                        >
                          {prompt.isActive ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Active
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(prompt)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestPrompt(prompt.id)}
                          disabled={testing}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Create Prompt Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Create New Prompt</CardTitle>
                  <CardDescription>
                    Design a custom AI prompt for email classification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt-name">Name</Label>
                    <Input
                      id="prompt-name"
                      placeholder="e.g., Sales Classifier"
                      value={promptForm.name}
                      onChange={(e) => setPromptForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt-description">Description</Label>
                    <Input
                      id="prompt-description"
                      placeholder="Brief description"
                      value={promptForm.description}
                      onChange={(e) => setPromptForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt-text">Prompt Text</Label>
                    <Textarea
                      id="prompt-text"
                      placeholder="Enter your AI prompt..."
                      rows={8}
                      value={promptForm.prompt}
                      onChange={(e) => setPromptForm(prev => ({ ...prev, prompt: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Categories</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {DEFAULT_CATEGORIES.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={promptForm.categories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPromptForm(prev => ({
                                  ...prev,
                                  categories: [...prev.categories, category]
                                }))
                              } else {
                                setPromptForm(prev => ({
                                  ...prev,
                                  categories: prev.categories.filter(c => c !== category)
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={category} className="text-sm">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleCreatePrompt} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Create Prompt
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Label Mappings Tab */}
        <TabsContent value="mappings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mappings List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Label Mappings</h3>
              
              {mappings.map((mapping) => (
                <Card key={mapping.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: mapping.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{mapping.aiCategory}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{mapping.gmailLabel}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {mapping.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{mapping.confidence * 100}% confidence</span>
                            <span>{mapping.emailCount} emails</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Create Mapping Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Create Mapping</CardTitle>
                  <CardDescription>
                    Map AI categories to Gmail labels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-category">AI Category</Label>
                    <Select value={mappingForm.aiCategory} onValueChange={(value) => setMappingForm(prev => ({ ...prev, aiCategory: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="gmail-label">Gmail Label</Label>
                    <Input
                      id="gmail-label"
                      placeholder="e.g., AI/Work"
                      value={mappingForm.gmailLabel}
                      onChange={(e) => setMappingForm(prev => ({ ...prev, gmailLabel: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mapping-description">Description</Label>
                    <Textarea
                      id="mapping-description"
                      placeholder="Optional description"
                      value={mappingForm.description}
                      onChange={(e) => setMappingForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={handleCreateMapping} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Mapping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          {testing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Testing prompt...</span>
                      <span className="text-sm text-muted-foreground">{testProgress}%</span>
                    </div>
                    <Progress value={testProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              
              {testResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">
                          {prompts.find(p => p.id === result.promptId)?.name || 'Unknown Prompt'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {result.accuracy.toFixed(1)}% accuracy
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Test Emails:</span>
                        <span className="ml-2 font-medium">{result.testEmails}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{result.duration}ms</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-sm text-muted-foreground">Categories Found:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.categoriesFound.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {testResults.length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No test results yet</p>
                </div>
              )}
            </div>
            
            {/* Sample Emails */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sample Test Emails</h3>
              
              {SAMPLE_EMAILS.map((email, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{email.subject}</h4>
                        <Badge variant="outline" className="text-xs">
                          {email.expectedCategory}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From: {email.from}
                      </p>
                      <p className="text-sm">{email.body}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Test Emails
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Modify the prompt settings and content
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={promptForm.name}
                  onChange={(e) => setPromptForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={promptForm.description}
                  onChange={(e) => setPromptForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-prompt">Prompt Text</Label>
              <Textarea
                id="edit-prompt"
                rows={12}
                value={promptForm.prompt}
                onChange={(e) => setPromptForm(prev => ({ ...prev, prompt: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrompt}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

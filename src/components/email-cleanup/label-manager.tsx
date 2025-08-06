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
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  Palette, 
  Settings, 
  Save, 
  X, 
  Search,
  Filter,
  MoreVertical,
  Merge,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomLabel {
  id: string
  name: string
  displayName: string
  color: string
  category: string
  description?: string
  emailCount: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  lastUsed?: string
}

interface LabelCategory {
  id: string
  name: string
  description: string
  color: string
  labels: CustomLabel[]
}

const LABEL_COLORS = [
  { name: 'Blue', value: '#3B82F6', hex: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', hex: 'bg-green-500' },
  { name: 'Orange', value: '#F59E0B', hex: 'bg-orange-500' },
  { name: 'Purple', value: '#8B5CF6', hex: 'bg-purple-500' },
  { name: 'Red', value: '#EF4444', hex: 'bg-red-500' },
  { name: 'Pink', value: '#EC4899', hex: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366F1', hex: 'bg-indigo-500' },
  { name: 'Yellow', value: '#EAB308', hex: 'bg-yellow-500' },
  { name: 'Teal', value: '#14B8A6', hex: 'bg-teal-500' },
  { name: 'Gray', value: '#6B7280', hex: 'bg-gray-500' },
]

export function LabelManager() {
  const [labels, setLabels] = useState<CustomLabel[]>([])
  const [categories, setCategories] = useState<LabelCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<CustomLabel | null>(null)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    color: LABEL_COLORS[0].value,
    category: 'custom',
    description: ''
  })

  useEffect(() => {
    loadLabels()
    loadCategories()
  }, [])

  const loadLabels = async () => {
    try {
      setLoading(true)
      
      // Get OAuth tokens from localStorage or session
      let authTokens = null
      try {
        const savedTokens = localStorage.getItem('gmail-tokens')
        if (savedTokens) {
          authTokens = JSON.parse(savedTokens)
        }
      } catch (e) {
        console.warn('No saved tokens found')
      }

      if (!authTokens) {
        // No auth tokens, show empty state
        setLabels([])
        return
      }

      // Fetch real Gmail labels
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
          const gmailLabels = data.result.labels || []
          
          // Convert Gmail labels to our CustomLabel format
          const convertedLabels: CustomLabel[] = gmailLabels.map((label: any) => {
            // Determine category
            let category = 'system'
            if (label.name.startsWith('AI/')) category = 'ai'
            else if (label.name.startsWith('Custom/')) category = 'custom'
            else if (label.type === 'user') category = 'user'

            // Get display name
            const displayName = label.name.includes('/') ? 
              label.name.split('/').pop() : label.name

            return {
              id: label.id,
              name: label.name,
              displayName: displayName || label.name,
              color: label.color || '#6B7280',
              category,
              description: `Gmail label: ${label.name}`,
              emailCount: label.messagesTotal || 0,
              isActive: true,
              isSystem: label.type === 'system',
              createdAt: new Date().toISOString(),
              lastUsed: new Date().toISOString()
            }
          })

          setLabels(convertedLabels)
        } else {
          console.error('Failed to fetch labels:', data.error)
          setLabels([])
        }
      } else {
        console.error('Failed to fetch labels:', response.status)
        setLabels([])
      }
      
    } catch (error) {
      console.error('Failed to load labels:', error)
      toast.error('Failed to load labels')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Categories based on real Gmail label patterns
      const realCategories: LabelCategory[] = [
        {
          id: 'system',
          name: 'System Labels',
          description: 'Built-in Gmail system labels',
          color: '#6B7280',
          labels: []
        },
        {
          id: 'ai',
          name: 'AI Generated',
          description: 'AI-generated classification labels',
          color: '#3B82F6',
          labels: []
        },
        {
          id: 'custom',
          name: 'Custom Labels',
          description: 'User-defined custom labels',
          color: '#8B5CF6',
          labels: []
        },
        {
          id: 'user',
          name: 'User Labels',
          description: 'User-created Gmail labels',
          color: '#10B981',
          labels: []
        }
      ]
      setCategories(realCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleCreateLabel = async () => {
    try {
      if (!formData.name || !formData.displayName) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate label name format
      const labelName = `Custom/${formData.name.replace(/\s+/g, '-')}`
      
      const newLabel: CustomLabel = {
        id: `custom-${Date.now()}`,
        name: labelName,
        displayName: formData.displayName,
        color: formData.color,
        category: formData.category || 'custom',
        description: formData.description,
        emailCount: 0,
        isActive: true,
        isSystem: false,
        createdAt: new Date().toISOString()
      }

      // TODO: Replace with actual API call
      setLabels(prev => [...prev, newLabel])
      
      // Reset form and close dialog
      setFormData({
        name: '',
        displayName: '',
        color: LABEL_COLORS[0].value,
        category: 'custom',
        description: ''
      })
      setIsCreateDialogOpen(false)
      
      toast.success(`Label "${formData.displayName}" created successfully`)
    } catch (error) {
      console.error('Failed to create label:', error)
      toast.error('Failed to create label')
    }
  }

  const handleEditLabel = async () => {
    try {
      if (!selectedLabel || !formData.displayName) {
        toast.error('Please fill in all required fields')
        return
      }

      const updatedLabel = {
        ...selectedLabel,
        displayName: formData.displayName,
        color: formData.color,
        description: formData.description
      }

      // TODO: Replace with actual API call
      setLabels(prev => prev.map(label => 
        label.id === selectedLabel.id ? updatedLabel : label
      ))
      
      setIsEditDialogOpen(false)
      setSelectedLabel(null)
      
      toast.success(`Label "${formData.displayName}" updated successfully`)
    } catch (error) {
      console.error('Failed to update label:', error)
      toast.error('Failed to update label')
    }
  }

  const handleDeleteLabel = async (labelId: string) => {
    try {
      const label = labels.find(l => l.id === labelId)
      if (!label) return

      if (label.isSystem) {
        toast.error('Cannot delete system labels')
        return
      }

      if (label.emailCount > 0) {
        const confirmed = window.confirm(
          `This label is applied to ${label.emailCount} emails. Are you sure you want to delete it?`
        )
        if (!confirmed) return
      }

      // TODO: Replace with actual API call
      setLabels(prev => prev.filter(l => l.id !== labelId))
      
      toast.success(`Label "${label.displayName}" deleted successfully`)
    } catch (error) {
      console.error('Failed to delete label:', error)
      toast.error('Failed to delete label')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const labelsToDelete = labels.filter(l => 
        selectedLabels.includes(l.id) && !l.isSystem
      )
      
      if (labelsToDelete.length === 0) {
        toast.error('No deletable labels selected')
        return
      }

      const totalEmails = labelsToDelete.reduce((sum, label) => sum + label.emailCount, 0)
      if (totalEmails > 0) {
        const confirmed = window.confirm(
          `This will delete ${labelsToDelete.length} labels affecting ${totalEmails} emails. Continue?`
        )
        if (!confirmed) return
      }

      // TODO: Replace with actual API call
      setLabels(prev => prev.filter(l => !selectedLabels.includes(l.id)))
      setSelectedLabels([])
      setIsBulkMode(false)
      
      toast.success(`${labelsToDelete.length} labels deleted successfully`)
    } catch (error) {
      console.error('Failed to delete labels:', error)
      toast.error('Failed to delete labels')
    }
  }

  const openEditDialog = (label: CustomLabel) => {
    setSelectedLabel(label)
    setFormData({
      name: label.name.split('/')[1] || '',
      displayName: label.displayName,
      color: label.color,
      category: label.category,
      description: label.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const filteredLabels = labels.filter(label => {
    const matchesSearch = label.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (label.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesCategory = selectedCategory === 'all' || label.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const totalEmails = labels.reduce((sum, label) => sum + label.emailCount, 0)
  const activeLabels = labels.filter(l => l.isActive).length

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
          <h2 className="text-2xl font-bold">Label Manager</h2>
          <p className="text-muted-foreground">
            Manage your email labels and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkMode(!isBulkMode)}
          >
            {isBulkMode ? <X className="h-4 w-4 mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
            {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Label
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Label</DialogTitle>
                <DialogDescription>
                  Create a custom label for organizing your emails
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Label Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., VIP-Clients"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be created as: Custom/{formData.name.replace(/\s+/g, '-')}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., VIP Clients"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABEL_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.hex}`} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for this label"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLabel}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Label
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Labels</p>
                <p className="text-2xl font-bold">{labels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Labels</p>
                <p className="text-2xl font-bold">{activeLabels}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Info className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Custom Labels</p>
                <p className="text-2xl font-bold">{labels.filter(l => !l.isSystem).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                <p className="text-2xl font-bold">{totalEmails.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isBulkMode && selectedLabels.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedLabels.length})
          </Button>
        )}
      </div>

      {/* Labels List */}
      <div className="grid gap-4">
        {filteredLabels.map((label) => (
          <Card key={label.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isBulkMode && (
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(label.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLabels(prev => [...prev, label.id])
                        } else {
                          setSelectedLabels(prev => prev.filter(id => id !== label.id))
                        }
                      }}
                      disabled={label.isSystem}
                      className="h-4 w-4"
                    />
                  )}
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: label.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{label.displayName}</h3>
                      {label.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                      {!label.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{label.name}</p>
                    {label.description && (
                      <p className="text-xs text-muted-foreground mt-1">{label.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{label.emailCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">emails</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!label.isSystem && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(label)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLabel(label.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLabels.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No labels found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first custom label to get started'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Label
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
            <DialogDescription>
              Update label properties and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-displayName">Display Name *</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.hex}`} />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLabel}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

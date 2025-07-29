"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageCircle, 
  Send, 
  Smartphone, 
  Settings, 
  Bell, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react"

interface IntegrationSettingsProps {
  userId: string
}

interface IntegrationConfig {
  id: string
  type: 'TELEGRAM' | 'WHATSAPP'
  config: string
  isActive: boolean
  createdAt: Date
}

export function IntegrationSettings({ userId }: IntegrationSettingsProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    taskDueSoon: true,
    projectInvite: true
  })

  // Mock integrations for demo
  const mockIntegrations: IntegrationConfig[] = [
    {
      id: "1",
      type: "TELEGRAM",
      config: JSON.stringify({ chatId: "123456789", botName: "AsanaProBot" }),
      isActive: true,
      createdAt: new Date()
    },
    {
      id: "2",
      type: "WHATSAPP",
      config: JSON.stringify({ phoneNumber: "+1234567890" }),
      isActive: true,
      createdAt: new Date()
    }
  ]

  const handleAddTelegram = async () => {
    if (!telegramChatId.trim()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newIntegration: IntegrationConfig = {
        id: Date.now().toString(),
        type: "TELEGRAM",
        config: JSON.stringify({ chatId: telegramChatId, botName: "AsanaProBot" }),
        isActive: true,
        createdAt: new Date()
      }

      setIntegrations(prev => [...prev, newIntegration])
      setTelegramChatId("")
    } catch (error) {
      console.error('Error adding Telegram integration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWhatsApp = async () => {
    if (!whatsappNumber.trim()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newIntegration: IntegrationConfig = {
        id: Date.now().toString(),
        type: "WHATSAPP",
        config: JSON.stringify({ phoneNumber: whatsappNumber }),
        isActive: true,
        createdAt: new Date()
      }

      setIntegrations(prev => [...prev, newIntegration])
      setWhatsappNumber("")
    } catch (error) {
      console.error('Error adding WhatsApp integration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleIntegration = async (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, isActive: !integration.isActive }
          : integration
      )
    )
  }

  const handleDeleteIntegration = async (id: string) => {
    setIntegrations(prev => prev.filter(integration => integration.id !== id))
  }

  const handleTestNotification = async (type: 'TELEGRAM' | 'WHATSAPP') => {
    setIsLoading(true)
    try {
      // Simulate sending test notification
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(`Test notification sent to ${type}!`)
    } catch (error) {
      console.error('Error sending test notification:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIntegrationConfig = (config: string) => {
    try {
      return JSON.parse(config)
    } catch {
      return {}
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">
            Connect your favorite messaging apps for real-time updates
          </p>
        </div>
      </div>

      <Tabs defaultValue="telegram" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="telegram" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Telegram Integration
              </CardTitle>
              <CardDescription>
                Connect Telegram to receive task notifications and manage tasks via bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">Telegram Chat ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram-chat"
                    placeholder="Enter your Telegram chat ID"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                  />
                  <Button 
                    onClick={handleAddTelegram}
                    disabled={isLoading || !telegramChatId.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your chat ID by messaging @userinfobot on Telegram
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Active Integrations</h4>
                {mockIntegrations
                  .filter(integration => integration.type === 'TELEGRAM')
                  .map((integration) => {
                    const config = getIntegrationConfig(integration.config)
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Telegram Bot</p>
                            <p className="text-sm text-muted-foreground">
                              Chat ID: {config.chatId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={integration.isActive}
                            onCheckedChange={() => handleToggleIntegration(integration.id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestNotification('TELEGRAM')}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Commands</CardTitle>
              <CardDescription>
                Use these commands in your Telegram chat to interact with tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks</Badge>
                  <span>List your assigned tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks todo</Badge>
                  <span>List tasks with To Do status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks in_progress</Badge>
                  <span>List tasks in progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/complete &lt;task_id&gt;</Badge>
                  <span>Mark a task as completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/status</Badge>
                  <span>Get your task summary</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Connect WhatsApp to receive task notifications and create tasks via messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp-number"
                    placeholder="+1234567890"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <Button 
                    onClick={handleAddWhatsApp}
                    disabled={isLoading || !whatsappNumber.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Active Integrations</h4>
                {mockIntegrations
                  .filter(integration => integration.type === 'WHATSAPP')
                  .map((integration) => {
                    const config = getIntegrationConfig(integration.config)
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">WhatsApp Business</p>
                            <p className="text-sm text-muted-foreground">
                              Number: {config.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={integration.isActive}
                            onCheckedChange={() => handleToggleIntegration(integration.id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestNotification('WHATSAPP')}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Features</CardTitle>
              <CardDescription>
                Available features when using WhatsApp integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Notifications</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Task assignments</li>
                    <li>• Due date reminders</li>
                    <li>• Status updates</li>
                    <li>• Project invitations</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Actions</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Create tasks via message</li>
                    <li>• Get status updates</li>
                    <li>• Project summaries</li>
                    <li>• Team notifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {key.split(/(?=[A-Z])/).map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Overview of your connected integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Telegram</p>
                    <p className="text-sm text-muted-foreground">
                      {mockIntegrations.filter(i => i.type === 'TELEGRAM' && i.isActive).length} active
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Smartphone className="h-8 w-8 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      {mockIntegrations.filter(i => i.type === 'WHATSAPP' && i.isActive).length} active
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
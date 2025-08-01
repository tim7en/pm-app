"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from '@/hooks/use-translation'
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
  const { t } = useTranslation()
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
          <h2 className="text-2xl font-bold">{t("connections.integrations")}</h2>
          <p className="text-muted-foreground">
            {t("connections.connectMessagingApps")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="telegram" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="telegram">{t("connections.telegram")}</TabsTrigger>
          <TabsTrigger value="whatsapp">{t("connections.whatsapp")}</TabsTrigger>
          <TabsTrigger value="settings">{t("connections.notificationSettings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="telegram" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t("connections.telegramIntegration")}
              </CardTitle>
              <CardDescription>
                {t("connections.telegramDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-chat">{t("connections.telegramChatId")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram-chat"
                    placeholder={t("connections.enterTelegramChatId")}
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                  />
                  <Button 
                    onClick={handleAddTelegram}
                    disabled={isLoading || !telegramChatId.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("connections.add")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("connections.telegramChatIdHelp")}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">{t("connections.activeIntegrations")}</h4>
                {mockIntegrations
                  .filter(integration => integration.type === 'TELEGRAM')
                  .map((integration) => {
                    const config = getIntegrationConfig(integration.config)
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{t("connections.telegramBot")}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("connections.chatId")}: {config.chatId}
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
                            {t("connections.test")}
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
              <CardTitle>{t("connections.availableCommands")}</CardTitle>
              <CardDescription>
                {t("connections.telegramCommandsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks</Badge>
                  <span>{t("connections.listAssignedTasks")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks todo</Badge>
                  <span>{t("connections.listTodoTasks")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/tasks in_progress</Badge>
                  <span>{t("connections.listInProgressTasks")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/complete &lt;task_id&gt;</Badge>
                  <span>{t("connections.markTaskCompleted")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/status</Badge>
                  <span>{t("connections.getTaskSummary")}</span>
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
                {t("connections.whatsappIntegration")}
              </CardTitle>
              <CardDescription>
                {t("connections.whatsappDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">{t("connections.whatsappNumber")}</Label>
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
                    {t("connections.add")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("connections.includeCountryCode")}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">{t("connections.activeIntegrations")}</h4>
                {mockIntegrations
                  .filter(integration => integration.type === 'WHATSAPP')
                  .map((integration) => {
                    const config = getIntegrationConfig(integration.config)
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{t("connections.whatsappBusiness")}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("connections.number")}: {config.phoneNumber}
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
                            {t("connections.test")}
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
              <CardTitle>{t("connections.whatsappFeatures")}</CardTitle>
              <CardDescription>
                {t("connections.whatsappFeaturesDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("connections.notifications")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {t("connections.taskAssignments")}</li>
                    <li>• {t("connections.dueDateReminders")}</li>
                    <li>• {t("connections.statusUpdates")}</li>
                    <li>• {t("connections.projectInvitations")}</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{t("connections.quickActions")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {t("connections.createTasksViaMessage")}</li>
                    <li>• {t("connections.getStatusUpdates")}</li>
                    <li>• {t("connections.projectSummaries")}</li>
                    <li>• {t("connections.teamNotifications")}</li>
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
                {t("connections.notificationSettings")}
              </CardTitle>
              <CardDescription>
                {t("connections.configureNotifications")}
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
                  {t("settings.saveSettings")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("connections.integrationStatus")}</CardTitle>
              <CardDescription>
                {t("connections.integrationStatusDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{t("connections.telegram")}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockIntegrations.filter(i => i.type === 'TELEGRAM' && i.isActive).length} {t("connections.active")}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Smartphone className="h-8 w-8 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">{t("connections.whatsapp")}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockIntegrations.filter(i => i.type === 'WHATSAPP' && i.isActive).length} {t("connections.active")}
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
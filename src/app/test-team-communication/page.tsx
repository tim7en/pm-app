"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamChatDialog } from "@/components/messages/team-chat-dialog"
import { MessageSquare, Users, Database, CheckCircle } from "lucide-react"

export default function TeamCommunicationTestPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [workspaceId, setWorkspaceId] = useState<string>('')

  useEffect(() => {
    // Check if setup is complete
    const authUser = localStorage.getItem('auth-user')
    const wsId = localStorage.getItem('currentWorkspaceId')
    
    if (authUser && wsId) {
      setCurrentUser(JSON.parse(authUser))
      setWorkspaceId(wsId)
      setSetupComplete(true)
    }
  }, [])

  const runSetup = () => {
    // Set workspace ID for testing messaging
    localStorage.setItem('currentWorkspaceId', 'cmdqzh3ge0004tt04g2odsrgf')
    
    // Set mock auth user
    const mockUser = {
      id: 'alice-user-id',
      email: 'alice@company.com', 
      name: 'Alice Johnson',
      avatar: '/avatars/01.png'
    }
    
    localStorage.setItem('auth-user', JSON.stringify(mockUser))
    
    setCurrentUser(mockUser) 
    setWorkspaceId('cmdqzh3ge0004tt04g2odsrgf')
    setSetupComplete(true)
  }

  const testFeatures = [
    {
      icon: MessageSquare,
      title: "Persistent Messaging",
      description: "Messages are saved in database and persist across sessions",
      status: "implemented"
    },
    {
      icon: Users,
      title: "Offline Support", 
      description: "Send messages to offline users - they'll see them when they return",
      status: "implemented"
    },
    {
      icon: Database,
      title: "Conversation History",
      description: "Complete message history is maintained and loaded automatically", 
      status: "implemented"
    },
    {
      icon: CheckCircle,
      title: "Read Status Tracking",
      description: "Messages show read/unread status with visual indicators",
      status: "implemented"
    }
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Team Communication Test</h1>
          <p className="text-xl text-muted-foreground">
            Testing persistent messaging with offline support
          </p>
        </div>

        {/* Setup Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {setupComplete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              Test Environment Setup
            </CardTitle>
            <CardDescription>
              {setupComplete 
                ? "Environment is ready for testing"
                : "Initialize test data and user session"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupComplete ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current User:</span>
                  <Badge variant="outline">{currentUser?.name} ({currentUser?.email})</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Workspace ID:</span>
                  <Badge variant="outline" className="font-mono text-xs">{workspaceId}</Badge>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded border">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Ready to test! You can now open the team chat and test messaging with other users.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    This will set up test data with 4 users and sample conversations:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Alice Johnson (alice@company.com)</li>
                    <li>• Bob Smith (bob@company.com)</li> 
                    <li>• Charlie Brown (charlie@company.com)</li>
                    <li>• Diana Prince (diana@company.com)</li>
                  </ul>
                </div>
                <Button onClick={runSetup} className="w-full">
                  Initialize Test Environment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <feature.icon className="h-5 w-5" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {feature.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {feature.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test the Feature</CardTitle>
            <CardDescription>
              Open the team chat to see persistent messaging in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                onClick={() => setChatOpen(true)}
                disabled={!setupComplete}
                size="lg"
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Team Chat Dialog
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('/messages', '_blank')}
                disabled={!setupComplete}
                className="w-full"
              >
                Open Messages Page (Full Screen)
              </Button>
            </div>

            {setupComplete && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Testing Instructions:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open team chat and select a team member</li>
                  <li>Send several messages to create a conversation</li>
                  <li>Close the chat and reopen it - messages should persist</li>
                  <li>Refresh the page - conversation history should load</li>
                  <li>Try opening in another tab with different user credentials</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Chat Dialog */}
        <TeamChatDialog
          isOpen={chatOpen}
          onOpenChange={setChatOpen}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  )
}

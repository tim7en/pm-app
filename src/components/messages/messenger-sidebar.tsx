import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Plus, 
  Inbox,
  Send,
  FileText,
  Shield,
  Trash,
  MessageSquare,
  Users,
  Bot,
  AlertCircle,
  Clock
} from 'lucide-react'
import { Conversation, EmailFolder } from '@/types/messenger'
import { cn } from '@/lib/utils'

interface MessengerSidebarProps {
  conversations: Conversation[]
  activeConversation: Conversation | null
  emailFolders: EmailFolder[]
  activeFolder: string
  searchQuery: string
  loading: boolean
  teamMembers?: any[]
  onConversationSelect: (conversation: Conversation) => void
  onFolderSelect: (folder: string) => void
  onSearchChange: (query: string) => void
  onCompose: () => void
  onStartChat?: (memberId: string) => void
}

const folderIcons: Record<string, any> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFT: FileText,
  SPAM: Shield,
  TRASH: Trash,
  INTERNAL: MessageSquare,
  TEAMS: Users
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export function MessengerSidebar({
  conversations,
  activeConversation,
  emailFolders,
  activeFolder,
  searchQuery,
  loading,
  teamMembers = [],
  onConversationSelect,
  onFolderSelect,
  onSearchChange,
  onCompose,
  onStartChat
}: MessengerSidebarProps) {
  const [sidebarMode, setSidebarMode] = useState<'folders' | 'conversations'>('folders')

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== 'current-user') || conversation.participants[0]
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case 'medium':
        return <Clock className="h-3 w-3 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" onClick={onCompose}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={sidebarMode === 'folders' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setSidebarMode('folders')}
          >
            Folders
          </Button>
          <Button
            variant={sidebarMode === 'conversations' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setSidebarMode('conversations')}
          >
            Chats
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {sidebarMode === 'folders' ? (
          /* Folders View */
          <div className="p-2">
            {/* Email Folders */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Email</h3>
              {emailFolders.map((folder) => {
                const IconComponent = folderIcons[folder.id] || Inbox
                return (
                  <button
                    key={folder.id}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-accent transition-colors",
                      activeFolder === folder.id && "bg-accent"
                    )}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {folder.unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {folder.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {folder.count}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Internal Folders */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Internal</h3>
              <button
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-accent transition-colors",
                  activeFolder === 'INTERNAL' && "bg-accent"
                )}
                onClick={() => onFolderSelect('INTERNAL')}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Direct Messages</span>
                </div>
              </button>
              <button
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-accent transition-colors",
                  activeFolder === 'TEAMS' && "bg-accent"
                )}
                onClick={() => onFolderSelect('TEAMS')}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Team Channels</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Conversations View */
          <div>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : activeFolder === 'TEAMS' && teamMembers.length > 0 ? (
              /* Team Members View */
              <div className="p-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Team Members</h3>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                      "border-b border-border/50 last:border-0"
                    )}
                    onClick={() => onStartChat?.(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator */}
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                          member.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {member.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              member.isOnline ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {member.isOnline ? 'Online' : formatTimeAgo(new Date(member.lastSeen))}
                          </span>
                        </div>

                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {member.workspaceRole}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations found
              </div>
            ) : (
              conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation)
                const isOnline = (conversation as any).isOnline
                
                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "p-4 border-b cursor-pointer hover:bg-accent transition-colors",
                      activeConversation?.id === conversation.id && "bg-accent"
                    )}
                    onClick={() => onConversationSelect(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                          <AvatarFallback>
                            {otherParticipant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status for internal conversations */}
                        {conversation.type === 'internal' && (
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                          )} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">
                              {conversation.isGroup ? conversation.groupName : otherParticipant.name}
                            </h3>
                            {conversation.type === 'email' && (
                              <Bot className="h-3 w-3 text-blue-500" />
                            )}
                            {conversation.type === 'internal' && isOnline && (
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon((conversation as any).priority)}
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>

                        {/* Email specific info */}
                        {conversation.type === 'email' && otherParticipant.email && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {otherParticipant.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

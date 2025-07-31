import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck,
  Bot,
  Reply,
  Forward,
  Star,
  Archive,
  Trash2,
  AlertCircle,
  Clock,
  FileText,
  Image,
  Download
} from 'lucide-react'
import { Message, Conversation, Attachment } from '@/types/messenger'
import { cn } from '@/lib/utils'

interface MessageThreadProps {
  conversation: Conversation | null
  messages: Message[]
  onSendMessage: (content: string, attachments?: Attachment[]) => void
  onGenerateReply: (originalContent: string) => Promise<string | null>
  loading?: boolean
}

export function MessageThread({ 
  conversation, 
  messages, 
  onSendMessage, 
  onGenerateReply,
  loading = false 
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [generatingReply, setGeneratingReply] = useState(false)

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-24 w-24 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Messenger</h3>
            <p className="text-muted-foreground">
              Select a conversation to start messaging, or compose a new email with AI assistance
            </p>
          </div>
        </div>
      </div>
    )
  }

  const formatMessageTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time'
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatMessageDate = (date: Date | string) => {
    const today = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    onSendMessage(newMessage)
    setNewMessage('')
    setShowAiSuggestion(false)
    setAiSuggestion('')
  }

  const handleGenerateAiReply = async () => {
    if (messages.length === 0) return
    
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.sender.id === 'current-user') return
    
    setGeneratingReply(true)
    try {
      const suggestion = await onGenerateReply(lastMessage.content)
      if (suggestion) {
        setAiSuggestion(suggestion)
        setShowAiSuggestion(true)
      }
    } finally {
      setGeneratingReply(false)
    }
  }

  const useAiSuggestion = () => {
    setNewMessage(aiSuggestion)
    setShowAiSuggestion(false)
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

  const getAttachmentIcon = (attachment: Attachment) => {
    if (attachment.type.startsWith('image/')) return Image
    return FileText
  }

  const getOtherParticipant = () => {
    return conversation.participants.find(p => p.id !== 'current-user') || conversation.participants[0]
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
              <AvatarFallback>
                {otherParticipant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {conversation.isGroup ? conversation.groupName : otherParticipant.name}
                </h3>
                {conversation.type === 'email' && (
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {conversation.type === 'email' && otherParticipant.email ? (
                  otherParticipant.email
                ) : conversation.isGroup ? (
                  `${conversation.participants.length} participants`
                ) : (
                  'Online'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {conversation.type === 'email' ? (
              <>
                <Button variant="ghost" size="sm">
                  <Reply className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Forward className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.id === 'current-user'
              const showDate = index === 0 || 
                formatMessageDate(message.timestamp) !== formatMessageDate(messages[index - 1].timestamp)
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge variant="outline" className="text-xs">
                        {formatMessageDate(message.timestamp)}
                      </Badge>
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex gap-3",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                        <AvatarFallback className="text-xs">
                          {message.sender.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[70%] space-y-1",
                      isCurrentUser && "items-end"
                    )}>
                      <Card className={cn(
                        "p-3",
                        isCurrentUser 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <CardContent className="p-0">
                          {/* Priority indicator */}
                          {message.priority && (
                            <div className="flex items-center gap-1 mb-2">
                              {getPriorityIcon(message.priority)}
                              <span className="text-xs capitalize">
                                {message.priority} priority
                              </span>
                            </div>
                          )}
                          
                          {/* Message content */}
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => {
                                const IconComponent = getAttachmentIcon(attachment)
                                return (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 rounded border bg-background/50"
                                  >
                                    <IconComponent className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs truncate">{attachment.name}</p>
                                      <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Message footer */}
                      <div className={cn(
                        "flex items-center gap-2 text-xs text-muted-foreground",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}>
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {isCurrentUser && (
                          message.isRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                    
                    {isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                        <AvatarFallback className="text-xs">
                          You
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* AI Suggestion */}
      {showAiSuggestion && (
        <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                AI Suggested Reply:
              </p>
              <Card className="p-3 bg-background border-blue-200">
                <p className="text-sm">{aiSuggestion}</p>
              </Card>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={useAiSuggestion}>
                  Use This Reply
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAiSuggestion(false)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAiReply}
              disabled={generatingReply || messages.length === 0}
              title="Generate AI reply"
            >
              <Bot className={cn(
                "h-4 w-4",
                generatingReply && "animate-pulse text-blue-500"
              )} />
            </Button>
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

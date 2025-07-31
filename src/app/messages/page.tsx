"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MessengerSidebar } from "@/components/messages/messenger-sidebar"
import { MessageThread } from "@/components/messages/message-thread"
import { EmailCompose } from "@/components/messages/email-compose"
import { useMessenger } from "@/hooks/use-messenger"

export default function MessagesPage() {
  const {
    filteredConversations,
    activeConversation,
    messages,
    emailFolders,
    activeFolder,
    searchQuery,
    loading,
    composing,
    draftEmail,
    teamMembers,
    setActiveConversation,
    setActiveFolder,
    setSearchQuery,
    startComposing,
    stopComposing,
    updateDraftEmail,
    sendEmail,
    sendInternalMessage,
    generateDraftReply,
    uploadAttachment
  } = useMessenger()

  const handleSendMessage = async (content: string) => {
    if (activeConversation?.type === 'internal') {
      return await sendInternalMessage(content)
    } else {
      // Handle other message types
      console.log('Sending message:', content)
      return true
    }
  }

  const handleStartChat = (memberId: string) => {
    // Find the member and create/select conversation
    const member = teamMembers.find(m => m.id === memberId)
    if (member) {
      const conversation = {
        id: `chat-${memberId}`,
        participants: [
          {
            id: 'current-user',
            name: 'You',
            email: 'current@user.com'
          },
          {
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar
          }
        ],
        lastMessage: {
          content: 'Start a new conversation',
          timestamp: new Date(),
          senderId: 'current-user'
        },
        unreadCount: 0,
        isGroup: false,
        type: 'internal' as const,
        isOnline: member.isOnline
      }
      setActiveConversation(conversation)
      setActiveFolder('INTERNAL')
    }
  }

  const handleSendEmail = async (draft: any) => {
    return await sendEmail(draft, false)
  }

  const handleSaveDraft = async (draft: any) => {
    return await sendEmail(draft, true)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            <MessengerSidebar
              conversations={filteredConversations}
              activeConversation={activeConversation}
              emailFolders={emailFolders}
              activeFolder={activeFolder}
              searchQuery={searchQuery}
              loading={loading}
              teamMembers={teamMembers}
              onConversationSelect={setActiveConversation}
              onFolderSelect={setActiveFolder}
              onSearchChange={setSearchQuery}
              onCompose={startComposing}
              onStartChat={handleStartChat}
            />

            <MessageThread
              conversation={activeConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onGenerateReply={generateDraftReply}
              loading={loading}
            />
          </div>
        </main>
      </div>

      {composing && draftEmail && (
        <EmailCompose
          draft={draftEmail}
          isOpen={composing}
          onClose={stopComposing}
          onSend={handleSendEmail}
          onSaveDraft={handleSaveDraft}
          onDraftChange={updateDraftEmail}
          onGenerateReply={generateDraftReply}
          onUploadAttachment={uploadAttachment}
        />
      )}
    </div>
  )
}
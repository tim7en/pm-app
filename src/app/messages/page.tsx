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
    setActiveConversation,
    setActiveFolder,
    setSearchQuery,
    startComposing,
    stopComposing,
    updateDraftEmail,
    sendEmail,
    generateDraftReply,
    uploadAttachment
  } = useMessenger()

  const handleSendMessage = async (content: string) => {
    // For internal messages, this would send through websocket
    // For now, we'll just add it to the local state
    console.log('Sending message:', content)
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
              onConversationSelect={setActiveConversation}
              onFolderSelect={setActiveFolder}
              onSearchChange={setSearchQuery}
              onCompose={startComposing}
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
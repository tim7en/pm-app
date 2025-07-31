# Team Communication Feature - Implementation Guide

## Overview
The team communication feature has been successfully integrated into the project management application with full offline message persistence support. This feature allows team members to chat in real-time, and importantly, messages are saved and accessible even when team members are offline.

## Key Features

### ✅ Persistent Messaging
- **Offline Support**: Messages are stored in the database and remain accessible even after users log out and back in
- **Message History**: Complete conversation history is maintained and loaded when users access conversations
- **Cross-Session Persistence**: Users can send messages to offline team members, who will see them when they come online

### ✅ Real-Time Communication
- **Instant Messaging**: Messages appear immediately in the UI for better user experience
- **Read Status**: Messages show read/unread status with checkmarks
- **Online Status**: Team members show online/offline status with last seen timestamps

### ✅ User-Friendly Interface
- **Team Chat Dialog**: Modern, expandable dialog with search functionality
- **Conversation List**: Recent conversations are displayed with unread counts
- **Team Member Directory**: Browse and start conversations with any team member
- **Responsive Design**: Works well on different screen sizes

## Database Schema

The messaging system uses three main tables:

### 1. Conversations
```sql
- id: Unique conversation identifier
- name: Optional name for group conversations
- isGroup: Boolean flag for group vs direct messages
- type: INTERNAL (for team communication)
- createdAt/updatedAt: Timestamps
```

### 2. ConversationParticipants
```sql
- conversationId: Links to conversation
- userId: Links to user
- joinedAt: When user joined conversation
- lastReadAt: Track read status
```

### 3. Messages
```sql
- id: Unique message identifier
- content: Message text
- conversationId: Links to conversation
- senderId: User who sent the message
- isRead: Read status
- createdAt/updatedAt: Timestamps
```

## API Endpoints

### GET /api/messages/internal
- Fetches all conversations for current user
- Returns conversation list with participants and last messages
- Includes unread message counts

### GET /api/messages/internal?conversationId=<id>
- Fetches all messages for a specific conversation
- Returns chronologically ordered messages with sender details

### POST /api/messages/internal
- Sends a new message
- Creates conversation if it doesn't exist
- Updates conversation timestamp

### PATCH /api/messages/internal
- Marks messages as read
- Updates participant's lastReadAt timestamp

### GET /api/messages/team-members
- Fetches team members for current workspace
- Returns member details with online status simulation

## Usage Instructions

### For End Users:

1. **Access Team Chat**:
   - Click "Open Team Chat" button in the dashboard
   - Or navigate to the Messages page at `/messages`

2. **Start a Conversation**:
   - Click on any team member to start a direct message
   - The system automatically creates a conversation

3. **Send Messages**:
   - Type in the message box and press Enter or click Send
   - Messages are saved immediately and delivered to offline users

4. **View Message History**:
   - All previous messages load automatically when opening a conversation
   - Messages persist across login sessions

### For Developers:

1. **Setup Database**:
   ```bash
   npx prisma db push
   npx tsx seed-messaging.ts  # Creates sample data
   ```

2. **Test the Feature**:
   - Run the setup script: Navigate to `/setup-messaging.js` in browser
   - Login with test credentials (see console output)
   - Open team chat and test messaging

3. **Component Integration**:
   ```tsx
   import { TeamChatDialog } from '@/components/messages/team-chat-dialog'
   
   <TeamChatDialog
     isOpen={isOpen}
     onOpenChange={setIsOpen}
     workspaceId={workspaceId}
   />
   ```

## Testing Scenarios

### ✅ Offline Message Persistence
1. User A sends message to User B (who is offline)
2. User B logs out and back in
3. User B sees the message from User A ✓

### ✅ Conversation History
1. Users exchange several messages
2. Both users log out
3. Users log back in and can see full conversation history ✓

### ✅ Cross-Session Messaging
1. User starts conversation in one session
2. User closes browser/app
3. User reopens and continues same conversation ✓

### ✅ Unread Message Tracking
1. User A sends message to User B
2. Message shows as unread for User B
3. When User B opens conversation, message is marked as read ✓

## Configuration

### Environment Variables
- `DATABASE_URL`: SQLite database connection string
- Workspace ID is stored in localStorage as `currentWorkspaceId`

### Sample Data
The seed script creates:
- 4 test users (Alice, Bob, Charlie, Diana)
- 1 workspace with all users as members
- Sample conversations with message history

### Test Credentials
- Alice: alice@company.com / password123
- Bob: bob@company.com / password123
- Charlie: charlie@company.com / password123
- Diana: diana@company.com / password123

## Architecture Benefits

1. **Scalable**: Database-driven approach supports many users and messages
2. **Reliable**: Messages are persisted immediately, not lost on crashes
3. **Flexible**: Easy to extend with features like file attachments, emoji reactions
4. **Maintainable**: Clean separation between UI components and API logic

## Future Enhancements

Potential improvements that could be added:
- File/image attachments
- Message reactions (emoji)
- Group conversations
- Push notifications
- Voice/video calling integration
- Message search functionality
- Message editing/deletion
- Typing indicators

## Troubleshooting

### Common Issues:

1. **Messages not appearing**: Check database connection and ensure tables exist
2. **Offline users not receiving messages**: Verify conversation creation logic
3. **Read status not updating**: Check PATCH endpoint for marking messages as read

### Debug Steps:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check database with `npx prisma studio`
4. Confirm workspace ID in localStorage

---

The team communication feature is now fully functional with proper offline message persistence, ensuring team members can communicate effectively regardless of their online status.

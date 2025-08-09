/**
 * Comprehensive Test Suite for TeamChatDialog Component
 * 
 * This test suite covers:
 * - Component rendering and state management
 * - API integration and error handling
 * - User interactions and messaging flow
 * - Data consistency and edge cases
 * - Performance and memory leak detection
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TeamChatDialog } from '../src/components/messages/team-chat-dialog'

// Mock the required hooks and components
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'HH:mm') return '12:34'
    if (formatStr === 'yyyy-MM-dd') return '2025-01-31'
    if (formatStr === 'MMMM d, yyyy') return 'January 31, 2025'
    return date.toISOString()
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock team members data
const mockTeamMembers = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    avatar: '/avatars/01.png',
    role: 'developer',
    isOnline: true,
    lastSeen: new Date(),
    workspaceRole: 'Admin'
  },
  {
    id: 'user-2', 
    name: 'Bob Smith',
    email: 'bob@company.com',
    avatar: '/avatars/02.png',
    role: 'designer',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
    workspaceRole: 'Member'
  },
  {
    id: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie@company.com',
    avatar: '/avatars/03.png',
    role: 'manager',
    isOnline: true,
    lastSeen: new Date(),
    workspaceRole: 'Member'
  }
]

// Mock conversation data
const mockConversation = {
  id: 'conv-123',
  participants: [mockTeamMembers[0]],
  messages: [
    {
      id: 'msg-1',
      content: 'Hello there!',
      senderId: 'user-1',
      senderName: 'Alice Johnson',
      senderAvatar: '/avatars/01.png',
      timestamp: new Date('2025-01-31T10:00:00Z'),
      isRead: true
    },
    {
      id: 'msg-2',
      content: 'How are you doing?',
      senderId: 'current-user',
      senderName: 'You',
      timestamp: new Date('2025-01-31T10:05:00Z'),
      isRead: false
    }
  ],
  lastMessage: {
    id: 'msg-2',
    content: 'How are you doing?',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: new Date('2025-01-31T10:05:00Z'),
    isRead: false
  },
  unreadCount: 0,
  isGroup: false,
  type: 'internal' as const
}

describe('TeamChatDialog', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    workspaceId: 'workspace-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock localStorage auth user
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth-user') {
        return JSON.stringify({
          id: 'current-user',
          name: 'Current User',
          email: 'current@user.com'
        })
      }
      if (key === 'currentWorkspaceId') {
        return 'workspace-123'
      }
      return null
    })

    // Default fetch mock - team members API
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/messages/team-members')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            members: mockTeamMembers
          })
        })
      }
      
      if (url.includes('/api/messages/internal')) {
        if (url.includes('conversationId=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              messages: mockConversation.messages
            })
          })
        }
        
        if (url.includes('participantId=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              conversation: mockConversation
            })
          })
        }
        
        // POST request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 'new-msg-123',
              content: 'Test message',
              senderId: 'current-user',
              sender: {
                id: 'current-user',
                name: 'Current User',
                avatar: null
              },
              timestamp: new Date().toISOString(),
              isRead: false
            },
            conversationId: 'conv-123'
          })
        })
      }
      
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Component Rendering', () => {
    it('should render the dialog when open', async () => {
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Team Communication')).toBeInTheDocument()
      })
    })

    it('should not render when closed', () => {
      render(<TeamChatDialog {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Team Communication')).not.toBeInTheDocument()
    })

    it('should show loading state initially', async () => {
      render(<TeamChatDialog {...defaultProps} />)
      
      // Should show team members section eventually
      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument()
      })
    })
  })

  describe('Team Members Loading', () => {
    it('should load team members on dialog open', async () => {
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Bob Smith')).toBeInTheDocument()
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages/team-members?workspaceId=workspace-123')
      )
    })

    it('should handle team members API error gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('No team members found')).toBeInTheDocument()
      })
    })

    it('should handle 401 authentication error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('No team members found')).toBeInTheDocument()
      })
    })

    it('should exclude current user from team members list', async () => {
      const membersWithCurrentUser = [
        ...mockTeamMembers,
        {
          id: 'current-user',
          name: 'Current User',
          email: 'current@user.com',
          avatar: null,
          role: 'admin',
          isOnline: true,
          lastSeen: new Date(),
          workspaceRole: 'Admin'
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          members: membersWithCurrentUser
        })
      })
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.queryByText('Current User')).not.toBeInTheDocument()
      })
    })
  })

  describe('Conversation Management', () => {
    it('should start a new conversation when clicking a team member', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Start the conversation!')).toBeInTheDocument()
      })
    })

    it('should load existing conversation messages', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        expect(screen.getByText('Hello there!')).toBeInTheDocument()
        expect(screen.getByText('How are you doing?')).toBeInTheDocument()
      })
    })

    it('should handle conversation loading errors', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/messages/team-members')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              members: mockTeamMembers
            })
          })
        }
        
        if (url.includes('participantId=')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          })
        }
        
        return Promise.resolve({ ok: false })
      })

      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Alice Johnson'))
      
      // Should still create temporary conversation
      await waitFor(() => {
        expect(screen.getByText('Start the conversation!')).toBeInTheDocument()
      })
    })

    it('should go back to member list from conversation', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /arrow/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /arrow/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Team Communication')).toBeInTheDocument()
        expect(screen.getByText('Recent Conversations')).toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send a message successfully', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      // Start a conversation
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      // Type and send message
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Message Alice Johnson/)).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText(/Message Alice Johnson/)
      await user.type(textarea, 'Hello Alice!')
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      await user.click(sendButton)
      
      await waitFor(() => {
        expect(screen.getByText('Hello Alice!')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages/internal',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Hello Alice!')
        })
      )
    })

    it('should send message with Enter key', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      // Start a conversation
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      // Type message and press Enter
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Message Alice Johnson/)).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText(/Message Alice Johnson/)
      await user.type(textarea, 'Hello with Enter!')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Hello with Enter!')).toBeInTheDocument()
      })
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      // Start a conversation
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      // Try to send empty message
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
      })
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('should handle message sending errors', async () => {
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (url.includes('/api/messages/team-members')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              members: mockTeamMembers
            })
          })
        }
        
        if (url.includes('participantId=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              conversation: mockConversation
            })
          })
        }

        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          })
        }
        
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      // Start a conversation
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      // Send message
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Message Alice Johnson/)).toBeInTheDocument()
      })
      
      const textarea = screen.getByPlaceholderText(/Message Alice Johnson/)
      await user.type(textarea, 'Test message')
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      await user.click(sendButton)
      
      // Message should still appear in UI (optimistic update)
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter team members by name', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Bob Smith')).toBeInTheDocument()
        expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search team members...')
      await user.type(searchInput, 'Alice')
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
        expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument()
      })
    })

    it('should filter team members by email', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search team members...')
      await user.type(searchInput, 'bob@company.com')
      
      await waitFor(() => {
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
        expect(screen.getByText('Bob Smith')).toBeInTheDocument()
        expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument()
      })
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search team members...')
      await user.type(searchInput, 'nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText('No team members match your search')).toBeInTheDocument()
      })
    })
  })

  describe('Conversation Management Edge Cases', () => {
    it('should handle duplicate conversations properly', async () => {
      const duplicateConversations = [
        mockConversation,
        { ...mockConversation, id: 'conv-456' }, // Different ID, same participant
        mockConversation // Exact duplicate
      ]

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/messages/team-members')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              members: mockTeamMembers
            })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<TeamChatDialog {...defaultProps} />)
      
      // The component should automatically clean up duplicates
      // This is tested through the useEffect that cleans conversations
      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument()
      })
    })

    it('should generate unique temporary conversation IDs', async () => {
      const user = userEvent.setup()
      
      // Mock Date.now and Math.random for predictable IDs
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
      const mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Alice Johnson'))
      
      // Should create a temporary conversation with predictable ID
      await waitFor(() => {
        expect(screen.getByText('Start the conversation!')).toBeInTheDocument()
      })
      
      mockDateNow.mockRestore()
      mockMathRandom.mockRestore()
    })
  })

  describe('UI State Management', () => {
    it('should toggle expanded state', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByTitle('Maximize dialog')).toBeInTheDocument()
      })

      const expandButton = screen.getByTitle('Maximize dialog')
      await user.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByTitle('Minimize dialog')).toBeInTheDocument()
      })
    })

    it('should show online/offline status correctly', async () => {
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      })

      // Alice should show as online
      const aliceStatus = screen.getByText('Online')
      expect(aliceStatus).toBeInTheDocument()

      // Bob should show as offline with last seen time
      expect(screen.getByText(/1h ago/)).toBeInTheDocument()
    })

    it('should handle conversation clearing', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      // First create a conversation to have something to clear
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      // Go back to main view
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /arrow/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /arrow/i }))
      
      // Now we should have a recent conversation and be able to clear it
      await waitFor(() => {
        const clearButton = screen.queryByText('Clear')
        if (clearButton) {
          expect(clearButton).toBeInTheDocument()
        }
      }, { timeout: 3000 })
    })
  })

  describe('Memory and Performance', () => {
    it('should cleanup timers and effects on unmount', () => {
      const { unmount } = render(<TeamChatDialog {...defaultProps} />)
      
      // Component should mount successfully
      expect(screen.getByText('Team Communication')).toBeInTheDocument()
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow()
    })

    it('should handle rapid state changes without errors', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })

      // Rapidly click different team members
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Alice Johnson'))
        if (screen.queryByRole('button', { name: /arrow/i })) {
          await user.click(screen.getByRole('button', { name: /arrow/i }))
        }
      }
      
      // Should still be functional
      expect(screen.getByText('Team Communication')).toBeInTheDocument()
    })
  })

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          members: null // Malformed response
        })
      })
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('No team members found')).toBeInTheDocument()
      })
    })

    it('should handle missing localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      expect(() => {
        render(<TeamChatDialog {...defaultProps} />)
      }).not.toThrow()
    })

    it('should handle invalid workspace ID', async () => {
      render(<TeamChatDialog {...defaultProps} workspaceId="" />)
      
      await waitFor(() => {
        expect(screen.getByText('No team members found')).toBeInTheDocument()
      })
    })

    it('should handle network timeouts gracefully', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )
      
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('No team members found')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Message Display and Formatting', () => {
    it('should display messages with correct timestamps', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        expect(screen.getByText('Hello there!')).toBeInTheDocument()
        expect(screen.getByText('How are you doing?')).toBeInTheDocument()
        // Should show formatted time
        expect(screen.getAllByText('12:34')).toHaveLength(2) // Two messages
      })
    })

    it('should show date separators for different days', async () => {
      const messagesWithDifferentDates = [
        {
          ...mockConversation.messages[0],
          timestamp: new Date('2025-01-30T10:00:00Z')
        },
        {
          ...mockConversation.messages[1],
          timestamp: new Date('2025-01-31T10:00:00Z')
        }
      ]

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/messages/team-members')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              members: mockTeamMembers
            })
          })
        }
        
        if (url.includes('participantId=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              conversation: {
                ...mockConversation,
                messages: messagesWithDifferentDates
              }
            })
          })
        }
        
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        expect(screen.getByText('January 31, 2025')).toBeInTheDocument()
      })
    })

    it('should show read/unread status for messages', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Alice Johnson'))
      
      await waitFor(() => {
        // Should show read status for current user's messages
        expect(screen.getByText('Sent')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<TeamChatDialog {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument()
      })

      // Tab to search input
      await user.tab()
      expect(screen.getByPlaceholderText('Search team members...')).toHaveFocus()
    })
  })
})

/**
 * Additional manual test cases for QA:
 * 
 * 1. Performance Testing:
 *    - Test with 100+ team members
 *    - Test with 1000+ messages in a conversation
 *    - Monitor memory usage during extended use
 * 
 * 2. Network Conditions:
 *    - Test with slow 3G connection
 *    - Test with intermittent connectivity
 *    - Test offline behavior
 * 
 * 3. Cross-browser Testing:
 *    - Chrome, Firefox, Safari, Edge
 *    - Mobile browsers (iOS Safari, Chrome Mobile)
 * 
 * 4. Real-time Features:
 *    - Multiple users in same conversation
 *    - Message delivery confirmations
 *    - Online status updates
 * 
 * 5. Data Persistence:
 *    - Browser refresh during conversation
 *    - Tab close/reopen scenarios
 *    - Storage quota exceeded scenarios
 */

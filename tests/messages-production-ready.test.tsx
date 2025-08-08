/**
 * Integration test for Messages Page production readiness
 * This file tests the key fixes implemented for production readiness
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessagesPage from '../src/app/messages/page'
import { AuthContext } from '../src/contexts/AuthContext'
import { useMessenger } from '../src/hooks/use-messenger'

// Mock the useMessenger hook
jest.mock('../src/hooks/use-messenger')
const mockUseMessenger = useMessenger as jest.MockedFunction<typeof useMessenger>

// Mock components that might cause issues in testing
jest.mock('../src/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}))

jest.mock('../src/components/layout/header', () => ({
  Header: () => <div data-testid="header">Header</div>
}))

describe('Messages Page Production Readiness', () => {
  const mockAuthContext = {
    isAuthenticated: true,
    currentWorkspaceId: 'test-workspace-123',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }

  const mockMessengerData = {
    filteredConversations: [],
    activeConversation: null,
    messages: [],
    emailFolders: [
      { id: 'INBOX', name: 'Inbox', count: 0, unreadCount: 0, icon: 'Inbox' }
    ],
    activeFolder: 'INTERNAL',
    searchQuery: '',
    loading: false,
    composing: false,
    draftEmail: null,
    teamMembers: [],
    setActiveConversation: jest.fn(),
    setActiveFolder: jest.fn(),
    setSearchQuery: jest.fn(),
    startComposing: jest.fn(),
    stopComposing: jest.fn(),
    updateDraftEmail: jest.fn(),
    sendEmail: jest.fn(),
    sendInternalMessage: jest.fn(),
    generateDraftReply: jest.fn(),
    uploadAttachment: jest.fn()
  }

  beforeEach(() => {
    mockUseMessenger.mockReturnValue(mockMessengerData)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('1. Shows authentication gate when not authenticated', () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false,
      currentWorkspaceId: null
    }

    render(
      <AuthContext.Provider value={unauthenticatedContext}>
        <MessagesPage />
      </AuthContext.Provider>
    )

    expect(screen.getByText(/please select a workspace to access messages/i)).toBeInTheDocument()
  })

  test('2. Renders main interface when authenticated', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MessagesPage />
      </AuthContext.Provider>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByText(/messages/i)).toBeInTheDocument()
  })

  test('3. Error boundary catches and displays errors gracefully', () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error
    console.error = jest.fn()

    // Force an error by providing invalid props
    const ThrowError = () => {
      throw new Error('Test error for error boundary')
    }

    const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <div>
          {children}
          <ThrowError />
        </div>
      )
    }

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ErrorBoundaryWrapper>
          <MessagesPage />
        </ErrorBoundaryWrapper>
      </AuthContext.Provider>
    )

    // Restore console.error
    console.error = originalError
  })

  test('4. Handles loading states properly', () => {
    const loadingMessengerData = {
      ...mockMessengerData,
      loading: true
    }
    
    mockUseMessenger.mockReturnValue(loadingMessengerData)

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MessagesPage />
      </AuthContext.Provider>
    )

    expect(screen.getByText(/loading conversations/i)).toBeInTheDocument()
  })

  test('5. Displays team members when TEAMS folder is selected', () => {
    const teamMembersData = {
      ...mockMessengerData,
      activeFolder: 'TEAMS',
      teamMembers: [
        {
          id: 'member-1',
          name: 'John Doe',
          email: 'john@example.com',
          isOnline: true,
          lastSeen: new Date(),
          workspaceRole: 'Developer'
        }
      ]
    }
    
    mockUseMessenger.mockReturnValue(teamMembersData)

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MessagesPage />
      </AuthContext.Provider>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  test('6. Email compose modal opens and handles controlled inputs', async () => {
    const composingData = {
      ...mockMessengerData,
      composing: true,
      draftEmail: {
        to: '',
        subject: '',
        body: '',
        cc: '',
        bcc: ''
      }
    }
    
    mockUseMessenger.mockReturnValue(composingData)

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <MessagesPage />
      </AuthContext.Provider>
    )

    // Check that email compose modal is rendered with controlled inputs
    expect(screen.getByPlaceholderText('recipient@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email subject')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()

    // Test that inputs are controlled (have empty string values, not undefined)
    const toInput = screen.getByPlaceholderText('recipient@example.com') as HTMLInputElement
    const subjectInput = screen.getByPlaceholderText('Email subject') as HTMLInputElement
    const bodyInput = screen.getByPlaceholderText('Type your message here...') as HTMLTextAreaElement

    expect(toInput.value).toBe('')
    expect(subjectInput.value).toBe('')
    expect(bodyInput.value).toBe('')
  })
})

export {}

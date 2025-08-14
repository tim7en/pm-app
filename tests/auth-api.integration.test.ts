/**
 * Integration tests for authentication API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the database and external dependencies
const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}

// Mock the auth functions
const mockAuth = {
  createToken: vi.fn(() => 'mock-token'),
  getAuthSession: vi.fn()
}

// Mock imports
vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/auth', () => mockAuth)
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  }
}))

// Import the route handlers after mocking
import { POST as loginPOST } from '../src/app/api/auth/login/route'
import bcrypt from 'bcryptjs'

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('Login API (/api/auth/login)', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      avatar: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      workspaceMembers: [
        {
          workspace: {
            id: 'workspace-123',
            name: 'Test Workspace'
          },
          role: 'MEMBER'
        }
      ]
    }

    it('should login successfully with valid credentials', async () => {
      // Setup mocks
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.user.update.mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      // Create request
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Execute
      const response = await loginPOST(request)
      const body = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(body.user.email).toBe('test@example.com')
      expect(body.token).toBe('mock-token')
      expect(body.workspaces).toHaveLength(1)
      
      // Verify database calls
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          workspaceMembers: {
            include: {
              workspace: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })
      
      // Verify password reset on successful login
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date)
        }
      })
    })

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.message).toContain('Validation failed')
      expect(body.message).toContain('Invalid email format')
    })

    it('should handle user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.message).toBe('Invalid email or password')
    })

    it('should handle invalid password', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.user.update.mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.message).toContain('Invalid email or password')
      
      // Verify failed attempt tracking
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 1,
          lockedUntil: null
        }
      })
    })

    it('should lock account after max failed attempts', async () => {
      const userWithFailedAttempts = {
        ...mockUser,
        failedLoginAttempts: 4 // One more will reach the limit of 5
      }
      
      mockDb.user.findUnique.mockResolvedValue(userWithFailedAttempts)
      mockDb.user.update.mockResolvedValue(userWithFailedAttempts)
      ;(bcrypt.compare as any).mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.message).toContain('Too many failed attempts')
      
      // Verify account locking
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date)
        }
      })
    })

    it('should reject login for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // Locked for 30 minutes
      }
      
      mockDb.user.findUnique.mockResolvedValue(lockedUser)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.message).toContain('Account is locked')
    })

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(6).fill(0).map(() => 
        new NextRequest('http://localhost/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '127.0.0.1'
          }
        })
      )

      // Mock user for successful validation
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      const responses = []
      for (const request of requests) {
        const response = await loginPOST(request)
        responses.push(response)
      }

      // Check that later requests are rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should set HTTP-only cookie on successful login', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)
      mockDb.user.update.mockResolvedValue(mockUser)
      ;(bcrypt.compare as any).mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)

      expect(response.status).toBe(200)
      
      // Check for auth-token cookie
      const cookies = response.headers.get('Set-Cookie') || ''
      expect(cookies).toContain('auth-token=mock-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('SameSite=Lax')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.code).toBe('DATABASE_ERROR')
    })
  })
})
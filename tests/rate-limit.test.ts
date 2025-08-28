/**
 * Unit tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { 
  rateLimit, 
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
  getRateLimitStatus
} from '../src/lib/rate-limit'

// Mock NextRequest
function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/test')
  
  // Mock headers
  vi.spyOn(request.headers, 'get').mockImplementation((key: string) => {
    if (key === 'x-forwarded-for') return ip
    if (key === 'x-real-ip') return ip
    return null
  })
  
  // Mock cookies
  vi.spyOn(request.cookies, 'get').mockReturnValue(undefined)
  
  return request
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    vi.clearAllMocks()
  })

  describe('rateLimit middleware', () => {
    it('should allow requests within limit', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 5
      })
      
      const request = createMockRequest('192.168.1.1')
      
      // First request should be allowed
      const response = await middleware(request)
      expect(response).toBeNull()
    })

    it('should block requests exceeding limit', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 2,
        message: 'Too many requests'
      })
      
      const request = createMockRequest('192.168.1.2')
      
      // First two requests should be allowed
      let response = await middleware(request)
      expect(response).toBeNull()
      
      response = await middleware(request)
      expect(response).toBeNull()
      
      // Third request should be blocked
      response = await middleware(request)
      expect(response).not.toBeNull()
      
      if (response) {
        expect(response.status).toBe(429)
        const body = await response.json()
        expect(body.error).toBe('Too many requests')
      }
    })

    it('should include rate limit headers', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 5
      })
      
      const request = createMockRequest('192.168.1.3')
      
      await middleware(request)
      
      // Check if headers were set on the request
      expect(request.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(request.headers.get('X-RateLimit-Remaining')).toBe('4')
    })

    it('should use custom key generator', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: () => 'custom-key'
      })
      
      const request1 = createMockRequest('192.168.1.4')
      const request2 = createMockRequest('192.168.1.5')
      
      // Both requests use the same key, so second should count towards the limit
      await middleware(request1)
      await middleware(request2)
      
      // Third request should be blocked
      const response = await middleware(request1)
      expect(response).not.toBeNull()
      expect(response?.status).toBe(429)
    })

    it('should reset after time window', async () => {
      const middleware = rateLimit({
        windowMs: 100, // 100ms window
        maxRequests: 1
      })
      
      const request = createMockRequest('192.168.1.6')
      
      // First request should be allowed
      let response = await middleware(request)
      expect(response).toBeNull()
      
      // Second request should be blocked
      response = await middleware(request)
      expect(response?.status).toBe(429)
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Request should be allowed again
      response = await middleware(request)
      expect(response).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: () => {
          throw new Error('Key generator error')
        }
      })
      
      const request = createMockRequest('192.168.1.7')
      
      // Should not throw and should allow request
      const response = await middleware(request)
      expect(response).toBeNull()
    })
  })

  describe('predefined configurations', () => {
    it('should have correct auth rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5)
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(60000)
    })

    it('should have correct API rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100)
      expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60000)
    })

    it('should have correct sensitive rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.sensitive.maxRequests).toBe(10)
      expect(RATE_LIMIT_CONFIGS.sensitive.windowMs).toBe(60000)
    })
  })

  describe('utility functions', () => {
    it('should get rate limit status', () => {
      const key = 'test-status-key'
      
      // Initially should return null
      let status = getRateLimitStatus(key)
      expect(status).toBeNull()
      
      // After resetting, should still be null
      resetRateLimit(key)
      status = getRateLimitStatus(key)
      expect(status).toBeNull()
    })

    it('should reset rate limit for specific key', () => {
      const key = 'test-reset-key'
      
      // Reset should not throw
      expect(() => resetRateLimit(key)).not.toThrow()
    })
  })

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 1
      })
      
      const request = createMockRequest('203.0.113.1')
      
      await middleware(request)
      
      // Create another request with different IP
      const request2 = createMockRequest('203.0.113.2')
      
      // Should be allowed since it's a different IP
      const response = await middleware(request2)
      expect(response).toBeNull()
    })

    it('should handle missing IP headers', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 5
      })
      
      const request = new NextRequest('http://localhost:3000/api/test')
      
      // Mock headers to return null
      vi.spyOn(request.headers, 'get').mockReturnValue(null)
      vi.spyOn(request.cookies, 'get').mockReturnValue(undefined)
      
      // Should not throw and should use 'unknown' as key
      const response = await middleware(request)
      expect(response).toBeNull()
    })
  })
})
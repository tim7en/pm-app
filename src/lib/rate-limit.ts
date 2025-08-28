/**
 * Rate Limiting Middleware for API endpoints
 * Provides configurable rate limiting based on IP address and user ID
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string    // Custom error message
  keyGenerator?: (request: NextRequest) => string | Promise<string>
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 5,         // 5 requests per minute
    message: 'Too many authentication attempts. Please try again later.'
  },
  api: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 100,       // 100 requests per minute
    message: 'Too many API requests. Please try again later.'
  },
  sensitive: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 10,        // 10 requests per minute
    message: 'Too many requests to sensitive endpoint. Please try again later.'
  }
} as const

/**
 * Default key generator using IP address
 */
function getDefaultKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'
  return ip
}

/**
 * Key generator that combines IP and user ID for authenticated requests
 */
export async function getAuthenticatedKey(request: NextRequest): Promise<string> {
  const ip = getDefaultKey(request)
  
  // Try to get user ID from auth token
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : request.cookies.get('auth-token')?.value

    if (token) {
      // Import here to avoid circular dependencies
      const { getAuthSession } = await import('./auth')
      const session = await getAuthSession(request)
      if (session?.user?.id) {
        return `${ip}:${session.user.id}`
      }
    }
  } catch (error) {
    // Fallback to IP-only if auth fails
    console.warn('Rate limit: Failed to get user ID, using IP only:', error)
  }
  
  return ip
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Clean up expired entries periodically
      if (Math.random() < 0.1) { // 10% chance to cleanup
        cleanupExpiredEntries()
      }

      // Generate rate limit key
      const key = config.keyGenerator 
        ? await config.keyGenerator(request)
        : getDefaultKey(request)

      const now = Date.now()
      const windowStart = now - config.windowMs

      // Get or create rate limit data for this key
      let rateLimitData = rateLimitStore.get(key)
      
      if (!rateLimitData || now > rateLimitData.resetTime) {
        // Create new window
        rateLimitData = {
          count: 1,
          resetTime: now + config.windowMs
        }
        rateLimitStore.set(key, rateLimitData)
        return null // Allow request
      }

      // Increment count
      rateLimitData.count++
      rateLimitStore.set(key, rateLimitData)

      // Check if limit exceeded
      if (rateLimitData.count > config.maxRequests) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000)
        
        return NextResponse.json(
          { 
            error: config.message || 'Too many requests',
            retryAfter: retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitData.resetTime.toString()
            }
          }
        )
      }

      // Add rate limit headers to successful requests
      const remaining = config.maxRequests - rateLimitData.count
      request.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      request.headers.set('X-RateLimit-Remaining', remaining.toString())
      request.headers.set('X-RateLimit-Reset', rateLimitData.resetTime.toString())

      return null // Allow request
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return null
    }
  }
}

/**
 * Rate limiting wrapper for API route handlers
 */
export function withRateLimit<T extends any[]>(
  config: RateLimitConfig,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimit(config)(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    return handler(request, ...args)
  }
}

/**
 * Predefined rate limit middleware for common use cases
 */
export const authRateLimit = rateLimit(RATE_LIMIT_CONFIGS.auth)
export const apiRateLimit = rateLimit(RATE_LIMIT_CONFIGS.api)
export const sensitiveRateLimit = rateLimit(RATE_LIMIT_CONFIGS.sensitive)

/**
 * Rate limit with authentication-aware key generation
 */
export const authenticatedRateLimit = rateLimit({
  ...RATE_LIMIT_CONFIGS.api,
  keyGenerator: getAuthenticatedKey
})

/**
 * Higher rate limit for authenticated users
 */
export const authenticatedApiRateLimit = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 200,       // 200 requests per minute for authenticated users
  message: 'Too many API requests. Please try again later.',
  keyGenerator: getAuthenticatedKey
})

/**
 * Strict rate limit for password reset and sensitive operations
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 3,         // 3 requests per minute
  message: 'Too many attempts. Please wait before trying again.'
})

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): {
  count: number
  resetTime: number
  isLimited: boolean
} | null {
  const data = rateLimitStore.get(key)
  if (!data || Date.now() > data.resetTime) {
    return null
  }
  
  return {
    count: data.count,
    resetTime: data.resetTime,
    isLimited: data.count > RATE_LIMIT_CONFIGS.api.maxRequests
  }
}

/**
 * Reset rate limit for a specific key (for testing or admin override)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Get all active rate limit entries (for monitoring)
 */
export function getAllRateLimitEntries(): Map<string, { count: number; resetTime: number }> {
  cleanupExpiredEntries()
  return new Map(rateLimitStore)
}
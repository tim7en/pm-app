/**
 * Centralized Error Handling System
 * Provides standardized error responses and comprehensive error tracking
 */

import { NextResponse } from 'next/server'
import { log } from './logger'
import { ZodError } from 'zod'

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    this.context = context

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: any[], context?: Record<string, any>) {
    super(message, 400, true, 'VALIDATION_ERROR', { ...context, errors })
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, true, 'AUTHENTICATION_ERROR', context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, true, 'AUTHORIZATION_ERROR', context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR', context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, 'CONFLICT_ERROR', context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: Record<string, any>) {
    super(message, 429, true, 'RATE_LIMIT_ERROR', context)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, 500, true, 'DATABASE_ERROR', context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, context?: Record<string, any>) {
    super(message || `External service ${service} is unavailable`, 502, true, 'EXTERNAL_SERVICE_ERROR', {
      ...context,
      service
    })
  }
}

// =============================================================================
// ERROR RESPONSE FORMATTING
// =============================================================================

interface ErrorResponse {
  error: string
  message: string
  code?: string
  statusCode: number
  timestamp: string
  requestId?: string
  details?: any
}

/**
 * Format error for API response
 */
function formatErrorResponse(
  error: Error | AppError,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse {
  const response: ErrorResponse = {
    error: error.name,
    message: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    requestId
  }

  if (error instanceof AppError) {
    response.code = error.code
    if (error.context) {
      response.details = error.context
    }
  }

  // Include stack trace in development
  if (includeStack && (process.env.NODE_ENV === 'development' || process.env.INCLUDE_ERROR_STACK === 'true')) {
    response.details = {
      ...response.details,
      stack: error.stack
    }
  }

  return response
}

// =============================================================================
// ERROR HANDLER MIDDLEWARE
// =============================================================================

/**
 * Central error handler for API routes
 */
export function handleApiError(
  error: Error | AppError,
  requestId?: string,
  context?: Record<string, any>
): NextResponse {
  // Log the error with context
  log.error('API Error occurred', error, {
    requestId,
    ...context,
    ...(error instanceof AppError ? error.context : {})
  })

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'Request validation failed',
      error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    )
    
    return NextResponse.json(
      formatErrorResponse(validationError, requestId),
      { status: validationError.statusCode }
    )
  }

  // Handle known application errors
  if (error instanceof AppError) {
    // Don't log operational errors as errors (they're expected)
    if (error.isOperational && error.statusCode < 500) {
      log.warn('Operational error', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        requestId,
        ...context
      })
    }

    return NextResponse.json(
      formatErrorResponse(error, requestId),
      { status: error.statusCode }
    )
  }

  // Handle Prisma errors
  if (error.message.includes('Prisma') || error.message.includes('PrismaClient')) {
    const dbError = new DatabaseError('Database operation failed', {
      originalError: error.message
    })
    
    return NextResponse.json(
      formatErrorResponse(dbError, requestId),
      { status: dbError.statusCode }
    )
  }

  // Handle unknown errors
  const unknownError = new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    500,
    false,
    'INTERNAL_ERROR'
  )

  // Log unknown errors as errors
  log.error('Unknown error occurred', error, {
    requestId,
    ...context
  })

  return NextResponse.json(
    formatErrorResponse(unknownError, requestId, process.env.NODE_ENV !== 'production'),
    { status: 500 }
  )
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()
    
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(
        error as Error,
        requestId,
        {
          method: (args[0] as any)?.method,
          url: (args[0] as any)?.url
        }
      )
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Assert condition and throw error if false
 */
export function assert(condition: any, message: string, ErrorClass = AppError): asserts condition {
  if (!condition) {
    throw new ErrorClass(message)
  }
}

/**
 * Assert resource exists and throw NotFoundError if null/undefined
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): asserts resource is T {
  if (resource === null || resource === undefined) {
    throw new NotFoundError(resourceName)
  }
}

/**
 * Assert user has permission and throw AuthorizationError if false
 */
export function assertPermission(
  hasPermission: boolean,
  message: string = 'Insufficient permissions'
): asserts hasPermission {
  if (!hasPermission) {
    throw new AuthorizationError(message)
  }
}

/**
 * Safely execute async function and return result or error
 */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Wrap database operations with proper error handling
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    log.database(`Database operation failed: ${operationName || 'unknown'}`, {
      error: error instanceof Error ? error.message : String(error)
    })
    
    throw new DatabaseError(
      `Database operation failed${operationName ? `: ${operationName}` : ''}`,
      { originalError: error instanceof Error ? error.message : String(error) }
    )
  }
}

// =============================================================================
// ERROR MONITORING HELPERS
// =============================================================================

/**
 * Track error metrics (prepare for external monitoring services)
 */
export function trackError(error: Error | AppError, context?: Record<string, any>): void {
  // Log error for internal monitoring
  log.error('Error tracked for monitoring', error, {
    monitoring: true,
    ...context
  })

  // TODO: Integrate with external error tracking service (Sentry, etc.)
  // Example:
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context })
  // }
}

/**
 * Report critical errors that require immediate attention
 */
export function reportCriticalError(error: Error | AppError, context?: Record<string, any>): void {
  log.error('CRITICAL ERROR REPORTED', error, {
    critical: true,
    alert: true,
    ...context
  })

  // TODO: Integrate with alerting system
  // Example: send to Slack, PagerDuty, etc.
}

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Create error with development-friendly message
 */
export function createDevError(message: string, context?: Record<string, any>): AppError {
  return new AppError(
    process.env.NODE_ENV === 'development' 
      ? `[DEV] ${message}` 
      : 'Internal server error',
    500,
    false,
    'DEVELOPMENT_ERROR',
    context
  )
}

/**
 * Log and throw error for impossible code paths
 */
export function impossibleError(message: string = 'This should never happen'): never {
  const error = new AppError(message, 500, false, 'IMPOSSIBLE_ERROR')
  log.error('Impossible error occurred', error)
  throw error
}

// Export commonly used errors
export {
  AppError as BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
}
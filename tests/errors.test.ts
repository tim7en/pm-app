/**
 * Unit tests for error handling functionality
 */

import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { 
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  handleApiError,
  withErrorHandling,
  assert,
  assertExists,
  assertPermission,
  safeAsync
} from '../src/lib/errors'
import { ZodError } from 'zod'

describe('Error Handling', () => {
  describe('AppError class', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 400, true, 'TEST_ERROR', { test: true })
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.context).toEqual({ test: true })
      expect(error.name).toBe('AppError')
    })

    it('should have default values', () => {
      const error = new AppError('Test error')
      
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
      expect(error.code).toBeUndefined()
      expect(error.context).toBeUndefined()
    })
  })

  describe('Specific error classes', () => {
    it('should create ValidationError correctly', () => {
      const error = new ValidationError('Validation failed', [{ field: 'email', message: 'Invalid' }])
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.context?.errors).toEqual([{ field: 'email', message: 'Invalid' }])
    })

    it('should create AuthenticationError correctly', () => {
      const error = new AuthenticationError()
      
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should create AuthorizationError correctly', () => {
      const error = new AuthorizationError()
      
      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })

    it('should create NotFoundError correctly', () => {
      const error = new NotFoundError('User')
      
      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND_ERROR')
    })
  })

  describe('handleApiError', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Validation failed')
      const response = handleApiError(error)
      
      expect(response.status).toBe(400)
    })

    it('should handle ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number'
        }
      ])
      
      const response = handleApiError(zodError)
      expect(response.status).toBe(400)
    })

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error')
      const response = handleApiError(error)
      
      expect(response.status).toBe(500)
    })

    it('should handle Prisma errors', () => {
      const error = new Error('PrismaClient connection failed')
      const response = handleApiError(error)
      
      expect(response.status).toBe(500)
    })

    it('should include request ID in response', async () => {
      const error = new ValidationError('Test error')
      const response = handleApiError(error, 'req-123')
      
      const body = await response.json()
      expect(body.requestId).toBe('req-123')
    })
  })

  describe('withErrorHandling wrapper', () => {
    it('should handle successful requests', async () => {
      const handler = withErrorHandling(async (request: NextRequest) => {
        return NextResponse.json({ success: true })
      })
      
      const request = new NextRequest('http://localhost/api/test')
      const response = await handler(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should handle thrown errors', async () => {
      const handler = withErrorHandling(async (request: NextRequest) => {
        throw new ValidationError('Test validation error')
      })
      
      const request = new NextRequest('http://localhost/api/test')
      const response = await handler(request)
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('Test validation error')
    })

    it('should handle unknown errors', async () => {
      const handler = withErrorHandling(async (request: NextRequest) => {
        throw new Error('Unknown error')
      })
      
      const request = new NextRequest('http://localhost/api/test')
      const response = await handler(request)
      
      expect(response.status).toBe(500)
    })
  })

  describe('Assertion functions', () => {
    describe('assert', () => {
      it('should not throw for truthy values', () => {
        expect(() => assert(true, 'Should not throw')).not.toThrow()
        expect(() => assert(1, 'Should not throw')).not.toThrow()
        expect(() => assert('string', 'Should not throw')).not.toThrow()
      })

      it('should throw AppError for falsy values', () => {
        expect(() => assert(false, 'Should throw')).toThrow(AppError)
        expect(() => assert(0, 'Should throw')).toThrow(AppError)
        expect(() => assert('', 'Should throw')).toThrow(AppError)
        expect(() => assert(null, 'Should throw')).toThrow(AppError)
        expect(() => assert(undefined, 'Should throw')).toThrow(AppError)
      })

      it('should use custom error class', () => {
        expect(() => assert(false, 'Auth error', AuthenticationError)).toThrow(AuthenticationError)
      })
    })

    describe('assertExists', () => {
      it('should not throw for non-null values', () => {
        expect(() => assertExists('value', 'Resource')).not.toThrow()
        expect(() => assertExists(0, 'Resource')).not.toThrow()
        expect(() => assertExists(false, 'Resource')).not.toThrow()
      })

      it('should throw NotFoundError for null/undefined', () => {
        expect(() => assertExists(null, 'User')).toThrow(NotFoundError)
        expect(() => assertExists(undefined, 'Project')).toThrow(NotFoundError)
      })

      it('should use correct resource name in error', () => {
        try {
          assertExists(null, 'Custom Resource')
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error.message).toBe('Custom Resource not found')
        }
      })
    })

    describe('assertPermission', () => {
      it('should not throw for true permission', () => {
        expect(() => assertPermission(true)).not.toThrow()
      })

      it('should throw AuthorizationError for false permission', () => {
        expect(() => assertPermission(false)).toThrow(AuthorizationError)
      })

      it('should use custom message', () => {
        try {
          assertPermission(false, 'Custom permission error')
          expect.fail('Should have thrown')
        } catch (error) {
          expect(error.message).toBe('Custom permission error')
        }
      })
    })
  })

  describe('safeAsync', () => {
    it('should return data for successful operations', async () => {
      const result = await safeAsync(async () => {
        return 'success'
      })
      
      expect(result.data).toBe('success')
      expect(result.error).toBeUndefined()
    })

    it('should return error for failed operations', async () => {
      const testError = new Error('Test error')
      const result = await safeAsync(async () => {
        throw testError
      })
      
      expect(result.data).toBeUndefined()
      expect(result.error).toBe(testError)
    })

    it('should handle Promise rejections', async () => {
      const result = await safeAsync(async () => {
        return Promise.reject(new Error('Rejected'))
      })
      
      expect(result.data).toBeUndefined()
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toBe('Rejected')
    })
  })
})
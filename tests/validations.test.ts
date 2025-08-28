/**
 * Unit tests for validation schemas
 */

import { describe, it, expect } from 'vitest'
import { 
  loginSchema, 
  registerSchema, 
  taskCreateSchema,
  projectCreateSchema,
  validateRequestBody,
  validateQueryParams
} from '../src/lib/validations'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.parse(validData)
      expect(result.email).toBe('test@example.com')
      expect(result.password).toBe('password123')
    })

    it('should normalize email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      }
      
      const result = loginSchema.parse(data)
      expect(result.email).toBe('test@example.com')
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      expect(() => loginSchema.parse(data)).toThrow()
    })

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: ''
      }
      
      expect(() => loginSchema.parse(data)).toThrow()
    })

    it('should reject password that is too long', () => {
      const data = {
        email: 'test@example.com',
        password: 'a'.repeat(129) // 129 characters
      }
      
      expect(() => loginSchema.parse(data)).toThrow()
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      }
      
      const result = registerSchema.parse(validData)
      expect(result.email).toBe('test@example.com')
      expect(result.password).toBe('Password123!')
      expect(result.name).toBe('Test User')
    })

    it('should reject weak passwords', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      }
      
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it('should require password with uppercase, lowercase, and number', () => {
      const invalidPasswords = [
        'lowercase123',  // no uppercase
        'UPPERCASE123',  // no lowercase
        'PasswordABC',   // no number
        'Password123'    // valid
      ]
      
      const baseData = {
        email: 'test@example.com',
        name: 'Test User'
      }

      // First three should fail
      invalidPasswords.slice(0, 3).forEach(password => {
        expect(() => registerSchema.parse({ ...baseData, password })).toThrow()
      })

      // Last one should pass
      expect(() => registerSchema.parse({ ...baseData, password: invalidPasswords[3] })).not.toThrow()
    })

    it('should trim and validate name', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '  Test User  '
      }
      
      const result = registerSchema.parse(data)
      expect(result.name).toBe('Test User')
    })
  })

  describe('taskCreateSchema', () => {
    it('should validate correct task data', () => {
      const validData = {
        title: 'Test Task',
        description: 'Task description',
        projectId: 'clv1234567890abcdef',
        priority: 'HIGH',
        dueDate: '2024-12-31T23:59:59.000Z'
      }
      
      const result = taskCreateSchema.parse(validData)
      expect(result.title).toBe('Test Task')
      expect(result.priority).toBe('HIGH')
    })

    it('should default priority to MEDIUM', () => {
      const data = {
        title: 'Test Task',
        projectId: 'clv1234567890abcdef'
      }
      
      const result = taskCreateSchema.parse(data)
      expect(result.priority).toBe('MEDIUM')
    })

    it('should reject invalid projectId format', () => {
      const data = {
        title: 'Test Task',
        projectId: 'invalid-id'
      }
      
      expect(() => taskCreateSchema.parse(data)).toThrow()
    })

    it('should reject title that is too long', () => {
      const data = {
        title: 'a'.repeat(201), // 201 characters
        projectId: 'clv1234567890abcdef'
      }
      
      expect(() => taskCreateSchema.parse(data)).toThrow()
    })

    it('should validate assigneeIds array', () => {
      const data = {
        title: 'Test Task',
        projectId: 'clv1234567890abcdef',
        assigneeIds: ['clv1234567890abcdef', 'clv0987654321fedcba']
      }
      
      const result = taskCreateSchema.parse(data)
      expect(result.assigneeIds).toHaveLength(2)
    })

    it('should reject too many assignees', () => {
      const data = {
        title: 'Test Task',
        projectId: 'clv1234567890abcdef',
        assigneeIds: Array(11).fill('clv1234567890abcdef') // 11 assignees (max is 10)
      }
      
      expect(() => taskCreateSchema.parse(data)).toThrow()
    })
  })

  describe('projectCreateSchema', () => {
    it('should validate correct project data', () => {
      const validData = {
        name: 'Test Project',
        description: 'Project description',
        workspaceId: 'clv1234567890abcdef',
        color: '#FF5733'
      }
      
      const result = projectCreateSchema.parse(validData)
      expect(result.name).toBe('Test Project')
      expect(result.color).toBe('#FF5733')
    })

    it('should default color', () => {
      const data = {
        name: 'Test Project',
        workspaceId: 'clv1234567890abcdef'
      }
      
      const result = projectCreateSchema.parse(data)
      expect(result.color).toBe('#3b82f6')
    })

    it('should reject invalid color format', () => {
      const data = {
        name: 'Test Project',
        workspaceId: 'clv1234567890abcdef',
        color: 'red' // invalid format
      }
      
      expect(() => projectCreateSchema.parse(data)).toThrow()
    })
  })

  describe('validateRequestBody', () => {
    it('should return parsed data for valid input', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = validateRequestBody(loginSchema, data)
      expect(result.email).toBe('test@example.com')
    })

    it('should throw validation error for invalid input', () => {
      const data = {
        email: 'invalid-email',
        password: ''
      }
      
      expect(() => validateRequestBody(loginSchema, data)).toThrow('Validation failed')
    })

    it('should include field names in error message', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      try {
        validateRequestBody(loginSchema, data)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error.message).toContain('email')
        expect(error.message).toContain('Invalid email format')
      }
    })
  })

  describe('validateQueryParams', () => {
    it('should validate query parameters', () => {
      const querySchema = loginSchema.pick({ email: true })
      const params = { email: 'test@example.com' }
      
      const result = validateQueryParams(querySchema, params)
      expect(result.email).toBe('test@example.com')
    })

    it('should throw error for invalid query params', () => {
      const querySchema = loginSchema.pick({ email: true })
      const params = { email: 'invalid-email' }
      
      expect(() => validateQueryParams(querySchema, params)).toThrow('Query validation failed')
    })
  })
})
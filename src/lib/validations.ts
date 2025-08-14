/**
 * Zod validation schemas for API endpoints
 * Provides centralized input validation and type safety
 */

import { z } from 'zod'

// =============================================================================
// AUTH VALIDATIONS
// =============================================================================

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
})

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
})

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim()
})

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(128, 'Invalid token'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
})

// =============================================================================
// TASK VALIDATIONS
// =============================================================================

export const taskCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .trim(),
  description: z.string()
    .max(2000, 'Description too long')
    .optional()
    .nullable(),
  projectId: z.string()
    .min(1, 'Project ID is required')
    .cuid('Invalid project ID format'),
  assigneeId: z.string()
    .cuid('Invalid assignee ID format')
    .optional()
    .nullable(),
  assigneeIds: z.array(z.string().cuid('Invalid assignee ID format'))
    .max(10, 'Too many assignees')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .default('MEDIUM'),
  dueDate: z.string()
    .datetime('Invalid date format')
    .optional()
    .nullable(),
  sectionId: z.string()
    .cuid('Invalid section ID format')
    .optional()
    .nullable(),
  estimatedHours: z.number()
    .min(0, 'Estimated hours must be positive')
    .max(1000, 'Estimated hours too large')
    .optional()
    .nullable()
})

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string().cuid('Invalid task ID format'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'AWAITING_VERIFICATION', 'VERIFIED', 'DONE', 'REJECTED'])
    .optional(),
  completedAt: z.string()
    .datetime('Invalid date format')
    .optional()
    .nullable(),
  actualHours: z.number()
    .min(0, 'Actual hours must be positive')
    .max(1000, 'Actual hours too large')
    .optional()
    .nullable()
})

// =============================================================================
// PROJECT VALIDATIONS
// =============================================================================

export const projectCreateSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .trim(),
  description: z.string()
    .max(1000, 'Description too long')
    .optional()
    .nullable(),
  workspaceId: z.string()
    .min(1, 'Workspace ID is required')
    .cuid('Invalid workspace ID format'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional()
    .default('#3b82f6'),
  startDate: z.string()
    .datetime('Invalid date format')
    .optional()
    .nullable(),
  dueDate: z.string()
    .datetime('Invalid date format')
    .optional()
    .nullable()
})

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'])
    .optional()
})

// =============================================================================
// WORKSPACE VALIDATIONS
// =============================================================================

export const workspaceCreateSchema = z.object({
  name: z.string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name too long')
    .trim(),
  description: z.string()
    .max(500, 'Description too long')
    .optional()
    .nullable()
})

export const workspaceUpdateSchema = workspaceCreateSchema.partial()

export const workspaceInviteSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim(),
  role: z.enum(['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'PROJECT_OFFICER', 'MEMBER', 'GUEST'])
    .default('MEMBER')
})

// =============================================================================
// COMMENT VALIDATIONS
// =============================================================================

export const commentCreateSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment too long')
    .trim(),
  taskId: z.string()
    .min(1, 'Task ID is required')
    .cuid('Invalid task ID format')
})

export const commentUpdateSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment too long')
    .trim()
})

// =============================================================================
// CALENDAR VALIDATIONS
// =============================================================================

export const calendarEventCreateSchema = z.object({
  title: z.string()
    .min(1, 'Event title is required')
    .max(200, 'Title too long')
    .trim(),
  description: z.string()
    .max(1000, 'Description too long')
    .optional()
    .nullable(),
  startTime: z.string()
    .datetime('Invalid start time format'),
  endTime: z.string()
    .datetime('Invalid end time format'),
  type: z.enum(['MEETING', 'CALL', 'DEADLINE', 'REMINDER']),
  location: z.string()
    .max(200, 'Location too long')
    .optional()
    .nullable(),
  workspaceId: z.string()
    .min(1, 'Workspace ID is required')
    .cuid('Invalid workspace ID format'),
  projectId: z.string()
    .cuid('Invalid project ID format')
    .optional()
    .nullable(),
  attendeeIds: z.array(z.string().cuid('Invalid attendee ID format'))
    .max(50, 'Too many attendees')
    .optional()
    .default([])
}).refine((data) => {
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)
  return endTime > startTime
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export const calendarEventUpdateSchema = calendarEventCreateSchema.partial()

// =============================================================================
// PROFILE VALIDATIONS
// =============================================================================

export const profileUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
    .optional(),
  company: z.string()
    .max(100, 'Company name too long')
    .trim()
    .optional()
    .nullable(),
  position: z.string()
    .max(100, 'Position too long')
    .trim()
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .max(20, 'Phone number too long')
    .optional()
    .nullable(),
  location: z.string()
    .max(100, 'Location too long')
    .trim()
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, 'Bio too long')
    .trim()
    .optional()
    .nullable(),
  timezone: z.string()
    .max(50, 'Timezone too long')
    .optional()
    .nullable(),
  language: z.string()
    .max(10, 'Language code too long')
    .optional()
    .nullable()
})

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: Record<string, string | string[] | undefined>): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Query validation failed: ${errorMessages}`)
    }
    throw error
  }
}

// Export types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type WorkspaceCreateInput = z.infer<typeof workspaceCreateSchema>
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>
export type WorkspaceInviteInput = z.infer<typeof workspaceInviteSchema>
export type CommentCreateInput = z.infer<typeof commentCreateSchema>
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>
export type CalendarEventCreateInput = z.infer<typeof calendarEventCreateSchema>
export type CalendarEventUpdateInput = z.infer<typeof calendarEventUpdateSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
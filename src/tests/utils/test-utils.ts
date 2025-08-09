/**
 * Test utilities for PM App
 */

export const testUtils = {
  // Mock API responses
  mockSuccessResponse: (data: any) => ({
    ok: true,
    status: 200,
    json: async () => data,
  }),

  mockErrorResponse: (status: number, message: string) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
  }),

  // Test data generators
  generateUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }),

  generateProject: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test project description',
    ...overrides,
  }),

  generateTask: (overrides = {}) => ({
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test task description',
    status: 'TODO',
    ...overrides,
  }),
}
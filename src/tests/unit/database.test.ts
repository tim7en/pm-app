import { describe, it, expect, vi } from 'vitest'

// Mock Prisma to avoid database dependency in unit tests
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  }))
}))

describe('Database Layer Structure', () => {
  it('should have proper exports', async () => {
    // Test that our database module exports exist
    const dbModule = await import('@/lib/database')
    
    expect(dbModule.dbUtils).toBeDefined()
    expect(typeof dbModule.dbUtils.healthCheck).toBe('function')
    expect(typeof dbModule.dbUtils.disconnect).toBe('function')
    expect(typeof dbModule.dbUtils.transaction).toBe('function')
  })
})
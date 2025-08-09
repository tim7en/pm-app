import { describe, it, expect } from 'vitest'
import { dbUtils } from '@/lib/database'

describe('Database Layer', () => {
  it('should have a health check function', () => {
    expect(dbUtils.healthCheck).toBeDefined()
    expect(typeof dbUtils.healthCheck).toBe('function')
  })

  it('should have a disconnect function', () => {
    expect(dbUtils.disconnect).toBeDefined()
    expect(typeof dbUtils.disconnect).toBe('function')
  })

  it('should have a transaction wrapper', () => {
    expect(dbUtils.transaction).toBeDefined()
    expect(typeof dbUtils.transaction).toBe('function')
  })
})
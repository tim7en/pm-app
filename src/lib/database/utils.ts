import { db } from './client'

export const dbUtils = {
  // Health check for database connection
  async healthCheck() {
    try {
      await db.$queryRaw`SELECT 1`
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }
    }
  },

  // Graceful shutdown
  async disconnect() {
    await db.$disconnect()
  },

  // Transaction wrapper
  async transaction<T>(fn: (db: typeof db) => Promise<T>): Promise<T> {
    return await db.$transaction(fn)
  }
}
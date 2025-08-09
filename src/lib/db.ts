import { PrismaClient } from '@prisma/client'
import { config, isDev } from '../../config/environment'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.database.logging ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: config.database.url
      }
    }
  })

if (isDev()) globalForPrisma.prisma = db
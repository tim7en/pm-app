// Try to import from @prisma/client, fall back to mock if not available
let PrismaClient: any
try {
  PrismaClient = require('@prisma/client').PrismaClient
} catch (error) {
  console.log('Using mock Prisma client for build compatibility')
  PrismaClient = require('./prisma-mock').PrismaClient
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

// Safe environment check
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
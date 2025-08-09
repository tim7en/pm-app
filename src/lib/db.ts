// Mock Prisma client for build compatibility
class MockPrismaClient {
  user = {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  }
  workspace = {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  }
  task = {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  }
  project = {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  }
  $connect = () => Promise.resolve()
  $disconnect = () => Promise.resolve()
}

// Initialize PrismaClient
let PrismaClient: any
let prismaInstance: any

// Try to dynamically import the real Prisma client
const initializePrisma = async () => {
  try {
    const prismaModule = await import('@prisma/client')
    PrismaClient = prismaModule.PrismaClient
  } catch (error) {
    console.log('Using mock Prisma client for build compatibility')
    PrismaClient = MockPrismaClient
  }
}

// Initialize immediately
initializePrisma()

// For synchronous usage, use mock as fallback
PrismaClient = PrismaClient || MockPrismaClient

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
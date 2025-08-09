import { PrismaClient } from '@prisma/client'

declare global {
  var __db: PrismaClient | undefined
}

export const db = globalThis.__db || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__db = db
}
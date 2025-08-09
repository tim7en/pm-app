// Database connection and client management
export { db } from './client'

// Database types and schemas
export type { 
  User, 
  Workspace, 
  Project, 
  Task, 
  Comment, 
  Notification,
  TeamMember,
  Message
} from '@prisma/client'

// Database utilities and helpers
export * from './utils'
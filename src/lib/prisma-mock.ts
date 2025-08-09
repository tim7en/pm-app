// Mock Prisma client types for build compatibility when Prisma client cannot be generated
// This file provides essential type definitions to allow TypeScript compilation

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS', 
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProjectRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OWNER = 'OWNER'
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  PROJECT_INVITE = 'PROJECT_INVITE',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  COMMENT_ADDED = 'COMMENT_ADDED'
}

export enum TaskVerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Mock PrismaClient class
export class PrismaClient {
  user: any = {}
  project: any = {}
  task: any = {}
  comment: any = {}
  workspace: any = {}
  notification: any = {}
  projectMember: any = {}
  
  constructor() {
    // Mock implementation
  }
  
  $connect() {
    return Promise.resolve()
  }
  
  $disconnect() {
    return Promise.resolve()
  }
}
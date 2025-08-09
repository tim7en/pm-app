// Mock Prisma client types for build compatibility when Prisma client cannot be generated
// This file provides essential type definitions to allow TypeScript compilation

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS', 
  REVIEW = 'REVIEW',
  AWAITING_VERIFICATION = 'AWAITING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  DONE = 'DONE',
  REJECTED = 'REJECTED'
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
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OFFICER = 'OFFICER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PROJECT_OFFICER = 'PROJECT_OFFICER',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_VERIFICATION_REQUIRED = 'TASK_VERIFICATION_REQUIRED',
  TASK_VERIFIED = 'TASK_VERIFIED',
  TASK_REJECTED = 'TASK_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  PROJECT_INVITE = 'PROJECT_INVITE',
  WORKSPACE_INVITE = 'WORKSPACE_INVITE',
  WORKSPACE_REMOVED = 'WORKSPACE_REMOVED',
  ROLE_CHANGE = 'ROLE_CHANGE',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  MESSAGE = 'MESSAGE'
}

export enum TaskVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
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
// Temporary types for Prisma client when generation is not available

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
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  PROJECT_INVITATION = 'PROJECT_INVITATION',
  WORKSPACE_INVITATION = 'WORKSPACE_INVITATION',
  TEAM_MEMBER_INACTIVE = 'TEAM_MEMBER_INACTIVE',
  SMART_NOTIFICATION = 'SMART_NOTIFICATION'
}
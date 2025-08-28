-- Migration to add performance indexes
-- This script adds indexes on frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks"("projectId");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks"("assigneeId");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "tasks_created_at_idx" ON "tasks"("createdAt");
CREATE INDEX IF NOT EXISTS "tasks_creator_id_idx" ON "tasks"("creatorId");

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS "tasks_project_status_idx" ON "tasks"("projectId", "status");
CREATE INDEX IF NOT EXISTS "tasks_assignee_status_idx" ON "tasks"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "tasks_project_priority_idx" ON "tasks"("projectId", "priority");

-- Projects table indexes
CREATE INDEX IF NOT EXISTS "projects_workspace_id_idx" ON "projects"("workspaceId");
CREATE INDEX IF NOT EXISTS "projects_owner_id_idx" ON "projects"("ownerId");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status");

-- Workspace members table indexes
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members"("userId");
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members"("workspaceId");

-- Project members table indexes  
CREATE INDEX IF NOT EXISTS "project_members_user_id_idx" ON "project_members"("userId");
CREATE INDEX IF NOT EXISTS "project_members_project_id_idx" ON "project_members"("projectId");

-- Task assignees table indexes
CREATE INDEX IF NOT EXISTS "task_assignees_task_id_idx" ON "task_assignees"("taskId");
CREATE INDEX IF NOT EXISTS "task_assignees_user_id_idx" ON "task_assignees"("userId");

-- Comments table indexes
CREATE INDEX IF NOT EXISTS "comments_task_id_idx" ON "comments"("taskId");
CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments"("createdAt");

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications"("userId", "isRead");

-- Calendar events table indexes
CREATE INDEX IF NOT EXISTS "calendar_events_workspace_id_idx" ON "calendar_events"("workspaceId");
CREATE INDEX IF NOT EXISTS "calendar_events_creator_id_idx" ON "calendar_events"("creatorId");
CREATE INDEX IF NOT EXISTS "calendar_events_start_time_idx" ON "calendar_events"("startTime");
CREATE INDEX IF NOT EXISTS "calendar_events_project_id_idx" ON "calendar_events"("projectId");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("senderId");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages"("createdAt");

-- Bug reports table indexes
CREATE INDEX IF NOT EXISTS "bug_reports_reported_by_idx" ON "bug_reports"("reportedBy");
CREATE INDEX IF NOT EXISTS "bug_reports_assigned_to_idx" ON "bug_reports"("assignedTo");
CREATE INDEX IF NOT EXISTS "bug_reports_status_idx" ON "bug_reports"("status");
CREATE INDEX IF NOT EXISTS "bug_reports_priority_idx" ON "bug_reports"("priority");
CREATE INDEX IF NOT EXISTS "bug_reports_created_at_idx" ON "bug_reports"("createdAt");

-- Activity logs table indexes
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_type_idx" ON "activity_logs"("type");
CREATE INDEX IF NOT EXISTS "activity_logs_cleared_at_idx" ON "activity_logs"("clearedAt");

-- Workspace invitations table indexes
CREATE INDEX IF NOT EXISTS "workspace_invitations_email_idx" ON "workspace_invitations"("email");
CREATE INDEX IF NOT EXISTS "workspace_invitations_workspace_id_idx" ON "workspace_invitations"("workspaceId");
CREATE INDEX IF NOT EXISTS "workspace_invitations_status_idx" ON "workspace_invitations"("status");
CREATE INDEX IF NOT EXISTS "workspace_invitations_expires_at_idx" ON "workspace_invitations"("expiresAt");

-- Integrations table indexes
CREATE INDEX IF NOT EXISTS "integrations_user_id_idx" ON "integrations"("userId");
CREATE INDEX IF NOT EXISTS "integrations_type_idx" ON "integrations"("type");
CREATE INDEX IF NOT EXISTS "integrations_is_active_idx" ON "integrations"("isActive");

-- Performance optimization for auth queries
CREATE INDEX IF NOT EXISTS "users_email_password_idx" ON "users"("email", "password");
CREATE INDEX IF NOT EXISTS "users_failed_attempts_idx" ON "users"("failedLoginAttempts");
CREATE INDEX IF NOT EXISTS "users_locked_until_idx" ON "users"("lockedUntil");

-- Indexes for soft delete patterns (for future implementation)
-- These are commented out as soft deletes aren't implemented yet
-- CREATE INDEX IF NOT EXISTS "tasks_deleted_at_idx" ON "tasks"("deletedAt") WHERE "deletedAt" IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS "projects_deleted_at_idx" ON "projects"("deletedAt") WHERE "deletedAt" IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS "workspaces_deleted_at_idx" ON "workspaces"("deletedAt") WHERE "deletedAt" IS NOT NULL;
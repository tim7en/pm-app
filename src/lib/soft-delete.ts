/**
 * Soft Delete Utility for Database Operations
 * Provides consistent soft delete functionality across the application
 */

import { db } from './db'
import { log } from './logger'

/**
 * Soft delete configuration for different models
 */
interface SoftDeleteConfig {
  deletedAtField: string
  cascadeDeletes?: {
    model: string
    foreignKey: string
    config?: SoftDeleteConfig
  }[]
}

const SOFT_DELETE_CONFIGS: Record<string, SoftDeleteConfig> = {
  user: {
    deletedAtField: 'deletedAt',
    cascadeDeletes: [
      {
        model: 'task',
        foreignKey: 'creatorId'
      },
      {
        model: 'comment',
        foreignKey: 'userId'
      },
      {
        model: 'notification',
        foreignKey: 'userId'
      }
    ]
  },
  workspace: {
    deletedAtField: 'deletedAt',
    cascadeDeletes: [
      {
        model: 'project',
        foreignKey: 'workspaceId'
      },
      {
        model: 'workspaceMember',
        foreignKey: 'workspaceId'
      },
      {
        model: 'calendarEvent',
        foreignKey: 'workspaceId'
      }
    ]
  },
  project: {
    deletedAtField: 'deletedAt',
    cascadeDeletes: [
      {
        model: 'task',
        foreignKey: 'projectId'
      },
      {
        model: 'section',
        foreignKey: 'projectId'
      },
      {
        model: 'projectMember',
        foreignKey: 'projectId'
      }
    ]
  },
  task: {
    deletedAtField: 'deletedAt',
    cascadeDeletes: [
      {
        model: 'comment',
        foreignKey: 'taskId'
      },
      {
        model: 'subTask',
        foreignKey: 'taskId'
      },
      {
        model: 'taskTag',
        foreignKey: 'taskId'
      },
      {
        model: 'taskAttachment',
        foreignKey: 'taskId'
      }
    ]
  }
}

/**
 * Soft delete a record by setting deletedAt timestamp
 */
export async function softDelete(
  model: string,
  where: Record<string, any>,
  options: {
    cascade?: boolean
    deletedBy?: string
    reason?: string
  } = {}
): Promise<any> {
  const { cascade = true, deletedBy, reason } = options
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    throw new Error(`Soft delete not configured for model: ${model}`)
  }

  const deletedAt = new Date()

  try {
    log.info(`Soft deleting ${model}`, {
      model,
      where,
      deletedBy,
      reason,
      cascade
    })

    // Get the record before deletion for cascade operations
    let record = null
    if (cascade && config.cascadeDeletes?.length > 0) {
      record = await (db as any)[model].findFirst({ where })
      if (!record) {
        throw new Error(`Record not found for soft delete: ${model}`)
      }
    }

    // Perform soft delete on main record
    const deleteData: Record<string, any> = {
      [config.deletedAtField]: deletedAt
    }

    // Add metadata if provided
    if (deletedBy) {
      deleteData.deletedBy = deletedBy
    }
    if (reason) {
      deleteData.deleteReason = reason
    }

    const result = await (db as any)[model].update({
      where,
      data: deleteData
    })

    // Perform cascade soft deletes
    if (cascade && config.cascadeDeletes && record) {
      for (const cascadeConfig of config.cascadeDeletes) {
        try {
          await softDelete(
            cascadeConfig.model,
            { [cascadeConfig.foreignKey]: record.id },
            { cascade: true, deletedBy, reason: `Cascade from ${model}` }
          )
        } catch (error) {
          log.warn(`Failed to cascade delete ${cascadeConfig.model}`, {
            model: cascadeConfig.model,
            foreignKey: cascadeConfig.foreignKey,
            parentId: record.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    log.info(`Soft delete completed for ${model}`, {
      model,
      recordId: result.id,
      deletedAt,
      cascade
    })

    return result
  } catch (error) {
    log.error(`Soft delete failed for ${model}`, error, {
      model,
      where,
      deletedBy,
      reason
    })
    throw error
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreSoftDeleted(
  model: string,
  where: Record<string, any>,
  options: {
    cascade?: boolean
    restoredBy?: string
    reason?: string
  } = {}
): Promise<any> {
  const { cascade = false, restoredBy, reason } = options
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    throw new Error(`Soft delete not configured for model: ${model}`)
  }

  try {
    log.info(`Restoring soft-deleted ${model}`, {
      model,
      where,
      restoredBy,
      reason,
      cascade
    })

    // Get the record before restoration for cascade operations
    let record = null
    if (cascade && config.cascadeDeletes?.length > 0) {
      record = await (db as any)[model].findFirst({
        where: {
          ...where,
          [config.deletedAtField]: { not: null }
        }
      })
      if (!record) {
        throw new Error(`Soft-deleted record not found for restore: ${model}`)
      }
    }

    // Restore main record
    const restoreData: Record<string, any> = {
      [config.deletedAtField]: null,
      restoredAt: new Date()
    }

    if (restoredBy) {
      restoreData.restoredBy = restoredBy
    }
    if (reason) {
      restoreData.restoreReason = reason
    }

    const result = await (db as any)[model].update({
      where: {
        ...where,
        [config.deletedAtField]: { not: null }
      },
      data: restoreData
    })

    // Perform cascade restores
    if (cascade && config.cascadeDeletes && record) {
      for (const cascadeConfig of config.cascadeDeletes) {
        try {
          await restoreSoftDeleted(
            cascadeConfig.model,
            { [cascadeConfig.foreignKey]: record.id },
            { cascade: true, restoredBy, reason: `Cascade from ${model}` }
          )
        } catch (error) {
          log.warn(`Failed to cascade restore ${cascadeConfig.model}`, {
            model: cascadeConfig.model,
            foreignKey: cascadeConfig.foreignKey,
            parentId: record.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    log.info(`Restore completed for ${model}`, {
      model,
      recordId: result.id,
      restoredAt: new Date(),
      cascade
    })

    return result
  } catch (error) {
    log.error(`Restore failed for ${model}`, error, {
      model,
      where,
      restoredBy,
      reason
    })
    throw error
  }
}

/**
 * Permanently delete soft-deleted records older than specified days
 */
export async function cleanupSoftDeleted(
  model: string,
  olderThanDays: number = 30,
  options: {
    batchSize?: number
    dryRun?: boolean
  } = {}
): Promise<{ deleted: number; records: any[] }> {
  const { batchSize = 100, dryRun = false } = options
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    throw new Error(`Soft delete not configured for model: ${model}`)
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  try {
    log.info(`Cleaning up soft-deleted ${model} records`, {
      model,
      olderThanDays,
      cutoffDate,
      batchSize,
      dryRun
    })

    // Find records to delete
    const recordsToDelete = await (db as any)[model].findMany({
      where: {
        [config.deletedAtField]: {
          not: null,
          lt: cutoffDate
        }
      },
      take: batchSize,
      select: { id: true, [config.deletedAtField]: true }
    })

    if (recordsToDelete.length === 0) {
      log.info(`No old soft-deleted ${model} records found for cleanup`)
      return { deleted: 0, records: [] }
    }

    if (dryRun) {
      log.info(`Dry run: Would delete ${recordsToDelete.length} ${model} records`)
      return { deleted: 0, records: recordsToDelete }
    }

    // Permanently delete records
    const deleteResult = await (db as any)[model].deleteMany({
      where: {
        id: {
          in: recordsToDelete.map((r: any) => r.id)
        }
      }
    })

    log.info(`Permanently deleted ${deleteResult.count} ${model} records`, {
      model,
      deletedCount: deleteResult.count,
      recordIds: recordsToDelete.map((r: any) => r.id)
    })

    return { deleted: deleteResult.count, records: recordsToDelete }
  } catch (error) {
    log.error(`Cleanup failed for ${model}`, error, {
      model,
      olderThanDays,
      cutoffDate
    })
    throw error
  }
}

/**
 * Get count of soft-deleted records
 */
export async function getSoftDeletedCount(model: string): Promise<number> {
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    throw new Error(`Soft delete not configured for model: ${model}`)
  }

  try {
    const count = await (db as any)[model].count({
      where: {
        [config.deletedAtField]: { not: null }
      }
    })

    return count
  } catch (error) {
    log.error(`Failed to get soft-deleted count for ${model}`, error)
    throw error
  }
}

/**
 * Find records excluding soft-deleted ones
 */
export function withoutSoftDeleted(model: string, where: Record<string, any> = {}) {
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    return where
  }

  return {
    ...where,
    [config.deletedAtField]: null
  }
}

/**
 * Find only soft-deleted records
 */
export function onlySoftDeleted(model: string, where: Record<string, any> = {}) {
  const config = SOFT_DELETE_CONFIGS[model]
  
  if (!config) {
    throw new Error(`Soft delete not configured for model: ${model}`)
  }

  return {
    ...where,
    [config.deletedAtField]: { not: null }
  }
}

/**
 * Add soft delete fields to Prisma model (for future schema migrations)
 */
export const SOFT_DELETE_FIELDS = `
  deletedAt      DateTime?
  deletedBy      String?
  deleteReason   String?
  restoredAt     DateTime?
  restoredBy     String?
  restoreReason  String?
`

/**
 * Soft delete utilities module
 */
const softDeleteUtils = {
  softDelete,
  restoreSoftDeleted,
  cleanupSoftDeleted,
  getSoftDeletedCount,
  withoutSoftDeleted,
  onlySoftDeleted,
  SOFT_DELETE_FIELDS
}

export default softDeleteUtils
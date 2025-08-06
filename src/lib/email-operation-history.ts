interface EmailOperation {
  id: string
  type: 'classify' | 'label_apply' | 'label_remove' | 'label_create' | 'label_delete' | 'label_merge'
  timestamp: string
  sessionId: string
  userId: string
  description: string
  emailsAffected: string[] // Array of email IDs
  originalState: Record<string, any> // Store original email state
  newState: Record<string, any> // Store new email state
  canRollback: boolean
  isRolledBack: boolean
  rollbackTimestamp?: string
  metadata: {
    batchSize?: number
    gmailLabels?: string[]
    aiModel?: string
    accuracy?: number
    [key: string]: any
  }
}

interface RollbackOperation {
  id: string
  originalOperationId: string
  timestamp: string
  description: string
  success: boolean
  errors: string[]
}

class EmailOperationHistory {
  private operations: Map<string, EmailOperation> = new Map()
  private rollbacks: Map<string, RollbackOperation> = new Map()

  /**
   * Record a new email operation for potential rollback
   */
  async recordOperation(operation: Omit<EmailOperation, 'id' | 'timestamp'>): Promise<string> {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const fullOperation: EmailOperation = {
      id: operationId,
      timestamp: new Date().toISOString(),
      ...operation
    }

    this.operations.set(operationId, fullOperation)
    
    // Persist to storage (localStorage for now, could be database in production)
    this.persistOperation(fullOperation)
    
    console.log(`📝 Recorded operation ${operationId}: ${operation.description}`)
    return operationId
  }

  /**
   * Get operation details by ID
   */
  getOperation(operationId: string): EmailOperation | null {
    return this.operations.get(operationId) || null
  }

  /**
   * Get all operations for a session
   */
  getSessionOperations(sessionId: string): EmailOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get operations that can be rolled back
   */
  getRollbackableOperations(userId: string, limit: number = 10): EmailOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.userId === userId && op.canRollback && !op.isRolledBack)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Rollback a specific operation
   */
  async rollbackOperation(
    operationId: string,
    gmailService: any,
    userId: string
  ): Promise<RollbackOperation> {
    const operation = this.operations.get(operationId)
    
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    if (!operation.canRollback) {
      throw new Error(`Operation ${operationId} cannot be rolled back`)
    }

    if (operation.isRolledBack) {
      throw new Error(`Operation ${operationId} has already been rolled back`)
    }

    if (operation.userId !== userId) {
      throw new Error(`Operation ${operationId} belongs to a different user`)
    }

    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const rollbackOperation: RollbackOperation = {
      id: rollbackId,
      originalOperationId: operationId,
      timestamp: new Date().toISOString(),
      description: `Rollback: ${operation.description}`,
      success: false,
      errors: []
    }

    try {
      console.log(`🔄 Starting rollback for operation ${operationId}`)
      
      switch (operation.type) {
        case 'label_apply':
          await this.rollbackLabelApplication(operation, gmailService)
          break
        case 'label_remove':
          await this.rollbackLabelRemoval(operation, gmailService)
          break
        case 'label_create':
          await this.rollbackLabelCreation(operation, gmailService)
          break
        case 'label_delete':
          await this.rollbackLabelDeletion(operation, gmailService)
          break
        case 'label_merge':
          await this.rollbackLabelMerge(operation, gmailService)
          break
        case 'classify':
          // Classification rollback is usually not needed as it doesn't modify Gmail
          console.log(`ℹ️ Classification operation ${operationId} doesn't require rollback`)
          break
        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      // Mark operation as rolled back
      operation.isRolledBack = true
      operation.rollbackTimestamp = new Date().toISOString()
      
      rollbackOperation.success = true
      
      console.log(`✅ Successfully rolled back operation ${operationId}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      rollbackOperation.errors.push(errorMessage)
      console.error(`❌ Failed to rollback operation ${operationId}:`, error)
      throw error
    } finally {
      this.rollbacks.set(rollbackId, rollbackOperation)
      this.persistRollback(rollbackOperation)
    }

    return rollbackOperation
  }

  /**
   * Rollback label application (remove applied labels)
   */
  private async rollbackLabelApplication(
    operation: EmailOperation,
    gmailService: any
  ): Promise<void> {
    const labelsToRemove = operation.metadata.gmailLabels || []
    
    for (const emailId of operation.emailsAffected) {
      for (const labelName of labelsToRemove) {
        try {
          // Get label ID from name
          const labels = await gmailService.listLabels()
          const label = labels.find((l: any) => l.name === labelName)
          
          if (label) {
            await gmailService.removeLabelFromEmail(emailId, label.id)
            console.log(`🗑️ Removed label "${labelName}" from email ${emailId}`)
          }
        } catch (error) {
          console.error(`Failed to remove label from email ${emailId}:`, error)
          throw error
        }
      }
    }
  }

  /**
   * Rollback label removal (re-apply removed labels)
   */
  private async rollbackLabelRemoval(
    operation: EmailOperation,
    gmailService: any
  ): Promise<void> {
    const labelsToRestore = operation.metadata.gmailLabels || []
    
    for (const emailId of operation.emailsAffected) {
      for (const labelName of labelsToRestore) {
        try {
          // Get label ID from name
          const labels = await gmailService.listLabels()
          const label = labels.find((l: any) => l.name === labelName)
          
          if (label) {
            await gmailService.applyLabelToEmail(emailId, label.id)
            console.log(`🏷️ Restored label "${labelName}" to email ${emailId}`)
          }
        } catch (error) {
          console.error(`Failed to restore label to email ${emailId}:`, error)
          throw error
        }
      }
    }
  }

  /**
   * Rollback label creation (delete created labels)
   */
  private async rollbackLabelCreation(
    operation: EmailOperation,
    gmailService: any
  ): Promise<void> {
    const labelsToDelete = operation.metadata.gmailLabels || []
    
    for (const labelName of labelsToDelete) {
      try {
        const labels = await gmailService.listLabels()
        const label = labels.find((l: any) => l.name === labelName)
        
        if (label) {
          await gmailService.deleteLabel(label.id)
          console.log(`🗑️ Deleted label "${labelName}"`)
        }
      } catch (error) {
        console.error(`Failed to delete label "${labelName}":`, error)
        throw error
      }
    }
  }

  /**
   * Rollback label deletion (recreate deleted labels)
   */
  private async rollbackLabelDeletion(
    operation: EmailOperation,
    gmailService: any
  ): Promise<void> {
    const originalLabels = operation.originalState.labels || []
    
    for (const labelData of originalLabels) {
      try {
        await gmailService.createLabel({
          name: labelData.name,
          color: labelData.color,
          labelListVisibility: labelData.labelListVisibility,
          messageListVisibility: labelData.messageListVisibility
        })
        console.log(`📝 Recreated label "${labelData.name}"`)
      } catch (error) {
        console.error(`Failed to recreate label "${labelData.name}":`, error)
        throw error
      }
    }
  }

  /**
   * Rollback label merge (restore original labels)
   */
  private async rollbackLabelMerge(
    operation: EmailOperation,
    gmailService: any
  ): Promise<void> {
    // This is complex - would need to restore original labels and re-apply them
    // to affected emails based on their original state
    throw new Error('Label merge rollback not yet implemented')
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(userId: string, limit: number = 20): RollbackOperation[] {
    return Array.from(this.rollbacks.values())
      .filter(rollback => {
        const originalOp = this.operations.get(rollback.originalOperationId)
        return originalOp?.userId === userId
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Persist operation to storage
   */
  private persistOperation(operation: EmailOperation): void {
    try {
      const key = `email_operation_${operation.id}`
      localStorage.setItem(key, JSON.stringify(operation))
    } catch (error) {
      console.error('Failed to persist operation:', error)
    }
  }

  /**
   * Persist rollback to storage
   */
  private persistRollback(rollback: RollbackOperation): void {
    try {
      const key = `email_rollback_${rollback.id}`
      localStorage.setItem(key, JSON.stringify(rollback))
    } catch (error) {
      console.error('Failed to persist rollback:', error)
    }
  }

  /**
   * Load operations from storage
   */
  loadFromStorage(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('email_operation_')) {
          const data = localStorage.getItem(key)
          if (data) {
            const operation: EmailOperation = JSON.parse(data)
            this.operations.set(operation.id, operation)
          }
        } else if (key?.startsWith('email_rollback_')) {
          const data = localStorage.getItem(key)
          if (data) {
            const rollback: RollbackOperation = JSON.parse(data)
            this.rollbacks.set(rollback.id, rollback)
          }
        }
      }
      console.log(`📚 Loaded ${this.operations.size} operations and ${this.rollbacks.size} rollbacks from storage`)
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  }

  /**
   * Clear old operations (cleanup)
   */
  clearOldOperations(daysOld: number = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    let removedCount = 0
    
    for (const [id, operation] of this.operations.entries()) {
      if (new Date(operation.timestamp) < cutoffDate) {
        this.operations.delete(id)
        localStorage.removeItem(`email_operation_${id}`)
        removedCount++
      }
    }
    
    for (const [id, rollback] of this.rollbacks.entries()) {
      if (new Date(rollback.timestamp) < cutoffDate) {
        this.rollbacks.delete(id)
        localStorage.removeItem(`email_rollback_${id}`)
        removedCount++
      }
    }
    
    console.log(`🧹 Cleaned up ${removedCount} old operations`)
  }

  /**
   * Get operation statistics
   */
  getStats(userId: string): {
    totalOperations: number
    rollbackableOperations: number
    rolledBackOperations: number
    successfulRollbacks: number
    failedRollbacks: number
  } {
    const userOperations = Array.from(this.operations.values())
      .filter(op => op.userId === userId)
    
    const userRollbacks = Array.from(this.rollbacks.values())
      .filter(rollback => {
        const originalOp = this.operations.get(rollback.originalOperationId)
        return originalOp?.userId === userId
      })

    return {
      totalOperations: userOperations.length,
      rollbackableOperations: userOperations.filter(op => op.canRollback && !op.isRolledBack).length,
      rolledBackOperations: userOperations.filter(op => op.isRolledBack).length,
      successfulRollbacks: userRollbacks.filter(r => r.success).length,
      failedRollbacks: userRollbacks.filter(r => !r.success).length
    }
  }
}

// Singleton instance
export const emailOperationHistory = new EmailOperationHistory()

// Load from storage on initialization
if (typeof window !== 'undefined') {
  emailOperationHistory.loadFromStorage()
}

export type { EmailOperation, RollbackOperation }

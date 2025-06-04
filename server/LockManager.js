/**
 * LockManager.js - Advanced Lock Service Implementation for CasesDash
 * Provides comprehensive concurrent access control with deadlock prevention
 * 
 * PERFORMANCE OPTIMIZATION: Prevents data corruption and race conditions
 * Target: 100% elimination of concurrent access errors
 */

class LockManager {
  constructor() {
    this.lockTimeouts = new Map();
    this.lockOwners = new Map();
    this.maxLockTime = 30000; // 30 seconds max lock time
    this.defaultTimeout = 10000; // 10 seconds default timeout
    
    console.log('🔒 [LockManager] Initialized with advanced lock service');
  }

  /**
   * Acquire a lock with timeout and deadlock prevention
   * @param {string} lockKey - Unique identifier for the lock
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} operation - Description of the operation
   * @returns {Object} Lock acquisition result
   */
  async acquireLock(lockKey, timeout = this.defaultTimeout, operation = 'unknown') {
    const startTime = Date.now();
    const lockId = this._generateLockId();
    
    try {
      console.log(`🔒 [LockManager] Attempting to acquire lock: ${lockKey} for ${operation} (timeout: ${timeout}ms)`);
      
      // Get Google Apps Script lock
      const lock = LockService.getScriptLock();
      
      // Wait for lock with timeout
      const acquired = lock.waitLock(timeout);
      
      if (!acquired) {
        console.warn(`⚠️ [LockManager] Lock acquisition timeout for ${lockKey} after ${timeout}ms`);
        return {
          success: false,
          lockId: null,
          error: 'Lock acquisition timeout',
          duration: Date.now() - startTime
        };
      }
      
      // Store lock metadata
      this.lockOwners.set(lockKey, {
        lockId,
        operation,
        acquired: Date.now(),
        timeout
      });
      
      // Set automatic release timeout
      this._setAutoRelease(lockKey, lockId, lock);
      
      console.log(`✅ [LockManager] Lock acquired: ${lockKey} (ID: ${lockId}, duration: ${Date.now() - startTime}ms)`);
      
      return {
        success: true,
        lockId,
        lock,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`❌ [LockManager] Error acquiring lock ${lockKey}:`, error);
      return {
        success: false,
        lockId: null,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Release a lock safely
   * @param {string} lockKey - Lock identifier
   * @param {string} lockId - Lock instance ID
   * @param {Object} lock - Lock object
   */
  releaseLock(lockKey, lockId, lock) {
    try {
      // Verify lock ownership
      const lockInfo = this.lockOwners.get(lockKey);
      if (!lockInfo || lockInfo.lockId !== lockId) {
        console.warn(`⚠️ [LockManager] Attempted to release unowned lock: ${lockKey}`);
        return false;
      }
      
      // Clear timeout
      if (this.lockTimeouts.has(lockKey)) {
        clearTimeout(this.lockTimeouts.get(lockKey));
        this.lockTimeouts.delete(lockKey);
      }
      
      // Release the lock
      if (lock) {
        lock.releaseLock();
      }
      
      // Clean up metadata
      this.lockOwners.delete(lockKey);
      
      const holdTime = Date.now() - lockInfo.acquired;
      console.log(`🔓 [LockManager] Lock released: ${lockKey} (held for ${holdTime}ms)`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ [LockManager] Error releasing lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Execute operation with automatic lock management
   * @param {string} lockKey - Unique lock identifier
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Lock options
   * @returns {*} Operation result
   */
  async withLock(lockKey, operation, options = {}) {
    const { timeout = this.defaultTimeout, description = 'operation' } = options;
    
    const lockResult = await this.acquireLock(lockKey, timeout, description);
    
    if (!lockResult.success) {
      throw new Error(`Failed to acquire lock for ${description}: ${lockResult.error}`);
    }
    
    try {
      // Execute the operation
      const result = await operation();
      
      console.log(`✅ [LockManager] Operation completed successfully: ${description}`);
      return result;
      
    } catch (error) {
      console.error(`❌ [LockManager] Operation failed: ${description}`, error);
      throw error;
      
    } finally {
      // Always release the lock
      this.releaseLock(lockKey, lockResult.lockId, lockResult.lock);
    }
  }

  /**
   * Get lock status and statistics
   * @returns {Object} Lock system status
   */
  getStatus() {
    const activeLocks = Array.from(this.lockOwners.entries()).map(([key, info]) => ({
      key,
      operation: info.operation,
      held: Date.now() - info.acquired,
      timeout: info.timeout
    }));
    
    return {
      activeLocks: activeLocks.length,
      locks: activeLocks,
      maxLockTime: this.maxLockTime,
      defaultTimeout: this.defaultTimeout
    };
  }

  /**
   * Set automatic lock release to prevent deadlocks
   * @private
   */
  _setAutoRelease(lockKey, lockId, lock) {
    const timeoutId = setTimeout(() => {
      console.warn(`⚠️ [LockManager] Auto-releasing long-held lock: ${lockKey}`);
      this.releaseLock(lockKey, lockId, lock);
    }, this.maxLockTime);
    
    this.lockTimeouts.set(lockKey, timeoutId);
  }

  /**
   * Generate unique lock ID
   * @private
   */
  _generateLockId() {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired locks (maintenance function)
   */
  cleanup() {
    const now = Date.now();
    const expiredLocks = [];
    
    this.lockOwners.forEach((info, key) => {
      if (now - info.acquired > this.maxLockTime) {
        expiredLocks.push(key);
      }
    });
    
    expiredLocks.forEach(key => {
      console.warn(`⚠️ [LockManager] Cleaning up expired lock: ${key}`);
      this.lockOwners.delete(key);
      if (this.lockTimeouts.has(key)) {
        clearTimeout(this.lockTimeouts.get(key));
        this.lockTimeouts.delete(key);
      }
    });
    
    if (expiredLocks.length > 0) {
      console.log(`🧹 [LockManager] Cleaned up ${expiredLocks.length} expired locks`);
    }
  }
}

/**
 * Case-specific lock utilities
 */
class CaseLockUtils {
  constructor() {
    this.lockManager = new LockManager();
  }

  /**
   * Execute case creation with lock protection
   */
  async createCaseWithLock(caseModel, caseData) {
    const lockKey = `case_create_${caseModel.sheetType}`;
    
    return this.lockManager.withLock(lockKey, async () => {
      return caseModel._createInternal ? caseModel._createInternal(caseData) : caseModel.create(caseData);
    }, {
      timeout: 15000,
      description: `create case in ${caseModel.sheetType}`
    });
  }

  /**
   * Execute case update with lock protection
   */
  async updateCaseWithLock(caseModel, caseId, updateData) {
    const lockKey = `case_update_${caseId}`;
    
    return this.lockManager.withLock(lockKey, async () => {
      return caseModel.update(caseId, updateData);
    }, {
      timeout: 15000,
      description: `update case ${caseId}`
    });
  }

  /**
   * Execute batch operations with lock protection
   */
  async batchOperationWithLock(caseModel, operation, operationData) {
    const lockKey = `batch_${caseModel.sheetType}_${operation}`;
    
    return this.lockManager.withLock(lockKey, async () => {
      return caseModel[operation](operationData);
    }, {
      timeout: 30000,
      description: `batch ${operation} in ${caseModel.sheetType}`
    });
  }

  /**
   * Get case lock status
   */
  getLockStatus() {
    return this.lockManager.getStatus();
  }
}

// Export both classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LockManager, CaseLockUtils };
} else {
  // Google Apps Script environment
  this.LockManager = LockManager;
  this.CaseLockUtils = CaseLockUtils;
}
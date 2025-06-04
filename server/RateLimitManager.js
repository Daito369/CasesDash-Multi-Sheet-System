/**
 * CasesDash - Rate Limit Manager
 * Comprehensive rate limiting and quota management system
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Rate limit configurations for different operations
 */
const RateLimitConfigs = {
  // API Operations
  API_READ: { 
    requests: 100, 
    windowMs: 60000, // 1 minute
    priority: 1,
    userMultiplier: { admin: 2.0, teamLeader: 1.5, user: 1.0 }
  },
  API_WRITE: { 
    requests: 50, 
    windowMs: 60000,
    priority: 2,
    userMultiplier: { admin: 2.0, teamLeader: 1.5, user: 1.0 }
  },
  API_DELETE: { 
    requests: 10, 
    windowMs: 60000,
    priority: 3,
    userMultiplier: { admin: 2.0, teamLeader: 1.0, user: 0.5 }
  },
  
  // Spreadsheet Operations
  SHEET_READ: { 
    requests: 500, 
    windowMs: 60000,
    priority: 1,
    userMultiplier: { admin: 1.5, teamLeader: 1.2, user: 1.0 }
  },
  SHEET_WRITE: { 
    requests: 200, 
    windowMs: 60000,
    priority: 2,
    userMultiplier: { admin: 1.5, teamLeader: 1.2, user: 1.0 }
  },
  SHEET_BATCH: { 
    requests: 50, 
    windowMs: 60000,
    priority: 3,
    userMultiplier: { admin: 2.0, teamLeader: 1.5, user: 1.0 }
  },
  
  // Search Operations
  SEARCH_SIMPLE: { 
    requests: 200, 
    windowMs: 60000,
    priority: 1,
    userMultiplier: { admin: 1.5, teamLeader: 1.2, user: 1.0 }
  },
  SEARCH_ADVANCED: { 
    requests: 50, 
    windowMs: 60000,
    priority: 2,
    userMultiplier: { admin: 2.0, teamLeader: 1.5, user: 1.0 }
  },
  SEARCH_GLOBAL: { 
    requests: 20, 
    windowMs: 60000,
    priority: 3,
    userMultiplier: { admin: 2.0, teamLeader: 1.0, user: 0.5 }
  },
  
  // Export Operations
  EXPORT_SMALL: { 
    requests: 50, 
    windowMs: 300000, // 5 minutes
    priority: 2,
    userMultiplier: { admin: 2.0, teamLeader: 1.5, user: 1.0 }
  },
  EXPORT_LARGE: { 
    requests: 5, 
    windowMs: 3600000, // 1 hour
    priority: 3,
    userMultiplier: { admin: 2.0, teamLeader: 1.0, user: 0.5 }
  },
  
  // Authentication
  LOGIN_ATTEMPT: { 
    requests: 10, 
    windowMs: 900000, // 15 minutes
    priority: 1,
    userMultiplier: { admin: 1.0, teamLeader: 1.0, user: 1.0 }
  },
  
  // System Operations
  SYSTEM_CONFIG: { 
    requests: 5, 
    windowMs: 3600000, // 1 hour
    priority: 3,
    userMultiplier: { admin: 1.0, teamLeader: 0.0, user: 0.0 }
  }
};

/**
 * Quota configurations for Google Apps Script
 */
const QuotaConfigs = {
  // Daily quotas
  DAILY_SCRIPT_RUNTIME: { limit: 21600, // 6 hours in seconds
                          warning: 18000, // 5 hours
                          critical: 20700 }, // 5.75 hours
  
  DAILY_EMAIL_QUOTA: { limit: 100,
                       warning: 80,
                       critical: 95 },
  
  DAILY_URL_FETCH: { limit: 20000,
                     warning: 16000,
                     critical: 19000 },
  
  // Per-execution quotas
  EXECUTION_TIME: { limit: 360000, // 6 minutes in ms
                    warning: 300000, // 5 minutes
                    critical: 350000 }, // 5.83 minutes
  
  SPREADSHEET_CALLS: { limit: 10000,
                       warning: 8000,
                       critical: 9500 },
  
  MEMORY_USAGE: { limit: 100 * 1024 * 1024, // 100MB estimate
                  warning: 80 * 1024 * 1024, // 80MB
                  critical: 95 * 1024 * 1024 } // 95MB
};

/**
 * Rate Limit Manager Class
 */
class RateLimitManager {
  constructor() {
    this.userLimits = new Map();
    this.globalCounters = new Map();
    this.quotaTracker = new QuotaTracker();
    this.priorityQueue = new PriorityQueue();
    this.auditLogger = null;
    this.notificationManager = null;
    this.initializeComponents();
  }

  /**
   * Initialize components
   */
  initializeComponents() {
    try {
      if (typeof AuditLogger !== 'undefined') {
        this.auditLogger = new AuditLogger();
      }
      if (typeof NotificationManager !== 'undefined') {
        this.notificationManager = new NotificationManager();
      }
    } catch (error) {
      console.warn('Could not initialize all rate limit components:', error);
    }
  }

  /**
   * Check if operation is allowed under rate limits
   * @param {string} operationType - Type of operation
   * @param {string} userId - User identifier
   * @param {Object} context - Additional context
   * @returns {Object} Rate limit check result
   */
  checkRateLimit(operationType, userId = null, context = {}) {
    try {
      const config = RateLimitConfigs[operationType];
      if (!config) {
        console.warn(`Unknown operation type: ${operationType}`);
        return { allowed: true, reason: 'unknown_operation' };
      }

      // Get user information
      const userInfo = this.getUserInfo(userId);
      const effectiveUserId = userInfo.id;
      const userRole = userInfo.role;

      // Calculate user-specific limits
      const userMultiplier = config.userMultiplier[userRole] || 1.0;
      const userLimit = Math.floor(config.requests * userMultiplier);

      // Check user-specific rate limit
      const userCheck = this.checkUserRateLimit(operationType, effectiveUserId, userLimit, config.windowMs);
      if (!userCheck.allowed) {
        this.logRateLimitViolation(operationType, effectiveUserId, userCheck, context);
        return userCheck;
      }

      // Check global rate limit
      const globalCheck = this.checkGlobalRateLimit(operationType, config);
      if (!globalCheck.allowed) {
        this.logRateLimitViolation(operationType, effectiveUserId, globalCheck, context);
        return globalCheck;
      }

      // Check quota limits
      const quotaCheck = this.quotaTracker.checkQuotas(operationType, context);
      if (!quotaCheck.allowed) {
        this.logQuotaViolation(operationType, effectiveUserId, quotaCheck, context);
        return quotaCheck;
      }

      // All checks passed
      this.recordOperationUsage(operationType, effectiveUserId, userRole, context);

      return {
        allowed: true,
        remaining: {
          user: userLimit - userCheck.currentCount,
          global: config.requests - globalCheck.currentCount,
          quota: quotaCheck.remaining
        },
        resetTime: userCheck.resetTime,
        priority: config.priority
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open for system stability
      return { allowed: true, reason: 'check_failed', error: error.message };
    }
  }

  /**
   * Check user-specific rate limit
   * @param {string} operationType - Operation type
   * @param {string} userId - User ID
   * @param {number} limit - Rate limit
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Check result
   */
  checkUserRateLimit(operationType, userId, limit, windowMs) {
    const key = `${userId}:${operationType}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.userLimits.has(key)) {
      this.userLimits.set(key, []);
    }

    const userHistory = this.userLimits.get(key);
    
    // Remove expired entries
    const validEntries = userHistory.filter(timestamp => timestamp > windowStart);
    this.userLimits.set(key, validEntries);

    if (validEntries.length >= limit) {
      return {
        allowed: false,
        reason: 'user_rate_limit_exceeded',
        currentCount: validEntries.length,
        limit: limit,
        resetTime: Math.min(...validEntries) + windowMs
      };
    }

    return {
      allowed: true,
      currentCount: validEntries.length,
      limit: limit,
      resetTime: now + windowMs
    };
  }

  /**
   * Check global rate limit
   * @param {string} operationType - Operation type
   * @param {Object} config - Rate limit configuration
   * @returns {Object} Check result
   */
  checkGlobalRateLimit(operationType, config) {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!this.globalCounters.has(operationType)) {
      this.globalCounters.set(operationType, []);
    }

    const globalHistory = this.globalCounters.get(operationType);
    
    // Remove expired entries
    const validEntries = globalHistory.filter(timestamp => timestamp > windowStart);
    this.globalCounters.set(operationType, validEntries);

    // Calculate global limit (could be higher than individual user limits)
    const globalLimit = config.requests * 10; // 10x individual limit for global

    if (validEntries.length >= globalLimit) {
      return {
        allowed: false,
        reason: 'global_rate_limit_exceeded',
        currentCount: validEntries.length,
        limit: globalLimit,
        resetTime: Math.min(...validEntries) + config.windowMs
      };
    }

    return {
      allowed: true,
      currentCount: validEntries.length,
      limit: globalLimit,
      resetTime: now + config.windowMs
    };
  }

  /**
   * Record operation usage
   * @param {string} operationType - Operation type
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} context - Additional context
   */
  recordOperationUsage(operationType, userId, userRole, context) {
    const now = Date.now();

    // Record for user
    const userKey = `${userId}:${operationType}`;
    if (!this.userLimits.has(userKey)) {
      this.userLimits.set(userKey, []);
    }
    this.userLimits.get(userKey).push(now);

    // Record for global
    if (!this.globalCounters.has(operationType)) {
      this.globalCounters.set(operationType, []);
    }
    this.globalCounters.get(operationType).push(now);

    // Update quota tracker
    this.quotaTracker.recordUsage(operationType, context);

    // Log usage if audit logger is available
    if (this.auditLogger) {
      this.auditLogger.logEvent('USER_ACTION', {
        operationType: operationType,
        userId: userId,
        userRole: userRole,
        context: context
      });
    }
  }

  /**
   * Get user information
   * @param {string} userId - User ID (optional)
   * @returns {Object} User information
   */
  getUserInfo(userId = null) {
    try {
      let userInfo = {
        id: userId || 'anonymous',
        role: 'user',
        email: 'unknown'
      };

      if (!userId) {
        // Try to get from session
        if (typeof Session !== 'undefined') {
          const user = Session.getActiveUser();
          if (user && user.getEmail()) {
            userInfo.id = user.getEmail();
            userInfo.email = user.getEmail();
          }
        }
      }

      // Try to get role
      if (typeof UserManager !== 'undefined') {
        try {
          const roleInfo = UserManager.getCurrentUser();
          userInfo.role = roleInfo?.role || 'user';
        } catch (roleError) {
          console.warn('Could not get user role for rate limiting');
        }
      }

      return userInfo;

    } catch (error) {
      console.warn('Could not get user info for rate limiting:', error);
      return { id: 'error', role: 'user', email: 'unknown' };
    }
  }

  /**
   * Log rate limit violation
   * @param {string} operationType - Operation type
   * @param {string} userId - User ID
   * @param {Object} checkResult - Check result
   * @param {Object} context - Additional context
   */
  logRateLimitViolation(operationType, userId, checkResult, context) {
    console.warn(`Rate limit exceeded: ${operationType} for user ${userId}`, checkResult);

    if (this.auditLogger) {
      this.auditLogger.logEvent('SYSTEM_ERROR', {
        type: 'rate_limit_violation',
        operationType: operationType,
        userId: userId,
        reason: checkResult.reason,
        currentCount: checkResult.currentCount,
        limit: checkResult.limit,
        context: context
      });
    }

    // Send notification for repeated violations
    this.checkForAbusePattern(userId, operationType);
  }

  /**
   * Log quota violation
   * @param {string} operationType - Operation type
   * @param {string} userId - User ID
   * @param {Object} quotaResult - Quota check result
   * @param {Object} context - Additional context
   */
  logQuotaViolation(operationType, userId, quotaResult, context) {
    console.warn(`Quota exceeded: ${operationType} for user ${userId}`, quotaResult);

    if (this.auditLogger) {
      this.auditLogger.logEvent('QUOTA_EXCEEDED', {
        operationType: operationType,
        userId: userId,
        quotaType: quotaResult.quotaType,
        usage: quotaResult.usage,
        limit: quotaResult.limit,
        context: context
      });
    }

    // Send notification for quota issues
    if (this.notificationManager && quotaResult.severity === 'critical') {
      this.notificationManager.sendAlert({
        type: 'quota_critical',
        title: 'Critical Quota Usage',
        message: `Quota ${quotaResult.quotaType} is critically high: ${quotaResult.usage}/${quotaResult.limit}`,
        context: { userId, operationType }
      });
    }
  }

  /**
   * Check for abuse patterns
   * @param {string} userId - User ID
   * @param {string} operationType - Operation type
   */
  checkForAbusePattern(userId, operationType) {
    const key = `abuse:${userId}:${operationType}`;
    const now = Date.now();
    const windowMs = 3600000; // 1 hour
    
    if (!this.userLimits.has(key)) {
      this.userLimits.set(key, []);
    }

    const violations = this.userLimits.get(key);
    violations.push(now);

    // Clean old violations
    const validViolations = violations.filter(time => now - time < windowMs);
    this.userLimits.set(key, validViolations);

    // Check if user needs to be temporarily blocked
    if (validViolations.length >= 5) { // 5 violations in 1 hour
      this.temporarilyBlockUser(userId, operationType, validViolations.length);
    }
  }

  /**
   * Temporarily block user
   * @param {string} userId - User ID
   * @param {string} operationType - Operation type
   * @param {number} violationCount - Number of violations
   */
  temporarilyBlockUser(userId, operationType, violationCount) {
    const blockKey = `block:${userId}:${operationType}`;
    const blockDuration = Math.min(violationCount * 60000, 3600000); // Max 1 hour
    const blockUntil = Date.now() + blockDuration;

    this.userLimits.set(blockKey, [blockUntil]);

    console.warn(`User ${userId} temporarily blocked for ${operationType} until ${new Date(blockUntil)}`);

    if (this.auditLogger) {
      this.auditLogger.logEvent('UNAUTHORIZED_ACCESS', {
        type: 'temporary_block',
        userId: userId,
        operationType: operationType,
        violationCount: violationCount,
        blockDuration: blockDuration,
        blockUntil: new Date(blockUntil).toISOString()
      });
    }

    if (this.notificationManager) {
      this.notificationManager.sendAlert({
        type: 'user_blocked',
        title: 'User Temporarily Blocked',
        message: `User ${userId} blocked for excessive ${operationType} violations`,
        context: { violationCount, blockDuration }
      });
    }
  }

  /**
   * Check if user is temporarily blocked
   * @param {string} userId - User ID
   * @param {string} operationType - Operation type
   * @returns {boolean} Whether user is blocked
   */
  isUserBlocked(userId, operationType) {
    const blockKey = `block:${userId}:${operationType}`;
    const blocks = this.userLimits.get(blockKey);
    
    if (!blocks || blocks.length === 0) return false;
    
    const blockUntil = blocks[0];
    const now = Date.now();
    
    if (now < blockUntil) {
      return true;
    } else {
      // Block expired, remove it
      this.userLimits.delete(blockKey);
      return false;
    }
  }

  /**
   * Get rate limit status for user
   * @param {string} userId - User ID (optional)
   * @returns {Object} Rate limit status
   */
  getRateLimitStatus(userId = null) {
    try {
      const userInfo = this.getUserInfo(userId);
      const effectiveUserId = userInfo.id;
      const userRole = userInfo.role;

      const status = {
        userId: effectiveUserId,
        userRole: userRole,
        limits: {},
        quotas: this.quotaTracker.getQuotaStatus(),
        blocked: {}
      };

      // Check each operation type
      Object.keys(RateLimitConfigs).forEach(operationType => {
        const config = RateLimitConfigs[operationType];
        const userMultiplier = config.userMultiplier[userRole] || 1.0;
        const userLimit = Math.floor(config.requests * userMultiplier);

        const userCheck = this.checkUserRateLimit(operationType, effectiveUserId, userLimit, config.windowMs);
        
        status.limits[operationType] = {
          limit: userLimit,
          used: userCheck.currentCount,
          remaining: userLimit - userCheck.currentCount,
          resetTime: userCheck.resetTime,
          windowMs: config.windowMs
        };

        status.blocked[operationType] = this.isUserBlocked(effectiveUserId, operationType);
      });

      return status;

    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { error: error.message };
    }
  }

  /**
   * Reset rate limits for user (admin function)
   * @param {string} userId - User ID
   * @param {string} operationType - Operation type (optional)
   * @returns {Object} Reset result
   */
  resetUserLimits(userId, operationType = null) {
    try {
      if (operationType) {
        // Reset specific operation
        const key = `${userId}:${operationType}`;
        this.userLimits.delete(key);
        
        // Remove any blocks
        const blockKey = `block:${userId}:${operationType}`;
        this.userLimits.delete(blockKey);
      } else {
        // Reset all operations for user
        const keysToDelete = [];
        this.userLimits.forEach((value, key) => {
          if (key.startsWith(userId + ':') || key.startsWith(`block:${userId}:`)) {
            keysToDelete.push(key);
          }
        });
        
        keysToDelete.forEach(key => this.userLimits.delete(key));
      }

      if (this.auditLogger) {
        this.auditLogger.logEvent('CONFIGURATION_CHANGE', {
          type: 'rate_limit_reset',
          targetUserId: userId,
          operationType: operationType || 'all',
          adminUserId: this.getUserInfo().id
        });
      }

      return { success: true, message: 'Rate limits reset successfully' };

    } catch (error) {
      console.error('Failed to reset rate limits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system-wide rate limit statistics
   * @returns {Object} System statistics
   */
  getSystemStatistics() {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        activeUsers: new Set(),
        operationCounts: {},
        quotaStatus: this.quotaTracker.getQuotaStatus(),
        blockedUsers: 0
      };

      // Analyze user limits
      this.userLimits.forEach((timestamps, key) => {
        if (key.includes(':') && !key.startsWith('block:') && !key.startsWith('abuse:')) {
          const [userId, operationType] = key.split(':');
          stats.activeUsers.add(userId);
          
          if (!stats.operationCounts[operationType]) {
            stats.operationCounts[operationType] = 0;
          }
          stats.operationCounts[operationType] += timestamps.length;
        } else if (key.startsWith('block:')) {
          stats.blockedUsers++;
        }
      });

      stats.activeUsers = stats.activeUsers.size;

      return stats;

    } catch (error) {
      console.error('Failed to get system statistics:', error);
      return { error: error.message };
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    try {
      const now = Date.now();
      const keysToDelete = [];

      this.userLimits.forEach((timestamps, key) => {
        if (Array.isArray(timestamps)) {
          // Get window for this key
          let windowMs = 60000; // Default 1 minute
          
          if (key.includes(':')) {
            const operationType = key.split(':')[1];
            const config = RateLimitConfigs[operationType];
            if (config) {
              windowMs = config.windowMs;
            }
          }

          // Filter expired entries
          const validEntries = timestamps.filter(timestamp => now - timestamp < windowMs);
          
          if (validEntries.length === 0) {
            keysToDelete.push(key);
          } else {
            this.userLimits.set(key, validEntries);
          }
        }
      });

      // Delete empty entries
      keysToDelete.forEach(key => this.userLimits.delete(key));

      // Cleanup global counters
      this.globalCounters.forEach((timestamps, operationType) => {
        const config = RateLimitConfigs[operationType];
        if (config) {
          const validEntries = timestamps.filter(timestamp => now - timestamp < config.windowMs);
          this.globalCounters.set(operationType, validEntries);
        }
      });

      console.log(`Rate limit cleanup completed: removed ${keysToDelete.length} expired entries`);

    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
    }
  }
}

/**
 * Quota Tracker for Google Apps Script limits
 */
class QuotaTracker {
  constructor() {
    this.quotaUsage = new Map();
    this.dailyResetTime = this.calculateDailyResetTime();
    this.startTime = Date.now();
  }

  /**
   * Check quota limits
   * @param {string} operationType - Operation type
   * @param {Object} context - Additional context
   * @returns {Object} Quota check result
   */
  checkQuotas(operationType, context) {
    try {
      // Check execution time quota
      const executionCheck = this.checkExecutionTimeQuota();
      if (!executionCheck.allowed) return executionCheck;

      // Check daily quotas if needed
      const dailyCheck = this.checkDailyQuotas(operationType, context);
      if (!dailyCheck.allowed) return dailyCheck;

      return {
        allowed: true,
        remaining: {
          execution: executionCheck.remaining,
          daily: dailyCheck.remaining
        }
      };

    } catch (error) {
      console.error('Quota check failed:', error);
      return { allowed: true, reason: 'quota_check_failed' };
    }
  }

  /**
   * Check execution time quota
   * @returns {Object} Check result
   */
  checkExecutionTimeQuota() {
    const executionTime = Date.now() - this.startTime;
    const config = QuotaConfigs.EXECUTION_TIME;

    if (executionTime > config.critical) {
      return {
        allowed: false,
        reason: 'execution_time_critical',
        quotaType: 'execution_time',
        usage: executionTime,
        limit: config.limit,
        severity: 'critical'
      };
    }

    if (executionTime > config.warning) {
      console.warn(`Execution time warning: ${executionTime}ms / ${config.limit}ms`);
    }

    return {
      allowed: true,
      remaining: config.limit - executionTime,
      usage: executionTime,
      limit: config.limit
    };
  }

  /**
   * Check daily quotas
   * @param {string} operationType - Operation type
   * @param {Object} context - Additional context
   * @returns {Object} Check result
   */
  checkDailyQuotas(operationType, context) {
    // This is a simplified check - in production would track actual usage
    const now = Date.now();
    
    // Reset daily counters if needed
    if (now > this.dailyResetTime) {
      this.resetDailyCounters();
      this.dailyResetTime = this.calculateDailyResetTime();
    }

    // Check spreadsheet calls quota
    if (operationType.startsWith('SHEET_')) {
      return this.checkSpreadsheetQuota(context);
    }

    // Check URL fetch quota
    if (operationType.includes('EXPORT') || operationType.includes('FETCH')) {
      return this.checkUrlFetchQuota(context);
    }

    return { allowed: true, remaining: { daily: 'unknown' } };
  }

  /**
   * Check spreadsheet quota
   * @param {Object} context - Additional context
   * @returns {Object} Check result
   */
  checkSpreadsheetQuota(context) {
    const dailyUsage = this.quotaUsage.get('daily_spreadsheet_calls') || 0;
    const config = QuotaConfigs.SPREADSHEET_CALLS;

    if (dailyUsage >= config.critical) {
      return {
        allowed: false,
        reason: 'spreadsheet_quota_critical',
        quotaType: 'spreadsheet_calls',
        usage: dailyUsage,
        limit: config.limit,
        severity: 'critical'
      };
    }

    if (dailyUsage >= config.warning) {
      console.warn(`Spreadsheet quota warning: ${dailyUsage} / ${config.limit} calls`);
    }

    return {
      allowed: true,
      remaining: config.limit - dailyUsage,
      usage: dailyUsage,
      limit: config.limit
    };
  }

  /**
   * Check URL fetch quota
   * @param {Object} context - Additional context
   * @returns {Object} Check result
   */
  checkUrlFetchQuota(context) {
    const dailyUsage = this.quotaUsage.get('daily_url_fetch') || 0;
    const config = QuotaConfigs.DAILY_URL_FETCH;

    if (dailyUsage >= config.critical) {
      return {
        allowed: false,
        reason: 'url_fetch_quota_critical',
        quotaType: 'url_fetch',
        usage: dailyUsage,
        limit: config.limit,
        severity: 'critical'
      };
    }

    return {
      allowed: true,
      remaining: config.limit - dailyUsage,
      usage: dailyUsage,
      limit: config.limit
    };
  }

  /**
   * Record quota usage
   * @param {string} operationType - Operation type
   * @param {Object} context - Additional context
   */
  recordUsage(operationType, context) {
    try {
      // Record spreadsheet operations
      if (operationType.startsWith('SHEET_')) {
        const current = this.quotaUsage.get('daily_spreadsheet_calls') || 0;
        this.quotaUsage.set('daily_spreadsheet_calls', current + 1);
      }

      // Record URL fetch operations
      if (operationType.includes('EXPORT') || operationType.includes('FETCH')) {
        const current = this.quotaUsage.get('daily_url_fetch') || 0;
        this.quotaUsage.set('daily_url_fetch', current + 1);
      }

      // Record execution time
      const executionTime = Date.now() - this.startTime;
      this.quotaUsage.set('current_execution_time', executionTime);

    } catch (error) {
      console.error('Failed to record quota usage:', error);
    }
  }

  /**
   * Get quota status
   * @returns {Object} Quota status
   */
  getQuotaStatus() {
    const executionTime = Date.now() - this.startTime;
    
    return {
      execution: {
        current: executionTime,
        limit: QuotaConfigs.EXECUTION_TIME.limit,
        remaining: QuotaConfigs.EXECUTION_TIME.limit - executionTime,
        percentage: (executionTime / QuotaConfigs.EXECUTION_TIME.limit) * 100
      },
      daily: {
        spreadsheetCalls: {
          current: this.quotaUsage.get('daily_spreadsheet_calls') || 0,
          limit: QuotaConfigs.SPREADSHEET_CALLS.limit
        },
        urlFetch: {
          current: this.quotaUsage.get('daily_url_fetch') || 0,
          limit: QuotaConfigs.DAILY_URL_FETCH.limit
        }
      },
      nextReset: new Date(this.dailyResetTime).toISOString()
    };
  }

  /**
   * Calculate daily reset time (midnight Pacific Time)
   * @returns {number} Reset timestamp
   */
  calculateDailyResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Reset daily counters
   */
  resetDailyCounters() {
    this.quotaUsage.delete('daily_spreadsheet_calls');
    this.quotaUsage.delete('daily_url_fetch');
    console.log('Daily quota counters reset');
  }
}

/**
 * Priority Queue for managing operations under quota pressure
 */
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  /**
   * Add operation to priority queue
   * @param {Object} operation - Operation to queue
   * @param {number} priority - Priority level (1 = highest)
   */
  enqueue(operation, priority) {
    this.queue.push({ operation, priority, timestamp: Date.now() });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get next operation from queue
   * @returns {Object} Next operation
   */
  dequeue() {
    return this.queue.shift();
  }

  /**
   * Get queue length
   * @returns {number} Queue length
   */
  length() {
    return this.queue.length;
  }

  /**
   * Clear old operations from queue
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanup(maxAge = 300000) { // 5 minutes default
    const now = Date.now();
    this.queue = this.queue.filter(item => now - item.timestamp < maxAge);
  }
}

// Global rate limit manager instance
const rateLimitManager = new RateLimitManager();

// Cleanup function (called by trigger)
function cleanupRateLimits() {
  try {
    rateLimitManager.cleanup();
  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
  }
}
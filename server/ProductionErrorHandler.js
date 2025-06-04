/**
 * CasesDash - Production Error Handler
 * Comprehensive error handling system for production environments
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Enhanced error types with severity levels
 */
const ProductionErrorTypes = {
  // Critical Errors (Severity 1)
  SYSTEM_FAILURE: { code: 'SYSTEM_FAILURE', severity: 1, recoverable: false },
  SECURITY_BREACH: { code: 'SECURITY_BREACH', severity: 1, recoverable: false },
  DATA_CORRUPTION: { code: 'DATA_CORRUPTION', severity: 1, recoverable: false },
  
  // High Priority Errors (Severity 2)
  AUTHENTICATION_FAILURE: { code: 'AUTH_FAILURE', severity: 2, recoverable: true },
  AUTHORIZATION_DENIED: { code: 'AUTH_DENIED', severity: 2, recoverable: true },
  QUOTA_EXCEEDED: { code: 'QUOTA_EXCEEDED', severity: 2, recoverable: true },
  RATE_LIMITED: { code: 'RATE_LIMITED', severity: 2, recoverable: true },
  
  // Medium Priority Errors (Severity 3)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', severity: 3, recoverable: true },
  SPREADSHEET_API_ERROR: { code: 'SPREADSHEET_ERROR', severity: 3, recoverable: true },
  NETWORK_ERROR: { code: 'NETWORK_ERROR', severity: 3, recoverable: true },
  
  // Low Priority Errors (Severity 4)
  USER_INPUT_ERROR: { code: 'USER_INPUT_ERROR', severity: 4, recoverable: true },
  CACHE_MISS: { code: 'CACHE_MISS', severity: 4, recoverable: true },
  PERFORMANCE_WARNING: { code: 'PERFORMANCE_WARNING', severity: 4, recoverable: true }
};

/**
 * Production Error Handler Class
 */
class ProductionErrorHandler {
  constructor() {
    this.errorStore = new Map();
    this.auditLogger = null;
    this.notificationManager = null;
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize recovery strategies for different error types
   */
  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('QUOTA_EXCEEDED', this.handleQuotaExceeded.bind(this));
    this.recoveryStrategies.set('RATE_LIMITED', this.handleRateLimit.bind(this));
    this.recoveryStrategies.set('SPREADSHEET_ERROR', this.handleSpreadsheetError.bind(this));
    this.recoveryStrategies.set('NETWORK_ERROR', this.handleNetworkError.bind(this));
    this.recoveryStrategies.set('AUTH_FAILURE', this.handleAuthFailure.bind(this));
  }

  /**
   * Handle errors with comprehensive try-catch-finally pattern
   * @param {Error} error - The error object
   * @param {Object} context - Error context information
   * @param {Function} operation - The operation that failed
   * @param {Object} options - Recovery options
   * @returns {Object} Error handling result
   */
  handleWithRecovery(error, context = {}, operation = null, options = {}) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    try {
      // Classify the error
      const errorType = this.classifyError(error);
      const errorInfo = {
        id: errorId,
        type: errorType,
        severity: ProductionErrorTypes[errorType.code]?.severity || 3,
        message: error.message,
        stack: this.sanitizeStackTrace(error.stack),
        context: this.sanitizeContext(context),
        timestamp: timestamp,
        recoverable: ProductionErrorTypes[errorType.code]?.recoverable || false,
        userAgent: context.userAgent || 'Unknown',
        sessionId: context.sessionId || 'Unknown'
      };

      // Store error for analysis
      this.errorStore.set(errorId, errorInfo);

      // Log to audit system
      this.logToAudit(errorInfo);

      // Attempt recovery if possible
      let recoveryResult = null;
      if (errorInfo.recoverable && operation) {
        recoveryResult = this.attemptRecovery(errorInfo, operation, options);
      }

      // Send notifications for critical errors
      this.sendNotifications(errorInfo);

      // Generate user-friendly response
      const userResponse = this.generateUserResponse(errorInfo, recoveryResult);

      return {
        success: false,
        error: true,
        errorId: errorId,
        errorType: errorType.code,
        severity: errorInfo.severity,
        userMessage: userResponse.message,
        technicalDetails: this.getTechnicalDetails(errorInfo),
        recoveryAttempted: !!recoveryResult,
        recoverySuccess: recoveryResult?.success || false,
        timestamp: timestamp,
        context: errorInfo.context
      };

    } catch (handlingError) {
      // Critical: Error handler itself failed
      console.error('CRITICAL: Error handler failed:', handlingError);
      return this.generateFailsafeResponse(error, errorId, timestamp);
    } finally {
      // Cleanup and monitoring
      this.performCleanup(errorId);
      this.updateErrorMetrics(error);
    }
  }

  /**
   * Classify error based on message and context
   * @param {Error} error - The error to classify
   * @returns {Object} Error type information
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Security-related errors
    if (message.includes('unauthorized') || message.includes('forbidden') || 
        message.includes('csrf') || message.includes('xss')) {
      return ProductionErrorTypes.AUTHENTICATION_FAILURE;
    }

    // System-level errors
    if (message.includes('system') || message.includes('critical') || 
        message.includes('fatal')) {
      return ProductionErrorTypes.SYSTEM_FAILURE;
    }

    // API quota errors
    if (message.includes('quota') || message.includes('limit exceeded') ||
        message.includes('too many requests')) {
      return ProductionErrorTypes.QUOTA_EXCEEDED;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('required field')) {
      return ProductionErrorTypes.VALIDATION_ERROR;
    }

    // Spreadsheet API errors
    if (message.includes('spreadsheet') || message.includes('range') ||
        stack.includes('spreadsheetapp')) {
      return ProductionErrorTypes.SPREADSHEET_API_ERROR;
    }

    // Network errors
    if (message.includes('network') || message.includes('connection') ||
        message.includes('timeout')) {
      return ProductionErrorTypes.NETWORK_ERROR;
    }

    // Default to medium priority
    return ProductionErrorTypes.VALIDATION_ERROR;
  }

  /**
   * Attempt error recovery based on error type
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  attemptRecovery(errorInfo, operation, options = {}) {
    try {
      const strategy = this.recoveryStrategies.get(errorInfo.type.code);
      
      if (!strategy) {
        return { success: false, reason: 'No recovery strategy available' };
      }

      // Execute recovery strategy
      return strategy(errorInfo, operation, options);

    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return { 
        success: false, 
        reason: 'Recovery strategy failed',
        error: recoveryError.message 
      };
    }
  }

  /**
   * Handle quota exceeded errors
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  handleQuotaExceeded(errorInfo, operation, options) {
    const delay = options.retryDelay || 60000; // 1 minute default
    
    console.log(`Quota exceeded, waiting ${delay}ms before retry...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const result = operation();
          resolve({ success: true, result: result, strategy: 'delayed_retry' });
        } catch (retryError) {
          resolve({ 
            success: false, 
            reason: 'Retry failed after quota recovery',
            error: retryError.message 
          });
        }
      }, delay);
    });
  }

  /**
   * Handle rate limiting errors
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  handleRateLimit(errorInfo, operation, options) {
    const backoffDelay = Math.min(
      (options.attempt || 1) * 2000, 
      30000 // Max 30 seconds
    );
    
    console.log(`Rate limited, exponential backoff: ${backoffDelay}ms`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const result = operation();
          resolve({ success: true, result: result, strategy: 'exponential_backoff' });
        } catch (retryError) {
          resolve({ 
            success: false, 
            reason: 'Retry failed after rate limit recovery',
            error: retryError.message 
          });
        }
      }, backoffDelay);
    });
  }

  /**
   * Handle spreadsheet API errors
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  handleSpreadsheetError(errorInfo, operation, options) {
    try {
      // Clear caches that might be stale
      if (typeof CacheService !== 'undefined') {
        CacheService.getScriptCache().removeAll(['sheet_data', 'column_mapping']);
      }

      // Retry with fresh data
      const result = operation();
      return { success: true, result: result, strategy: 'cache_clear_retry' };

    } catch (retryError) {
      return { 
        success: false, 
        reason: 'Spreadsheet error recovery failed',
        error: retryError.message 
      };
    }
  }

  /**
   * Handle network errors
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  handleNetworkError(errorInfo, operation, options) {
    const maxRetries = options.maxRetries || 3;
    let retryCount = 0;

    const retryWithBackoff = () => {
      if (retryCount >= maxRetries) {
        return { 
          success: false, 
          reason: `Network error: Max retries (${maxRetries}) exceeded` 
        };
      }

      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      retryCount++;

      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            const result = operation();
            resolve({ 
              success: true, 
              result: result, 
              strategy: 'network_retry',
              attempts: retryCount 
            });
          } catch (retryError) {
            if (retryCount < maxRetries) {
              resolve(retryWithBackoff());
            } else {
              resolve({ 
                success: false, 
                reason: 'Network retry failed',
                error: retryError.message,
                attempts: retryCount
              });
            }
          }
        }, delay);
      });
    };

    return retryWithBackoff();
  }

  /**
   * Handle authentication failures
   * @param {Object} errorInfo - Error information
   * @param {Function} operation - Original operation
   * @param {Object} options - Recovery options
   * @returns {Object} Recovery result
   */
  handleAuthFailure(errorInfo, operation, options) {
    try {
      // Clear session data
      if (typeof Session !== 'undefined') {
        // Force session refresh
        const user = Session.getActiveUser();
        if (!user || !user.getEmail()) {
          return { 
            success: false, 
            reason: 'Authentication recovery failed: No valid session' 
          };
        }
      }

      // Retry operation with refreshed session
      const result = operation();
      return { success: true, result: result, strategy: 'session_refresh' };

    } catch (retryError) {
      return { 
        success: false, 
        reason: 'Authentication recovery failed',
        error: retryError.message 
      };
    }
  }

  /**
   * Sanitize stack trace for security
   * @param {string} stack - Original stack trace
   * @returns {string} Sanitized stack trace
   */
  sanitizeStackTrace(stack) {
    if (!stack) return '';
    
    return stack
      .split('\n')
      .filter(line => !line.includes('password') && !line.includes('token'))
      .map(line => line.replace(/\/[^\/]+@/g, '/***@'))
      .join('\n')
      .substring(0, 2000); // Limit length
  }

  /**
   * Sanitize context data for logging
   * @param {Object} context - Original context
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credentials'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Limit object size
    return JSON.parse(JSON.stringify(sanitized).substring(0, 5000));
  }

  /**
   * Log error to audit system
   * @param {Object} errorInfo - Error information
   */
  logToAudit(errorInfo) {
    try {
      if (!this.auditLogger) {
        // Initialize if not already done
        this.auditLogger = console; // Fallback to console
      }

      const auditEntry = {
        timestamp: errorInfo.timestamp,
        type: 'error',
        severity: errorInfo.severity,
        errorId: errorInfo.id,
        errorType: errorInfo.type.code,
        message: errorInfo.message,
        context: errorInfo.context,
        sessionId: errorInfo.sessionId,
        userAgent: errorInfo.userAgent
      };

      this.auditLogger.error('AUDIT_ERROR:', JSON.stringify(auditEntry));

    } catch (auditError) {
      console.error('Failed to log to audit system:', auditError);
    }
  }

  /**
   * Send notifications for critical errors
   * @param {Object} errorInfo - Error information
   */
  sendNotifications(errorInfo) {
    try {
      // Only notify for high severity errors
      if (errorInfo.severity <= 2) {
        if (!this.notificationManager) {
          // Initialize notification manager if available
          if (typeof NotificationManager !== 'undefined') {
            this.notificationManager = new NotificationManager();
          }
        }

        if (this.notificationManager) {
          const notification = {
            type: 'error_alert',
            severity: errorInfo.severity,
            title: `Critical Error: ${errorInfo.type.code}`,
            message: `Error ID: ${errorInfo.id}\nMessage: ${errorInfo.message}`,
            timestamp: errorInfo.timestamp,
            context: errorInfo.context
          };

          this.notificationManager.sendAlert(notification);
        }
      }

    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }

  /**
   * Generate user-friendly response
   * @param {Object} errorInfo - Error information
   * @param {Object} recoveryResult - Recovery attempt result
   * @returns {Object} User response
   */
  generateUserResponse(errorInfo, recoveryResult) {
    const baseMessages = {
      1: 'A critical system error occurred. Our team has been notified.',
      2: 'A service issue occurred. Please try again in a few moments.',
      3: 'An error occurred while processing your request.',
      4: 'Please check your input and try again.'
    };

    let message = baseMessages[errorInfo.severity] || baseMessages[3];

    if (recoveryResult?.success) {
      message += ' The issue has been automatically resolved.';
    } else if (errorInfo.recoverable) {
      message += ' Please try again later.';
    }

    return {
      message: message,
      errorCode: errorInfo.type.code,
      supportReference: errorInfo.id
    };
  }

  /**
   * Get technical details for admin users
   * @param {Object} errorInfo - Error information
   * @returns {Object} Technical details
   */
  getTechnicalDetails(errorInfo) {
    // Only return technical details if user has admin role
    try {
      const userRole = this.getUserRole();
      if (userRole === 'admin') {
        return {
          errorId: errorInfo.id,
          type: errorInfo.type.code,
          severity: errorInfo.severity,
          message: errorInfo.message,
          stack: errorInfo.stack,
          context: errorInfo.context,
          timestamp: errorInfo.timestamp
        };
      }
    } catch (roleError) {
      console.warn('Could not determine user role for technical details');
    }

    return null;
  }

  /**
   * Generate failsafe response when error handler fails
   * @param {Error} originalError - Original error
   * @param {string} errorId - Error ID
   * @param {string} timestamp - Timestamp
   * @returns {Object} Failsafe response
   */
  generateFailsafeResponse(originalError, errorId, timestamp) {
    return {
      success: false,
      error: true,
      errorId: errorId,
      errorType: 'HANDLER_FAILURE',
      severity: 1,
      userMessage: 'A critical error occurred. Please contact support.',
      technicalDetails: null,
      recoveryAttempted: false,
      recoverySuccess: false,
      timestamp: timestamp,
      context: { originalError: originalError.message }
    };
  }

  /**
   * Perform cleanup after error handling
   * @param {string} errorId - Error ID
   */
  performCleanup(errorId) {
    try {
      // Cleanup old error entries (keep last 1000)
      if (this.errorStore.size > 1000) {
        const entries = Array.from(this.errorStore.entries());
        entries.slice(0, -1000).forEach(([id]) => {
          this.errorStore.delete(id);
        });
      }

      // Log cleanup action
      console.log(`Cleanup completed for error ${errorId}`);

    } catch (cleanupError) {
      console.warn('Error cleanup failed:', cleanupError);
    }
  }

  /**
   * Update error metrics
   * @param {Error} error - Original error
   */
  updateErrorMetrics(error) {
    try {
      // Update error counters in properties
      const props = PropertiesService.getScriptProperties();
      const currentCount = parseInt(props.getProperty('error_count') || '0');
      props.setProperty('error_count', (currentCount + 1).toString());
      props.setProperty('last_error_time', new Date().toISOString());

    } catch (metricsError) {
      console.warn('Error metrics update failed:', metricsError);
    }
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR_${timestamp}_${random}`;
  }

  /**
   * Get current user role (placeholder)
   * @returns {string} User role
   */
  getUserRole() {
    try {
      // This would integrate with the actual user management system
      if (typeof UserManager !== 'undefined') {
        const user = UserManager.getCurrentUser();
        return user?.role || 'user';
      }
      return 'user';
    } catch (error) {
      return 'user';
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStatistics() {
    try {
      const props = PropertiesService.getScriptProperties();
      return {
        totalErrors: parseInt(props.getProperty('error_count') || '0'),
        lastErrorTime: props.getProperty('last_error_time') || 'Never',
        recentErrors: this.errorStore.size,
        errorTypes: this.getErrorTypeDistribution()
      };
    } catch (error) {
      return {
        totalErrors: 0,
        lastErrorTime: 'Unknown',
        recentErrors: 0,
        errorTypes: {}
      };
    }
  }

  /**
   * Get error type distribution
   * @returns {Object} Error type counts
   */
  getErrorTypeDistribution() {
    const distribution = {};
    this.errorStore.forEach(error => {
      const type = error.type.code;
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }
}

// Global instance
const productionErrorHandler = new ProductionErrorHandler();

/**
 * Enhanced error handling wrapper for functions
 * @param {Function} fn - Function to wrap
 * @param {Object} context - Additional context
 * @returns {Function} Wrapped function
 */
function withProductionErrorHandling(fn, context = {}) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      return productionErrorHandler.handleWithRecovery(
        error,
        { ...context, functionName: fn.name, arguments: args },
        () => fn.apply(this, args)
      );
    }
  };
}

/**
 * Async error handling wrapper
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} context - Additional context
 * @returns {Function} Wrapped async function
 */
function withAsyncProductionErrorHandling(asyncFn, context = {}) {
  return async function(...args) {
    try {
      return await asyncFn.apply(this, args);
    } catch (error) {
      return productionErrorHandler.handleWithRecovery(
        error,
        { ...context, functionName: asyncFn.name, arguments: args },
        () => asyncFn.apply(this, args)
      );
    }
  };
}
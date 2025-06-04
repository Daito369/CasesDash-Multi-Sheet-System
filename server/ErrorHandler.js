/**
 * CasesDash - Error Handling Framework
 * Comprehensive error management with logging and recovery
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * Error types for categorization
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION',
  SPREADSHEET_API: 'SPREADSHEET_API',
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  NETWORK: 'NETWORK',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INTERNAL: 'INTERNAL',
  USER_INPUT: 'USER_INPUT'
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * ErrorHandler class for centralized error management
 * Provides logging, categorization, and recovery mechanisms
 */
class ErrorHandler {
  
  /**
   * Log error with context and categorization
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   * @param {string} type - Error type category
   */
  static logError(error, context = {}, severity = ErrorSeverity.MEDIUM, type = ErrorTypes.INTERNAL) {
    try {
      const timestamp = new Date().toISOString();
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : null;
      
      const logEntry = {
        timestamp,
        message: errorMessage,
        stack: stackTrace,
        severity,
        type,
        context,
        user: Session.getActiveUser().getEmail(),
        scriptId: ScriptApp.newTrigger('dummy').getHandlerFunction() || 'unknown'
      };
      
      // Log to console for development
      console.error(`[${severity}] ${type}: ${errorMessage}`, logEntry);
      
      // Log to Properties Service for persistence
      this.persistError(logEntry);
      
      // Send to external logging service if configured
      this.sendToExternalLogger(logEntry);
      
    } catch (loggingError) {
      // Fallback logging to prevent infinite recursion
      console.error('Error in error logging:', loggingError);
    }
  }
  
  /**
   * Handle errors gracefully with user-friendly messages
   * @param {Error|string} error - Error to handle
   * @param {Object} options - Handling options
   * @returns {Object} Standardized error response
   */
  static handleGracefully(error, options = {}) {
    try {
      const {
        userMessage = 'An unexpected error occurred. Please try again.',
        showTechnicalDetails = false,
        severity = ErrorSeverity.MEDIUM,
        type = ErrorTypes.INTERNAL,
        context = {}
      } = options;
      
      // Log the error
      this.logError(error, context, severity, type);
      
      // Determine user-friendly message
      const friendlyMessage = this.getUserFriendlyMessage(error, userMessage);
      
      // Create standardized response
      const response = {
        success: false,
        error: true,
        message: friendlyMessage,
        type: type,
        severity: severity,
        timestamp: new Date().toISOString()
      };
      
      // Add technical details only for admin users to prevent information disclosure
      if (showTechnicalDetails && this.isAdminUser()) {
        response.technicalDetails = {
          originalMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? this.sanitizeStackTrace(error.stack) : null
        };
      } else if (showTechnicalDetails) {
        // Non-admin users get limited technical details
        response.errorId = this.generateErrorId();
        response.message = 'An error occurred. Please contact support with error ID: ' + response.errorId;
      }
      
      return response;
      
    } catch (handlingError) {
      // Ultimate fallback
      console.error('Error in error handling:', handlingError);
      return {
        success: false,
        error: true,
        message: 'A critical error occurred. Please contact support.',
        type: ErrorTypes.CRITICAL,
        severity: ErrorSeverity.CRITICAL,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get user-friendly error message based on error type
   * @private
   * @param {Error|string} error - Original error
   * @param {string} defaultMessage - Default message to use
   * @returns {string} User-friendly message
   */
  static getUserFriendlyMessage(error, defaultMessage) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for specific error patterns
    if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
      return 'Service temporarily unavailable due to high usage. Please try again in a few minutes.';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return 'The requested resource could not be found.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return 'Network connection issue. Please check your connection and try again.';
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      return 'Invalid input provided. Please check your data and try again.';
    }
    
    return defaultMessage;
  }
  
  /**
   * Persist error to Properties Service
   * @private
   * @param {Object} logEntry - Error log entry
   */
  static persistError(logEntry) {
    try {
      const properties = PropertiesService.getScriptProperties();
      const errorKey = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store error with expiration (30 days)
      const errorData = {
        ...logEntry,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      properties.setProperty(errorKey, JSON.stringify(errorData));
      
      // Cleanup old errors (keep only last 100)
      this.cleanupOldErrors();
      
    } catch (persistError) {
      console.error('Failed to persist error:', persistError);
    }
  }
  
  /**
   * Send error to external logging service
   * @private
   * @param {Object} logEntry - Error log entry
   */
  static sendToExternalLogger(logEntry) {
    try {
      // Implementation for external logging service (e.g., Google Cloud Logging)
      // This is a placeholder for future implementation
      
      if (logEntry.severity === ErrorSeverity.CRITICAL) {
        // Could send email notification for critical errors
        this.sendCriticalErrorNotification(logEntry);
      }
      
    } catch (externalError) {
      console.error('Failed to send to external logger:', externalError);
    }
  }
  
  /**
   * Send critical error notification
   * @private
   * @param {Object} logEntry - Error log entry
   */
  static sendCriticalErrorNotification(logEntry) {
    try {
      // Placeholder for critical error notifications
      // Could integrate with email, Slack, or other notification systems
      console.warn('CRITICAL ERROR DETECTED:', logEntry);
      
    } catch (notificationError) {
      console.error('Failed to send critical error notification:', notificationError);
    }
  }
  
  /**
   * Cleanup old error logs
   * @private
   */
  static cleanupOldErrors() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const allProperties = properties.getProperties();
      const errorKeys = Object.keys(allProperties).filter(key => key.startsWith('error_'));
      
      // Sort by timestamp and keep only last 100
      errorKeys.sort().slice(0, -100).forEach(key => {
        properties.deleteProperty(key);
      });
      
    } catch (cleanupError) {
      console.error('Failed to cleanup old errors:', cleanupError);
    }
  }
  
  /**
   * Get recent error logs
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array<Object>} Array of recent error logs
   */
  static getRecentErrors(limit = 50) {
    try {
      const properties = PropertiesService.getScriptProperties();
      const allProperties = properties.getProperties();
      const errorKeys = Object.keys(allProperties).filter(key => key.startsWith('error_'));
      
      const errors = errorKeys
        .sort()
        .slice(-limit)
        .map(key => {
          try {
            return JSON.parse(allProperties[key]);
          } catch (parseError) {
            return null;
          }
        })
        .filter(error => error !== null)
        .reverse(); // Most recent first
      
      return errors;
      
    } catch (retrievalError) {
      this.logError(retrievalError, { function: 'getRecentErrors' });
      return [];
    }
  }
  
  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Operation result
   */
  static async retryWithBackoff(operation, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      exponentialBase = 2,
      context = {}
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(exponentialBase, attempt - 1),
          maxDelay
        );
        
        this.logError(
          error,
          { ...context, attempt, maxRetries, nextRetryIn: delay },
          ErrorSeverity.LOW,
          ErrorTypes.INTERNAL
        );
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries failed
    throw lastError;
  }
  
  /**
   * Validate and sanitize user input
   * @param {any} input - Input to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  static validateInput(input, rules = {}) {
    try {
      const {
        type = 'string',
        required = false,
        minLength = 0,
        maxLength = Infinity,
        pattern = null,
        allowedValues = null
      } = rules;
      
      const result = { isValid: true, value: input, errors: [] };
      
      // Check required
      if (required && (input === null || input === undefined || input === '')) {
        result.isValid = false;
        result.errors.push('This field is required');
        return result;
      }
      
      // Skip further validation if not required and empty
      if (!required && (input === null || input === undefined || input === '')) {
        result.value = null;
        return result;
      }
      
      // Type validation
      switch (type) {
        case 'string':
          if (typeof input !== 'string') {
            result.isValid = false;
            result.errors.push('Must be a string');
          }
          break;
          
        case 'number':
          if (isNaN(Number(input))) {
            result.isValid = false;
            result.errors.push('Must be a number');
          } else {
            result.value = Number(input);
          }
          break;
          
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(input)) {
            result.isValid = false;
            result.errors.push('Must be a valid email address');
          }
          break;
          
        case 'date':
          if (!(input instanceof Date) && isNaN(Date.parse(input))) {
            result.isValid = false;
            result.errors.push('Must be a valid date');
          } else {
            result.value = new Date(input);
          }
          break;
      }
      
      // Length validation for strings
      if (type === 'string' && typeof input === 'string') {
        if (input.length < minLength) {
          result.isValid = false;
          result.errors.push(`Must be at least ${minLength} characters long`);
        }
        
        if (input.length > maxLength) {
          result.isValid = false;
          result.errors.push(`Must be no more than ${maxLength} characters long`);
        }
      }
      
      // Pattern validation
      if (pattern && typeof input === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(input)) {
          result.isValid = false;
          result.errors.push('Invalid format');
        }
      }
      
      // Allowed values validation
      if (allowedValues && !allowedValues.includes(input)) {
        result.isValid = false;
        result.errors.push(`Must be one of: ${allowedValues.join(', ')}`);
      }
      
      // XSS prevention for strings
      if (type === 'string' && typeof input === 'string') {
        result.value = this.sanitizeHtml(input);
      }
      
      return result;
      
    } catch (validationError) {
      this.logError(validationError, { input, rules }, ErrorSeverity.MEDIUM, ErrorTypes.VALIDATION);
      return {
        isValid: false,
        value: input,
        errors: ['Validation error occurred']
      };
    }
  }
  
  /**
   * Sanitize HTML to prevent XSS
   * @private
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeHtml(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Check if current user is admin for security purposes
   * @returns {boolean} True if user is admin
   */
  static isAdminUser() {
    try {
      const userEmail = Session.getActiveUser().getEmail();
      const adminConfig = SecurityConfig.getAdminConfig();
      return adminConfig.adminEmails.includes(userEmail) || 
             adminConfig.superAdminEmails.includes(userEmail);
    } catch (error) {
      console.warn('Failed to check admin status:', error.message);
      return false; // Default to non-admin for security
    }
  }
  
  /**
   * Generate unique error ID for tracking
   * @returns {string} Unique error ID
   */
  static generateErrorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ERR_${timestamp}_${random}`;
  }
  
  /**
   * Sanitize stack trace to remove sensitive information
   * @param {string} stack - Original stack trace
   * @returns {string} Sanitized stack trace
   */
  static sanitizeStackTrace(stack) {
    if (!stack) return null;
    
    try {
      // Remove file paths and sensitive information
      return stack
        .split('\n')
        .map(line => {
          // Remove full file paths, keep only function names and line numbers
          return line.replace(/\/[^\/]*\//g, '').replace(/\([^)]*\)/g, '(...)');
        })
        .slice(0, 5) // Limit to first 5 lines
        .join('\n');
    } catch (error) {
      return 'Stack trace sanitization failed';
    }
  }
  
  /**
   * Validate and sanitize error context to prevent information leakage
   * @param {Object} context - Error context
   * @returns {Object} Sanitized context
   */
  static sanitizeErrorContext(context) {
    if (!context) return {};
    
    try {
      const sensitiveFields = ['password', 'token', 'apiKey', 'sessionId', 'secret', 'key'];
      const sanitized = {};
      
      for (const [key, value] of Object.entries(context)) {
        // Skip sensitive fields
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
          continue;
        }
        
        // Sanitize string values
        if (typeof value === 'string') {
          sanitized[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
        } else if (typeof value === 'object') {
          sanitized[key] = '[OBJECT]';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
      
    } catch (error) {
      return { sanitizationError: 'Failed to sanitize context' };
    }
  }
}

// Export error types and severity for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, ErrorTypes, ErrorSeverity };
}
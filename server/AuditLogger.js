/**
 * CasesDash - Audit Logger System
 * Comprehensive audit logging with privacy protection and anomaly detection
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Audit event types and their criticality levels
 */
const AuditEventTypes = {
  // Security Events (Critical)
  LOGIN_SUCCESS: { type: 'LOGIN_SUCCESS', category: 'security', level: 'info', retention: 365 },
  LOGIN_FAILURE: { type: 'LOGIN_FAILURE', category: 'security', level: 'warning', retention: 365 },
  UNAUTHORIZED_ACCESS: { type: 'UNAUTHORIZED_ACCESS', category: 'security', level: 'critical', retention: 2555 },
  PERMISSION_DENIED: { type: 'PERMISSION_DENIED', category: 'security', level: 'warning', retention: 365 },
  SESSION_HIJACK_ATTEMPT: { type: 'SESSION_HIJACK', category: 'security', level: 'critical', retention: 2555 },
  
  // Data Events (High)
  DATA_ACCESS: { type: 'DATA_ACCESS', category: 'data', level: 'info', retention: 180 },
  DATA_MODIFICATION: { type: 'DATA_MODIFICATION', category: 'data', level: 'info', retention: 365 },
  DATA_DELETION: { type: 'DATA_DELETION', category: 'data', level: 'warning', retention: 2555 },
  DATA_EXPORT: { type: 'DATA_EXPORT', category: 'data', level: 'warning', retention: 365 },
  BULK_OPERATION: { type: 'BULK_OPERATION', category: 'data', level: 'info', retention: 365 },
  
  // System Events (Medium)
  SYSTEM_ERROR: { type: 'SYSTEM_ERROR', category: 'system', level: 'error', retention: 180 },
  PERFORMANCE_ISSUE: { type: 'PERFORMANCE_ISSUE', category: 'system', level: 'warning', retention: 90 },
  QUOTA_EXCEEDED: { type: 'QUOTA_EXCEEDED', category: 'system', level: 'warning', retention: 90 },
  CONFIGURATION_CHANGE: { type: 'CONFIG_CHANGE', category: 'system', level: 'info', retention: 365 },
  
  // User Events (Low)
  USER_ACTION: { type: 'USER_ACTION', category: 'user', level: 'info', retention: 90 },
  SEARCH_PERFORMED: { type: 'SEARCH_PERFORMED', category: 'user', level: 'info', retention: 30 },
  REPORT_GENERATED: { type: 'REPORT_GENERATED', category: 'user', level: 'info', retention: 90 }
};

/**
 * Comprehensive Audit Logger Class
 */
class AuditLogger {
  constructor() {
    this.logBuffer = [];
    this.anomalyDetector = new AnomalyDetector();
    this.privacyProcessor = new PrivacyProcessor();
    this.logRotation = new LogRotation();
    this.maxBufferSize = 100;
    this.flushInterval = 30000; // 30 seconds
    this.startPeriodicFlush();
  }

  /**
   * Log an audit event with comprehensive context
   * @param {string} eventType - Type of event from AuditEventTypes
   * @param {Object} details - Event details
   * @param {Object} context - Additional context
   * @returns {string} Log entry ID
   */
  logEvent(eventType, details = {}, context = {}) {
    try {
      const eventConfig = AuditEventTypes[eventType];
      if (!eventConfig) {
        console.warn(`Unknown audit event type: ${eventType}`);
        return null;
      }

      const logEntry = this.createLogEntry(eventType, eventConfig, details, context);
      
      // Process for privacy compliance
      const processedEntry = this.privacyProcessor.process(logEntry);
      
      // Check for anomalies
      this.anomalyDetector.analyze(processedEntry);
      
      // Add to buffer
      this.logBuffer.push(processedEntry);
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs();
      }

      return processedEntry.id;

    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Fallback logging
      this.logFallback(eventType, details, error);
      return null;
    }
  }

  /**
   * Create comprehensive log entry
   * @param {string} eventType - Event type
   * @param {Object} eventConfig - Event configuration
   * @param {Object} details - Event details
   * @param {Object} context - Additional context
   * @returns {Object} Log entry
   */
  createLogEntry(eventType, eventConfig, details, context) {
    const timestamp = new Date().toISOString();
    const logId = this.generateLogId();
    
    // Get user information safely
    const userInfo = this.getUserInfo();
    
    // Get session information
    const sessionInfo = this.getSessionInfo();
    
    // Get system information
    const systemInfo = this.getSystemInfo();

    return {
      id: logId,
      timestamp: timestamp,
      eventType: eventType,
      category: eventConfig.category,
      level: eventConfig.level,
      retentionDays: eventConfig.retention,
      
      // User context
      user: {
        email: userInfo.email,
        role: userInfo.role,
        authenticated: userInfo.authenticated,
        domain: userInfo.domain
      },
      
      // Session context
      session: {
        id: sessionInfo.id,
        startTime: sessionInfo.startTime,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent
      },
      
      // System context
      system: {
        version: systemInfo.version,
        executionTime: systemInfo.executionTime,
        memoryUsage: systemInfo.memoryUsage,
        quotaUsage: systemInfo.quotaUsage
      },
      
      // Event details
      details: this.sanitizeDetails(details),
      
      // Additional context
      context: this.sanitizeContext(context),
      
      // Metadata
      metadata: {
        source: 'CasesDash',
        environment: this.getEnvironment(),
        correlationId: context.correlationId || this.generateCorrelationId(),
        requestId: context.requestId || this.generateRequestId()
      }
    };
  }

  /**
   * Get current user information safely
   * @returns {Object} User information
   */
  getUserInfo() {
    try {
      let userInfo = {
        email: 'anonymous',
        role: 'guest',
        authenticated: false,
        domain: 'unknown'
      };

      // Try to get user from session
      if (typeof Session !== 'undefined') {
        const user = Session.getActiveUser();
        if (user && user.getEmail()) {
          userInfo.email = user.getEmail();
          userInfo.authenticated = true;
          userInfo.domain = user.getEmail().split('@')[1] || 'unknown';
        }
      }

      // Try to get role from UserManager
      if (typeof UserManager !== 'undefined' && userInfo.authenticated) {
        try {
          const roleInfo = UserManager.getCurrentUser();
          userInfo.role = roleInfo?.role || 'user';
        } catch (roleError) {
          console.warn('Could not get user role:', roleError.message);
        }
      }

      return userInfo;

    } catch (error) {
      console.warn('Could not get user info for audit:', error.message);
      return {
        email: 'error',
        role: 'unknown',
        authenticated: false,
        domain: 'unknown'
      };
    }
  }

  /**
   * Get session information
   * @returns {Object} Session information
   */
  getSessionInfo() {
    try {
      return {
        id: this.getSessionId(),
        startTime: this.getSessionStartTime(),
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      };
    } catch (error) {
      return {
        id: 'unknown',
        startTime: 'unknown',
        ipAddress: 'unknown',
        userAgent: 'unknown'
      };
    }
  }

  /**
   * Get system information
   * @returns {Object} System information
   */
  getSystemInfo() {
    try {
      return {
        version: this.getSystemVersion(),
        executionTime: this.getExecutionTime(),
        memoryUsage: this.getMemoryUsage(),
        quotaUsage: this.getQuotaUsage()
      };
    } catch (error) {
      return {
        version: 'unknown',
        executionTime: 0,
        memoryUsage: 'unknown',
        quotaUsage: 'unknown'
      };
    }
  }

  /**
   * Sanitize event details for logging
   * @param {Object} details - Original details
   * @returns {Object} Sanitized details
   */
  sanitizeDetails(details) {
    const sanitized = JSON.parse(JSON.stringify(details));
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'apiKey', 'secret', 'credentials', 
      'ssn', 'creditCard', 'bankAccount', 'socialSecurity'
    ];
    
    this.recursiveRedact(sanitized, sensitiveFields);
    
    // Limit size
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 10000) {
      return {
        size: jsonString.length,
        truncated: true,
        preview: jsonString.substring(0, 1000) + '...[TRUNCATED]'
      };
    }
    
    return sanitized;
  }

  /**
   * Sanitize context for logging
   * @param {Object} context - Original context
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    const sanitized = JSON.parse(JSON.stringify(context));
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    this.recursiveRedact(sanitized, sensitiveFields);
    
    return sanitized;
  }

  /**
   * Recursively redact sensitive fields
   * @param {Object} obj - Object to process
   * @param {Array} sensitiveFields - Fields to redact
   */
  recursiveRedact(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.recursiveRedact(obj[key], sensitiveFields);
      }
    });
  }

  /**
   * Flush logs to persistent storage
   */
  flushLogs() {
    if (this.logBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      // Store in Properties Service (chunked for size limits)
      this.storeLogsInChunks(logsToFlush);

      // Store in spreadsheet if available
      this.storeLogsInSheet(logsToFlush);

      console.log(`Flushed ${logsToFlush.length} audit log entries`);

    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Put logs back in buffer for retry
      this.logBuffer = [...this.logBuffer, ...logsToFlush];
    }
  }

  /**
   * Store logs in Properties Service in chunks
   * @param {Array} logs - Logs to store
   */
  storeLogsInChunks(logs) {
    try {
      const props = PropertiesService.getScriptProperties();
      const chunkSize = 10; // Properties have size limits
      
      for (let i = 0; i < logs.length; i += chunkSize) {
        const chunk = logs.slice(i, i + chunkSize);
        const chunkKey = `audit_logs_${Date.now()}_${i}`;
        const chunkData = JSON.stringify({
          timestamp: new Date().toISOString(),
          logs: chunk
        });
        
        props.setProperty(chunkKey, chunkData);
      }

      // Update log index
      const existingIndex = JSON.parse(props.getProperty('audit_log_index') || '[]');
      const newEntries = logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        eventType: log.eventType,
        level: log.level
      }));
      
      const updatedIndex = [...existingIndex, ...newEntries].slice(-1000); // Keep last 1000
      props.setProperty('audit_log_index', JSON.stringify(updatedIndex));

    } catch (error) {
      console.error('Failed to store logs in Properties Service:', error);
    }
  }

  /**
   * Store logs in spreadsheet for long-term storage
   * @param {Array} logs - Logs to store
   */
  storeLogsInSheet(logs) {
    try {
      // Only store if audit sheet is configured
      const auditSheetId = PropertiesService.getScriptProperties().getProperty('AUDIT_SHEET_ID');
      if (!auditSheetId) return;

      const spreadsheet = SpreadsheetApp.openById(auditSheetId);
      let sheet = spreadsheet.getSheetByName('AuditLogs');
      
      if (!sheet) {
        sheet = spreadsheet.insertSheet('AuditLogs');
        this.setupAuditSheet(sheet);
      }

      // Convert logs to sheet format
      const rows = logs.map(log => [
        log.timestamp,
        log.id,
        log.eventType,
        log.level,
        log.user.email,
        log.user.role,
        log.session.id,
        JSON.stringify(log.details),
        JSON.stringify(log.context),
        log.metadata.correlationId
      ]);

      // Append rows
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
      }

    } catch (error) {
      console.warn('Failed to store logs in spreadsheet:', error);
    }
  }

  /**
   * Setup audit sheet headers
   * @param {Sheet} sheet - Spreadsheet sheet
   */
  setupAuditSheet(sheet) {
    const headers = [
      'Timestamp', 'Log ID', 'Event Type', 'Level', 'User Email', 
      'User Role', 'Session ID', 'Details', 'Context', 'Correlation ID'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  /**
   * Start periodic log flushing
   */
  startPeriodicFlush() {
    // Set up periodic flushing using triggers if available
    try {
      // Create a time-based trigger for periodic flushing
      const trigger = ScriptApp.newTrigger('flushAuditLogs')
        .timeBased()
        .everyMinutes(1)
        .create();
        
      console.log('Audit log periodic flush trigger created');
    } catch (error) {
      console.warn('Could not create periodic flush trigger:', error);
    }
  }

  /**
   * Search audit logs
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching log entries
   */
  searchLogs(criteria = {}) {
    try {
      const props = PropertiesService.getScriptProperties();
      const index = JSON.parse(props.getProperty('audit_log_index') || '[]');
      
      let results = index;

      // Filter by event type
      if (criteria.eventType) {
        results = results.filter(log => log.eventType === criteria.eventType);
      }

      // Filter by level
      if (criteria.level) {
        results = results.filter(log => log.level === criteria.level);
      }

      // Filter by date range
      if (criteria.startDate) {
        const startDate = new Date(criteria.startDate);
        results = results.filter(log => new Date(log.timestamp) >= startDate);
      }

      if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        results = results.filter(log => new Date(log.timestamp) <= endDate);
      }

      // Limit results
      const limit = criteria.limit || 100;
      return results.slice(0, limit);

    } catch (error) {
      console.error('Failed to search audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   * @returns {Object} Audit statistics
   */
  getAuditStatistics() {
    try {
      const props = PropertiesService.getScriptProperties();
      const index = JSON.parse(props.getProperty('audit_log_index') || '[]');
      
      const stats = {
        totalEntries: index.length,
        byEventType: {},
        byLevel: {},
        recentActivity: index.slice(-10),
        oldestEntry: index.length > 0 ? index[0].timestamp : null,
        newestEntry: index.length > 0 ? index[index.length - 1].timestamp : null
      };

      // Count by event type and level
      index.forEach(log => {
        stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return {
        totalEntries: 0,
        byEventType: {},
        byLevel: {},
        recentActivity: [],
        oldestEntry: null,
        newestEntry: null
      };
    }
  }

  /**
   * Clean up old logs based on retention policies
   */
  cleanupOldLogs() {
    try {
      const props = PropertiesService.getScriptProperties();
      const index = JSON.parse(props.getProperty('audit_log_index') || '[]');
      
      const now = new Date();
      const retainedLogs = [];
      
      index.forEach(log => {
        const logDate = new Date(log.timestamp);
        const eventConfig = AuditEventTypes[log.eventType];
        const retentionDays = eventConfig?.retention || 90;
        const expiryDate = new Date(logDate.getTime() + (retentionDays * 24 * 60 * 60 * 1000));
        
        if (now < expiryDate) {
          retainedLogs.push(log);
        }
      });

      // Update index with retained logs
      props.setProperty('audit_log_index', JSON.stringify(retainedLogs));
      
      const removedCount = index.length - retainedLogs.length;
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} expired audit log entries`);
      }

    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // Utility methods
  generateLogId() {
    return `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generateCorrelationId() {
    return `CORR_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  generateRequestId() {
    return `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  getSessionId() {
    try {
      return Session.getActiveUser().getEmail() + '_' + Date.now();
    } catch (error) {
      return 'session_' + Date.now();
    }
  }

  getSessionStartTime() {
    return new Date().toISOString();
  }

  getClientIP() {
    return 'google_apps_script'; // GAS doesn't provide real IP
  }

  getUserAgent() {
    return 'GoogleAppsScript/1.0';
  }

  getSystemVersion() {
    return '2.0.0';
  }

  getExecutionTime() {
    return Date.now() - (this.startTime || Date.now());
  }

  getMemoryUsage() {
    return 'unknown'; // GAS doesn't provide memory info
  }

  getQuotaUsage() {
    return 'unknown'; // Would need to track separately
  }

  getEnvironment() {
    return 'production'; // Could be configured
  }

  logFallback(eventType, details, error) {
    console.error(`AUDIT_FALLBACK: ${eventType}`, {
      details: details,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Privacy Processor for audit logs
 */
class PrivacyProcessor {
  constructor() {
    this.piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email (selective)
    ];
  }

  process(logEntry) {
    // Apply anonymization based on event type and user role
    const processed = JSON.parse(JSON.stringify(logEntry));
    
    // Hash sensitive identifiers
    if (processed.details.customerId) {
      processed.details.customerId = this.hashSensitiveData(processed.details.customerId);
    }

    // Anonymize IP addresses (keep subnet)
    if (processed.session.ipAddress && processed.session.ipAddress !== 'google_apps_script') {
      processed.session.ipAddress = this.anonymizeIP(processed.session.ipAddress);
    }

    return processed;
  }

  hashSensitiveData(data) {
    // Simple hash for demonstration - use proper crypto in production
    return 'HASH_' + Math.abs(data.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
  }

  anonymizeIP(ip) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
    }
    return 'XXX.XXX.XXX.XXX';
  }
}

/**
 * Anomaly Detector for audit logs
 */
class AnomalyDetector {
  constructor() {
    this.baselinePatterns = new Map();
    this.alertThresholds = {
      failedLogins: 5,
      bulkOperations: 10,
      offHoursAccess: 3,
      suspiciousPatterns: 1
    };
  }

  analyze(logEntry) {
    try {
      // Check for failed login patterns
      if (logEntry.eventType === 'LOGIN_FAILURE') {
        this.checkFailedLoginPattern(logEntry);
      }

      // Check for unusual access patterns
      if (logEntry.eventType === 'DATA_ACCESS') {
        this.checkAccessPattern(logEntry);
      }

      // Check for bulk operations
      if (logEntry.eventType === 'BULK_OPERATION') {
        this.checkBulkOperationPattern(logEntry);
      }

      // Check for off-hours access
      this.checkOffHoursAccess(logEntry);

    } catch (error) {
      console.warn('Anomaly detection failed:', error);
    }
  }

  checkFailedLoginPattern(logEntry) {
    const userKey = logEntry.user.email;
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();
    
    if (!this.baselinePatterns.has(userKey)) {
      this.baselinePatterns.set(userKey, { failedLogins: [], lastCheck: now });
    }
    
    const userData = this.baselinePatterns.get(userKey);
    userData.failedLogins.push(now);
    
    // Remove old entries
    userData.failedLogins = userData.failedLogins.filter(time => now - time < timeWindow);
    
    if (userData.failedLogins.length >= this.alertThresholds.failedLogins) {
      this.triggerAnomalyAlert('SUSPICIOUS_LOGIN_PATTERN', logEntry, {
        failedAttempts: userData.failedLogins.length,
        timeWindow: '15 minutes'
      });
    }
  }

  checkAccessPattern(logEntry) {
    // Check for unusual access patterns (placeholder)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      this.triggerAnomalyAlert('OFF_HOURS_ACCESS', logEntry, {
        accessTime: logEntry.timestamp,
        hour: hour
      });
    }
  }

  checkBulkOperationPattern(logEntry) {
    // Check for unusual bulk operations (placeholder)
    if (logEntry.details.recordCount > this.alertThresholds.bulkOperations) {
      this.triggerAnomalyAlert('LARGE_BULK_OPERATION', logEntry, {
        recordCount: logEntry.details.recordCount,
        threshold: this.alertThresholds.bulkOperations
      });
    }
  }

  checkOffHoursAccess(logEntry) {
    const hour = new Date(logEntry.timestamp).getHours();
    const isWeekend = [0, 6].includes(new Date(logEntry.timestamp).getDay());
    
    if ((hour < 6 || hour > 22) || isWeekend) {
      if (logEntry.eventType === 'DATA_ACCESS' || logEntry.eventType === 'DATA_MODIFICATION') {
        this.triggerAnomalyAlert('OFF_HOURS_DATA_ACCESS', logEntry, {
          accessTime: logEntry.timestamp,
          hour: hour,
          isWeekend: isWeekend
        });
      }
    }
  }

  triggerAnomalyAlert(anomalyType, logEntry, details) {
    console.warn(`ANOMALY DETECTED: ${anomalyType}`, {
      logId: logEntry.id,
      user: logEntry.user.email,
      details: details,
      timestamp: logEntry.timestamp
    });

    // Log the anomaly as a separate audit event
    const auditLogger = new AuditLogger();
    auditLogger.logEvent('SYSTEM_ERROR', {
      anomalyType: anomalyType,
      originalLogId: logEntry.id,
      details: details
    }, {
      correlationId: logEntry.metadata.correlationId
    });
  }
}

/**
 * Log Rotation Manager
 */
class LogRotation {
  constructor() {
    this.maxSize = 50000; // Max properties size
    this.archiveThreshold = 40000;
  }

  checkRotation() {
    try {
      const props = PropertiesService.getScriptProperties();
      const currentSize = JSON.stringify(props.getProperties()).length;
      
      if (currentSize > this.archiveThreshold) {
        this.rotateLog();
      }
    } catch (error) {
      console.warn('Log rotation check failed:', error);
    }
  }

  rotateLog() {
    try {
      console.log('Starting log rotation...');
      
      const props = PropertiesService.getScriptProperties();
      const currentLogs = props.getProperty('audit_log_index');
      
      if (currentLogs) {
        // Archive current logs
        const archiveKey = `audit_logs_archive_${Date.now()}`;
        props.setProperty(archiveKey, currentLogs);
        
        // Clear current logs
        props.deleteProperty('audit_log_index');
        
        console.log('Log rotation completed');
      }
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

// Global function for periodic flush (called by trigger)
function flushAuditLogs() {
  try {
    auditLogger.flushLogs();
    auditLogger.cleanupOldLogs();
  } catch (error) {
    console.error('Periodic audit log flush failed:', error);
  }
}
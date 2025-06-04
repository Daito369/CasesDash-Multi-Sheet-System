/**
 * CasesDash - Enhanced Session Manager
 * Comprehensive session management with security features and fraud detection
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Session configuration
 */
const SessionConfig = {
  // Session timeouts
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
  IDLE_TIMEOUT: 2 * 60 * 60 * 1000,         // 2 hours
  WARNING_BEFORE_EXPIRY: 10 * 60 * 1000,    // 10 minutes
  
  // Security settings
  MAX_CONCURRENT_SESSIONS: 3,
  SESSION_ROTATION_INTERVAL: 30 * 60 * 1000, // 30 minutes
  SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
  
  // Session storage
  SESSION_STORE_PREFIX: 'session_',
  USER_SESSION_PREFIX: 'user_sessions_',
  
  // Activity tracking
  ACTIVITY_LOG_SIZE: 50,
  SECURITY_EVENT_RETENTION: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Session security levels
 */
const SecurityLevels = {
  LOW: { level: 1, requireReauth: false, monitoring: 'basic' },
  MEDIUM: { level: 2, requireReauth: false, monitoring: 'enhanced' },
  HIGH: { level: 3, requireReauth: true, monitoring: 'comprehensive' },
  CRITICAL: { level: 4, requireReauth: true, monitoring: 'maximum' }
};

/**
 * Enhanced Session Manager Class
 */
class EnhancedSessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.userSessions = new Map();
    this.securityMonitor = new SessionSecurityMonitor();
    this.activityTracker = new ActivityTracker();
    this.auditLogger = null;
    this.notificationManager = null;
    this.initializeComponents();
    this.startPeriodicTasks();
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
      
      // Load existing sessions from storage
      this.loadSessionsFromStorage();
      
    } catch (error) {
      console.warn('Could not initialize all session components:', error);
    }
  }

  /**
   * Create new user session
   * @param {string} userId - User identifier
   * @param {Object} userInfo - User information
   * @param {Object} context - Session context
   * @returns {Object} Session creation result
   */
  createSession(userId, userInfo, context = {}) {
    try {
      // Check for existing sessions
      const existingSessions = this.getUserSessions(userId);
      
      // Enforce concurrent session limits
      if (existingSessions.length >= SessionConfig.MAX_CONCURRENT_SESSIONS) {
        return this.handleMaxSessionsExceeded(userId, existingSessions, context);
      }

      // Generate secure session
      const sessionData = this.generateSecureSession(userId, userInfo, context);
      
      // Check for suspicious patterns
      const securityCheck = this.securityMonitor.checkSessionCreation(userId, sessionData, context);
      if (!securityCheck.allowed) {
        return this.handleSuspiciousActivity(userId, securityCheck, context);
      }

      // Store session
      this.storeSession(sessionData);
      
      // Log session creation
      this.logSessionEvent('SESSION_CREATED', sessionData, context);
      
      // Start session monitoring
      this.startSessionMonitoring(sessionData.sessionId);

      return {
        success: true,
        sessionId: sessionData.sessionId,
        expiresAt: sessionData.expiresAt,
        securityLevel: sessionData.securityLevel,
        features: sessionData.features
      };

    } catch (error) {
      console.error('Session creation failed:', error);
      return {
        success: false,
        error: error.message,
        code: 'SESSION_CREATION_FAILED'
      };
    }
  }

  /**
   * Validate session
   * @param {string} sessionId - Session identifier
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  validateSession(sessionId, context = {}) {
    try {
      const session = this.getSession(sessionId);
      
      if (!session) {
        return {
          valid: false,
          reason: 'SESSION_NOT_FOUND',
          action: 'redirect_login'
        };
      }

      // Check expiration
      const now = Date.now();
      if (now > session.expiresAt) {
        this.expireSession(sessionId, 'EXPIRED');
        return {
          valid: false,
          reason: 'SESSION_EXPIRED',
          action: 'redirect_login'
        };
      }

      // Check idle timeout
      if (now - session.lastActivity > SessionConfig.IDLE_TIMEOUT) {
        this.expireSession(sessionId, 'IDLE_TIMEOUT');
        return {
          valid: false,
          reason: 'SESSION_IDLE_TIMEOUT',
          action: 'redirect_login'
        };
      }

      // Security validation
      const securityCheck = this.securityMonitor.validateSession(session, context);
      if (!securityCheck.valid) {
        this.handleSecurityViolation(session, securityCheck, context);
        return {
          valid: false,
          reason: securityCheck.reason,
          action: securityCheck.action
        };
      }

      // Update session activity
      this.updateSessionActivity(sessionId, context);

      // Check if session needs rotation
      if (this.shouldRotateSession(session)) {
        return this.rotateSession(sessionId, context);
      }

      // Check for session expiry warning
      const timeToExpiry = session.expiresAt - now;
      const warningNeeded = timeToExpiry <= SessionConfig.WARNING_BEFORE_EXPIRY;

      return {
        valid: true,
        session: this.sanitizeSessionForClient(session),
        warningNeeded: warningNeeded,
        timeToExpiry: timeToExpiry,
        features: session.features
      };

    } catch (error) {
      console.error('Session validation failed:', error);
      return {
        valid: false,
        reason: 'VALIDATION_ERROR',
        action: 'redirect_login',
        error: error.message
      };
    }
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session identifier
   * @param {Object} context - Activity context
   */
  updateSessionActivity(sessionId, context = {}) {
    try {
      const session = this.getSession(sessionId);
      if (!session) return;

      const now = Date.now();
      
      // Update last activity
      session.lastActivity = now;
      session.activityCount++;

      // Track detailed activity
      this.activityTracker.recordActivity(sessionId, {
        timestamp: now,
        action: context.action || 'unknown',
        endpoint: context.endpoint || 'unknown',
        userAgent: context.userAgent || session.userAgent,
        ipAddress: context.ipAddress || session.ipAddress
      });

      // Update session in storage
      this.storeSession(session);

      // Check for unusual activity patterns
      this.securityMonitor.analyzeActivity(session, context);

    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * Rotate session for security
   * @param {string} currentSessionId - Current session ID
   * @param {Object} context - Rotation context
   * @returns {Object} Rotation result
   */
  rotateSession(currentSessionId, context = {}) {
    try {
      const oldSession = this.getSession(currentSessionId);
      if (!oldSession) {
        return {
          valid: false,
          reason: 'SESSION_NOT_FOUND',
          action: 'redirect_login'
        };
      }

      // Create new session with same user data
      const newSessionData = this.generateSecureSession(
        oldSession.userId,
        oldSession.userInfo,
        { ...context, rotatedFrom: currentSessionId }
      );

      // Copy important data from old session
      newSessionData.securityLevel = oldSession.securityLevel;
      newSessionData.features = oldSession.features;
      newSessionData.activityCount = oldSession.activityCount;

      // Store new session
      this.storeSession(newSessionData);

      // Invalidate old session
      this.expireSession(currentSessionId, 'ROTATED');

      // Log rotation
      this.logSessionEvent('SESSION_ROTATED', newSessionData, {
        ...context,
        oldSessionId: currentSessionId
      });

      return {
        valid: true,
        rotated: true,
        newSessionId: newSessionData.sessionId,
        session: this.sanitizeSessionForClient(newSessionData)
      };

    } catch (error) {
      console.error('Session rotation failed:', error);
      return {
        valid: false,
        reason: 'ROTATION_FAILED',
        action: 'redirect_login'
      };
    }
  }

  /**
   * Expire session
   * @param {string} sessionId - Session identifier
   * @param {string} reason - Expiration reason
   */
  expireSession(sessionId, reason = 'MANUAL') {
    try {
      const session = this.getSession(sessionId);
      
      if (session) {
        // Mark as expired
        session.status = 'expired';
        session.expiredAt = Date.now();
        session.expiredReason = reason;

        // Log expiration
        this.logSessionEvent('SESSION_EXPIRED', session, { reason });

        // Remove from active sessions
        this.removeSession(sessionId);

        // Clean up user session list
        this.removeUserSession(session.userId, sessionId);
      }

    } catch (error) {
      console.error('Session expiration failed:', error);
    }
  }

  /**
   * Extend session duration
   * @param {string} sessionId - Session identifier
   * @param {number} extensionMs - Extension in milliseconds
   * @returns {Object} Extension result
   */
  extendSession(sessionId, extensionMs = SessionConfig.IDLE_TIMEOUT) {
    try {
      const session = this.getSession(sessionId);
      
      if (!session) {
        return { success: false, reason: 'SESSION_NOT_FOUND' };
      }

      // Check if extension is allowed
      const maxExtendedTime = session.createdAt + SessionConfig.MAX_SESSION_DURATION;
      const newExpiryTime = Math.min(Date.now() + extensionMs, maxExtendedTime);

      session.expiresAt = newExpiryTime;
      session.extendedCount = (session.extendedCount || 0) + 1;

      this.storeSession(session);

      this.logSessionEvent('SESSION_EXTENDED', session, {
        extensionMs: extensionMs,
        newExpiryTime: newExpiryTime
      });

      return {
        success: true,
        newExpiryTime: newExpiryTime,
        extendedCount: session.extendedCount
      };

    } catch (error) {
      console.error('Session extension failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user sessions
   * @param {string} userId - User identifier
   * @returns {Array} User sessions
   */
  getUserSessions(userId) {
    try {
      const userSessionIds = this.userSessions.get(userId) || [];
      return userSessionIds
        .map(sessionId => this.getSession(sessionId))
        .filter(session => session && session.status === 'active');
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate all user sessions
   * @param {string} userId - User identifier
   * @param {string} reason - Termination reason
   * @returns {Object} Termination result
   */
  terminateAllUserSessions(userId, reason = 'ADMIN_ACTION') {
    try {
      const sessions = this.getUserSessions(userId);
      let terminatedCount = 0;

      sessions.forEach(session => {
        this.expireSession(session.sessionId, reason);
        terminatedCount++;
      });

      this.logSessionEvent('ALL_SESSIONS_TERMINATED', { userId }, {
        reason: reason,
        terminatedCount: terminatedCount
      });

      return {
        success: true,
        terminatedCount: terminatedCount
      };

    } catch (error) {
      console.error('Failed to terminate all user sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate secure session
   * @param {string} userId - User identifier
   * @param {Object} userInfo - User information
   * @param {Object} context - Session context
   * @returns {Object} Session data
   */
  generateSecureSession(userId, userInfo, context = {}) {
    const now = Date.now();
    const sessionId = this.generateSessionId();
    
    return {
      sessionId: sessionId,
      userId: userId,
      userInfo: this.sanitizeUserInfo(userInfo),
      
      // Timestamps
      createdAt: now,
      expiresAt: now + SessionConfig.MAX_SESSION_DURATION,
      lastActivity: now,
      lastRotation: now,
      
      // Security
      securityLevel: this.determineSecurityLevel(userInfo, context),
      csrfToken: this.generateCSRFToken(),
      fingerprint: this.generateFingerprint(context),
      
      // Context
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
      location: context.location || 'unknown',
      
      // Status
      status: 'active',
      activityCount: 0,
      extendedCount: 0,
      
      // Features
      features: this.determineSessionFeatures(userInfo),
      
      // Metadata
      metadata: {
        creationContext: context,
        sessionVersion: '2.0'
      }
    };
  }

  /**
   * Handle maximum sessions exceeded
   * @param {string} userId - User identifier
   * @param {Array} existingSessions - Existing sessions
   * @param {Object} context - Context
   * @returns {Object} Handling result
   */
  handleMaxSessionsExceeded(userId, existingSessions, context) {
    try {
      // Option 1: Terminate oldest session
      const oldestSession = existingSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      
      this.expireSession(oldestSession.sessionId, 'MAX_SESSIONS_EXCEEDED');
      
      // Log the action
      this.logSessionEvent('MAX_SESSIONS_EXCEEDED', { userId }, {
        terminatedSession: oldestSession.sessionId,
        totalSessions: existingSessions.length
      });

      // Create new session
      return this.createSession(userId, context.userInfo || {}, context);

    } catch (error) {
      return {
        success: false,
        error: 'Unable to create session: maximum sessions exceeded',
        code: 'MAX_SESSIONS_EXCEEDED'
      };
    }
  }

  /**
   * Handle suspicious activity
   * @param {string} userId - User identifier
   * @param {Object} securityCheck - Security check result
   * @param {Object} context - Context
   * @returns {Object} Handling result
   */
  handleSuspiciousActivity(userId, securityCheck, context) {
    try {
      // Log security incident
      this.logSessionEvent('SUSPICIOUS_ACTIVITY_DETECTED', { userId }, {
        reason: securityCheck.reason,
        riskLevel: securityCheck.riskLevel,
        context: context
      });

      // Send security alert
      if (this.notificationManager && securityCheck.riskLevel >= 3) {
        this.notificationManager.sendAlert({
          type: 'security_incident',
          severity: 'warning',
          title: 'Suspicious Session Activity',
          message: `Suspicious activity detected for user ${userId}: ${securityCheck.reason}`,
          context: { userId, reason: securityCheck.reason }
        });
      }

      return {
        success: false,
        error: 'Session creation blocked due to security concerns',
        code: 'SECURITY_VIOLATION',
        action: securityCheck.action
      };

    } catch (error) {
      console.error('Failed to handle suspicious activity:', error);
      return {
        success: false,
        error: 'Security check failed',
        code: 'SECURITY_CHECK_FAILED'
      };
    }
  }

  /**
   * Handle security violation
   * @param {Object} session - Session data
   * @param {Object} securityCheck - Security check result
   * @param {Object} context - Context
   */
  handleSecurityViolation(session, securityCheck, context) {
    try {
      // Log violation
      this.logSessionEvent('SECURITY_VIOLATION', session, {
        violation: securityCheck.reason,
        severity: securityCheck.severity,
        context: context
      });

      // Take action based on severity
      switch (securityCheck.severity) {
        case 'critical':
          this.terminateAllUserSessions(session.userId, 'SECURITY_VIOLATION');
          break;
        case 'high':
          this.expireSession(session.sessionId, 'SECURITY_VIOLATION');
          break;
        case 'medium':
          // Force session rotation
          this.rotateSession(session.sessionId, context);
          break;
        default:
          // Log only
          break;
      }

    } catch (error) {
      console.error('Failed to handle security violation:', error);
    }
  }

  /**
   * Check if session should be rotated
   * @param {Object} session - Session data
   * @returns {boolean} Whether to rotate
   */
  shouldRotateSession(session) {
    const timeSinceRotation = Date.now() - session.lastRotation;
    return timeSinceRotation >= SessionConfig.SESSION_ROTATION_INTERVAL;
  }

  /**
   * Determine security level
   * @param {Object} userInfo - User information
   * @param {Object} context - Context
   * @returns {Object} Security level
   */
  determineSecurityLevel(userInfo, context) {
    // Default to medium security
    let level = SecurityLevels.MEDIUM;

    // Elevate for admin users
    if (userInfo.role === 'admin') {
      level = SecurityLevels.HIGH;
    }

    // Elevate for suspicious context
    if (context.suspicious || context.newLocation) {
      level = SecurityLevels.HIGH;
    }

    return level;
  }

  /**
   * Determine session features
   * @param {Object} userInfo - User information
   * @returns {Object} Session features
   */
  determineSessionFeatures(userInfo) {
    const features = {
      dataExport: false,
      adminFunctions: false,
      bulkOperations: false,
      systemConfig: false
    };

    // Grant features based on role
    switch (userInfo.role) {
      case 'admin':
        Object.keys(features).forEach(key => features[key] = true);
        break;
      case 'teamLeader':
        features.dataExport = true;
        features.bulkOperations = true;
        break;
      case 'user':
        // Basic features only
        break;
    }

    return features;
  }

  /**
   * Generate session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const checksum = this.calculateChecksum(timestamp + random);
    return `${timestamp}${random}${checksum}`;
  }

  /**
   * Generate CSRF token
   * @returns {string} CSRF token
   */
  generateCSRFToken() {
    return Utilities.getUuid();
  }

  /**
   * Generate session fingerprint
   * @param {Object} context - Context
   * @returns {string} Fingerprint
   */
  generateFingerprint(context) {
    const components = [
      context.userAgent || '',
      context.acceptLanguage || '',
      context.screenResolution || '',
      context.timezone || ''
    ].join('|');
    
    return this.calculateChecksum(components);
  }

  /**
   * Calculate checksum
   * @param {string} data - Data to checksum
   * @returns {string} Checksum
   */
  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Sanitize user info for session storage
   * @param {Object} userInfo - User information
   * @returns {Object} Sanitized user info
   */
  sanitizeUserInfo(userInfo) {
    return {
      id: userInfo.id || userInfo.email,
      email: userInfo.email,
      role: userInfo.role || 'user',
      name: userInfo.name || 'Unknown',
      domain: userInfo.domain || 'unknown'
    };
  }

  /**
   * Sanitize session for client
   * @param {Object} session - Session data
   * @returns {Object} Sanitized session
   */
  sanitizeSessionForClient(session) {
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      userInfo: session.userInfo,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      securityLevel: session.securityLevel,
      features: session.features,
      csrfToken: session.csrfToken
    };
  }

  /**
   * Store session
   * @param {Object} sessionData - Session data
   */
  storeSession(sessionData) {
    try {
      // Store in memory
      this.activeSessions.set(sessionData.sessionId, sessionData);
      
      // Store in persistent storage
      const props = PropertiesService.getScriptProperties();
      props.setProperty(
        SessionConfig.SESSION_STORE_PREFIX + sessionData.sessionId,
        JSON.stringify(sessionData)
      );

      // Update user session list
      this.addUserSession(sessionData.userId, sessionData.sessionId);

    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Get session
   * @param {string} sessionId - Session identifier
   * @returns {Object} Session data
   */
  getSession(sessionId) {
    try {
      // Try memory first
      if (this.activeSessions.has(sessionId)) {
        return this.activeSessions.get(sessionId);
      }

      // Try persistent storage
      const props = PropertiesService.getScriptProperties();
      const sessionData = props.getProperty(SessionConfig.SESSION_STORE_PREFIX + sessionId);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        this.activeSessions.set(sessionId, session);
        return session;
      }

      return null;

    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Remove session
   * @param {string} sessionId - Session identifier
   */
  removeSession(sessionId) {
    try {
      // Remove from memory
      this.activeSessions.delete(sessionId);
      
      // Remove from persistent storage
      const props = PropertiesService.getScriptProperties();
      props.deleteProperty(SessionConfig.SESSION_STORE_PREFIX + sessionId);

    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }

  /**
   * Add user session
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   */
  addUserSession(userId, sessionId) {
    try {
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      
      const userSessionIds = this.userSessions.get(userId);
      if (!userSessionIds.includes(sessionId)) {
        userSessionIds.push(sessionId);
      }

      // Store in persistent storage
      const props = PropertiesService.getScriptProperties();
      props.setProperty(
        SessionConfig.USER_SESSION_PREFIX + userId,
        JSON.stringify(userSessionIds)
      );

    } catch (error) {
      console.error('Failed to add user session:', error);
    }
  }

  /**
   * Remove user session
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   */
  removeUserSession(userId, sessionId) {
    try {
      if (this.userSessions.has(userId)) {
        const userSessionIds = this.userSessions.get(userId);
        const index = userSessionIds.indexOf(sessionId);
        if (index > -1) {
          userSessionIds.splice(index, 1);
        }

        // Update persistent storage
        const props = PropertiesService.getScriptProperties();
        props.setProperty(
          SessionConfig.USER_SESSION_PREFIX + userId,
          JSON.stringify(userSessionIds)
        );
      }

    } catch (error) {
      console.error('Failed to remove user session:', error);
    }
  }

  /**
   * Load sessions from storage
   */
  loadSessionsFromStorage() {
    try {
      const props = PropertiesService.getScriptProperties();
      const allProps = props.getProperties();

      Object.keys(allProps).forEach(key => {
        if (key.startsWith(SessionConfig.SESSION_STORE_PREFIX)) {
          try {
            const sessionData = JSON.parse(allProps[key]);
            this.activeSessions.set(sessionData.sessionId, sessionData);
          } catch (error) {
            console.warn('Failed to load session:', key);
          }
        } else if (key.startsWith(SessionConfig.USER_SESSION_PREFIX)) {
          try {
            const userId = key.substring(SessionConfig.USER_SESSION_PREFIX.length);
            const sessionIds = JSON.parse(allProps[key]);
            this.userSessions.set(userId, sessionIds);
          } catch (error) {
            console.warn('Failed to load user sessions:', key);
          }
        }
      });

    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
    }
  }

  /**
   * Start periodic tasks
   */
  startPeriodicTasks() {
    // Cleanup expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);

    // Security monitoring every minute
    setInterval(() => {
      this.securityMonitor.performPeriodicCheck();
    }, 60 * 1000);
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      this.activeSessions.forEach((session, sessionId) => {
        if (session.status === 'expired' || now > session.expiresAt) {
          this.removeSession(sessionId);
          this.removeUserSession(session.userId, sessionId);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired sessions`);
      }

    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }

  /**
   * Start session monitoring
   * @param {string} sessionId - Session identifier
   */
  startSessionMonitoring(sessionId) {
    // This would set up real-time monitoring for the session
    // Implementation depends on the specific monitoring requirements
  }

  /**
   * Log session event
   * @param {string} eventType - Event type
   * @param {Object} sessionData - Session data
   * @param {Object} context - Event context
   */
  logSessionEvent(eventType, sessionData, context = {}) {
    try {
      if (this.auditLogger) {
        this.auditLogger.logEvent(eventType, {
          sessionId: sessionData.sessionId,
          userId: sessionData.userId,
          ...context
        });
      }
    } catch (error) {
      console.error('Failed to log session event:', error);
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStatistics() {
    try {
      const stats = {
        totalActiveSessions: this.activeSessions.size,
        sessionsByUser: {},
        sessionsBySecurityLevel: {},
        averageSessionAge: 0,
        totalUsers: this.userSessions.size
      };

      const now = Date.now();
      let totalAge = 0;

      this.activeSessions.forEach(session => {
        // Count by user
        stats.sessionsByUser[session.userId] = (stats.sessionsByUser[session.userId] || 0) + 1;
        
        // Count by security level
        const levelName = Object.keys(SecurityLevels).find(
          key => SecurityLevels[key].level === session.securityLevel.level
        );
        stats.sessionsBySecurityLevel[levelName] = (stats.sessionsBySecurityLevel[levelName] || 0) + 1;
        
        // Calculate age
        totalAge += now - session.createdAt;
      });

      if (this.activeSessions.size > 0) {
        stats.averageSessionAge = totalAge / this.activeSessions.size;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get session statistics:', error);
      return { error: error.message };
    }
  }
}

/**
 * Session Security Monitor
 */
class SessionSecurityMonitor {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.riskThresholds = {
      rapidSessionCreation: 5,     // 5 sessions in 10 minutes
      locationChanges: 3,          // 3 location changes in 1 hour
      deviceChanges: 2,            // 2 device changes in 1 hour
      suspiciousActivity: 10       // 10 suspicious actions in 1 hour
    };
  }

  /**
   * Check session creation for suspicious patterns
   * @param {string} userId - User identifier
   * @param {Object} sessionData - Session data
   * @param {Object} context - Context
   * @returns {Object} Security check result
   */
  checkSessionCreation(userId, sessionData, context) {
    try {
      // Check for rapid session creation
      const rapidCheck = this.checkRapidSessionCreation(userId);
      if (!rapidCheck.allowed) return rapidCheck;

      // Check for suspicious location
      const locationCheck = this.checkSuspiciousLocation(userId, context);
      if (!locationCheck.allowed) return locationCheck;

      // Check for device fingerprint changes
      const deviceCheck = this.checkDeviceChanges(userId, sessionData);
      if (!deviceCheck.allowed) return deviceCheck;

      return { allowed: true, riskLevel: 1 };

    } catch (error) {
      console.error('Security check failed:', error);
      return { allowed: true, riskLevel: 1 }; // Fail open
    }
  }

  /**
   * Validate session security
   * @param {Object} session - Session data
   * @param {Object} context - Context
   * @returns {Object} Validation result
   */
  validateSession(session, context) {
    try {
      // Check fingerprint consistency
      if (context.fingerprint && context.fingerprint !== session.fingerprint) {
        return {
          valid: false,
          reason: 'FINGERPRINT_MISMATCH',
          severity: 'high',
          action: 'terminate_session'
        };
      }

      // Check for suspicious activity patterns
      const activityCheck = this.checkActivityPatterns(session, context);
      if (!activityCheck.valid) return activityCheck;

      return { valid: true };

    } catch (error) {
      console.error('Session validation failed:', error);
      return { valid: true }; // Fail open
    }
  }

  /**
   * Analyze session activity
   * @param {Object} session - Session data
   * @param {Object} context - Context
   */
  analyzeActivity(session, context) {
    try {
      // Track activity patterns for anomaly detection
      const activityPattern = {
        timestamp: Date.now(),
        action: context.action,
        frequency: this.calculateActivityFrequency(session),
        suspiciousScore: this.calculateSuspiciousScore(context)
      };

      if (activityPattern.suspiciousScore > 5) {
        console.warn('Suspicious activity detected:', {
          sessionId: session.sessionId,
          userId: session.userId,
          score: activityPattern.suspiciousScore
        });
      }

    } catch (error) {
      console.error('Activity analysis failed:', error);
    }
  }

  /**
   * Perform periodic security check
   */
  performPeriodicCheck() {
    try {
      // Clean up old tracking data
      this.cleanupTrackingData();
      
      // Analyze patterns
      this.analyzeSecurityPatterns();

    } catch (error) {
      console.error('Periodic security check failed:', error);
    }
  }

  // Helper methods
  checkRapidSessionCreation(userId) {
    // Implementation for rapid session creation check
    return { allowed: true, riskLevel: 1 };
  }

  checkSuspiciousLocation(userId, context) {
    // Implementation for location check
    return { allowed: true, riskLevel: 1 };
  }

  checkDeviceChanges(userId, sessionData) {
    // Implementation for device fingerprint check
    return { allowed: true, riskLevel: 1 };
  }

  checkActivityPatterns(session, context) {
    // Implementation for activity pattern check
    return { valid: true };
  }

  calculateActivityFrequency(session) {
    return session.activityCount / ((Date.now() - session.createdAt) / 60000); // per minute
  }

  calculateSuspiciousScore(context) {
    // Simple scoring algorithm
    let score = 0;
    
    if (context.action === 'bulk_delete') score += 3;
    if (context.action === 'admin_action') score += 2;
    if (context.offHours) score += 1;
    
    return score;
  }

  cleanupTrackingData() {
    // Clean up old suspicious pattern data
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.suspiciousPatterns.forEach((patterns, userId) => {
      const recentPatterns = patterns.filter(p => p.timestamp > oneHourAgo);
      this.suspiciousPatterns.set(userId, recentPatterns);
    });
  }

  analyzeSecurityPatterns() {
    // Analyze overall security patterns
    // Implementation for pattern analysis
  }
}

/**
 * Activity Tracker
 */
class ActivityTracker {
  constructor() {
    this.activityLogs = new Map();
  }

  /**
   * Record user activity
   * @param {string} sessionId - Session identifier
   * @param {Object} activity - Activity data
   */
  recordActivity(sessionId, activity) {
    try {
      if (!this.activityLogs.has(sessionId)) {
        this.activityLogs.set(sessionId, []);
      }

      const activities = this.activityLogs.get(sessionId);
      activities.push(activity);

      // Keep only recent activities
      if (activities.length > SessionConfig.ACTIVITY_LOG_SIZE) {
        activities.shift();
      }

    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }

  /**
   * Get session activities
   * @param {string} sessionId - Session identifier
   * @returns {Array} Activity list
   */
  getSessionActivities(sessionId) {
    return this.activityLogs.get(sessionId) || [];
  }
}

// Global enhanced session manager instance
const enhancedSessionManager = new EnhancedSessionManager();

// Global functions for session management
function createUserSession(userInfo, context = {}) {
  const userId = userInfo.email || userInfo.id;
  return enhancedSessionManager.createSession(userId, userInfo, context);
}

function validateUserSession(sessionId, context = {}) {
  return enhancedSessionManager.validateSession(sessionId, context);
}

function updateSessionActivity(sessionId, context = {}) {
  return enhancedSessionManager.updateSessionActivity(sessionId, context);
}

function expireUserSession(sessionId, reason = 'MANUAL') {
  return enhancedSessionManager.expireSession(sessionId, reason);
}
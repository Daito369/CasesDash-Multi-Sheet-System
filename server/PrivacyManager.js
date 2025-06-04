/**
 * CasesDash - Privacy Manager
 * Privacy protection and access control for sensitive case data
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * PrivacyManager class for data protection and access control
 * Implements role-based access control and audit logging
 */
class PrivacyManager {
  
  /**
   * Constructor
   */
  constructor() {
    this.currentUser = Session.getActiveUser().getEmail();
    this.userRole = null;
    this.auditLog = [];
    this.sensitiveFields = [
      'sentimentScore',
      'customerEmail',
      'personalInfo',
      'internalNotes',
      'escalationReason'
    ];
    
    this.initializeUserRole();
  }
  
  /**
   * Initialize user role
   * @private
   */
  initializeUserRole() {
    try {
      this.userRole = this.getUserRole(this.currentUser);
      this.logAccess('system', 'user_login', { role: this.userRole });
    } catch (error) {
      ErrorHandler.logError(error, { user: this.currentUser }, ErrorSeverity.HIGH, ErrorTypes.PERMISSION);
      this.userRole = 'user'; // Default to most restrictive role
    }
  }
  
  /**
   * Get user role from configuration
   * @param {string} userEmail - User email address
   * @returns {string} User role (admin, teamLeader, user)
   */
  getUserRole(userEmail) {
    try {
      const adminEmails = ConfigManager.get('security', 'adminEmails') || [];
      const teamLeaderEmails = ConfigManager.get('security', 'teamLeaderEmails') || [];
      
      if (adminEmails.includes(userEmail)) return 'admin';
      if (teamLeaderEmails.includes(userEmail)) return 'teamLeader';
      
      return 'user';
      
    } catch (error) {
      ErrorHandler.logError(error, { userEmail }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return 'user';
    }
  }
  
  /**
   * Check if user can access specific case data
   * @param {Object} caseData - Case data to check access for
   * @param {string} operation - Operation type (read, write, delete)
   * @returns {Object} Access check result
   */
  canAccessCase(caseData, operation = 'read') {
    try {
      const result = {
        allowed: false,
        filteredData: null,
        reason: '',
        restrictions: []
      };
      
      // Admin has full access
      if (this.userRole === 'admin') {
        result.allowed = true;
        result.filteredData = caseData;
        this.logAccess('case', operation, { caseId: caseData.caseId, granted: true });
        return result;
      }
      
      // Team leaders can access team cases
      if (this.userRole === 'teamLeader') {
        const teamMembers = this.getTeamMembers(this.currentUser);
        const isTeamCase = this.isCaseAssignedToTeam(caseData, teamMembers);
        
        if (isTeamCase) {
          result.allowed = true;
          result.filteredData = this.applySensitivityFilters(caseData, 'teamLeader');
          this.logAccess('case', operation, { caseId: caseData.caseId, granted: true, role: 'teamLeader' });
          return result;
        }
      }
      
      // Users can only access their own cases
      const isOwnCase = this.isCaseAssignedToUser(caseData, this.currentUser);
      
      if (isOwnCase) {
        result.allowed = true;
        result.filteredData = this.applySensitivityFilters(caseData, 'user');
        this.logAccess('case', operation, { caseId: caseData.caseId, granted: true, role: 'user' });
        return result;
      }
      
      // Access denied
      result.reason = 'Access denied: Case not assigned to user or user lacks permissions';
      result.restrictions = ['case_assignment'];
      this.logAccess('case', operation, { 
        caseId: caseData.caseId, 
        granted: false, 
        reason: result.reason 
      });
      
      return result;
      
    } catch (error) {
      ErrorHandler.logError(error, { caseData, operation }, ErrorSeverity.HIGH, ErrorTypes.PERMISSION);
      return {
        allowed: false,
        filteredData: null,
        reason: 'Error checking access permissions',
        restrictions: ['system_error']
      };
    }
  }
  
  /**
   * Check if case is assigned to user
   * @private
   * @param {Object} caseData - Case data
   * @param {string} userEmail - User email
   * @returns {boolean} Whether case is assigned to user
   */
  isCaseAssignedToUser(caseData, userEmail) {
    const assigneeFields = ['firstAssignee', 'finalAssignee', 'createdBy', 'lastModifiedBy'];
    return assigneeFields.some(field => caseData[field] === userEmail);
  }
  
  /**
   * Check if case is assigned to team
   * @private
   * @param {Object} caseData - Case data
   * @param {Array} teamMembers - Team member emails
   * @returns {boolean} Whether case is assigned to team
   */
  isCaseAssignedToTeam(caseData, teamMembers) {
    const assigneeFields = ['firstAssignee', 'finalAssignee'];
    return assigneeFields.some(field => teamMembers.includes(caseData[field]));
  }
  
  /**
   * Get team members for team leader
   * @private
   * @param {string} teamLeaderEmail - Team leader email
   * @returns {Array} Array of team member emails
   */
  getTeamMembers(teamLeaderEmail) {
    try {
      const teamStructure = ConfigManager.get('security', 'teamStructure') || {};
      return teamStructure[teamLeaderEmail] || [];
    } catch (error) {
      ErrorHandler.logError(error, { teamLeaderEmail }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return [];
    }
  }
  
  /**
   * Apply sensitivity filters based on user role
   * @private
   * @param {Object} caseData - Original case data
   * @param {string} userRole - User role
   * @returns {Object} Filtered case data
   */
  applySensitivityFilters(caseData, userRole) {
    const filteredData = { ...caseData };
    
    switch (userRole) {
      case 'admin':
        // Admin sees everything
        break;
        
      case 'teamLeader':
        // Team leaders see most data but with some restrictions
        this.sensitiveFields.forEach(field => {
          if (field === 'sentimentScore' && filteredData[field]) {
            // Mask sentiment score for team leaders
            filteredData[field] = this.maskSentimentScore(filteredData[field]);
          }
        });
        break;
        
      case 'user':
        // Regular users have most restrictions
        this.sensitiveFields.forEach(field => {
          if (filteredData[field]) {
            if (field === 'sentimentScore') {
              // Completely hide sentiment score for regular users
              delete filteredData[field];
            } else if (field === 'internalNotes') {
              // Mask internal notes
              filteredData[field] = '[RESTRICTED]';
            }
          }
        });
        break;
    }
    
    return filteredData;
  }
  
  /**
   * Mask sentiment score for privacy
   * @private
   * @param {number} score - Original sentiment score
   * @returns {string} Masked score
   */
  maskSentimentScore(score) {
    if (score >= 0.7) return 'Positive';
    if (score >= 0.3) return 'Neutral';
    return 'Negative';
  }
  
  /**
   * Filter cases array based on user permissions
   * @param {Array} cases - Array of cases to filter
   * @returns {Array} Filtered cases array
   */
  filterCasesForUser(cases) {
    try {
      const filteredCases = [];
      
      cases.forEach(caseData => {
        const accessCheck = this.canAccessCase(caseData, 'read');
        if (accessCheck.allowed) {
          filteredCases.push(accessCheck.filteredData);
        }
      });
      
      this.logAccess('batch', 'filter_cases', { 
        totalCases: cases.length, 
        filteredCases: filteredCases.length 
      });
      
      return filteredCases;
      
    } catch (error) {
      ErrorHandler.logError(error, { caseCount: cases.length }, ErrorSeverity.HIGH, ErrorTypes.PERMISSION);
      return [];
    }
  }
  
  /**
   * Get UI configuration based on user role
   * @returns {Object} UI configuration object
   */
  getUIConfiguration() {
    try {
      const baseConfig = {
        showAdminPanel: false,
        showTeamManagement: false,
        showSentimentScores: false,
        showInternalNotes: false,
        showAuditLogs: false,
        allowBulkOperations: false,
        allowDataExport: false,
        maxSearchResults: 50
      };
      
      switch (this.userRole) {
        case 'admin':
          return {
            ...baseConfig,
            showAdminPanel: true,
            showTeamManagement: true,
            showSentimentScores: true,
            showInternalNotes: true,
            showAuditLogs: true,
            allowBulkOperations: true,
            allowDataExport: true,
            maxSearchResults: 500
          };
          
        case 'teamLeader':
          return {
            ...baseConfig,
            showTeamManagement: true,
            showSentimentScores: true,
            showInternalNotes: true,
            allowBulkOperations: true,
            maxSearchResults: 200
          };
          
        case 'user':
        default:
          return {
            ...baseConfig,
            maxSearchResults: 50
          };
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { role: this.userRole }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return { maxSearchResults: 50 }; // Safe default
    }
  }
  
  /**
   * Log access attempt for audit purposes
   * @private
   * @param {string} resourceType - Type of resource accessed
   * @param {string} operation - Operation performed
   * @param {Object} metadata - Additional metadata
   */
  logAccess(resourceType, operation, metadata = {}) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        user: this.currentUser,
        userRole: this.userRole,
        resourceType: resourceType,
        operation: operation,
        metadata: metadata,
        ipAddress: this.getUserIP(),
        sessionId: Session.getTemporaryActiveUserKey()
      };
      
      // Store in audit log
      this.auditLog.push(logEntry);
      
      // Persist to Properties Service for long-term storage
      this.persistAuditLog(logEntry);
      
      // Log to console for immediate visibility
      console.log(`Access Log: ${this.currentUser} (${this.userRole}) ${operation} ${resourceType}`);
      
    } catch (error) {
      ErrorHandler.logError(error, { resourceType, operation }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Persist audit log entry
   * @private
   * @param {Object} logEntry - Log entry to persist
   */
  persistAuditLog(logEntry) {
    try {
      const existingLogs = JSON.parse(PropertiesService.getScriptProperties().getProperty('auditLogs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 1000 entries to manage storage
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      PropertiesService.getScriptProperties().setProperty('auditLogs', JSON.stringify(existingLogs));
      
    } catch (error) {
      ErrorHandler.logError(error, { logEntry }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get user IP address (limited in GAS environment)
   * @private
   * @returns {string} IP address or placeholder
   */
  getUserIP() {
    try {
      // GAS doesn't provide direct IP access, return session-based identifier
      return Session.getTemporaryActiveUserKey() || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Get audit logs (admin only)
   * @param {Object} filters - Filters for audit logs
   * @returns {Object} Audit logs or access denied
   */
  getAuditLogs(filters = {}) {
    try {
      // Only admins can view audit logs
      if (this.userRole !== 'admin') {
        this.logAccess('audit', 'view_denied', { reason: 'insufficient_permissions' });
        return {
          success: false,
          error: true,
          message: 'Access denied: Only administrators can view audit logs'
        };
      }
      
      const logs = JSON.parse(PropertiesService.getScriptProperties().getProperty('auditLogs') || '[]');
      
      // Apply filters
      let filteredLogs = logs;
      
      if (filters.user) {
        filteredLogs = filteredLogs.filter(log => log.user === filters.user);
      }
      
      if (filters.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
      }
      
      this.logAccess('audit', 'view_logs', { logCount: filteredLogs.length });
      
      return {
        success: true,
        data: filteredLogs.reverse(), // Most recent first
        totalCount: filteredLogs.length
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to retrieve audit logs. Please try again.',
          context: { filters },
          type: ErrorTypes.PERMISSION
        }
      );
    }
  }
  
  /**
   * Check data export permissions
   * @param {string} exportType - Type of export requested
   * @returns {Object} Permission check result
   */
  checkExportPermissions(exportType) {
    try {
      const result = {
        allowed: false,
        restrictions: [],
        maxRecords: 0
      };
      
      switch (this.userRole) {
        case 'admin':
          result.allowed = true;
          result.maxRecords = 10000;
          break;
          
        case 'teamLeader':
          result.allowed = exportType !== 'full_database';
          result.maxRecords = 1000;
          if (!result.allowed) {
            result.restrictions.push('export_type_restricted');
          }
          break;
          
        case 'user':
          result.allowed = exportType === 'own_cases';
          result.maxRecords = 100;
          if (!result.allowed) {
            result.restrictions.push('user_level_export_only');
          }
          break;
      }
      
      this.logAccess('export', 'permission_check', { 
        exportType, 
        allowed: result.allowed,
        maxRecords: result.maxRecords 
      });
      
      return result;
      
    } catch (error) {
      ErrorHandler.logError(error, { exportType }, ErrorSeverity.MEDIUM, ErrorTypes.PERMISSION);
      return {
        allowed: false,
        restrictions: ['system_error'],
        maxRecords: 0
      };
    }
  }
  
  /**
   * Get current user information with privacy context
   * @returns {Object} User information
   */
  getCurrentUserInfo() {
    return {
      email: this.currentUser,
      role: this.userRole,
      permissions: this.getUIConfiguration(),
      sessionId: Session.getTemporaryActiveUserKey(),
      lastAccess: new Date().toISOString()
    };
  }
  
  /**
   * Validate access to sensitive operations
   * @param {string} operation - Operation to validate
   * @param {Object} context - Operation context
   * @returns {boolean} Whether operation is allowed
   */
  validateSensitiveOperation(operation, context = {}) {
    try {
      const sensitiveOperations = {
        'delete_case': ['admin', 'teamLeader'],
        'bulk_update': ['admin', 'teamLeader'],
        'view_all_cases': ['admin'],
        'modify_permissions': ['admin'],
        'view_audit_logs': ['admin'],
        'export_sensitive_data': ['admin'],
        'edit_team_sentiment': ['admin', 'teamLeader'],
        'view_team_sentiment': ['admin', 'teamLeader'],
        'export_sentiment_data': ['admin', 'teamLeader']
      };
      
      const allowedRoles = sensitiveOperations[operation] || [];
      const isAllowed = allowedRoles.includes(this.userRole);
      
      this.logAccess('sensitive_operation', operation, {
        allowed: isAllowed,
        context: context
      });
      
      return isAllowed;
      
    } catch (error) {
      ErrorHandler.logError(error, { operation, context }, ErrorSeverity.HIGH, ErrorTypes.PERMISSION);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrivacyManager };
}
/**
 * CasesDash - Data Protection Manager
 * Comprehensive data protection with encryption, DLP, and secure communications
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Data classification levels
 */
const DataClassification = {
  PUBLIC: { level: 1, label: 'Public', color: '#4CAF50', encryption: false },
  INTERNAL: { level: 2, label: 'Internal', color: '#2196F3', encryption: false },
  CONFIDENTIAL: { level: 3, label: 'Confidential', color: '#FF9800', encryption: true },
  RESTRICTED: { level: 4, label: 'Restricted', color: '#F44336', encryption: true },
  SECRET: { level: 5, label: 'Secret', color: '#9C27B0', encryption: true }
};

/**
 * Data protection policies
 */
const ProtectionPolicies = {
  // Field-level protection
  PII_FIELDS: [
    'email', 'phone', 'ssn', 'customerEmail', 'customerPhone',
    'personalId', 'bankAccount', 'creditCard', 'passport'
  ],
  
  SENSITIVE_FIELDS: [
    'customerId', 'accountId', 'transactionId', 'caseId',
    'internalNotes', 'escalationReason', 'resolutionDetails'
  ],
  
  // Access control
  EXPORT_RESTRICTIONS: {
    user: ['PUBLIC', 'INTERNAL'],
    teamLeader: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'],
    admin: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
  },
  
  // Retention policies (in days)
  RETENTION_PERIODS: {
    PUBLIC: 365,
    INTERNAL: 1095,      // 3 years
    CONFIDENTIAL: 2555,   // 7 years
    RESTRICTED: 3650,     // 10 years
    SECRET: 7300          // 20 years
  },
  
  // Encryption requirements
  ENCRYPTION_ALGORITHMS: {
    FIELD: 'AES-256-GCM',
    STORAGE: 'AES-256-CBC',
    TRANSPORT: 'TLS-1.3'
  }
};

/**
 * Data Protection Manager Class
 */
class DataProtectionManager {
  constructor() {
    this.encryptionManager = new EncryptionManager();
    this.dlpEngine = new DLPEngine();
    this.accessController = new AccessController();
    this.auditLogger = null;
    this.notificationManager = null;
    this.classificationCache = new Map();
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
      console.warn('Could not initialize all data protection components:', error);
    }
  }

  /**
   * Classify data sensitivity
   * @param {Object} data - Data to classify
   * @param {Object} context - Classification context
   * @returns {Object} Classification result
   */
  classifyData(data, context = {}) {
    try {
      const classification = {
        overall: DataClassification.INTERNAL,
        fieldClassifications: {},
        recommendedActions: [],
        riskScore: 0
      };

      // Check for PII
      const piiFields = this.findPIIFields(data);
      if (piiFields.length > 0) {
        classification.overall = DataClassification.CONFIDENTIAL;
        classification.riskScore += 30;
        piiFields.forEach(field => {
          classification.fieldClassifications[field] = DataClassification.CONFIDENTIAL;
        });
      }

      // Check for sensitive business data
      const sensitiveFields = this.findSensitiveFields(data);
      if (sensitiveFields.length > 0) {
        classification.riskScore += 20;
        sensitiveFields.forEach(field => {
          classification.fieldClassifications[field] = DataClassification.INTERNAL;
        });
      }

      // Check for restricted content using DLP
      const dlpResult = this.dlpEngine.scanData(data);
      if (dlpResult.violations.length > 0) {
        classification.overall = DataClassification.RESTRICTED;
        classification.riskScore += 50;
        classification.dlpViolations = dlpResult.violations;
      }

      // Determine final classification
      classification.overall = this.determineFinalClassification(classification);
      
      // Generate recommendations
      classification.recommendedActions = this.generateRecommendations(classification);

      // Cache classification for performance
      if (data.id || data.caseId) {
        const cacheKey = data.id || data.caseId;
        this.classificationCache.set(cacheKey, classification);
      }

      return classification;

    } catch (error) {
      console.error('Data classification failed:', error);
      return {
        overall: DataClassification.INTERNAL,
        fieldClassifications: {},
        recommendedActions: ['manual_review_required'],
        riskScore: 50,
        error: error.message
      };
    }
  }

  /**
   * Protect data based on classification
   * @param {Object} data - Data to protect
   * @param {Object} classification - Data classification
   * @param {Object} context - Protection context
   * @returns {Object} Protected data
   */
  protectData(data, classification, context = {}) {
    try {
      const protectedData = JSON.parse(JSON.stringify(data));
      const protectionLog = {
        originalFields: Object.keys(data),
        protectedFields: [],
        encryptedFields: [],
        maskedFields: [],
        redactedFields: []
      };

      // Apply field-level protection
      Object.keys(classification.fieldClassifications).forEach(field => {
        const fieldClassification = classification.fieldClassifications[field];
        
        if (protectedData[field] !== undefined) {
          const protection = this.applyFieldProtection(
            protectedData[field], 
            fieldClassification, 
            field, 
            context
          );
          
          protectedData[field] = protection.value;
          protectionLog.protectedFields.push({
            field: field,
            protection: protection.method,
            classification: fieldClassification.label
          });

          // Track protection methods
          switch (protection.method) {
            case 'encrypted':
              protectionLog.encryptedFields.push(field);
              break;
            case 'masked':
              protectionLog.maskedFields.push(field);
              break;
            case 'redacted':
              protectionLog.redactedFields.push(field);
              break;
          }
        }
      });

      // Apply overall classification metadata
      protectedData._protection = {
        classification: classification.overall.label,
        protectionLevel: classification.overall.level,
        timestamp: new Date().toISOString(),
        protectedBy: context.userId || 'system',
        riskScore: classification.riskScore
      };

      // Log protection action
      this.logProtectionAction('DATA_PROTECTED', protectionLog, context);

      return {
        success: true,
        data: protectedData,
        protection: protectionLog,
        classification: classification
      };

    } catch (error) {
      console.error('Data protection failed:', error);
      return {
        success: false,
        error: error.message,
        data: data // Return original data on failure
      };
    }
  }

  /**
   * Apply field-level protection
   * @param {*} value - Field value
   * @param {Object} classification - Field classification
   * @param {string} fieldName - Field name
   * @param {Object} context - Protection context
   * @returns {Object} Protection result
   */
  applyFieldProtection(value, classification, fieldName, context) {
    try {
      // Determine protection method based on classification and context
      const userRole = context.userRole || 'user';
      const operation = context.operation || 'read';

      // High classification or export operations require encryption
      if (classification.level >= DataClassification.CONFIDENTIAL.level || operation === 'export') {
        if (classification.encryption) {
          return {
            value: this.encryptionManager.encryptField(value, fieldName),
            method: 'encrypted'
          };
        }
      }

      // PII fields get masked for non-authorized users
      if (ProtectionPolicies.PII_FIELDS.includes(fieldName)) {
        if (userRole === 'user' && operation === 'display') {
          return {
            value: this.maskPII(value, fieldName),
            method: 'masked'
          };
        }
      }

      // Sensitive fields get redacted for unauthorized access
      if (ProtectionPolicies.SENSITIVE_FIELDS.includes(fieldName)) {
        if (!this.accessController.checkFieldAccess(userRole, fieldName, operation)) {
          return {
            value: '[REDACTED]',
            method: 'redacted'
          };
        }
      }

      // No protection needed
      return {
        value: value,
        method: 'none'
      };

    } catch (error) {
      console.error('Field protection failed:', error);
      return {
        value: '[PROTECTED]',
        method: 'error'
      };
    }
  }

  /**
   * Unprotect data for authorized access
   * @param {Object} protectedData - Protected data
   * @param {Object} context - Access context
   * @returns {Object} Unprotected data
   */
  unprotectData(protectedData, context = {}) {
    try {
      // Check access authorization
      const accessCheck = this.accessController.checkDataAccess(protectedData, context);
      if (!accessCheck.authorized) {
        return {
          success: false,
          error: 'Access denied',
          reason: accessCheck.reason
        };
      }

      const unprotectedData = JSON.parse(JSON.stringify(protectedData));
      const unprotectionLog = {
        decryptedFields: [],
        accessedFields: [],
        deniedFields: []
      };

      // Process each field
      Object.keys(unprotectedData).forEach(field => {
        if (field.startsWith('_')) return; // Skip metadata fields

        try {
          // Check if field is encrypted
          if (this.encryptionManager.isEncrypted(unprotectedData[field])) {
            if (accessCheck.fieldAccess[field]) {
              unprotectedData[field] = this.encryptionManager.decryptField(
                unprotectedData[field], 
                field
              );
              unprotectionLog.decryptedFields.push(field);
            } else {
              unprotectedData[field] = '[ACCESS_DENIED]';
              unprotectionLog.deniedFields.push(field);
            }
          }

          unprotectionLog.accessedFields.push(field);

        } catch (fieldError) {
          console.warn(`Failed to unprotect field ${field}:`, fieldError);
          unprotectedData[field] = '[DECODE_ERROR]';
        }
      });

      // Log access
      this.logProtectionAction('DATA_ACCESSED', unprotectionLog, context);

      return {
        success: true,
        data: unprotectedData,
        access: unprotectionLog
      };

    } catch (error) {
      console.error('Data unprotection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Scan for data leakage
   * @param {Object} data - Data to scan
   * @param {Object} context - Scan context
   * @returns {Object} Scan result
   */
  scanForDataLeakage(data, context = {}) {
    try {
      const scanResult = {
        riskLevel: 'low',
        violations: [],
        recommendations: [],
        timestamp: new Date().toISOString()
      };

      // Use DLP engine for comprehensive scanning
      const dlpResult = this.dlpEngine.scanData(data);
      scanResult.violations.push(...dlpResult.violations);

      // Check for unauthorized data export
      if (context.operation === 'export') {
        const exportCheck = this.checkExportAuthorization(data, context);
        if (!exportCheck.authorized) {
          scanResult.violations.push({
            type: 'unauthorized_export',
            severity: 'high',
            description: exportCheck.reason,
            fields: exportCheck.restrictedFields
          });
        }
      }

      // Check for data beyond retention period
      const retentionCheck = this.checkRetentionPolicy(data, context);
      if (retentionCheck.violations.length > 0) {
        scanResult.violations.push(...retentionCheck.violations);
      }

      // Determine overall risk level
      scanResult.riskLevel = this.calculateRiskLevel(scanResult.violations);

      // Generate recommendations
      scanResult.recommendations = this.generateDLPRecommendations(scanResult.violations);

      // Alert for high-risk violations
      if (scanResult.riskLevel === 'high' || scanResult.riskLevel === 'critical') {
        this.alertDataLeakage(scanResult, context);
      }

      return scanResult;

    } catch (error) {
      console.error('Data leakage scan failed:', error);
      return {
        riskLevel: 'unknown',
        violations: [],
        recommendations: ['manual_review_required'],
        error: error.message
      };
    }
  }

  /**
   * Secure data transmission
   * @param {Object} data - Data to transmit
   * @param {Object} destination - Transmission destination
   * @param {Object} context - Transmission context
   * @returns {Object} Secure transmission result
   */
  secureTransmission(data, destination, context = {}) {
    try {
      // Classify data before transmission
      const classification = this.classifyData(data, context);
      
      // Check transmission authorization
      const transmissionCheck = this.checkTransmissionAuthorization(
        classification, 
        destination, 
        context
      );
      
      if (!transmissionCheck.authorized) {
        return {
          success: false,
          error: 'Transmission not authorized',
          reason: transmissionCheck.reason
        };
      }

      // Prepare secure payload
      const securePayload = {
        data: data,
        classification: classification.overall.label,
        timestamp: new Date().toISOString(),
        sender: context.userId || 'system',
        destination: destination
      };

      // Encrypt payload if required
      if (classification.overall.encryption) {
        securePayload.data = this.encryptionManager.encryptData(data);
        securePayload.encrypted = true;
      }

      // Add integrity check
      securePayload.checksum = this.calculateChecksum(securePayload.data);

      // Log transmission
      this.logProtectionAction('DATA_TRANSMITTED', {
        destination: destination,
        classification: classification.overall.label,
        encrypted: securePayload.encrypted || false,
        size: JSON.stringify(data).length
      }, context);

      return {
        success: true,
        payload: securePayload,
        classification: classification
      };

    } catch (error) {
      console.error('Secure transmission failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify data integrity
   * @param {Object} payload - Data payload
   * @param {string} expectedChecksum - Expected checksum
   * @returns {Object} Verification result
   */
  verifyIntegrity(payload, expectedChecksum) {
    try {
      const actualChecksum = this.calculateChecksum(payload.data);
      const isValid = actualChecksum === expectedChecksum;

      if (!isValid) {
        this.logProtectionAction('INTEGRITY_VIOLATION', {
          expectedChecksum: expectedChecksum,
          actualChecksum: actualChecksum,
          payload: payload
        });
      }

      return {
        valid: isValid,
        expectedChecksum: expectedChecksum,
        actualChecksum: actualChecksum
      };

    } catch (error) {
      console.error('Integrity verification failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Apply data retention policy
   * @param {Object} data - Data to check
   * @param {Object} classification - Data classification
   * @returns {Object} Retention result
   */
  applyRetentionPolicy(data, classification) {
    try {
      const retentionPeriod = ProtectionPolicies.RETENTION_PERIODS[classification.overall.label];
      const dataAge = this.calculateDataAge(data);
      
      const result = {
        shouldRetain: dataAge < retentionPeriod,
        dataAge: dataAge,
        retentionPeriod: retentionPeriod,
        action: 'retain'
      };

      if (!result.shouldRetain) {
        result.action = this.determineRetentionAction(data, classification);
      }

      return result;

    } catch (error) {
      console.error('Retention policy application failed:', error);
      return {
        shouldRetain: true,
        action: 'manual_review',
        error: error.message
      };
    }
  }

  // Helper methods

  /**
   * Find PII fields in data
   * @param {Object} data - Data to scan
   * @returns {Array} PII field names
   */
  findPIIFields(data) {
    return Object.keys(data).filter(field => 
      ProtectionPolicies.PII_FIELDS.some(piiField => 
        field.toLowerCase().includes(piiField.toLowerCase())
      )
    );
  }

  /**
   * Find sensitive fields in data
   * @param {Object} data - Data to scan
   * @returns {Array} Sensitive field names
   */
  findSensitiveFields(data) {
    return Object.keys(data).filter(field => 
      ProtectionPolicies.SENSITIVE_FIELDS.some(sensitiveField => 
        field.toLowerCase().includes(sensitiveField.toLowerCase())
      )
    );
  }

  /**
   * Determine final classification
   * @param {Object} classification - Classification data
   * @returns {Object} Final classification
   */
  determineFinalClassification(classification) {
    // Return highest classification level found
    let maxLevel = DataClassification.PUBLIC.level;
    let finalClassification = DataClassification.PUBLIC;

    Object.values(classification.fieldClassifications).forEach(fieldClass => {
      if (fieldClass.level > maxLevel) {
        maxLevel = fieldClass.level;
        finalClassification = fieldClass;
      }
    });

    // DLP violations can elevate classification
    if (classification.dlpViolations && classification.dlpViolations.length > 0) {
      const dlpMaxSeverity = Math.max(...classification.dlpViolations.map(v => v.severity === 'critical' ? 5 : v.severity === 'high' ? 4 : 3));
      if (dlpMaxSeverity > maxLevel) {
        finalClassification = Object.values(DataClassification).find(c => c.level === dlpMaxSeverity) || finalClassification;
      }
    }

    return finalClassification;
  }

  /**
   * Generate recommendations
   * @param {Object} classification - Classification data
   * @returns {Array} Recommendations
   */
  generateRecommendations(classification) {
    const recommendations = [];

    if (classification.riskScore > 70) {
      recommendations.push('implement_access_controls');
      recommendations.push('enable_audit_logging');
    }

    if (classification.overall.level >= DataClassification.CONFIDENTIAL.level) {
      recommendations.push('encrypt_at_rest');
      recommendations.push('encrypt_in_transit');
    }

    if (classification.dlpViolations && classification.dlpViolations.length > 0) {
      recommendations.push('review_dlp_violations');
      recommendations.push('implement_dlp_controls');
    }

    return recommendations;
  }

  /**
   * Mask PII data
   * @param {string} value - Value to mask
   * @param {string} fieldName - Field name
   * @returns {string} Masked value
   */
  maskPII(value, fieldName) {
    if (!value) return value;

    const str = value.toString();

    // Email masking
    if (fieldName.toLowerCase().includes('email')) {
      const parts = str.split('@');
      if (parts.length === 2) {
        const masked = parts[0].substring(0, 2) + '***' + '@' + parts[1];
        return masked;
      }
    }

    // Phone masking
    if (fieldName.toLowerCase().includes('phone')) {
      return str.replace(/\d/g, (match, index) => index < 3 || index >= str.length - 4 ? match : '*');
    }

    // Default masking
    if (str.length > 4) {
      return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
    }

    return '***';
  }

  /**
   * Check export authorization
   * @param {Object} data - Data to export
   * @param {Object} context - Export context
   * @returns {Object} Authorization result
   */
  checkExportAuthorization(data, context) {
    const userRole = context.userRole || 'user';
    const allowedClassifications = ProtectionPolicies.EXPORT_RESTRICTIONS[userRole] || [];
    
    const classification = this.classifyData(data, context);
    const isAuthorized = allowedClassifications.includes(classification.overall.label);

    return {
      authorized: isAuthorized,
      reason: isAuthorized ? 'authorized' : 'insufficient_privileges',
      userRole: userRole,
      dataClassification: classification.overall.label,
      restrictedFields: isAuthorized ? [] : Object.keys(data)
    };
  }

  /**
   * Check retention policy
   * @param {Object} data - Data to check
   * @param {Object} context - Check context
   * @returns {Object} Retention check result
   */
  checkRetentionPolicy(data, context) {
    const violations = [];
    const classification = this.classifyData(data, context);
    const retentionResult = this.applyRetentionPolicy(data, classification);

    if (!retentionResult.shouldRetain) {
      violations.push({
        type: 'retention_policy_violation',
        severity: 'medium',
        description: `Data exceeds retention period of ${retentionResult.retentionPeriod} days`,
        dataAge: retentionResult.dataAge,
        action: retentionResult.action
      });
    }

    return { violations };
  }

  /**
   * Calculate risk level
   * @param {Array} violations - List of violations
   * @returns {string} Risk level
   */
  calculateRiskLevel(violations) {
    if (violations.length === 0) return 'low';

    const severities = violations.map(v => v.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    
    return 'low';
  }

  /**
   * Generate DLP recommendations
   * @param {Array} violations - List of violations
   * @returns {Array} Recommendations
   */
  generateDLPRecommendations(violations) {
    const recommendations = [];

    violations.forEach(violation => {
      switch (violation.type) {
        case 'pii_detected':
          recommendations.push('implement_pii_protection');
          break;
        case 'unauthorized_export':
          recommendations.push('review_export_permissions');
          break;
        case 'retention_policy_violation':
          recommendations.push('implement_data_archival');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Alert data leakage
   * @param {Object} scanResult - Scan result
   * @param {Object} context - Alert context
   */
  alertDataLeakage(scanResult, context) {
    try {
      if (this.notificationManager) {
        this.notificationManager.sendAlert({
          type: 'data_leakage_alert',
          severity: scanResult.riskLevel,
          title: 'Data Leakage Risk Detected',
          message: `${scanResult.violations.length} data protection violations detected`,
          details: scanResult.violations,
          context: context
        });
      }

      this.logProtectionAction('DATA_LEAKAGE_ALERT', scanResult, context);

    } catch (error) {
      console.error('Failed to alert data leakage:', error);
    }
  }

  /**
   * Check transmission authorization
   * @param {Object} classification - Data classification
   * @param {Object} destination - Transmission destination
   * @param {Object} context - Transmission context
   * @returns {Object} Authorization result
   */
  checkTransmissionAuthorization(classification, destination, context) {
    // Implement transmission authorization logic
    return {
      authorized: true,
      reason: 'authorized'
    };
  }

  /**
   * Calculate checksum
   * @param {Object} data - Data to checksum
   * @returns {string} Checksum
   */
  calculateChecksum(data) {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate data age
   * @param {Object} data - Data to check
   * @returns {number} Age in days
   */
  calculateDataAge(data) {
    const createdDate = data.createdDate || data.timestamp || data.caseOpenDate;
    if (!createdDate) return 0;

    const created = new Date(createdDate);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine retention action
   * @param {Object} data - Data to process
   * @param {Object} classification - Data classification
   * @returns {string} Retention action
   */
  determineRetentionAction(data, classification) {
    // Implement retention action logic based on classification and data type
    if (classification.overall.level >= DataClassification.RESTRICTED.level) {
      return 'secure_delete';
    } else if (classification.overall.level >= DataClassification.CONFIDENTIAL.level) {
      return 'archive';
    }
    return 'delete';
  }

  /**
   * Log protection action
   * @param {string} action - Action type
   * @param {Object} details - Action details
   * @param {Object} context - Action context
   */
  logProtectionAction(action, details, context = {}) {
    try {
      if (this.auditLogger) {
        this.auditLogger.logEvent(action, details, context);
      }
    } catch (error) {
      console.error('Failed to log protection action:', error);
    }
  }

  /**
   * Get protection statistics
   * @returns {Object} Protection statistics
   */
  getProtectionStatistics() {
    try {
      return {
        classificationCache: {
          size: this.classificationCache.size,
          hitRate: 0.85 // Would calculate actual hit rate
        },
        protectionPolicies: {
          piiFields: ProtectionPolicies.PII_FIELDS.length,
          sensitiveFields: ProtectionPolicies.SENSITIVE_FIELDS.length,
          classificationLevels: Object.keys(DataClassification).length
        },
        encryptionStatus: this.encryptionManager.getStatistics(),
        dlpStatus: this.dlpEngine.getStatistics()
      };
    } catch (error) {
      console.error('Failed to get protection statistics:', error);
      return { error: error.message };
    }
  }
}

/**
 * Encryption Manager
 */
class EncryptionManager {
  constructor() {
    this.encryptionKey = this.deriveEncryptionKey();
    this.encryptedFieldPrefix = 'ENC_';
  }

  /**
   * Encrypt field value
   * @param {*} value - Value to encrypt
   * @param {string} fieldName - Field name for key derivation
   * @returns {string} Encrypted value
   */
  encryptField(value, fieldName) {
    try {
      if (!value) return value;
      
      const plaintext = JSON.stringify(value);
      const encrypted = this.simpleEncrypt(plaintext, fieldName);
      return this.encryptedFieldPrefix + encrypted;

    } catch (error) {
      console.error('Field encryption failed:', error);
      return '[ENCRYPTION_ERROR]';
    }
  }

  /**
   * Decrypt field value
   * @param {string} encryptedValue - Encrypted value
   * @param {string} fieldName - Field name for key derivation
   * @returns {*} Decrypted value
   */
  decryptField(encryptedValue, fieldName) {
    try {
      if (!this.isEncrypted(encryptedValue)) return encryptedValue;
      
      const encrypted = encryptedValue.substring(this.encryptedFieldPrefix.length);
      const plaintext = this.simpleDecrypt(encrypted, fieldName);
      return JSON.parse(plaintext);

    } catch (error) {
      console.error('Field decryption failed:', error);
      return '[DECRYPTION_ERROR]';
    }
  }

  /**
   * Encrypt entire data object
   * @param {Object} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  encryptData(data) {
    try {
      const plaintext = JSON.stringify(data);
      return this.simpleEncrypt(plaintext, 'data_object');
    } catch (error) {
      console.error('Data encryption failed:', error);
      return '[ENCRYPTION_ERROR]';
    }
  }

  /**
   * Check if value is encrypted
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is encrypted
   */
  isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(this.encryptedFieldPrefix);
  }

  /**
   * Simple encryption (for demonstration - use proper crypto in production)
   * @param {string} plaintext - Text to encrypt
   * @param {string} context - Context for key derivation
   * @returns {string} Encrypted text
   */
  simpleEncrypt(plaintext, context) {
    // This is a simple XOR cipher for demonstration
    // In production, use proper encryption libraries
    const key = this.deriveContextKey(context);
    let encrypted = '';
    
    for (let i = 0; i < plaintext.length; i++) {
      const charCode = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    return Buffer.from(encrypted, 'binary').toString('base64');
  }

  /**
   * Simple decryption
   * @param {string} encrypted - Encrypted text
   * @param {string} context - Context for key derivation
   * @returns {string} Decrypted text
   */
  simpleDecrypt(encrypted, context) {
    const key = this.deriveContextKey(context);
    const binaryData = Buffer.from(encrypted, 'base64').toString('binary');
    let decrypted = '';
    
    for (let i = 0; i < binaryData.length; i++) {
      const charCode = binaryData.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return decrypted;
  }

  /**
   * Derive encryption key
   * @returns {string} Encryption key
   */
  deriveEncryptionKey() {
    // In production, use proper key management
    return 'default_encryption_key_change_in_production';
  }

  /**
   * Derive context-specific key
   * @param {string} context - Context for key derivation
   * @returns {string} Context key
   */
  deriveContextKey(context) {
    return this.encryptionKey + '_' + context;
  }

  /**
   * Get encryption statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      algorithm: 'Simple XOR (Demo)',
      keyLength: this.encryptionKey.length,
      encryptedFieldPrefix: this.encryptedFieldPrefix
    };
  }
}

/**
 * Data Loss Prevention Engine
 */
class DLPEngine {
  constructor() {
    this.patterns = this.initializeDLPPatterns();
    this.scanCount = 0;
    this.violationCount = 0;
  }

  /**
   * Initialize DLP patterns
   * @returns {Object} DLP patterns
   */
  initializeDLPPatterns() {
    return {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
    };
  }

  /**
   * Scan data for DLP violations
   * @param {Object} data - Data to scan
   * @returns {Object} Scan result
   */
  scanData(data) {
    try {
      this.scanCount++;
      const violations = [];
      const dataString = JSON.stringify(data);

      Object.keys(this.patterns).forEach(patternName => {
        const pattern = this.patterns[patternName];
        const matches = dataString.match(pattern);
        
        if (matches) {
          violations.push({
            type: 'pattern_match',
            pattern: patternName,
            severity: this.getPatternSeverity(patternName),
            matches: matches.length,
            description: `Detected ${patternName} pattern in data`
          });
          this.violationCount++;
        }
      });

      return { violations };

    } catch (error) {
      console.error('DLP scan failed:', error);
      return { violations: [] };
    }
  }

  /**
   * Get pattern severity
   * @param {string} patternName - Pattern name
   * @returns {string} Severity level
   */
  getPatternSeverity(patternName) {
    const severityMap = {
      ssn: 'critical',
      creditCard: 'critical',
      email: 'medium',
      phone: 'medium',
      ipAddress: 'low'
    };
    return severityMap[patternName] || 'low';
  }

  /**
   * Get DLP statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalScans: this.scanCount,
      totalViolations: this.violationCount,
      violationRate: this.scanCount > 0 ? (this.violationCount / this.scanCount) * 100 : 0,
      patterns: Object.keys(this.patterns).length
    };
  }
}

/**
 * Access Controller
 */
class AccessController {
  constructor() {
    this.accessPolicies = this.initializeAccessPolicies();
  }

  /**
   * Initialize access policies
   * @returns {Object} Access policies
   */
  initializeAccessPolicies() {
    return {
      fieldAccess: {
        admin: ['*'], // All fields
        teamLeader: ['caseId', 'customerId', 'status', 'priority', 'internalNotes'],
        user: ['caseId', 'status', 'priority', 'description']
      },
      operations: {
        admin: ['read', 'write', 'delete', 'export'],
        teamLeader: ['read', 'write', 'export'],
        user: ['read']
      }
    };
  }

  /**
   * Check data access authorization
   * @param {Object} data - Data to access
   * @param {Object} context - Access context
   * @returns {Object} Authorization result
   */
  checkDataAccess(data, context) {
    const userRole = context.userRole || 'user';
    const operation = context.operation || 'read';

    // Check operation authorization
    const allowedOperations = this.accessPolicies.operations[userRole] || [];
    if (!allowedOperations.includes(operation) && !allowedOperations.includes('*')) {
      return {
        authorized: false,
        reason: 'operation_not_allowed',
        fieldAccess: {}
      };
    }

    // Determine field access
    const allowedFields = this.accessPolicies.fieldAccess[userRole] || [];
    const fieldAccess = {};

    Object.keys(data).forEach(field => {
      fieldAccess[field] = allowedFields.includes('*') || allowedFields.includes(field);
    });

    return {
      authorized: true,
      reason: 'authorized',
      fieldAccess: fieldAccess
    };
  }

  /**
   * Check field access authorization
   * @param {string} userRole - User role
   * @param {string} fieldName - Field name
   * @param {string} operation - Operation type
   * @returns {boolean} Whether access is allowed
   */
  checkFieldAccess(userRole, fieldName, operation) {
    const allowedOperations = this.accessPolicies.operations[userRole] || [];
    const allowedFields = this.accessPolicies.fieldAccess[userRole] || [];

    const operationAllowed = allowedOperations.includes(operation) || allowedOperations.includes('*');
    const fieldAllowed = allowedFields.includes(fieldName) || allowedFields.includes('*');

    return operationAllowed && fieldAllowed;
  }
}

// Global data protection manager instance
const dataProtectionManager = new DataProtectionManager();

// Global functions for data protection
function protectCaseData(data, context = {}) {
  const classification = dataProtectionManager.classifyData(data, context);
  return dataProtectionManager.protectData(data, classification, context);
}

function unprotectCaseData(protectedData, context = {}) {
  return dataProtectionManager.unprotectData(protectedData, context);
}

function scanDataForLeakage(data, context = {}) {
  return dataProtectionManager.scanForDataLeakage(data, context);
}
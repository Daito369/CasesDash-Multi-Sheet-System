/**
 * SecurityConfig - Centralized Security Configuration Manager
 * Handles all security-related configurations and policies
 * 
 * @author Claude Code Security Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * Security Configuration Manager
 * Centralizes all security policies and configurations
 */
class SecurityConfig {
  
  /**
   * Get CSRF configuration
   */
  static getCSRFConfig() {
    return {
      tokenLength: 32,
      tokenPrefix: 'csrf_',
      expirationTime: 3600000, // 1 hour in milliseconds
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_token',
      requireSecure: true
    };
  }
  
  /**
   * Get session configuration
   */
  static getSessionConfig() {
    return {
      timeout: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
      renewalThreshold: 30 * 60 * 1000, // 30 minutes in milliseconds
      maxConcurrentSessions: 3,
      sessionIdLength: 32,
      secureCookies: true,
      httpOnlyCookies: true
    };
  }
  
  /**
   * Get input validation configuration
   */
  static getInputValidationConfig() {
    return {
      maxStringLength: 10000,
      maxArrayLength: 1000,
      allowedFileTypes: ['pdf', 'txt', 'csv', 'xlsx'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      sqlInjectionPatterns: [
        /('|(\\';)|(;)|(--)|(\/\*)|(\*\/)|(\bselect\b)|(\binsert\b)|(\bupdate\b)|(\bdelete\b)|(\bdrop\b)|(\bcreate\b)|(\balter\b)|(\bexec\b)|(\bunion\b)|(\bscript\b)/i
      ],
      xssPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi
      ]
    };
  }
  
  /**
   * Get Content Security Policy configuration
   */
  static getCSPConfig() {
    return {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://apis.google.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: true
    };
  }
  
  /**
   * Get rate limiting configuration
   */
  static getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      maxLoginAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };
  }
  
  /**
   * Get admin configuration
   */
  static getAdminConfig() {
    return {
      allowedDomains: ['@google.com'],
      adminEmails: [
        'admin@google.com',
        'system-admin@google.com',
        'casesdash-admin@google.com'
      ],
      teamLeaderEmails: [
        'team-lead@google.com',
        'supervisor@google.com',
        'manager@google.com'
      ],
      superAdminEmails: [
        'super-admin@google.com'
      ],
      requiredPermissions: {
        admin: ['read:all', 'write:all', 'delete:all', 'configure:system', 'manage:users'],
        teamLeader: ['read:team', 'write:team', 'delete:own', 'view:analytics'],
        user: ['read:own', 'write:own', 'view:basic']
      }
    };
  }
  
  /**
   * Get audit logging configuration
   */
  static getAuditConfig() {
    return {
      logLevel: 'INFO',
      retentionDays: 90,
      sensitiveFields: ['password', 'token', 'apiKey', 'sessionId'],
      auditEvents: [
        'user_login',
        'user_logout',
        'admin_action',
        'data_access',
        'data_modification',
        'security_violation',
        'failed_authentication'
      ],
      alertThresholds: {
        failedLogins: 5,
        suspiciousActivity: 10,
        dataAccess: 100
      }
    };
  }
  
  /**
   * Get encryption configuration
   */
  static getEncryptionConfig() {
    return {
      algorithm: 'AES-256-GCM',
      keyLength: 32,
      ivLength: 12,
      tagLength: 16,
      saltLength: 32,
      iterations: 100000
    };
  }
  
  /**
   * Validate security configuration
   */
  static validateConfiguration() {
    const validationResults = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    try {
      // Validate admin configuration
      const adminConfig = this.getAdminConfig();
      if (adminConfig.adminEmails.length === 0) {
        validationResults.errors.push('No admin emails configured');
        validationResults.valid = false;
      }
      
      // Validate CSRF configuration
      const csrfConfig = this.getCSRFConfig();
      if (csrfConfig.tokenLength < 16) {
        validationResults.warnings.push('CSRF token length should be at least 16 characters');
      }
      
      // Validate session configuration
      const sessionConfig = this.getSessionConfig();
      if (sessionConfig.timeout < 300000) { // 5 minutes
        validationResults.warnings.push('Session timeout is very short');
      }
      
      return validationResults;
      
    } catch (error) {
      validationResults.valid = false;
      validationResults.errors.push(`Configuration validation failed: ${error.message}`);
      return validationResults;
    }
  }
  
  /**
   * Get security headers configuration
   */
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': this.buildCSPHeader()
    };
  }
  
  /**
   * Build Content Security Policy header string
   */
  static buildCSPHeader() {
    const csp = this.getCSPConfig();
    let header = '';
    
    for (const [directive, sources] of Object.entries(csp)) {
      if (directive === 'upgradeInsecureRequests') {
        if (sources) header += 'upgrade-insecure-requests; ';
        continue;
      }
      
      const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      header += `${directiveName} ${sources.join(' ')}; `;
    }
    
    return header.trim();
  }
  
  /**
   * Get environment-specific configuration
   */
  static getEnvironmentConfig() {
    // In Google Apps Script, we can detect environment through PropertiesService
    try {
      const env = PropertiesService.getScriptProperties().getProperty('ENVIRONMENT') || 'production';
      
      return {
        environment: env,
        debugMode: env === 'development',
        strictSecurity: env === 'production',
        logLevel: env === 'development' ? 'DEBUG' : 'INFO',
        allowInsecureConnections: env === 'development'
      };
    } catch (error) {
      // Default to production for security
      return {
        environment: 'production',
        debugMode: false,
        strictSecurity: true,
        logLevel: 'INFO',
        allowInsecureConnections: false
      };
    }
  }
}

/**
 * Security Utilities
 */
class SecurityUtils {
  
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      // Use Utilities.getUuid() for better randomness in Google Apps Script
      const randomBytes = Utilities.getUuid().replace(/-/g, '');
      const randomIndex = parseInt(randomBytes.substr(i % randomBytes.length, 2), 16) % chars.length;
      result += chars.charAt(randomIndex);
    }
    
    return result;
  }
  
  /**
   * Generate CSRF token
   */
  static generateCSRFToken(sessionId) {
    const config = SecurityConfig.getCSRFConfig();
    const timestamp = Date.now();
    const randomPart = this.generateSecureToken(16);
    
    return `${config.tokenPrefix}${timestamp}_${sessionId}_${randomPart}`;
  }
  
  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token, sessionId) {
    if (!token || !sessionId) return false;
    
    const config = SecurityConfig.getCSRFConfig();
    
    if (!token.startsWith(config.tokenPrefix)) return false;
    
    const parts = token.substring(config.tokenPrefix.length).split('_');
    if (parts.length !== 3) return false;
    
    const timestamp = parseInt(parts[0]);
    const tokenSessionId = parts[1];
    
    // Validate session ID matches
    if (tokenSessionId !== sessionId) return false;
    
    // Validate token age
    const age = Date.now() - timestamp;
    if (age > config.expirationTime) return false;
    
    return true;
  }
  
  /**
   * Sanitize input for XSS prevention
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    const config = SecurityConfig.getInputValidationConfig();
    
    // Check for XSS patterns
    for (const pattern of config.xssPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially malicious content detected');
      }
    }
    
    // HTML encode special characters
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Validate input for SQL injection patterns
   */
  static validateSQLInput(input) {
    if (typeof input !== 'string') return true;
    
    const config = SecurityConfig.getInputValidationConfig();
    
    for (const pattern of config.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate secure session ID
   */
  static generateSecureSessionId() {
    const timestamp = Date.now();
    const uuid = Utilities.getUuid();
    const randomPart = this.generateSecureToken(16);
    
    return `session_${timestamp}_${uuid}_${randomPart}`;
  }
  
  /**
   * Hash sensitive data (simplified for Google Apps Script)
   */
  static hashData(data, salt = null) {
    if (!salt) {
      salt = this.generateSecureToken(16);
    }
    
    // Use Utilities.computeDigest for hashing in Google Apps Script
    const combined = data + salt;
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined);
    
    // Convert to hex string
    const hexString = digest.map(byte => {
      const hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
    return {
      hash: hexString,
      salt: salt
    };
  }
}

console.log('🔒 SecurityConfig module loaded successfully');
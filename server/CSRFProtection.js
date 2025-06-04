/**
 * CSRFProtection - Cross-Site Request Forgery Protection System
 * Implements CSRF token generation, validation, and management
 * 
 * @author Claude Code Security Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * CSRF Protection Manager
 * Handles all CSRF-related security operations
 */
class CSRFProtection {
  
  constructor() {
    this.config = SecurityConfig.getCSRFConfig();
    this.activeTokens = new Map(); // In-memory token storage
  }
  
  /**
   * Generate CSRF token for a user session
   */
  generateToken(sessionId, userEmail) {
    try {
      if (!sessionId || !userEmail) {
        throw new Error('Session ID and user email are required for CSRF token generation');
      }
      
      const timestamp = Date.now();
      const randomPart = SecurityUtils.generateSecureToken(16);
      const token = `${this.config.tokenPrefix}${timestamp}_${sessionId}_${randomPart}`;
      
      // Store token with metadata
      this.activeTokens.set(token, {
        sessionId: sessionId,
        userEmail: userEmail,
        timestamp: timestamp,
        used: false
      });
      
      // Clean up expired tokens
      this.cleanupExpiredTokens();
      
      console.log(`🔐 CSRF token generated for session: ${sessionId}`);
      
      return {
        success: true,
        token: token,
        expiresAt: timestamp + this.config.expirationTime
      };
      
    } catch (error) {
      console.error('❌ CSRF token generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validate CSRF token
   */
  validateToken(token, sessionId, userEmail) {
    try {
      if (!token || !sessionId || !userEmail) {
        return {
          success: false,
          error: 'Token, session ID, and user email are required'
        };
      }
      
      // Check if token exists in active tokens
      const tokenData = this.activeTokens.get(token);
      if (!tokenData) {
        console.warn(`⚠️ CSRF token not found: ${token}`);
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }
      
      // Validate token format
      if (!token.startsWith(this.config.tokenPrefix)) {
        return {
          success: false,
          error: 'Invalid token format'
        };
      }
      
      // Extract token components
      const parts = token.substring(this.config.tokenPrefix.length).split('_');
      if (parts.length !== 3) {
        return {
          success: false,
          error: 'Malformed token'
        };
      }
      
      const tokenTimestamp = parseInt(parts[0]);
      const tokenSessionId = parts[1];
      
      // Validate session ID matches
      if (tokenSessionId !== sessionId || tokenData.sessionId !== sessionId) {
        console.warn(`⚠️ CSRF session mismatch: expected ${sessionId}, got ${tokenSessionId}`);
        return {
          success: false,
          error: 'Session mismatch'
        };
      }
      
      // Validate user email matches
      if (tokenData.userEmail !== userEmail) {
        console.warn(`⚠️ CSRF user mismatch: expected ${userEmail}, got ${tokenData.userEmail}`);
        return {
          success: false,
          error: 'User mismatch'
        };
      }
      
      // Validate token age
      const age = Date.now() - tokenTimestamp;
      if (age > this.config.expirationTime) {
        console.warn(`⚠️ CSRF token expired: age ${age}ms > ${this.config.expirationTime}ms`);
        this.activeTokens.delete(token);
        return {
          success: false,
          error: 'Token expired'
        };
      }
      
      // Check if token was already used (prevent replay attacks)
      if (tokenData.used) {
        console.warn(`⚠️ CSRF token already used: ${token}`);
        return {
          success: false,
          error: 'Token already used'
        };
      }
      
      // Mark token as used
      tokenData.used = true;
      this.activeTokens.set(token, tokenData);
      
      console.log(`✅ CSRF token validated successfully for session: ${sessionId}`);
      
      return {
        success: true,
        message: 'Token validated successfully'
      };
      
    } catch (error) {
      console.error('❌ CSRF token validation failed:', error.message);
      return {
        success: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Cleanup expired tokens
   */
  cleanupExpiredTokens() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [token, data] of this.activeTokens.entries()) {
        if (now - data.timestamp > this.config.expirationTime) {
          this.activeTokens.delete(token);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired CSRF tokens`);
      }
      
    } catch (error) {
      console.warn('Failed to cleanup expired CSRF tokens:', error.message);
    }
  }
  
  /**
   * Invalidate all tokens for a session
   */
  invalidateSessionTokens(sessionId) {
    try {
      let invalidatedCount = 0;
      
      for (const [token, data] of this.activeTokens.entries()) {
        if (data.sessionId === sessionId) {
          this.activeTokens.delete(token);
          invalidatedCount++;
        }
      }
      
      console.log(`🗑️ Invalidated ${invalidatedCount} CSRF tokens for session: ${sessionId}`);
      
      return {
        success: true,
        invalidatedCount: invalidatedCount
      };
      
    } catch (error) {
      console.error('Failed to invalidate session tokens:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get token statistics
   */
  getTokenStatistics() {
    try {
      const now = Date.now();
      let activeCount = 0;
      let expiredCount = 0;
      let usedCount = 0;
      
      for (const [token, data] of this.activeTokens.entries()) {
        const age = now - data.timestamp;
        
        if (age > this.config.expirationTime) {
          expiredCount++;
        } else {
          activeCount++;
          if (data.used) {
            usedCount++;
          }
        }
      }
      
      return {
        success: true,
        statistics: {
          totalTokens: this.activeTokens.size,
          activeTokens: activeCount,
          expiredTokens: expiredCount,
          usedTokens: usedCount,
          unusedTokens: activeCount - usedCount
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Validate CSRF for incoming request
   */
  static validateRequest(requestData, sessionData) {
    try {
      const csrfProtection = new CSRFProtection();
      
      // Extract CSRF token from request
      const token = requestData.csrfToken || 
                   requestData.headers?.[SecurityConfig.getCSRFConfig().headerName] ||
                   requestData.parameters?.csrf_token;
      
      if (!token) {
        return {
          success: false,
          error: 'CSRF token missing from request'
        };
      }
      
      // Validate token
      return csrfProtection.validateToken(
        token,
        sessionData.sessionId,
        sessionData.userEmail
      );
      
    } catch (error) {
      console.error('❌ CSRF request validation failed:', error.message);
      return {
        success: false,
        error: `Request validation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Generate token for client-side use
   */
  static generateClientToken(sessionId, userEmail) {
    try {
      const csrfProtection = new CSRFProtection();
      return csrfProtection.generateToken(sessionId, userEmail);
    } catch (error) {
      console.error('❌ Client token generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create CSRF-protected form data
   */
  static protectFormData(formData, sessionId, userEmail) {
    try {
      const tokenResult = CSRFProtection.generateClientToken(sessionId, userEmail);
      
      if (!tokenResult.success) {
        return tokenResult;
      }
      
      return {
        success: true,
        protectedData: {
          ...formData,
          csrfToken: tokenResult.token,
          _csrf: tokenResult.token
        },
        token: tokenResult.token
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Form protection failed: ${error.message}`
      };
    }
  }
}

/**
 * CSRF Middleware for server functions
 */
class CSRFMiddleware {
  
  /**
   * Wrap server function with CSRF protection
   */
  static protect(serverFunction) {
    return function(requestData, ...args) {
      try {
        // Get current user session
        const currentUser = Session.getActiveUser().getEmail();
        const sessionId = requestData.sessionId || 'default_session';
        
        // Validate CSRF token
        const csrfResult = CSRFProtection.validateRequest(requestData, {
          sessionId: sessionId,
          userEmail: currentUser
        });
        
        if (!csrfResult.success) {
          console.warn(`🛡️ CSRF protection blocked request: ${csrfResult.error}`);
          return {
            success: false,
            error: 'CSRF validation failed',
            details: csrfResult.error
          };
        }
        
        // Execute original function
        return serverFunction.call(this, requestData, ...args);
        
      } catch (error) {
        console.error('❌ CSRF middleware error:', error.message);
        return {
          success: false,
          error: 'Security validation failed'
        };
      }
    };
  }
  
  /**
   * Create CSRF-protected endpoint
   */
  static createProtectedEndpoint(functionName, handler) {
    return {
      name: functionName,
      handler: CSRFMiddleware.protect(handler),
      requiresCSRF: true
    };
  }
}

console.log('🛡️ CSRF Protection system loaded successfully');
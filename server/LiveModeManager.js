/**
 * LiveModeManager - Manages Live Mode functionality for CasesDash
 * Handles real-time window management, auto-refresh, and state persistence
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * LiveModeManager class for managing live mode operations
 */
class LiveModeManager {
  /**
   * Create a LiveModeManager instance
   */
  constructor() {
    /** @type {string} */
    this.version = '1.0.0';
    
    /** @type {Object} Live mode configuration */
    this.config = {
      autoRefreshInterval: 30000, // 30 seconds
      minWindowSize: { width: 800, height: 600 },
      defaultWindowSize: { width: 1200, height: 800 },
      maxRefreshAttempts: 3,
      connectionTimeout: 10000 // 10 seconds
    };
    
    /** @type {Map} Active live mode sessions */
    this.activeSessions = new Map();
    
    /** @type {Date} Last data refresh timestamp */
    this.lastRefresh = null;
  }

  /**
   * Initialize live mode session
   * @param {string} sessionId - Unique session identifier
   * @param {Object} windowConfig - Window configuration options
   * @returns {Object} Initialization result
   */
  initializeSession(sessionId, windowConfig = {}) {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Valid session ID is required');
      }

      // Validate window configuration
      const config = this._validateWindowConfig(windowConfig);
      
      // Create session object
      const session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        windowConfig: config,
        activeTab: windowConfig.activeTab || 'dashboard',
        refreshCount: 0,
        errorCount: 0,
        status: 'active'
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      
      console.log(`Live mode session initialized: ${sessionId}`);
      
      return {
        success: true,
        sessionId: sessionId,
        config: config,
        message: 'Live mode session initialized successfully'
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to initialize live mode session.',
          context: { sessionId, windowConfig },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Get live dashboard data
   * @param {string} sessionId - Session identifier
   * @returns {Object} Dashboard data with real-time updates
   */
  getLiveDashboardData(sessionId) {
    try {
      if (!this._validateSession(sessionId)) {
        throw new Error('Invalid or expired session');
      }

      // Update session activity
      this._updateSessionActivity(sessionId);
      
      // Get current user info
      const privacyManager = new PrivacyManager();
      const userInfo = privacyManager.getCurrentUserInfo();
      
      // Collect real-time data from all sheets
      const dashboardData = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        user: {
          email: userInfo.email,
          role: userInfo.role
        },
        summary: {
          totalCases: 0,
          myCases: 0,
          openCases: 0,
          closedToday: 0,
          avgResponseTime: 0,
          slaViolations: 0
        },
        recentActivity: [],
        sheetData: {},
        alerts: [],
        timers: this._calculateRealTimeTimers()
      };

      // Get data from each sheet type
      const sheetTypes = SheetMapper.getAvailableSheetTypes();
      
      sheetTypes.forEach(sheetType => {
        try {
          const caseModel = new CaseModel(sheetType);
          
          // Get user's cases for this sheet
          const userCases = caseModel.getCasesByAssignee(userInfo.email);
          if (userCases.success && userCases.data) {
            const cases = userCases.data;
            
            // Update summary
            dashboardData.summary.myCases += cases.length;
            
            // Count open cases
            const openCases = cases.filter(c => 
              c.caseStatus && !['Finished', 'Closed'].includes(c.caseStatus)
            );
            dashboardData.summary.openCases += openCases.length;
            
            // Count cases closed today
            const today = new Date().toDateString();
            const closedToday = cases.filter(c => 
              c.closeDate && new Date(c.closeDate).toDateString() === today
            );
            dashboardData.summary.closedToday += closedToday.length;
            
            // Store sheet-specific data
            dashboardData.sheetData[sheetType] = {
              totalCases: cases.length,
              openCases: openCases.length,
              closedToday: closedToday.length,
              urgentCases: this._identifyUrgentCases(cases),
              recentUpdates: this._getRecentUpdates(cases, 5)
            };
            
            // Add to recent activity
            const recentActivity = this._getRecentUpdates(cases, 3);
            dashboardData.recentActivity.push(...recentActivity.map(activity => ({
              ...activity,
              sheetType: sheetType
            })));
          }
          
          // Get total cases if admin/team leader
          if (['admin', 'teamLeader'].includes(userInfo.role)) {
            const allCases = caseModel.search({ limit: 1000 });
            if (allCases.success) {
              dashboardData.summary.totalCases += allCases.totalCount || 0;
            }
          }
          
        } catch (sheetError) {
          console.warn(`Failed to get data for ${sheetType}:`, sheetError.message);
          dashboardData.alerts.push({
            type: 'warning',
            message: `Data unavailable for ${sheetType}`,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Sort recent activity by timestamp
      dashboardData.recentActivity.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Limit recent activity to latest 10 items
      dashboardData.recentActivity = dashboardData.recentActivity.slice(0, 10);
      
      // Calculate average response time
      if (dashboardData.summary.myCases > 0) {
        dashboardData.summary.avgResponseTime = this._calculateAverageResponseTime(dashboardData.sheetData);
      }
      
      // Update session refresh count
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.refreshCount++;
        session.lastRefresh = new Date().toISOString();
      }
      
      this.lastRefresh = new Date();
      
      return {
        success: true,
        data: dashboardData
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get live dashboard data.',
          context: { sessionId },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Update window state for persistence
   * @param {string} sessionId - Session identifier
   * @param {Object} windowState - Window state data
   * @returns {Object} Update result
   */
  updateWindowState(sessionId, windowState) {
    try {
      if (!this._validateSession(sessionId)) {
        throw new Error('Invalid or expired session');
      }

      if (!windowState || typeof windowState !== 'object') {
        throw new Error('Window state data is required');
      }

      // Validate window state
      const validatedState = this._validateWindowConfig(windowState);
      
      // Update session
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.windowConfig = { ...session.windowConfig, ...validatedState };
        session.lastActivity = new Date().toISOString();
        
        // Update active tab if provided
        if (windowState.activeTab) {
          session.activeTab = windowState.activeTab;
        }
      }

      return {
        success: true,
        message: 'Window state updated successfully'
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to update window state.',
          context: { sessionId, windowState },
          type: ErrorTypes.VALIDATION
        }
      );
    }
  }

  /**
   * Get current window state
   * @param {string} sessionId - Session identifier
   * @returns {Object} Current window state
   */
  getWindowState(sessionId) {
    try {
      if (!this._validateSession(sessionId)) {
        throw new Error('Invalid or expired session');
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      return {
        success: true,
        data: {
          sessionId: sessionId,
          windowConfig: session.windowConfig,
          activeTab: session.activeTab,
          lastActivity: session.lastActivity,
          refreshCount: session.refreshCount
        }
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get window state.',
          context: { sessionId },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Close live mode session
   * @param {string} sessionId - Session identifier
   * @returns {Object} Close result
   */
  closeSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.activeSessions.get(sessionId);
      if (session) {
        // Log session statistics
        const duration = new Date() - new Date(session.createdAt);
        console.log(`Live mode session closed: ${sessionId}, duration: ${Math.round(duration / 1000)}s, refreshes: ${session.refreshCount}`);
        
        // Remove session
        this.activeSessions.delete(sessionId);
      }

      return {
        success: true,
        message: 'Live mode session closed successfully'
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to close live mode session.',
          context: { sessionId },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Get live mode configuration
   * @returns {Object} Configuration data
   */
  getConfiguration() {
    try {
      return {
        success: true,
        data: {
          version: this.version,
          config: this.config,
          activeSessions: this.activeSessions.size,
          lastRefresh: this.lastRefresh,
          features: [
            'Real-time dashboard updates',
            'Window state persistence',
            'Auto-refresh every 30 seconds',
            'Multi-tab support',
            'Responsive window sizing'
          ]
        }
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get live mode configuration.',
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Validate session ID and check if session exists
   * @private
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Validation result
   */
  _validateSession(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check if session is too old (24 hours)
    const sessionAge = new Date() - new Date(session.createdAt);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Update session activity timestamp
   * @private
   * @param {string} sessionId - Session identifier
   */
  _updateSessionActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
  }

  /**
   * Validate window configuration
   * @private
   * @param {Object} config - Window configuration
   * @returns {Object} Validated configuration
   */
  _validateWindowConfig(config) {
    const validated = {
      width: this.config.defaultWindowSize.width,
      height: this.config.defaultWindowSize.height,
      x: 100,
      y: 100
    };

    if (config.width && typeof config.width === 'number') {
      validated.width = Math.max(config.width, this.config.minWindowSize.width);
    }

    if (config.height && typeof config.height === 'number') {
      validated.height = Math.max(config.height, this.config.minWindowSize.height);
    }

    if (config.x && typeof config.x === 'number') {
      validated.x = Math.max(0, config.x);
    }

    if (config.y && typeof config.y === 'number') {
      validated.y = Math.max(0, config.y);
    }

    return validated;
  }

  /**
   * Identify urgent cases based on criteria
   * @private
   * @param {Array} cases - Array of cases
   * @returns {Array} Urgent cases
   */
  _identifyUrgentCases(cases) {
    if (!Array.isArray(cases)) return [];

    return cases.filter(caseData => {
      // Case is urgent if:
      // 1. TRT Timer shows SLA violation
      // 2. Aging Timer shows escalation needed
      // 3. Case status is "Need Info" for more than 24 hours
      
      try {
        const now = new Date();
        
        // Check TRT violations
        if (caseData.trtFlag === 1 || caseData.trtFlag === true) {
          return true;
        }
        
        // Check aging violations
        if (caseData.agingFlag === 1 || caseData.agingFlag === true) {
          return true;
        }
        
        // Check Need Info status duration
        if (caseData.caseStatus === 'Need Info' && caseData.caseOpenDate) {
          const openDate = new Date(caseData.caseOpenDate);
          const hoursSinceOpen = (now - openDate) / (1000 * 60 * 60);
          if (hoursSinceOpen > 24) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.warn('Error checking urgent case criteria:', error.message);
        return false;
      }
    }).slice(0, 10); // Limit to 10 urgent cases
  }

  /**
   * Get recent updates from cases
   * @private
   * @param {Array} cases - Array of cases
   * @param {number} limit - Maximum number of updates
   * @returns {Array} Recent updates
   */
  _getRecentUpdates(cases, limit = 5) {
    if (!Array.isArray(cases)) return [];

    const updates = [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Last 24 hours

    cases.forEach(caseData => {
      try {
        // Check for recent case opening
        if (caseData.caseOpenDate) {
          const openDate = new Date(caseData.caseOpenDate);
          if (openDate > cutoffTime) {
            updates.push({
              type: 'case_opened',
              caseId: caseData.caseId,
              timestamp: openDate.toISOString(),
              description: `Case ${caseData.caseId} opened`
            });
          }
        }

        // Check for recent case closing
        if (caseData.closeDate) {
          const closeDate = new Date(caseData.closeDate);
          if (closeDate > cutoffTime) {
            updates.push({
              type: 'case_closed',
              caseId: caseData.caseId,
              timestamp: closeDate.toISOString(),
              description: `Case ${caseData.caseId} closed`
            });
          }
        }

        // Check for status changes (if we had historical data)
        // This would require additional tracking in a real implementation

      } catch (error) {
        console.warn('Error processing recent updates:', error.message);
      }
    });

    // Sort by timestamp and limit
    return updates
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Calculate real-time timers for display
   * @private
   * @returns {Object} Timer data
   */
  _calculateRealTimeTimers() {
    const now = new Date();
    
    return {
      currentTime: now.toISOString(),
      serverTime: now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      nextRefresh: new Date(now.getTime() + this.config.autoRefreshInterval).toISOString(),
      refreshInterval: this.config.autoRefreshInterval
    };
  }

  /**
   * Calculate average response time across all cases
   * @private
   * @param {Object} sheetData - Sheet data object
   * @returns {number} Average response time in hours
   */
  _calculateAverageResponseTime(sheetData) {
    let totalResponseTime = 0;
    let caseCount = 0;

    Object.values(sheetData).forEach(sheetInfo => {
      if (sheetInfo.recentUpdates) {
        sheetInfo.recentUpdates.forEach(update => {
          if (update.responseTime) {
            totalResponseTime += update.responseTime;
            caseCount++;
          }
        });
      }
    });

    return caseCount > 0 ? Math.round(totalResponseTime / caseCount * 10) / 10 : 0;
  }

  /**
   * Clean up expired sessions
   * @returns {number} Number of sessions cleaned up
   */
  cleanupSessions() {
    try {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let cleanedCount = 0;

      for (const [sessionId, session] of this.activeSessions.entries()) {
        const sessionAge = now - new Date(session.createdAt);
        if (sessionAge > maxAge) {
          this.activeSessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired live mode sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up sessions:', error.message);
      return 0;
    }
  }
}
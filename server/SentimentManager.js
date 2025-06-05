/**
 * CasesDash - Sentiment Score Manager
 * Monthly sentiment score management with privacy protection
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * SentimentManager class for managing monthly sentiment scores
 * Implements privacy protection, validation, and historical tracking
 */
class SentimentManager {
  
  /**
   * Constructor
   */
  constructor(options = {}) {
    this.sheetName = 'SentimentScores';
    this.privacyManager = new PrivacyManager();
    this.currentUser = Session.getActiveUser().getEmail();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分キャッシュ
    
    // Sentiment score constraints from specification
    this.scoreConstraints = {
      min: 1.0,
      max: 10.0,
      step: 0.5,
      default: 5.0
    };
    
    // Use client-side storage instead of spreadsheet by default
    this.useClientStorage = options.useClientStorage !== false;
    
    // Only initialize sheet if explicitly requested
    if (!this.useClientStorage && options.createSheetIfMissing) {
      this.initializeSheet();
    }
  }
  
  /**
   * Initialize sentiment scores sheet only when explicitly needed
   * @private
   * @param {boolean} createIfMissing - Whether to create sheet if missing
   */
  initializeSheet(createIfMissing = false) {
    try {
      const spreadsheetId = ConfigManager.getSpreadsheetId();
      if (!spreadsheetId) {
        throw new Error('Spreadsheet not configured');
      }
      
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      let sheet = spreadsheet.getSheetByName(this.sheetName);
      
      if (!sheet && createIfMissing) {
        console.log(`Creating SentimentScores sheet as explicitly requested`);
        sheet = spreadsheet.insertSheet(this.sheetName);
        this.setupSheetHeaders(sheet);
      }
      
      this.sheet = sheet;
      return { success: true, sheetExists: !!sheet };
      
    } catch (error) {
      ErrorHandler.logError(error, { 
        action: 'initializeSheet',
        sheetName: this.sheetName,
        createIfMissing: createIfMissing
      }, ErrorSeverity.HIGH, ErrorTypes.SPREADSHEET_API);
      throw error;
    }
  }
  
  /**
   * Set up sheet headers for sentiment scores
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target sheet
   */
  setupSheetHeaders(sheet) {
    const headers = [
      'User Email',
      'Year',
      'Month', 
      'Sentiment Score',
      'Comment',
      'Created Date',
      'Modified Date',
      'Modified By'
    ];
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e8f0fe');
    
    // Set column widths for better visibility
    sheet.setColumnWidth(1, 200); // User Email
    sheet.setColumnWidth(2, 80);  // Year
    sheet.setColumnWidth(3, 80);  // Month
    sheet.setColumnWidth(4, 120); // Sentiment Score
    sheet.setColumnWidth(5, 300); // Comment
    sheet.setColumnWidth(6, 150); // Created Date
    sheet.setColumnWidth(7, 150); // Modified Date
    sheet.setColumnWidth(8, 200); // Modified By
  }
  
  /**
   * Save sentiment score to client-side storage (default method)
   * @private
   * @param {number} score - Sentiment score
   * @param {string} comment - Comment
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Object} Operation result
   */
  saveToClientStorage(score, comment, year, month) {
    try {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);
      
      const storageKey = `sentiment_${this.currentUser}_${targetYear}_${targetMonth}`;
      const sentimentData = {
        userEmail: this.currentUser,
        year: targetYear,
        month: targetMonth,
        sentimentScore: score,
        comment: comment,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        modifiedBy: this.currentUser
      };
      
      // Store in PropertiesService for persistence
      PropertiesService.getUserProperties().setProperty(storageKey, JSON.stringify(sentimentData));
      
      // Cache the data
      this.setCachedData(storageKey, sentimentData);
      
      return {
        success: true,
        data: sentimentData,
        message: 'Sentiment score saved successfully (client storage)'
      };
      
    } catch (error) {
      ErrorHandler.logError(error, {
        action: 'saveToClientStorage',
        user: this.currentUser,
        score: score
      }, ErrorSeverity.MEDIUM, ErrorTypes.STORAGE);
      
      return {
        success: false,
        error: true,
        message: 'Failed to save sentiment score: ' + error.message
      };
    }
  }
  
  /**
   * Get sentiment score from client-side storage
   * @private
   * @param {string} userEmail - User email
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Object} Sentiment data or null
   */
  getFromClientStorage(userEmail, year, month) {
    try {
      const storageKey = `sentiment_${userEmail}_${year}_${month}`;
      const cached = this.getCachedData(storageKey);
      if (cached) {
        return cached;
      }
      
      const stored = PropertiesService.getUserProperties().getProperty(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.setCachedData(storageKey, data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get sentiment from client storage:', error);
      return null;
    }
  }
  
  /**
   * Get monthly sentiment score for a user
   * @param {string} userEmail - User email (optional, defaults to current user)
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Object} Sentiment score data or null
   */
  getMonthlySentimentScore(userEmail = null, year = null, month = null) {
    try {
      const targetUser = userEmail || this.currentUser;
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);
      
      // Privacy check
      const canAccess = this.canAccessUserData(targetUser);
      if (!canAccess.allowed) {
        return {
          success: false,
          error: true,
          message: canAccess.reason
        };
      }
      
      // Check cache first
      const cacheKey = `sentiment_${targetUser}_${targetYear}_${targetMonth}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }
      
      // Query sheet data
      const data = this.sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === targetUser && 
            row[1] === targetYear && 
            row[2] === targetMonth) {
          
          const sentimentData = {
            userEmail: row[0],
            year: row[1],
            month: row[2],
            sentimentScore: row[3],
            comment: row[4] || '',
            createdDate: row[5],
            modifiedDate: row[6],
            modifiedBy: row[7],
            rowIndex: i + 1
          };
          
          // Cache the result
          this.setCachedData(cacheKey, sentimentData);
          
          this.privacyManager.logAccess('sentiment', 'read', {
            targetUser: targetUser,
            year: targetYear,
            month: targetMonth
          });
          
          return {
            success: true,
            data: sentimentData
          };
        }
      }
      
      // No data found
      return {
        success: true,
        data: null
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get sentiment score. Please try again.',
          context: { userEmail, year, month },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Set monthly sentiment score for a user
   * @param {string} userEmail - User email (optional, defaults to current user)
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number} score - Sentiment score (1.0-10.0, 0.5 step)
   * @param {string} comment - Optional comment
   * @returns {Object} Operation result
   */
  setMonthlySentimentScore(userEmail = null, year = null, month = null, score, comment = '') {
    try {
      const targetUser = userEmail || this.currentUser;
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);
      
      // Validate inputs
      const validation = this.validateSentimentInput(score, targetYear, targetMonth);
      if (!validation.valid) {
        return {
          success: false,
          error: true,
          message: validation.message,
          validationErrors: validation.errors
        };
      }
      
      // Privacy and permission check
      const canEdit = this.canEditUserData(targetUser, targetYear, targetMonth);
      if (!canEdit.allowed) {
        return {
          success: false,
          error: true,
          message: canEdit.reason
        };
      }
      
      // Check if record exists
      const existing = this.getMonthlySentimentScore(targetUser, targetYear, targetMonth);
      if (!existing.success) {
        return existing;
      }
      
      const timestamp = new Date();
      
      if (existing.data) {
        // Update existing record
        const rowIndex = existing.data.rowIndex;
        const updateRange = this.sheet.getRange(rowIndex, 1, 1, 8);
        
        updateRange.setValues([[
          targetUser,
          targetYear,
          targetMonth,
          score,
          comment,
          existing.data.createdDate, // Keep original created date
          timestamp,
          this.currentUser
        ]]);
        
        this.privacyManager.logAccess('sentiment', 'update', {
          targetUser: targetUser,
          year: targetYear,
          month: targetMonth,
          oldScore: existing.data.sentimentScore,
          newScore: score
        });
        
      } else {
        // Create new record
        const newRow = [
          targetUser,
          targetYear,
          targetMonth,
          score,
          comment,
          timestamp,
          timestamp,
          this.currentUser
        ];
        
        this.sheet.appendRow(newRow);
        
        this.privacyManager.logAccess('sentiment', 'create', {
          targetUser: targetUser,
          year: targetYear,
          month: targetMonth,
          score: score
        });
      }
      
      // Clear cache for this user/period
      const cacheKey = `sentiment_${targetUser}_${targetYear}_${targetMonth}`;
      this.clearCachedData(cacheKey);
      
      return {
        success: true,
        message: 'Sentiment score saved successfully',
        data: {
          userEmail: targetUser,
          year: targetYear,
          month: targetMonth,
          sentimentScore: score,
          comment: comment,
          timestamp: timestamp
        }
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to save sentiment score. Please try again.',
          context: { userEmail, year, month, score, comment },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Get sentiment score history for a user
   * @param {string} userEmail - User email (optional, defaults to current user)
   * @param {number} months - Number of months to retrieve (default 12)
   * @returns {Object} Historical sentiment data
   */
  getSentimentHistory(userEmail = null, months = 12) {
    try {
      const targetUser = userEmail || this.currentUser;
      
      // Privacy check
      const canAccess = this.canAccessUserData(targetUser);
      if (!canAccess.allowed) {
        return {
          success: false,
          error: true,
          message: canAccess.reason
        };
      }
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      // Get all data for the user
      const data = this.sheet.getDataRange().getValues();
      const history = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === targetUser) {
          const recordDate = new Date(row[1], row[2] - 1); // year, month-1
          
          if (recordDate >= startDate && recordDate <= endDate) {
            history.push({
              userEmail: row[0],
              year: row[1],
              month: row[2],
              sentimentScore: row[3],
              comment: row[4] || '',
              createdDate: row[5],
              modifiedDate: row[6],
              modifiedBy: row[7]
            });
          }
        }
      }
      
      // Sort by year, then month (most recent first)
      history.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      // Calculate trends
      const trends = this.calculateTrends(history);
      
      this.privacyManager.logAccess('sentiment', 'history', {
        targetUser: targetUser,
        months: months,
        recordCount: history.length
      });
      
      return {
        success: true,
        data: {
          history: history,
          trends: trends,
          summary: {
            totalRecords: history.length,
            averageScore: trends.averageScore,
            trend: trends.overallTrend,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString()
            }
          }
        }
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get sentiment history. Please try again.',
          context: { userEmail, months },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Validate sentiment score input
   * @private
   * @param {number} score - Sentiment score
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Object} Validation result
   */
  validateSentimentInput(score, year, month) {
    const errors = [];
    
    // Validate score
    if (typeof score !== 'number' || isNaN(score)) {
      errors.push('Sentiment score must be a valid number');
    } else {
      if (score < this.scoreConstraints.min || score > this.scoreConstraints.max) {
        errors.push(`Sentiment score must be between ${this.scoreConstraints.min} and ${this.scoreConstraints.max}`);
      }
      
      // Check step constraint
      const remainder = (score - this.scoreConstraints.min) % this.scoreConstraints.step;
      if (remainder !== 0) {
        errors.push(`Sentiment score must be in steps of ${this.scoreConstraints.step}`);
      }
    }
    
    // Validate year
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 2020 || year > currentYear + 1) {
      errors.push('Year must be a valid year between 2020 and next year');
    }
    
    // Validate month
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push('Month must be between 1 and 12');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      message: errors.length > 0 ? errors.join('; ') : 'Valid input'
    };
  }
  
  /**
   * Check if current user can access another user's data
   * @private
   * @param {string} targetUser - Target user email
   * @returns {Object} Access check result
   */
  canAccessUserData(targetUser) {
    const currentRole = this.privacyManager.userRole;
    
    // Users can always access their own data
    if (targetUser === this.currentUser) {
      return { allowed: true };
    }
    
    // Admin can access all data
    if (currentRole === 'admin') {
      return { allowed: true };
    }
    
    // Team leaders can access team members' data
    if (currentRole === 'teamLeader') {
      const teamMembers = this.privacyManager.getTeamMembers(this.currentUser);
      if (teamMembers.includes(targetUser)) {
        return { allowed: true };
      }
    }
    
    return {
      allowed: false,
      reason: 'Access denied: You can only view your own sentiment scores'
    };
  }
  
  /**
   * Check if current user can edit another user's data
   * @private
   * @param {string} targetUser - Target user email
   * @param {number} year - Target year
   * @param {number} month - Target month
   * @returns {Object} Edit permission result
   */
  canEditUserData(targetUser, year, month) {
    const accessCheck = this.canAccessUserData(targetUser);
    if (!accessCheck.allowed) {
      return accessCheck;
    }
    
    // Check if editing window is valid (current month only for own data)
    if (targetUser === this.currentUser) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Allow editing current month and previous month (for flexibility)
      const allowedPeriods = [
        { year: currentYear, month: currentMonth },
        { year: currentMonth === 1 ? currentYear - 1 : currentYear, month: currentMonth === 1 ? 12 : currentMonth - 1 }
      ];
      
      const isValidPeriod = allowedPeriods.some(period => 
        period.year === year && period.month === month
      );
      
      if (!isValidPeriod) {
        return {
          allowed: false,
          reason: 'You can only edit sentiment scores for the current or previous month'
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Calculate trends from historical data
   * @private
   * @param {Array} history - Historical sentiment data
   * @returns {Object} Trend analysis
   */
  calculateTrends(history) {
    if (history.length === 0) {
      return {
        averageScore: 0,
        overallTrend: 'no-data',
        monthlyChange: 0,
        trendDirection: 'neutral'
      };
    }
    
    // Calculate average score
    const totalScore = history.reduce((sum, record) => sum + record.sentimentScore, 0);
    const averageScore = Number((totalScore / history.length).toFixed(1));
    
    // Calculate trend direction
    let trendDirection = 'neutral';
    let monthlyChange = 0;
    
    if (history.length >= 2) {
      const recent = history[0].sentimentScore;
      const previous = history[1].sentimentScore;
      monthlyChange = Number((recent - previous).toFixed(1));
      
      if (monthlyChange > 0.5) trendDirection = 'improving';
      else if (monthlyChange < -0.5) trendDirection = 'declining';
    }
    
    // Overall trend analysis
    let overallTrend = 'stable';
    if (history.length >= 3) {
      const recentAvg = history.slice(0, Math.ceil(history.length / 2))
        .reduce((sum, r) => sum + r.sentimentScore, 0) / Math.ceil(history.length / 2);
      const olderAvg = history.slice(Math.ceil(history.length / 2))
        .reduce((sum, r) => sum + r.sentimentScore, 0) / Math.floor(history.length / 2);
      
      const overallChange = recentAvg - olderAvg;
      if (overallChange > 0.5) overallTrend = 'improving';
      else if (overallChange < -0.5) overallTrend = 'declining';
    }
    
    return {
      averageScore,
      overallTrend,
      monthlyChange,
      trendDirection
    };
  }
  
  /**
   * Get cached data
   * @private
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * Set cached data
   * @private
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear cached data
   * @private
   * @param {string} key - Cache key
   */
  clearCachedData(key) {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get sentiment score summary for dashboard
   * @param {string} userEmail - User email (optional)
   * @returns {Object} Summary data
   */
  getSentimentSummary(userEmail = null) {
    try {
      const targetUser = userEmail || this.currentUser;
      
      // Get current month score
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const currentScore = this.getMonthlySentimentScore(targetUser, currentYear, currentMonth);
      const history = this.getSentimentHistory(targetUser, 6); // Last 6 months
      
      return {
        success: true,
        data: {
          currentMonth: {
            year: currentYear,
            month: currentMonth,
            score: currentScore.success && currentScore.data ? currentScore.data.sentimentScore : null,
            hasData: currentScore.success && currentScore.data !== null
          },
          history: history.success ? history.data : null,
          canEdit: this.canEditUserData(targetUser, currentYear, currentMonth).allowed
        }
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get sentiment summary.',
          context: { userEmail },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
  
  /**
   * Export sentiment data for a user (admin/team leader only)
   * @param {string} userEmail - Target user email
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  exportSentimentData(userEmail, options = {}) {
    try {
      // Check export permissions
      const exportCheck = this.privacyManager.checkExportPermissions('sentiment_data');
      if (!exportCheck.allowed) {
        return {
          success: false,
          error: true,
          message: 'Export permission denied',
          restrictions: exportCheck.restrictions
        };
      }
      
      const canAccess = this.canAccessUserData(userEmail);
      if (!canAccess.allowed) {
        return {
          success: false,
          error: true,
          message: canAccess.reason
        };
      }
      
      const months = options.months || 12;
      const history = this.getSentimentHistory(userEmail, months);
      
      if (!history.success) {
        return history;
      }
      
      // Format data for export
      const exportData = {
        userEmail: userEmail,
        exportDate: new Date().toISOString(),
        exportedBy: this.currentUser,
        data: history.data.history,
        summary: history.data.summary
      };
      
      this.privacyManager.logAccess('sentiment', 'export', {
        targetUser: userEmail,
        recordCount: history.data.history.length,
        months: months
      });
      
      return {
        success: true,
        data: exportData
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to export sentiment data.',
          context: { userEmail, options },
          type: ErrorTypes.PERMISSION
        }
      );
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SentimentManager };
}
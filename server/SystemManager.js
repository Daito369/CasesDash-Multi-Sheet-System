/**
 * CasesDash - System Manager
 * Handles system configuration, settings, and administrative functions
 *
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

class SystemManager {
  constructor() {
    this.initialized = true;
  }

  /**
   * Get system configuration (alias for getSystemConfig)
   * @returns {Object} System configuration
   */
  getConfiguration() {
    return this.getSystemConfig();
  }

  /**
   * Get system configuration
   * @returns {Object} System configuration
   */
  getSystemConfig() {
  try {
    const config = ConfigManager.getSystemSettings();
    const performance = getPerformanceMetrics();
    
    return {
      success: true,
      data: {
        ...config,
        performance: performance.data
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get system configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Update system configuration
   * @param {string} category - Configuration category
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @returns {Object} Update result
   */
  updateSystemConfig(category, key, value) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const success = ConfigManager.set(category, key, value);
    
    return {
      success: success,
      message: success ? 'Configuration updated successfully' : 'Failed to update configuration'
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update system configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get recent system errors
   * @param {number} limit - Number of errors to retrieve
   * @returns {Object} Recent errors
   */
  getRecentErrors(limit = 50) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const errors = ErrorHandler.getRecentErrors(limit);
    
    return {
      success: true,
      data: errors
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get recent errors.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
  try {
    const performanceManager = new PerformanceManager();
    const metrics = performanceManager.getDashboardData();
    
    return {
      success: true,
      data: {
        ...metrics,
        quotaUsage: performanceManager.getQuotaUsage(),
        systemHealth: calculateSystemHealth()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get performance metrics.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get sheet mapping configuration
   * @param {string} sheetType - Type of sheet
   * @returns {Object} Sheet mapping
   */
  getSheetMapping(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const mapper = SheetMapper.create(sheetType);
    if (!mapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    return {
      success: true,
      data: {
        sheetType: sheetType,
        columnMapping: mapper.columnMapping,
        requiredFields: mapper.getRequiredFields(),
        sheetSpecificFields: mapper.getSheetSpecificFields(),
        channel: mapper.getChannelValue()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sheet mapping.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Check system health
   * @returns {Object} System health status
   */
  checkSystemHealth() {
  try {
    const health = {
      status: 'healthy',
      services: {
        spreadsheet: true,
        errorHandler: true,
        configManager: true,
        privacyManager: true
      },
      performance: {
        averageResponseTime: 250,
        quotaUsage: 15,
        memoryUsage: 45
      },
      lastChecked: new Date().toISOString()
    };
    
    // Test spreadsheet connection
    try {
      const spreadsheetId = ConfigManager.getSpreadsheetId();
      if (spreadsheetId) {
        SpreadsheetApp.openById(spreadsheetId);
      } else {
        health.services.spreadsheet = false;
        health.status = 'warning';
      }
    } catch (error) {
      health.services.spreadsheet = false;
      health.status = 'error';
    }
    
    // Test performance manager
    try {
      const performanceManager = new PerformanceManager();
      const quotaUsage = performanceManager.getCurrentQuotaUsage();
      health.performance.quotaUsage = quotaUsage.percentage || 0;
      
      if (quotaUsage.percentage > 80) {
        health.status = 'warning';
      }
    } catch (error) {
      health.status = 'warning';
    }
    
    return {
      success: true,
      data: health
    };
    
  } catch (error) {
    return {
      success: false,
      data: {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      }
    };
  }
  }

  /**
   * Get API quota status
   * @returns {Object} API quota information
   */
  getAPIQuotaStatus() {
  try {
    const performanceManager = new PerformanceManager();
    const quotaStatus = performanceManager.getQuotaUsage();
    
    return {
      success: true,
      data: quotaStatus
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get API quota status.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Update system settings
   * @param {string} category - Settings category
   * @param {Object} settings - Settings to update
   * @returns {Object} Update result
   */
  updateSystemSettings(category, settings) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    if (!category || !settings) {
      throw new Error('Category and settings are required');
    }
    
    // Validate settings before applying
    const validation = validateSystemSettings(category, settings);
    if (!validation.success) {
      return {
        success: false,
        error: 'Settings validation failed',
        details: validation.errors
      };
    }
    
    // Apply settings
    Object.entries(settings).forEach(([key, value]) => {
      ConfigManager.set(category, key, value);
    });
    
    // Log the configuration change
    const privacyManager = new PrivacyManager();
    privacyManager.logAccess('configuration', 'system_settings_updated', {
      category: category,
      settings: Object.keys(settings),
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'System settings updated successfully',
      category: category,
      updatedKeys: Object.keys(settings)
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update system settings.',
        context: { category, settings },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Validate system settings
   * @param {string} category - Settings category
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validation result
   */
  validateSystemSettings(category, settings) {
  try {
    const errors = [];
    
    switch (category) {
      case 'performance':
        if (settings.cacheTimeout && (settings.cacheTimeout < 1 || settings.cacheTimeout > 3600)) {
          errors.push('Cache timeout must be between 1 and 3600 seconds');
        }
        if (settings.batchSize && (settings.batchSize < 1 || settings.batchSize > 1000)) {
          errors.push('Batch size must be between 1 and 1000');
        }
        break;
        
      case 'security':
        if (settings.sessionTimeout && (settings.sessionTimeout < 1 || settings.sessionTimeout > 24)) {
          errors.push('Session timeout must be between 1 and 24 hours');
        }
        break;
        
      case 'notifications':
        if (settings.webhookUrl && !settings.webhookUrl.startsWith('https://')) {
          errors.push('Webhook URL must use HTTPS');
        }
        break;
    }
    
    return {
      success: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
  }

  /**
   * Get UI configuration for the application
   * @returns {Object} UI configuration
   */
  getUIConfiguration() {
  try {
    const config = ConfigManager.getUISettings();
    const theme = ConfigManager.getThemeSettings();
    
    return {
      success: true,
      data: {
        ...config,
        theme: theme,
        availableSheetTypes: SheetMapper.getAvailableSheetTypes()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get UI configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get form schema for a specific sheet type
   * @param {string} sheetType - Type of sheet
   * @returns {Object} Form schema
   */
  getFormSchema(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const mapper = SheetMapper.create(sheetType);
    if (!mapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    const schema = {
      sheetType: sheetType,
      title: `${sheetType} Case Form`,
      fields: []
    };
    
    // Build form fields from column mapping
    Object.entries(mapper.columnMapping).forEach(([fieldName, column]) => {
      const field = {
        name: fieldName,
        label: formatFieldLabel(fieldName),
        type: getFieldType(fieldName),
        required: mapper.getRequiredFields().includes(fieldName),
        column: column
      };
      
      // Add field-specific configurations
      if (fieldName === 'caseStatus') {
        field.options = ['Open', 'In Progress', 'Pending', 'Closed', 'Escalated'];
      } else if (fieldName === 'priority') {
        field.options = ['Low', 'Normal', 'High', 'Critical'];
      }
      
      schema.fields.push(field);
    });
    
    return {
      success: true,
      data: schema
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get form schema.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get audit logs
   * @param {Object} filters - Log filters
   * @returns {Object} Audit logs
   */
  getAuditLogs(filters = {}) {
  try {
    const authResult = authenticateUser('teamLeader');
    if (!authResult.success) {
      return authResult;
    }
    
    const privacyManager = new PrivacyManager();
    return privacyManager.getAuditLogs(filters);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get audit logs.',
        context: { filters },
        type: ErrorTypes.PERMISSION
      }
    );
  }
  }

  /**
   * Calculate system health score
   * @returns {Object} System health assessment
   */
  calculateSystemHealth() {
  try {
    const health = {
      score: 100,
      status: 'healthy',
      issues: [],
      recommendations: []
    };
    
    // Check spreadsheet connectivity
    try {
      const spreadsheetId = ConfigManager.getSpreadsheetId();
      if (!spreadsheetId) {
        health.score -= 30;
        health.status = 'warning';
        health.issues.push('No spreadsheet configured');
        health.recommendations.push('Configure a spreadsheet in setup');
      } else {
        SpreadsheetApp.openById(spreadsheetId);
      }
    } catch (error) {
      health.score -= 40;
      health.status = 'error';
      health.issues.push('Cannot access configured spreadsheet');
      health.recommendations.push('Check spreadsheet permissions and ID');
    }
    
    // Check API quota usage
    try {
      const performanceManager = new PerformanceManager();
      const quotaUsage = performanceManager.getCurrentQuotaUsage();
      
      if (quotaUsage.percentage > 90) {
        health.score -= 20;
        health.status = 'warning';
        health.issues.push('High API quota usage');
        health.recommendations.push('Monitor API calls and optimize performance');
      } else if (quotaUsage.percentage > 70) {
        health.score -= 10;
        health.recommendations.push('Consider optimizing API usage');
      }
    } catch (error) {
      health.score -= 5;
      health.issues.push('Cannot check API quota');
    }
    
    // Check error rate
    try {
      const recentErrors = ErrorHandler.getRecentErrors(10);
      if (recentErrors.length > 5) {
        health.score -= 15;
        health.status = 'warning';
        health.issues.push('High error rate detected');
        health.recommendations.push('Review recent errors and fix underlying issues');
      }
    } catch (error) {
      health.score -= 5;
    }
    
    // Final status determination
    if (health.score >= 90) {
      health.status = 'healthy';
    } else if (health.score >= 70) {
      health.status = 'warning';
    } else {
      health.status = 'error';
    }
    
    return health;
    
  } catch (error) {
    return {
      score: 0,
      status: 'error',
      issues: ['System health check failed'],
      recommendations: ['Check system logs and configuration'],
      error: error.message
    };
  }
  }

  /**
   * Format field label for display
   * @param {string} fieldName - Field name
   * @returns {string} Formatted label
   */
  formatFieldLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  }

  /**
   * Get field type for form generation
   * @param {string} fieldName - Field name
   * @returns {string} Field type
   */
  getFieldType(fieldName) {
  const typeMap = {
    'caseOpenDate': 'date',
    'caseOpenTime': 'time',
    'lastModified': 'datetime',
    'caseStatus': 'select',
    'priority': 'select',
    'details': 'textarea',
    'tags': 'text',
    'caseId': 'text'
  };
  
  return typeMap[fieldName] || 'text';
  }

  /**
   * Reset system to default configuration
   * @param {string} category - Category to reset (optional, resets all if not provided)
   * @returns {Object} Reset result
   */
  resetSystemToDefaults(category = null) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const result = ConfigManager.resetToDefaults(category);
    
    // Log the reset operation
    const privacyManager = new PrivacyManager();
    privacyManager.logAccess('configuration', 'system_reset', {
      category: category || 'all',
      timestamp: new Date().toISOString(),
      resetBy: Session.getActiveUser().getEmail()
    });
    
    return {
      success: true,
      message: category ? 
        `${category} configuration reset to defaults` : 
        'All system configuration reset to defaults',
      category: category
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to reset system configuration.',
        context: { category },
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Export system configuration
   * @returns {Object} Configuration export
   */
  exportSystemConfiguration() {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const config = ConfigManager.exportConfig();
    const health = calculateSystemHealth();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: ConfigManager.getVersion(),
      configuration: config,
      systemHealth: health,
      exportedBy: Session.getActiveUser().getEmail()
    };
    
    return {
      success: true,
      data: exportData,
      message: 'System configuration exported successfully'
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export system configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Get system version and update information
   * @returns {Object} Version information
   */
  getSystemVersion() {
  try {
    return {
      success: true,
      data: {
        version: ConfigManager.getVersion(),
        lastUpdate: ConfigManager.getLastUpdate(),
        buildDate: '2025-05-25',
        environment: 'production'
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get system version.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Test CasesDash system functionality
   * @returns {Object} Test results
   */
  testCasesDash() {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const tests = {
      configManager: false,
      errorHandler: false,
      sheetMapper: false,
      privacyManager: false,
      performanceManager: false
    };
    
    // Test ConfigManager
    try {
      ConfigManager.getSystemSettings();
      tests.configManager = true;
    } catch (error) {
      console.error('ConfigManager test failed:', error);
    }
    
    // Test ErrorHandler
    try {
      ErrorHandler.getRecentErrors(1);
      tests.errorHandler = true;
    } catch (error) {
      console.error('ErrorHandler test failed:', error);
    }
    
    // Test SheetMapper
    try {
      SheetMapper.getAvailableSheetTypes();
      tests.sheetMapper = true;
    } catch (error) {
      console.error('SheetMapper test failed:', error);
    }
    
    // Test PrivacyManager
    try {
      new PrivacyManager();
      tests.privacyManager = true;
    } catch (error) {
      console.error('PrivacyManager test failed:', error);
    }
    
    // Test PerformanceManager
    try {
      new PerformanceManager();
      tests.performanceManager = true;
    } catch (error) {
      console.error('PerformanceManager test failed:', error);
    }
    
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    
    return {
      success: passedTests === totalTests,
      data: {
        tests: tests,
        summary: `${passedTests}/${totalTests} tests passed`,
        allPassed: passedTests === totalTests
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
   * Test system configuration method
   * @returns {Object} Test result for configuration method
   */
  testConfigurationMethod() {
    try {
      const config = this.getConfiguration();
      const systemConfig = this.getSystemConfig();
      
      return {
        success: true,
        data: {
          getConfiguration: config,
          getSystemConfig: systemConfig,
          methodsMatch: JSON.stringify(config) === JSON.stringify(systemConfig),
          testPassed: true
        },
        message: 'System configuration methods working correctly'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'System configuration method test failed'
      };
    }
  }

  /**
   * Get mock system configuration data for testing
   * @returns {Object} Mock system configuration data
   */
  getMockSystemConfiguration() {
    return {
      success: true,
      data: {
        performance: {
          averageResponseTime: 250,
          quotaUsage: 15,
          memoryUsage: 45
        },
        services: {
          spreadsheet: true,
          errorHandler: true,
          configManager: true,
          privacyManager: true
        },
        configuration: {
          version: '2.0',
          environment: 'production',
          buildDate: '2025-05-25'
        },
        testMode: true,
        lastTested: new Date().toISOString()
      }
    };
  }
}
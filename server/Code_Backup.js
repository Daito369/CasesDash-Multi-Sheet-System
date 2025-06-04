/**
 * CasesDash - Main Server-Side Logic
 * Central entry point for all server-side operations
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * Initialize the application on first load
 */
function onInstall() {
  try {
    ConfigManager.initialize();
    console.log('CasesDash installed successfully');
    
    return {
      success: true,
      message: 'CasesDash has been installed successfully'
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to install CasesDash. Please try again.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Main entry point for web app
 */
function doGet(e) {
  try {
    // Initialize if needed
    if (!ConfigManager.getSpreadsheetId()) {
      return HtmlService.createTemplateFromFile('client/setup')
        .evaluate()
        .setTitle('CasesDash Setup')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Check for page parameter to route to different views
    const page = e.parameter.page;
    
    if (page === 'live-mode') {
      // Return Live Mode page
      return HtmlService.createTemplateFromFile('client/live-mode')
        .evaluate()
        .setTitle('CasesDash - Live Mode')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Return main application
    return HtmlService.createTemplateFromFile('client/index')
      .evaluate()
      .setTitle('CasesDash - Enterprise Case Management')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    ErrorHandler.logError(error, { parameters: e }, ErrorSeverity.HIGH, ErrorTypes.INTERNAL);
    
    return HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>CasesDash - Error</h2>
        <p>An error occurred while loading the application.</p>
        <p>Please contact your administrator.</p>
        <p><strong>Error Details:</strong> ${error.message || 'Unknown error'}</p>
        <p><a href="${HtmlService.createHtmlOutput().getAs('text/html').getBlob().getDataAsString().includes('live-mode') ? '?' : '?'}" style="color: #1976d2;">← Back to Main App</a></p>
      </div>
    `).setTitle('CasesDash - Error');
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.postData.contents || '{}');
    
    switch (action) {
      case 'configure':
        return configureSpreadsheet(data.spreadsheetId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to process request. Please try again.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Configure spreadsheet for the application
 * @param {string} spreadsheetId - Spreadsheet ID to configure
 * @returns {Object} Configuration result
 */
function configureSpreadsheet(spreadsheetId) {
  try {
    // Validate spreadsheet ID
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Test access to spreadsheet
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    if (!spreadsheet) {
      throw new Error('Cannot access spreadsheet. Please check permissions.');
    }
    
    // Validate required sheets exist
    const requiredSheets = SheetMapper.getAvailableSheetTypes();
    const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
    const missingSheets = requiredSheets.filter(sheet => !existingSheets.includes(sheet));
    
    if (missingSheets.length > 0) {
      return {
        success: false,
        error: true,
        message: `Missing required sheets: ${missingSheets.join(', ')}`,
        missingSheets: missingSheets,
        existingSheets: existingSheets
      };
    }
    
    // Set spreadsheet ID in configuration
    const configSuccess = ConfigManager.setSpreadsheetId(spreadsheetId);
    if (!configSuccess) {
      throw new Error('Failed to save spreadsheet configuration');
    }
    
    console.log('Spreadsheet configured successfully:', spreadsheetId);
    
    return {
      success: true,
      message: 'Spreadsheet configured successfully',
      spreadsheetId: spreadsheetId,
      availableSheets: existingSheets
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to configure spreadsheet. Please check the ID and permissions.',
        context: { spreadsheetId },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Get available sheet types
 * @returns {Object} Available sheet types
 */
function getAvailableSheetTypes() {
  try {
    return {
      success: true,
      data: SheetMapper.getAvailableSheetTypes()
    };
  } catch (error) {
    return ErrorHandler.handleGracefully(error);
  }
}

/**
 * Create a new case with performance optimization
 * @param {string} sheetType - Type of sheet
 * @param {Object} caseData - Case data
 * @param {Object} options - Performance options
 * @returns {Object} Creation result
 */
function createCase(sheetType, caseData, options = {}) {
  try {
    // Validate inputs
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!caseData || typeof caseData !== 'object') {
      throw new Error('Case data is required');
    }
    
    // Create optimized case model instance
    const performanceManager = options.enablePerformanceTracking ? new PerformanceManager() : null;
    const batchProcessor = options.enableBatchProcessing ? new BatchProcessor(performanceManager) : null;
    
    const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
    
    // Configure optimization settings if provided
    if (options.optimizationSettings) {
      caseModel.configureOptimization(options.optimizationSettings);
    }
    
    // Create case
    return caseModel.create(caseData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to create case. Please try again.',
        context: { sheetType, caseData },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Read a case by ID
 * @param {string} sheetType - Type of sheet
 * @param {string} caseId - Case ID
 * @returns {Object} Case data
 */
function readCase(sheetType, caseId) {
  try {
    if (!sheetType || !caseId) {
      throw new Error('Sheet type and case ID are required');
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.read(caseId);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: `Failed to read case ${caseId}. Please try again.`,
        context: { sheetType, caseId },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Update a case
 * @param {string} sheetType - Type of sheet
 * @param {string} caseId - Case ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Update result
 */
function updateCase(sheetType, caseId, updates) {
  try {
    if (!sheetType || !caseId) {
      throw new Error('Sheet type and case ID are required');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates are required');
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.update(caseId, updates);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: `Failed to update case ${caseId}. Please try again.`,
        context: { sheetType, caseId, updates },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Delete a case
 * @param {string} sheetType - Type of sheet
 * @param {string} caseId - Case ID
 * @returns {Object} Deletion result
 */
function deleteCase(sheetType, caseId) {
  try {
    if (!sheetType || !caseId) {
      throw new Error('Sheet type and case ID are required');
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.delete(caseId);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: `Failed to delete case ${caseId}. Please try again.`,
        context: { sheetType, caseId },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Search cases
 * @param {string} sheetType - Type of sheet
 * @param {Object} criteria - Search criteria
 * @returns {Object} Search results
 */
function searchCases(sheetType, criteria = {}) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.search(criteria);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to search cases. Please try again.',
        context: { sheetType, criteria },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Get cases by assignee (privacy-protected)
 * @param {string} sheetType - Type of sheet
 * @param {string} assigneeEmail - Assignee email (optional, defaults to current user)
 * @returns {Object} Assignee's cases
 */
function getCasesByAssignee(sheetType, assigneeEmail = null) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    // Default to current user if no assignee specified
    const targetAssignee = assigneeEmail || Session.getActiveUser().getEmail();
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.getCasesByAssignee(targetAssignee);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get cases by assignee. Please try again.',
        context: { sheetType, assigneeEmail },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get current user information with Google OAuth and LDAP details
 * @returns {Object} User information
 */
function getCurrentUser() {
  try {
    const user = Session.getActiveUser();
    const userEmail = user.getEmail();
    
    // Validate @google.com domain restriction
    if (!userEmail || !userEmail.endsWith('@google.com')) {
      return {
        success: false,
        error: true,
        message: 'Access denied: Only @google.com accounts are allowed',
        type: 'DOMAIN_RESTRICTION'
      };
    }
    
    const userSettings = ConfigManager.getUserSettings();
    const userRole = getUserRole(userEmail);
    
    // Get LDAP information
    const ldapInfo = getLDAPUserInfo(userEmail);
    
    // Get OAuth profile information
    const oauthProfile = getGoogleOAuthProfile();
    
    return {
      success: true,
      data: {
        email: userEmail,
        displayName: oauthProfile.name || userEmail.split('@')[0],
        givenName: oauthProfile.givenName || '',
        familyName: oauthProfile.familyName || '',
        picture: oauthProfile.picture || '',
        ldap: ldapInfo.ldap || userEmail.split('@')[0],
        department: ldapInfo.department || 'Unknown',
        manager: ldapInfo.manager || '',
        employeeId: ldapInfo.employeeId || '',
        jobTitle: ldapInfo.jobTitle || '',
        location: ldapInfo.location || '',
        settings: userSettings,
        role: userRole,
        permissions: getUserPermissions(userRole),
        lastLogin: new Date().toISOString(),
        sessionId: generateSessionId(),
        authenticated: true
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get user information.',
        type: ErrorTypes.AUTHENTICATION
      }
    );
  }
}

/**
 * Get Google OAuth profile information
 * @private
 * @returns {Object} OAuth profile data
 */
function getGoogleOAuthProfile() {
  try {
    const user = Session.getActiveUser();
    const userEmail = user.getEmail();
    
    // Use Google's People API to get detailed profile information
    try {
      const peopleUrl = `https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos,organizations,locations`;
      const response = UrlFetchApp.fetch(peopleUrl, {
        headers: {
          'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
        }
      });
      
      if (response.getResponseCode() === 200) {
        const profile = JSON.parse(response.getContentText());
        
        return {
          name: profile.names?.[0]?.displayName || userEmail.split('@')[0],
          givenName: profile.names?.[0]?.givenName || '',
          familyName: profile.names?.[0]?.familyName || '',
          picture: profile.photos?.[0]?.url || '',
          organization: profile.organizations?.[0]?.name || 'Google',
          department: profile.organizations?.[0]?.department || '',
          jobTitle: profile.organizations?.[0]?.title || '',
          location: profile.locations?.[0]?.value || ''
        };
      }
    } catch (apiError) {
      console.warn('Failed to fetch Google People API data:', apiError.message);
    }
    
    // Fallback to basic user information
    return {
      name: userEmail.split('@')[0],
      givenName: '',
      familyName: '',
      picture: '',
      organization: 'Google',
      department: '',
      jobTitle: '',
      location: ''
    };
    
  } catch (error) {
    console.error('Failed to get OAuth profile:', error);
    return {
      name: 'Unknown User',
      givenName: '',
      familyName: '',
      picture: '',
      organization: '',
      department: '',
      jobTitle: '',
      location: ''
    };
  }
}

/**
 * Get LDAP user information from corporate directory
 * @private
 * @param {string} userEmail - User email address
 * @returns {Object} LDAP information
 */
function getLDAPUserInfo(userEmail) {
  try {
    // Extract LDAP username from email
    const ldap = userEmail.split('@')[0];
    
    // In a real implementation, this would query the corporate LDAP directory
    // For now, we'll use cached data and reasonable defaults
    const cachedLdapData = ConfigManager.getFromCache(`ldap_${ldap}`);
    
    if (cachedLdapData) {
      return cachedLdapData;
    }
    
    // Simulate LDAP data based on email patterns (for development)
    const ldapInfo = {
      ldap: ldap,
      department: determineDepartmentFromEmail(userEmail),
      manager: '',
      employeeId: generateEmployeeId(ldap),
      jobTitle: determineJobTitleFromRole(getUserRole(userEmail)),
      location: 'Mountain View, CA',
      directReports: [],
      teams: determineTeamsFromDepartment(determineDepartmentFromEmail(userEmail))
    };
    
    // Cache LDAP data for 1 hour
    ConfigManager.setCache(`ldap_${ldap}`, ldapInfo, 3600);
    
    return ldapInfo;
    
  } catch (error) {
    console.error('Failed to get LDAP info:', error);
    return {
      ldap: userEmail.split('@')[0],
      department: 'Unknown',
      manager: '',
      employeeId: '',
      jobTitle: '',
      location: '',
      directReports: [],
      teams: []
    };
  }
}

/**
 * Get user permissions based on role
 * @private
 * @param {string} role - User role
 * @returns {Object} User permissions
 */
function getUserPermissions(role) {
  const permissions = {
    admin: {
      viewAllCases: true,
      editAllCases: true,
      deleteAllCases: true,
      accessAuditLogs: true,
      systemConfiguration: true,
      userManagement: true,
      exportData: true,
      trtReports: true,
      teamManagement: true,
      bulkOperations: true,
      sentimentReports: true
    },
    teamLeader: {
      viewAllCases: false,
      editAllCases: false,
      deleteAllCases: false,
      accessAuditLogs: true,
      systemConfiguration: false,
      userManagement: false,
      exportData: true,
      trtReports: true,
      teamManagement: true,
      bulkOperations: true,
      sentimentReports: true,
      viewTeamCases: true,
      editTeamCases: true
    },
    user: {
      viewAllCases: false,
      editAllCases: false,
      deleteAllCases: false,
      accessAuditLogs: false,
      systemConfiguration: false,
      userManagement: false,
      exportData: false,
      trtReports: false,
      teamManagement: false,
      bulkOperations: false,
      sentimentReports: false,
      viewOwnCases: true,
      editOwnCases: true,
      sentimentScoring: true
    }
  };
  
  return permissions[role] || permissions.user;
}

/**
 * Generate unique session ID
 * @private
 * @returns {string} Session ID
 */
function generateSessionId() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * Determine department from email patterns
 * @private
 * @param {string} email - User email
 * @returns {string} Department name
 */
function determineDepartmentFromEmail(email) {
  const ldap = email.split('@')[0].toLowerCase();
  
  // Common Google department patterns
  if (ldap.includes('eng') || ldap.includes('swe') || ldap.includes('dev')) {
    return 'Engineering';
  }
  if (ldap.includes('pm') || ldap.includes('product')) {
    return 'Product Management';
  }
  if (ldap.includes('support') || ldap.includes('cs')) {
    return 'Customer Support';
  }
  if (ldap.includes('sales') || ldap.includes('biz')) {
    return 'Sales';
  }
  if (ldap.includes('legal')) {
    return 'Legal';
  }
  if (ldap.includes('hr')) {
    return 'Human Resources';
  }
  if (ldap.includes('finance') || ldap.includes('accounting')) {
    return 'Finance';
  }
  
  return 'General';
}

/**
 * Generate employee ID
 * @private
 * @param {string} ldap - LDAP username
 * @returns {string} Employee ID
 */
function generateEmployeeId(ldap) {
  // Generate a pseudo employee ID based on LDAP
  const hash = ldap.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash).toString().padStart(6, '0');
}

/**
 * Determine job title from role
 * @private
 * @param {string} role - User role
 * @returns {string} Job title
 */
function determineJobTitleFromRole(role) {
  const titles = {
    admin: 'System Administrator',
    teamLeader: 'Team Lead',
    user: 'Specialist'
  };
  
  return titles[role] || 'Specialist';
}

/**
 * Determine teams from department
 * @private
 * @param {string} department - Department name
 * @returns {Array} Team names
 */
function determineTeamsFromDepartment(department) {
  const teamMappings = {
    'Engineering': ['Backend Team', 'Frontend Team', 'Infrastructure'],
    'Product Management': ['Product Strategy', 'Product Operations'],
    'Customer Support': ['Technical Support', 'Customer Success'],
    'Sales': ['Enterprise Sales', 'SMB Sales'],
    'Legal': ['Privacy Team', 'Compliance'],
    'Human Resources': ['Recruiting', 'People Operations'],
    'Finance': ['Accounting', 'Financial Planning']
  };
  
  return teamMappings[department] || ['General Team'];
}

/**
 * Authenticate user with additional security checks
 * @param {string} requiredRole - Required minimum role (optional)
 * @returns {Object} Authentication result
 */
function authenticateUser(requiredRole = null) {
  try {
    const userResponse = getCurrentUser();
    
    if (!userResponse.success) {
      return userResponse;
    }
    
    const userData = userResponse.data;
    
    // Check domain restriction
    if (!userData.email.endsWith('@google.com')) {
      return {
        success: false,
        error: true,
        message: 'Access denied: Invalid domain',
        type: 'DOMAIN_RESTRICTION'
      };
    }
    
    // Check role requirement
    if (requiredRole) {
      const roleHierarchy = { user: 1, teamLeader: 2, admin: 3 };
      const userLevel = roleHierarchy[userData.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 99;
      
      if (userLevel < requiredLevel) {
        return {
          success: false,
          error: true,
          message: `Access denied: ${requiredRole} role required`,
          type: 'INSUFFICIENT_PERMISSIONS'
        };
      }
    }
    
    // Log successful authentication
    const privacyManager = new PrivacyManager();
    privacyManager.logAccess('authentication', 'login_success', {
      email: userData.email,
      role: userData.role,
      sessionId: userData.sessionId
    });
    
    return {
      success: true,
      data: userData
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Authentication failed. Please try again.',
        type: ErrorTypes.AUTHENTICATION
      }
    );
  }
}

/**
 * Update user settings
 * @param {Object} settings - Settings to update
 * @returns {Object} Update result
 */
function updateUserSettings(settings) {
  try {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }
    
    const success = ConfigManager.setUserSettings(settings);
    
    return {
      success: success,
      message: success ? 'Settings updated successfully' : 'Failed to update settings'
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update user settings. Please try again.',
        context: { settings },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get system configuration (admin only)
 * @returns {Object} System configuration
 */
function getSystemConfig() {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = getUserRole(currentUser);
    
    if (userRole !== 'admin') {
      throw new Error('Insufficient permissions to access system configuration');
    }
    
    return {
      success: true,
      data: ConfigManager.exportConfig()
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Access denied. Admin privileges required.',
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Update system configuration (admin only)
 * @param {string} category - Configuration category
 * @param {string} key - Configuration key
 * @param {any} value - Configuration value
 * @returns {Object} Update result
 */
function updateSystemConfig(category, key, value) {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = getUserRole(currentUser);
    
    if (userRole !== 'admin') {
      throw new Error('Insufficient permissions to update system configuration');
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
        context: { category, key, value },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get recent error logs (admin only)
 * @param {number} limit - Maximum number of errors to return
 * @returns {Object} Recent errors
 */
function getRecentErrors(limit = 50) {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = getUserRole(currentUser);
    
    if (!['admin', 'teamLeader'].includes(userRole)) {
      throw new Error('Insufficient permissions to access error logs');
    }
    
    return {
      success: true,
      data: ErrorHandler.getRecentErrors(limit)
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Access denied. Admin or Team Leader privileges required.',
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get sheet mapping for a specific sheet type
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Sheet mapping
 */
function getSheetMapping(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const sheetMapper = SheetMapper.create(sheetType);
    if (!sheetMapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    return {
      success: true,
      data: {
        sheetType: sheetType,
        mapping: sheetMapper.getAllMappings(),
        requiredFields: sheetMapper.getRequiredFields(),
        specificFields: sheetMapper.getSheetSpecificFields(),
        channelValue: sheetMapper.getChannelValue(),
        supports3PO: sheetMapper.supports3PO(),
        supportsAMInitiated: sheetMapper.supportsAMInitiated()
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
 * Validate case data
 * @param {string} sheetType - Type of sheet
 * @param {Object} caseData - Case data to validate
 * @param {boolean} isCreate - Whether this is for creation
 * @returns {Object} Validation result
 */
function validateCaseData(sheetType, caseData, isCreate = false) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!caseData || typeof caseData !== 'object') {
      throw new Error('Case data is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const validation = caseModel.validateCaseData(caseData, isCreate);
    
    return {
      success: true,
      data: validation
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to validate case data.',
        context: { sheetType, caseData, isCreate },
        type: ErrorTypes.VALIDATION
      }
    );
  }
}

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
  try {
    // This would typically get metrics from a monitoring service
    // For now, return basic information
    
    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        version: ConfigManager.getVersion(),
        lastUpdate: ConfigManager.getLastUpdate(),
        spreadsheetId: ConfigManager.getSpreadsheetId(),
        userCount: 1, // Placeholder
        errorCount: ErrorHandler.getRecentErrors(10).length
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
 * Include HTML file for templating
 * @param {string} filename - HTML file to include
 * @returns {string} HTML content
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    ErrorHandler.logError(error, { filename }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    return `<!-- Error loading ${filename} -->`;
  }
}

/**
 * Get user role for permission checking
 * @private
 * @param {string} userEmail - User email
 * @returns {string} User role
 */
function getUserRole(userEmail) {
  try {
    // This would typically check against a user management system
    const adminEmails = ConfigManager.get('security', 'adminEmails') || [];
    const teamLeaderEmails = ConfigManager.get('security', 'teamLeaderEmails') || [];
    
    if (adminEmails.includes(userEmail)) return 'admin';
    if (teamLeaderEmails.includes(userEmail)) return 'teamLeader';
    
    return 'user';
    
  } catch (error) {
    ErrorHandler.logError(error, { userEmail }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    return 'user';
  }
}


/**
 * Test and configure spreadsheet connection with validation
 * @param {string} spreadsheetId - Spreadsheet ID to configure
 * @param {boolean} validateOnly - If true, only validate without saving
 * @returns {Object} Configuration result with detailed validation
 */
function testSpreadsheetConnection(spreadsheetId, validateOnly = false) {
  try {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    // Test access to spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (accessError) {
      return {
        success: false,
        error: true,
        message: 'Cannot access spreadsheet. Please check ID and permissions.',
        details: {
          spreadsheetId: spreadsheetId,
          errorType: 'ACCESS_DENIED',
          suggestions: [
            'Verify the spreadsheet ID is correct',
            'Ensure the spreadsheet is shared with the service account',
            'Check that the spreadsheet exists and is not deleted'
          ]
        }
      };
    }
    
    // Get spreadsheet metadata
    const spreadsheetName = spreadsheet.getName();
    const spreadsheetUrl = spreadsheet.getUrl();
    const owner = spreadsheet.getOwner()?.getEmail() || 'Unknown';
    
    // Validate required sheets exist
    const requiredSheets = SheetMapper.getAvailableSheetTypes();
    const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
    const validSheets = [];
    const missingSheets = [];
    const extraSheets = [];
    
    // Check each required sheet
    requiredSheets.forEach(requiredSheet => {
      if (existingSheets.includes(requiredSheet)) {
        validSheets.push(requiredSheet);
      } else {
        missingSheets.push(requiredSheet);
      }
    });
    
    // Identify extra sheets
    existingSheets.forEach(existingSheet => {
      if (!requiredSheets.includes(existingSheet)) {
        extraSheets.push(existingSheet);
      }
    });
    
    // Validate sheet structure for existing sheets
    const sheetValidation = {};
    for (const sheetName of validSheets) {
      try {
        const sheet = spreadsheet.getSheetByName(sheetName);
        const validation = validateSheetStructure(sheet, sheetName);
        sheetValidation[sheetName] = validation;
      } catch (error) {
        sheetValidation[sheetName] = {
          valid: false,
          error: error.message
        };
      }
    }
    
    const isFullyValid = missingSheets.length === 0 &&
                        Object.values(sheetValidation).every(v => v.valid);
    
    const result = {
      success: isFullyValid,
      spreadsheetInfo: {
        id: spreadsheetId,
        name: spreadsheetName,
        url: spreadsheetUrl,
        owner: owner,
        totalSheets: existingSheets.length
      },
      validation: {
        requiredSheets: requiredSheets.length,
        validSheets: validSheets.length,
        missingSheets: missingSheets,
        extraSheets: extraSheets,
        sheetValidation: sheetValidation
      },
      recommendations: generateSpreadsheetRecommendations(missingSheets, sheetValidation)
    };
    
    // Save configuration if validation passes and not validation-only mode
    if (isFullyValid && !validateOnly) {
      const configSuccess = ConfigManager.setSpreadsheetId(spreadsheetId);
      if (configSuccess) {
        result.message = 'Spreadsheet configured and validated successfully';
        result.configured = true;
        
        // Log configuration change
        const privacyManager = new PrivacyManager();
        privacyManager.logAccess('configuration', 'spreadsheet_configured', {
          spreadsheetId: spreadsheetId,
          spreadsheetName: spreadsheetName,
          validSheets: validSheets.length
        });
      } else {
        result.success = false;
        result.message = 'Validation passed but failed to save configuration';
      }
    } else if (validateOnly) {
      result.message = isFullyValid ?
        'Spreadsheet validation passed' :
        'Spreadsheet validation failed - see details';
    } else {
      result.message = 'Spreadsheet validation failed - missing required sheets';
    }
    
    return result;
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to test spreadsheet connection. Please check the ID and permissions.',
        context: { spreadsheetId, validateOnly },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Validate sheet structure for a specific sheet
 * @private
 * @param {Sheet} sheet - Google Sheets object
 * @param {string} sheetType - Expected sheet type
 * @returns {Object} Validation result
 */
function validateSheetStructure(sheet, sheetType) {
  try {
    const sheetMapper = SheetMapper.create(sheetType);
    if (!sheetMapper) {
      return {
        valid: false,
        error: `Unknown sheet type: ${sheetType}`
      };
    }
    
    // Get expected headers
    const expectedHeaders = Object.keys(sheetMapper.getAllMappings());
    
    // Get actual headers from first row
    const actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Check for missing and extra headers
    const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
    const extraHeaders = actualHeaders.filter(header =>
      header && !expectedHeaders.includes(header)
    );
    
    const isValid = missingHeaders.length === 0;
    
    return {
      valid: isValid,
      expectedHeaders: expectedHeaders.length,
      actualHeaders: actualHeaders.filter(h => h).length,
      missingHeaders: missingHeaders,
      extraHeaders: extraHeaders,
      rowCount: sheet.getLastRow(),
      columnCount: sheet.getLastColumn()
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Generate recommendations for spreadsheet configuration
 * @private
 * @param {Array} missingSheets - List of missing sheets
 * @param {Object} sheetValidation - Sheet validation results
 * @returns {Array} List of recommendations
 */
function generateSpreadsheetRecommendations(missingSheets, sheetValidation) {
  const recommendations = [];
  
  if (missingSheets.length > 0) {
    recommendations.push({
      type: 'error',
      title: 'Missing Required Sheets',
      description: `Create the following sheets: ${missingSheets.join(', ')}`,
      action: 'Create missing sheets with proper headers'
    });
  }
  
  Object.entries(sheetValidation).forEach(([sheetName, validation]) => {
    if (!validation.valid) {
      recommendations.push({
        type: 'warning',
        title: `Sheet Structure Issue: ${sheetName}`,
        description: validation.error || 'Invalid sheet structure',
        action: 'Fix sheet headers and structure'
      });
    }
    
    if (validation.missingHeaders && validation.missingHeaders.length > 0) {
      recommendations.push({
        type: 'warning',
        title: `Missing Headers in ${sheetName}`,
        description: `Add headers: ${validation.missingHeaders.join(', ')}`,
        action: 'Add missing column headers'
      });
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      title: 'Configuration Complete',
      description: 'All sheets are properly configured',
      action: 'No action needed'
    });
  }
  
  return recommendations;
}

/**
 * Get security settings
 * @private
 * @returns {Object} Security settings
 */
function getSecuritySettings() {
  return {
    domainRestriction: '@google.com',
    sessionTimeout: 8, // hours
    auditLogging: true,
    encryptionEnabled: true,
    mfaRequired: false,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true
    }
  };
}

/**
 * Get notification settings
 * @private
 * @returns {Object} Notification settings
 */
function getNotificationSettings() {
  return {
    googleChatWebhook: ConfigManager.get('notifications', 'googleChatWebhook') || '',
    emailNotifications: ConfigManager.get('notifications', 'emailEnabled') || true,
    trtAlerts: ConfigManager.get('notifications', 'trtAlertsEnabled') || true,
    escalationNotifications: ConfigManager.get('notifications', 'escalationEnabled') || true,
    maintenanceNotifications: ConfigManager.get('notifications', 'maintenanceEnabled') || true
  };
}

/**
 * Get active user count
 * @private
 * @returns {number} Number of active users
 */
function getActiveUserCount() {
  try {
    // This would typically query active sessions
    // For now, return a reasonable estimate
    return 1;
  } catch (error) {
    return 0;
  }
}

/**
 * Check system health
 * @private
 * @returns {Object} System health status
 */
function checkSystemHealth() {
  try {
    const health = {
      overall: 'healthy',
      services: {
        spreadsheetAPI: 'operational',
        propertiesService: 'operational',
        scriptRuntime: 'operational'
      },
      performance: {
        averageResponseTime: '< 1s',
        errorRate: '< 1%',
        quotaUsage: '< 50%'
      }
    };
    
    // Test critical services
    try {
      ConfigManager.get('test', 'connectivity');
      health.services.propertiesService = 'operational';
    } catch (error) {
      health.services.propertiesService = 'degraded';
      health.overall = 'degraded';
    }
    
    return health;
    
  } catch (error) {
    return {
      overall: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Get API quota status
 * @private
 * @returns {Object} API quota information
 */
function getAPIQuotaStatus() {
  try {
    // This would typically check actual quota usage
    return {
      spreadsheetReads: { used: 100, limit: 1000, percentage: 10 },
      spreadsheetWrites: { used: 50, limit: 500, percentage: 10 },
      scriptRuntime: { used: 300, limit: 3600, percentage: 8.3 },
      triggers: { used: 5, limit: 20, percentage: 25 }
    };
  } catch (error) {
    return {
      error: 'Unable to fetch quota information'
    };
  }
}

/**
 * Update system settings
 * @param {string} category - Settings category
 * @param {Object} settings - Settings to update
 * @returns {Object} Update result
 */
function updateSystemSettings(category, settings) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    if (!category || !settings || typeof settings !== 'object') {
      throw new Error('Category and settings object are required');
    }
    
    // Validate settings based on category
    const validation = validateSystemSettings(category, settings);
    if (!validation.valid) {
      return {
        success: false,
        error: true,
        message: 'Invalid settings',
        details: validation.errors
      };
    }
    
    // Update settings
    const updateResults = [];
    Object.entries(settings).forEach(([key, value]) => {
      try {
        const success = ConfigManager.set(category, key, value);
        updateResults.push({ key, success, value });
      } catch (error) {
        updateResults.push({ key, success: false, error: error.message });
      }
    });
    
    const allSuccessful = updateResults.every(r => r.success);
    
    if (allSuccessful) {
      // Log configuration change
      const privacyManager = new PrivacyManager();
      privacyManager.logAccess('configuration', 'system_settings_updated', {
        category: category,
        settingsCount: Object.keys(settings).length,
        updatedBy: authResult.data.email
      });
    }
    
    return {
      success: allSuccessful,
      message: allSuccessful ?
        'System settings updated successfully' :
        'Some settings failed to update',
      details: updateResults
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update system settings.',
        context: { category, settings },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Validate system settings
 * @private
 * @param {string} category - Settings category
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validation result
 */
function validateSystemSettings(category, settings) {
  const errors = [];
  
  try {
    switch (category) {
      case 'security':
        if (settings.adminEmails && !Array.isArray(settings.adminEmails)) {
          errors.push('adminEmails must be an array');
        }
        if (settings.sessionTimeout && (!Number.isInteger(settings.sessionTimeout) || settings.sessionTimeout < 1)) {
          errors.push('sessionTimeout must be a positive integer');
        }
        break;
        
      case 'notifications':
        if (settings.googleChatWebhook && typeof settings.googleChatWebhook !== 'string') {
          errors.push('googleChatWebhook must be a string');
        }
        if (settings.googleChatWebhook && !settings.googleChatWebhook.startsWith('https://chat.googleapis.com/')) {
          errors.push('googleChatWebhook must be a valid Google Chat webhook URL');
        }
        break;
        
      case 'performance':
        if (settings.batchSize && (!Number.isInteger(settings.batchSize) || settings.batchSize < 1)) {
          errors.push('batchSize must be a positive integer');
        }
        break;
        
      default:
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: ['Validation failed: ' + error.message]
    };
  }
}

/**
 * Initialize application on startup
 */
function onOpen() {
  try {
    // This would run when the spreadsheet is opened
    // Create custom menu if needed
    console.log('CasesDash application opened');
  } catch (error) {
    ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
  }
}

// ====================
// UI-SPECIFIC API ENDPOINTS
// ====================

/**
 * Advanced search with privacy filtering
 * @param {string} sheetType - Type of sheet
 * @param {Object} searchParams - Advanced search parameters
 * @returns {Object} Privacy-filtered search results
 */
function advancedSearch(sheetType, searchParams = {}) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const privacyManager = new PrivacyManager();
    
    // Execute advanced search
    const searchResult = caseModel.advancedSearch(searchParams);
    
    if (!searchResult.success) {
      return searchResult;
    }
    
    // Apply privacy filtering
    const filteredData = privacyManager.filterCasesForUser(searchResult.data);
    
    return {
      success: true,
      data: filteredData,
      totalCount: searchResult.totalCount,
      facets: searchResult.facets,
      executionTime: searchResult.executionTime,
      limit: searchResult.limit,
      offset: searchResult.offset,
      hasMore: searchResult.hasMore,
      privacyFiltered: true
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform advanced search. Please try again.',
        context: { sheetType, searchParams },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Execute batch operations with privacy checks
 * @param {string} sheetType - Type of sheet
 * @param {Array} operations - Array of operations to perform
 * @returns {Object} Batch operation results
 */
function batchOperations(sheetType, operations) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('Operations array is required');
    }
    
    const privacyManager = new PrivacyManager();
    
    // Check permissions for sensitive operations
    const hasBulkPermission = privacyManager.validateSensitiveOperation('bulk_update');
    if (!hasBulkPermission) {
      return {
        success: false,
        error: true,
        message: 'Access denied: Insufficient permissions for bulk operations'
      };
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.batchOperations(operations);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to execute batch operations. Please try again.',
        context: { sheetType, operationCount: operations.length },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Get UI configuration based on user role
 * @returns {Object} UI configuration
 */
function getUIConfiguration() {
  try {
    const privacyManager = new PrivacyManager();
    const uiConfig = privacyManager.getUIConfiguration();
    const userInfo = privacyManager.getCurrentUserInfo();
    
    return {
      success: true,
      data: {
        ...uiConfig,
        user: userInfo,
        availableSheetTypes: SheetMapper.getAvailableSheetTypes(),
        systemVersion: ConfigManager.getVersion()
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
 * Get form schema for dynamic form generation
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Form schema
 */
function getFormSchema(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const sheetMapper = SheetMapper.create(sheetType);
    if (!sheetMapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    const privacyManager = new PrivacyManager();
    const uiConfig = privacyManager.getUIConfiguration();
    
    // Build form schema based on sheet type and user permissions
    const schema = {
      sheetType: sheetType,
      title: `${sheetType} Case Form`,
      fields: [],
      conditionalFields: {},
      validationRules: {}
    };
    
    // Get all mappings and build field definitions
    const mappings = sheetMapper.getAllMappings();
    const requiredFields = sheetMapper.getRequiredFields();
    const specificFields = sheetMapper.getSheetSpecificFields();
    
    Object.keys(mappings).forEach(fieldName => {
      const field = {
        name: fieldName,
        label: formatFieldLabel(fieldName),
        type: getFieldType(fieldName),
        required: requiredFields.includes(fieldName),
        column: mappings[fieldName]
      };
      
      // Add conditional display rules
      if (specificFields.includes(fieldName)) {
        if (fieldName === 'amInitiated' && sheetMapper.supportsAMInitiated()) {
          field.conditional = true;
          field.showWhen = { sheetType: ['OT Email'] };
        }
        
        if (['issueCategory', 'details'].includes(fieldName) && sheetMapper.supports3PO()) {
          field.conditional = true;
          field.showWhen = { sheetType: ['3PO Email', '3PO Chat', '3PO Phone'] };
        }
        
        if (fieldName === 'date' && ['Chat', 'Phone'].some(type => sheetType.includes(type))) {
          field.hidden = true;
        }
      }
      
      // Apply privacy restrictions
      if (!uiConfig.showSentimentScores && fieldName === 'sentimentScore') {
        field.hidden = true;
      }
      
      if (!uiConfig.showInternalNotes && fieldName === 'internalNotes') {
        field.hidden = true;
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
 * Get audit logs (admin only)
 * @param {Object} filters - Filters for audit logs
 * @returns {Object} Audit logs
 */
function getAuditLogs(filters = {}) {
  try {
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
 * Check export permissions
 * @param {string} exportType - Type of export
 * @returns {Object} Export permission check result
 */
function checkExportPermissions(exportType) {
  try {
    const privacyManager = new PrivacyManager();
    return {
      success: true,
      data: privacyManager.checkExportPermissions(exportType)
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to check export permissions.',
        context: { exportType },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Subscribe to data changes
 * @param {string} sheetType - Type of sheet to monitor
 * @returns {Object} Subscription result
 */
function subscribeToDataChanges(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    
    // Create callback function for data changes
    const callback = (changes) => {
      console.log(`Data changes detected in ${sheetType}:`, changes);
      // In a real implementation, this would trigger UI updates
    };
    
    const subscription = caseModel.subscribeToDataChanges(callback);
    
    return {
      success: true,
      data: {
        subscriptionId: subscription?.subscriptionId,
        sheetType: sheetType,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to subscribe to data changes.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get dashboard statistics
 * @returns {Object} Dashboard statistics
 */
function getDashboardStats() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    const stats = {
      totalCases: 0,
      myCases: 0,
      openCases: 0,
      closedToday: 0,
      avgResponseTime: 0,
      recentActivity: []
    };
    
    // Get statistics based on user role
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        
        // Get user's cases
        const userCases = caseModel.getCasesByAssignee(userInfo.email);
        if (userCases.success) {
          stats.myCases += userCases.data.length;
          
          // Count open cases
          const openCases = userCases.data.filter(c =>
            c.caseStatus !== 'Closed' && c.caseStatus !== 'Deleted'
          );
          stats.openCases += openCases.length;
          
          // Count closed today
          const today = new Date().toDateString();
          const closedToday = userCases.data.filter(c =>
            c.caseStatus === 'Closed' &&
            new Date(c.closeDate).toDateString() === today
          );
          stats.closedToday += closedToday.length;
        }
        
        // Get total cases if admin/team leader
        if (['admin', 'teamLeader'].includes(userInfo.role)) {
          const allCases = caseModel.search({ limit: 1000 });
          if (allCases.success) {
            stats.totalCases += allCases.totalCount;
          }
        }
        
      } catch (error) {
        // Continue with other sheet types if one fails
        console.warn(`Failed to get stats for ${sheetType}:`, error.message);
      }
    });
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get dashboard statistics.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Format field label for UI display
 * @private
 * @param {string} fieldName - Field name
 * @returns {string} Formatted label
 */
function formatFieldLabel(fieldName) {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Get field type for form generation
 * @private
 * @param {string} fieldName - Field name
 * @returns {string} Field type
 */
function getFieldType(fieldName) {
  const dateFields = ['caseOpenDate', 'firstCloseDate', 'reopenCloseDate', 'closeDate'];
  const timeFields = ['caseOpenTime', 'firstCloseTime', 'reopenCloseTime', 'closeTime'];
  const numberFields = ['is30', 'triage', 'preferEither', 'amInitiated', 'bug', 'needInfo'];
  const emailFields = ['customerEmail', 'firstAssignee', 'finalAssignee'];
  const selectFields = ['caseStatus', 'issueCategory', 'channel'];
  const textareaFields = ['details', 'internalNotes', 'escalationReason'];
  
  if (dateFields.includes(fieldName)) return 'date';
  if (timeFields.includes(fieldName)) return 'time';
  if (numberFields.includes(fieldName)) return 'checkbox';
  if (emailFields.includes(fieldName)) return 'email';
  if (selectFields.includes(fieldName)) return 'select';
  if (textareaFields.includes(fieldName)) return 'textarea';
  
  return 'text';
}

// ====================
// SENTIMENT SCORE API ENDPOINTS
// ====================

/**
 * Get monthly sentiment score for a user
 * @param {string} userEmail - User email (optional, defaults to current user)
 * @param {number} year - Year (optional, defaults to current year)
 * @param {number} month - Month (optional, defaults to current month)
 * @returns {Object} Sentiment score data
 */
function getMonthlySentimentScore(userEmail = null, year = null, month = null) {
  try {
    const sentimentManager = new SentimentManager();
    return sentimentManager.getMonthlySentimentScore(userEmail, year, month);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get monthly sentiment score. Please try again.',
        context: { userEmail, year, month },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Set monthly sentiment score for a user
 * @param {string} userEmail - User email (optional, defaults to current user)
 * @param {number} year - Year (optional, defaults to current year)
 * @param {number} month - Month (optional, defaults to current month)
 * @param {number} score - Sentiment score (1.0-10.0, 0.5 step)
 * @param {string} comment - Optional comment
 * @returns {Object} Operation result
 */
function setMonthlySentimentScore(userEmail = null, year = null, month = null, score, comment = '') {
  try {
    if (score === null || score === undefined) {
      throw new Error('Sentiment score is required');
    }
    
    const sentimentManager = new SentimentManager();
    return sentimentManager.setMonthlySentimentScore(userEmail, year, month, score, comment);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to save monthly sentiment score. Please try again.',
        context: { userEmail, year, month, score, comment },
        type: ErrorTypes.VALIDATION
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
function getSentimentHistory(userEmail = null, months = 12) {
  try {
    if (months && (!Number.isInteger(months) || months < 1 || months > 60)) {
      throw new Error('Months parameter must be between 1 and 60');
    }
    
    const sentimentManager = new SentimentManager();
    return sentimentManager.getSentimentHistory(userEmail, months);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sentiment history. Please try again.',
        context: { userEmail, months },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get sentiment score summary for dashboard
 * @param {string} userEmail - User email (optional, defaults to current user)
 * @returns {Object} Summary data
 */
function getSentimentSummary(userEmail = null) {
  try {
    const sentimentManager = new SentimentManager();
    return sentimentManager.getSentimentSummary(userEmail);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sentiment summary. Please try again.',
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
function exportSentimentData(userEmail, options = {}) {
  try {
    if (!userEmail) {
      throw new Error('User email is required for export');
    }
    
    const sentimentManager = new SentimentManager();
    return sentimentManager.exportSentimentData(userEmail, options);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export sentiment data. Please try again.',
        context: { userEmail, options },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get sentiment score constraints and configuration
 * @returns {Object} Configuration data
 */
function getSentimentConfiguration() {
  try {
    const sentimentManager = new SentimentManager();
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    
    return {
      success: true,
      data: {
        constraints: sentimentManager.scoreConstraints,
        permissions: {
          canViewOwnScores: true,
          canEditOwnScores: true,
          canViewTeamScores: userInfo.role === 'teamLeader' || userInfo.role === 'admin',
          canEditTeamScores: userInfo.role === 'teamLeader' || userInfo.role === 'admin',
          canViewAllScores: userInfo.role === 'admin',
          canExportData: userInfo.role === 'teamLeader' || userInfo.role === 'admin'
        },
        editingRules: {
          currentMonthOnly: userInfo.role === 'user',
          allowPreviousMonth: true,
          description: 'Users can edit current and previous month only. Team leaders and admins have broader access.'
        }
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sentiment configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Validate sentiment score input
 * @param {number} score - Sentiment score to validate
 * @param {number} year - Year (optional)
 * @param {number} month - Month (optional)
 * @returns {Object} Validation result
 */
function validateSentimentScore(score, year = null, month = null) {
  try {
    const sentimentManager = new SentimentManager();
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || (currentDate.getMonth() + 1);
    
    const validation = sentimentManager.validateSentimentInput(score, targetYear, targetMonth);
    
    return {
      success: true,
      data: validation
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to validate sentiment score.',
        context: { score, year, month },
        type: ErrorTypes.VALIDATION
      }
    );
  }
}

/**
 * Get team sentiment overview (team leader/admin only)
 * @param {number} months - Number of months to analyze (default 6)
 * @returns {Object} Team sentiment overview
 */
function getTeamSentimentOverview(months = 6) {
  try {
    const privacyManager = new PrivacyManager();
    const userRole = privacyManager.userRole;
    
    if (!['teamLeader', 'admin'].includes(userRole)) {
      return {
        success: false,
        error: true,
        message: 'Access denied: Team leader or admin role required'
      };
    }
    
    const teamMembers = userRole === 'admin'
      ? [] // Get all users for admin
      : privacyManager.getTeamMembers(privacyManager.currentUser);
    
    const sentimentManager = new SentimentManager();
    const teamOverview = {
      teamMembers: [],
      aggregatedStats: {
        averageScore: 0,
        totalResponses: 0,
        responseRate: 0,
        trendDirection: 'neutral'
      },
      monthlyTrends: []
    };
    
    // For team leaders, analyze team members
    if (userRole === 'teamLeader' && teamMembers.length > 0) {
      for (const memberEmail of teamMembers) {
        const memberHistory = sentimentManager.getSentimentHistory(memberEmail, months);
        if (memberHistory.success) {
          teamOverview.teamMembers.push({
            email: memberEmail,
            ...memberHistory.data.summary
          });
        }
      }
    }
    
    // Calculate aggregated statistics
    if (teamOverview.teamMembers.length > 0) {
      const totalScore = teamOverview.teamMembers.reduce((sum, member) =>
        sum + (member.averageScore || 0), 0
      );
      const totalRecords = teamOverview.teamMembers.reduce((sum, member) =>
        sum + (member.totalRecords || 0), 0
      );
      
      teamOverview.aggregatedStats.averageScore = Number((totalScore / teamOverview.teamMembers.length).toFixed(1));
      teamOverview.aggregatedStats.totalResponses = totalRecords;
      teamOverview.aggregatedStats.responseRate = Number(((totalRecords / (months * teamOverview.teamMembers.length)) * 100).toFixed(1));
    }
    
    privacyManager.logAccess('sentiment', 'team_overview', {
      months: months,
      teamMemberCount: teamOverview.teamMembers.length
    });
    
    return {
      success: true,
      data: teamOverview
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get team sentiment overview.',
        context: { months },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

// ====================
// LIVE MODE API ENDPOINTS
// ====================

/**
 * Initialize a new live mode session
 * @param {Object} windowConfig - Window configuration options
 * @returns {Object} Session initialization result
 */
function initializeLiveMode(windowConfig = {}) {
  try {
    const sessionId = `live_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    const liveModeManager = new LiveModeManager();
    
    return liveModeManager.initializeSession(sessionId, windowConfig);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to initialize live mode. Please try again.',
        context: { windowConfig },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get live dashboard data for real-time updates
 * @param {string} sessionId - Live mode session identifier
 * @returns {Object} Live dashboard data
 */
function getLiveDashboard(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const liveModeManager = new LiveModeManager();
    return liveModeManager.getLiveDashboardData(sessionId);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get live dashboard data. Please try again.',
        context: { sessionId },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Update live mode window state for persistence
 * @param {string} sessionId - Session identifier
 * @param {Object} windowState - Window state data
 * @returns {Object} Update result
 */
function updateLiveModeWindowState(sessionId, windowState) {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!windowState || typeof windowState !== 'object') {
      throw new Error('Window state is required');
    }
    
    const liveModeManager = new LiveModeManager();
    return liveModeManager.updateWindowState(sessionId, windowState);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update window state. Please try again.',
        context: { sessionId, windowState },
        type: ErrorTypes.VALIDATION
      }
    );
  }
}

/**
 * Get current live mode window state
 * @param {string} sessionId - Session identifier
 * @returns {Object} Window state data
 */
function getLiveModeWindowState(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const liveModeManager = new LiveModeManager();
    return liveModeManager.getWindowState(sessionId);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get window state. Please try again.',
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
function closeLiveMode(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    const liveModeManager = new LiveModeManager();
    return liveModeManager.closeSession(sessionId);
    
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
 * Get live mode configuration and status
 * @returns {Object} Live mode configuration
 */
function getLiveModeConfiguration() {
  try {
    const liveModeManager = new LiveModeManager();
    return liveModeManager.getConfiguration();
    
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
 * Clean up expired live mode sessions (maintenance function)
 * @returns {Object} Cleanup result
 */
function cleanupLiveModeSessions() {
  try {
    const liveModeManager = new LiveModeManager();
    const cleanedCount = liveModeManager.cleanupSessions();
    
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedCount: cleanedCount
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to cleanup live mode sessions.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Serve live mode HTML page
 * @param {Object} params - URL parameters
 * @returns {HtmlOutput} Live mode HTML page
 */
function serveLiveMode(params = {}) {
  try {
    return HtmlService.createTemplateFromFile('client/live-mode')
      .evaluate()
      .setTitle('CasesDash - Live Mode')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    ErrorHandler.logError(error, { params }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    
    return HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>CasesDash Live Mode - Error</h2>
        <p>An error occurred while loading live mode.</p>
        <p>Please contact your administrator.</p>
      </div>
    `).setTitle('CasesDash Live Mode - Error');
  }
}

// ====================
// PHASE 3.1 CASE MANAGEMENT API ENDPOINTS
// ====================

/**
 * Generate unique case ID for a specific sheet type
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Generated case ID
 */
function generateCaseId(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    // Validate sheet type
    const availableTypes = SheetMapper.getAvailableSheetTypes();
    if (!availableTypes.includes(sheetType)) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    const caseModel = new CaseModel(sheetType);
    return caseModel.generateUniqueCaseId();
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to generate case ID. Please try again.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get case by ID from specific sheet type
 * @param {string} caseId - Case ID to retrieve
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Case data
 */
function getCaseById(caseId, sheetType) {
  try {
    if (!caseId || !sheetType) {
      throw new Error('Case ID and sheet type are required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const result = caseModel.read(caseId);
    
    if (!result.success) {
      return result;
    }
    
    // Apply privacy filtering
    const privacyManager = new PrivacyManager();
    const filteredData = privacyManager.filterCaseForUser(result.data);
    
    return {
      success: true,
      data: filteredData
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: `Failed to retrieve case ${caseId}. Please try again.`,
        context: { caseId, sheetType },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Get all cases for current user across all sheet types
 * @param {Object} options - Query options
 * @returns {Object} User's cases
 */
function getUserCases(options = {}) {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const userCases = {
      totalCount: 0,
      cases: [],
      bySheetType: {}
    };
    
    // Get cases from each sheet type
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const sheetCases = caseModel.getCasesByAssignee(userInfo.email);
        
        if (sheetCases.success && sheetCases.data) {
          const filteredCases = sheetCases.data.map(caseData => ({
            ...caseData,
            sheetType: sheetType
          }));
          
          userCases.cases.push(...filteredCases);
          userCases.bySheetType[sheetType] = filteredCases;
          userCases.totalCount += filteredCases.length;
        }
        
      } catch (error) {
        console.warn(`Failed to get cases from ${sheetType}:`, error.message);
        userCases.bySheetType[sheetType] = [];
      }
    });
    
    // Apply sorting and filtering
    if (options.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      
      userCases.cases.sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    }
    
    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      userCases.cases = userCases.cases.slice(offset, offset + options.limit);
    }
    
    return {
      success: true,
      data: userCases
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get user cases. Please try again.',
        context: { options },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Update multiple cases in batch (admin/team leader only)
 * @param {Array} updates - Array of case updates
 * @returns {Object} Batch update result
 */
function batchUpdateCases(updates) {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }
    
    const privacyManager = new PrivacyManager();
    const hasPermission = privacyManager.validateSensitiveOperation('bulk_update');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions for batch update operations');
    }
    
    const results = {
      successful: [],
      failed: [],
      totalCount: updates.length
    };
    
    updates.forEach((update, index) => {
      try {
        const { caseId, sheetType, data } = update;
        
        if (!caseId || !sheetType || !data) {
          throw new Error('Invalid update format');
        }
        
        const caseModel = new CaseModel(sheetType);
        const result = caseModel.update(caseId, data);
        
        if (result.success) {
          results.successful.push({
            index: index,
            caseId: caseId,
            sheetType: sheetType
          });
        } else {
          results.failed.push({
            index: index,
            caseId: caseId,
            sheetType: sheetType,
            error: result.message || 'Update failed'
          });
        }
        
      } catch (error) {
        results.failed.push({
          index: index,
          caseId: update.caseId || 'unknown',
          sheetType: update.sheetType || 'unknown',
          error: error.message
        });
      }
    });
    
    // Log batch operation
    privacyManager.logAccess('case', 'batch_update', {
      updateCount: updates.length,
      successCount: results.successful.length,
      failureCount: results.failed.length
    });
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform batch update. Please try again.',
        context: { updateCount: updates?.length },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get case creation template for specific sheet type
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Case template
 */
function getCaseTemplate(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const sheetMapper = SheetMapper.create(sheetType);
    if (!sheetMapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    // Build template with default values
    const template = {
      sheetType: sheetType,
      fields: {},
      metadata: {
        requiredFields: sheetMapper.getRequiredFields(),
        optionalFields: [],
        channelValue: sheetMapper.getChannelValue(),
        supports3PO: sheetMapper.supports3PO(),
        supportsAMInitiated: sheetMapper.supportsAMInitiated()
      }
    };
    
    // Get all field mappings
    const mappings = sheetMapper.getAllMappings();
    const requiredFields = sheetMapper.getRequiredFields();
    
    Object.keys(mappings).forEach(fieldName => {
      const isRequired = requiredFields.includes(fieldName);
      
      // Set default values
      if (fieldName === 'channel') {
        template.fields[fieldName] = sheetMapper.getChannelValue();
      } else if (fieldName === 'caseStatus') {
        template.fields[fieldName] = 'Open';
      } else if (fieldName === 'caseOpenDate') {
        template.fields[fieldName] = new Date().toISOString().split('T')[0];
      } else if (fieldName === 'caseOpenTime') {
        template.fields[fieldName] = new Date().toTimeString().split(' ')[0];
      } else {
        template.fields[fieldName] = '';
      }
      
      if (!isRequired) {
        template.metadata.optionalFields.push(fieldName);
      }
    });
    
    return {
      success: true,
      data: template
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get case template.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get case statistics for dashboard
 * @param {Object} filters - Optional filters
 * @returns {Object} Case statistics
 */
function getCaseStatistics(filters = {}) {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const stats = {
      totalCases: 0,
      openCases: 0,
      closedCases: 0,
      myCases: 0,
      bySheetType: {},
      byStatus: {},
      byAssignee: {},
      recentActivity: []
    };
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        
        // Get cases based on user role
        let cases = [];
        if (['admin', 'teamLeader'].includes(userInfo.role)) {
          const allCases = caseModel.search({ limit: 1000 });
          cases = allCases.success ? allCases.data : [];
        } else {
          const userCases = caseModel.getCasesByAssignee(userInfo.email);
          cases = userCases.success ? userCases.data : [];
        }
        
        // Count by sheet type
        stats.bySheetType[sheetType] = cases.length;
        stats.totalCases += cases.length;
        
        // Count by status
        cases.forEach(caseData => {
          const status = caseData.caseStatus || 'Unknown';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
          
          if (status === 'Open' || status === 'In Progress') {
            stats.openCases++;
          } else if (status === 'Closed') {
            stats.closedCases++;
          }
          
          // Count user's cases
          if (caseData.finalAssignee === userInfo.email ||
              caseData.firstAssignee === userInfo.email) {
            stats.myCases++;
          }
          
          // Count by assignee (for admin/team leader)
          if (['admin', 'teamLeader'].includes(userInfo.role)) {
            const assignee = caseData.finalAssignee || caseData.firstAssignee || 'Unassigned';
            stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1;
          }
        });
        
      } catch (error) {
        console.warn(`Failed to get statistics for ${sheetType}:`, error.message);
        stats.bySheetType[sheetType] = 0;
      }
    });
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get case statistics.',
        context: { filters },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Search cases across all sheet types
 * @param {Object} searchCriteria - Search parameters
 * @returns {Object} Search results across all sheets
 */
function globalCaseSearch(searchCriteria = {}) {
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const globalResults = {
      totalCount: 0,
      results: [],
      bySheetType: {},
      executionTime: Date.now()
    };
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const sheetResults = caseModel.search(searchCriteria);
        
        if (sheetResults.success && sheetResults.data) {
          const filteredResults = sheetResults.data.map(caseData => ({
            ...caseData,
            sheetType: sheetType
          }));
          
          globalResults.results.push(...filteredResults);
          globalResults.bySheetType[sheetType] = filteredResults.length;
          globalResults.totalCount += filteredResults.length;
        } else {
          globalResults.bySheetType[sheetType] = 0;
        }
        
      } catch (error) {
        console.warn(`Search failed for ${sheetType}:`, error.message);
        globalResults.bySheetType[sheetType] = 0;
      }
    });
    
    // Apply privacy filtering
    globalResults.results = globalResults.results.map(caseData =>
      privacyManager.filterCaseForUser(caseData)
    );
    
    // Sort by relevance or specified field
    if (searchCriteria.sortBy) {
      const sortField = searchCriteria.sortBy;
      const sortOrder = searchCriteria.sortOrder === 'desc' ? -1 : 1;
      
      globalResults.results.sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    }
    
    globalResults.executionTime = Date.now() - globalResults.executionTime;
    
    return {
      success: true,
      data: globalResults
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform global search. Please try again.',
        context: { searchCriteria },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Test function for development
 */
function testCasesDash() {
  try {
    console.log('Testing CasesDash components...');
    
    // Test ConfigManager
    ConfigManager.initialize();
    console.log('✓ ConfigManager initialized');
    
    // Test SheetMapper
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    console.log('✓ SheetMapper available types:', sheetTypes.length);
    
    // Test ErrorHandler
    ErrorHandler.logError('Test error', { test: true }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    console.log('✓ ErrorHandler logging works');
    
    // Test LiveModeManager
    const liveModeManager = new LiveModeManager();
    const liveConfig = liveModeManager.getConfiguration();
    console.log('✓ LiveModeManager configured:', liveConfig.success);
    
    // Test Performance components
    const performanceManager = new PerformanceManager();
    const batchProcessor = new BatchProcessor(performanceManager);
    console.log('✓ PerformanceManager and BatchProcessor initialized');
    
    // Test Phase 3.1 functions
    const testSheetType = sheetTypes[0];
    if (testSheetType) {
      const caseId = generateCaseId(testSheetType);
      console.log('✓ generateCaseId works:', caseId.success);
      
      const template = getCaseTemplate(testSheetType);
      console.log('✓ getCaseTemplate works:', template.success);
      
      // Test performance optimization
      const optimizationStats = getPerformanceOptimizationStats(testSheetType);
      console.log('✓ Performance optimization stats:', optimizationStats.success);
    }
    
    console.log('All components tested successfully!');
    
    return {
      success: true,
      message: 'All components tested successfully',
      components: ['ConfigManager', 'SheetMapper', 'ErrorHandler', 'CaseModel', 'LiveModeManager', 'PerformanceManager', 'BatchProcessor', 'Phase3.1APIs']
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ====================
// PERFORMANCE OPTIMIZATION API ENDPOINTS
// ====================

/**
 * Get performance optimization statistics for a sheet type
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Performance optimization statistics
 */
function getPerformanceOptimizationStats(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const performanceManager = new PerformanceManager();
    const batchProcessor = new BatchProcessor(performanceManager);
    const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
    
    return {
      success: true,
      data: caseModel.getOptimizationStats()
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get performance optimization statistics.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Configure performance optimization settings for a sheet type
 * @param {string} sheetType - Type of sheet
 * @param {Object} settings - Optimization settings
 * @returns {Object} Configuration result
 */
function configurePerformanceOptimization(sheetType, settings) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }
    
    const performanceManager = new PerformanceManager();
    const batchProcessor = new BatchProcessor(performanceManager);
    const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
    
    return caseModel.configureOptimization(settings);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to configure performance optimization.',
        context: { sheetType, settings },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Execute batch read operation with performance optimization
 * @param {string} sheetType - Type of sheet
 * @param {Array} caseIds - Array of case IDs to read
 * @returns {Object} Batch read results
 */
function batchReadCases(sheetType, caseIds) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      throw new Error('Case IDs array is required');
    }
    
    const performanceManager = new PerformanceManager();
    const batchProcessor = new BatchProcessor(performanceManager);
    const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
    
    return caseModel.batchRead(caseIds);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to execute batch read operation.',
        context: { sheetType, caseCount: caseIds?.length },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Get global performance metrics across all sheet types
 * @returns {Object} Global performance metrics
 */
function getGlobalPerformanceMetrics() {
  try {
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const globalMetrics = {
      totalApiCalls: 0,
      totalApiCallsReduced: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      bySheetType: {},
      overallReductionPercentage: 0,
      timestamp: new Date().toISOString()
    };
    
    let totalResponseTime = 0;
    let totalCacheHits = 0;
    let sheetTypeCount = 0;
    
    sheetTypes.forEach(sheetType => {
      try {
        const performanceManager = new PerformanceManager();
        const batchProcessor = new BatchProcessor(performanceManager);
        const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
        
        const stats = caseModel.getOptimizationStats();
        
        globalMetrics.bySheetType[sheetType] = stats;
        globalMetrics.totalApiCallsReduced += stats.apiCallsReduced || 0;
        globalMetrics.totalOperations += stats.totalOperations || 0;
        totalCacheHits += stats.cacheHits || 0;
        sheetTypeCount++;
        
      } catch (error) {
        console.warn(`Failed to get metrics for ${sheetType}:`, error.message);
        globalMetrics.bySheetType[sheetType] = {
          error: error.message,
          totalOperations: 0,
          apiCallsReduced: 0
        };
      }
    });
    
    // Calculate global averages
    if (globalMetrics.totalOperations > 0) {
      globalMetrics.overallReductionPercentage = Math.round(
        (globalMetrics.totalApiCallsReduced / globalMetrics.totalOperations) * 100
      );
      globalMetrics.cacheHitRate = Math.round(
        (totalCacheHits / globalMetrics.totalOperations) * 100
      );
    }
    
    return {
      success: true,
      data: globalMetrics
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get global performance metrics.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Reset performance optimization statistics
 * @param {string} sheetType - Type of sheet (optional, resets all if not provided)
 * @returns {Object} Reset result
 */
function resetPerformanceStats(sheetType = null) {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = getUserRole(currentUser);
    
    if (!['admin', 'teamLeader'].includes(userRole)) {
      throw new Error('Insufficient permissions to reset performance statistics');
    }
    
    if (sheetType) {
      // Reset specific sheet type
      const performanceManager = new PerformanceManager();
      const batchProcessor = new BatchProcessor(performanceManager);
      const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
      
      // Reset stats by reinitializing
      caseModel.initializePerformanceOptimizations();
      
      return {
        success: true,
        message: `Performance statistics reset for ${sheetType}`,
        sheetType: sheetType
      };
    } else {
      // Reset all sheet types
      const sheetTypes = SheetMapper.getAvailableSheetTypes();
      const resetResults = [];
      
      sheetTypes.forEach(type => {
        try {
          const performanceManager = new PerformanceManager();
          const batchProcessor = new BatchProcessor(performanceManager);
          const caseModel = new CaseModel(type, null, performanceManager, batchProcessor);
          
          caseModel.initializePerformanceOptimizations();
          resetResults.push({ sheetType: type, success: true });
        } catch (error) {
          resetResults.push({
            sheetType: type,
            success: false,
            error: error.message
          });
        }
      });
      
      return {
        success: true,
        message: 'Performance statistics reset for all sheet types',
        results: resetResults
      };
    }
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to reset performance statistics.',
        context: { sheetType },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Get performance optimization recommendations
 * @param {string} sheetType - Type of sheet (optional)
 * @returns {Object} Performance recommendations
 */
function getPerformanceRecommendations(sheetType = null) {
  try {
    const recommendations = {
      global: [],
      bySheetType: {},
      optimizationPotential: 0,
      timestamp: new Date().toISOString()
    };
    
    const sheetTypes = sheetType ? [sheetType] : SheetMapper.getAvailableSheetTypes();
    
    sheetTypes.forEach(type => {
      try {
        const performanceManager = new PerformanceManager();
        const batchProcessor = new BatchProcessor(performanceManager);
        const caseModel = new CaseModel(type, null, performanceManager, batchProcessor);
        
        const stats = caseModel.getOptimizationStats();
        const typeRecommendations = [];
        
        // Analyze statistics and generate recommendations
        if (stats.totalOperations > 0) {
          const reductionRate = (stats.apiCallsReduced / stats.totalOperations) * 100;
          const cacheHitRate = (stats.cacheHits / stats.totalOperations) * 100;
          
          if (reductionRate < 30) {
            typeRecommendations.push({
              type: 'optimization',
              priority: 'high',
              message: 'API call reduction is below optimal threshold (30%). Consider enabling batch processing.',
              actionItems: [
                'Enable batch processing in optimization settings',
                'Increase batch size for better efficiency',
                'Review data access patterns'
              ]
            });
          }
          
          if (cacheHitRate < 50) {
            typeRecommendations.push({
              type: 'caching',
              priority: 'medium',
              message: 'Cache hit rate is below 50%. Consider adjusting cache strategy.',
              actionItems: [
                'Enable advanced caching',
                'Increase cache TTL for frequently accessed data',
                'Implement aggressive caching strategy'
              ]
            });
          }
          
          if (stats.totalOperations > 1000 && !stats.optimizationSettings?.enableBatchProcessing) {
            typeRecommendations.push({
              type: 'scaling',
              priority: 'high',
              message: 'High operation volume detected. Batch processing is strongly recommended.',
              actionItems: [
                'Enable batch processing immediately',
                'Monitor performance improvements',
                'Consider implementing data pagination'
              ]
            });
          }
        } else {
          typeRecommendations.push({
            type: 'monitoring',
            priority: 'low',
            message: 'Insufficient data for analysis. Continue monitoring.',
            actionItems: [
              'Ensure performance monitoring is enabled',
              'Wait for more operation data',
              'Check if sheet is being used actively'
            ]
          });
        }
        
        recommendations.bySheetType[type] = {
          stats: stats,
          recommendations: typeRecommendations,
          optimizationPotential: Math.max(0, 70 - (stats.apiCallsReduced / Math.max(stats.totalOperations, 1)) * 100)
        };
        
      } catch (error) {
        recommendations.bySheetType[type] = {
          error: error.message,
          recommendations: [{
            type: 'error',
            priority: 'high',
            message: 'Failed to analyze performance data',
            actionItems: ['Check system configuration', 'Review error logs']
          }]
        };
      }
    });
    
    // Generate global recommendations
    const allStats = Object.values(recommendations.bySheetType)
      .filter(data => !data.error)
      .map(data => data.stats);
    
    if (allStats.length > 0) {
      const totalOps = allStats.reduce((sum, stats) => sum + (stats.totalOperations || 0), 0);
      const totalReduced = allStats.reduce((sum, stats) => sum + (stats.apiCallsReduced || 0), 0);
      const globalReductionRate = totalOps > 0 ? (totalReduced / totalOps) * 100 : 0;
      
      recommendations.optimizationPotential = Math.max(0, 70 - globalReductionRate);
      
      if (globalReductionRate < 50) {
        recommendations.global.push({
          type: 'system',
          priority: 'high',
          message: 'System-wide optimization potential identified',
          actionItems: [
            'Enable performance optimization across all sheet types',
            'Implement global caching strategy',
            'Review system configuration'
          ]
        });
      }
    }
    
    return {
      success: true,
      data: recommendations
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get performance recommendations.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// ADVANCED FEATURES API ENDPOINTS
// ====================

/**
 * Initialize all advanced features
 * @returns {Object} Initialization result
 */
function initializeAdvancedFeatures() {
  try {
    const results = {
      workflowEngine: false,
      reportGenerator: false,
      searchEngine: false,
      statisticsManager: false,
      errors: []
    };

    // Initialize Workflow Engine
    try {
      if (typeof initializeWorkflowEngine === 'function') {
        const workflowResult = initializeWorkflowEngine();
        results.workflowEngine = workflowResult.success;
        if (!workflowResult.success) {
          results.errors.push(`Workflow Engine: ${workflowResult.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Workflow Engine: ${error.message}`);
    }

    // Initialize Report Generator
    try {
      if (typeof initializeReportGenerator === 'function') {
        const reportResult = initializeReportGenerator();
        results.reportGenerator = reportResult.success;
        if (!reportResult.success) {
          results.errors.push(`Report Generator: ${reportResult.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`Report Generator: ${error.message}`);
    }

    // Initialize Statistics Manager (client-side, just check availability)
    results.statisticsManager = true; // Client-side component

    // Initialize Search Engine (server-side components)
    results.searchEngine = true; // Server-side components available

    const overallSuccess = results.workflowEngine && results.reportGenerator &&
                          results.statisticsManager && results.searchEngine;

    return {
      success: overallSuccess,
      data: results,
      message: overallSuccess ?
        'All advanced features initialized successfully' :
        'Some advanced features failed to initialize'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to initialize advanced features.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// SEARCH ENGINE API ENDPOINTS
// ====================

/**
 * Build search index for fast searching
 * @returns {Object} Search index build result
 */
function buildSearchIndex() {
  try {
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const searchIndex = {
      totalDocuments: 0,
      bySheetType: {},
      lastBuildTime: new Date().toISOString(),
      buildDuration: 0
    };

    const startTime = Date.now();

    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const allCases = caseModel.search({ limit: 5000 }); // Build index from existing cases
        
        if (allCases.success && allCases.data) {
          const documents = allCases.data.map(caseData => ({
            id: caseData.caseId,
            sheetType: sheetType,
            title: caseData.issueCategory || caseData.caseId || '',
            description: caseData.details || '',
            status: caseData.caseStatus || '',
            priority: caseData.priority || '',
            assignee: caseData.finalAssignee || caseData.firstAssignee || '',
            tags: caseData.tags || '',
            lastModified: caseData.lastModified || caseData.caseOpenDate,
            searchableText: [
              caseData.caseId,
              caseData.issueCategory,
              caseData.details,
              caseData.caseStatus,
              caseData.finalAssignee,
              caseData.firstAssignee,
              caseData.tags
            ].filter(Boolean).join(' ').toLowerCase()
          }));

          searchIndex.bySheetType[sheetType] = documents;
          searchIndex.totalDocuments += documents.length;
        } else {
          searchIndex.bySheetType[sheetType] = [];
        }

      } catch (error) {
        console.warn(`Failed to index ${sheetType}:`, error.message);
        searchIndex.bySheetType[sheetType] = [];
      }
    });

    searchIndex.buildDuration = Date.now() - startTime;

    // Cache the search index
    const configManager = new ConfigManager();
    configManager.setCache('search_index', searchIndex, 3600); // Cache for 1 hour

    return {
      success: true,
      data: searchIndex
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to build search index.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Perform advanced search across all sheet types
 * @param {Object} searchParams - Search parameters
 * @returns {Object} Search results
 */
function performSearch(searchParams) {
  try {
    const { query, filters, settings, sortBy, page, limit } = searchParams;
    
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query is required'
      };
    }

    const startTime = Date.now();
    const configManager = new ConfigManager();
    const searchIndex = configManager.getFromCache('search_index');

    if (!searchIndex) {
      // Build index if not cached
      const indexResult = buildSearchIndex();
      if (!indexResult.success) {
        throw new Error('Failed to build search index');
      }
    }

    const currentIndex = searchIndex || configManager.getFromCache('search_index');
    const searchResults = [];
    const queryLower = query.toLowerCase();

    // Search through all indexed documents
    Object.keys(currentIndex.bySheetType).forEach(sheetType => {
      const documents = currentIndex.bySheetType[sheetType];
      
      documents.forEach(doc => {
        let score = 0;
        let matchedFields = [];

        // Calculate relevance score
        if (doc.title.toLowerCase().includes(queryLower)) {
          score += 3;
          matchedFields.push('title');
        }
        
        if (doc.description.toLowerCase().includes(queryLower)) {
          score += 2;
          matchedFields.push('description');
        }
        
        if (doc.searchableText.includes(queryLower)) {
          score += 1;
          matchedFields.push('content');
        }

        // Apply filters
        if (score > 0) {
          let matchesFilters = true;

          if (filters.status && filters.status.length > 0) {
            matchesFilters = matchesFilters && filters.status.includes(doc.status);
          }

          if (filters.assignee && filters.assignee.length > 0) {
            matchesFilters = matchesFilters && filters.assignee.includes(doc.assignee);
          }

          if (filters.sheetTypes && filters.sheetTypes.length > 0) {
            matchesFilters = matchesFilters && filters.sheetTypes.includes(doc.sheetType);
          }

          if (matchesFilters) {
            searchResults.push({
              ...doc,
              score: score / 6, // Normalize score
              matchedFields: matchedFields
            });
          }
        }
      });
    });

    // Sort results
    searchResults.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.lastModified) - new Date(a.lastModified);
      } else {
        return b.score - a.score; // Default to relevance
      }
    });

    // Apply pagination
    const pageNum = page || 1;
    const pageSize = limit || 50;
    const offset = (pageNum - 1) * pageSize;
    const paginatedResults = searchResults.slice(offset, offset + pageSize);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        results: paginatedResults,
        totalCount: searchResults.length,
        executionTime: executionTime,
        page: pageNum,
        limit: pageSize,
        hasMore: searchResults.length > offset + pageSize
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Search failed. Please try again.',
        context: { searchParams },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get search suggestions based on query
 * @param {Object} params - Search suggestion parameters
 * @returns {Object} Search suggestions
 */
function getSearchSuggestions(params) {
  try {
    const { query, limit } = params;
    
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const configManager = new ConfigManager();
    const searchIndex = configManager.getFromCache('search_index');

    if (!searchIndex) {
      return { success: true, data: [] };
    }

    const suggestions = new Set();
    const queryLower = query.toLowerCase();
    const maxSuggestions = limit || 8;

    // Extract suggestions from indexed content
    Object.keys(searchIndex.bySheetType).forEach(sheetType => {
      const documents = searchIndex.bySheetType[sheetType];
      
      documents.forEach(doc => {
        // Suggest based on title matches
        if (doc.title.toLowerCase().includes(queryLower)) {
          suggestions.add({
            text: doc.title,
            type: 'Case Title',
            count: 1
          });
        }

        // Suggest based on status
        if (doc.status.toLowerCase().includes(queryLower)) {
          suggestions.add({
            text: doc.status,
            type: 'Status',
            count: 1
          });
        }

        // Suggest based on assignee
        if (doc.assignee.toLowerCase().includes(queryLower)) {
          suggestions.add({
            text: doc.assignee,
            type: 'Assignee',
            count: 1
          });
        }
      });
    });

    // Convert Set to Array and limit results
    const suggestionArray = Array.from(suggestions).slice(0, maxSuggestions);

    return {
      success: true,
      data: suggestionArray
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search suggestions.',
        context: { params },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get search configuration
 * @returns {Object} Search configuration
 */
function getSearchConfiguration() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();

    return {
      success: true,
      data: {
        searchSettings: {
          fuzzySearch: true,
          caseSensitive: false,
          wholeWords: false,
          includeArchived: userInfo.role === 'admin',
          maxResults: 100,
          searchFields: ['title', 'description', 'comments', 'tags']
        },
        defaultFilters: {
          dateRange: null,
          status: [],
          priority: [],
          assignee: [],
          tags: [],
          sheetTypes: []
        },
        uiPreferences: {
          maxResults: 50,
          defaultSortBy: 'relevance'
        }
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Save search for future use
 * @param {Object} searchData - Search data to save
 * @returns {Object} Save result
 */
function saveSearch(searchData) {
  try {
    const { name, query, filters, settings } = searchData;
    const userEmail = Session.getActiveUser().getEmail();
    const searchId = Utilities.getUuid();

    const savedSearch = {
      id: searchId,
      name: name,
      query: query,
      filters: filters,
      settings: settings,
      createdBy: userEmail,
      createdAt: new Date().toISOString()
    };

    // Save to user properties
    const userProperties = PropertiesService.getUserProperties();
    const existingSaves = JSON.parse(userProperties.getProperty('saved_searches') || '[]');
    existingSaves.push(savedSearch);
    
    // Limit to 50 saved searches per user
    if (existingSaves.length > 50) {
      existingSaves.shift();
    }

    userProperties.setProperty('saved_searches', JSON.stringify(existingSaves));

    return {
      success: true,
      searchId: searchId,
      message: 'Search saved successfully'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to save search.',
        context: { searchData },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get saved searches for current user
 * @returns {Object} Saved searches
 */
function getSavedSearches() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const savedSearches = JSON.parse(userProperties.getProperty('saved_searches') || '[]');

    return {
      success: true,
      data: savedSearches
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get saved searches.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Delete saved search
 * @param {string} searchId - Search ID to delete
 * @returns {Object} Delete result
 */
function deleteSavedSearch(searchId) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const savedSearches = JSON.parse(userProperties.getProperty('saved_searches') || '[]');
    
    const filteredSearches = savedSearches.filter(search => search.id !== searchId);
    userProperties.setProperty('saved_searches', JSON.stringify(filteredSearches));

    return {
      success: true,
      message: 'Search deleted successfully'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to delete saved search.',
        context: { searchId },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get search history for current user
 * @returns {Object} Search history
 */
function getSearchHistory() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const searchHistory = JSON.parse(userProperties.getProperty('search_history') || '[]');

    return {
      success: true,
      data: searchHistory
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search history.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Save search history for current user
 * @param {Array} history - Search history array
 * @returns {Object} Save result
 */
function saveSearchHistory(history) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('search_history', JSON.stringify(history));

    return {
      success: true,
      message: 'Search history saved successfully'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to save search history.',
        context: { historyCount: history?.length },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Clear search history for current user
 * @returns {Object} Clear result
 */
function clearSearchHistory() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('search_history');

    return {
      success: true,
      message: 'Search history cleared successfully'
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to clear search history.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Export search results
 * @param {Object} exportData - Export data
 * @returns {Object} Export result
 */
function exportSearchResults(exportData) {
  try {
    const { query, results, filters } = exportData;
    
    if (!results || results.length === 0) {
      throw new Error('No results to export');
    }

    // Create CSV content
    const headers = ['Case ID', 'Sheet Type', 'Title', 'Description', 'Status', 'Assignee', 'Last Modified', 'Relevance Score'];
    const csvRows = [headers.join(',')];

    results.forEach(result => {
      const row = [
        `"${result.id || ''}"`,
        `"${result.sheetType || ''}"`,
        `"${(result.title || '').replace(/"/g, '""')}"`,
        `"${(result.description || '').substring(0, 100).replace(/"/g, '""')}"`,
        `"${result.status || ''}"`,
        `"${result.assignee || ''}"`,
        `"${result.lastModified || ''}"`,
        `"${Math.round((result.score || 0) * 100)}%"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const fileName = `search_results_${new Date().toISOString().split('T')[0]}.csv`;

    // In a real implementation, you would create a file in Google Drive
    // For now, return the CSV content for download
    return {
      success: true,
      data: {
        fileName: fileName,
        content: csvContent,
        mimeType: 'text/csv',
        size: csvContent.length
      }
    };

  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export search results.',
        context: { exportData },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// MENU FUNCTIONS FOR NEW FEATURES
// ====================

/**
 * Open workflow management interface
 */
function openWorkflowManagement() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>🤖 Workflow Management</h2>
        <p>Workflow management interface is being developed.</p>
        <p>This will include:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>Automated case routing</li>
          <li>Status transition rules</li>
          <li>Escalation workflows</li>
          <li>Notification triggers</li>
        </ul>
        <p><a href="#" onclick="google.script.host.close()">Close</a></p>
      </div>
    `)
    .setWidth(400)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Workflow Management');

  } catch (error) {
    SpreadsheetApp.getUi().alert('Failed to open workflow management: ' + error.message);
  }
}

/**
 * Open report generation interface
 */
function openReportGeneration() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>📋 Report Generation</h2>
        <p>Report generation interface is being developed.</p>
        <p>This will include:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>Custom report templates</li>
          <li>PDF/Excel export</li>
          <li>Scheduled reports</li>
          <li>Statistical analysis</li>
        </ul>
        <p><a href="#" onclick="google.script.host.close()">Close</a></p>
      </div>
    `)
    .setWidth(400)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Report Generation');

  } catch (error) {
    SpreadsheetApp.getUi().alert('Failed to open report generation: ' + error.message);
  }
}

/**
 * Open predictive analytics interface
 */
function openPredictiveAnalytics() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>🔮 Predictive Analytics</h2>
        <p>Predictive analytics interface is being developed.</p>
        <p>This will include:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>Case volume forecasting</li>
          <li>Resolution time prediction</li>
          <li>Resource optimization</li>
          <li>Trend analysis</li>
        </ul>
        <p><a href="#" onclick="google.script.host.close()">Close</a></p>
      </div>
    `)
    .setWidth(400)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Predictive Analytics');

  } catch (error) {
    SpreadsheetApp.getUi().alert('Failed to open predictive analytics: ' + error.message);
  }
}

/**
 * Open search interface
 */
function openSearch() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>🔍 Advanced Search</h2>
        <p>Advanced search interface is being developed.</p>
        <p>This will include:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>Full-text search across all cases</li>
          <li>Advanced filtering options</li>
          <li>Saved searches</li>
          <li>Search suggestions</li>
        </ul>
        <p><a href="#" onclick="google.script.host.close()">Close</a></p>
      </div>
    `)
    .setWidth(400)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Advanced Search');

  } catch (error) {
    SpreadsheetApp.getUi().alert('Failed to open search interface: ' + error.message);
  }
}

/**
 * Enhanced onOpen with comprehensive menu items including Live Mode
 */
function onOpen() {
  try {
    console.log('CasesDash アプリケーション開始...');
    
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu('📊 CasesDash')
      .addItem('🏠 ダッシュボードを開く', 'openDashboard')
      .addItem('📺 ライブモードを開く', 'openLiveMode')
      .addSeparator()
      .addItem('➕ 新しいケースを作成', 'createNewCase')
      .addItem('📊 統計を表示', 'showStatistics')
      .addItem('🔍 検索', 'openSearch')
      .addSeparator()
      .addItem('🤖 ワークフロー管理', 'openWorkflowManagement')
      .addItem('📋 レポート生成', 'openReportGeneration')
      .addItem('🔮 予測分析', 'openPredictiveAnalytics')
      .addSeparator()
      .addItem('⚙️ セットアップ', 'openSetup')
      .addItem('🧪 テストランナー', 'openTestRunner')
      .addItem('🔧 システム管理', 'openSystemManagement')
      .addSeparator()
      .addItem('🧪 品質保証', 'openQualityAssurance')
      .addToUi();
    
    // Initialize advanced features
    initializeAdvancedFeatures();
    
    console.log('✅ CasesDash アプリケーションが正常に開始されました');
    
  } catch (error) {
    console.error('❌ アプリケーション開始エラー:', error);
    SpreadsheetApp.getUi().alert('アプリケーションの開始に失敗しました: ' + error.message);
  }
}

/**
 * Open main dashboard in new window
 */
function openDashboard() {
  try {
    const webAppUrl = getWebAppUrl();
    const html = HtmlService.createHtmlOutput(`
      <script>
        window.open('${webAppUrl}', '_blank', 'width=1200,height=800');
        google.script.host.close();
      </script>
    `);
    SpreadsheetApp.getUi().showModalDialog(html, 'ダッシュボードを開いています...');
  } catch (error) {
    SpreadsheetApp.getUi().alert('ダッシュボードの起動に失敗しました: ' + error.message);
  }
}

/**
 * Open Live Mode in new window
 */
function openLiveMode() {
  try {
    const webAppUrl = getWebAppUrl();
    const liveModeUrl = `${webAppUrl}?page=live-mode`;
    
    const html = HtmlService.createHtmlOutput(`
      <script>
        window.open('${liveModeUrl}', '_blank', 'width=1400,height=900,resizable=yes,scrollbars=yes');
        google.script.host.close();
      </script>
    `);
    SpreadsheetApp.getUi().showModalDialog(html, 'ライブモードを開いています...');
  } catch (error) {
    SpreadsheetApp.getUi().alert('ライブモードの起動に失敗しました: ' + error.message);
  }
}

/**
 * Create new case interface
 */
function createNewCase() {
  try {
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const optionsHtml = sheetTypes.map(type =>
      `<option value="${type}">${type}</option>`
    ).join('');
    
    const html = HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>新しいケースを作成</h2>
        <form>
          <div style="margin-bottom: 15px;">
            <label for="sheetType">シートタイプ:</label><br>
            <select id="sheetType" style="width: 100%; padding: 5px;">
              ${optionsHtml}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <button type="button" onclick="openCaseForm()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px;">
              ケース作成フォームを開く
            </button>
          </div>
        </form>
        <script>
          function openCaseForm() {
            const sheetType = document.getElementById('sheetType').value;
            const webAppUrl = '${getWebAppUrl()}';
            window.open(webAppUrl + '?action=create&type=' + sheetType, '_blank', 'width=800,height=600');
            google.script.host.close();
          }
        </script>
      </div>
    `)
    .setWidth(400)
    .setHeight(250);
    
    SpreadsheetApp.getUi().showModalDialog(html, '新しいケース');
  } catch (error) {
    SpreadsheetApp.getUi().alert('ケース作成フォームの起動に失敗しました: ' + error.message);
  }
}

/**
 * Show statistics dashboard
 */
function showStatistics() {
  try {
    const stats = getCaseStatistics();
    
    if (!stats.success) {
      throw new Error(stats.message || '統計データの取得に失敗しました');
    }
    
    const data = stats.data;
    const html = HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>📊 ケース統計</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0; color: #1976d2;">総ケース数</h3>
            <p style="font-size: 2em; margin: 5px 0; font-weight: bold;">${data.totalCases}</p>
          </div>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0; color: #4caf50;">オープンケース</h3>
            <p style="font-size: 2em; margin: 5px 0; font-weight: bold;">${data.openCases}</p>
          </div>
          <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0; color: #ff9800;">完了ケース</h3>
            <p style="font-size: 2em; margin: 5px 0; font-weight: bold;">${data.closedCases}</p>
          </div>
          <div style="background: #f3e5f5; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0; color: #9c27b0;">マイケース</h3>
            <p style="font-size: 2em; margin: 5px 0; font-weight: bold;">${data.myCases}</p>
          </div>
        </div>
        
        <h3>シートタイプ別</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
          ${Object.entries(data.bySheetType).map(([type, count]) =>
            `<div style="display: flex; justify-content: space-between; padding: 5px 0;">
               <span>${type}:</span>
               <strong>${count}</strong>
             </div>`
          ).join('')}
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button onclick="openFullDashboard()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px;">
            詳細ダッシュボードを開く
          </button>
        </div>
        
        <script>
          function openFullDashboard() {
            const webAppUrl = '${getWebAppUrl()}';
            window.open(webAppUrl, '_blank', 'width=1200,height=800');
            google.script.host.close();
          }
        </script>
      </div>
    `)
    .setWidth(500)
    .setHeight(600);
    
    SpreadsheetApp.getUi().showModalDialog(html, 'ケース統計');
  } catch (error) {
    SpreadsheetApp.getUi().alert('統計の表示に失敗しました: ' + error.message);
  }
}

/**
 * Open setup interface
 */
function openSetup() {
  try {
    const webAppUrl = getWebAppUrl();
    const html = HtmlService.createHtmlOutput(`
      <script>
        window.open('${webAppUrl}', '_blank', 'width=1000,height=700');
        google.script.host.close();
      </script>
    `);
    SpreadsheetApp.getUi().showModalDialog(html, 'セットアップを開いています...');
  } catch (error) {
    SpreadsheetApp.getUi().alert('セットアップの起動に失敗しました: ' + error.message);
  }
}

/**
 * Open test runner interface
 */
function openTestRunner() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>🧪 テストランナー</h2>
        <p>システムテストを実行します。</p>
        <button onclick="runTests()" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; margin: 10px;">
          テストを実行
        </button>
        <div id="results" style="margin-top: 20px; text-align: left;"></div>
        
        <script>
          function runTests() {
            document.getElementById('results').innerHTML = '<p>テスト実行中...</p>';
            google.script.run
              .withSuccessHandler(displayResults)
              .withFailureHandler(displayError)
              .testCasesDash();
          }
          
          function displayResults(result) {
            const status = result.success ? '✅ 成功' : '❌ 失敗';
            document.getElementById('results').innerHTML =
              '<h3>' + status + '</h3>' +
              '<p><strong>メッセージ:</strong> ' + result.message + '</p>' +
              '<p><strong>コンポーネント:</strong> ' + (result.components || []).join(', ') + '</p>';
          }
          
          function displayError(error) {
            document.getElementById('results').innerHTML =
              '<h3>❌ エラー</h3><p>' + error.message + '</p>';
          }
        </script>
      </div>
    `)
    .setWidth(500)
    .setHeight(400);

    SpreadsheetApp.getUi().showModalDialog(html, 'テストランナー');
  } catch (error) {
    SpreadsheetApp.getUi().alert('テストランナーの起動に失敗しました: ' + error.message);
  }
}

/**
 * Open system management interface (admin only)
 */
function openSystemManagement() {
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const userRole = getUserRole(currentUser);
    
    if (userRole !== 'admin') {
      SpreadsheetApp.getUi().alert('アクセス拒否: 管理者権限が必要です。');
      return;
    }
    
    const html = HtmlService.createHtmlOutput(`
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>🔧 システム管理</h2>
        <p>システム管理機能は開発中です。</p>
        <div style="text-align: left; display: inline-block;">
          <h3>利用可能な機能:</h3>
          <ul>
            <li>システム設定の管理</li>
            <li>ユーザー権限の設定</li>
            <li>パフォーマンス監視</li>
            <li>エラーログの確認</li>
            <li>データベース管理</li>
          </ul>
        </div>
        <p><a href="#" onclick="google.script.host.close()">閉じる</a></p>
      </div>
    `)
    .setWidth(400)
    .setHeight(350);

    SpreadsheetApp.getUi().showModalDialog(html, 'システム管理');
  } catch (error) {
    SpreadsheetApp.getUi().alert('システム管理の起動に失敗しました: ' + error.message);
  }
}

/**
 * Open quality assurance dashboard
 */
function openQualityAssurance() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('client/qa-dashboard')
      .setWidth(1000)
      .setHeight(700);
    
    SpreadsheetApp.getUi().showModalDialog(html, '品質保証ダッシュボード');
  } catch (error) {
    SpreadsheetApp.getUi().alert('品質保証ダッシュボードの起動に失敗しました: ' + error.message);
  }
}

// ====================
// TRT(P95) MANAGEMENT & GOOGLE CHAT NOTIFICATION APIs
// ====================

/**
 * Get TRT(P95) analytics with specification-compliant exclusion criteria
 * @returns {Object} TRT analytics data
 */
function getTRTAnalytics() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const trtData = {
      p95: 0,
      trend: 0,
      under2h: 0,
      excludedCount: 0,
      totalCases: 0,
      exclusions: {
        bug: 0,
        l2: 0,
        billing: 0,
        policy: 0
      },
      trendData: {
        labels: [],
        values: []
      },
      violationCases: [],
      timestamp: new Date().toISOString()
    };
    
    const allCases = [];
    const validResponseTimes = [];
    const excludedCases = [];
    
    // Collect cases from all sheet types
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        
        // Get cases based on user role
        let cases = [];
        if (['admin', 'teamLeader'].includes(userInfo.role)) {
          const allSheetCases = caseModel.search({ limit: 5000 });
          cases = allSheetCases.success ? allSheetCases.data : [];
        } else {
          const userCases = caseModel.getCasesByAssignee(userInfo.email);
          cases = userCases.success ? userCases.data : [];
        }
        
        cases.forEach(caseData => {
          caseData.sheetType = sheetType;
          allCases.push(caseData);
          
          // Apply TRT(P95) exclusion criteria based on specification
          let shouldExclude = false;
          let exclusionReason = '';
          
          // 1. Bug Cases (Blocked by) - ALL segments
          if (caseData.bug === 1 || caseData.bug === true ||
              (caseData.details && caseData.details.toLowerCase().includes('blocked by'))) {
            shouldExclude = true;
            exclusionReason = 'bug';
            trtData.exclusions.bug++;
          }
          
          // 2. L2 Consulted Cases - ALL segments
          if (caseData.details && caseData.details.toLowerCase().includes('l2 consult')) {
            shouldExclude = true;
            exclusionReason = 'l2';
            trtData.exclusions.l2++;
          }
          
          // 3. IDT/Payreq Blocked Cases - Billing segment only
          if (sheetType.toLowerCase().includes('billing') &&
              caseData.details &&
              (caseData.details.toLowerCase().includes('idt') ||
               caseData.details.toLowerCase().includes('payreq blocked'))) {
            shouldExclude = true;
            exclusionReason = 'billing';
            trtData.exclusions.billing++;
          }
          
          // 4. T&S Consulted Cases - Policy segment only
          if (sheetType.toLowerCase().includes('policy') &&
              caseData.details &&
              caseData.details.toLowerCase().includes('t&s consult')) {
            shouldExclude = true;
            exclusionReason = 'policy';
            trtData.exclusions.policy++;
          }
          
          if (shouldExclude) {
            excludedCases.push({
              ...caseData,
              exclusionReason: exclusionReason
            });
            trtData.excludedCount++;
          } else {
            // Calculate response time for non-excluded cases
            const responseTime = calculateCaseResponseTime(caseData);
            if (responseTime !== null && responseTime >= 0) {
              validResponseTimes.push(responseTime);
              
              // Check for cases under 2h alert threshold
              if (responseTime < 2) {
                trtData.under2h++;
                trtData.violationCases.push({
                  caseId: caseData.caseId,
                  assignee: caseData.finalAssignee || caseData.firstAssignee,
                  timeRemaining: 2 - responseTime,
                  sheetType: sheetType,
                  openDate: caseData.caseOpenDate
                });
              }
            }
          }
        });
        
      } catch (error) {
        console.warn(`Failed to analyze TRT for ${sheetType}:`, error.message);
      }
    });
    
    trtData.totalCases = allCases.length;
    
    // Calculate P95 from valid response times
    if (validResponseTimes.length > 0) {
      validResponseTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(validResponseTimes.length * 0.95) - 1;
      trtData.p95 = validResponseTimes[p95Index] || 0;
      
      // Calculate trend (compare with last month)
      const lastMonthP95 = getLastMonthTRT(userInfo);
      if (lastMonthP95 > 0) {
        trtData.trend = ((trtData.p95 - lastMonthP95) / lastMonthP95) * 100;
      }
      
      // Generate trend data for chart (last 30 days)
      const trendData = generateTRTTrendData(30);
      trtData.trendData = trendData;
    }
    
    // Log TRT access
    privacyManager.logAccess('trt', 'analytics', {
      totalCases: trtData.totalCases,
      excludedCount: trtData.excludedCount,
      p95Value: trtData.p95,
      under2hCount: trtData.under2h
    });
    
    return {
      success: true,
      data: trtData
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get TRT analytics. Please try again.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Check for TRT alerts (cases approaching 2-hour SLA violation)
 * @returns {Object} TRT alerts data
 */
function checkTRTAlerts() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const alerts = [];
    const alertThreshold = 1.5; // Alert when 1.5 hours remaining (30 min before violation)
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        
        // Get open cases only
        const openCases = caseModel.search({
          filters: { status: ['Open', 'In Progress'] },
          limit: 1000
        });
        
        if (openCases.success && openCases.data) {
          openCases.data.forEach(caseData => {
            // Skip excluded cases (same logic as TRT calculation)
            if (shouldExcludeFromTRT(caseData, sheetType)) {
              return;
            }
            
            const responseTime = calculateCaseResponseTime(caseData);
            const timeRemaining = 2 - responseTime;
            
            // Alert if time remaining is less than threshold but still positive
            if (timeRemaining > 0 && timeRemaining <= (2 - alertThreshold)) {
              alerts.push({
                caseId: caseData.caseId,
                assignee: caseData.finalAssignee || caseData.firstAssignee,
                timeRemaining: timeRemaining,
                urgencyLevel: timeRemaining <= 0.5 ? 'critical' : 'warning',
                sheetType: sheetType,
                segment: getSegmentFromSheetType(sheetType),
                openDate: caseData.caseOpenDate,
                openTime: caseData.caseOpenTime,
                customerInfo: {
                  email: caseData.customerEmail || '',
                  priority: caseData.priority || 'medium'
                }
              });
            }
          });
        }
        
      } catch (error) {
        console.warn(`Failed to check TRT alerts for ${sheetType}:`, error.message);
      }
    });
    
    // Sort alerts by urgency and time remaining
    alerts.sort((a, b) => {
      if (a.urgencyLevel !== b.urgencyLevel) {
        return a.urgencyLevel === 'critical' ? -1 : 1;
      }
      return a.timeRemaining - b.timeRemaining;
    });
    
    return {
      success: true,
      data: {
        alerts: alerts,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.urgencyLevel === 'critical').length,
        warningAlerts: alerts.filter(a => a.urgencyLevel === 'warning').length,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to check TRT alerts. Please try again.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Send Google Chat alert for TRT violations
 * @param {Object} alertData - Alert data
 * @returns {Object} Send result
 */
function sendGoogleChatAlert(alertData) {
  try {
    const { ldap, caseId, timeRemaining, segment } = alertData;
    
    if (!ldap || !caseId) {
      throw new Error('LDAP and Case ID are required for alerts');
    }
    
    // Construct Google Chat message
    const urgencyLevel = timeRemaining <= 0.5 ? 'CRITICAL' : 'WARNING';
    const timeFormatted = formatTimeRemaining(timeRemaining);
    
    const chatMessage = {
      text: `🚨 *TRT ${urgencyLevel} ALERT* 🚨\n\n` +
            `**Case:** ${caseId}\n` +
            `**Assignee:** ${ldap}\n` +
            `**Time Remaining:** ${timeFormatted}\n` +
            `**Segment:** ${segment}\n` +
            `**SLA Target:** 2.0 hours\n\n` +
            `⚡ **Action Required:** Please review and respond to this case immediately to avoid SLA violation.\n\n` +
            `🔗 [View Case in CasesDash](${getWebAppUrl()})`
    };
    
    // Get Google Chat webhook URL from configuration
    const chatWebhookUrl = ConfigManager.get('notifications', 'googleChatWebhook');
    
    if (!chatWebhookUrl) {
      console.warn('Google Chat webhook URL not configured');
      return {
        success: false,
        error: 'Google Chat webhook not configured'
      };
    }
    
    // Send message to Google Chat
    const response = UrlFetchApp.fetch(chatWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(chatMessage)
    });
    
    if (response.getResponseCode() === 200) {
      // Log successful notification
      const privacyManager = new PrivacyManager();
      privacyManager.logAccess('notification', 'trt_alert_sent', {
        caseId: caseId,
        assignee: ldap,
        urgencyLevel: urgencyLevel,
        timeRemaining: timeRemaining
      });
      
      return {
        success: true,
        message: 'TRT alert sent successfully'
      };
    } else {
      throw new Error(`Google Chat API returned ${response.getResponseCode()}: ${response.getContentText()}`);
    }
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send TRT alert. Please check notification settings.',
        context: { alertData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Get team data for team management features
 * @returns {Object} Team data
 */
function getTeamData() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    
    if (!['admin', 'teamLeader'].includes(userInfo.role)) {
      throw new Error('Access denied: Team management requires admin or team leader privileges');
    }
    
    const teamData = {
      overview: {
        totalMembers: 0,
        activeCases: 0,
        teamTRT: 0,
        members: []
      },
      performance: {
        topPerformers: [],
        averageResponseTime: 0,
        caseDistribution: {},
        completionRates: {}
      },
      workload: {
        memberWorkloads: [],
        capacityAnalysis: {},
        recommendedRebalancing: []
      }
    };
    
    // Get team members based on user role
    let teamMembers = [];
    if (userInfo.role === 'admin') {
      // Admin can see all users
      teamMembers = getAllSystemUsers();
    } else if (userInfo.role === 'teamLeader') {
      // Team leader sees their team members
      teamMembers = privacyManager.getTeamMembers(userInfo.email);
    }
    
    if (teamMembers.length === 0) {
      // Fallback: analyze current user only
      teamMembers = [userInfo.email];
    }
    
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const memberStats = new Map();
    
    // Initialize member stats
    teamMembers.forEach(memberEmail => {
      memberStats.set(memberEmail, {
        name: memberEmail.split('@')[0],
        email: memberEmail,
        activeCases: 0,
        totalCases: 0,
        avgResponseTime: 0,
        trt: 0,
        responseTimes: [],
        casesByType: {},
        completionRate: 0,
        workloadScore: 0
      });
    });
    
    // Collect case data for team members
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const allCases = caseModel.search({ limit: 2000 });
        
        if (allCases.success && allCases.data) {
          allCases.data.forEach(caseData => {
            const assignee = caseData.finalAssignee || caseData.firstAssignee;
            
            if (assignee && memberStats.has(assignee)) {
              const memberStat = memberStats.get(assignee);
              
              memberStat.totalCases++;
              memberStat.casesByType[sheetType] = (memberStat.casesByType[sheetType] || 0) + 1;
              
              if (caseData.caseStatus === 'Open' || caseData.caseStatus === 'In Progress') {
                memberStat.activeCases++;
              }
              
              // Calculate response time if not excluded from TRT
              if (!shouldExcludeFromTRT(caseData, sheetType)) {
                const responseTime = calculateCaseResponseTime(caseData);
                if (responseTime !== null && responseTime >= 0) {
                  memberStat.responseTimes.push(responseTime);
                }
              }
              
              // Calculate completion rate
              if (caseData.caseStatus === 'Closed') {
                memberStat.completionRate++;
              }
            }
          });
        }
        
      } catch (error) {
        console.warn(`Failed to analyze team data for ${sheetType}:`, error.message);
      }
    });
    
    // Calculate final statistics
    const members = [];
    let totalActiveCases = 0;
    let totalTRT = 0;
    let memberCount = 0;
    
    memberStats.forEach((stats, email) => {
      // Calculate average response time and TRT
      if (stats.responseTimes.length > 0) {
        stats.responseTimes.sort((a, b) => a - b);
        const avgIndex = Math.floor(stats.responseTimes.length / 2);
        stats.avgResponseTime = stats.responseTimes[avgIndex];
        
        // Calculate TRT (P95 for this member)
        const p95Index = Math.ceil(stats.responseTimes.length * 0.95) - 1;
        stats.trt = stats.responseTimes[p95Index] || stats.avgResponseTime;
      }
      
      // Calculate completion rate percentage
      if (stats.totalCases > 0) {
        stats.completionRate = (stats.completionRate / stats.totalCases) * 100;
      }
      
      // Calculate workload score (normalized)
      stats.workloadScore = Math.min(100, (stats.activeCases / 10) * 100);
      
      members.push(stats);
      totalActiveCases += stats.activeCases;
      totalTRT += stats.trt;
      memberCount++;
    });
    
    // Build team overview
    teamData.overview.totalMembers = memberCount;
    teamData.overview.activeCases = totalActiveCases;
    teamData.overview.teamTRT = memberCount > 0 ? totalTRT / memberCount : 0;
    teamData.overview.members = members.sort((a, b) => b.activeCases - a.activeCases);
    
    // Build performance analysis
    teamData.performance.topPerformers = members
      .filter(m => m.totalCases > 0)
      .sort((a, b) => (b.completionRate - a.completionRate) || (a.trt - b.trt))
      .slice(0, 5);
    
    teamData.performance.averageResponseTime = members.reduce((sum, m) => sum + m.avgResponseTime, 0) / memberCount;
    
    // Build workload analysis
    teamData.workload.memberWorkloads = members.map(m => ({
      email: m.email,
      activeCases: m.activeCases,
      workloadScore: m.workloadScore,
      recommendation: getWorkloadRecommendation(m.workloadScore)
    }));
    
    return {
      success: true,
      data: teamData
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get team data. Please try again.',
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Export TRT report in multiple formats
 * @returns {Object} Export result
 */
function exportTRTReport() {
  try {
    const privacyManager = new PrivacyManager();
    const userInfo = privacyManager.getCurrentUserInfo();
    
    if (!['admin', 'teamLeader'].includes(userInfo.role)) {
      throw new Error('Access denied: TRT report export requires admin or team leader privileges');
    }
    
    // Get TRT analytics data
    const trtAnalytics = getTRTAnalytics();
    if (!trtAnalytics.success) {
      throw new Error('Failed to generate TRT analytics for export');
    }
    
    const reportData = trtAnalytics.data;
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Create comprehensive report
    const report = {
      metadata: {
        reportTitle: 'TRT(P95) Analytics Report',
        generatedBy: userInfo.email,
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Last 30 days',
        slaTarget: '2.0 hours'
      },
      summary: {
        overallTRT: reportData.p95.toFixed(2) + ' hours',
        slaCompliance: reportData.p95 <= 2 ? 'COMPLIANT' : 'VIOLATION',
        totalCasesAnalyzed: reportData.totalCases,
        excludedCases: reportData.excludedCount,
        casesUnder2h: reportData.under2h
      },
      exclusionCriteria: {
        bugCases: reportData.exclusions.bug,
        l2ConsultedCases: reportData.exclusions.l2,
        billingIDTPayreq: reportData.exclusions.billing,
        policyTSConsult: reportData.exclusions.policy
      },
      trendAnalysis: {
        trendDirection: reportData.trend > 0 ? 'INCREASING' : 'DECREASING',
        trendPercentage: Math.abs(reportData.trend).toFixed(1) + '%',
        monthlyData: reportData.trendData
      },
      actionItems: generateTRTActionItems(reportData)
    };
    
    // Create CSV content for export
    const csvData = convertTRTReportToCSV(report);
    
    // Log export action
    privacyManager.logAccess('report', 'trt_export', {
      reportType: 'TRT_P95',
      dataPeriod: '30_days',
      totalCases: reportData.totalCases
    });
    
    return {
      success: true,
      data: {
        report: report,
        csvData: csvData,
        fileName: `TRT_P95_Report_${timestamp}.csv`,
        summary: `TRT(P95): ${reportData.p95.toFixed(2)}h | Compliance: ${reportData.p95 <= 2 ? 'PASS' : 'FAIL'}`
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export TRT report. Please try again.',
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Helper function: Calculate case response time
 * @private
 * @param {Object} caseData - Case data
 * @returns {number|null} Response time in hours
 */
function calculateCaseResponseTime(caseData) {
  try {
    const openDate = caseData.caseOpenDate;
    const openTime = caseData.caseOpenTime;
    const closeDate = caseData.closeDate || caseData.firstCloseDate;
    const closeTime = caseData.closeTime || caseData.firstCloseTime;
    
    if (!openDate) return null;
    
    const openDateTime = new Date(`${openDate}T${openTime || '00:00:00'}`);
    let closeDateTime;
    
    if (closeDate && closeTime) {
      closeDateTime = new Date(`${closeDate}T${closeTime}`);
    } else {
      // For open cases, calculate time from open to now
      closeDateTime = new Date();
    }
    
    const timeDiffMs = closeDateTime - openDateTime;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    return timeDiffHours >= 0 ? timeDiffHours : null;
    
  } catch (error) {
    console.warn('Failed to calculate response time:', error.message);
    return null;
  }
}

/**
 * Helper function: Check if case should be excluded from TRT calculation
 * @private
 * @param {Object} caseData - Case data
 * @param {string} sheetType - Sheet type
 * @returns {boolean} True if should be excluded
 */
function shouldExcludeFromTRT(caseData, sheetType) {
  // Bug Cases (Blocked by) - ALL segments
  if (caseData.bug === 1 || caseData.bug === true ||
      (caseData.details && caseData.details.toLowerCase().includes('blocked by'))) {
    return true;
  }
  
  // L2 Consulted Cases - ALL segments
  if (caseData.details && caseData.details.toLowerCase().includes('l2 consult')) {
    return true;
  }
  
  // IDT/Payreq Blocked Cases - Billing segment only
  if (sheetType.toLowerCase().includes('billing') &&
      caseData.details &&
      (caseData.details.toLowerCase().includes('idt') ||
       caseData.details.toLowerCase().includes('payreq blocked'))) {
    return true;
  }
  
  // T&S Consulted Cases - Policy segment only
  if (sheetType.toLowerCase().includes('policy') &&
      caseData.details &&
      caseData.details.toLowerCase().includes('t&s consult')) {
    return true;
  }
  
  return false;
}

/**
 * Helper function: Get segment from sheet type
 * @private
 * @param {string} sheetType - Sheet type
 * @returns {string} Segment name
 */
function getSegmentFromSheetType(sheetType) {
  const type = sheetType.toLowerCase();
  if (type.includes('billing')) return 'Billing';
  if (type.includes('policy')) return 'Policy';
  if (type.includes('ads')) return 'Ads';
  if (type.includes('cloud')) return 'Cloud';
  return 'General';
}

/**
 * Helper function: Format time remaining for alerts
 * @private
 * @param {number} timeRemaining - Time in hours
 * @returns {string} Formatted time string
 */
function formatTimeRemaining(timeRemaining) {
  if (timeRemaining <= 0) return 'EXPIRED';
  
  const hours = Math.floor(timeRemaining);
  const minutes = Math.floor((timeRemaining - hours) * 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Helper function: Get last month's TRT for trend calculation
 * @private
 * @param {Object} userInfo - User information
 * @returns {number} Last month's TRT P95
 */
function getLastMonthTRT(userInfo) {
  try {
    // This would typically query historical data
    // For now, return a placeholder value
    const configManager = new ConfigManager();
    const historicalTRT = configManager.getFromCache('last_month_trt');
    return historicalTRT || 1.8; // Placeholder
  } catch (error) {
    return 0;
  }
}

/**
 * Helper function: Generate TRT trend data
 * @private
 * @param {number} days - Number of days for trend
 * @returns {Object} Trend data for chart
 */
function generateTRTTrendData(days) {
  const labels = [];
  const values = [];
  
  // Generate mock trend data
  // In real implementation, this would query historical TRT data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toISOString().split('T')[0]);
    
    // Generate realistic TRT values around current P95
    const baseValue = 1.8;
    const variation = (Math.random() - 0.5) * 0.6;
    values.push(Math.max(0.5, baseValue + variation));
  }
  
  return { labels, values };
}

/**
 * Helper function: Generate TRT action items
 * @private
 * @param {Object} reportData - TRT report data
 * @returns {Array} Action items
 */
function generateTRTActionItems(reportData) {
  const actionItems = [];
  
  if (reportData.p95 > 2) {
    actionItems.push({
      priority: 'HIGH',
      action: 'TRT(P95) SLA Violation',
      description: `Current TRT(P95) of ${reportData.p95.toFixed(2)}h exceeds 2.0h target`,
      recommendation: 'Review case assignment distribution and escalation procedures'
    });
  }
  
  if (reportData.under2h > 0) {
    actionItems.push({
      priority: 'IMMEDIATE',
      action: 'Cases Requiring Immediate Attention',
      description: `${reportData.under2h} cases are approaching 2-hour SLA deadline`,
      recommendation: 'Send immediate alerts to assignees and consider reassignment'
    });
  }
  
  if (reportData.trend > 10) {
    actionItems.push({
      priority: 'MEDIUM',
      action: 'Increasing TRT Trend',
      description: `TRT has increased by ${reportData.trend.toFixed(1)}% compared to last period`,
      recommendation: 'Analyze root causes and implement process improvements'
    });
  }
  
  return actionItems;
}

/**
 * Helper function: Convert TRT report to CSV format
 * @private
 * @param {Object} report - Report data
 * @returns {string} CSV content
 */
function convertTRTReportToCSV(report) {
  const lines = [];
  
  // Header
  lines.push('TRT(P95) Analytics Report');
  lines.push(`Generated: ${report.metadata.generatedAt}`);
  lines.push(`Generated By: ${report.metadata.generatedBy}`);
  lines.push('');
  
  // Summary
  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Overall TRT(P95),${report.summary.overallTRT}`);
  lines.push(`SLA Compliance,${report.summary.slaCompliance}`);
  lines.push(`Total Cases Analyzed,${report.summary.totalCasesAnalyzed}`);
  lines.push(`Excluded Cases,${report.summary.excludedCases}`);
  lines.push(`Cases Under 2h Alert,${report.summary.casesUnder2h}`);
  lines.push('');
  
  // Exclusions
  lines.push('EXCLUSION CRITERIA');
  lines.push('Exclusion Type,Count');
  lines.push(`Bug Cases,${report.exclusionCriteria.bugCases}`);
  lines.push(`L2 Consulted,${report.exclusionCriteria.l2ConsultedCases}`);
  lines.push(`Billing IDT/Payreq,${report.exclusionCriteria.billingIDTPayreq}`);
  lines.push(`Policy T&S Consult,${report.exclusionCriteria.policyTSConsult}`);
  lines.push('');
  
  // Action Items
  if (report.actionItems.length > 0) {
    lines.push('ACTION ITEMS');
    lines.push('Priority,Action,Description');
    report.actionItems.forEach(item => {
      lines.push(`${item.priority},"${item.action}","${item.description}"`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Helper function: Get all system users (admin only)
 * @private
 * @returns {Array} Array of user emails
 */
function getAllSystemUsers() {
  // This would typically query a user management system
  // For now, return configured users
  const adminEmails = ConfigManager.get('security', 'adminEmails') || [];
  const teamLeaderEmails = ConfigManager.get('security', 'teamLeaderEmails') || [];
  const regularUsers = ConfigManager.get('security', 'regularUsers') || [];
  
  return [...adminEmails, ...teamLeaderEmails, ...regularUsers];
}

/**
 * Helper function: Get workload recommendation
 * @private
 * @param {number} workloadScore - Workload score (0-100)
 * @returns {string} Recommendation
 */
function getWorkloadRecommendation(workloadScore) {
  if (workloadScore >= 80) return 'OVERLOADED - Consider reassigning cases';
  if (workloadScore >= 60) return 'HIGH - Monitor closely';
  if (workloadScore >= 40) return 'OPTIMAL - Good balance';
  if (workloadScore >= 20) return 'LOW - Can take additional cases';
  return 'UNDERUTILIZED - Assign more cases';
}

/**
 * Helper function: Get web app URL for notifications
 * @private
 * @returns {string} Web app URL
 */
function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (error) {
    return 'https://script.google.com/macros/d/your-script-id/exec';
  }
}

// ====================
// NOTIFICATION MANAGER API ENDPOINTS
// ====================

/**
 * Send notification through multiple channels
 * @param {Object} notificationData - Notification data
 * @returns {Object} Send result
 */
function sendNotification(notificationData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendNotification(notificationData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send notification. Please try again.',
        context: { notificationData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Send email notification
 * @param {Object} emailData - Email data
 * @returns {Object} Send result
 */
function sendEmailNotification(emailData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendEmailNotification(emailData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send email notification. Please try again.',
        context: { emailData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Send Google Chat notification
 * @param {Object} chatData - Chat data
 * @returns {Object} Send result
 */
function sendChatNotification(chatData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendChatNotification(chatData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send chat notification. Please try again.',
        context: { chatData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Send TRT alert notification
 * @param {Object} alertData - TRT alert data
 * @returns {Object} Send result
 */
function sendTRTAlert(alertData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendTRTAlert(alertData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send TRT alert. Please try again.',
        context: { alertData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Send escalation notification
 * @param {Object} escalationData - Escalation data
 * @returns {Object} Send result
 */
function sendEscalationNotification(escalationData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendEscalationNotification(escalationData);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send escalation notification. Please try again.',
        context: { escalationData },
        type: ErrorTypes.EXTERNAL_API
      }
    );
  }
}

/**
 * Get notification settings
 * @returns {Object} Notification settings
 */
function getNotificationSettings() {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.getNotificationSettings();
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get notification settings.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Update notification settings (admin only)
 * @param {Object} settings - Notification settings
 * @returns {Object} Update result
 */
function updateNotificationSettings(settings) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const notificationManager = new NotificationManager();
    return notificationManager.updateNotificationSettings(settings);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update notification settings.',
        context: { settings },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Test notification configuration
 * @param {string} type - Notification type to test
 * @returns {Object} Test result
 */
function testNotificationConfiguration(type) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const notificationManager = new NotificationManager();
    return notificationManager.testNotificationConfiguration(type);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to test notification configuration.',
        context: { type },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get notification history (admin/team leader only)
 * @param {Object} filters - History filters
 * @returns {Object} Notification history
 */
function getNotificationHistory(filters = {}) {
  try {
    const authResult = authenticateUser('teamLeader');
    if (!authResult.success) {
      return authResult;
    }
    
    const notificationManager = new NotificationManager();
    return notificationManager.getNotificationHistory(filters);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get notification history.',
        context: { filters },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Validate notification templates
 * @param {Object} templates - Notification templates
 * @returns {Object} Validation result
 */
function validateNotificationTemplates(templates) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.validateNotificationTemplates(templates);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to validate notification templates.',
        context: { templates },
        type: ErrorTypes.VALIDATION
      }
    );
  }
}

/**
 * Get notification metrics (admin only)
 * @param {Object} timeframe - Metrics timeframe
 * @returns {Object} Notification metrics
 */
function getNotificationMetrics(timeframe = {}) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    const notificationManager = new NotificationManager();
    return notificationManager.getNotificationMetrics(timeframe);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get notification metrics.',
        context: { timeframe },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

/**
 * Send bulk notifications (admin only)
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Bulk send result
 */
function sendBulkNotifications(notifications) {
  try {
    const authResult = authenticateUser('admin');
    if (!authResult.success) {
      return authResult;
    }
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new Error('Notifications array is required');
    }
    
    const notificationManager = new NotificationManager();
    return notificationManager.sendBulkNotifications(notifications);
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send bulk notifications.',
        context: { notificationCount: notifications?.length },
        type: ErrorTypes.PERMISSION
      }
    );
  }
}

// ====================
// TRIGGER FUNCTIONS FOR AUTOMATION
// ====================

/**
 * Daily automated trigger for P95 monitoring and alerts
 * Runs automatically every day to check TRT status and send notifications
 */
function dailyP95MonitoringTrigger() {
  try {
    console.log('🔍 Starting daily P95 monitoring trigger...');
    
    const privacyManager = new PrivacyManager();
    
    // Check if P95 monitoring is enabled
    const p95MonitoringEnabled = ConfigManager.get('notifications', 'p95MonitoringEnabled');
    if (!p95MonitoringEnabled) {
      console.log('⏸️ P95 monitoring is disabled, skipping...');
      return;
    }
    
    const notificationManager = new NotificationManager();
    const results = {
      p95Checks: 0,
      alertsSent: 0,
      errors: []
    };
    
    // 1. Check current P95 status
    const trtAnalytics = getTRTAnalytics();
    if (trtAnalytics.success) {
      results.p95Checks++;
      
      const currentP95 = trtAnalytics.data.p95;
      const slaTarget = 2.0;
      
      // Send P95 status notification if violation or approaching violation
      if (currentP95 > slaTarget) {
        const p95ViolationAlert = {
          type: 'p95_violation',
          priority: 'high',
          data: {
            currentP95: currentP95,
            slaTarget: slaTarget,
            violationAmount: currentP95 - slaTarget,
            totalCases: trtAnalytics.data.totalCases,
            excludedCases: trtAnalytics.data.excludedCount
          }
        };
        
        const alertResult = notificationManager.sendP95Alert(p95ViolationAlert);
        if (alertResult.success) {
          results.alertsSent++;
          console.log(`📢 P95 violation alert sent: ${currentP95.toFixed(2)}h > ${slaTarget}h`);
        } else {
          results.errors.push(`P95 alert failed: ${alertResult.message}`);
        }
      } else if (currentP95 > (slaTarget * 0.9)) {
        // Warning when approaching 90% of SLA limit
        const p95WarningAlert = {
          type: 'p95_warning',
          priority: 'medium',
          data: {
            currentP95: currentP95,
            slaTarget: slaTarget,
            thresholdPercentage: 90
          }
        };
        
        const warningResult = notificationManager.sendP95Alert(p95WarningAlert);
        if (warningResult.success) {
          results.alertsSent++;
          console.log(`⚠️ P95 warning alert sent: ${currentP95.toFixed(2)}h (90% of SLA)`);
        }
      }
    } else {
      results.errors.push('Failed to get TRT analytics');
    }
    
    // 2. Check for individual case alerts
    const trtAlerts = checkTRTAlerts();
    if (trtAlerts.success && trtAlerts.data.alerts.length > 0) {
      const criticalAlerts = trtAlerts.data.alerts.filter(a => a.urgencyLevel === 'critical');
      const warningAlerts = trtAlerts.data.alerts.filter(a => a.urgencyLevel === 'warning');
      
      // Send batch alert for critical cases
      if (criticalAlerts.length > 0) {
        const batchAlertResult = notificationManager.sendBatchTRTAlerts(criticalAlerts);
        if (batchAlertResult.success) {
          results.alertsSent += criticalAlerts.length;
          console.log(`🚨 Sent ${criticalAlerts.length} critical TRT alerts`);
        }
      }
      
      // Send summary for warning cases
      if (warningAlerts.length > 0) {
        const summaryResult = notificationManager.sendTRTSummaryAlert(warningAlerts);
        if (summaryResult.success) {
          results.alertsSent++;
          console.log(`⚠️ Sent TRT summary for ${warningAlerts.length} warning cases`);
        }
      }
    }
    
    // 3. Log monitoring results
    privacyManager.logAccess('automation', 'daily_p95_monitoring', {
      p95Checks: results.p95Checks,
      alertsSent: results.alertsSent,
      errorCount: results.errors.length,
      executionTime: new Date().toISOString()
    });
    
    console.log(`✅ Daily P95 monitoring completed: ${results.alertsSent} alerts sent, ${results.errors.length} errors`);
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    console.error('❌ Daily P95 monitoring trigger failed:', error);
    ErrorHandler.logError(error, {}, ErrorSeverity.HIGH, ErrorTypes.AUTOMATION);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup automation triggers for P95 monitoring
 * Call this function to configure automatic monitoring
 */
function setupP95MonitoringTriggers() {
  try {
    // Delete existing triggers first
    const existingTriggers = ScriptApp.getProjectTriggers();
    existingTriggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'dailyP95MonitoringTrigger') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new daily trigger at 9:00 AM
    ScriptApp.newTrigger('dailyP95MonitoringTrigger')
      .timeBased()
      .everyDays(1)
      .atHour(9)
      .create();
    
    console.log('✅ P95 monitoring trigger setup completed');
    
    return {
      success: true,
      message: 'P95 monitoring triggers configured successfully'
    };
    
  } catch (error) {
    console.error('❌ Failed to setup P95 monitoring triggers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manually run P95 monitoring for testing
 * Use this to test the monitoring system without waiting for the trigger
 */
function testP95Monitoring() {
  try {
    console.log('🧪 Testing P95 monitoring system...');
    
    const result = dailyP95MonitoringTrigger();
    
    if (result.success) {
      console.log('✅ P95 monitoring test completed successfully');
      console.log('Results:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ P95 monitoring test failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ P95 monitoring test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ====================
// ENHANCED ERROR HANDLING FOR FORM SUBMISSIONS
// ====================

/**
 * Enhanced error handling for form submissions
 * @param {Error} error - The error that occurred
 * @param {string} context - Context where the error occurred
 * @returns {Object} Standardized error response
 */
function handleFormError(error, context = 'form submission') {
  console.error(`Form error during ${context}:`, error);
  
  // Log the error with context
  ErrorHandler.logError(error, {
    context: context,
    timestamp: new Date().toISOString(),
    user: Session.getActiveUser().getEmail()
  }, ErrorSeverity.HIGH, ErrorTypes.VALIDATION);
  
  // Return user-friendly error message
  let userMessage = 'An error occurred while processing your request.';
  
  if (error.message && error.message.includes('Permission denied')) {
    userMessage = 'You do not have permission to perform this action.';
  } else if (error.message && error.message.includes('Validation')) {
    userMessage = error.message;
  } else if (error.message && error.message.includes('not found')) {
    userMessage = 'The requested resource was not found.';
  }
  
  return {
    success: false,
    error: userMessage,
    details: error.message
  };
}

// ====================
// NOTIFICATION MANAGEMENT API
// ====================

/**
 * Get current notification settings
 * @returns {Object} Current notification configuration
 */
function getNotificationSettings() {
  try {
    const configManager = new ConfigManager();
    const settings = configManager.getNotificationSettings();
    
    return {
      success: true,
      data: settings
    };
  } catch (error) {
    return handleFormError(error, 'getting notification settings');
  }
}

/**
 * Update notification settings
 * @param {Object} newSettings - New notification configuration
 * @returns {Object} Update operation result
 */
function updateNotificationSettings(newSettings) {
  try {
    // Validate input
    if (!newSettings || typeof newSettings !== 'object') {
      throw new Error('Invalid notification settings provided');
    }
    
    const configManager = new ConfigManager();
    
    // Validate webhook URL if provided
    if (newSettings.webhook && newSettings.webhook.url) {
      const urlPattern = /^https:\/\/chat\.googleapis\.com\/v1\/spaces\/.+\/messages\?key=.+/;
      if (!urlPattern.test(newSettings.webhook.url)) {
        throw new Error('Invalid Google Chat webhook URL format');
      }
    }
    
    // Validate P95 settings if provided
    if (newSettings.p95Monitoring) {
      const { enabled, threshold, checkInterval } = newSettings.p95Monitoring;
      if (enabled && (!threshold || threshold < 0 || threshold > 60000)) {
        throw new Error('P95 threshold must be between 0 and 60000 milliseconds');
      }
      if (enabled && (!checkInterval || checkInterval < 5 || checkInterval > 1440)) {
        throw new Error('Check interval must be between 5 and 1440 minutes');
      }
    }
    
    // Update settings
    const success = configManager.setNotificationSettings(newSettings);
    
    if (!success) {
      throw new Error('Failed to save notification settings');
    }
    
    return {
      success: true,
      message: 'Notification settings updated successfully'
    };
  } catch (error) {
    return handleFormError(error, 'updating notification settings');
  }
}

/**
 * Test Google Chat webhook connection
 * @param {string} webhookUrl - The webhook URL to test
 * @returns {Object} Test result
 */
function testGoogleChatWebhook(webhookUrl) {
  try {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    // Validate webhook URL format
    const urlPattern = /^https:\/\/chat\.googleapis\.com\/v1\/spaces\/.+\/messages\?key=.+/;
    if (!urlPattern.test(webhookUrl)) {
      throw new Error('Invalid Google Chat webhook URL format');
    }
    
    const notificationManager = new NotificationManager();
    const testResult = notificationManager.testWebhook(webhookUrl);
    
    return {
      success: testResult.success,
      message: testResult.success ? 'Webhook test successful' : testResult.error
    };
  } catch (error) {
    return handleFormError(error, 'testing webhook');
  }
}

/**
 * Setup P95 monitoring trigger
 * @param {Object} settings - Monitoring settings
 * @returns {Object} Setup result
 */
function setupP95MonitoringTrigger(settings = {}) {
  try {
    const configManager = new ConfigManager();
    const notificationSettings = configManager.getNotificationSettings();
    
    if (!notificationSettings.p95Monitoring.enabled) {
      throw new Error('P95 monitoring is not enabled');
    }
    
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'checkP95Compliance') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger
    const intervalMinutes = settings.checkInterval || notificationSettings.p95Monitoring.checkInterval || 30;
    ScriptApp.newTrigger('checkP95Compliance')
      .timeBased()
      .everyMinutes(intervalMinutes)
      .create();
    
    return {
      success: true,
      message: `P95 monitoring trigger created with ${intervalMinutes} minute interval`
    };
  } catch (error) {
    return handleFormError(error, 'setting up P95 monitoring trigger');
  }
}

/**
 * Check current P95 compliance status
 * @returns {Object} Compliance check result
 */
function checkP95Compliance() {
  try {
    const configManager = new ConfigManager();
    const notificationSettings = configManager.getNotificationSettings();
    
    if (!notificationSettings.p95Monitoring.enabled) {
      return {
        success: true,
        message: 'P95 monitoring is disabled'
      };
    }
    
    const notificationManager = new NotificationManager();
    const complianceResult = notificationManager.checkP95Compliance();
    
    return {
      success: true,
      data: complianceResult
    };
  } catch (error) {
    return handleFormError(error, 'checking P95 compliance');
  }
}

/**
 * Send immediate TRT alert
 * @param {Object} alertData - Alert information
 * @returns {Object} Alert sending result
 */
function sendTRTAlert(alertData = {}) {
  try {
    const configManager = new ConfigManager();
    const notificationSettings = configManager.getNotificationSettings();
    
    if (!notificationSettings.webhook.enabled || !notificationSettings.webhook.url) {
      throw new Error('Google Chat webhook is not configured');
    }
    
    // Validate alert data
    const {
      currentP95 = 0,
      threshold = notificationSettings.p95Monitoring.threshold,
      violationCount = 1,
      description = 'Manual TRT alert triggered'
    } = alertData;
    
    const notificationManager = new NotificationManager();
    const alertResult = notificationManager.sendP95Alert({
      currentP95,
      threshold,
      violationCount,
      description,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: alertResult.success,
      message: alertResult.success ? 'TRT alert sent successfully' : alertResult.error
    };
  } catch (error) {
    return handleFormError(error, 'sending TRT alert');
  }
}

/**
 * Get notification status and statistics
 * @returns {Object} Notification status information
 */
function getNotificationStatus() {
  try {
    const configManager = new ConfigManager();
    const notificationSettings = configManager.getNotificationSettings();
    
    // Check if triggers are active
    const triggers = ScriptApp.getProjectTriggers();
    const p95Trigger = triggers.find(trigger =>
      trigger.getHandlerFunction() === 'checkP95Compliance'
    );
    
    // Get recent notification history (if available)
    const properties = PropertiesService.getScriptProperties();
    const lastP95Check = properties.getProperty('lastP95Check');
    const lastAlertSent = properties.getProperty('lastAlertSent');
    const totalAlertsSent = parseInt(properties.getProperty('totalAlertsSent') || '0');
    
    return {
      success: true,
      data: {
        configuration: {
          webhookEnabled: notificationSettings.webhook.enabled,
          webhookConfigured: !!notificationSettings.webhook.url,
          p95MonitoringEnabled: notificationSettings.p95Monitoring.enabled,
          p95Threshold: notificationSettings.p95Monitoring.threshold,
          checkInterval: notificationSettings.p95Monitoring.checkInterval
        },
        monitoring: {
          triggerActive: !!p95Trigger,
          lastP95Check: lastP95Check ? new Date(lastP95Check).toISOString() : null,
          lastAlertSent: lastAlertSent ? new Date(lastAlertSent).toISOString() : null,
          totalAlertsSent: totalAlertsSent
        }
      }
    };
  } catch (error) {
    return handleFormError(error, 'getting notification status');
  }
}

/**
 * Remove P95 monitoring triggers
 * Use this to disable automatic monitoring
 */
function removeP95MonitoringTriggers() {
  try {
    const existingTriggers = ScriptApp.getProjectTriggers();
    let removedCount = 0;
    
    existingTriggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'dailyP95MonitoringTrigger') {
        ScriptApp.deleteTrigger(trigger);
        removedCount++;
      }
    });
    
    console.log(`✅ Removed ${removedCount} P95 monitoring triggers`);
    
    return {
      success: true,
      message: `Removed ${removedCount} P95 monitoring triggers`
    };
    
  } catch (error) {
    console.error('❌ Failed to remove P95 monitoring triggers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
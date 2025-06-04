/**
 * CasesDash - Optimized Main Code File
 * Refactored and modularized version with improved structure and performance
 * 
 * This is the optimized version that leverages the modular architecture:
 * - AppRouterManager.js: Web app routing and HTML service
 * - CaseController.js: Case CRUD operations
 * - UserManager.js: Authentication and user management
 * - SystemManager.js: System configuration and administration
 * - TRTManager.js: TRT analytics and P95 monitoring
 * - SearchController.js: Advanced search functionality
 * - AutomationManager.js: Automated triggers and notifications
 * 
 * @author Roo
 * @version 2.0
 * @since 2025-05-25
 */

// ====================
// CORE ENTRY POINTS
// ====================

/**
 * Main entry point for web app - delegated to AppRouterManager
 */
function doGet(e) {
  // Call the doGet function from AppRouterManager.js
  // Since AppRouterManager.js defines its own doGet function, we need to avoid name collision
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
        <p><a href="?" style="color: #1976d2;">← Back to Main App</a></p>
      </div>
    `).setTitle('CasesDash - Error');
  }
}

/**
 * Handle POST requests - delegated to AppRouterManager
 */
function doPost(e) {
  // Call the doPost function from AppRouterManager.js
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
 * Initialize the application on first load
 */
function onInstall() {
  // Call the onInstall function from AppRouterManager.js
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
 * Menu setup for the spreadsheet
 */
function onOpen() {
  // Call the onOpen function from AppRouterManager.js
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📊 CasesDash')
      .addItem('🚀 Open Dashboard', 'openDashboard')
      .addItem('📊 Open Live Mode', 'openLiveMode')
      .addSeparator()
      .addItem('📈 Statistics', 'showStatistics')
      .addItem('🔍 Advanced Search', 'openSearch')
      .addSeparator()
      .addItem('⚙️ System Management', 'openSystemManagement')
      .addItem('🧪 Test Runner', 'openTestRunner')
      .addItem('🔧 Setup', 'openSetup')
      .addToUi();
  } catch (error) {
    console.error('Failed to create menu:', error);
  }
}

// ====================
// CASE MANAGEMENT DELEGATIONS
// ====================

/**
 * Create a new case - delegated to CaseController
 */
function createCase(sheetType, caseData, options = {}) {
  // Delegate to CaseController.js createCase function
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
 * Read a case by ID - delegated to CaseController
 */
function readCase(sheetType, caseId) {
  // Delegate to CaseController.js readCase function
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
 * Update a case - delegated to CaseController
 */
function updateCase(sheetType, caseId, updates) {
  // Delegate to CaseController.js updateCase function
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
 * Delete a case - delegated to CaseController
 */
function deleteCase(sheetType, caseId) {
  // Delegate to CaseController.js deleteCase function
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
 * Search cases - delegated to CaseController
 */
function searchCases(sheetType, criteria = {}) {
  // Delegate to CaseController.js searchCases function
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
 * Get cases by assignee - delegated to CaseController
 */
function getCasesByAssignee(sheetType, assigneeEmail = null) {
  // Delegate to CaseController.js getCasesByAssignee function
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

// ====================
// USER MANAGEMENT DELEGATIONS
// ====================

/**
 * Get current user information - delegated to UserManager
 */
function getCurrentUser() {
  // Delegate to UserManager.js getCurrentUser function
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
        ldap: userEmail.split('@')[0],
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
 * Authenticate user - delegated to UserManager
 */
function authenticateUser(requiredRole = null) {
  // Delegate to UserManager.js authenticateUser function
  try {
    const privacyManager = new PrivacyManager();
    const currentUser = Session.getActiveUser().getEmail();
    
    // Domain validation
    if (!currentUser || !currentUser.endsWith('@google.com')) {
      return {
        success: false,
        error: 'Access denied: Only @google.com accounts are allowed',
        type: 'DOMAIN_RESTRICTION'
      };
    }
    
    const userRole = getUserRole(currentUser);
    
    // Role-based access control
    if (requiredRole) {
      const roleHierarchy = { 'admin': 3, 'teamLeader': 2, 'user': 1 };
      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 1;
      
      if (userLevel < requiredLevel) {
        return {
          success: false,
          error: `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}`,
          type: 'PERMISSION_DENIED'
        };
      }
    }
    
    // Log successful authentication
    privacyManager.logAccess('authentication', 'login_success', {
      userEmail: currentUser,
      userRole: userRole,
      requiredRole: requiredRole
    });
    
    return {
      success: true,
      userEmail: currentUser,
      userRole: userRole,
      permissions: getUserPermissions(userRole)
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Authentication failed.',
        type: ErrorTypes.AUTHENTICATION
      }
    );
  }
}

/**
 * Update user settings - delegated to UserManager
 */
function updateUserSettings(settings) {
  // Delegate to UserManager.js updateUserSettings function
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
        userMessage: 'Failed to update user settings.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get user role - delegated to UserManager
 */
function getUserRole(userEmail) {
  // Delegate to UserManager.js getUserRole function
  // Role determination logic based on email patterns or stored configuration
  // This is a simplified implementation - in production, roles would be stored in a database
  
  const adminEmails = [
    // Add admin emails here
  ];
  
  const teamLeaderEmails = [
    // Add team leader emails here
  ];
  
  if (adminEmails.includes(userEmail)) {
    return 'admin';
  }
  
  if (teamLeaderEmails.includes(userEmail)) {
    return 'teamLeader';
  }
  
  // Default role for all @google.com users
  return 'user';
}

// ====================
// SYSTEM MANAGEMENT DELEGATIONS
// ====================

/**
 * Get system configuration - delegated to SystemManager
 */
function getSystemConfig() {
  // Delegate to SystemManager.js getSystemConfig function
  try {
    const systemManager = new SystemManager();
    return systemManager.getSystemConfig();
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
 * Update system configuration - delegated to SystemManager
 */
function updateSystemConfig(category, key, value) {
  // Delegate to SystemManager.js updateSystemConfig function
  try {
    const systemManager = new SystemManager();
    return systemManager.updateSystemConfig(category, key, value);
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
 * Get performance metrics - delegated to SystemManager
 */
function getPerformanceMetrics() {
  // Delegate to SystemManager.js getPerformanceMetrics function
  try {
    const systemManager = new SystemManager();
    return systemManager.getPerformanceMetrics();
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
 * Check system health - delegated to SystemManager
 */
function checkSystemHealth() {
  // Delegate to SystemManager.js checkSystemHealth function
  try {
    const systemManager = new SystemManager();
    return systemManager.checkSystemHealth();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to check system health.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// TRT MANAGEMENT DELEGATIONS
// ====================

/**
 * Get TRT analytics - delegated to TRTManager
 */
function getTRTAnalytics() {
  // Delegate to TRTManager.js getTRTAnalytics function
  try {
    const trtManager = new TRTManager();
    return trtManager.getTRTAnalytics();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get TRT analytics.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Check TRT alerts - delegated to TRTManager
 */
function checkTRTAlerts() {
  // Delegate to TRTManager.js checkTRTAlerts function
  try {
    const trtManager = new TRTManager();
    return trtManager.checkTRTAlerts();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to check TRT alerts.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Send Google Chat alert - delegated to TRTManager
 */
function sendGoogleChatAlert(alertData) {
  // Delegate to TRTManager.js sendGoogleChatAlert function
  try {
    const trtManager = new TRTManager();
    return trtManager.sendGoogleChatAlert(alertData);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send Google Chat alert.',
        type: ErrorTypes.NOTIFICATION
      }
    );
  }
}

/**
 * Get team data - delegated to TRTManager
 */
function getTeamData() {
  // Delegate to TRTManager.js getTeamData function
  try {
    const trtManager = new TRTManager();
    return trtManager.getTeamData();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get team data.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Export TRT report - delegated to TRTManager
 */
function exportTRTReport() {
  // Delegate to TRTManager.js exportTRTReport function
  try {
    const trtManager = new TRTManager();
    return trtManager.exportTRTReport();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to export TRT report.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// SEARCH DELEGATIONS
// ====================

/**
 * Perform advanced search - delegated to SearchController
 */
function performSearch(searchParams) {
  // Delegate to SearchController.js performSearch function
  try {
    const searchController = new SearchController();
    return searchController.performSearch(searchParams);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform search.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Build search index - delegated to SearchController
 */
function buildSearchIndex() {
  // Delegate to SearchController.js buildSearchIndex function
  try {
    const searchController = new SearchController();
    return searchController.buildSearchIndex();
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
 * Get search suggestions - delegated to SearchController
 */
function getSearchSuggestions(params) {
  // Delegate to SearchController.js getSearchSuggestions function
  try {
    const searchController = new SearchController();
    return searchController.getSearchSuggestions(params);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get search suggestions.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Global case search - delegated to SearchController (via CaseController)
 */
function globalCaseSearch(searchCriteria = {}) {
  // Delegate to CaseController.js globalCaseSearch function
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const globalResults = {
      totalResults: 0,
      bySheetType: {},
      combinedResults: []
    };
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const sheetResults = caseModel.search(searchCriteria);
        
        if (sheetResults.success && sheetResults.data) {
          const filteredResults = sheetResults.data.map(caseData => ({
            ...privacyManager.applySensitivityFilters(
              caseData,
              privacyManager.getUserRole(Session.getActiveUser().getEmail())
            ),
            sheetType: sheetType,
            channel: SheetMapper.create(sheetType).getChannelValue()
          }));
          
          globalResults.bySheetType[sheetType] = {
            count: filteredResults.length,
            results: filteredResults
          };
          
          globalResults.totalResults += filteredResults.length;
          globalResults.combinedResults.push(...filteredResults);
        }
      } catch (error) {
        console.warn(`Search failed for ${sheetType}:`, error.message);
        globalResults.bySheetType[sheetType] = {
          count: 0,
          results: [],
          error: error.message
        };
      }
    });
    
    // Sort combined results by relevance or last modified
    globalResults.combinedResults.sort((a, b) => {
      const dateA = new Date(a.lastModified || a.caseOpenDate || 0);
      const dateB = new Date(b.lastModified || b.caseOpenDate || 0);
      return dateB - dateA;
    });
    
    // Log global search
    privacyManager.logAccess('search', 'global_case_search', {
      criteria: searchCriteria,
      totalResults: globalResults.totalResults,
      sheetTypes: Object.keys(globalResults.bySheetType)
    });
    
    return {
      success: true,
      data: globalResults
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform global search.',
        context: { searchCriteria },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * アクティブケース（Assignedステータス）を取得
 */
function getActiveCases() {
  try {
    console.log('🔍 [DEBUG] Starting getActiveCases()...');
    
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    let allActiveCases = [];
    
    console.log('🔍 [DEBUG] Available sheet types:', sheetTypes);
    console.log('🔍 [DEBUG] Processing', sheetTypes.length, 'sheet types');
    
    sheetTypes.forEach((sheetType, index) => {
      try {
        console.log(`🔍 [DEBUG] Processing sheet ${index + 1}/${sheetTypes.length}: ${sheetType}`);
        
        const caseModel = new CaseModel(sheetType);
        console.log(`🔍 [DEBUG] CaseModel created for ${sheetType}`);
        
        const searchCriteria = {
          filters: { caseStatus: 'Assigned' },
          limit: 1000
        };
        console.log(`🔍 [DEBUG] Search criteria for ${sheetType}:`, searchCriteria);
        
        const searchResult = caseModel.search(searchCriteria);
        console.log(`🔍 [DEBUG] Search result for ${sheetType}:`, {
          success: searchResult.success,
          dataLength: searchResult.data ? searchResult.data.length : 'N/A',
          totalCount: searchResult.totalCount,
          error: searchResult.error
        });
        
        if (searchResult.success && searchResult.data) {
          console.log(`🔍 [DEBUG] Found ${searchResult.data.length} cases in ${sheetType}`);
          
          const filteredCases = searchResult.data.map(caseData => ({
            ...privacyManager.applySensitivityFilters(
              caseData,
              privacyManager.getUserRole(Session.getActiveUser().getEmail())
            ),
            sheetName: sheetType
          }));
          
          console.log(`🔍 [DEBUG] After filtering: ${filteredCases.length} cases from ${sheetType}`);
          allActiveCases.push(...filteredCases);
        } else {
          console.log(`🔍 [DEBUG] No data or search failed for ${sheetType}:`, searchResult.error || 'Unknown reason');
        }
      } catch (error) {
        console.error(`🔍 [DEBUG] Error processing ${sheetType}:`, error.message);
        console.warn(`Failed to get active cases from ${sheetType}:`, error.message);
      }
    });
    
    console.log(`🔍 [DEBUG] Final result: ${allActiveCases.length} total active cases`);
    console.log('🔍 [DEBUG] Sample cases:', allActiveCases.slice(0, 2));
    
    return {
      success: true,
      data: allActiveCases
    };
    
  } catch (error) {
    console.error('🔍 [DEBUG] getActiveCases() failed:', error);
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to load active cases.',
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * ケースの除外設定を更新
 */
function updateCaseExclusion(caseId, exclusionType, isEnabled) {
  try {
    if (!caseId || !exclusionType) {
      throw new Error('Case ID and exclusion type are required');
    }
    
    // 全シートタイプを検索してケースを特定
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    for (const sheetType of sheetTypes) {
      try {
        const caseModel = new CaseModel(sheetType);
        const caseResult = caseModel.read(caseId);
        
        if (caseResult.success && caseResult.data) {
          // ケースが見つかった、除外設定を更新
          const updates = {
            [exclusionType]: isEnabled ? '1' : '0'
          };
          
          const updateResult = caseModel.update(caseId, updates);
          
          if (updateResult.success) {
            return {
              success: true,
              message: 'Exclusion setting updated successfully'
            };
          }
        }
      } catch (error) {
        // 他のシートタイプを継続検索
        continue;
      }
    }
    
    return {
      success: false,
      error: `Case ${caseId} not found in any sheet`
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to update exclusion setting.',
        context: { caseId, exclusionType, isEnabled },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * スプレッドシート接続の詳細テスト
 */
function testDatabaseConnection() {
  try {
    const spreadsheetId = ConfigManager.getSpreadsheetId();
    
    if (!spreadsheetId) {
      return {
        success: false,
        error: 'No spreadsheet ID configured',
        details: {
          step: 'configuration_check',
          message: 'Please configure spreadsheet ID in setup'
        }
      };
    }
    
    // スプレッドシートアクセステスト
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheets = spreadsheet.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    
    // 必要シートの確認
    const requiredSheets = SheetMapper.getAvailableSheetTypes();
    const missingSheets = requiredSheets.filter(name => !sheetNames.includes(name));
    
    // サンプルデータテスト
    let testResults = {};
    for (const sheetType of requiredSheets) {
      if (sheetNames.includes(sheetType)) {
        try {
          const caseModel = new CaseModel(sheetType);
          const testRead = caseModel.search({ limit: 1 });
          testResults[sheetType] = {
            accessible: true,
            hasData: testRead.success && testRead.data && testRead.data.length > 0
          };
        } catch (error) {
          testResults[sheetType] = {
            accessible: false,
            error: error.message
          };
        }
      }
    }
    
    return {
      success: missingSheets.length === 0,
      spreadsheetInfo: {
        id: spreadsheetId,
        name: spreadsheet.getName(),
        totalSheets: sheets.length,
        availableSheets: sheetNames
      },
      validation: {
        requiredSheets: requiredSheets,
        missingSheets: missingSheets,
        testResults: testResults
      },
      recommendation: missingSheets.length > 0
        ? `Create missing sheets: ${missingSheets.join(', ')}`
        : 'All required sheets are available'
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Database connection test failed.',
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

// ====================
// AUTOMATION DELEGATIONS
// ====================

/**
 * Daily P95 monitoring trigger - delegated to AutomationManager
 */
function dailyP95MonitoringTrigger() {
  // Delegate to AutomationManager.js dailyP95MonitoringTrigger function
  try {
    const automationManager = new AutomationManager();
    return automationManager.dailyP95MonitoringTrigger();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to run daily P95 monitoring.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Setup P95 monitoring triggers - delegated to AutomationManager
 */
function setupP95MonitoringTriggers() {
  // Delegate to AutomationManager.js setupP95MonitoringTriggers function
  try {
    const automationManager = new AutomationManager();
    return automationManager.setupP95MonitoringTriggers();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to setup P95 monitoring triggers.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Test P95 monitoring - delegated to AutomationManager
 */
function testP95Monitoring() {
  // Delegate to AutomationManager.js testP95Monitoring function
  try {
    const automationManager = new AutomationManager();
    return automationManager.testP95Monitoring();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to test P95 monitoring.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Send TRT alert - delegated to AutomationManager
 */
function sendTRTAlert(alertData = {}) {
  // Delegate to AutomationManager.js sendTRTAlert function
  try {
    const automationManager = new AutomationManager();
    return automationManager.sendTRTAlert(alertData);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send TRT alert.',
        type: ErrorTypes.NOTIFICATION
      }
    );
  }
}

// ====================
// LIVE MODE DELEGATIONS
// ====================

/**
 * Initialize live mode - delegated to LiveModeManager
 */
function initializeLiveMode(windowConfig = {}) {
  try {
    const liveModeManager = new LiveModeManager();
    return liveModeManager.initializeSession(generateSessionId(), windowConfig);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to initialize live mode.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get live dashboard - delegated to LiveModeManager
 */
function getLiveDashboard(sessionId) {
  try {
    const liveModeManager = new LiveModeManager();
    return liveModeManager.getLiveDashboardData(sessionId);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get live dashboard.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// SENTIMENT MANAGEMENT DELEGATIONS
// ====================

/**
 * Get monthly sentiment score - delegated to SentimentManager
 */
function getMonthlySentimentScore(userEmail = null, year = null, month = null) {
  try {
    const sentimentManager = new SentimentManager();
    return sentimentManager.getMonthlySentimentScore(userEmail, year, month);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sentiment score.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Set monthly sentiment score - delegated to SentimentManager
 */
function setMonthlySentimentScore(userEmail = null, year = null, month = null, score, comment = '') {
  try {
    const sentimentManager = new SentimentManager();
    return sentimentManager.setMonthlySentimentScore(userEmail, year, month, score, comment);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to set sentiment score.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Get sentiment history - delegated to SentimentManager
 */
function getSentimentHistory(userEmail = null, months = 12) {
  try {
    const sentimentManager = new SentimentManager();
    return sentimentManager.getSentimentHistory(userEmail, months);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get sentiment history.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

// ====================
// NOTIFICATION MANAGEMENT DELEGATIONS
// ====================

/**
 * Send notification - delegated to NotificationManager
 */
function sendNotification(notificationData) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.sendNotification(notificationData);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send notification.',
        type: ErrorTypes.NOTIFICATION
      }
    );
  }
}

/**
 * Test notification configuration - delegated to NotificationManager
 */
function testNotificationConfiguration(type) {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.testNotificationSetup();
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to test notification configuration.',
        type: ErrorTypes.NOTIFICATION
      }
    );
  }
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Include HTML files for templating
 */
function include(filename) {
  // Delegate to AppRouterManager.js include function
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  // Delegate to UserManager.js generateSessionId function
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get available sheet types
 */
function getAvailableSheetTypes() {
  // Delegate to AppRouterManager.js getAvailableSheetTypes function
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
 * Configure spreadsheet
 */
function configureSpreadsheet(spreadsheetId) {
  // Delegate to AppRouterManager.js configureSpreadsheet function
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
 * Test spreadsheet connection
 */
function testSpreadsheetConnection(spreadsheetId, validateOnly = false) {
  // Delegate to AppRouterManager.js testSpreadsheetConnection function
  try {
    const privacyManager = new PrivacyManager();
    
    // Validate access to spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (accessError) {
      return {
        success: false,
        error: true,
        message: 'Cannot access spreadsheet. Please check the ID and permissions.',
        details: {
          errorType: 'ACCESS_DENIED',
          spreadsheetId: spreadsheetId,
          suggestions: [
            'Check if the spreadsheet ID is correct',
            'Ensure the spreadsheet is shared with this script',
            'Verify you have edit permissions on the spreadsheet'
          ]
        }
      };
    }
    
    const sheets = spreadsheet.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    const requiredSheets = SheetMapper.getAvailableSheetTypes();
    const missingSheets = requiredSheets.filter(sheetName => !sheetNames.includes(sheetName));
    
    const result = {
      success: missingSheets.length === 0,
      spreadsheetInfo: {
        id: spreadsheetId,
        name: spreadsheet.getName(),
        url: spreadsheet.getUrl(),
        totalSheets: sheets.length,
        availableSheets: sheetNames
      },
      validation: {
        requiredSheets: requiredSheets,
        missingSheets: missingSheets,
        overallValid: missingSheets.length === 0
      }
    };
    
    // Configure spreadsheet if validation passed and not validation-only
    if (result.success && !validateOnly) {
      const configResult = ConfigManager.setSpreadsheetId(spreadsheetId);
      if (configResult) {
        result.configured = true;
        privacyManager.logAccess('configuration', 'spreadsheet_configured', {
          spreadsheetId: spreadsheetId,
          sheetCount: sheets.length
        });
      }
    }
    
    return result;
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to test spreadsheet connection.',
        context: { spreadsheetId, validateOnly },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

// ====================
// LEGACY COMPATIBILITY FUNCTIONS
// ====================

/**
 * Legacy function for backward compatibility
 * Get dashboard stats - now delegated to AutomationManager
 */
function getDashboardStats() {
  // Delegate to AutomationManager.js getDashboardStats function
  try {
    const automationManager = new AutomationManager();
    return automationManager.getDashboardStats();
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
 * Legacy function for backward compatibility
 * Advanced search - now delegated to CaseController
 */
function advancedSearch(sheetType, searchParams = {}) {
  // Delegate to CaseController.js advancedSearch function
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const results = caseModel.advancedSearch(searchParams);
    
    return {
      success: true,
      data: results.data,
      metadata: results.metadata,
      facets: results.facets
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to perform advanced search. Please try again.',
        context: { sheetType, searchParams },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Batch operations - now delegated to CaseController
 */
function batchOperations(sheetType, operations) {
  // Delegate to CaseController.js batchOperations function
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('Operations array is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const results = caseModel.batchOperations(operations);
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to execute batch operations. Please try again.',
        context: { sheetType, operationCount: operations?.length },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Get UI configuration - now delegated to SystemManager
 */
function getUIConfiguration() {
  // Delegate to SystemManager.js getUIConfiguration function
  try {
    const systemManager = new SystemManager();
    return systemManager.getUIConfiguration();
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
 * Legacy function for backward compatibility
 * Get form schema - now delegated to SystemManager
 */
function getFormSchema(sheetType) {
  // Delegate to SystemManager.js getFormSchema function
  try {
    const systemManager = new SystemManager();
    return systemManager.getFormSchema(sheetType);
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get form schema.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Validate case data - now delegated to CaseController
 */
function validateCaseData(sheetType, caseData, isCreate = false) {
  // Delegate to CaseController.js validateCaseData function
  try {
    if (!sheetType || !caseData) {
      throw new Error('Sheet type and case data are required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const validation = caseModel.validateCaseData(caseData, isCreate);
    
    return {
      success: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to validate case data.',
        context: { sheetType, isCreate },
        type: ErrorTypes.VALIDATION
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Get case template - now delegated to CaseController
 */
function getCaseTemplate(sheetType) {
  // Delegate to CaseController.js getCaseTemplate function
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const mapper = SheetMapper.create(sheetType);
    if (!mapper) {
      throw new Error(`Invalid sheet type: ${sheetType}`);
    }
    
    const template = {
      sheetType: sheetType,
      metadata: {
        channel: mapper.getChannelValue(),
        requiredFields: mapper.getRequiredFields(),
        availableFields: Object.keys(mapper.columnMapping)
      },
      fields: {}
    };
    
    // Initialize template with default values
    mapper.getRequiredFields().forEach(field => {
      template.fields[field] = '';
    });
    
    // Add commonly used optional fields
    const optionalFields = ['priority', 'tags', 'details'];
    optionalFields.forEach(field => {
      if (mapper.getColumn(field)) {
        template.fields[field] = '';
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
 * Legacy function for backward compatibility
 * Get user cases - now delegated to CaseController
 */
function getUserCases(options = {}) {
  // Delegate to CaseController.js getUserCases function
  try {
    const currentUser = Session.getActiveUser().getEmail();
    const privacyManager = new PrivacyManager();
    
    const userCases = {
      totalCases: 0,
      bySheetType: {},
      recentActivity: []
    };
    
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const sheetCases = caseModel.getCasesByAssignee(currentUser);
        
        if (sheetCases.success && sheetCases.data) {
          const filteredCases = sheetCases.data.map(caseData => ({
            ...privacyManager.applySensitivityFilters(caseData, privacyManager.getUserRole(currentUser)),
            sheetType: sheetType
          }));
          
          userCases.bySheetType[sheetType] = {
            count: filteredCases.length,
            cases: options.includeDetails ? filteredCases : filteredCases.slice(0, 5)
          };
          
          userCases.totalCases += filteredCases.length;
          
          // Add recent activity
          filteredCases
            .filter(c => c.lastModified)
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .slice(0, 3)
            .forEach(c => {
              userCases.recentActivity.push({
                caseId: c.caseId,
                sheetType: sheetType,
                action: 'updated',
                timestamp: c.lastModified
              });
            });
        }
      } catch (error) {
        console.warn(`Failed to get cases for ${sheetType}:`, error.message);
        userCases.bySheetType[sheetType] = {
          count: 0,
          cases: [],
          error: error.message
        };
      }
    });
    
    return {
      success: true,
      data: userCases
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get user cases.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Batch update cases - now delegated to CaseController
 */
function batchUpdateCases(updates) {
  // Delegate to CaseController.js batchUpdateCases function
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }
    
    const privacyManager = new PrivacyManager();
    const results = {
      successful: [],
      failed: [],
      totalProcessed: updates.length
    };
    
    updates.forEach((update, index) => {
      try {
        const { caseId, sheetType, data } = update;
        
        if (!caseId || !sheetType || !data) {
          throw new Error('caseId, sheetType, and data are required for each update');
        }
        
        const caseModel = new CaseModel(sheetType);
        const updateResult = caseModel.update(caseId, data);
        
        if (updateResult.success) {
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
            error: updateResult.error || 'Update failed'
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
      totalUpdates: updates.length,
      successful: results.successful.length,
      failed: results.failed.length
    });
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to execute batch updates.',
        context: { updateCount: updates?.length },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Get case statistics - now delegated to CaseController
 */
function getCaseStatistics(filters = {}) {
  // Delegate to CaseController.js getCaseStatistics function
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const stats = {
      totalCases: 0,
      bySheetType: {},
      byStatus: {},
      byPriority: {},
      trends: {},
      lastUpdated: new Date().toISOString()
    };
    
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const searchResult = caseModel.search({
          limit: 10000,
          filters: filters
        });
        
        if (searchResult.success && searchResult.data) {
          const cases = searchResult.data;
          stats.totalCases += cases.length;
          
          stats.bySheetType[sheetType] = {
            count: cases.length,
            channel: SheetMapper.create(sheetType).getChannelValue()
          };
          
          // Count by status
          cases.forEach(caseData => {
            const status = caseData.caseStatus || 'Unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            const priority = caseData.priority || 'Normal';
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
          });
        }
      } catch (error) {
        console.warn(`Failed to get statistics for ${sheetType}:`, error.message);
      }
    });
    
    // Log statistics access
    privacyManager.logAccess('statistics', 'case_statistics', {
      totalCases: stats.totalCases,
      sheetTypes: Object.keys(stats.bySheetType)
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
 * Legacy function for backward compatibility
 * Generate case ID - now delegated to CaseController
 */
function generateCaseId(sheetType) {
  // Delegate to CaseController.js generateCaseId function
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    const caseId = caseModel.generateUniqueCaseId();
    
    return caseId;
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to generate case ID.',
        context: { sheetType },
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Legacy function for backward compatibility
 * Get case by ID - now delegated to CaseController
 */
function getCaseById(caseId, sheetType) {
  // Delegate to CaseController.js getCaseById function
  try {
    if (!caseId) {
      throw new Error('Case ID is required');
    }
    
    if (sheetType) {
      // Search in specific sheet type
      const caseModel = new CaseModel(sheetType);
      return caseModel.read(caseId);
    }
    
    // Search across all sheet types
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    for (const type of sheetTypes) {
      try {
        const caseModel = new CaseModel(type);
        const result = caseModel.read(caseId);
        
        if (result.success && result.data) {
          return {
            success: true,
            data: {
              ...result.data,
              sheetType: type
            }
          };
        }
      } catch (error) {
        // Continue searching in other sheet types
        continue;
      }
    }
    
    return {
      success: false,
      error: `Case ${caseId} not found in any sheet`
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to find case.',
        context: { caseId, sheetType },
        type: ErrorTypes.SPREADSHEET_API
      }
    );
  }
}

// ====================
// SYSTEM INITIALIZATION
// ====================

/**
 * Initialize all system components
 * This function ensures all managers are properly initialized
 */
function initializeSystem() {
  try {
    console.log('🚀 Initializing CasesDash system...');
    
    const results = {
      configManager: false,
      errorHandler: false,
      privacyManager: false,
      performanceManager: false,
      notificationManager: false,
      errors: []
    };
    
    // Initialize core managers
    try {
      ConfigManager.initialize();
      results.configManager = true;
    } catch (error) {
      results.errors.push(`ConfigManager: ${error.message}`);
    }
    
    try {
      new PrivacyManager();
      results.privacyManager = true;
    } catch (error) {
      results.errors.push(`PrivacyManager: ${error.message}`);
    }
    
    try {
      new PerformanceManager();
      results.performanceManager = true;
    } catch (error) {
      results.errors.push(`PerformanceManager: ${error.message}`);
    }
    
    try {
      new NotificationManager();
      results.notificationManager = true;
    } catch (error) {
      results.errors.push(`NotificationManager: ${error.message}`);
    }
    
    // Test ErrorHandler
    try {
      ErrorHandler.getRecentErrors(1);
      results.errorHandler = true;
    } catch (error) {
      results.errors.push(`ErrorHandler: ${error.message}`);
    }
    
    const successCount = Object.values(results).filter(v => v === true).length;
    const totalComponents = Object.keys(results).length - 1; // Exclude errors array
    
    console.log(`✅ System initialization completed: ${successCount}/${totalComponents} components initialized`);
    
    return {
      success: successCount === totalComponents,
      data: results,
      message: `${successCount}/${totalComponents} components initialized successfully`
    };
    
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'System initialization failed'
    };
  }
}

/**
 * Get system status and health
 */
function getSystemStatus() {
  try {
    const systemHealth = checkSystemHealth();
    const automationConfig = getAutomationConfiguration();
    const notificationStatus = getNotificationStatus();
    
    return {
      success: true,
      data: {
        health: systemHealth.data || systemHealth,
        automation: automationConfig.data || {},
        notifications: notificationStatus.data || {},
        version: '2.0',
        lastUpdate: new Date().toISOString()
      }
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get system status.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}

/**
 * Comprehensive system test
 */
function testSystem() {
  try {
    console.log('🧪 Running comprehensive system test...');
    
    const testResults = {
      initialization: false,
      caseOperations: false,
      userManagement: false,
      systemManagement: false,
      trtAnalytics: false,
      searchFunctionality: false,
      automation: false,
      errors: []
    };
    
    // Test initialization
    try {
      const initResult = initializeSystem();
      testResults.initialization = initResult.success;
      if (!initResult.success) {
        testResults.errors.push(`Initialization: ${initResult.message}`);
      }
    } catch (error) {
      testResults.errors.push(`Initialization: ${error.message}`);
    }
    
    // Test case operations
    try {
      const sheetTypes = SheetMapper.getAvailableSheetTypes();
      if (sheetTypes.length > 0) {
        const template = getCaseTemplate(sheetTypes[0]);
        testResults.caseOperations = template.success;
        if (!template.success) {
          testResults.errors.push(`Case Operations: ${template.error}`);
        }
      }
    } catch (error) {
      testResults.errors.push(`Case Operations: ${error.message}`);
    }
    
    // Test user management
    try {
      const currentUser = getCurrentUser();
      testResults.userManagement = currentUser.success;
      if (!currentUser.success) {
        testResults.errors.push(`User Management: ${currentUser.error}`);
      }
    } catch (error) {
      testResults.errors.push(`User Management: ${error.message}`);
    }
    
    // Test system management
    try {
      const systemConfig = getSystemConfig();
      testResults.systemManagement = systemConfig.success;
      if (!systemConfig.success) {
        testResults.errors.push(`System Management: ${systemConfig.error}`);
      }
    } catch (error) {
      testResults.errors.push(`System Management: ${error.message}`);
    }
    
    // Test TRT analytics
    try {
      const trtAnalytics = getTRTAnalytics();
      testResults.trtAnalytics = trtAnalytics.success;
      if (!trtAnalytics.success) {
        testResults.errors.push(`TRT Analytics: ${trtAnalytics.error}`);
      }
    } catch (error) {
      testResults.errors.push(`TRT Analytics: ${error.message}`);
    }
    
    // Test search functionality
    try {
      const searchConfig = getSearchConfiguration();
      testResults.searchFunctionality = searchConfig.success;
      if (!searchConfig.success) {
        testResults.errors.push(`Search: ${searchConfig.error}`);
      }
    } catch (error) {
      testResults.errors.push(`Search: ${error.message}`);
    }
    
    // Test automation
    try {
      const automationConfig = getAutomationConfiguration();
      testResults.automation = automationConfig.success;
      if (!automationConfig.success) {
        testResults.errors.push(`Automation: ${automationConfig.error}`);
      }
    } catch (error) {
      testResults.errors.push(`Automation: ${error.message}`);
    }
    
    const passedTests = Object.values(testResults).filter(v => v === true).length;
    const totalTests = Object.keys(testResults).length - 1; // Exclude errors array
    
    console.log(`✅ System test completed: ${passedTests}/${totalTests} tests passed`);
    
    return {
      success: passedTests === totalTests,
      data: testResults,
      summary: `${passedTests}/${totalTests} tests passed`,
      allPassed: passedTests === totalTests
    };
    
  } catch (error) {
    console.error('❌ System test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'System test failed'
    };
  }
}

// ====================
// MODULE INFORMATION
// ====================

/**
 * Get information about the modular architecture
 */
function getModuleInformation() {
  return {
    success: true,
    data: {
      version: '2.0',
      architecture: 'Modular',
      modules: [
        {
          name: 'AppRouterManager',
          description: 'Web app routing and HTML service management',
          functions: ['doGet', 'doPost', 'onOpen', 'onInstall', 'include']
        },
        {
          name: 'CaseController',
          description: 'Case CRUD operations and management',
          functions: ['createCase', 'readCase', 'updateCase', 'deleteCase', 'searchCases']
        },
        {
          name: 'UserManager',
          description: 'Authentication and user management',
          functions: ['getCurrentUser', 'authenticateUser', 'getUserRole', 'updateUserSettings']
        },
        {
          name: 'SystemManager',
          description: 'System configuration and administration',
          functions: ['getSystemConfig', 'updateSystemConfig', 'checkSystemHealth', 'getPerformanceMetrics']
        },
        {
          name: 'TRTManager',
          description: 'TRT analytics and P95 monitoring',
          functions: ['getTRTAnalytics', 'checkTRTAlerts', 'getTeamData', 'exportTRTReport']
        },
        {
          name: 'SearchController',
          description: 'Advanced search functionality',
          functions: ['performSearch', 'buildSearchIndex', 'getSearchSuggestions']
        },
        {
          name: 'AutomationManager',
          description: 'Automated triggers and notifications',
          functions: ['dailyP95MonitoringTrigger', 'setupP95MonitoringTriggers', 'testP95Monitoring']
        }
      ],
      benefits: [
        'Improved maintainability',
        'Better code organization',
        'Reduced complexity',
        'Enhanced performance',
        'Easier testing and debugging'
      ]
    }
  };
}

// ====================
// ADDITIONAL UTILITY FUNCTIONS
// ====================

/**
 * Get Google OAuth profile information
 */
function getGoogleOAuthProfile() {
  try {
    // In Google Apps Script, we can't directly access OAuth profile
    // This is a placeholder that returns basic info
    const user = Session.getActiveUser();
    const email = user.getEmail();
    
    return {
      name: email.split('@')[0].replace(/\./g, ' '),
      givenName: email.split('@')[0].split('.')[0] || '',
      familyName: email.split('@')[0].split('.')[1] || '',
      picture: '',
      email: email
    };
  } catch (error) {
    console.warn('Failed to get OAuth profile:', error.message);
    return {};
  }
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(userRole) {
  const permissions = {
    admin: [
      'read:all',
      'write:all',
      'delete:all',
      'configure:system',
      'manage:users',
      'view:analytics',
      'export:data'
    ],
    teamLeader: [
      'read:team',
      'write:team',
      'delete:own',
      'view:analytics',
      'export:team'
    ],
    user: [
      'read:own',
      'write:own',
      'view:basic'
    ]
  };
  
  return permissions[userRole] || permissions.user;
}

/**
 * Get automation configuration
 */
function getAutomationConfiguration() {
  try {
    const automationManager = new AutomationManager();
    return automationManager.getConfiguration();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
}

/**
 * Get notification status
 */
function getNotificationStatus() {
  try {
    const notificationManager = new NotificationManager();
    return notificationManager.getStatus();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
}

/**
 * Get search configuration
 */
function getSearchConfiguration() {
  try {
    const searchController = new SearchController();
    return searchController.getConfiguration();
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
}

/**
 * Phase 2: Module Dependency Checker
 * Checks for missing dependencies and functions
 */
function checkModuleDependencies() {
  console.log('🔍 Phase 2: Checking module dependencies...');
  
  const dependencyReport = {
    timestamp: new Date().toISOString(),
    missingClasses: [],
    missingFunctions: [],
    availableClasses: [],
    availableFunctions: [],
    errors: [],
    warnings: [],
    recommendations: []
  };
  
  // Required classes for Code_Optimized.js
  const requiredClasses = [
    'ConfigManager',
    'ErrorHandler',
    'ErrorSeverity',
    'ErrorTypes',
    'PerformanceManager',
    'BatchProcessor',
    'CaseModel',
    'PrivacyManager',
    'SheetMapper',
    'SystemManager',
    'TRTManager',
    'SearchController',
    'AutomationManager',
    'LiveModeManager',
    'SentimentManager',
    'NotificationManager'
  ];
  
  // Required global functions/objects
  const requiredGlobals = [
    'HtmlService',
    'SpreadsheetApp',
    'Session',
    'console'
  ];
  
  console.log('📋 Checking required classes...');
  
  // Check each required class
  requiredClasses.forEach(className => {
    try {
      if (typeof eval(className) !== 'undefined') {
        dependencyReport.availableClasses.push(className);
        console.log(`✅ ${className} - Available`);
      } else {
        dependencyReport.missingClasses.push(className);
        console.log(`❌ ${className} - Missing`);
      }
    } catch (error) {
      dependencyReport.missingClasses.push(className);
      dependencyReport.errors.push(`${className}: ${error.message}`);
      console.log(`❌ ${className} - Error: ${error.message}`);
    }
  });
  
  console.log('🌐 Checking required global objects...');
  
  // Check global objects
  requiredGlobals.forEach(globalName => {
    try {
      if (typeof eval(globalName) !== 'undefined') {
        dependencyReport.availableFunctions.push(globalName);
        console.log(`✅ ${globalName} - Available`);
      } else {
        dependencyReport.missingFunctions.push(globalName);
        console.log(`❌ ${globalName} - Missing`);
      }
    } catch (error) {
      dependencyReport.missingFunctions.push(globalName);
      dependencyReport.errors.push(`${globalName}: ${error.message}`);
      console.log(`❌ ${globalName} - Error: ${error.message}`);
    }
  });
  
  // Generate summary
  const totalRequired = requiredClasses.length + requiredGlobals.length;
  const totalAvailable = dependencyReport.availableClasses.length + dependencyReport.availableFunctions.length;
  const completionRate = Math.round((totalAvailable / totalRequired) * 100);
  
  dependencyReport.summary = {
    totalRequired: totalRequired,
    totalAvailable: totalAvailable,
    completionRate: completionRate,
    isComplete: completionRate === 100
  };
  
  console.log(`📊 Dependency Check Summary: ${totalAvailable}/${totalRequired} (${completionRate}%)`);
  
  return dependencyReport;
}

/**
 * Generate fix recommendations based on missing dependencies
 */
function generateFixRecommendations() {
  console.log('🛠️ Generating fix recommendations...');
  
  const depReport = checkModuleDependencies();
  const recommendations = [];
  
  if (depReport.missingClasses.length > 0) {
    recommendations.push({
      type: 'MISSING_CLASSES',
      severity: 'HIGH',
      items: depReport.missingClasses,
      action: 'Create or import the missing class files',
      files: depReport.missingClasses.map(cls => `server/${cls}.js`)
    });
  }
  
  if (depReport.missingFunctions.length > 0) {
    recommendations.push({
      type: 'MISSING_FUNCTIONS',
      severity: 'MEDIUM',
      items: depReport.missingFunctions,
      action: 'Implement missing global functions or check GAS environment'
    });
  }
  
  if (depReport.errors.length > 0) {
    recommendations.push({
      type: 'ERRORS',
      severity: 'HIGH',
      items: depReport.errors,
      action: 'Fix syntax errors and reference issues'
    });
  }
  
  console.log(`📋 Generated ${recommendations.length} fix recommendations`);
  
  return {
    success: true,
    data: {
      dependencies: depReport,
      recommendations: recommendations,
      nextSteps: [
        'Review missing classes and create necessary files',
        'Test individual module functionality',
        'Run integration tests',
        'Deploy and test in GAS environment'
      ]
    }
  };
}

console.log('� CasesDash Optimized Code File Loaded - Modular Architecture v2.0');
console.log('🔧 Phase 2 Module Dependency Checker Ready');
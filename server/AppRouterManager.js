/**
 * CasesDash - App Router Manager
 * Handles routing, web app entry points, and HTML service management
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

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
 * Test spreadsheet connection and validate structure
 * @param {string} spreadsheetId - Spreadsheet ID to test
 * @param {boolean} validateOnly - If true, only validate without configuring
 * @returns {Object} Connection test result
 */
function testSpreadsheetConnection(spreadsheetId, validateOnly = false) {
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
    
    // Validate sheet structure for existing sheets
    const sheetValidation = {};
    
    requiredSheets.forEach(sheetName => {
      if (sheetNames.includes(sheetName)) {
        const sheet = spreadsheet.getSheetByName(sheetName);
        const validation = validateSheetStructure(sheet, sheetName);
        sheetValidation[sheetName] = {
          exists: true,
          valid: validation.success,
          issues: validation.issues || [],
          recommendations: validation.recommendations || []
        };
      } else {
        sheetValidation[sheetName] = {
          exists: false,
          valid: false,
          issues: ['Sheet does not exist'],
          recommendations: [`Create sheet named '${sheetName}'`]
        };
      }
    });
    
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
        sheetValidation: sheetValidation,
        overallValid: missingSheets.length === 0 && Object.values(sheetValidation).every(v => v.valid)
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
    
    // Add recommendations if there are issues
    if (missingSheets.length > 0 || !result.validation.overallValid) {
      result.recommendations = generateSpreadsheetRecommendations(missingSheets, sheetValidation);
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

/**
 * Validate sheet structure against expected schema
 * @param {Sheet} sheet - Google Apps Script Sheet object
 * @param {string} sheetType - Type of sheet being validated
 * @returns {Object} Validation result
 */
function validateSheetStructure(sheet, sheetType) {
  try {
    // Basic validation - ensure sheet has data
    if (sheet.getLastRow() < 1) {
      return {
        success: false,
        issues: ['Sheet appears to be empty'],
        recommendations: ['Add headers to the sheet']
      };
    }
    
    // Get expected column mapping for this sheet type
    const mapper = SheetMapper.create(sheetType);
    if (!mapper) {
      return {
        success: false,
        issues: [`Unsupported sheet type: ${sheetType}`]
      };
    }
    
    // For now, basic validation is sufficient
    // TODO: Add more detailed header validation if needed
    return {
      success: true,
      issues: [],
      recommendations: []
    };
    
  } catch (error) {
    return {
      success: false,
      issues: [error.message]
    };
  }
}

/**
 * Generate recommendations for spreadsheet setup issues
 * @param {Array} missingSheets - List of missing sheet names
 * @param {Object} sheetValidation - Validation results for each sheet
 * @returns {Array} List of recommendation objects
 */
function generateSpreadsheetRecommendations(missingSheets, sheetValidation) {
  const recommendations = [];
  
  if (missingSheets.length > 0) {
    recommendations.push({
      type: 'missing_sheets',
      priority: 'high',
      message: `Create missing sheets: ${missingSheets.join(', ')}`,
      actions: missingSheets.map(sheet => `Create sheet named '${sheet}'`)
    });
  }
  
  Object.entries(sheetValidation).forEach(([sheetName, validation]) => {
    if (validation.exists && !validation.valid) {
      recommendations.push({
        type: 'sheet_structure',
        priority: 'medium',
        message: `Fix structure issues in sheet '${sheetName}'`,
        actions: validation.recommendations
      });
    }
  });
  
  recommendations.push({
    type: 'general',
    priority: 'low',
    message: 'Ensure all sheets have proper permissions',
    actions: ['Share spreadsheet with this Google Apps Script', 'Grant edit permissions']
  });
  
  return recommendations;
}

/**
 * Include HTML files for templating
 * @param {string} filename - Name of the file to include
 * @returns {string} File content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

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
 * Menu setup for the spreadsheet
 */
function onOpen() {
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

/**
 * Open main dashboard
 */
function openDashboard() {
  try {
    const htmlOutput = HtmlService.createTemplateFromFile('client/index')
      .evaluate()
      .setWidth(1200)
      .setHeight(800)
      .setTitle('CasesDash - Enterprise Case Management');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'CasesDash Dashboard');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open dashboard: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Open Live Mode
 */
function openLiveMode() {
  try {
    const htmlOutput = HtmlService.createTemplateFromFile('client/live-mode')
      .evaluate()
      .setWidth(1400)
      .setHeight(900)
      .setTitle('CasesDash - Live Mode');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'CasesDash Live Mode');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open live mode: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Open advanced search
 */
function openSearch() {
  try {
    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>🔍 Advanced Search</h2>
        <p>Advanced search functionality will be available in the main dashboard.</p>
        <p><a href="javascript:google.script.host.close()" style="color: #1976d2;">Close</a></p>
      </div>
    `)
      .setWidth(600)
      .setHeight(400)
      .setTitle('CasesDash - Advanced Search');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Advanced Search');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open search: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show statistics dialog
 */
function showStatistics() {
  try {
    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>📈 Statistics</h2>
        <p>Detailed statistics and analytics are available in the main dashboard.</p>
        <p><a href="javascript:google.script.host.close()" style="color: #1976d2;">Close</a></p>
      </div>
    `)
      .setWidth(600)
      .setHeight(400)
      .setTitle('CasesDash - Statistics');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Statistics');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to show statistics: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Open setup dialog
 */
function openSetup() {
  try {
    const htmlOutput = HtmlService.createTemplateFromFile('client/setup')
      .evaluate()
      .setWidth(800)
      .setHeight(600)
      .setTitle('CasesDash - Setup');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'CasesDash Setup');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open setup: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Open system management
 */
function openSystemManagement() {
  try {
    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>⚙️ System Management</h2>
        <p>System management features are available in the main dashboard.</p>
        <p>Access the dashboard for:</p>
        <ul>
          <li>User management</li>
          <li>System configuration</li>
          <li>Performance monitoring</li>
          <li>Security settings</li>
        </ul>
        <p><a href="javascript:google.script.host.close()" style="color: #1976d2;">Close</a></p>
      </div>
    `)
      .setWidth(600)
      .setHeight(500)
      .setTitle('CasesDash - System Management');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'System Management');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open system management: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Open test runner
 */
function openTestRunner() {
  try {
    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>🧪 Test Runner</h2>
        <p>Test runner functionality is available for developers.</p>
        <p>Run tests from the script editor or use the TestRunner.js file.</p>
        <p><a href="javascript:google.script.host.close()" style="color: #1976d2;">Close</a></p>
      </div>
    `)
      .setWidth(600)
      .setHeight(400)
      .setTitle('CasesDash - Test Runner');
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Test Runner');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', 'Failed to open test runner: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
/**
 * CasesDash - Case Controller
 * Handles all case-related CRUD operations and case management
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * Create a new case with performance optimization
 * @param {Object|string} caseDataOrSheetType - Case data object or legacy sheetType parameter
 * @param {Object} legacyCaseData - Legacy case data (optional, for backward compatibility)
 * @param {Object} options - Performance options
 * @returns {Object} Creation result
 */
function createCase(caseDataOrSheetType, legacyCaseData = null, options = {}) {
  try {
    console.log('🚀 [createCase] Starting case creation...');
    console.log('🚀 [createCase] Input parameters:', {
      caseDataOrSheetType: typeof caseDataOrSheetType === 'object' ? 'Object with keys: ' + Object.keys(caseDataOrSheetType).join(', ') : caseDataOrSheetType,
      legacyCaseData: legacyCaseData ? 'Object with keys: ' + Object.keys(legacyCaseData).join(', ') : null,
      options: options
    });
    
    // Security: Validate authentication first
    const authResult = authenticateUser();
    if (!authResult.success) {
      console.warn('❌ [createCase] Authentication failed:', authResult.error);
      return ErrorHandler.handleGracefully(
        new Error('Authentication required'),
        {
          userMessage: 'You must be authenticated to create cases.',
          type: ErrorTypes.AUTHENTICATION
        }
      );
    }
    
    let sheetType, caseData;
    
    // Handle both new and legacy calling conventions
    if (typeof caseDataOrSheetType === 'string' && legacyCaseData) {
      // Legacy format: createCase(sheetType, caseData, options)
      sheetType = caseDataOrSheetType;
      caseData = legacyCaseData;
      console.log('📝 [createCase] Using legacy format:', { sheetType, caseDataKeys: Object.keys(caseData) });
    } else if (typeof caseDataOrSheetType === 'object' && caseDataOrSheetType.sheetType) {
      // New format: createCase(caseData) where caseData includes sheetType
      caseData = caseDataOrSheetType;
      sheetType = caseData.sheetType;
      console.log('📝 [createCase] Using new format:', { sheetType, caseDataKeys: Object.keys(caseData) });
    } else {
      console.error('❌ [createCase] Invalid parameters format');
      throw new Error('Invalid parameters. Expected case data with sheetType or legacy format.');
    }
    
    // Security: Validate and sanitize inputs
    const validationResult = InputValidator.validateCaseData(caseData, true);
    if (!validationResult.isValid) {
      console.error('❌ [createCase] Input validation failed:', validationResult.errors);
      return ErrorHandler.handleGracefully(
        new Error('Invalid input data'),
        {
          userMessage: `Input validation failed: ${validationResult.errors.join(', ')}`,
          type: ErrorTypes.VALIDATION,
          context: { validationErrors: validationResult.errors }
        }
      );
    }
    
    // Use sanitized data
    caseData = validationResult.sanitized;
    sheetType = caseData.sheetType;
    
    console.log('✅ [createCase] Parameters validated and sanitized successfully');
    
    try {
      // Create optimized case model instance with error handling
      console.log('🔧 [createCase] Initializing dependencies...');
      
      let performanceManager = null;
      let batchProcessor = null;
      
      if (options.enablePerformanceTracking) {
        try {
          performanceManager = new PerformanceManager();
          console.log('✅ [createCase] PerformanceManager initialized');
        } catch (perfError) {
          console.warn('⚠️ [createCase] PerformanceManager initialization failed:', perfError.message);
          performanceManager = null;
        }
      }
      
      if (options.enableBatchProcessing) {
        try {
          batchProcessor = new BatchProcessor(performanceManager);
          console.log('✅ [createCase] BatchProcessor initialized');
        } catch (batchError) {
          console.warn('⚠️ [createCase] BatchProcessor initialization failed:', batchError.message);
          batchProcessor = null;
        }
      }
      
      console.log('🔧 [createCase] Creating CaseModel instance...');
      const caseModel = new CaseModel(sheetType, null, performanceManager, batchProcessor);
      console.log('✅ [createCase] CaseModel instance created successfully');
      
      // Configure optimization settings if provided
      if (options.optimizationSettings) {
        try {
          console.log('⚙️ [createCase] Configuring optimization settings...');
          caseModel.configureOptimization(options.optimizationSettings);
          console.log('✅ [createCase] Optimization settings configured');
        } catch (optError) {
          console.warn('⚠️ [createCase] Optimization configuration failed:', optError.message);
          // Continue without optimization
        }
      }
      
      // Create case
      console.log('💾 [createCase] Calling caseModel.create...');
      const result = caseModel.create(caseData);
      console.log('✅ [createCase] Case creation completed:', result);
      
      return result;
      
    } catch (modelError) {
      console.error('❌ [createCase] CaseModel error:', modelError);
      console.error('❌ [createCase] Error stack:', modelError.stack);
      
      // Try fallback approach without advanced features
      console.log('🔄 [createCase] Attempting fallback creation without advanced features...');
      try {
        const fallbackCaseModel = new CaseModel(sheetType);
        const fallbackResult = fallbackCaseModel.create(caseData);
        console.log('✅ [createCase] Fallback creation successful:', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('❌ [createCase] Fallback creation also failed:', fallbackError);
        throw modelError; // Throw original error
      }
    }
    
  } catch (error) {
    console.error('❌ [createCase] Final error handler:', error);
    console.error('❌ [createCase] Error details:', {
      message: error.message,
      stack: error.stack,
      sheetType: sheetType,
      caseDataKeys: caseData ? Object.keys(caseData) : 'undefined'
    });
    
    return {
      success: false,
      error: true,
      message: error.message,
      userMessage: 'Failed to create case. Please check the input data and try again.',
      context: {
        sheetType: sheetType,
        caseDataKeys: caseData ? Object.keys(caseData) : 'undefined',
        inputType: typeof caseDataOrSheetType
      },
      timestamp: new Date().toISOString()
    };
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
 * Advanced search with full-text and faceted filtering
 * @param {string} sheetType - Type of sheet
 * @param {Object} searchParams - Advanced search parameters
 * @returns {Object} Advanced search results
 */
function advancedSearch(sheetType, searchParams = {}) {
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
 * Execute batch operations on cases
 * @param {string} sheetType - Type of sheet
 * @param {Array} operations - Array of operations to execute
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
 * Get case template for creating new cases
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Case template
 */
function getCaseTemplate(sheetType) {
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
 * Validate case data before creation or update
 * @param {string} sheetType - Type of sheet
 * @param {Object} caseData - Case data to validate
 * @param {boolean} isCreate - Whether this is for case creation
 * @returns {Object} Validation result
 */
function validateCaseData(sheetType, caseData, isCreate = false) {
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
 * Get current user's cases across all accessible sheet types
 * @param {Object} options - Query options
 * @returns {Object} User's cases
 */
function getUserCases(options = {}) {
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
 * Batch update multiple cases
 * @param {Array} updates - Array of update objects with caseId, sheetType, and data
 * @returns {Object} Batch update results
 */
function batchUpdateCases(updates) {
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
 * Get case statistics across all sheet types
 * @param {Object} filters - Optional filters for statistics
 * @returns {Object} Case statistics
 */
function getCaseStatistics(filters = {}) {
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
 * Global case search across all sheet types
 * @param {Object} searchCriteria - Search criteria
 * @returns {Object} Global search results
 */
function globalCaseSearch(searchCriteria = {}) {
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
 * Generate a new case ID for a specific sheet type
 * @param {string} sheetType - Type of sheet
 * @returns {Object} Generated case ID
 */
function generateCaseId(sheetType) {
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
 * Get a case by ID from any sheet type
 * @param {string} caseId - Case ID to search for
 * @param {string} sheetType - Specific sheet type (optional)
 * @returns {Object} Case data
 */
function getCaseById(caseId, sheetType) {
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

/**
 * Subscribe to data changes for a sheet type
 * @param {string} sheetType - Type of sheet to monitor
 * @returns {Object} Subscription result
 */
function subscribeToDataChanges(sheetType) {
  try {
    if (!sheetType) {
      throw new Error('Sheet type is required');
    }
    
    const caseModel = new CaseModel(sheetType);
    
    // Create a callback for data changes
    const callback = (changes) => {
      console.log(`Data changes detected in ${sheetType}:`, changes);
    };
    
    const subscription = caseModel.subscribeToDataChanges(callback);
    
    return {
      success: true,
      data: {
        subscriptionId: subscription.subscriptionId,
        sheetType: sheetType,
        callback: callback.toString()
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
 * Get available sheet types for case creation
 * @returns {Object} Available sheet types with metadata
 */
function getAvailableSheetTypes() {
  try {
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const typesWithMetadata = sheetTypes.map(sheetType => {
      const mapper = SheetMapper.create(sheetType);
      
      return {
        name: sheetType,
        displayName: sheetType,
        description: `${mapper.getChannelValue()} channel for ${mapper.supports3PO() ? '3PO' : 'OT'} cases`,
        channel: mapper.getChannelValue(),
        is3PO: mapper.supports3PO(),
        requiredFields: mapper.getRequiredFields(),
        specificFields: mapper.getSheetSpecificFields()
      };
    });
    
    return {
      success: true,
      data: typesWithMetadata
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get available sheet types.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
}
/**
 * CasesDash - Case Model
 * Unified data access layer with CRUD operations for all sheet types
 * Enhanced with performance optimization and batch processing
 *
 * @author Roo
 * @version 2.0
 * @since 2025-05-25
 */

/**
 * CaseModel class for unified case data management
 * Provides CRUD operations with validation, batch processing, and performance monitoring
 */
class CaseModel {
  
  /**
   * Constructor
   * @param {string} sheetType - Type of sheet (e.g., "OT Email", "3PO Chat")
   * @param {SheetMapper} sheetMapper - Optional SheetMapper instance
   * @param {PerformanceManager} performanceManager - Optional PerformanceManager instance
   * @param {BatchProcessor} batchProcessor - Optional BatchProcessor instance
   */
  constructor(sheetType, sheetMapper = null, performanceManager = null, batchProcessor = null) {
    try {
      this.sheetType = sheetType;
      this.sheetMapper = sheetMapper || new SheetMapper(sheetType);
      this.performanceManager = performanceManager || new PerformanceManager();
      this.batchProcessor = batchProcessor || new BatchProcessor(this.performanceManager);
      this.spreadsheetId = ConfigManager.getSpreadsheetId();
      this.spreadsheet = null;
      this.worksheet = null;
      this.cache = new Map();
      this.cacheTimeout = ConfigManager.get('cache', 'defaultTTL') || 300000; // 5 minutes
      
      // Performance optimization settings
      this.optimizationSettings = {
        enableBatchProcessing: true,
        enableAdvancedCaching: true,
        enablePerformanceMonitoring: true,
        maxBatchSize: 500,
        cacheStrategy: 'aggressive'
      };
      
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID not configured. Please set it in ConfigManager.');
      }
      
      this.initializeSpreadsheet();
      this.initializePerformanceOptimizations();
      
    } catch (error) {
      ErrorHandler.logError(error, { sheetType }, ErrorSeverity.HIGH, ErrorTypes.INTERNAL);
      throw error;
    }
  }
  
  /**
   * Initialize performance optimizations
   * @private
   */
  initializePerformanceOptimizations() {
    try {
      // Set up performance tracking
      this.performanceStats = {
        apiCallsReduced: 0,
        totalOperations: 0,
        cacheHits: 0,
        batchOperations: 0
      };
      
      // Initialize advanced caching if enabled
      if (this.optimizationSettings.enableAdvancedCaching) {
        this.initializeAdvancedCache();
      }
      
      console.log(`CaseModel initialized with performance optimizations for ${this.sheetType}`);
      
    } catch (error) {
      ErrorHandler.logError(error, { sheetType: this.sheetType }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Initialize advanced caching system
   * @private
   */
  initializeAdvancedCache() {
    try {
      // Multi-level cache with different TTLs
      this.advancedCache = new Map();
      this.metadataCache = new Map();
      this.queryCache = new Map();
      
      // Cache settings
      this.cacheSettings = {
        metadata: { ttl: 900000 }, // 15 minutes
        data: { ttl: 300000 }, // 5 minutes
        queries: { ttl: 180000 }, // 3 minutes
        aggregations: { ttl: 600000 } // 10 minutes
      };
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Initialize spreadsheet and worksheet
   * @private
   */
  initializeSpreadsheet() {
    try {
      this.spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      this.worksheet = this.spreadsheet.getSheetByName(this.sheetType);
      
      if (!this.worksheet) {
        throw new Error(`Sheet "${this.sheetType}" not found in spreadsheet`);
      }
      
    } catch (error) {
      ErrorHandler.logError(
        error,
        { sheetType: this.sheetType, spreadsheetId: this.spreadsheetId },
        ErrorSeverity.HIGH,
        ErrorTypes.SPREADSHEET_API
      );
      throw error;
    }
  }
  
  /**
   * Create new case with simplified synchronous approach
   * @param {Object} caseData - Case data to create
   * @returns {Object} Result with success status and case data
   */
  create(caseData) {
    try {
      console.log(`🚀 [CaseModel.create] Starting case creation for ${this.sheetType}`);
      console.log(`📦 [CaseModel.create] Input data:`, Object.keys(caseData));
      
      // Validate input data
      const validation = this.validateCaseData(caseData, true);
      if (!validation.isValid) {
        console.error(`❌ [CaseModel.create] Validation failed:`, validation.errors);
        return {
          success: false,
          error: true,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          errors: validation.errors
        };
      }
      
      console.log(`✅ [CaseModel.create] Validation passed`);
      
      // Prepare data for insertion
      const preparedData = this.prepareCaseDataForSheet(validation.sanitizedData);
      console.log(`📝 [CaseModel.create] Data prepared for sheet:`, Object.keys(preparedData));
      
      // Get next available row
      const nextRow = this.getNextAvailableRow();
      console.log(`📍 [CaseModel.create] Next available row: ${nextRow}`);
      
      // Generate case ID if not provided
      if (!preparedData.caseId) {
        preparedData.caseId = this.generateCaseId(nextRow);
        console.log(`🆔 [CaseModel.create] Generated case ID: ${preparedData.caseId}`);
      }
      
      // Build batch updates using synchronous approach
      const updates = this.buildBatchUpdates(preparedData, nextRow);
      console.log(`🔧 [CaseModel.create] Built ${updates.length} updates`);
      
      // Execute updates synchronously
      this.executeBatchUpdateSync(updates);
      console.log(`✅ [CaseModel.create] Updates executed successfully`);
      
      // Clear cache
      this.clearCache();
      
      console.log(`🎉 [CaseModel.create] Case created successfully: ${preparedData.caseId} in ${this.sheetType}`);
      
      return {
        success: true,
        data: preparedData,
        row: nextRow,
        caseId: preparedData.caseId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ [CaseModel.create] Error in ${this.sheetType}:`, error);
      console.error(`❌ [CaseModel.create] Error stack:`, error.stack);
      
      return {
        success: false,
        error: true,
        message: error.message || 'Failed to create case',
        details: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Execute batch update synchronously
   * @private
   * @param {Array} updates - Array of updates to execute
   */
  executeBatchUpdateSync(updates) {
    try {
      if (updates.length === 0) return;
      
      console.log(`🔄 [executeBatchUpdateSync] Executing ${updates.length} updates`);
      
      // Execute each update individually for reliability
      updates.forEach((update, index) => {
        try {
          console.log(`📝 [executeBatchUpdateSync] Update ${index + 1}/${updates.length}: ${update.range} = "${update.value}"`);
          this.worksheet.getRange(update.range).setValue(update.value);
        } catch (updateError) {
          console.error(`❌ [executeBatchUpdateSync] Failed to update ${update.range}:`, updateError);
          throw new Error(`Failed to update ${update.range}: ${updateError.message}`);
        }
      });
      
      console.log(`✅ [executeBatchUpdateSync] All updates completed successfully`);
      
    } catch (error) {
      console.error(`❌ [executeBatchUpdateSync] Fatal error:`, error);
      throw error;
    }
  }
  
  /**
   * Read case by ID
   * @param {string} caseId - Case ID to read
   * @returns {Object} Result with case data or error
   */
  async read(caseId) {
    try {
      if (!caseId) {
        throw new Error('Case ID is required');
      }
      
      // Check cache first
      const cacheKey = `case_${this.sheetType}_${caseId}`;
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
          return { success: true, data: cachedData.data, fromCache: true };
        }
      }
      
      // Find row by case ID
      const row = await this.findRowByCaseId(caseId);
      if (!row) {
        return {
          success: false,
          error: true,
          message: `Case ${caseId} not found in ${this.sheetType}`
        };
      }
      
      // Get row data
      const rowData = await this.getRowData(row);
      const caseData = this.parseRowDataToCase(rowData, row);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: caseData,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: caseData,
        row: row
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: `Failed to read case ${caseId}. Please try again.`,
          context: { sheetType: this.sheetType, caseId },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Update case
   * @param {string} caseId - Case ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Object} Result with success status
   */
  async update(caseId, updates) {
    try {
      if (!caseId) {
        throw new Error('Case ID is required');
      }
      
      // Validate updates
      const validation = this.validateCaseData(updates, false);
      if (!validation.isValid) {
        return ErrorHandler.handleGracefully(
          new Error(`Validation failed: ${validation.errors.join(', ')}`),
          { type: ErrorTypes.VALIDATION }
        );
      }
      
      // Find row by case ID
      const row = await this.findRowByCaseId(caseId);
      if (!row) {
        return {
          success: false,
          error: true,
          message: `Case ${caseId} not found in ${this.sheetType}`
        };
      }
      
      // Prepare updates for sheet
      const preparedUpdates = this.prepareCaseDataForSheet(validation.sanitizedData);
      
      // Build batch updates
      const batchUpdates = this.buildBatchUpdates(preparedUpdates, row);
      
      // Execute batch update
      await this.executeBatchUpdate(batchUpdates);
      
      // Clear cache
      this.clearCache();
      
      console.log(`Case updated successfully: ${caseId} in ${this.sheetType}`);
      
      return {
        success: true,
        caseId: caseId,
        updatedFields: Object.keys(preparedUpdates),
        row: row
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: `Failed to update case ${caseId}. Please try again.`,
          context: { sheetType: this.sheetType, caseId, updates },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Delete case (soft delete by marking as deleted)
   * @param {string} caseId - Case ID to delete
   * @returns {Object} Result with success status
   */
  async delete(caseId) {
    try {
      if (!caseId) {
        throw new Error('Case ID is required');
      }
      
      // Find row by case ID
      const row = await this.findRowByCaseId(caseId);
      if (!row) {
        return {
          success: false,
          error: true,
          message: `Case ${caseId} not found in ${this.sheetType}`
        };
      }
      
      // Soft delete by updating status
      await this.updateField(row, 'caseStatus', 'Deleted');
      
      // Add deletion metadata
      const deletionData = {
        deletedAt: new Date(),
        deletedBy: Session.getActiveUser().getEmail()
      };
      
      // Clear cache
      this.clearCache();
      
      console.log(`Case soft deleted: ${caseId} in ${this.sheetType}`);
      
      return {
        success: true,
        caseId: caseId,
        deletedAt: deletionData.deletedAt,
        deletedBy: deletionData.deletedBy
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: `Failed to delete case ${caseId}. Please try again.`,
          context: { sheetType: this.sheetType, caseId },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Search cases with criteria
   * @param {Object} criteria - Search criteria
   * @returns {Object} Result with matching cases
   */
  search(criteria = {}) {
    try {
      console.log(`🔍 [CaseModel.search] Starting search for ${this.sheetType}`);
      console.log(`🔍 [CaseModel.search] Search criteria:`, criteria);
      
      const {
        filters = {},
        sortBy = 'caseOpenDate',
        sortOrder = 'desc',
        limit = 100,
        offset = 0,
        includeDeleted = false
      } = criteria;
      
      console.log(`🔍 [CaseModel.search] Extracted filters:`, filters);
      console.log(`🔍 [CaseModel.search] includeDeleted:`, includeDeleted);
      
      // Get all data from sheet
      const allData = this.getAllData();
      console.log(`🔍 [CaseModel.search] Retrieved ${allData.length} total rows from ${this.sheetType}`);
      
      if (allData.length > 0) {
        console.log(`🔍 [CaseModel.search] Sample data structure:`, Object.keys(allData[0]));
        console.log(`🔍 [CaseModel.search] First row sample:`, allData[0]);
      }
      
      // Apply filters
      let filteredData = this.applyFilters(allData, filters, includeDeleted);
      console.log(`🔍 [CaseModel.search] After filtering: ${filteredData.length} rows`);
      
      // Apply sorting
      filteredData = this.applySorting(filteredData, sortBy, sortOrder);
      console.log(`🔍 [CaseModel.search] After sorting: ${filteredData.length} rows`);
      
      // Apply pagination
      const totalCount = filteredData.length;
      const paginatedData = filteredData.slice(offset, offset + limit);
      console.log(`🔍 [CaseModel.search] After pagination: ${paginatedData.length} rows (total: ${totalCount})`);
      
      if (paginatedData.length > 0) {
        console.log(`🔍 [CaseModel.search] Sample result:`, paginatedData[0]);
      }
      
      return {
        success: true,
        data: paginatedData,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount
      };
      
    } catch (error) {
      console.error(`🔍 [CaseModel.search] Error in ${this.sheetType}:`, error);
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to search cases. Please try again.',
          context: { sheetType: this.sheetType, criteria },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Get cases by assignee (for privacy protection)
   * @param {string} assigneeEmail - Assignee email
   * @returns {Object} Result with assignee's cases
   */
  async getCasesByAssignee(assigneeEmail) {
    try {
      const currentUser = Session.getActiveUser().getEmail();
      
      // Privacy check: users can only see their own cases unless they're admin
      if (assigneeEmail !== currentUser) {
        const userRole = this.getUserRole(currentUser);
        if (!['admin', 'teamLeader'].includes(userRole)) {
          return {
            success: false,
            error: true,
            message: 'Access denied. You can only view your own cases.'
          };
        }
      }
      
      // Search for cases assigned to the user
      const criteria = {
        filters: {
          firstAssignee: assigneeEmail,
          finalAssignee: assigneeEmail // OR condition
        },
        sortBy: 'caseOpenDate',
        sortOrder: 'desc'
      };
      
      return await this.search(criteria);
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to get cases by assignee. Please try again.',
          context: { sheetType: this.sheetType, assigneeEmail },
          type: ErrorTypes.PERMISSION
        }
      );
    }
  }
  
  /**
   * Validate case data
   * @private
   * @param {Object} caseData - Case data to validate
   * @param {boolean} isCreate - Whether this is for creation (requires more fields)
   * @returns {Object} Validation result
   */
  validateCaseData(caseData, isCreate = false) {
    try {
      const errors = [];
      const sanitizedData = {};
      
      // Get required fields for this sheet type
      const requiredFields = this.sheetMapper.getRequiredFields();
      
      // Validate required fields for creation
      if (isCreate) {
        requiredFields.forEach(field => {
          if (!caseData[field] || caseData[field] === '') {
            errors.push(`${field} is required`);
          }
        });
      }
      
      // Validate each field
      Object.keys(caseData).forEach(field => {
        const value = caseData[field];
        
        // Validate using SheetMapper
        const fieldValidation = this.sheetMapper.validateField(field, value);
        if (!fieldValidation.isValid) {
          errors.push(fieldValidation.error);
        } else {
          // Sanitize using ErrorHandler
          const inputValidation = ErrorHandler.validateInput(value, {
            type: this.getFieldType(field),
            required: requiredFields.includes(field)
          });
          
          if (inputValidation.isValid) {
            sanitizedData[field] = inputValidation.value;
          } else {
            errors.push(`${field}: ${inputValidation.errors.join(', ')}`);
          }
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors: errors,
        sanitizedData: sanitizedData
      };
      
    } catch (error) {
      ErrorHandler.logError(error, { caseData, isCreate }, ErrorSeverity.MEDIUM, ErrorTypes.VALIDATION);
      return {
        isValid: false,
        errors: ['Validation error occurred'],
        sanitizedData: {}
      };
    }
  }
  
  /**
   * Get field type for validation
   * @private
   * @param {string} field - Field name
   * @returns {string} Field type
   */
  getFieldType(field) {
    const dateFields = ['caseOpenDate', 'firstCloseDate', 'reopenCloseDate', 'closeDate'];
    const timeFields = ['caseOpenTime', 'firstCloseTime', 'reopenCloseTime', 'closeTime'];
    const numberFields = ['is30', 'triage', 'preferEither', 'amInitiated', 'bug', 'needInfo'];
    
    if (dateFields.includes(field)) return 'date';
    if (timeFields.includes(field)) return 'string'; // Time as string
    if (numberFields.includes(field)) return 'number';
    if (field.includes('email') || field.includes('Email')) return 'email';
    
    return 'string';
  }
  
  /**
   * Prepare case data for sheet insertion/update
   * @private
   * @param {Object} caseData - Case data to prepare
   * @returns {Object} Prepared data
   */
  prepareCaseDataForSheet(caseData) {
    try {
      const prepared = { ...caseData };
      
      // Set default values for sheet-specific fields
      if (this.sheetMapper.getChannelValue()) {
        prepared.channel = this.sheetMapper.getChannelValue();
      }
      
      // Set timestamps
      if (!prepared.caseOpenDate) {
        prepared.caseOpenDate = new Date();
      }
      
      if (!prepared.caseOpenTime) {
        prepared.caseOpenTime = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'HH:mm:ss');
      }
      
      // Generate case link if case ID exists
      if (prepared.caseId) {
        prepared.caseLink = this.generateCaseLink(prepared.caseId);
      }
      
      return prepared;
      
    } catch (error) {
      ErrorHandler.logError(error, { caseData }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return caseData;
    }
  }
  
  /**
   * Build batch updates for spreadsheet
   * @private
   * @param {Object} data - Data to update
   * @param {number} row - Row number
   * @returns {Array} Array of batch updates
   */
  buildBatchUpdates(data, row) {
    const updates = [];
    
    Object.keys(data).forEach(field => {
      const column = this.sheetMapper.getColumn(field);
      if (column) {
        updates.push({
          range: `${column}${row}`,
          value: data[field]
        });
      }
    });
    
    return updates;
  }
  
  /**
   * Execute batch update
   * @private
   * @param {Array} updates - Array of updates to execute
   */
  executeBatchUpdate(updates) {
    try {
      if (updates.length === 0) return;
      
      // Execute each update individually for better error handling
      updates.forEach((update, index) => {
        try {
          this.worksheet.getRange(update.range).setValue(update.value);
        } catch (updateError) {
          console.error(`❌ Failed to update ${update.range}:`, updateError);
          throw new Error(`Failed to update ${update.range}: ${updateError.message}`);
        }
      });
      
    } catch (error) {
      ErrorHandler.logError(error, { updates }, ErrorSeverity.HIGH, ErrorTypes.SPREADSHEET_API);
      throw error;
    }
  }
  
  /**
   * Find row by case ID
   * @private
   * @param {string} caseId - Case ID to find
   * @returns {number|null} Row number or null if not found
   */
  findRowByCaseId(caseId) {
    try {
      const caseIdColumn = this.sheetMapper.getColumn('caseId');
      if (!caseIdColumn) {
        throw new Error('Case ID column not found in mapping');
      }
      
      const data = this.worksheet.getRange(`${caseIdColumn}:${caseIdColumn}`).getValues();
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === caseId) {
          return i + 1; // 1-based row number
        }
      }
      
      return null;
      
    } catch (error) {
      ErrorHandler.logError(error, { caseId }, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
      return null;
    }
  }
  
  /**
   * Get next available row
   * @private
   * @returns {number} Next available row number
   */
  getNextAvailableRow() {
    try {
      return this.worksheet.getLastRow() + 1;
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
      return 2; // Default to row 2 (assuming row 1 is header)
    }
  }
  
  /**
   * Generate case ID
   * @private
   * @param {number} row - Row number
   * @returns {string} Generated case ID
   */
  generateCaseId(row) {
    const prefix = this.sheetType.replace(' ', '').substring(0, 3).toUpperCase();
    const timestamp = new Date().getTime().toString().slice(-6);
    return `${prefix}-${timestamp}-${row}`;
  }

  /**
   * Generate unique case ID (public method for API calls)
   * @returns {Object} Result with generated case ID
   */
  generateUniqueCaseId() {
    try {
      // Get next available row to ensure uniqueness
      const nextRow = this.getNextAvailableRow();
      const caseId = this.generateCaseId(nextRow);
      
      // Verify uniqueness by checking if ID already exists
      const existingCase = this.findRowByCaseId(caseId);
      if (existingCase) {
        // If collision detected, add additional entropy
        const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
        const uniqueId = `${caseId}-${randomSuffix}`;
        
        return {
          success: true,
          data: uniqueId,
          generated: true,
          collision: true
        };
      }
      
      return {
        success: true,
        data: caseId,
        generated: true,
        collision: false
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to generate unique case ID.',
          context: { sheetType: this.sheetType },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
  
  /**
   * Generate case link
   * @private
   * @param {string} caseId - Case ID
   * @returns {string} Case link URL
   */
  generateCaseLink(caseId) {
    // This would typically link to an external case management system
    return `https://support.google.com/cases/${caseId}`;
  }
  
  /**
   * Get user role for permission checking
   * @private
   * @param {string} userEmail - User email
   * @returns {string} User role
   */
  getUserRole(userEmail) {
    try {
      // This would typically check against a user management system
      // For now, return 'user' as default
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
   * Clear cache
   * @private
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get all data from sheet
   * @private
   * @returns {Array} All data from sheet
   */
  getAllData() {
    try {
      console.log(`🔍 [getAllData] Starting data retrieval from ${this.sheetType}`);
      
      const data = this.worksheet.getDataRange().getValues();
      console.log(`🔍 [getAllData] Retrieved ${data.length} total rows (including header)`);
      
      if (data.length === 0) {
        console.log(`🔍 [getAllData] No data in ${this.sheetType}`);
        return [];
      }
      
      const headers = data[0];
      const rows = data.slice(1);
      
      console.log(`🔍 [getAllData] Headers (${headers.length}):`, headers);
      console.log(`🔍 [getAllData] Data rows: ${rows.length}`);
      
      if (rows.length > 0) {
        console.log(`🔍 [getAllData] Sample raw row data:`, rows[0]);
      }
      
      // Get column mapping for verification
      const columnMapping = this.sheetMapper.getAllMappings();
      console.log(`🔍 [getAllData] Column mapping:`, columnMapping);
      
      const caseStatusColumn = this.sheetMapper.getColumn('caseStatus');
      const caseIdColumn = this.sheetMapper.getColumn('caseId');
      console.log(`🔍 [getAllData] caseStatus column: ${caseStatusColumn}, caseId column: ${caseIdColumn}`);
      
      const parsedData = rows.map((row, index) => {
        const parsed = this.parseRowDataToCase(row, index + 2, headers);
        
        // Log first few parsed rows for debugging
        if (index < 3) {
          console.log(`🔍 [getAllData] Parsed row ${index + 2}:`, {
            caseId: parsed.caseId,
            caseStatus: parsed.caseStatus,
            totalFields: Object.keys(parsed).length,
            sample: Object.fromEntries(Object.entries(parsed).slice(0, 5))
          });
        }
        
        return parsed;
      });
      
      console.log(`🔍 [getAllData] Parsed ${parsedData.length} rows successfully`);
      
      // Check for status distribution in parsed data
      const statusDistribution = {};
      parsedData.forEach(item => {
        const status = item.caseStatus || 'undefined';
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      });
      console.log(`🔍 [getAllData] Status distribution:`, statusDistribution);
      
      return parsedData;
      
    } catch (error) {
      console.error(`🔍 [getAllData] Error in ${this.sheetType}:`, error);
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
      return [];
    }
  }
  
  /**
   * Parse row data to case object
   * @private
   * @param {Array} rowData - Row data array
   * @param {number} rowNumber - Row number
   * @param {Array} headers - Optional headers array
   * @returns {Object} Case object
   */
  parseRowDataToCase(rowData, rowNumber, headers = null) {
    try {
      const caseData = { _row: rowNumber };
      const mapping = this.sheetMapper.getAllMappings();
      
      // Debug logging for first few rows
      if (rowNumber <= 4) {
        console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - Raw data length: ${rowData.length}`);
        console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - Raw data sample:`, rowData.slice(0, 10));
        console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - Field mapping:`, mapping);
      }
      
      Object.keys(mapping).forEach(field => {
        const column = mapping[field];
        const columnIndex = this.columnLetterToIndex(column);
        
        if (rowNumber <= 4) {
          console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - ${field}: column ${column} -> index ${columnIndex}`);
        }
        
        if (columnIndex < rowData.length) {
          caseData[field] = rowData[columnIndex];
          
          if (rowNumber <= 4 && (field === 'caseId' || field === 'caseStatus')) {
            console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - ${field} = "${rowData[columnIndex]}"`);
          }
        } else {
          if (rowNumber <= 4) {
            console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - ${field}: column index ${columnIndex} out of range (max: ${rowData.length - 1})`);
          }
          caseData[field] = null;
        }
      });
      
      if (rowNumber <= 4) {
        console.log(`🔍 [parseRowDataToCase] Row ${rowNumber} - Final parsed data:`, {
          caseId: caseData.caseId,
          caseStatus: caseData.caseStatus,
          totalFields: Object.keys(caseData).length
        });
      }
      
      return caseData;
      
    } catch (error) {
      console.error(`🔍 [parseRowDataToCase] Error parsing row ${rowNumber}:`, error);
      ErrorHandler.logError(error, { rowData, rowNumber }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return { _row: rowNumber };
    }
  }
  
  /**
   * Convert column letter to index
   * @private
   * @param {string} column - Column letter (e.g., "A", "AA")
   * @returns {number} Column index (0-based)
   */
  columnLetterToIndex(column) {
    let index = 0;
    for (let i = 0; i < column.length; i++) {
      index = index * 26 + (column.charCodeAt(i) - 65 + 1);
    }
    return index - 1;
  }
  
  /**
   * Apply filters to data
   * @private
   * @param {Array} data - Data to filter
   * @param {Object} filters - Filters to apply
   * @param {boolean} includeDeleted - Whether to include deleted cases
   * @returns {Array} Filtered data
   */
  applyFilters(data, filters, includeDeleted) {
    console.log(`🔍 [applyFilters] Starting with ${data.length} items for ${this.sheetType}`);
    console.log(`🔍 [applyFilters] Filters to apply:`, filters);
    console.log(`🔍 [applyFilters] includeDeleted:`, includeDeleted);
    
    const result = data.filter((item, index) => {
      // Log sample data structure for first few items
      if (index < 3) {
        console.log(`🔍 [applyFilters] Sample item ${index}:`, {
          caseId: item.caseId,
          caseStatus: item.caseStatus,
          allKeys: Object.keys(item),
          itemSample: Object.fromEntries(Object.entries(item).slice(0, 5))
        });
      }
      
      // Exclude deleted cases unless specifically requested
      if (!includeDeleted && item.caseStatus === 'Deleted') {
        if (index < 5) console.log(`🔍 [applyFilters] Excluding deleted case: ${item.caseId}`);
        return false;
      }
      
      // Apply each filter
      const filterResults = Object.keys(filters).map(field => {
        const filterValue = filters[field];
        const itemValue = item[field];
        
        if (filterValue === null || filterValue === undefined) {
          return { field, result: true, reason: 'filter is null/undefined' };
        }
        
        // Handle different filter types
        if (Array.isArray(filterValue)) {
          const result = filterValue.includes(itemValue);
          return { field, result, reason: `array filter: ${itemValue} in [${filterValue}]`, itemValue, filterValue };
        }
        
        if (typeof filterValue === 'string' && filterValue.includes('*')) {
          // Wildcard matching
          const regex = new RegExp(filterValue.replace(/\*/g, '.*'), 'i');
          const result = regex.test(itemValue);
          return { field, result, reason: `wildcard filter: ${itemValue} matches ${filterValue}`, itemValue, filterValue };
        }
        
        const result = itemValue === filterValue;
        return { field, result, reason: `exact match: ${itemValue} === ${filterValue}`, itemValue, filterValue };
      });
      
      const passesAllFilters = filterResults.every(fr => fr.result);
      
      // Log detailed filtering results for first few items or failed cases
      if (index < 5 || (!passesAllFilters && index < 20)) {
        console.log(`🔍 [applyFilters] Item ${index} (${item.caseId}): ${passesAllFilters ? 'PASS' : 'FAIL'}`);
        filterResults.forEach(fr => {
          console.log(`  - ${fr.field}: ${fr.result ? 'PASS' : 'FAIL'} (${fr.reason})`);
        });
      }
      
      return passesAllFilters;
    });
    
    console.log(`🔍 [applyFilters] Result: ${result.length}/${data.length} items passed filters`);
    
    // Log status distribution for debugging
    const statusDistribution = {};
    data.forEach(item => {
      const status = item.caseStatus || 'undefined';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });
    console.log(`🔍 [applyFilters] Status distribution in source data:`, statusDistribution);
    
    const filteredStatusDistribution = {};
    result.forEach(item => {
      const status = item.caseStatus || 'undefined';
      filteredStatusDistribution[status] = (filteredStatusDistribution[status] || 0) + 1;
    });
    console.log(`🔍 [applyFilters] Status distribution in filtered data:`, filteredStatusDistribution);
    
    return result;
  }
  
  /**
   * Apply sorting to data
   * @private
   * @param {Array} data - Data to sort
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   * @returns {Array} Sorted data
   */
  applySorting(data, sortBy, sortOrder) {
    return data.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  /**
   * Update single field
   * @private
   * @param {number} row - Row number
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  updateField(row, field, value) {
    try {
      const column = this.sheetMapper.getColumn(field);
      if (column) {
        this.worksheet.getRange(`${column}${row}`).setValue(value);
      }
    } catch (error) {
      ErrorHandler.logError(error, { row, field, value }, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
    }
  }
  
  /**
   * Get row data
   * @private
   * @param {number} row - Row number
   * @returns {Array} Row data
   */
  getRowData(row) {
    try {
      return this.worksheet.getRange(row, 1, 1, this.worksheet.getLastColumn()).getValues()[0];
    } catch (error) {
      ErrorHandler.logError(error, { row }, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
      return [];
    }
  }
  
  /**
   * Advanced search with full-text search and complex filters
   * @param {Object} searchParams - Advanced search parameters
   * @returns {Object} Result with matching cases
   */
  async advancedSearch(searchParams = {}) {
    try {
      const {
        query = '',
        filters = {},
        dateRange = {},
        sortBy = 'caseOpenDate',
        sortOrder = 'desc',
        limit = 100,
        offset = 0,
        includeDeleted = false,
        facets = []
      } = searchParams;
      
      // Performance monitoring start
      const startTime = Date.now();
      
      // Get all data with caching
      const cacheKey = `all_data_${this.sheetType}`;
      let allData = this.getCachedData(cacheKey);
      
      if (!allData) {
        allData = await this.getAllData();
        this.setCachedData(cacheKey, allData, 60000); // 1 minute cache
      }
      
      // Apply full-text search
      let searchResults = this.applyFullTextSearch(allData, query);
      
      // Apply advanced filters
      searchResults = this.applyAdvancedFilters(searchResults, filters, includeDeleted);
      
      // Apply date range filters
      searchResults = this.applyDateRangeFilters(searchResults, dateRange);
      
      // Calculate facets if requested
      const facetResults = facets.length > 0 ? this.calculateFacets(searchResults, facets) : {};
      
      // Apply sorting
      searchResults = this.applySorting(searchResults, sortBy, sortOrder);
      
      // Apply pagination
      const totalCount = searchResults.length;
      const paginatedData = searchResults.slice(offset, offset + limit);
      
      // Performance monitoring end
      const executionTime = Date.now() - startTime;
      this.logPerformanceMetric('advancedSearch', executionTime, searchResults.length);
      
      return {
        success: true,
        data: paginatedData,
        totalCount: totalCount,
        facets: facetResults,
        executionTime: executionTime,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to perform advanced search. Please try again.',
          context: { sheetType: this.sheetType, searchParams },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Apply full-text search across all fields
   * @private
   * @param {Array} data - Data to search
   * @param {string} query - Search query
   * @returns {Array} Filtered data
   */
  applyFullTextSearch(data, query) {
    if (!query || query.trim() === '') return data;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return data.filter(item => {
      const searchableText = Object.values(item)
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }
  
  /**
   * Apply advanced filters with operators
   * @private
   * @param {Array} data - Data to filter
   * @param {Object} filters - Advanced filters
   * @param {boolean} includeDeleted - Whether to include deleted cases
   * @returns {Array} Filtered data
   */
  applyAdvancedFilters(data, filters, includeDeleted) {
    return data.filter(item => {
      // Exclude deleted cases unless specifically requested
      if (!includeDeleted && item.caseStatus === 'Deleted') {
        return false;
      }
      
      // Apply each filter with operators
      return Object.keys(filters).every(field => {
        const filterConfig = filters[field];
        const itemValue = item[field];
        
        if (filterConfig === null || filterConfig === undefined) {
          return true;
        }
        
        // Handle different filter operators
        if (typeof filterConfig === 'object' && filterConfig.operator) {
          return this.applyFilterOperator(itemValue, filterConfig.operator, filterConfig.value);
        }
        
        // Handle array (IN operator)
        if (Array.isArray(filterConfig)) {
          return filterConfig.includes(itemValue);
        }
        
        // Handle wildcard matching
        if (typeof filterConfig === 'string' && filterConfig.includes('*')) {
          const regex = new RegExp(filterConfig.replace(/\*/g, '.*'), 'i');
          return regex.test(itemValue);
        }
        
        return itemValue === filterConfig;
      });
    });
  }
  
  /**
   * Apply filter operator
   * @private
   * @param {any} value - Item value
   * @param {string} operator - Filter operator
   * @param {any} filterValue - Filter value
   * @returns {boolean} Whether item matches filter
   */
  applyFilterOperator(value, operator, filterValue) {
    switch (operator) {
      case 'eq': return value === filterValue;
      case 'ne': return value !== filterValue;
      case 'gt': return value > filterValue;
      case 'gte': return value >= filterValue;
      case 'lt': return value < filterValue;
      case 'lte': return value <= filterValue;
      case 'contains': return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'startsWith': return value && value.toString().toLowerCase().startsWith(filterValue.toLowerCase());
      case 'endsWith': return value && value.toString().toLowerCase().endsWith(filterValue.toLowerCase());
      case 'in': return Array.isArray(filterValue) && filterValue.includes(value);
      case 'notIn': return Array.isArray(filterValue) && !filterValue.includes(value);
      default: return value === filterValue;
    }
  }
  
  /**
   * Apply date range filters
   * @private
   * @param {Array} data - Data to filter
   * @param {Object} dateRange - Date range filters
   * @returns {Array} Filtered data
   */
  applyDateRangeFilters(data, dateRange) {
    if (!dateRange || Object.keys(dateRange).length === 0) return data;
    
    return data.filter(item => {
      return Object.keys(dateRange).every(field => {
        const itemDate = new Date(item[field]);
        const range = dateRange[field];
        
        if (!range) return true;
        
        if (range.from && itemDate < new Date(range.from)) return false;
        if (range.to && itemDate > new Date(range.to)) return false;
        
        return true;
      });
    });
  }
  
  /**
   * Calculate facets for search results
   * @private
   * @param {Array} data - Data to calculate facets for
   * @param {Array} facetFields - Fields to calculate facets for
   * @returns {Object} Facet results
   */
  calculateFacets(data, facetFields) {
    const facets = {};
    
    facetFields.forEach(field => {
      const facetCounts = {};
      
      data.forEach(item => {
        const value = item[field];
        if (value !== null && value !== undefined) {
          facetCounts[value] = (facetCounts[value] || 0) + 1;
        }
      });
      
      facets[field] = Object.entries(facetCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([value, count]) => ({ value, count }));
    });
    
    return facets;
  }
  
  /**
   * Batch operations for multiple cases
   * @param {Array} operations - Array of operations to perform
   * @returns {Object} Result with operation statuses
   */
  async batchOperations(operations) {
    try {
      const results = [];
      const startTime = Date.now();
      
      // Group operations by type for optimization
      const operationGroups = this.groupOperationsByType(operations);
      
      // Execute operations in optimal order
      for (const [operationType, ops] of Object.entries(operationGroups)) {
        const batchResults = await this.executeBatchOperationType(operationType, ops);
        results.push(...batchResults);
      }
      
      // Clear cache after batch operations
      this.clearCache();
      
      const executionTime = Date.now() - startTime;
      this.logPerformanceMetric('batchOperations', executionTime, operations.length);
      
      return {
        success: true,
        results: results,
        totalOperations: operations.length,
        executionTime: executionTime,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to execute batch operations. Please try again.',
          context: { sheetType: this.sheetType, operationCount: operations.length },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Group operations by type
   * @private
   * @param {Array} operations - Operations to group
   * @returns {Object} Grouped operations
   */
  groupOperationsByType(operations) {
    const groups = {};
    
    operations.forEach(op => {
      const type = op.type || 'update';
      if (!groups[type]) groups[type] = [];
      groups[type].push(op);
    });
    
    return groups;
  }
  
  /**
   * Execute batch operations of specific type
   * @private
   * @param {string} operationType - Type of operation
   * @param {Array} operations - Operations to execute
   * @returns {Array} Results
   */
  async executeBatchOperationType(operationType, operations) {
    const results = [];
    
    switch (operationType) {
      case 'create':
        for (const op of operations) {
          const result = await this.create(op.data);
          results.push({ ...result, operationId: op.id });
        }
        break;
        
      case 'update':
        for (const op of operations) {
          const result = await this.update(op.caseId, op.data);
          results.push({ ...result, operationId: op.id });
        }
        break;
        
      case 'delete':
        for (const op of operations) {
          const result = await this.delete(op.caseId);
          results.push({ ...result, operationId: op.id });
        }
        break;
        
      default:
        results.push({
          success: false,
          error: true,
          message: `Unknown operation type: ${operationType}`,
          operationId: operations[0]?.id
        });
    }
    
    return results;
  }
  
  /**
   * Get cached data
   * @private
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCachedData(key) {
    if (this.cache.has(key)) {
      const cachedData = this.cache.get(key);
      if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
        return cachedData.data;
      }
    }
    return null;
  }
  
  /**
   * Set cached data
   * @private
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCachedData(key, data, ttl = null) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: ttl || this.cacheTimeout
    });
  }
  
  /**
   * Log performance metric
   * @private
   * @param {string} operation - Operation name
   * @param {number} executionTime - Execution time in milliseconds
   * @param {number} recordCount - Number of records processed
   */
  logPerformanceMetric(operation, executionTime, recordCount = 0) {
    try {
      const metric = {
        operation: operation,
        sheetType: this.sheetType,
        executionTime: executionTime,
        recordCount: recordCount,
        timestamp: new Date().toISOString(),
        user: Session.getActiveUser().getEmail()
      };
      
      console.log(`Performance: ${operation} - ${executionTime}ms - ${recordCount} records`);
      
      // Store in Properties Service for monitoring
      const metrics = JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceMetrics') || '[]');
      metrics.push(metric);
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      PropertiesService.getScriptProperties().setProperty('performanceMetrics', JSON.stringify(metrics));
      
    } catch (error) {
      ErrorHandler.logError(error, { operation, executionTime }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Real-time data synchronization setup
   * @param {Function} callback - Callback function for data changes
   * @returns {Object} Subscription object
   */
  subscribeToDataChanges(callback) {
    try {
      const subscriptionId = Utilities.getUuid();
      
      // Store subscription in Properties Service
      const subscriptions = JSON.parse(PropertiesService.getScriptProperties().getProperty('dataSubscriptions') || '{}');
      subscriptions[subscriptionId] = {
        sheetType: this.sheetType,
        createdAt: new Date().toISOString(),
        lastCheck: new Date().toISOString(),
        callback: callback.toString() // Store as string for persistence
      };
      PropertiesService.getScriptProperties().setProperty('dataSubscriptions', JSON.stringify(subscriptions));
      
      return {
        subscriptionId: subscriptionId,
        unsubscribe: () => this.unsubscribeFromDataChanges(subscriptionId)
      };
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return null;
    }
  }
  
  /**
   * Unsubscribe from data changes
   * @private
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribeFromDataChanges(subscriptionId) {
    try {
      const subscriptions = JSON.parse(PropertiesService.getScriptProperties().getProperty('dataSubscriptions') || '{}');
      delete subscriptions[subscriptionId];
      PropertiesService.getScriptProperties().setProperty('dataSubscriptions', JSON.stringify(subscriptions));
    } catch (error) {
      ErrorHandler.logError(error, { subscriptionId }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get performance metrics
   * @returns {Array} Performance metrics
   */
  getPerformanceMetrics() {
    try {
      return JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceMetrics') || '[]');
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return [];
    }
  }
  
  /**
   * Get next available row with optimization
   * @private
   * @returns {Promise<number>} Next available row number
   */
  async getNextAvailableRowOptimized() {
    try {
      const cacheKey = `next_row_${this.sheetType}`;
      let nextRow = this.getAdvancedCachedData(cacheKey, 'metadata');
      
      if (!nextRow) {
        nextRow = this.worksheet.getLastRow() + 1;
        this.setAdvancedCachedData(cacheKey, nextRow, 'metadata');
      }
      
      return nextRow;
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
      return 2; // Default to row 2 (assuming row 1 is header)
    }
  }
  
  /**
   * Prepare row data for sheet insertion
   * @private
   * @param {Object} caseData - Case data to prepare
   * @returns {Array} Row data array
   */
  prepareRowDataForSheet(caseData) {
    try {
      const mapping = this.sheetMapper.getAllMappings();
      const rowData = [];
      const maxColumn = Math.max(...Object.values(mapping).map(col => this.columnLetterToIndex(col)));
      
      // Initialize array with empty values
      for (let i = 0; i <= maxColumn; i++) {
        rowData[i] = '';
      }
      
      // Fill in the data
      Object.keys(mapping).forEach(field => {
        if (caseData[field] !== undefined) {
          const columnIndex = this.columnLetterToIndex(mapping[field]);
          rowData[columnIndex] = caseData[field];
        }
      });
      
      return rowData;
    } catch (error) {
      ErrorHandler.logError(error, { caseData }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return [];
    }
  }
  
  /**
   * Get cached data from advanced cache
   * @private
   * @param {string} key - Cache key
   * @param {string} cacheType - Type of cache (metadata, data, queries, aggregations)
   * @returns {any} Cached data or null
   */
  getAdvancedCachedData(key, cacheType = 'data') {
    try {
      if (!this.optimizationSettings.enableAdvancedCaching) return null;
      
      const cache = this.getCacheByType(cacheType);
      if (cache && cache.has(key)) {
        const cachedData = cache.get(key);
        const ttl = this.cacheSettings[cacheType]?.ttl || this.cacheTimeout;
        
        if (Date.now() - cachedData.timestamp < ttl) {
          this.performanceStats.cacheHits++;
          return cachedData.data;
        } else {
          cache.delete(key); // Remove expired entry
        }
      }
      
      return null;
    } catch (error) {
      ErrorHandler.logError(error, { key, cacheType }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return null;
    }
  }
  
  /**
   * Set cached data in advanced cache
   * @private
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} cacheType - Type of cache (metadata, data, queries, aggregations)
   */
  setAdvancedCachedData(key, data, cacheType = 'data') {
    try {
      if (!this.optimizationSettings.enableAdvancedCaching) return;
      
      const cache = this.getCacheByType(cacheType);
      if (cache) {
        cache.set(key, {
          data: data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      ErrorHandler.logError(error, { key, cacheType }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get cache by type
   * @private
   * @param {string} cacheType - Type of cache
   * @returns {Map} Cache map
   */
  getCacheByType(cacheType) {
    switch (cacheType) {
      case 'metadata': return this.metadataCache;
      case 'data': return this.advancedCache;
      case 'queries': return this.queryCache;
      case 'aggregations': return this.advancedCache; // Share with data cache
      default: return this.cache;
    }
  }
  
  /**
   * Clear advanced cache
   * @private
   * @param {Array} cacheTypes - Types of cache to clear
   */
  clearAdvancedCache(cacheTypes = ['data', 'queries']) {
    try {
      if (!this.optimizationSettings.enableAdvancedCaching) return;
      
      cacheTypes.forEach(cacheType => {
        const cache = this.getCacheByType(cacheType);
        if (cache) {
          cache.clear();
        }
      });
    } catch (error) {
      ErrorHandler.logError(error, { cacheTypes }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get performance optimization statistics
   * @returns {Object} Performance optimization statistics
   */
  getOptimizationStats() {
    try {
      const totalOperations = this.performanceStats.totalOperations || 1;
      const reductionPercentage = Math.round((this.performanceStats.apiCallsReduced / totalOperations) * 100);
      
      return {
        ...this.performanceStats,
        reductionPercentage: reductionPercentage,
        cacheHitRate: Math.round((this.performanceStats.cacheHits / totalOperations) * 100),
        optimizationSettings: this.optimizationSettings,
        cacheStats: {
          mainCache: this.cache.size,
          advancedCache: this.advancedCache?.size || 0,
          metadataCache: this.metadataCache?.size || 0,
          queryCache: this.queryCache?.size || 0
        }
      };
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return this.performanceStats;
    }
  }
  
  /**
   * Configure performance optimization settings
   * @param {Object} settings - Optimization settings
   * @returns {Object} Result
   */
  configureOptimization(settings) {
    try {
      const allowedSettings = [
        'enableBatchProcessing',
        'enableAdvancedCaching',
        'enablePerformanceMonitoring',
        'maxBatchSize',
        'cacheStrategy'
      ];
      
      const updatedSettings = {};
      allowedSettings.forEach(setting => {
        if (settings[setting] !== undefined) {
          this.optimizationSettings[setting] = settings[setting];
          updatedSettings[setting] = settings[setting];
        }
      });
      
      // Re-initialize caching if settings changed
      if (settings.enableAdvancedCaching !== undefined) {
        if (settings.enableAdvancedCaching) {
          this.initializeAdvancedCache();
        } else {
          this.clearAdvancedCache(['data', 'queries', 'metadata']);
        }
      }
      
      return {
        success: true,
        updatedSettings: updatedSettings,
        currentSettings: this.optimizationSettings
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to configure optimization settings.',
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
  
  /**
   * Perform batch read with advanced optimization
   * @param {Array} caseIds - Array of case IDs to read
   * @returns {Object} Batch read results
   */
  async batchRead(caseIds) {
    const operationId = Utilities.getUuid();
    const tracker = this.performanceManager?.startOperation(operationId, 'batchRead', {
      sheetType: this.sheetType,
      caseCount: caseIds.length
    });
    
    try {
      if (!this.optimizationSettings.enableBatchProcessing) {
        // Fallback to individual reads
        const results = [];
        for (const caseId of caseIds) {
          const result = await this.read(caseId);
          results.push(result);
        }
        return { success: true, data: results };
      }
      
      // Separate cached and uncached case IDs
      const { cachedResults, uncachedIds } = this.separateCachedCases(caseIds);
      
      tracker?.addMetric('cacheHits', cachedResults.length);
      tracker?.addMetric('cacheMisses', uncachedIds.length);
      
      let uncachedResults = [];
      if (uncachedIds.length > 0) {
        // Use batch processor for uncached cases
        const readRequests = uncachedIds.map(caseId => ({
          spreadsheetId: this.spreadsheetId,
          sheetName: this.sheetType,
          range: 'A:Z', // Full row range
          caseId: caseId
        }));
        
        const batchResult = await this.batchProcessor.batchRead(readRequests);
        uncachedResults = batchResult.data || [];
        
        // Cache the results
        uncachedResults.forEach(result => {
          if (result.success && result.data) {
            const cacheKey = `case_${this.sheetType}_${result.caseId}`;
            this.setAdvancedCachedData(cacheKey, result.data, 'data');
          }
        });
      }
      
      // Combine cached and uncached results
      const allResults = [...cachedResults, ...uncachedResults];
      
      // Update performance stats
      this.performanceStats.totalOperations++;
      this.performanceStats.batchOperations++;
      const apiCallReduction = Math.max(0, caseIds.length - Math.ceil(uncachedIds.length / this.optimizationSettings.maxBatchSize));
      this.performanceStats.apiCallsReduced += apiCallReduction;
      
      const endResult = tracker?.end();
      
      return {
        success: true,
        data: allResults,
        totalRequested: caseIds.length,
        cacheHits: cachedResults.length,
        apiCalls: Math.ceil(uncachedIds.length / this.optimizationSettings.maxBatchSize),
        performance: {
          responseTime: endResult?.responseTime || 0,
          apiCallsReduced: apiCallReduction
        }
      };
      
    } catch (error) {
      tracker?.end();
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to execute batch read operation.',
          context: { sheetType: this.sheetType, caseCount: caseIds.length },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Separate cached and uncached cases
   * @private
   * @param {Array} caseIds - Case IDs to check
   * @returns {Object} Separated results
   */
  separateCachedCases(caseIds) {
    const cachedResults = [];
    const uncachedIds = [];
    
    caseIds.forEach(caseId => {
      const cacheKey = `case_${this.sheetType}_${caseId}`;
      const cached = this.getAdvancedCachedData(cacheKey, 'data');
      
      if (cached) {
        cachedResults.push({
          success: true,
          data: cached,
          caseId: caseId,
          fromCache: true
        });
      } else {
        uncachedIds.push(caseId);
      }
    });
    
    return { cachedResults, uncachedIds };
  }
  
  /**
   * ダッシュボード専用: アクティブケース（"Assigned"ステータス）を取得
   * @param {Object} filters - フィルター条件
   * @returns {Object} アクティブケースのリスト
   */
  async getActiveCases(filters = {}) {
    const operationId = Utilities.getUuid();
    const tracker = this.performanceManager?.startOperation(operationId, 'getActiveCases', {
      sheetType: this.sheetType,
      filters: Object.keys(filters)
    });
    
    try {
      // キャッシュキーを生成
      const cacheKey = `active_cases_${this.sheetType}_${JSON.stringify(filters)}`;
      let cachedResults = this.getAdvancedCachedData(cacheKey, 'queries');
      
      if (cachedResults) {
        tracker?.addMetric('cacheHit', true);
        return {
          success: true,
          data: cachedResults.data,
          totalCount: cachedResults.totalCount,
          fromCache: true,
          lastUpdated: cachedResults.lastUpdated
        };
      }
      
      // アクティブケースを検索（Assignedステータス）
      const searchCriteria = {
        filters: {
          caseStatus: 'Assigned',
          ...filters // 追加フィルターを適用
        },
        sortBy: 'caseOpenDate',
        sortOrder: 'desc',
        limit: 1000, // 大きめの制限
        includeDeleted: false
      };
      
      const searchResult = await this.search(searchCriteria);
      
      if (!searchResult.success) {
        throw new Error('Failed to search active cases');
      }
      
      // 結果をキャッシュ（2分間）
      const cacheData = {
        data: JSON.stringify(searchResult.data),
        totalCount: searchResult.totalCount,
        lastUpdated: new Date().toISOString()
      };
      this.setAdvancedCachedData(cacheKey, cacheData, 'queries');
      
      // パフォーマンス追跡
      const endResult = tracker?.end();
      
      return {
        success: true,
        data: searchResult.data,
        totalCount: searchResult.totalCount,
        fromCache: false,
        lastUpdated: cacheData.lastUpdated,
        performance: {
          responseTime: endResult?.responseTime || 0,
          recordsProcessed: searchResult.data.length
        }
      };
      
    } catch (error) {
      tracker?.end();
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to load active cases for dashboard.',
          context: { sheetType: this.sheetType, filters },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * ダッシュボード専用: ケースの除外設定を更新
   * @param {string} caseId - ケースID
   * @param {string} exclusionType - 除外タイプ (bug, l2Consulted, tsConsulted, idtBlocked, payreqBlocked)
   * @param {boolean} isEnabled - 除外設定の有効/無効
   * @returns {Object} 更新結果
   */
  async updateCaseExclusion(caseId, exclusionType, isEnabled) {
    const operationId = Utilities.getUuid();
    const tracker = this.performanceManager?.startOperation(operationId, 'updateCaseExclusion', {
      sheetType: this.sheetType,
      caseId: caseId,
      exclusionType: exclusionType
    });
    
    try {
      if (!caseId || !exclusionType) {
        throw new Error('Case ID and exclusion type are required');
      }
      
      // 有効な除外タイプかチェック
      const validExclusionTypes = ['bug', 'l2Consulted', 'tsConsulted', 'idtBlocked', 'payreqBlocked'];
      if (!validExclusionTypes.includes(exclusionType)) {
        throw new Error(`Invalid exclusion type: ${exclusionType}`);
      }
      
      // 除外設定値を準備（1 = 有効, 0 = 無効）
      const exclusionValue = isEnabled ? '1' : '0';
      
      // ケースを更新
      const updateData = {};
      updateData[exclusionType] = exclusionValue;
      
      const updateResult = await this.update(caseId, updateData);
      
      if (!updateResult.success) {
        throw new Error(`Failed to update case exclusion: ${updateResult.message || 'Unknown error'}`);
      }
      
      // アクティブケースキャッシュをクリア
      this.clearAdvancedCache(['queries']);
      
      // パフォーマンス追跡
      const endResult = tracker?.end();
      
      return {
        success: true,
        caseId: caseId,
        exclusionType: exclusionType,
        isEnabled: isEnabled,
        updatedAt: new Date().toISOString(),
        performance: {
          responseTime: endResult?.responseTime || 0
        }
      };
      
    } catch (error) {
      tracker?.end();
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: `Failed to update case exclusion for ${caseId}.`,
          context: { sheetType: this.sheetType, caseId, exclusionType, isEnabled },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * ダッシュボード専用: 複数シートからアクティブケースを一括取得
   * @param {Array} sheetTypes - 取得対象のシートタイプ配列
   * @param {Object} filters - フィルター条件
   * @returns {Object} 全シートのアクティブケース
   */
  static async getAllActiveCases(sheetTypes = [], filters = {}) {
    try {
      const startTime = Date.now();
      const results = {};
      let totalCases = 0;
      
      // デフォルトのシートタイプ
      if (sheetTypes.length === 0) {
        sheetTypes = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
      }
      
      // 各シートからアクティブケースを並行取得
      const promises = sheetTypes.map(async (sheetType) => {
        try {
          const caseModel = new CaseModel(sheetType);
          const activeCases = await caseModel.getActiveCases(filters);
          return {
            sheetType: sheetType,
            result: activeCases
          };
        } catch (error) {
          ErrorHandler.logError(error, { sheetType }, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
          return {
            sheetType: sheetType,
            result: { success: false, error: error.message, data: [] }
          };
        }
      });
      
      const sheetResults = await Promise.all(promises);
      
      // 結果をまとめる
      sheetResults.forEach(({ sheetType, result }) => {
        results[sheetType] = result;
        if (result.success && result.data) {
          totalCases += result.data.length;
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: results,
        totalCases: totalCases,
        sheetsProcessed: sheetTypes.length,
        executionTime: executionTime,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to load active cases from all sheets.',
          context: { sheetTypes, filters },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * ダッシュボード専用: 統計情報を取得
   * @param {Array} sheetTypes - 対象シートタイプ
   * @returns {Object} 統計情報
   */
  static async getDashboardStatistics(sheetTypes = []) {
    try {
      const startTime = Date.now();
      
      // デフォルトのシートタイプ
      if (sheetTypes.length === 0) {
        sheetTypes = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
      }
      
      const statistics = {
        totalActiveCases: 0,
        criticalCases: 0,
        warningCases: 0,
        missedCases: 0,
        bySheet: {},
        byChannel: {},
        bySegment: {},
        lastUpdated: new Date().toISOString()
      };
      
      // 各シートから統計を取得
      for (const sheetType of sheetTypes) {
        try {
          const caseModel = new CaseModel(sheetType);
          const activeCases = await caseModel.getActiveCases();
          
          if (activeCases.success && activeCases.data) {
            const cases = activeCases.data;
            statistics.totalActiveCases += cases.length;
            statistics.bySheet[sheetType] = cases.length;
            
            // チャネル別統計
            const channel = CaseModel.getChannelFromSheetType(sheetType);
            statistics.byChannel[channel] = (statistics.byChannel[channel] || 0) + cases.length;
            
            // セグメント別統計
            cases.forEach(caseData => {
              const segment = caseData.incomingSegment || 'Unknown';
              statistics.bySegment[segment] = (statistics.bySegment[segment] || 0) + 1;
              
              // 緊急度分類（簡易版）
              const openTime = new Date(`${caseData.caseOpenDate} ${caseData.caseOpenTime}`);
              const hoursElapsed = (Date.now() - openTime.getTime()) / (1000 * 60 * 60);
              
              if (hoursElapsed > 72) statistics.missedCases++;
              else if (hoursElapsed > 3) statistics.warningCases++;
              else if (hoursElapsed > 2) statistics.criticalCases++;
            });
          }
        } catch (error) {
          ErrorHandler.logError(error, { sheetType }, ErrorSeverity.LOW, ErrorTypes.SPREADSHEET_API);
          statistics.bySheet[sheetType] = 0;
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: statistics,
        executionTime: executionTime
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to load dashboard statistics.',
          context: { sheetTypes },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * シートタイプからチャネルを取得（静的メソッド）
   * @param {string} sheetType - シートタイプ
   * @returns {string} チャネル名
   */
  static getChannelFromSheetType(sheetType) {
    if (sheetType.includes('Email')) return 'Email';
    if (sheetType.includes('Chat')) return 'Chat';
    if (sheetType.includes('Phone')) return 'Phone';
    return 'Unknown';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CaseModel };
}
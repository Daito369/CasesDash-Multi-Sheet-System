/**
 * CasesDash - Batch Processor
 * Advanced batch processing system for optimizing Spreadsheet API calls
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * BatchProcessor class for optimizing Spreadsheet API operations
 * Provides intelligent batching, caching, and quota management
 */
class BatchProcessor {
  
  /**
   * Constructor
   * @param {PerformanceManager} performanceManager - Performance manager instance
   */
  constructor(performanceManager = null) {
    this.performanceManager = performanceManager || new PerformanceManager();
    this.batchQueue = new Map();
    this.pendingOperations = new Map();
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.batchSize = 100; // Maximum operations per batch
    this.batchDelay = 100; // Milliseconds to wait before processing batch
    this.rateLimitDelay = 200; // Milliseconds between API calls
    this.maxRetries = 3;
    
    // Batch processing settings
    this.batchSettings = {
      read: { maxSize: 500, delay: 50 },
      write: { maxSize: 100, delay: 100 },
      update: { maxSize: 200, delay: 75 },
      delete: { maxSize: 50, delay: 150 }
    };
    
    this.initializeBatchProcessor();
  }
  
  /**
   * Initialize batch processor
   * @private
   */
  initializeBatchProcessor() {
    try {
      // Set up periodic cache cleanup
      this.schedulePeriodicCleanup();
      
      console.log('BatchProcessor initialized successfully');
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Schedule periodic cleanup of cache and pending operations
   * @private
   */
  schedulePeriodicCleanup() {
    try {
      // Clean up expired cache entries
      setInterval(() => {
        this.cleanupExpiredCache();
      }, 60000); // Every minute
      
      // Process pending batch operations
      setInterval(() => {
        this.processPendingBatches();
      }, this.batchDelay);
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Batch read operations with intelligent caching
   * @param {Array} readRequests - Array of read requests
   * @returns {Promise<Object>} Batch read results
   */
  async batchRead(readRequests) {
    try {
      const operationId = Utilities.getUuid();
      const tracker = this.performanceManager.startOperation(operationId, 'batchRead', {
        requestCount: readRequests.length
      });
      
      // Separate cached and uncached requests
      const { cachedResults, uncachedRequests } = this.separateCachedRequests(readRequests);
      
      tracker.addMetric('cacheHits', cachedResults.length);
      tracker.addMetric('cacheMisses', uncachedRequests.length);
      
      let batchResults = [];
      
      if (uncachedRequests.length > 0) {
        // Process uncached requests in optimized batches
        batchResults = await this.executeReadBatches(uncachedRequests);
        
        // Cache the results
        this.cacheReadResults(batchResults);
      }
      
      // Combine cached and new results
      const allResults = [...cachedResults, ...batchResults];
      
      const endResult = tracker.end();
      
      return {
        success: true,
        data: allResults,
        totalRequests: readRequests.length,
        cacheHits: cachedResults.length,
        apiCalls: Math.ceil(uncachedRequests.length / this.batchSettings.read.maxSize),
        executionTime: endResult?.responseTime || 0
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to execute batch read operations.',
          context: { requestCount: readRequests.length },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Batch write operations with conflict resolution
   * @param {Array} writeRequests - Array of write requests
   * @returns {Promise<Object>} Batch write results
   */
  async batchWrite(writeRequests) {
    try {
      const operationId = Utilities.getUuid();
      const tracker = this.performanceManager.startOperation(operationId, 'batchWrite', {
        requestCount: writeRequests.length
      });
      
      // Validate and prepare write requests
      const validatedRequests = this.validateWriteRequests(writeRequests);
      tracker.addMetric('validRequests', validatedRequests.length);
      tracker.addMetric('invalidRequests', writeRequests.length - validatedRequests.length);
      
      if (validatedRequests.length === 0) {
        throw new Error('No valid write requests found');
      }
      
      // Group requests by spreadsheet and sheet
      const groupedRequests = this.groupWriteRequestsBySheet(validatedRequests);
      
      const results = [];
      
      // Process each group with optimized batching
      for (const [sheetKey, requests] of Object.entries(groupedRequests)) {
        const sheetResults = await this.executeWriteBatchesForSheet(sheetKey, requests);
        results.push(...sheetResults);
      }
      
      // Clear related cache entries
      this.invalidateWriteCache(writeRequests);
      
      const endResult = tracker.end();
      
      return {
        success: true,
        data: results,
        totalRequests: writeRequests.length,
        successfulWrites: results.filter(r => r.success).length,
        failedWrites: results.filter(r => !r.success).length,
        executionTime: endResult?.responseTime || 0
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to execute batch write operations.',
          context: { requestCount: writeRequests.length },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Batch update operations with optimized range handling
   * @param {Array} updateRequests - Array of update requests
   * @returns {Promise<Object>} Batch update results
   */
  async batchUpdate(updateRequests) {
    try {
      const operationId = Utilities.getUuid();
      const tracker = this.performanceManager.startOperation(operationId, 'batchUpdate', {
        requestCount: updateRequests.length
      });
      
      // Optimize update ranges
      const optimizedRequests = this.optimizeUpdateRanges(updateRequests);
      tracker.addMetric('originalRequests', updateRequests.length);
      tracker.addMetric('optimizedRequests', optimizedRequests.length);
      
      // Group by sheet for batch processing
      const groupedRequests = this.groupUpdateRequestsBySheet(optimizedRequests);
      
      const results = [];
      
      // Process each sheet's updates
      for (const [sheetKey, requests] of Object.entries(groupedRequests)) {
        const sheetResults = await this.executeUpdateBatchesForSheet(sheetKey, requests);
        results.push(...sheetResults);
      }
      
      // Clear related cache entries
      this.invalidateUpdateCache(updateRequests);
      
      const endResult = tracker.end();
      
      return {
        success: true,
        data: results,
        totalRequests: updateRequests.length,
        optimizedRequests: optimizedRequests.length,
        successfulUpdates: results.filter(r => r.success).length,
        executionTime: endResult?.responseTime || 0
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to execute batch update operations.',
          context: { requestCount: updateRequests.length },
          type: ErrorTypes.SPREADSHEET_API
        }
      );
    }
  }
  
  /**
   * Separate cached and uncached read requests
   * @private
   * @param {Array} requests - Read requests
   * @returns {Object} Separated requests
   */
  separateCachedRequests(requests) {
    const cachedResults = [];
    const uncachedRequests = [];
    
    requests.forEach(request => {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        cachedResults.push({
          ...request,
          data: cached,
          fromCache: true
        });
      } else {
        uncachedRequests.push(request);
      }
    });
    
    return { cachedResults, uncachedRequests };
  }
  
  /**
   * Execute read batches with rate limiting
   * @private
   * @param {Array} requests - Uncached read requests
   * @returns {Promise<Array>} Read results
   */
  async executeReadBatches(requests) {
    const results = [];
    const batchSize = this.batchSettings.read.maxSize;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      try {
        // Apply rate limiting
        if (i > 0) {
          Utilities.sleep(this.batchSettings.read.delay);
        }
        
        // Track API call
        this.performanceManager.trackApiCall('SpreadsheetApp', 'batchRead');
        
        const batchResults = await this.executeSingleReadBatch(batch);
        results.push(...batchResults);
        
      } catch (error) {
        ErrorHandler.logError(error, { batchIndex: i, batchSize: batch.length }, ErrorSeverity.MEDIUM, ErrorTypes.SPREADSHEET_API);
        
        // Add error results for failed batch
        batch.forEach(request => {
          results.push({
            ...request,
            success: false,
            error: error.message
          });
        });
      }
    }
    
    return results;
  }
  
  /**
   * Execute single read batch
   * @private
   * @param {Array} batch - Batch of read requests
   * @returns {Promise<Array>} Batch results
   */
  async executeSingleReadBatch(batch) {
    const results = [];
    
    // Group by spreadsheet for efficiency
    const groupedBatch = this.groupRequestsBySpreadsheet(batch);
    
    for (const [spreadsheetId, requests] of Object.entries(groupedBatch)) {
      try {
        const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        
        // Process requests for this spreadsheet
        for (const request of requests) {
          const sheet = spreadsheet.getSheetByName(request.sheetName);
          if (!sheet) {
            results.push({
              ...request,
              success: false,
              error: `Sheet '${request.sheetName}' not found`
            });
            continue;
          }
          
          const range = sheet.getRange(request.range);
          const data = range.getValues();
          
          results.push({
            ...request,
            success: true,
            data: data
          });
        }
        
      } catch (error) {
        // Handle spreadsheet-level errors
        requests.forEach(request => {
          results.push({
            ...request,
            success: false,
            error: error.message
          });
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validate write requests
   * @private
   * @param {Array} requests - Write requests to validate
   * @returns {Array} Valid write requests
   */
  validateWriteRequests(requests) {
    return requests.filter(request => {
      try {
        // Check required fields
        if (!request.spreadsheetId || !request.sheetName || !request.range || !request.values) {
          return false;
        }
        
        // Validate range format
        if (!/^[A-Z]+\d+(:[A-Z]+\d+)?$/.test(request.range)) {
          return false;
        }
        
        // Validate values is array
        if (!Array.isArray(request.values)) {
          return false;
        }
        
        return true;
      } catch (error) {
        return false;
      }
    });
  }
  
  /**
   * Group write requests by sheet
   * @private
   * @param {Array} requests - Write requests
   * @returns {Object} Grouped requests
   */
  groupWriteRequestsBySheet(requests) {
    const grouped = {};
    
    requests.forEach(request => {
      const key = `${request.spreadsheetId}:${request.sheetName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(request);
    });
    
    return grouped;
  }
  
  /**
   * Execute write batches for a specific sheet
   * @private
   * @param {string} sheetKey - Sheet identifier
   * @param {Array} requests - Write requests for the sheet
   * @returns {Promise<Array>} Write results
   */
  async executeWriteBatchesForSheet(sheetKey, requests) {
    const [spreadsheetId, sheetName] = sheetKey.split(':');
    const results = [];
    const batchSize = this.batchSettings.write.maxSize;
    
    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        throw new Error(`Sheet '${sheetName}' not found`);
      }
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        // Apply rate limiting
        if (i > 0) {
          Utilities.sleep(this.batchSettings.write.delay);
        }
        
        // Track API call
        this.performanceManager.trackApiCall('SpreadsheetApp', 'batchWrite');
        
        const batchResults = await this.executeSingleWriteBatch(sheet, batch);
        results.push(...batchResults);
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { sheetKey, requestCount: requests.length }, ErrorSeverity.HIGH, ErrorTypes.SPREADSHEET_API);
      
      // Add error results for all requests
      requests.forEach(request => {
        results.push({
          ...request,
          success: false,
          error: error.message
        });
      });
    }
    
    return results;
  }
  
  /**
   * Execute single write batch
   * @private
   * @param {Sheet} sheet - Spreadsheet sheet
   * @param {Array} batch - Batch of write requests
   * @returns {Promise<Array>} Batch results
   */
  async executeSingleWriteBatch(sheet, batch) {
    const results = [];
    
    // Sort requests by range for optimal processing
    const sortedBatch = this.sortRequestsByRange(batch);
    
    for (const request of sortedBatch) {
      try {
        const range = sheet.getRange(request.range);
        range.setValues(request.values);
        
        results.push({
          ...request,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          ...request,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Optimize update ranges by merging adjacent ranges
   * @private
   * @param {Array} requests - Update requests
   * @returns {Array} Optimized requests
   */
  optimizeUpdateRanges(requests) {
    // Group by sheet
    const groupedRequests = this.groupUpdateRequestsBySheet(requests);
    const optimizedRequests = [];
    
    Object.values(groupedRequests).forEach(sheetRequests => {
      // Sort by row and column
      const sortedRequests = this.sortRequestsByRange(sheetRequests);
      
      // Merge adjacent ranges where possible
      const mergedRequests = this.mergeAdjacentRanges(sortedRequests);
      optimizedRequests.push(...mergedRequests);
    });
    
    return optimizedRequests;
  }
  
  /**
   * Group update requests by sheet
   * @private
   * @param {Array} requests - Update requests
   * @returns {Object} Grouped requests
   */
  groupUpdateRequestsBySheet(requests) {
    const grouped = {};
    
    requests.forEach(request => {
      const key = `${request.spreadsheetId}:${request.sheetName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(request);
    });
    
    return grouped;
  }
  
  /**
   * Execute update batches for a specific sheet
   * @private
   * @param {string} sheetKey - Sheet identifier
   * @param {Array} requests - Update requests for the sheet
   * @returns {Promise<Array>} Update results
   */
  async executeUpdateBatchesForSheet(sheetKey, requests) {
    const [spreadsheetId, sheetName] = sheetKey.split(':');
    const results = [];
    const batchSize = this.batchSettings.update.maxSize;
    
    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        throw new Error(`Sheet '${sheetName}' not found`);
      }
      
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        // Apply rate limiting
        if (i > 0) {
          Utilities.sleep(this.batchSettings.update.delay);
        }
        
        // Track API call
        this.performanceManager.trackApiCall('SpreadsheetApp', 'batchUpdate');
        
        const batchResults = await this.executeSingleUpdateBatch(sheet, batch);
        results.push(...batchResults);
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { sheetKey, requestCount: requests.length }, ErrorSeverity.HIGH, ErrorTypes.SPREADSHEET_API);
      
      // Add error results for all requests
      requests.forEach(request => {
        results.push({
          ...request,
          success: false,
          error: error.message
        });
      });
    }
    
    return results;
  }
  
  /**
   * Execute single update batch
   * @private
   * @param {Sheet} sheet - Spreadsheet sheet
   * @param {Array} batch - Batch of update requests
   * @returns {Promise<Array>} Batch results
   */
  async executeSingleUpdateBatch(sheet, batch) {
    const results = [];
    
    for (const request of batch) {
      try {
        const range = sheet.getRange(request.range);
        
        if (request.values) {
          range.setValues(request.values);
        }
        
        if (request.format) {
          this.applyRangeFormatting(range, request.format);
        }
        
        results.push({
          ...request,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          ...request,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Apply formatting to range
   * @private
   * @param {Range} range - Spreadsheet range
   * @param {Object} format - Format configuration
   */
  applyRangeFormatting(range, format) {
    try {
      if (format.backgroundColor) {
        range.setBackground(format.backgroundColor);
      }
      
      if (format.fontColor) {
        range.setFontColor(format.fontColor);
      }
      
      if (format.fontWeight) {
        range.setFontWeight(format.fontWeight);
      }
      
      if (format.numberFormat) {
        range.setNumberFormat(format.numberFormat);
      }
      
      if (format.horizontalAlignment) {
        range.setHorizontalAlignment(format.horizontalAlignment);
      }
      
      if (format.verticalAlignment) {
        range.setVerticalAlignment(format.verticalAlignment);
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { format }, ErrorSeverity.LOW, ErrorTypes.SPREADSHEET_API);
    }
  }
  
  /**
   * Group requests by spreadsheet
   * @private
   * @param {Array} requests - Requests to group
   * @returns {Object} Grouped requests
   */
  groupRequestsBySpreadsheet(requests) {
    const grouped = {};
    
    requests.forEach(request => {
      const spreadsheetId = request.spreadsheetId;
      if (!grouped[spreadsheetId]) {
        grouped[spreadsheetId] = [];
      }
      grouped[spreadsheetId].push(request);
    });
    
    return grouped;
  }
  
  /**
   * Sort requests by range for optimal processing
   * @private
   * @param {Array} requests - Requests to sort
   * @returns {Array} Sorted requests
   */
  sortRequestsByRange(requests) {
    return requests.sort((a, b) => {
      // Extract row and column from range
      const aMatch = a.range.match(/^([A-Z]+)(\d+)/);
      const bMatch = b.range.match(/^([A-Z]+)(\d+)/);
      
      if (!aMatch || !bMatch) return 0;
      
      const aRow = parseInt(aMatch[2]);
      const bRow = parseInt(bMatch[2]);
      const aCol = this.columnLetterToNumber(aMatch[1]);
      const bCol = this.columnLetterToNumber(bMatch[1]);
      
      // Sort by row first, then by column
      if (aRow !== bRow) {
        return aRow - bRow;
      }
      return aCol - bCol;
    });
  }
  
  /**
   * Convert column letter to number
   * @private
   * @param {string} column - Column letter
   * @returns {number} Column number
   */
  columnLetterToNumber(column) {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 64);
    }
    return result;
  }
  
  /**
   * Merge adjacent ranges where possible
   * @private
   * @param {Array} requests - Sorted requests
   * @returns {Array} Merged requests
   */
  mergeAdjacentRanges(requests) {
    // For now, return as-is. Complex range merging would require
    // sophisticated logic to handle different value types and formats
    return requests;
  }
  
  /**
   * Generate cache key for request
   * @private
   * @param {Object} request - Request object
   * @returns {string} Cache key
   */
  generateCacheKey(request) {
    return `${request.spreadsheetId}:${request.sheetName}:${request.range}`;
  }
  
  /**
   * Get cached data
   * @private
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * Cache read results
   * @private
   * @param {Array} results - Read results to cache
   */
  cacheReadResults(results) {
    results.forEach(result => {
      if (result.success && result.data) {
        const key = this.generateCacheKey(result);
        this.cache.set(key, {
          data: result.data,
          timestamp: Date.now()
        });
      }
    });
  }
  
  /**
   * Invalidate write cache
   * @private
   * @param {Array} requests - Write requests
   */
  invalidateWriteCache(requests) {
    requests.forEach(request => {
      const key = this.generateCacheKey(request);
      this.cache.delete(key);
    });
  }
  
  /**
   * Invalidate update cache
   * @private
   * @param {Array} requests - Update requests
   */
  invalidateUpdateCache(requests) {
    requests.forEach(request => {
      const key = this.generateCacheKey(request);
      this.cache.delete(key);
    });
  }
  
  /**
   * Clean up expired cache entries
   * @private
   */
  cleanupExpiredCache() {
    try {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Process pending batch operations
   * @private
   */
  processPendingBatches() {
    try {
      // Implementation for processing queued batch operations
      // This would handle delayed batch processing for optimization
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get batch processor statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    try {
      return {
        cacheSize: this.cache.size,
        pendingOperations: this.pendingOperations.size,
        queuedBatches: this.batchQueue.size,
        cacheHitRate: this.calculateCacheHitRate(),
        averageBatchSize: this.calculateAverageBatchSize(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return {};
    }
  }
  
  /**
   * Calculate cache hit rate
   * @private
   * @returns {number} Cache hit rate percentage
   */
  calculateCacheHitRate() {
    // This would be calculated based on historical data
    // For now, return 0 as placeholder
    return 0;
  }
  
  /**
   * Calculate average batch size
   * @private
   * @returns {number} Average batch size
   */
  calculateAverageBatchSize() {
    // This would be calculated based on historical data
    // For now, return configured batch size
    return this.batchSize;
  }
  
  /**
   * Clear all caches and reset processor
   * @returns {Object} Result
   */
  clearAll() {
    try {
      this.cache.clear();
      this.batchQueue.clear();
      this.pendingOperations.clear();
      
      return {
        success: true,
        message: 'BatchProcessor cleared successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to clear BatchProcessor.',
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BatchProcessor };
}
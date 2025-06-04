/**
 * CasesDash - Performance Manager
 * Comprehensive performance monitoring and optimization system
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * PerformanceManager class for monitoring and optimizing system performance
 * Provides quota management, response time monitoring, and memory optimization
 */
class PerformanceManager {
  
  /**
   * Constructor
   */
  constructor() {
    this.metrics = new Map();
    this.quotaCounters = new Map();
    this.memoryUsage = new Map();
    this.alertThresholds = {
      responseTime: 2000, // 2 seconds
      quotaUsage: 80, // 80% of quota
      memoryUsage: 100 * 1024 * 1024, // 100MB
      errorRate: 5 // 5% error rate
    };
    this.performanceCache = new Map();
    this.startTime = Date.now();
    
    this.initializePerformanceTracking();
  }
  
  /**
   * Initialize performance tracking
   * @private
   */
  initializePerformanceTracking() {
    try {
      // Load existing metrics from Properties Service
      const savedMetrics = PropertiesService.getScriptProperties().getProperty('performanceMetrics');
      if (savedMetrics) {
        const metrics = JSON.parse(savedMetrics);
        metrics.forEach(metric => {
          this.metrics.set(metric.id, metric);
        });
      }
      
      // Initialize quota counters
      this.resetQuotaCounters();
      
      console.log('PerformanceManager initialized successfully');
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Start performance monitoring for an operation
   * @param {string} operationId - Unique operation identifier
   * @param {string} operationType - Type of operation
   * @param {Object} context - Additional context
   * @returns {Object} Performance tracker
   */
  startOperation(operationId, operationType, context = {}) {
    try {
      const startTime = Date.now();
      const memoryBefore = this.getMemoryUsage();
      
      const tracker = {
        operationId: operationId,
        operationType: operationType,
        startTime: startTime,
        memoryBefore: memoryBefore,
        context: context,
        quotaBefore: this.getCurrentQuotaUsage(),
        apiCallsBefore: this.getApiCallCount()
      };
      
      this.metrics.set(operationId, tracker);
      
      return {
        operationId: operationId,
        end: () => this.endOperation(operationId),
        addMetric: (key, value) => this.addOperationMetric(operationId, key, value),
        incrementCounter: (counter) => this.incrementOperationCounter(operationId, counter)
      };
      
    } catch (error) {
      ErrorHandler.logError(error, { operationId, operationType }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return {
        operationId: operationId,
        end: () => {},
        addMetric: () => {},
        incrementCounter: () => {}
      };
    }
  }
  
  /**
   * End performance monitoring for an operation
   * @param {string} operationId - Operation identifier
   * @returns {Object} Performance results
   */
  endOperation(operationId) {
    try {
      const tracker = this.metrics.get(operationId);
      if (!tracker) {
        throw new Error(`Operation ${operationId} not found`);
      }
      
      const endTime = Date.now();
      const responseTime = endTime - tracker.startTime;
      const memoryAfter = this.getMemoryUsage();
      const memoryDelta = memoryAfter - tracker.memoryBefore;
      const quotaAfter = this.getCurrentQuotaUsage();
      const quotaDelta = quotaAfter - tracker.quotaBefore;
      const apiCallsAfter = this.getApiCallCount();
      const apiCallsDelta = apiCallsAfter - tracker.apiCallsBefore;
      
      const results = {
        operationId: operationId,
        operationType: tracker.operationType,
        responseTime: responseTime,
        memoryDelta: memoryDelta,
        quotaDelta: quotaDelta,
        apiCallsDelta: apiCallsDelta,
        timestamp: new Date().toISOString(),
        context: tracker.context,
        success: responseTime < this.alertThresholds.responseTime
      };
      
      // Log performance metric
      this.logPerformanceResult(results);
      
      // Check for performance alerts
      this.checkPerformanceAlerts(results);
      
      // Store result and cleanup
      this.storePerformanceResult(results);
      this.metrics.delete(operationId);
      
      return results;
      
    } catch (error) {
      ErrorHandler.logError(error, { operationId }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return null;
    }
  }
  
  /**
   * Add metric to operation
   * @private
   * @param {string} operationId - Operation identifier
   * @param {string} key - Metric key
   * @param {any} value - Metric value
   */
  addOperationMetric(operationId, key, value) {
    try {
      const tracker = this.metrics.get(operationId);
      if (tracker) {
        if (!tracker.customMetrics) tracker.customMetrics = {};
        tracker.customMetrics[key] = value;
      }
    } catch (error) {
      ErrorHandler.logError(error, { operationId, key, value }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Increment operation counter
   * @private
   * @param {string} operationId - Operation identifier
   * @param {string} counter - Counter name
   */
  incrementOperationCounter(operationId, counter) {
    try {
      const tracker = this.metrics.get(operationId);
      if (tracker) {
        if (!tracker.counters) tracker.counters = {};
        tracker.counters[counter] = (tracker.counters[counter] || 0) + 1;
      }
    } catch (error) {
      ErrorHandler.logError(error, { operationId, counter }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Track API call for quota management
   * @param {string} apiType - Type of API call
   * @param {string} operation - Specific operation
   */
  trackApiCall(apiType, operation = 'unknown') {
    try {
      const key = `${apiType}:${operation}`;
      const current = this.quotaCounters.get(key) || 0;
      this.quotaCounters.set(key, current + 1);
      
      // Check quota thresholds
      this.checkQuotaThresholds(apiType);
      
    } catch (error) {
      ErrorHandler.logError(error, { apiType, operation }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get current quota usage
   * @private
   * @returns {Object} Quota usage statistics
   */
  getCurrentQuotaUsage() {
    try {
      const usage = {};
      for (const [key, count] of this.quotaCounters.entries()) {
        const [apiType] = key.split(':');
        usage[apiType] = (usage[apiType] || 0) + count;
      }
      return usage;
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return {};
    }
  }
  
  /**
   * Get API call count
   * @private
   * @returns {number} Total API call count
   */
  getApiCallCount() {
    try {
      let total = 0;
      for (const count of this.quotaCounters.values()) {
        total += count;
      }
      return total;
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return 0;
    }
  }
  
  /**
   * Check quota thresholds and trigger alerts
   * @private
   * @param {string} apiType - API type to check
   */
  checkQuotaThresholds(apiType) {
    try {
      const quotaLimits = this.getQuotaLimits();
      const currentUsage = this.getCurrentQuotaUsage()[apiType] || 0;
      const limit = quotaLimits[apiType];
      
      if (limit && currentUsage > (limit * this.alertThresholds.quotaUsage / 100)) {
        this.triggerQuotaAlert(apiType, currentUsage, limit);
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { apiType }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get quota limits for different API types
   * @private
   * @returns {Object} Quota limits
   */
  getQuotaLimits() {
    return {
      'SpreadsheetApp': 20000, // Daily quota for Spreadsheet API
      'DriveApp': 1000000, // Daily quota for Drive API
      'GmailApp': 250, // Daily quota for Gmail API
      'UrlFetchApp': 20000, // Daily quota for URL Fetch
      'PropertiesService': 500000, // Daily quota for Properties Service
      'LockService': 500000 // Daily quota for Lock Service
    };
  }
  
  /**
   * Trigger quota alert
   * @private
   * @param {string} apiType - API type
   * @param {number} currentUsage - Current usage
   * @param {number} limit - Usage limit
   */
  triggerQuotaAlert(apiType, currentUsage, limit) {
    try {
      const alert = {
        type: 'quota_threshold',
        apiType: apiType,
        currentUsage: currentUsage,
        limit: limit,
        percentage: Math.round((currentUsage / limit) * 100),
        timestamp: new Date().toISOString(),
        severity: currentUsage > (limit * 0.9) ? 'HIGH' : 'MEDIUM'
      };
      
      this.storeAlert(alert);
      console.warn(`Quota Alert: ${apiType} usage at ${alert.percentage}% (${currentUsage}/${limit})`);
      
    } catch (error) {
      ErrorHandler.logError(error, { apiType, currentUsage, limit }, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get memory usage estimation
   * @private
   * @returns {number} Estimated memory usage in bytes
   */
  getMemoryUsage() {
    try {
      // Approximate memory usage based on object sizes
      let totalSize = 0;
      
      // Estimate cache sizes
      for (const [key, value] of this.performanceCache.entries()) {
        totalSize += this.estimateObjectSize(key) + this.estimateObjectSize(value);
      }
      
      // Estimate metrics size
      for (const [key, value] of this.metrics.entries()) {
        totalSize += this.estimateObjectSize(key) + this.estimateObjectSize(value);
      }
      
      return totalSize;
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return 0;
    }
  }
  
  /**
   * Estimate object size in bytes
   * @private
   * @param {any} obj - Object to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateObjectSize(obj) {
    try {
      if (obj === null || obj === undefined) return 0;
      if (typeof obj === 'string') return obj.length * 2; // UTF-16
      if (typeof obj === 'number') return 8;
      if (typeof obj === 'boolean') return 4;
      if (typeof obj === 'object') {
        return JSON.stringify(obj).length * 2; // Rough estimation
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check performance alerts
   * @private
   * @param {Object} results - Performance results
   */
  checkPerformanceAlerts(results) {
    try {
      const alerts = [];
      
      // Response time alert
      if (results.responseTime > this.alertThresholds.responseTime) {
        alerts.push({
          type: 'response_time',
          value: results.responseTime,
          threshold: this.alertThresholds.responseTime,
          severity: results.responseTime > (this.alertThresholds.responseTime * 2) ? 'HIGH' : 'MEDIUM'
        });
      }
      
      // Memory usage alert
      if (results.memoryDelta > this.alertThresholds.memoryUsage) {
        alerts.push({
          type: 'memory_usage',
          value: results.memoryDelta,
          threshold: this.alertThresholds.memoryUsage,
          severity: 'MEDIUM'
        });
      }
      
      // Store alerts
      alerts.forEach(alert => {
        alert.operationId = results.operationId;
        alert.timestamp = results.timestamp;
        this.storeAlert(alert);
      });
      
    } catch (error) {
      ErrorHandler.logError(error, { results }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Store alert
   * @private
   * @param {Object} alert - Alert to store
   */
  storeAlert(alert) {
    try {
      const alerts = JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceAlerts') || '[]');
      alerts.push(alert);
      
      // Keep only last 50 alerts
      if (alerts.length > 50) {
        alerts.splice(0, alerts.length - 50);
      }
      
      PropertiesService.getScriptProperties().setProperty('performanceAlerts', JSON.stringify(alerts));
      
    } catch (error) {
      ErrorHandler.logError(error, { alert }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Log performance result
   * @private
   * @param {Object} results - Performance results
   */
  logPerformanceResult(results) {
    try {
      const logLevel = results.success ? 'INFO' : 'WARN';
      const message = `Performance: ${results.operationType} - ${results.responseTime}ms - ${results.apiCallsDelta} API calls`;
      
      if (logLevel === 'WARN') {
        console.warn(message);
      } else {
        console.log(message);
      }
      
    } catch (error) {
      ErrorHandler.logError(error, { results }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Store performance result
   * @private
   * @param {Object} results - Performance results
   */
  storePerformanceResult(results) {
    try {
      const metrics = JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceResults') || '[]');
      metrics.push(results);
      
      // Keep only last 200 results
      if (metrics.length > 200) {
        metrics.splice(0, metrics.length - 200);
      }
      
      PropertiesService.getScriptProperties().setProperty('performanceResults', JSON.stringify(metrics));
      
    } catch (error) {
      ErrorHandler.logError(error, { results }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Reset quota counters (typically called daily)
   */
  resetQuotaCounters() {
    try {
      this.quotaCounters.clear();
      console.log('Quota counters reset');
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Get performance dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    try {
      const results = JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceResults') || '[]');
      const alerts = JSON.parse(PropertiesService.getScriptProperties().getProperty('performanceAlerts') || '[]');
      
      // Calculate statistics
      const stats = this.calculatePerformanceStatistics(results);
      
      return {
        statistics: stats,
        recentResults: results.slice(-20),
        activeAlerts: alerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return alertTime > oneHourAgo;
        }),
        quotaUsage: this.getCurrentQuotaUsage(),
        systemHealth: this.calculateSystemHealth(stats, alerts)
      };
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return {
        statistics: {},
        recentResults: [],
        activeAlerts: [],
        quotaUsage: {},
        systemHealth: 'UNKNOWN'
      };
    }
  }
  
  /**
   * Calculate performance statistics
   * @private
   * @param {Array} results - Performance results
   * @returns {Object} Statistics
   */
  calculatePerformanceStatistics(results) {
    try {
      if (results.length === 0) return {};
      
      const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
      const apiCalls = results.map(r => r.apiCallsDelta).filter(c => c > 0);
      
      return {
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        maxResponseTime: Math.max(...responseTimes),
        minResponseTime: Math.min(...responseTimes),
        totalOperations: results.length,
        successfulOperations: results.filter(r => r.success).length,
        averageApiCalls: apiCalls.reduce((a, b) => a + b, 0) / apiCalls.length,
        totalApiCalls: apiCalls.reduce((a, b) => a + b, 0),
        uptime: Date.now() - this.startTime
      };
      
    } catch (error) {
      ErrorHandler.logError(error, { resultsCount: results.length }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return {};
    }
  }
  
  /**
   * Calculate system health score
   * @private
   * @param {Object} stats - Performance statistics
   * @param {Array} alerts - Recent alerts
   * @returns {string} Health status
   */
  calculateSystemHealth(stats, alerts) {
    try {
      let score = 100;
      
      // Deduct points for slow response times
      if (stats.averageResponseTime > this.alertThresholds.responseTime) {
        score -= 30;
      }
      
      // Deduct points for high error rate
      const errorRate = ((stats.totalOperations - stats.successfulOperations) / stats.totalOperations) * 100;
      if (errorRate > this.alertThresholds.errorRate) {
        score -= 20;
      }
      
      // Deduct points for active alerts
      score -= alerts.length * 10;
      
      if (score >= 80) return 'HEALTHY';
      if (score >= 60) return 'WARNING';
      if (score >= 40) return 'DEGRADED';
      return 'CRITICAL';
      
    } catch (error) {
      ErrorHandler.logError(error, { stats, alertsCount: alerts.length }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return 'UNKNOWN';
    }
  }
  
  /**
   * Set performance thresholds for QA testing
   * @param {Object} thresholds - New threshold values
   */
  setThresholds(thresholds) {
    try {
      Object.assign(this.alertThresholds, thresholds);
      console.log('Performance thresholds updated:', this.alertThresholds);
    } catch (error) {
      ErrorHandler.logError(error, { thresholds }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Enable/disable performance monitoring
   * @param {boolean} enabled - Enable monitoring
   */
  enableMonitoring(enabled) {
    try {
      this.monitoringEnabled = enabled;
      PropertiesService.getScriptProperties().setProperty('performance_monitoring_enabled', enabled.toString());
      console.log(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      ErrorHandler.logError(error, { enabled }, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
    }
  }
  
  /**
   * Check quota usage for QA testing
   * @returns {Object} Quota usage status
   */
  checkQuotaUsage() {
    try {
      const currentUsage = this.getCurrentQuotaUsage();
      const limits = this.getQuotaLimits();
      const status = {};
      
      let withinLimits = true;
      
      Object.keys(currentUsage).forEach(apiType => {
        const usage = currentUsage[apiType];
        const limit = limits[apiType];
        const percentage = limit ? (usage / limit) * 100 : 0;
        
        status[apiType] = {
          usage,
          limit,
          percentage: Math.round(percentage),
          status: percentage > 90 ? 'CRITICAL' : percentage > 80 ? 'WARNING' : 'OK'
        };
        
        if (percentage > 90) {
          withinLimits = false;
        }
      });
      
      return {
        withinLimits,
        details: status,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.MEDIUM, ErrorTypes.INTERNAL);
      return {
        withinLimits: false,
        details: {},
        error: error.message
      };
    }
  }
  
  /**
   * Get quota usage for specific API type
   * @param {string} apiType - API type to check
   * @returns {Object} Usage details
   */
  getQuotaUsage() {
    try {
      const usage = this.getCurrentQuotaUsage();
      const limits = this.getQuotaLimits();
      
      return Object.keys(usage).reduce((acc, apiType) => {
        acc[apiType] = {
          used: usage[apiType],
          limit: limits[apiType],
          percentage: limits[apiType] ? Math.round((usage[apiType] / limits[apiType]) * 100) : 0
        };
        return acc;
      }, {});
      
    } catch (error) {
      ErrorHandler.logError(error, {}, ErrorSeverity.LOW, ErrorTypes.INTERNAL);
      return {};
    }
  }
  
  /**
   * Optimize performance based on current metrics
   * @returns {Object} Optimization recommendations
   */
  optimizePerformance() {
    try {
      const dashboardData = this.getDashboardData();
      const recommendations = [];
      
      // Analyze response times
      if (dashboardData.statistics.averageResponseTime > this.alertThresholds.responseTime) {
        recommendations.push({
          type: 'response_time',
          priority: 'HIGH',
          message: 'Consider implementing caching or batch operations to reduce response times',
          action: 'enable_advanced_caching'
        });
      }
      
      // Analyze API usage
      if (dashboardData.statistics.averageApiCalls > 10) {
        recommendations.push({
          type: 'api_optimization',
          priority: 'MEDIUM',
          message: 'High API call frequency detected. Consider batch processing',
          action: 'implement_batch_operations'
        });
      }
      
      // Analyze quota usage
      const quotaUsage = dashboardData.quotaUsage;
      Object.keys(quotaUsage).forEach(apiType => {
        const usage = quotaUsage[apiType];
        const limit = this.getQuotaLimits()[apiType];
        if (limit && usage > (limit * 0.8)) {
          recommendations.push({
            type: 'quota_management',
            priority: 'HIGH',
            message: `${apiType} quota usage is high (${Math.round((usage/limit)*100)}%)`,
            action: 'reduce_api_calls'
          });
        }
      });
      
      return {
        success: true,
        recommendations: recommendations,
        currentHealth: dashboardData.systemHealth,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to generate performance optimization recommendations.',
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
  
  /**
   * Clear performance data
   * @param {Object} options - Clear options
   * @returns {Object} Result
   */
  clearPerformanceData(options = {}) {
    try {
      const {
        clearResults = false,
        clearAlerts = false,
        clearQuotaCounters = false,
        clearCache = false
      } = options;
      
      if (clearResults) {
        PropertiesService.getScriptProperties().deleteProperty('performanceResults');
      }
      
      if (clearAlerts) {
        PropertiesService.getScriptProperties().deleteProperty('performanceAlerts');
      }
      
      if (clearQuotaCounters) {
        this.resetQuotaCounters();
      }
      
      if (clearCache) {
        this.performanceCache.clear();
        this.metrics.clear();
      }
      
      return {
        success: true,
        message: 'Performance data cleared successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to clear performance data.',
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceManager };
}
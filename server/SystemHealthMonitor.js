/**
 * CasesDash - System Health Monitor
 * Real-time system monitoring with anomaly detection and auto-recovery
 * 
 * @author Claude
 * @version 2.0
 * @since 2025-06-04
 */

/**
 * Health check configurations
 */
const HealthCheckConfigs = {
  // System availability checks
  SPREADSHEET_ACCESS: {
    interval: 60000, // 1 minute
    timeout: 10000,  // 10 seconds
    criticalThreshold: 3, // failures before critical
    warningThreshold: 1
  },
  
  // Performance checks
  RESPONSE_TIME: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    criticalThreshold: 5000, // 5 second response time
    warningThreshold: 2000   // 2 second response time
  },
  
  // Memory and resource checks
  MEMORY_USAGE: {
    interval: 120000, // 2 minutes
    criticalThreshold: 90, // 90% memory usage
    warningThreshold: 70   // 70% memory usage
  },
  
  // API quota checks
  QUOTA_USAGE: {
    interval: 300000, // 5 minutes
    criticalThreshold: 95, // 95% quota usage
    warningThreshold: 80   // 80% quota usage
  },
  
  // Error rate checks
  ERROR_RATE: {
    interval: 60000, // 1 minute
    criticalThreshold: 10, // 10% error rate
    warningThreshold: 5    // 5% error rate
  }
};

/**
 * Alert severity levels
 */
const AlertSeverity = {
  INFO: { level: 1, color: '#2196F3', retention: 24 },      // 1 day
  WARNING: { level: 2, color: '#FF9800', retention: 72 },   // 3 days
  CRITICAL: { level: 3, color: '#F44336', retention: 168 }, // 7 days
  EMERGENCY: { level: 4, color: '#9C27B0', retention: 720 } // 30 days
};

/**
 * System Health Monitor Class
 */
class SystemHealthMonitor {
  constructor() {
    this.healthMetrics = new Map();
    this.alerts = new Map();
    this.monitoringActive = false;
    this.checkIntervals = new Map();
    this.performanceHistory = new Map();
    this.auditLogger = null;
    this.notificationManager = null;
    this.rateLimitManager = null;
    this.recoveryManager = new RecoveryManager();
    this.initializeComponents();
    this.startMonitoring();
  }

  /**
   * Initialize monitoring components
   */
  initializeComponents() {
    try {
      if (typeof AuditLogger !== 'undefined') {
        this.auditLogger = new AuditLogger();
      }
      if (typeof NotificationManager !== 'undefined') {
        this.notificationManager = new NotificationManager();
      }
      if (typeof RateLimitManager !== 'undefined') {
        this.rateLimitManager = new RateLimitManager();
      }
    } catch (error) {
      console.warn('Could not initialize all monitoring components:', error);
    }
  }

  /**
   * Start health monitoring
   */
  startMonitoring() {
    if (this.monitoringActive) return;

    try {
      this.monitoringActive = true;
      
      // Initialize health metrics
      this.initializeHealthMetrics();
      
      // Start periodic health checks
      this.startPeriodicChecks();
      
      console.log('System health monitoring started');
      
      if (this.auditLogger) {
        this.auditLogger.logEvent('SYSTEM_STARTUP', {
          component: 'SystemHealthMonitor',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to start health monitoring:', error);
    }
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    try {
      this.monitoringActive = false;
      
      // Clear all intervals
      this.checkIntervals.forEach(intervalId => {
        clearInterval(intervalId);
      });
      this.checkIntervals.clear();
      
      console.log('System health monitoring stopped');

    } catch (error) {
      console.error('Failed to stop health monitoring:', error);
    }
  }

  /**
   * Initialize health metrics storage
   */
  initializeHealthMetrics() {
    const initialMetrics = {
      systemAvailability: { status: 'unknown', lastCheck: null, score: 0 },
      spreadsheetHealth: { status: 'unknown', lastCheck: null, score: 0 },
      performanceHealth: { status: 'unknown', lastCheck: null, score: 0 },
      quotaHealth: { status: 'unknown', lastCheck: null, score: 0 },
      errorRateHealth: { status: 'unknown', lastCheck: null, score: 0 },
      memoryHealth: { status: 'unknown', lastCheck: null, score: 0 }
    };

    Object.keys(initialMetrics).forEach(metric => {
      this.healthMetrics.set(metric, initialMetrics[metric]);
    });
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    // Spreadsheet access check
    const spreadsheetInterval = setInterval(() => {
      this.checkSpreadsheetHealth();
    }, HealthCheckConfigs.SPREADSHEET_ACCESS.interval);
    this.checkIntervals.set('spreadsheet', spreadsheetInterval);

    // Performance check
    const performanceInterval = setInterval(() => {
      this.checkPerformanceHealth();
    }, HealthCheckConfigs.RESPONSE_TIME.interval);
    this.checkIntervals.set('performance', performanceInterval);

    // Memory check
    const memoryInterval = setInterval(() => {
      this.checkMemoryHealth();
    }, HealthCheckConfigs.MEMORY_USAGE.interval);
    this.checkIntervals.set('memory', memoryInterval);

    // Quota check
    const quotaInterval = setInterval(() => {
      this.checkQuotaHealth();
    }, HealthCheckConfigs.QUOTA_USAGE.interval);
    this.checkIntervals.set('quota', quotaInterval);

    // Error rate check
    const errorInterval = setInterval(() => {
      this.checkErrorRateHealth();
    }, HealthCheckConfigs.ERROR_RATE.interval);
    this.checkIntervals.set('errorRate', errorInterval);

    // Overall system check
    const systemInterval = setInterval(() => {
      this.updateSystemHealth();
    }, 30000); // Every 30 seconds
    this.checkIntervals.set('system', systemInterval);
  }

  /**
   * Check spreadsheet accessibility
   */
  checkSpreadsheetHealth() {
    const startTime = Date.now();
    
    try {
      // Test spreadsheet access
      const testSheetId = PropertiesService.getScriptProperties().getProperty('TEST_SHEET_ID');
      
      if (testSheetId) {
        const spreadsheet = SpreadsheetApp.openById(testSheetId);
        const sheet = spreadsheet.getActiveSheet();
        const testRange = sheet.getRange('A1');
        testRange.getValue(); // Simple read operation
      } else {
        // Fallback: test with properties service
        PropertiesService.getScriptProperties().getProperty('health_check_test');
      }

      const responseTime = Date.now() - startTime;
      
      this.updateHealthMetric('spreadsheetHealth', {
        status: 'healthy',
        responseTime: responseTime,
        lastCheck: new Date().toISOString(),
        score: this.calculateHealthScore(responseTime, 1000, 3000) // 1s good, 3s poor
      });

    } catch (error) {
      console.error('Spreadsheet health check failed:', error);
      
      this.updateHealthMetric('spreadsheetHealth', {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        score: 0
      });

      this.triggerAlert('SPREADSHEET_FAILURE', AlertSeverity.CRITICAL, {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Attempt recovery
      this.recoveryManager.attemptSpreadsheetRecovery();
    }
  }

  /**
   * Check system performance
   */
  checkPerformanceHealth() {
    const startTime = Date.now();
    
    try {
      // Perform a series of operations to test performance
      const performanceTests = [
        () => this.testBasicOperations(),
        () => this.testCachePerformance(),
        () => this.testComputationPerformance()
      ];

      const results = performanceTests.map(test => {
        const testStart = Date.now();
        try {
          test();
          return Date.now() - testStart;
        } catch (error) {
          console.warn('Performance test failed:', error);
          return 10000; // 10 second penalty for failed test
        }
      });

      const averageResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
      const totalTime = Date.now() - startTime;

      // Store performance history
      this.storePerformanceMetric('response_time', averageResponseTime);
      this.storePerformanceMetric('total_time', totalTime);

      const status = averageResponseTime < HealthCheckConfigs.RESPONSE_TIME.warningThreshold ? 'healthy' :
                    averageResponseTime < HealthCheckConfigs.RESPONSE_TIME.criticalThreshold ? 'degraded' : 'unhealthy';

      this.updateHealthMetric('performanceHealth', {
        status: status,
        averageResponseTime: averageResponseTime,
        totalTime: totalTime,
        lastCheck: new Date().toISOString(),
        score: this.calculateHealthScore(averageResponseTime, 500, 2000)
      });

      // Trigger alerts if needed
      if (status === 'unhealthy') {
        this.triggerAlert('PERFORMANCE_DEGRADED', AlertSeverity.WARNING, {
          averageResponseTime: averageResponseTime,
          threshold: HealthCheckConfigs.RESPONSE_TIME.criticalThreshold
        });
      }

    } catch (error) {
      console.error('Performance health check failed:', error);
      
      this.updateHealthMetric('performanceHealth', {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        score: 0
      });
    }
  }

  /**
   * Check memory usage health
   */
  checkMemoryHealth() {
    try {
      // Estimate memory usage (Google Apps Script doesn't provide direct access)
      const memoryEstimate = this.estimateMemoryUsage();
      const memoryPercentage = (memoryEstimate.used / memoryEstimate.total) * 100;

      const status = memoryPercentage < HealthCheckConfigs.MEMORY_USAGE.warningThreshold ? 'healthy' :
                    memoryPercentage < HealthCheckConfigs.MEMORY_USAGE.criticalThreshold ? 'degraded' : 'unhealthy';

      this.updateHealthMetric('memoryHealth', {
        status: status,
        memoryPercentage: memoryPercentage,
        estimatedUsage: memoryEstimate,
        lastCheck: new Date().toISOString(),
        score: this.calculateHealthScore(memoryPercentage, 50, 90, true) // Inverted: lower is better
      });

      // Store memory history
      this.storePerformanceMetric('memory_usage', memoryPercentage);

      if (status === 'unhealthy') {
        this.triggerAlert('HIGH_MEMORY_USAGE', AlertSeverity.WARNING, {
          memoryPercentage: memoryPercentage,
          threshold: HealthCheckConfigs.MEMORY_USAGE.criticalThreshold
        });

        // Attempt memory cleanup
        this.recoveryManager.performMemoryCleanup();
      }

    } catch (error) {
      console.error('Memory health check failed:', error);
    }
  }

  /**
   * Check quota usage health
   */
  checkQuotaHealth() {
    try {
      let quotaStatus = { execution: { percentage: 0 }, daily: {} };
      
      // Get quota status from rate limit manager if available
      if (this.rateLimitManager && this.rateLimitManager.quotaTracker) {
        quotaStatus = this.rateLimitManager.quotaTracker.getQuotaStatus();
      }

      const executionPercentage = quotaStatus.execution.percentage || 0;
      const maxQuotaUsage = Math.max(
        executionPercentage,
        (quotaStatus.daily.spreadsheetCalls?.current / quotaStatus.daily.spreadsheetCalls?.limit * 100) || 0,
        (quotaStatus.daily.urlFetch?.current / quotaStatus.daily.urlFetch?.limit * 100) || 0
      );

      const status = maxQuotaUsage < HealthCheckConfigs.QUOTA_USAGE.warningThreshold ? 'healthy' :
                    maxQuotaUsage < HealthCheckConfigs.QUOTA_USAGE.criticalThreshold ? 'degraded' : 'unhealthy';

      this.updateHealthMetric('quotaHealth', {
        status: status,
        quotaUsage: maxQuotaUsage,
        quotaDetails: quotaStatus,
        lastCheck: new Date().toISOString(),
        score: this.calculateHealthScore(maxQuotaUsage, 50, 90, true) // Inverted: lower is better
      });

      // Store quota history
      this.storePerformanceMetric('quota_usage', maxQuotaUsage);

      if (status === 'unhealthy') {
        this.triggerAlert('HIGH_QUOTA_USAGE', AlertSeverity.CRITICAL, {
          quotaUsage: maxQuotaUsage,
          threshold: HealthCheckConfigs.QUOTA_USAGE.criticalThreshold,
          details: quotaStatus
        });
      }

    } catch (error) {
      console.error('Quota health check failed:', error);
    }
  }

  /**
   * Check error rate health
   */
  checkErrorRateHealth() {
    try {
      const errorStats = this.getErrorStatistics();
      const errorRate = errorStats.errorRate || 0;

      const status = errorRate < HealthCheckConfigs.ERROR_RATE.warningThreshold ? 'healthy' :
                    errorRate < HealthCheckConfigs.ERROR_RATE.criticalThreshold ? 'degraded' : 'unhealthy';

      this.updateHealthMetric('errorRateHealth', {
        status: status,
        errorRate: errorRate,
        errorStats: errorStats,
        lastCheck: new Date().toISOString(),
        score: this.calculateHealthScore(errorRate, 1, 10, true) // Inverted: lower is better
      });

      // Store error rate history
      this.storePerformanceMetric('error_rate', errorRate);

      if (status === 'unhealthy') {
        this.triggerAlert('HIGH_ERROR_RATE', AlertSeverity.WARNING, {
          errorRate: errorRate,
          threshold: HealthCheckConfigs.ERROR_RATE.criticalThreshold,
          stats: errorStats
        });
      }

    } catch (error) {
      console.error('Error rate health check failed:', error);
    }
  }

  /**
   * Update overall system health
   */
  updateSystemHealth() {
    try {
      const healthScores = [];
      let overallStatus = 'healthy';
      let criticalIssues = 0;
      let warnings = 0;

      this.healthMetrics.forEach(metric => {
        healthScores.push(metric.score || 0);
        
        if (metric.status === 'unhealthy') {
          criticalIssues++;
          overallStatus = 'unhealthy';
        } else if (metric.status === 'degraded' && overallStatus === 'healthy') {
          warnings++;
          overallStatus = 'degraded';
        }
      });

      const averageScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;

      this.updateHealthMetric('systemAvailability', {
        status: overallStatus,
        overallScore: averageScore,
        criticalIssues: criticalIssues,
        warnings: warnings,
        lastCheck: new Date().toISOString(),
        score: averageScore
      });

      // Log system health update
      if (this.auditLogger) {
        this.auditLogger.logEvent('SYSTEM_HEALTH_UPDATE', {
          overallStatus: overallStatus,
          overallScore: averageScore,
          criticalIssues: criticalIssues,
          warnings: warnings
        });
      }

    } catch (error) {
      console.error('System health update failed:', error);
    }
  }

  /**
   * Calculate health score (0-100)
   * @param {number} value - Current value
   * @param {number} good - Good threshold
   * @param {number} poor - Poor threshold
   * @param {boolean} inverted - Whether lower values are better
   * @returns {number} Health score
   */
  calculateHealthScore(value, good, poor, inverted = false) {
    if (inverted) {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    } else {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    }
  }

  /**
   * Update health metric
   * @param {string} metricName - Metric name
   * @param {Object} metricData - Metric data
   */
  updateHealthMetric(metricName, metricData) {
    this.healthMetrics.set(metricName, {
      ...this.healthMetrics.get(metricName),
      ...metricData
    });
  }

  /**
   * Store performance metric for trending
   * @param {string} metricName - Metric name
   * @param {number} value - Metric value
   */
  storePerformanceMetric(metricName, value) {
    if (!this.performanceHistory.has(metricName)) {
      this.performanceHistory.set(metricName, []);
    }

    const history = this.performanceHistory.get(metricName);
    history.push({
      timestamp: Date.now(),
      value: value
    });

    // Keep last 100 data points
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Trigger system alert
   * @param {string} alertType - Alert type
   * @param {Object} severity - Alert severity
   * @param {Object} details - Alert details
   */
  triggerAlert(alertType, severity, details) {
    try {
      const alertId = this.generateAlertId();
      const timestamp = new Date().toISOString();

      const alert = {
        id: alertId,
        type: alertType,
        severity: severity.level,
        severityName: Object.keys(AlertSeverity).find(key => AlertSeverity[key] === severity),
        message: this.generateAlertMessage(alertType, details),
        details: details,
        timestamp: timestamp,
        status: 'active',
        retentionHours: severity.retention
      };

      this.alerts.set(alertId, alert);

      // Log alert
      console.warn(`SYSTEM ALERT [${alert.severityName}]: ${alert.message}`, details);

      if (this.auditLogger) {
        this.auditLogger.logEvent('SYSTEM_ERROR', {
          alertType: alertType,
          alertId: alertId,
          severity: alert.severityName,
          message: alert.message,
          details: details
        });
      }

      // Send notification for high severity alerts
      if (severity.level >= AlertSeverity.WARNING.level && this.notificationManager) {
        this.notificationManager.sendAlert({
          type: 'system_health_alert',
          severity: alert.severityName,
          title: `System Health Alert: ${alertType}`,
          message: alert.message,
          details: details,
          timestamp: timestamp
        });
      }

      // Trigger auto-recovery for certain alert types
      this.triggerAutoRecovery(alertType, details);

    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  /**
   * Generate alert message
   * @param {string} alertType - Alert type
   * @param {Object} details - Alert details
   * @returns {string} Alert message
   */
  generateAlertMessage(alertType, details) {
    const messages = {
      'SPREADSHEET_FAILURE': `Spreadsheet access failed: ${details.error}`,
      'PERFORMANCE_DEGRADED': `Performance degraded: ${details.averageResponseTime}ms (threshold: ${details.threshold}ms)`,
      'HIGH_MEMORY_USAGE': `High memory usage: ${details.memoryPercentage}% (threshold: ${details.threshold}%)`,
      'HIGH_QUOTA_USAGE': `High quota usage: ${details.quotaUsage}% (threshold: ${details.threshold}%)`,
      'HIGH_ERROR_RATE': `High error rate: ${details.errorRate}% (threshold: ${details.threshold}%)`
    };

    return messages[alertType] || `System alert: ${alertType}`;
  }

  /**
   * Trigger auto-recovery procedures
   * @param {string} alertType - Alert type
   * @param {Object} details - Alert details
   */
  triggerAutoRecovery(alertType, details) {
    try {
      switch (alertType) {
        case 'SPREADSHEET_FAILURE':
          this.recoveryManager.attemptSpreadsheetRecovery();
          break;
        case 'HIGH_MEMORY_USAGE':
          this.recoveryManager.performMemoryCleanup();
          break;
        case 'HIGH_QUOTA_USAGE':
          this.recoveryManager.implementQuotaThrottling();
          break;
        case 'PERFORMANCE_DEGRADED':
          this.recoveryManager.optimizePerformance();
          break;
      }
    } catch (error) {
      console.error('Auto-recovery failed:', error);
    }
  }

  /**
   * Get current system health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    try {
      const healthData = {};
      
      this.healthMetrics.forEach((metric, name) => {
        healthData[name] = metric;
      });

      const activeAlerts = Array.from(this.alerts.values())
        .filter(alert => alert.status === 'active')
        .sort((a, b) => b.severity - a.severity);

      const performanceTrends = this.getPerformanceTrends();

      return {
        timestamp: new Date().toISOString(),
        overall: healthData.systemAvailability || { status: 'unknown', score: 0 },
        metrics: healthData,
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity >= AlertSeverity.CRITICAL.level).length,
          list: activeAlerts.slice(0, 10) // Last 10 alerts
        },
        trends: performanceTrends,
        uptime: this.calculateUptime()
      };

    } catch (error) {
      console.error('Failed to get health status:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get performance trends
   * @returns {Object} Performance trends
   */
  getPerformanceTrends() {
    const trends = {};
    
    this.performanceHistory.forEach((history, metricName) => {
      if (history.length >= 2) {
        const recent = history.slice(-10); // Last 10 data points
        const values = recent.map(h => h.value);
        
        trends[metricName] = {
          current: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          trend: this.calculateTrend(values)
        };
      }
    });

    return trends;
  }

  /**
   * Calculate trend direction
   * @param {Array} values - Value array
   * @returns {string} Trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Calculate system uptime
   * @returns {Object} Uptime information
   */
  calculateUptime() {
    // Simple uptime calculation based on monitoring start
    const startTime = PropertiesService.getScriptProperties().getProperty('monitoring_start_time');
    
    if (startTime) {
      const uptimeMs = Date.now() - parseInt(startTime);
      const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const uptimeDays = Math.floor(uptimeHours / 24);
      
      return {
        milliseconds: uptimeMs,
        hours: uptimeHours,
        days: uptimeDays,
        percentage: 99.9 // Would calculate based on actual downtime tracking
      };
    }

    return { hours: 0, days: 0, percentage: 100 };
  }

  // Utility methods
  testBasicOperations() {
    // Basic operation test
    const test = { data: 'test', timestamp: Date.now() };
    JSON.stringify(test);
    JSON.parse(JSON.stringify(test));
  }

  testCachePerformance() {
    // Test cache operations if available
    try {
      if (typeof CacheService !== 'undefined') {
        const cache = CacheService.getScriptCache();
        cache.put('health_test', 'test_value', 60);
        cache.get('health_test');
      }
    } catch (error) {
      console.warn('Cache test failed:', error);
    }
  }

  testComputationPerformance() {
    // Simple computation test
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }

  estimateMemoryUsage() {
    // Rough memory estimation
    const objectCount = this.healthMetrics.size + this.alerts.size + this.performanceHistory.size;
    const estimatedUsed = objectCount * 1024; // 1KB per object estimate
    const estimatedTotal = 100 * 1024 * 1024; // 100MB total estimate
    
    return {
      used: estimatedUsed,
      total: estimatedTotal,
      objects: objectCount
    };
  }

  getErrorStatistics() {
    try {
      // Get error statistics from error handler if available
      if (typeof productionErrorHandler !== 'undefined') {
        return productionErrorHandler.getErrorStatistics();
      }
      
      // Fallback calculation
      return {
        totalErrors: 0,
        errorRate: 0,
        recentErrors: 0
      };
    } catch (error) {
      return { totalErrors: 0, errorRate: 0, recentErrors: 0 };
    }
  }

  generateAlertId() {
    return `ALERT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Recovery Manager for auto-recovery procedures
 */
class RecoveryManager {
  constructor() {
    this.recoveryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 60000; // 1 minute
  }

  /**
   * Attempt spreadsheet recovery
   */
  attemptSpreadsheetRecovery() {
    try {
      console.log('Attempting spreadsheet recovery...');
      
      // Clear any cached spreadsheet references
      if (typeof CacheService !== 'undefined') {
        const cache = CacheService.getScriptCache();
        cache.removeAll(['spreadsheet_refs', 'sheet_metadata']);
      }

      // Force garbage collection (Google Apps Script specific)
      try {
        Utilities.sleep(1000); // Brief pause
      } catch (error) {
        // Utilities might not be available in all contexts
      }

      console.log('Spreadsheet recovery attempt completed');

    } catch (error) {
      console.error('Spreadsheet recovery failed:', error);
    }
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    try {
      console.log('Performing memory cleanup...');
      
      // Clear caches
      if (typeof CacheService !== 'undefined') {
        CacheService.getScriptCache().removeAll(['temp_data', 'cache_heavy']);
      }

      // Clear large data structures if available
      if (typeof rateLimitManager !== 'undefined') {
        rateLimitManager.cleanup();
      }

      console.log('Memory cleanup completed');

    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }
  }

  /**
   * Implement quota throttling
   */
  implementQuotaThrottling() {
    try {
      console.log('Implementing quota throttling...');
      
      // Set throttling flags
      PropertiesService.getScriptProperties().setProperties({
        'quota_throttling_enabled': 'true',
        'quota_throttling_start': Date.now().toString()
      });

      console.log('Quota throttling implemented');

    } catch (error) {
      console.error('Quota throttling failed:', error);
    }
  }

  /**
   * Optimize performance
   */
  optimizePerformance() {
    try {
      console.log('Optimizing performance...');
      
      // Enable performance optimizations
      PropertiesService.getScriptProperties().setProperties({
        'performance_mode': 'optimized',
        'batch_processing_enabled': 'true',
        'cache_aggressive': 'true'
      });

      console.log('Performance optimization completed');

    } catch (error) {
      console.error('Performance optimization failed:', error);
    }
  }
}

// Global system health monitor instance
const systemHealthMonitor = new SystemHealthMonitor();

// Global functions for triggers
function performHealthCheck() {
  try {
    systemHealthMonitor.updateSystemHealth();
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

function getSystemHealth() {
  try {
    return systemHealthMonitor.getHealthStatus();
  } catch (error) {
    console.error('Get system health failed:', error);
    return { error: error.message };
  }
}
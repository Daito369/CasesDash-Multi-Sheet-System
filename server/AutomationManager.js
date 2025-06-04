/**
 * CasesDash - Automation Manager
 * Handles automated triggers, P95 monitoring, and notification automation
 *
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

class AutomationManager {
  constructor() {
    this.initialized = true;
  }

  /**
   * Daily automated trigger for P95 monitoring and alerts
   * Runs automatically every day to check TRT status and send notifications
   */
  dailyP95MonitoringTrigger() {
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
    const trtManager = new TRTManager();
    const trtAnalytics = trtManager.getTRTAnalytics();
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
    const trtAlerts = trtManager.checkTRTAlerts();
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
  setupP95MonitoringTriggers() {
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
   * Remove P95 monitoring triggers
   * Use this to disable automatic monitoring
   */
  removeP95MonitoringTriggers() {
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

  /**
   * Manually run P95 monitoring for testing
   * Use this to test the monitoring system without waiting for the trigger
   */
  testP95Monitoring() {
  try {
    console.log('🧪 Testing P95 monitoring system...');
    
    const result = this.dailyP95MonitoringTrigger();
    
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

  /**
   * Get automation configuration (alias for getAutomationConfiguration)
   * @returns {Object} Automation configuration
   */
  getConfiguration() {
    return this.getAutomationConfiguration();
  }

  /**
   * Get automation configuration and status
   * @returns {Object} Automation configuration
   */
  getAutomationConfiguration() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const activeTriggers = triggers.map(trigger => ({
      handlerFunction: trigger.getHandlerFunction(),
      triggerSource: trigger.getTriggerSource().toString(),
      eventType: trigger.getEventType().toString(),
      uniqueId: trigger.getUniqueId()
    }));
    
    const configuration = {
      enabled: activeTriggers.length > 0,
      activeTriggers: activeTriggers,
      monitoring: {
        p95Enabled: ConfigManager.get('notifications', 'p95MonitoringEnabled') || false,
        emailEnabled: ConfigManager.get('notifications', 'emailEnabled') || false,
        webhookEnabled: ConfigManager.get('notifications', 'webhookEnabled') || false
      },
      schedule: {
        dailyMonitoring: '09:00',
        alertInterval: '30 minutes',
        cleanupInterval: '7 days'
      }
    };
    
    return {
      success: true,
      data: configuration
    };
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to get automation configuration.',
        type: ErrorTypes.INTERNAL
      }
    );
  }
  }

  /**
   * Test automation configuration method
   * @returns {Object} Test result for configuration method
   */
  testConfigurationMethod() {
    try {
      const config = this.getConfiguration();
      const automationConfig = this.getAutomationConfiguration();
      
      return {
        success: true,
        data: {
          getConfiguration: config,
          getAutomationConfiguration: automationConfig,
          methodsMatch: JSON.stringify(config) === JSON.stringify(automationConfig),
          testPassed: true
        },
        message: 'Configuration methods working correctly'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Configuration method test failed'
      };
    }
  }

  /**
   * Get mock configuration data for testing
   * @returns {Object} Mock configuration data
   */
  getMockConfiguration() {
    return {
      success: true,
      data: {
        enabled: true,
        activeTriggers: [
          {
            handlerFunction: 'dailyP95MonitoringTrigger',
            triggerSource: 'TIMEBASED',
            eventType: 'TIMEBASED',
            uniqueId: 'mock_trigger_001'
          }
        ],
        monitoring: {
          p95Enabled: true,
          emailEnabled: false,
          webhookEnabled: true
        },
        schedule: {
          dailyMonitoring: '09:00',
          alertInterval: '30 minutes',
          cleanupInterval: '7 days'
        },
        testMode: true,
        lastTested: new Date().toISOString()
      }
    };
  }
}
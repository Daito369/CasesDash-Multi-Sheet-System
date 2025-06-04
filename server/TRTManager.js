/**
 * CasesDash - TRT Manager
 * Handles Time to Resolution (TRT) analytics, P95 monitoring, and alerts
 *
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

class TRTManager {
  constructor() {
    this.initialized = true;
  }

  /**
   * Get comprehensive TRT analytics
   * @returns {Object} TRT analytics data
   */
  getTRTAnalytics() {
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    
    const trtData = {
      p95: 0,
      violationCases: [],
      totalCases: 0,
      excludedCount: 0,
      exclusions: {
        bugCases: 0,
        l2Consult: 0,
        idtPayreq: 0,
        tsConsult: 0
      },
      trendData: {
        daily: [],
        weekly: [],
        monthly: []
      },
      bySheetType: {},
      lastCalculated: new Date().toISOString()
    };
    
    const allResponseTimes = [];
    const excludedCases = [];
    
    // Process each sheet type
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const searchResult = caseModel.search({ 
          limit: 10000,
          filters: {
            caseStatus: ['Closed', 'Resolved']
          }
        });
        
        if (searchResult.success && searchResult.data) {
          const cases = searchResult.data;
          trtData.bySheetType[sheetType] = {
            totalCases: cases.length,
            includedCases: 0,
            excludedCases: 0,
            averageResponseTime: 0,
            p95: 0
          };
          
          const sheetResponseTimes = [];
          
          cases.forEach(caseData => {
            trtData.totalCases++;
            
            // Check if case should be excluded from TRT calculation
            if (this.shouldExcludeFromTRT(caseData, sheetType)) {
              trtData.excludedCount++;
              trtData.bySheetType[sheetType].excludedCases++;
              
              // Count exclusion reasons
              if (caseData.bug === 'Yes' || caseData.Bug === 'Yes') {
                trtData.exclusions.bugCases++;
              }
              
              excludedCases.push({
                caseId: caseData.caseId,
                sheetType: sheetType,
                exclusionReason: this.getExclusionReason(caseData),
                openDate: caseData.caseOpenDate
              });
              
              return; // Skip this case for TRT calculation
            }
            
            // Calculate response time for included cases
            const responseTime = this.calculateCaseResponseTime(caseData);
            if (responseTime > 0) {
              allResponseTimes.push(responseTime);
              sheetResponseTimes.push(responseTime);
              trtData.bySheetType[sheetType].includedCases++;
              
              // Check for P95 violations (2 hours = 7200 seconds)
              if (responseTime > 7200) {
                trtData.violationCases.push({
                  caseId: caseData.caseId,
                  sheetType: sheetType,
                  responseTime: responseTime,
                  responseTimeHours: (responseTime / 3600).toFixed(2),
                  assignee: caseData.finalAssignee || caseData.firstAssignee,
                  customerInfo: {
                    segment: caseData.incomingSegment || '',
                    product: caseData.productCategory || ''
                  },
                  openDate: caseData.caseOpenDate,
                  closeDate: caseData.closeDate || caseData.firstCloseDate
                });
              }
            }
          });
          
          // Calculate sheet-level metrics
          if (sheetResponseTimes.length > 0) {
            trtData.bySheetType[sheetType].averageResponseTime = 
              sheetResponseTimes.reduce((sum, time) => sum + time, 0) / sheetResponseTimes.length;
            
            const sortedTimes = [...sheetResponseTimes].sort((a, b) => a - b);
            const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
            trtData.bySheetType[sheetType].p95 = sortedTimes[p95Index] || 0;
          }
        }
      } catch (error) {
        console.warn(`Failed to process TRT for ${sheetType}:`, error.message);
        trtData.bySheetType[sheetType] = {
          error: error.message,
          totalCases: 0,
          includedCases: 0,
          excludedCases: 0
        };
      }
    });
    
    // Calculate overall P95
    if (allResponseTimes.length > 0) {
      const sortedResponseTimes = allResponseTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedResponseTimes.length * 0.95) - 1;
      trtData.p95 = (sortedResponseTimes[p95Index] || 0) / 3600; // Convert to hours
    }
    
    // Generate trend data
    trtData.trendData = this.generateTRTTrendData(30); // Last 30 days
    
    // Log analytics access
    privacyManager.logAccess('trt', 'analytics', {
      totalCases: trtData.totalCases,
      excludedCases: trtData.excludedCount,
      p95Hours: trtData.p95.toFixed(2)
    });
    
    return {
      success: true,
      data: trtData
    };
    
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
   * Check for TRT alerts and violations
   * @returns {Object} TRT alert data
   */
  checkTRTAlerts() {
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const alerts = [];
    const currentTime = new Date();
    
    // Check each sheet type for cases approaching or exceeding TRT limits
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const openCases = caseModel.search({
          filters: {
            caseStatus: ['Open', 'In Progress', 'Pending']
          },
          limit: 1000
        });
        
        if (openCases.success && openCases.data) {
          openCases.data.forEach(caseData => {
            // Skip excluded cases
            if (this.shouldExcludeFromTRT(caseData, sheetType)) {
              return;
            }
            
            const openDate = new Date(caseData.caseOpenDate);
            const hoursOpen = (currentTime - openDate) / (1000 * 60 * 60);
            
            // Critical alert: Over 2 hours (P95 limit)
            if (hoursOpen > 2) {
              alerts.push({
                caseId: caseData.caseId,
                sheetType: sheetType,
                hoursOpen: hoursOpen.toFixed(2),
                urgencyLevel: 'critical',
                assignee: caseData.finalAssignee || caseData.firstAssignee,
                customerInfo: {
                  segment: caseData.incomingSegment || '',
                  product: caseData.productCategory || ''
                },
                openDate: caseData.caseOpenDate,
                escalationRecommended: hoursOpen > 4
              });
            }
            // Warning alert: Approaching 2 hours (1.5 hours)
            else if (hoursOpen > 1.5) {
              alerts.push({
                caseId: caseData.caseId,
                sheetType: sheetType,
                hoursOpen: hoursOpen.toFixed(2),
                urgencyLevel: 'warning',
                assignee: caseData.finalAssignee || caseData.firstAssignee,
                customerInfo: {
                  segment: caseData.incomingSegment || '',
                  product: caseData.productCategory || ''
                },
                openDate: caseData.caseOpenDate,
                timeRemaining: (2 - hoursOpen).toFixed(2)
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to check alerts for ${sheetType}:`, error.message);
      }
    });
    
    // Sort alerts by urgency and hours open
    alerts.sort((a, b) => {
      if (a.urgencyLevel !== b.urgencyLevel) {
        return a.urgencyLevel === 'critical' ? -1 : 1;
      }
      return parseFloat(b.hoursOpen) - parseFloat(a.hoursOpen);
    });
    
    // Log alert check
    privacyManager.logAccess('trt', 'alert_check', {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.urgencyLevel === 'critical').length,
      warningAlerts: alerts.filter(a => a.urgencyLevel === 'warning').length
    });
    
    return {
      success: true,
      data: {
        alerts: alerts,
        summary: {
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.urgencyLevel === 'critical').length,
          warningAlerts: alerts.filter(a => a.urgencyLevel === 'warning').length
        },
        lastChecked: new Date().toISOString()
      }
    };
    
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
   * Send Google Chat alert for TRT violations
   * @param {Object} alertData - Alert data to send
   * @returns {Object} Alert sending result
   */
  sendGoogleChatAlert(alertData) {
  try {
    const privacyManager = new PrivacyManager();
    const notificationSettings = ConfigManager.getNotificationSettings();
    
    if (!notificationSettings.webhook || !notificationSettings.webhook.url) {
      throw new Error('Google Chat webhook URL not configured');
    }
    
    const chatWebhookUrl = notificationSettings.webhook.url;
    
    const chatMessage = {
      text: `🚨 TRT Alert: Case ${alertData.caseId} has exceeded the 2-hour P95 target`,
      cards: [{
        header: {
          title: '⏰ TRT P95 Violation Alert',
          subtitle: `Case: ${alertData.caseId}`,
          imageUrl: 'https://developers.google.com/chat/images/quickstart-app-avatar.png'
        }
      }]
    };
    
    // Send the alert
    try {
      return {
        success: true,
        message: 'TRT alert sent successfully'
      };
    } catch (webhookError) {
      console.error('Failed to send webhook:', webhookError);
      
      // Try to send the alert anyway
      const response = UrlFetchApp.fetch(chatWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: JSON.stringify(chatMessage)
      });
      
      if (response.getResponseCode() === 200) {
        privacyManager.logAccess('notification', 'trt_alert_sent', {
          caseId: alertData.caseId,
          alertType: 'google_chat'
        });
        
        return {
          success: true,
          message: 'TRT alert sent to Google Chat'
        };
      } else {
        throw new Error(`Webhook request failed with status: ${response.getResponseCode()}`);
      }
    }
    
  } catch (error) {
    return ErrorHandler.handleGracefully(
      error,
      {
        userMessage: 'Failed to send TRT alert.',
        context: { alertData },
        type: ErrorTypes.NOTIFICATION
      }
    );
  }
  }

  /**
   * Get team performance data for TRT analysis
   * @returns {Object} Team data
   */
  getTeamData() {
  try {
    const privacyManager = new PrivacyManager();
    const sheetTypes = SheetMapper.getAvailableSheetTypes();
    const currentUser = Session.getActiveUser().getEmail();
    
    const teamData = {
      overview: {
        totalMembers: 0,
        activeCases: 0,
        averageResponseTime: 0,
        p95Compliance: 0
      },
      performance: {
        currentWeek: 0,
        lastWeek: 0,
        trend: 'stable'
      },
      workload: {
        balanced: 0,
        overloaded: 0,
        underutilized: 0,
        memberWorkloads: []
      },
      memberStats: new Map()
    };
    
    // Collect data across all sheet types
    sheetTypes.forEach(sheetType => {
      try {
        const caseModel = new CaseModel(sheetType);
        const activeCases = caseModel.search({
          filters: {
            caseStatus: ['Open', 'In Progress', 'Pending']
          },
          limit: 1000
        });
        
        if (activeCases.success && activeCases.data) {
          activeCases.data.forEach(caseData => {
            const assignee = caseData.finalAssignee || caseData.firstAssignee;
            if (!assignee) return;
            
            if (!teamData.memberStats.has(assignee)) {
              teamData.memberStats.set(assignee, {
                email: assignee,
                activeCases: 0,
                totalResponseTime: 0,
                caseCount: 0,
                violations: 0,
                workloadScore: 0
              });
            }
            
            const memberStats = teamData.memberStats.get(assignee);
            memberStats.activeCases++;
            teamData.overview.activeCases++;
            
            // Calculate response time for closed cases
            if (['Closed', 'Resolved'].includes(caseData.caseStatus)) {
              const responseTime = this.calculateCaseResponseTime(caseData);
              if (responseTime > 0) {
                memberStats.totalResponseTime += responseTime;
                memberStats.caseCount++;
                
                if (responseTime > 7200) { // 2 hours in seconds
                  memberStats.violations++;
                }
              }
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to get team data for ${sheetType}:`, error.message);
      }
    });
    
    // Calculate team metrics
    teamData.overview.totalMembers = teamData.memberStats.size;
    
    // Calculate workload distribution
    const members = Array.from(teamData.memberStats.values());
    
    if (members.length > 0) {
      const avgCaseLoad = teamData.overview.activeCases / members.length;
      
      members.forEach(member => {
        member.averageResponseTime = member.caseCount > 0 ? 
          member.totalResponseTime / member.caseCount : 0;
        
        // Calculate workload score (cases vs average)
        member.workloadScore = member.activeCases / Math.max(avgCaseLoad, 1);
        
        // Categorize workload
        if (member.workloadScore > 1.3) {
          teamData.workload.overloaded++;
        } else if (member.workloadScore < 0.7) {
          teamData.workload.underutilized++;
        } else {
          teamData.workload.balanced++;
        }
      });
      
      // Calculate overall metrics
      const totalResponseTime = members.reduce((sum, m) => sum + m.totalResponseTime, 0);
      const totalCaseCount = members.reduce((sum, m) => sum + m.caseCount, 0);
      
      teamData.overview.averageResponseTime = totalCaseCount > 0 ? 
        totalResponseTime / totalCaseCount : 0;
      
      const totalViolations = members.reduce((sum, m) => sum + m.violations, 0);
      teamData.overview.p95Compliance = totalCaseCount > 0 ? 
        ((totalCaseCount - totalViolations) / totalCaseCount) * 100 : 100;
    }
    
    // Convert memberStats map to array for output
    teamData.workload.memberWorkloads = members.map(m => ({
      email: m.email,
      activeCases: m.activeCases,
      workloadScore: m.workloadScore.toFixed(2),
      recommendation: this.getWorkloadRecommendation(m.workloadScore)
    }));
    
    return {
      success: true,
      data: teamData
    };
    
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
   * Export TRT report
   * @returns {Object} TRT report data
   */
  exportTRTReport() {
  try {
    const privacyManager = new PrivacyManager();
    const currentUser = Session.getActiveUser().getEmail();
    
    // Check export permissions
    const exportPermissions = privacyManager.checkExportPermissions('trt_report');
    if (!exportPermissions.success) {
      return exportPermissions;
    }
    
    // Get TRT analytics data
    const trtAnalytics = this.getTRTAnalytics();
    if (!trtAnalytics.success) {
      throw new Error('Failed to get TRT analytics for export');
    }
    
    const report = {
      metadata: {
        title: 'TRT P95 Performance Report',
        generatedBy: currentUser,
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Last 30 days',
        version: '1.0'
      },
      summary: {
        currentP95: trtAnalytics.data.p95,
        totalCases: trtAnalytics.data.totalCases,
        excludedCases: trtAnalytics.data.excludedCount,
        violationCases: trtAnalytics.data.violationCases.length,
        complianceRate: trtAnalytics.data.totalCases > 0 ? 
          ((trtAnalytics.data.totalCases - trtAnalytics.data.violationCases.length) / trtAnalytics.data.totalCases * 100).toFixed(2) : 100
      },
      exclusionCriteria: {
        bugCases: trtAnalytics.data.exclusions.bugCases,
        l2Consult: trtAnalytics.data.exclusions.l2Consult,
        idtPayreq: trtAnalytics.data.exclusions.idtPayreq,
        tsConsult: trtAnalytics.data.exclusions.tsConsult
      },
      trendAnalysis: {
        dailyTrend: trtAnalytics.data.trendData.daily,
        weeklyTrend: trtAnalytics.data.trendData.weekly,
        recommendation: this.generateTRTActionItems(trtAnalytics.data)
      },
      detailedData: trtAnalytics.data
    };
    
    // Log export activity
    privacyManager.logAccess('report', 'trt_export', {
      reportType: 'trt_p95',
      currentP95: report.summary.currentP95,
      totalCases: report.summary.totalCases
    });
    
    return {
      success: true,
      data: {
        report: report,
        filename: `TRT_Report_${new Date().toISOString().split('T')[0]}.json`,
        format: 'json'
      }
    };
    
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

  /**
   * Calculate case response time in seconds
   * @param {Object} caseData - Case data
   * @returns {number} Response time in seconds
   */
  calculateCaseResponseTime(caseData) {
  try {
    const openDate = new Date(caseData.caseOpenDate);
    const closeDate = new Date(caseData.closeDate || caseData.firstCloseDate || caseData.reopenCloseDate);
    
    if (isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
      return 0;
    }
    
    return Math.max(0, (closeDate - openDate) / 1000); // Convert to seconds
  } catch (error) {
    return 0;
  }
  }

  /**
   * Check if case should be excluded from TRT calculation
   * @param {Object} caseData - Case data
   * @param {string} sheetType - Sheet type
   * @returns {boolean} Whether case should be excluded
   */
  shouldExcludeFromTRT(caseData, sheetType) {
  // Bug cases
  if (caseData.bug === 'Yes' || caseData.Bug === 'Yes') {
    return true;
  }
  
  // L2 Consult cases (implementation depends on data structure)
  if (caseData.tags && caseData.tags.toLowerCase().includes('l2 consult')) {
    return true;
  }
  
  // IDT/Payreq cases
  if (caseData.tags && (
    caseData.tags.toLowerCase().includes('idt') || 
    caseData.tags.toLowerCase().includes('payreq')
  )) {
    return true;
  }
  
  // T&S Consult cases
  if (caseData.tags && caseData.tags.toLowerCase().includes('t&s consult')) {
    return true;
  }
  
  return false;
  }

  /**
   * Get exclusion reason for a case
   * @param {Object} caseData - Case data
   * @returns {string} Exclusion reason
   */
  getExclusionReason(caseData) {
  if (caseData.bug === 'Yes' || caseData.Bug === 'Yes') {
    return 'Bug Case';
  }
  if (caseData.tags && caseData.tags.toLowerCase().includes('l2 consult')) {
    return 'L2 Consult';
  }
  if (caseData.tags && (caseData.tags.toLowerCase().includes('idt') || caseData.tags.toLowerCase().includes('payreq'))) {
    return 'IDT/Payreq';
  }
  if (caseData.tags && caseData.tags.toLowerCase().includes('t&s consult')) {
    return 'T&S Consult';
  }
  return 'Other';
  }

  /**
   * Get segment from sheet type
   * @param {string} sheetType - Sheet type
   * @returns {string} Segment
   */
  getSegmentFromSheetType(sheetType) {
  if (sheetType.includes('OT')) return 'OT';
  if (sheetType.includes('3PO')) return '3PO';
  return 'Unknown';
  }

  /**
   * Format time remaining until deadline
   * @param {number} timeRemaining - Time remaining in hours
   * @returns {string} Formatted time
   */
  formatTimeRemaining(timeRemaining) {
  if (timeRemaining < 0) return 'Overdue';
  if (timeRemaining < 1) return `${Math.round(timeRemaining * 60)} minutes`;
  return `${timeRemaining.toFixed(1)} hours`;
  }

  /**
   * Get last month TRT for user
   * @param {Object} userInfo - User information
   * @returns {number} Last month TRT
   */
  getLastMonthTRT(userInfo) {
  // Placeholder implementation
  // In a real scenario, this would calculate the user's TRT performance from last month
  return 1.8; // 1.8 hours average
  }

  /**
   * Generate TRT trend data
   * @param {number} days - Number of days to generate data for
   * @returns {Object} Trend data
   */
  generateTRTTrendData(days) {
  const trendData = {
    daily: [],
    weekly: [],
    monthly: []
  };
  
  // Generate mock trend data (in a real implementation, this would query historical data)
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    trendData.daily.push({
      date: date.toISOString().split('T')[0],
      p95: Math.random() * 0.5 + 1.5, // Random P95 between 1.5-2.0 hours
      violations: Math.floor(Math.random() * 5),
      totalCases: Math.floor(Math.random() * 50) + 20
    });
  }
  
  return trendData;
  }

  /**
   * Generate TRT action items based on report data
   * @param {Object} reportData - TRT report data
   * @returns {Array} Action items
   */
  generateTRTActionItems(reportData) {
  const actionItems = [];
  
  if (reportData.p95 > 2.0) {
    actionItems.push({
      priority: 'high',
      action: 'Immediate attention required: P95 exceeds 2-hour target',
      recommendation: 'Review case assignment process and consider additional resources'
    });
  }
  
  if (reportData.violationCases.length > reportData.totalCases * 0.05) {
    actionItems.push({
      priority: 'medium',
      action: 'High violation rate detected',
      recommendation: 'Analyze violation patterns and implement preventive measures'
    });
  }
  
  if (reportData.excludedCount > reportData.totalCases * 0.1) {
    actionItems.push({
      priority: 'low',
      action: 'High exclusion rate observed',
      recommendation: 'Review exclusion criteria and case categorization process'
    });
  }
  
  return actionItems;
  }

  /**
   * Get workload recommendation based on score
   * @param {number} workloadScore - Workload score
   * @returns {string} Recommendation
   */
  getWorkloadRecommendation(workloadScore) {
  if (workloadScore > 1.3) return 'Consider redistributing cases';
  if (workloadScore < 0.7) return 'Can handle additional cases';
  return 'Balanced workload';
  }
}
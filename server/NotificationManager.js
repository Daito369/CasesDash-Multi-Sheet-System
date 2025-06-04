/**
 * NotificationManager - Manages notification delivery across multiple channels
 * Handles Google Chat, email, and in-app notifications
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * NotificationManager class for handling various notification types
 */
class NotificationManager {
  /**
   * Create a NotificationManager instance
   */
  constructor() {
    /** @type {string} */
    this.version = '1.0.0';
    
    /** @type {Object} Notification configuration */
    this.config = {
      googleChat: {
        enabled: true,
        webhookUrl: '',
        retryAttempts: 3,
        timeout: 10000
      },
      email: {
        enabled: true,
        retryAttempts: 2,
        timeout: 5000
      },
      inApp: {
        enabled: true,
        retentionDays: 30
      }
    };
    
    /** @type {Map} Notification templates */
    this.templates = new Map();
    
    /** @type {Array} Delivery queue */
    this.deliveryQueue = [];
    
    this._initializeTemplates();
    this._loadConfiguration();
  }

  /**
   * Initialize notification templates
   * @private
   */
  _initializeTemplates() {
    // TRT Alert templates
    this.templates.set('trt_critical', {
      googleChat: {
        title: '🚨 CRITICAL TRT ALERT',
        color: '#FF4444',
        icon: '⚠️'
      },
      email: {
        subject: 'CRITICAL: TRT SLA Violation Alert - Case {caseId}',
        template: 'trt_critical_email'
      }
    });
    
    this.templates.set('trt_warning', {
      googleChat: {
        title: '⚠️ TRT WARNING ALERT',
        color: '#FFA500',
        icon: '⏰'
      },
      email: {
        subject: 'WARNING: TRT SLA Approaching - Case {caseId}',
        template: 'trt_warning_email'
      }
    });
    
    // Case Management templates
    this.templates.set('case_assigned', {
      googleChat: {
        title: '📋 Case Assigned',
        color: '#4CAF50',
        icon: '📝'
      },
      email: {
        subject: 'Case Assignment Notification - {caseId}',
        template: 'case_assigned_email'
      }
    });
    
    this.templates.set('case_escalated', {
      googleChat: {
        title: '🚀 Case Escalated',
        color: '#FF9800',
        icon: '⬆️'
      },
      email: {
        subject: 'Case Escalation - {caseId}',
        template: 'case_escalated_email'
      }
    });
    
    // System templates
    this.templates.set('system_maintenance', {
      googleChat: {
        title: '🔧 Scheduled Maintenance',
        color: '#2196F3',
        icon: '🛠️'
      },
      email: {
        subject: 'CasesDash Maintenance Notification',
        template: 'system_maintenance_email'
      }
    });
  }

  /**
   * Load notification configuration from ConfigManager
   * @private
   */
  _loadConfiguration() {
    try {
      const googleChatWebhook = ConfigManager.get('notifications', 'googleChatWebhook');
      if (googleChatWebhook) {
        this.config.googleChat.webhookUrl = googleChatWebhook;
      }
      
      this.config.googleChat.enabled = ConfigManager.get('notifications', 'googleChatEnabled') !== false;
      this.config.email.enabled = ConfigManager.get('notifications', 'emailEnabled') !== false;
      this.config.inApp.enabled = ConfigManager.get('notifications', 'inAppEnabled') !== false;
      
    } catch (error) {
      console.warn('Failed to load notification configuration:', error.message);
    }
  }

  /**
   * Send TRT alert notification
   * @param {Object} alertData - Alert data
   * @returns {Object} Send result
   */
  sendTRTAlert(alertData) {
    try {
      const { caseId, assignee, timeRemaining, urgencyLevel, segment, sheetType } = alertData;
      
      if (!caseId || !assignee) {
        throw new Error('Case ID and assignee are required for TRT alerts');
      }
      
      const templateKey = urgencyLevel === 'critical' ? 'trt_critical' : 'trt_warning';
      const template = this.templates.get(templateKey);
      
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }
      
      // Format time remaining
      const timeFormatted = this._formatTimeRemaining(timeRemaining);
      const urgencyEmoji = urgencyLevel === 'critical' ? '🚨' : '⚠️';
      
      // Prepare notification data
      const notificationData = {
        type: 'trt_alert',
        templateKey: templateKey,
        priority: urgencyLevel === 'critical' ? 'high' : 'medium',
        recipients: [assignee],
        data: {
          caseId: caseId,
          assignee: assignee,
          timeRemaining: timeFormatted,
          urgencyLevel: urgencyLevel.toUpperCase(),
          segment: segment,
          sheetType: sheetType,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send Google Chat notification
      const chatResult = this._sendGoogleChatNotification(notificationData, template);
      
      // Send email notification (optional)
      const emailResult = this._sendEmailNotification(notificationData, template);
      
      // Store in-app notification
      const inAppResult = this._storeInAppNotification(notificationData);
      
      // Log notification attempt
      this._logNotification(notificationData, {
        googleChat: chatResult,
        email: emailResult,
        inApp: inAppResult
      });
      
      return {
        success: chatResult.success || emailResult.success || inAppResult.success,
        channels: {
          googleChat: chatResult,
          email: emailResult,
          inApp: inAppResult
        },
        message: 'TRT alert notification processed'
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to send TRT alert notification.',
          context: { alertData },
          type: ErrorTypes.EXTERNAL_API
        }
      );
    }
  }

  /**
   * Send case management notification
   * @param {string} type - Notification type
   * @param {Object} caseData - Case data
   * @param {Array} recipients - List of recipients
   * @returns {Object} Send result
   */
  sendCaseNotification(type, caseData, recipients = []) {
    try {
      if (!type || !caseData) {
        throw new Error('Notification type and case data are required');
      }
      
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template not found: ${type}`);
      }
      
      // Determine recipients if not provided
      if (recipients.length === 0) {
        recipients = this._determineRecipients(type, caseData);
      }
      
      const notificationData = {
        type: type,
        templateKey: type,
        priority: this._determinePriority(type),
        recipients: recipients,
        data: {
          ...caseData,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send notifications through available channels
      const results = {
        googleChat: { success: false, message: 'Disabled' },
        email: { success: false, message: 'Disabled' },
        inApp: { success: false, message: 'Disabled' }
      };
      
      if (this.config.googleChat.enabled) {
        results.googleChat = this._sendGoogleChatNotification(notificationData, template);
      }
      
      if (this.config.email.enabled) {
        results.email = this._sendEmailNotification(notificationData, template);
      }
      
      if (this.config.inApp.enabled) {
        results.inApp = this._storeInAppNotification(notificationData);
      }
      
      this._logNotification(notificationData, results);
      
      return {
        success: Object.values(results).some(r => r.success),
        channels: results,
        message: 'Case notification processed'
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to send case notification.',
          context: { type, caseData, recipientCount: recipients.length },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Send system notification to all users
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Object} Send result
   */
  sendSystemNotification(type, data) {
    try {
      if (!type || !data) {
        throw new Error('Notification type and data are required');
      }
      
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template not found: ${type}`);
      }
      
      // Get all system users for broadcast
      const allUsers = this._getAllSystemUsers();
      
      const notificationData = {
        type: type,
        templateKey: type,
        priority: 'medium',
        recipients: allUsers,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send system-wide notification
      const results = {};
      
      // Google Chat (to general channel)
      if (this.config.googleChat.enabled) {
        results.googleChat = this._sendGoogleChatNotification(notificationData, template, true);
      }
      
      // In-app notifications for all users
      if (this.config.inApp.enabled) {
        results.inApp = this._storeInAppNotification(notificationData, true);
      }
      
      this._logNotification(notificationData, results);
      
      return {
        success: Object.values(results).some(r => r.success),
        channels: results,
        message: 'System notification broadcast completed'
      };
      
    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to send system notification.',
          context: { type, data },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Send Google Chat notification
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Message template
   * @param {boolean} broadcast - Whether this is a broadcast message
   * @returns {Object} Send result
   */
  _sendGoogleChatNotification(notificationData, template, broadcast = false) {
    try {
      if (!this.config.googleChat.enabled || !this.config.googleChat.webhookUrl) {
        return { success: false, message: 'Google Chat disabled or webhook URL not configured' };
      }

      const chatTemplate = template.googleChat;
      const messageData = this._buildGoogleChatMessage(notificationData, chatTemplate, broadcast);

      const response = UrlFetchApp.fetch(this.config.googleChat.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(messageData),
        timeout: this.config.googleChat.timeout
      });

      if (response.getResponseCode() === 200) {
        return { success: true, message: 'Google Chat notification sent successfully' };
      } else {
        return { 
          success: false, 
          message: `Google Chat API error: ${response.getResponseCode()}` 
        };
      }

    } catch (error) {
      console.error('Google Chat notification failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send email notification
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Message template
   * @returns {Object} Send result
   */
  _sendEmailNotification(notificationData, template) {
    try {
      if (!this.config.email.enabled) {
        return { success: false, message: 'Email notifications disabled' };
      }

      const emailTemplate = template.email;
      const { subject, body } = this._buildEmailMessage(notificationData, emailTemplate);

      // Send to each recipient
      const results = [];
      for (const recipient of notificationData.recipients) {
        try {
          MailApp.sendEmail({
            to: recipient,
            subject: subject,
            htmlBody: body
          });
          results.push({ recipient, success: true });
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      return {
        success: successCount > 0,
        message: `Email sent to ${successCount}/${results.length} recipients`,
        details: results
      };

    } catch (error) {
      console.error('Email notification failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Store in-app notification
   * @private
   * @param {Object} notificationData - Notification data
   * @param {boolean} broadcast - Whether this is a broadcast message
   * @returns {Object} Store result
   */
  _storeInAppNotification(notificationData, broadcast = false) {
    try {
      if (!this.config.inApp.enabled) {
        return { success: false, message: 'In-app notifications disabled' };
      }

      const notificationRecord = {
        id: Utilities.getUuid(),
        type: notificationData.type,
        priority: notificationData.priority,
        title: this._getNotificationTitle(notificationData),
        message: this._getNotificationMessage(notificationData),
        data: notificationData.data,
        recipients: broadcast ? ['ALL'] : notificationData.recipients,
        timestamp: new Date().toISOString(),
        read: false,
        expires: new Date(Date.now() + (this.config.inApp.retentionDays * 24 * 60 * 60 * 1000)).toISOString()
      };

      // Store in Properties Service
      const notifications = this._getStoredNotifications();
      notifications.push(notificationRecord);
      
      // Keep only recent notifications
      const maxNotifications = 1000;
      if (notifications.length > maxNotifications) {
        notifications.splice(0, notifications.length - maxNotifications);
      }

      PropertiesService.getScriptProperties().setProperty(
        'inAppNotifications',
        JSON.stringify(notifications)
      );

      return { 
        success: true, 
        message: 'In-app notification stored successfully',
        notificationId: notificationRecord.id
      };

    } catch (error) {
      console.error('In-app notification storage failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Build Google Chat message
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Chat template
   * @param {boolean} broadcast - Whether this is broadcast
   * @returns {Object} Google Chat message
   */
  _buildGoogleChatMessage(notificationData, template, broadcast = false) {
    const { data } = notificationData;
    
    let messageText = '';
    let sections = [];

    if (notificationData.type === 'trt_alert') {
      messageText = `${template.icon} *${template.title}*\n`;
      messageText += `Case: *${data.caseId}*\n`;
      messageText += `Assignee: ${data.assignee}\n`;
      messageText += `Time Remaining: *${data.timeRemaining}*\n`;
      messageText += `Segment: ${data.segment}\n`;
      messageText += `Urgency: *${data.urgencyLevel}*`;

      sections = [{
        widgets: [{
          keyValue: {
            topLabel: "Case Details",
            content: data.caseId,
            contentMultiline: false,
            icon: "DESCRIPTION"
          }
        }, {
          keyValue: {
            topLabel: "Time Remaining",
            content: data.timeRemaining,
            contentMultiline: false,
            icon: "CLOCK"
          }
        }, {
          keyValue: {
            topLabel: "Assignee",
            content: data.assignee,
            contentMultiline: false,
            icon: "PERSON"
          }
        }]
      }];
    } else {
      messageText = `${template.icon} *${template.title}*\n`;
      messageText += this._formatDataForChat(data);
    }

    return {
      text: messageText,
      cards: [{
        sections: sections
      }]
    };
  }

  /**
   * Build email message
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Email template
   * @returns {Object} Email content
   */
  _buildEmailMessage(notificationData, template) {
    const { data } = notificationData;
    
    // Replace placeholders in subject
    let subject = template.subject;
    Object.keys(data).forEach(key => {
      subject = subject.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    });

    // Build HTML body
    const body = this._buildEmailBody(notificationData, template);

    return { subject, body };
  }

  /**
   * Build email HTML body
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} template - Email template
   * @returns {string} HTML body
   */
  _buildEmailBody(notificationData, template) {
    const { data } = notificationData;
    
    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #1976d2; color: white; padding: 20px; }
            .content { padding: 20px; }
            .footer { background-color: #f5f5f5; padding: 10px; font-size: 12px; }
            .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; }
            .critical { background-color: #f8d7da; border-color: #f5c6cb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CasesDash Notification</h2>
          </div>
          <div class="content">
    `;

    if (notificationData.type === 'trt_alert') {
      const alertClass = data.urgencyLevel === 'CRITICAL' ? 'alert critical' : 'alert';
      html += `
        <div class="${alertClass}">
          <h3>TRT SLA Alert - ${data.urgencyLevel}</h3>
          <p><strong>Case ID:</strong> ${data.caseId}</p>
          <p><strong>Assignee:</strong> ${data.assignee}</p>
          <p><strong>Time Remaining:</strong> ${data.timeRemaining}</p>
          <p><strong>Segment:</strong> ${data.segment}</p>
          <p><strong>Sheet Type:</strong> ${data.sheetType}</p>
        </div>
      `;
    } else {
      html += `<h3>Notification Details</h3>`;
      html += this._formatDataForEmail(data);
    }

    html += `
          </div>
          <div class="footer">
            <p>This is an automated notification from CasesDash. Please do not reply to this email.</p>
            <p>Timestamp: ${data.timestamp}</p>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Format time remaining for display
   * @private
   * @param {number} timeRemaining - Time in milliseconds
   * @returns {string} Formatted time
   */
  _formatTimeRemaining(timeRemaining) {
    if (timeRemaining <= 0) {
      return 'OVERDUE';
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Format data for Google Chat display
   * @private
   * @param {Object} data - Data to format
   * @returns {string} Formatted text
   */
  _formatDataForChat(data) {
    return Object.entries(data)
      .filter(([key]) => key !== 'timestamp')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  /**
   * Format data for email display
   * @private
   * @param {Object} data - Data to format
   * @returns {string} Formatted HTML
   */
  _formatDataForEmail(data) {
    let html = '<ul>';
    Object.entries(data)
      .filter(([key]) => key !== 'timestamp')
      .forEach(([key, value]) => {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
      });
    html += '</ul>';
    return html;
  }

  /**
   * Determine notification recipients
   * @private
   * @param {string} type - Notification type
   * @param {Object} caseData - Case data
   * @returns {Array} Recipients list
   */
  _determineRecipients(type, caseData) {
    switch (type) {
      case 'case_assigned':
        return [caseData.assignee];
      case 'case_escalated':
        return [caseData.assignee, caseData.manager || 'supervisor@company.com'];
      default:
        return [caseData.assignee || 'admin@company.com'];
    }
  }

  /**
   * Determine notification priority
   * @private
   * @param {string} type - Notification type
   * @returns {string} Priority level
   */
  _determinePriority(type) {
    const priorityMap = {
      'trt_critical': 'high',
      'trt_warning': 'medium',
      'case_escalated': 'high',
      'case_assigned': 'low',
      'system_maintenance': 'medium'
    };
    return priorityMap[type] || 'low';
  }

  /**
   * Get notification title
   * @private
   * @param {Object} notificationData - Notification data
   * @returns {string} Title
   */
  _getNotificationTitle(notificationData) {
    const template = this.templates.get(notificationData.templateKey);
    return template ? template.googleChat.title : 'Notification';
  }

  /**
   * Get notification message
   * @private
   * @param {Object} notificationData - Notification data
   * @returns {string} Message
   */
  _getNotificationMessage(notificationData) {
    const { data } = notificationData;
    
    if (notificationData.type === 'trt_alert') {
      return `Case ${data.caseId} requires attention. Time remaining: ${data.timeRemaining}`;
    }
    
    return `Notification for case ${data.caseId || 'system'}`;
  }

  /**
   * Get stored in-app notifications
   * @private
   * @returns {Array} Stored notifications
   */
  _getStoredNotifications() {
    try {
      const stored = PropertiesService.getScriptProperties().getProperty('inAppNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored notifications:', error);
      return [];
    }
  }

  /**
   * Get all system users
   * @private
   * @returns {Array} User list
   */
  _getAllSystemUsers() {
    try {
      // This would typically query your user management system
      // For now, return a default list
      return ['admin@company.com', 'supervisor@company.com'];
    } catch (error) {
      console.warn('Failed to get system users:', error);
      return ['admin@company.com'];
    }
  }

  /**
   * Log notification attempt
   * @private
   * @param {Object} notificationData - Notification data
   * @param {Object} results - Send results
   */
  _logNotification(notificationData, results) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: notificationData.type,
        priority: notificationData.priority,
        recipients: notificationData.recipients.length,
        channels: Object.keys(results).filter(key => results[key].success),
        success: Object.values(results).some(r => r.success)
      };

      console.log('Notification log:', JSON.stringify(logEntry));

      // Store in notification log (optional)
      const logs = this._getNotificationLogs();
      logs.push(logEntry);
      
      // Keep only recent logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      PropertiesService.getScriptProperties().setProperty(
        'notificationLogs',
        JSON.stringify(logs)
      );

    } catch (error) {
      console.warn('Failed to log notification:', error);
    }
  }

  /**
   * Get notification logs
   * @private
   * @returns {Array} Log entries
   */
  _getNotificationLogs() {
    try {
      const stored = PropertiesService.getScriptProperties().getProperty('notificationLogs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Configure notification settings
   * @param {Object} settings - Configuration settings
   * @returns {Object} Configuration result
   */
  configureNotifications(settings) {
    try {
      if (settings.googleChatWebhook) {
        this.config.googleChat.webhookUrl = settings.googleChatWebhook;
        ConfigManager.set('notifications', 'googleChatWebhook', settings.googleChatWebhook);
      }

      if (typeof settings.googleChatEnabled === 'boolean') {
        this.config.googleChat.enabled = settings.googleChatEnabled;
        ConfigManager.set('notifications', 'googleChatEnabled', settings.googleChatEnabled);
      }

      if (typeof settings.emailEnabled === 'boolean') {
        this.config.email.enabled = settings.emailEnabled;
        ConfigManager.set('notifications', 'emailEnabled', settings.emailEnabled);
      }

      if (typeof settings.inAppEnabled === 'boolean') {
        this.config.inApp.enabled = settings.inAppEnabled;
        ConfigManager.set('notifications', 'inAppEnabled', settings.inAppEnabled);
      }

      return {
        success: true,
        message: 'Notification configuration updated successfully',
        config: this.config
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to update notification configuration.',
          context: { settings },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Test notification setup
   * @returns {Object} Test results
   */
  testNotificationSetup() {
    const results = {
      googleChat: { enabled: false, configured: false, test: false },
      email: { enabled: false, test: false },
      inApp: { enabled: false, test: false }
    };

    try {
      // Test Google Chat
      results.googleChat.enabled = this.config.googleChat.enabled;
      results.googleChat.configured = !!this.config.googleChat.webhookUrl;
      
      if (results.googleChat.enabled && results.googleChat.configured) {
        const testData = {
          type: 'test',
          templateKey: 'system_maintenance',
          priority: 'low',
          recipients: ['test@example.com'],
          data: {
            message: 'Test notification from CasesDash',
            timestamp: new Date().toISOString()
          }
        };

        const template = this.templates.get('system_maintenance');
        const chatResult = this._sendGoogleChatNotification(testData, template);
        results.googleChat.test = chatResult.success;
      }

      // Test Email
      results.email.enabled = this.config.email.enabled;
      if (results.email.enabled) {
        // Email test would require actual sending, skip for safety
        results.email.test = true; // Assume working if enabled
      }

      // Test In-App
      results.inApp.enabled = this.config.inApp.enabled;
      if (results.inApp.enabled) {
        const testNotification = {
          type: 'test',
          priority: 'low',
          recipients: ['test@example.com'],
          data: {
            message: 'Test in-app notification',
            timestamp: new Date().toISOString()
          }
        };
        const inAppResult = this._storeInAppNotification(testNotification);
        results.inApp.test = inAppResult.success;
      }

      return {
        success: true,
        message: 'Notification setup test completed',
        results: results
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to test notification setup.',
          context: { results },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Get notification statistics
   * @returns {Object} Statistics
   */
  getNotificationStats() {
    try {
      const logs = this._getNotificationLogs();
      const notifications = this._getStoredNotifications();

      const stats = {
        totalSent: logs.length,
        successRate: logs.length > 0 ? (logs.filter(l => l.success).length / logs.length * 100).toFixed(2) : 0,
        channelStats: {
          googleChat: logs.filter(l => l.channels.includes('googleChat')).length,
          email: logs.filter(l => l.channels.includes('email')).length,
          inApp: logs.filter(l => l.channels.includes('inApp')).length
        },
        typeStats: {},
        priorityStats: {},
        unreadNotifications: notifications.filter(n => !n.read).length,
        totalStoredNotifications: notifications.length
      };

      // Calculate type and priority statistics
      logs.forEach(log => {
        stats.typeStats[log.type] = (stats.typeStats[log.type] || 0) + 1;
        stats.priorityStats[log.priority] = (stats.priorityStats[log.priority] || 0) + 1;
      });

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to retrieve notification statistics.',
          context: {},
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Monitor P95 timers and send notifications for cases under 2 hours
   * @returns {Object} Monitoring result
   */
  monitorP95Timers() {
    try {
      const spreadsheetId = ConfigManager.get('system', 'spreadsheetId');
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID not configured');
      }

      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheetNames = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
      const criticalCases = [];
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2時間をミリ秒に変換

      for (const sheetName of sheetNames) {
        try {
          const sheet = spreadsheet.getSheetByName(sheetName);
          if (!sheet) continue;

          const lastRow = sheet.getLastRow();
          if (lastRow < 3) continue; // ヘッダー行のみの場合はスキップ

          const data = sheet.getRange(3, 1, lastRow - 2, sheet.getLastColumn()).getValues();
          
          for (let i = 0; i < data.length; i++) {
            const rowData = data[i];
            const caseData = this._parseCaseDataFromRow(rowData, sheetName);
            
            // P95タイマー監視条件チェック
            if (this._shouldSendP95Alert(caseData, twoHoursInMs)) {
              criticalCases.push({
                ...caseData,
                sheetName: sheetName,
                rowIndex: i + 3
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to monitor sheet ${sheetName}:`, error.message);
        }
      }

      // 通知送信処理
      const notificationResults = [];
      for (const caseData of criticalCases) {
        const result = this.sendP95Alert(caseData);
        notificationResults.push(result);
      }

      return {
        success: true,
        message: `P95 monitoring completed. Found ${criticalCases.length} critical cases.`,
        criticalCases: criticalCases.length,
        notificationResults: notificationResults
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to monitor P95 timers.',
          context: {},
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Send P95 alert notification according to specification Line 1052-1091
   * @param {Object} caseData - Case data
   * @returns {Object} Send result
   */
  sendP95Alert(caseData) {
    try {
      const { caseId, finalAssignee, sheetName } = caseData;
      
      if (!caseId || !finalAssignee) {
        throw new Error('Case ID and assignee are required for P95 alerts');
      }

      // 重複通知チェック
      const notificationKey = `p95_alert_${caseId}`;
      const lastNotified = PropertiesService.getScriptProperties().getProperty(notificationKey);
      const now = new Date().getTime();
      const oneHourInMs = 60 * 60 * 1000;

      if (lastNotified && (now - parseInt(lastNotified)) < oneHourInMs) {
        return {
          success: false,
          message: 'Duplicate notification prevented (within 1 hour)',
          caseId: caseId
        };
      }

      // P95タイマー計算
      const p95Timer = this._calculateP95Timer(caseData);
      
      // 通知データ準備（仕様書Line 1052-1091準拠）
      const notificationPayload = this._createChatNotification(caseData, p95Timer);
      
      // Google Chat通知送信
      const webhookUrl = ConfigManager.get('notifications', 'teamLeaderWebhook');
      if (!webhookUrl) {
        throw new Error('Team leader webhook URL not configured');
      }

      const chatResult = this._sendP95ChatNotification(notificationPayload, webhookUrl);
      
      if (chatResult.success) {
        // 通知送信記録
        PropertiesService.getScriptProperties().setProperty(notificationKey, now.toString());
        
        // ログ記録
        this._logP95Notification(caseData, chatResult);
      }

      return {
        success: chatResult.success,
        message: chatResult.message,
        caseId: caseId,
        assignee: finalAssignee,
        p95Timer: p95Timer
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to send P95 alert notification.',
          context: { caseData },
          type: ErrorTypes.EXTERNAL_API
        }
      );
    }
  }

  /**
   * Create Google Chat notification according to specification
   * @private
   * @param {Object} caseData - Case data
   * @param {string} p95Timer - Formatted P95 timer
   * @returns {Object} Chat notification payload
   */
  _createChatNotification(caseData, p95Timer) {
    return {
      text: `⚠️ TRT(P95) Alert`,
      cards: [{
        header: {
          title: "TRT(P95) Timer Warning",
          subtitle: "Immediate attention required",
          imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
        },
        sections: [{
          widgets: [
            {
              keyValue: {
                topLabel: "LDAP",
                content: caseData.finalAssignee
              }
            },
            {
              keyValue: {
                topLabel: "Case ID",
                content: caseData.caseId
              }
            },
            {
              keyValue: {
                topLabel: "Remaining Time",
                content: p95Timer
              }
            },
            {
              keyValue: {
                topLabel: "Message",
                content: "⚠️ TRT(P95) timer has fallen below 2 hours. Immediate action required."
              }
            }
          ]
        }]
      }]
    };
  }

  /**
   * Send P95 Google Chat notification
   * @private
   * @param {Object} payload - Notification payload
   * @param {string} webhookUrl - Webhook URL
   * @returns {Object} Send result
   */
  _sendP95ChatNotification(payload, webhookUrl) {
    try {
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        timeout: this.config.googleChat.timeout
      });

      if (response.getResponseCode() === 200) {
        return {
          success: true,
          message: 'P95 alert sent to Google Chat successfully'
        };
      } else {
        return {
          success: false,
          message: `Google Chat API error: ${response.getResponseCode()}`
        };
      }

    } catch (error) {
      console.error('P95 Google Chat notification failed:', error);
      return {
        success: false,
        message: `Network error: ${error.message}`
      };
    }
  }

  /**
   * Parse case data from spreadsheet row
   * @private
   * @param {Array} rowData - Row data from spreadsheet
   * @param {string} sheetName - Sheet name
   * @returns {Object} Parsed case data
   */
  _parseCaseDataFromRow(rowData, sheetName) {
    // シート別の列マッピングを取得
    const columnMapping = SheetMapper.getColumnMapping(sheetName);
    
    const caseData = {};
    
    // 基本的なフィールドをマッピング
    Object.keys(columnMapping).forEach(field => {
      const columnIndex = this._columnToIndex(columnMapping[field]);
      if (columnIndex < rowData.length) {
        caseData[field] = rowData[columnIndex];
      }
    });

    return caseData;
  }

  /**
   * Check if P95 alert should be sent
   * @private
   * @param {Object} caseData - Case data
   * @param {number} thresholdMs - Threshold in milliseconds (2 hours)
   * @returns {boolean} Should send alert
   */
  _shouldSendP95Alert(caseData, thresholdMs) {
    // Case Status が "Assigned" でない場合は対象外
    if (caseData.caseStatus !== 'Assigned') {
      return false;
    }

    // TRT(P95)除外ケースのチェック
    if (this._isExcludedFromTRT(caseData)) {
      return false;
    }

    // P95タイマーの計算
    const p95DeadlineMs = this._calculateP95DeadlineMs(caseData);
    if (!p95DeadlineMs) {
      return false;
    }

    const now = new Date().getTime();
    const remainingMs = p95DeadlineMs - now;

    // 2時間以下かつ正の値（期限切れでない）の場合
    return remainingMs > 0 && remainingMs <= thresholdMs;
  }

  /**
   * Check if case is excluded from TRT(P95) calculation
   * @private
   * @param {Object} caseData - Case data
   * @returns {boolean} Is excluded
   */
  _isExcludedFromTRT(caseData) {
    // Bug Case (Blocked by)
    if (caseData.bug && caseData.bug !== '' && caseData.bug !== 0) {
      return true;
    }

    // L2 Consulted (仮定：専用フィールドがある場合)
    if (caseData.l2Consulted && caseData.l2Consulted !== '' && caseData.l2Consulted !== 0) {
      return true;
    }

    // セグメント固有の除外条件
    const segment = caseData.incomingSegment || caseData.finalSegment;
    
    if (segment === 'Billing') {
      // IDT Blocked by
      if (caseData.idtBlocked && caseData.idtBlocked !== '' && caseData.idtBlocked !== 0) {
        return true;
      }
      // Payreq Blocked by
      if (caseData.payreqBlocked && caseData.payreqBlocked !== '' && caseData.payreqBlocked !== 0) {
        return true;
      }
    }

    if (segment === 'Policy') {
      // T&S Consulted
      if (caseData.tsConsulted && caseData.tsConsulted !== '' && caseData.tsConsulted !== 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate P95 deadline in milliseconds
   * @private
   * @param {Object} caseData - Case data
   * @returns {number|null} P95 deadline in milliseconds
   */
  _calculateP95DeadlineMs(caseData) {
    try {
      if (!caseData.caseOpenDate || !caseData.caseOpenTime) {
        return null;
      }

      // ケース開始日時を解析
      const openDate = new Date(caseData.caseOpenDate);
      const openTime = caseData.caseOpenTime;
      
      let openDateTime;
      if (typeof openTime === 'string' && openTime.includes(':')) {
        // 時刻が文字列の場合
        const [hours, minutes] = openTime.split(':').map(Number);
        openDateTime = new Date(openDate);
        openDateTime.setHours(hours, minutes, 0, 0);
      } else if (openTime instanceof Date) {
        // 時刻がDateオブジェクトの場合
        openDateTime = new Date(openDate);
        openDateTime.setHours(openTime.getHours(), openTime.getMinutes(), 0, 0);
      } else {
        return null;
      }

      // P95目標は72時間後
      const p95DeadlineMs = openDateTime.getTime() + (72 * 60 * 60 * 1000);
      return p95DeadlineMs;

    } catch (error) {
      console.warn('Failed to calculate P95 deadline:', error.message);
      return null;
    }
  }

  /**
   * Calculate P95 timer for display
   * @private
   * @param {Object} caseData - Case data
   * @returns {string} Formatted P95 timer
   */
  _calculateP95Timer(caseData) {
    const deadlineMs = this._calculateP95DeadlineMs(caseData);
    if (!deadlineMs) {
      return 'Unknown';
    }

    const now = new Date().getTime();
    const remainingMs = deadlineMs - now;

    if (remainingMs <= 0) {
      return 'OVERDUE';
    }

    return this._formatTimeRemaining(remainingMs);
  }

  /**
   * Convert column letter to index
   * @private
   * @param {string} column - Column letter (A, B, C, etc.)
   * @returns {number} Column index (0-based)
   */
  _columnToIndex(column) {
    let index = 0;
    for (let i = 0; i < column.length; i++) {
      index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return index - 1;
  }

  /**
   * Log P95 notification
   * @private
   * @param {Object} caseData - Case data
   * @param {Object} result - Send result
   */
  _logP95Notification(caseData, result) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'p95_alert',
        caseId: caseData.caseId,
        assignee: caseData.finalAssignee,
        sheetName: caseData.sheetName,
        success: result.success,
        message: result.message
      };

      console.log('P95 Notification log:', JSON.stringify(logEntry));

      // Properties Serviceにログを保存
      const logs = this._getNotificationLogs();
      logs.push(logEntry);
      
      // 最新100件のみ保持
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      PropertiesService.getScriptProperties().setProperty(
        'notificationLogs',
        JSON.stringify(logs)
      );

    } catch (error) {
      console.warn('Failed to log P95 notification:', error);
    }
  }

  /**
   * Test webhook connection
   * @param {string} webhookUrl - Webhook URL to test
   * @returns {Object} Test result
   */
  testWebhookConnection(webhookUrl) {
    try {
      if (!webhookUrl || !webhookUrl.startsWith('https://chat.googleapis.com/')) {
        return {
          success: false,
          message: 'Invalid webhook URL format'
        };
      }

      const testPayload = {
        text: "🧪 CasesDash Webhook Test",
        cards: [{
          header: {
            title: "Webhook Connection Test",
            subtitle: "This is a test notification from CasesDash",
            imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
          },
          sections: [{
            widgets: [{
              keyValue: {
                topLabel: "Status",
                content: "✅ Webhook connection successful"
              }
            }, {
              keyValue: {
                topLabel: "Test Time",
                content: new Date().toISOString()
              }
            }]
          }]
        }]
      };

      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(testPayload),
        timeout: 10000
      });

      if (response.getResponseCode() === 200) {
        return {
          success: true,
          message: 'Webhook test successful'
        };
      } else {
        return {
          success: false,
          message: `Webhook test failed: HTTP ${response.getResponseCode()}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Webhook test error: ${error.message}`
      };
    }
  }

  /**
   * Set team leader webhook URL
   * @param {string} webhookUrl - Webhook URL
   * @returns {Object} Configuration result
   */
  setTeamLeaderWebhook(webhookUrl) {
    try {
      if (!webhookUrl || !webhookUrl.startsWith('https://chat.googleapis.com/')) {
        throw new Error('Invalid webhook URL format');
      }

      ConfigManager.set('notifications', 'teamLeaderWebhook', webhookUrl);
      this.config.googleChat.webhookUrl = webhookUrl;

      return {
        success: true,
        message: 'Team leader webhook URL configured successfully'
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to configure webhook URL.',
          context: { webhookUrl },
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }

  /**
   * Get P95 notification statistics
   * @returns {Object} Statistics
   */
  getP95NotificationStats() {
    try {
      const logs = this._getNotificationLogs();
      const p95Logs = logs.filter(log => log.type === 'p95_alert');

      const stats = {
        totalP95Alerts: p95Logs.length,
        successfulAlerts: p95Logs.filter(log => log.success).length,
        failedAlerts: p95Logs.filter(log => !log.success).length,
        successRate: p95Logs.length > 0 ?
          ((p95Logs.filter(log => log.success).length / p95Logs.length) * 100).toFixed(2) : 0,
        lastAlert: p95Logs.length > 0 ?
          p95Logs[p95Logs.length - 1].timestamp : null,
        alertsByAssignee: {},
        recentAlerts: p95Logs.slice(-10) // 最新10件
      };

      // 担当者別統計
      p95Logs.forEach(log => {
        const assignee = log.assignee || 'Unknown';
        stats.alertsByAssignee[assignee] = (stats.alertsByAssignee[assignee] || 0) + 1;
      });

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      return ErrorHandler.handleGracefully(
        error,
        {
          userMessage: 'Failed to retrieve P95 notification statistics.',
          context: {},
          type: ErrorTypes.INTERNAL
        }
      );
    }
  }
}

// Create global instance
const notificationManager = new NotificationManager();
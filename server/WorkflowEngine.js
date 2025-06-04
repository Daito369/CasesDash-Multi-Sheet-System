/**
 * Workflow Engine - Automated Case Management Workflows
 * Handles automatic status transitions, notifications, and rule-based processing
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * Workflow Engine Configuration
 */
const WORKFLOW_CONFIG = {
  // Workflow rules storage
  RULES_SHEET_NAME: 'WorkflowRules',
  TRIGGERS_SHEET_NAME: 'WorkflowTriggers',
  HISTORY_SHEET_NAME: 'WorkflowHistory',
  
  // Status transition rules
  STATUS_TRANSITIONS: {
    'New': ['In Progress', 'Assigned', 'Escalated'],
    'Assigned': ['In Progress', 'On Hold', 'Escalated'],
    'In Progress': ['Pending Review', 'On Hold', 'Resolved'],
    'Pending Review': ['In Progress', 'Resolved', 'Rejected'],
    'On Hold': ['In Progress', 'Assigned'],
    'Resolved': ['Closed', 'Reopened'],
    'Rejected': ['New', 'Closed'],
    'Reopened': ['In Progress', 'Assigned'],
    'Closed': ['Reopened']
  },
  
  // Notification templates
  NOTIFICATION_TEMPLATES: {
    'status_change': 'ケース #{caseId} のステータスが {oldStatus} から {newStatus} に変更されました。',
    'assignment': 'ケース #{caseId} があなたに割り当てられました。',
    'escalation': 'ケース #{caseId} がエスカレーションされました。優先対応が必要です。',
    'deadline_warning': 'ケース #{caseId} の期限が近づいています。期限: {deadline}',
    'resolution': 'ケース #{caseId} が解決されました。レビューをお願いします。'
  },
  
  // Auto-escalation rules
  ESCALATION_RULES: {
    'response_time': { threshold: 24, unit: 'hours' },
    'priority_high': { threshold: 8, unit: 'hours' },
    'priority_critical': { threshold: 4, unit: 'hours' }
  }
};

/**
 * Main Workflow Engine Class
 */
class WorkflowEngine {
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.configManager = new ConfigManager();
    this.performanceManager = new PerformanceManager();
    
    this.rulesCache = null;
    this.triggersCache = null;
    this.lastCacheUpdate = null;
  }

  /**
   * Initialize workflow engine
   */
  initialize() {
    try {
      console.log('初期化中: ワークフローエンジン...');
      
      this.setupWorkflowSheets();
      this.setupTriggers();
      this.loadWorkflowRules();
      
      console.log('✅ ワークフローエンジンが正常に初期化されました');
      return { success: true };
      
    } catch (error) {
      console.error('❌ ワークフローエンジンの初期化に失敗:', error);
      return this.errorHandler.handleError(error, 'workflow_initialization');
    }
  }

  /**
   * Setup workflow-related sheets
   */
  setupWorkflowSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Workflow Rules sheet
    let rulesSheet = ss.getSheetByName(WORKFLOW_CONFIG.RULES_SHEET_NAME);
    if (!rulesSheet) {
      rulesSheet = ss.insertSheet(WORKFLOW_CONFIG.RULES_SHEET_NAME);
      const headers = [
        'Rule ID', 'Rule Name', 'Trigger Type', 'Conditions', 'Actions',
        'Priority', 'Enabled', 'Created Date', 'Last Modified', 'Created By'
      ];
      rulesSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      rulesSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Workflow Triggers sheet
    let triggersSheet = ss.getSheetByName(WORKFLOW_CONFIG.TRIGGERS_SHEET_NAME);
    if (!triggersSheet) {
      triggersSheet = ss.insertSheet(WORKFLOW_CONFIG.TRIGGERS_SHEET_NAME);
      const headers = [
        'Trigger ID', 'Trigger Name', 'Schedule Type', 'Schedule Value',
        'Target Function', 'Parameters', 'Enabled', 'Last Run', 'Next Run'
      ];
      triggersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      triggersSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Workflow History sheet
    let historySheet = ss.getSheetByName(WORKFLOW_CONFIG.HISTORY_SHEET_NAME);
    if (!historySheet) {
      historySheet = ss.insertSheet(WORKFLOW_CONFIG.HISTORY_SHEET_NAME);
      const headers = [
        'History ID', 'Case ID', 'Rule ID', 'Action Type', 'Old Value',
        'New Value', 'Executed At', 'Executed By', 'Result', 'Notes'
      ];
      historySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      historySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }

  /**
   * Setup time-based triggers for automated workflows
   */
  setupTriggers() {
    try {
      // Delete existing triggers
      const triggers = ScriptApp.getProjectTriggers();
      triggers.forEach(trigger => {
        if (trigger.getHandlerFunction().startsWith('workflow')) {
          ScriptApp.deleteTrigger(trigger);
        }
      });
      
      // Create new periodic trigger for workflow processing
      ScriptApp.newTrigger('workflowPeriodicCheck')
        .timeBased()
        .everyMinutes(15) // Check every 15 minutes
        .create();
      
      // Create daily trigger for escalation checks
      ScriptApp.newTrigger('workflowEscalationCheck')
        .timeBased()
        .everyDays(1)
        .atHour(9) // Check at 9 AM daily
        .create();
      
      console.log('✅ ワークフロートリガーが設定されました');
      
    } catch (error) {
      console.error('❌ ワークフロートリガーの設定に失敗:', error);
      throw error;
    }
  }

  /**
   * Load workflow rules from sheet
   */
  loadWorkflowRules() {
    try {
      const cacheKey = 'workflow_rules_cache';
      const cached = this.configManager.getFromCache(cacheKey);
      
      if (cached && this.isCacheValid()) {
        this.rulesCache = cached;
        return;
      }
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const rulesSheet = ss.getSheetByName(WORKFLOW_CONFIG.RULES_SHEET_NAME);
      
      if (!rulesSheet) {
        throw new Error('Workflow rules sheet not found');
      }
      
      const data = rulesSheet.getDataRange().getValues();
      const headers = data[0];
      const rules = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) { // Rule ID exists
          const rule = {};
          headers.forEach((header, index) => {
            rule[header] = row[index];
          });
          
          // Parse conditions and actions from JSON strings
          try {
            rule.Conditions = JSON.parse(rule.Conditions || '{}');
            rule.Actions = JSON.parse(rule.Actions || '[]');
          } catch (parseError) {
            console.warn(`Invalid JSON in rule ${rule['Rule ID']}:`, parseError);
            rule.Conditions = {};
            rule.Actions = [];
          }
          
          rules.push(rule);
        }
      }
      
      this.rulesCache = rules.filter(rule => rule.Enabled === true);
      this.lastCacheUpdate = new Date();
      
      // Cache for 10 minutes
      this.configManager.setCache(cacheKey, this.rulesCache, 600);
      
      console.log(`✅ ${this.rulesCache.length} 個のワークフロールールを読み込みました`);
      
    } catch (error) {
      console.error('❌ ワークフロールールの読み込みに失敗:', error);
      this.rulesCache = [];
      throw error;
    }
  }

  /**
   * Process case for workflow automation
   * @param {Object} caseData - Case data object
   * @param {string} triggerType - Type of trigger (status_change, assignment, etc.)
   * @param {Object} context - Additional context data
   */
  async processCaseWorkflow(caseData, triggerType, context = {}) {
    try {
      if (!this.rulesCache) {
        this.loadWorkflowRules();
      }
      
      const applicableRules = this.getApplicableRules(caseData, triggerType);
      const results = [];
      
      for (const rule of applicableRules) {
        try {
          const result = await this.executeRule(rule, caseData, context);
          results.push(result);
          
          // Log workflow execution
          this.logWorkflowExecution(caseData.id, rule['Rule ID'], result);
          
        } catch (ruleError) {
          console.error(`Rule execution failed for rule ${rule['Rule ID']}:`, ruleError);
          results.push({
            ruleId: rule['Rule ID'],
            success: false,
            error: ruleError.message
          });
        }
      }
      
      return {
        success: true,
        processedRules: results.length,
        results: results
      };
      
    } catch (error) {
      console.error('❌ ワークフロー処理に失敗:', error);
      return this.errorHandler.handleError(error, 'workflow_processing');
    }
  }

  /**
   * Get applicable rules for a case and trigger type
   * @param {Object} caseData - Case data
   * @param {string} triggerType - Trigger type
   * @returns {Array} Applicable rules
   */
  getApplicableRules(caseData, triggerType) {
    return this.rulesCache.filter(rule => {
      // Check trigger type match
      if (rule['Trigger Type'] !== triggerType) {
        return false;
      }
      
      // Check conditions
      return this.evaluateConditions(rule.Conditions, caseData);
    }).sort((a, b) => (b.Priority || 0) - (a.Priority || 0)); // Sort by priority descending
  }

  /**
   * Evaluate rule conditions against case data
   * @param {Object} conditions - Rule conditions
   * @param {Object} caseData - Case data
   * @returns {boolean} Whether conditions are met
   */
  evaluateConditions(conditions, caseData) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // No conditions means always applicable
    }
    
    for (const [field, condition] of Object.entries(conditions)) {
      if (!this.evaluateFieldCondition(caseData[field], condition)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate a single field condition
   * @param {any} value - Field value
   * @param {Object|string} condition - Condition to evaluate
   * @returns {boolean} Whether condition is met
   */
  evaluateFieldCondition(value, condition) {
    if (typeof condition === 'string') {
      return value === condition;
    }
    
    if (typeof condition === 'object') {
      const { operator, value: conditionValue } = condition;
      
      switch (operator) {
        case 'equals':
          return value === conditionValue;
        case 'not_equals':
          return value !== conditionValue;
        case 'contains':
          return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(conditionValue);
        case 'less_than':
          return Number(value) < Number(conditionValue);
        case 'in':
          return Array.isArray(conditionValue) && conditionValue.includes(value);
        case 'not_in':
          return Array.isArray(conditionValue) && !conditionValue.includes(value);
        default:
          return false;
      }
    }
    
    return false;
  }

  /**
   * Execute a workflow rule
   * @param {Object} rule - Workflow rule
   * @param {Object} caseData - Case data
   * @param {Object} context - Execution context
   * @returns {Object} Execution result
   */
  async executeRule(rule, caseData, context) {
    const results = [];
    
    for (const action of rule.Actions) {
      try {
        const result = await this.executeAction(action, caseData, context);
        results.push(result);
      } catch (actionError) {
        console.error(`Action execution failed:`, actionError);
        results.push({
          action: action.type,
          success: false,
          error: actionError.message
        });
      }
    }
    
    return {
      ruleId: rule['Rule ID'],
      ruleName: rule['Rule Name'],
      success: results.every(r => r.success),
      actions: results
    };
  }

  /**
   * Execute a specific workflow action
   * @param {Object} action - Action definition
   * @param {Object} caseData - Case data
   * @param {Object} context - Execution context
   * @returns {Object} Action result
   */
  async executeAction(action, caseData, context) {
    const { type, parameters } = action;
    
    switch (type) {
      case 'change_status':
        return await this.executeStatusChange(caseData, parameters, context);
      
      case 'assign_case':
        return await this.executeAssignment(caseData, parameters, context);
      
      case 'send_notification':
        return await this.executeSendNotification(caseData, parameters, context);
      
      case 'escalate_case':
        return await this.executeEscalation(caseData, parameters, context);
      
      case 'add_comment':
        return await this.executeAddComment(caseData, parameters, context);
      
      case 'update_field':
        return await this.executeUpdateField(caseData, parameters, context);
      
      case 'schedule_followup':
        return await this.executeScheduleFollowup(caseData, parameters, context);
      
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Execute status change action
   */
  async executeStatusChange(caseData, parameters, context) {
    const { newStatus, reason } = parameters;
    
    // Validate status transition
    const currentStatus = caseData.status;
    const allowedTransitions = WORKFLOW_CONFIG.STATUS_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    
    // Update case status
    const caseModel = new CaseModel();
    const result = await caseModel.updateCase(caseData.id, {
      status: newStatus,
      lastModified: new Date(),
      notes: `Status changed by workflow: ${reason || 'Automatic transition'}`
    });
    
    return {
      action: 'change_status',
      success: result.success,
      oldStatus: currentStatus,
      newStatus: newStatus,
      reason: reason
    };
  }

  /**
   * Execute case assignment action
   */
  async executeAssignment(caseData, parameters, context) {
    const { assignee, assignmentRule } = parameters;
    
    let targetAssignee = assignee;
    
    // Dynamic assignment based on rules
    if (assignmentRule) {
      targetAssignee = this.determineAssignee(caseData, assignmentRule);
    }
    
    const caseModel = new CaseModel();
    const result = await caseModel.updateCase(caseData.id, {
      assignee: targetAssignee,
      assignedAt: new Date(),
      lastModified: new Date()
    });
    
    return {
      action: 'assign_case',
      success: result.success,
      assignee: targetAssignee,
      assignmentRule: assignmentRule
    };
  }

  /**
   * Execute notification sending
   */
  async executeSendNotification(caseData, parameters, context) {
    const { recipients, template, channels } = parameters;
    
    const message = this.formatNotificationMessage(template, caseData, context);
    const results = [];
    
    for (const recipient of recipients) {
      for (const channel of channels) {
        try {
          const result = await this.sendNotification(recipient, message, channel);
          results.push({ recipient, channel, success: result });
        } catch (error) {
          results.push({ recipient, channel, success: false, error: error.message });
        }
      }
    }
    
    return {
      action: 'send_notification',
      success: results.every(r => r.success),
      notifications: results
    };
  }

  /**
   * Execute case escalation
   */
  async executeEscalation(caseData, parameters, context) {
    const { escalationLevel, escalationTo, reason } = parameters;
    
    const caseModel = new CaseModel();
    const result = await caseModel.updateCase(caseData.id, {
      priority: this.getEscalatedPriority(caseData.priority, escalationLevel),
      escalatedAt: new Date(),
      escalatedTo: escalationTo,
      escalationReason: reason,
      lastModified: new Date()
    });
    
    // Send escalation notification
    if (escalationTo) {
      await this.sendNotification(
        escalationTo,
        this.formatNotificationMessage('escalation', caseData, { reason }),
        'email'
      );
    }
    
    return {
      action: 'escalate_case',
      success: result.success,
      escalationLevel: escalationLevel,
      escalatedTo: escalationTo
    };
  }

  /**
   * Execute add comment action
   */
  async executeAddComment(caseData, parameters, context) {
    const { comment, commentType, isInternal } = parameters;
    
    const formattedComment = this.formatNotificationMessage(comment, caseData, context);
    
    const caseModel = new CaseModel();
    const result = await caseModel.addComment(caseData.id, {
      comment: formattedComment,
      commentType: commentType || 'workflow',
      isInternal: isInternal || true,
      author: 'System',
      createdAt: new Date()
    });
    
    return {
      action: 'add_comment',
      success: result.success,
      comment: formattedComment
    };
  }

  /**
   * Execute field update action
   */
  async executeUpdateField(caseData, parameters, context) {
    const { field, value, operator } = parameters;
    
    let newValue = value;
    
    // Apply operator if specified
    if (operator) {
      newValue = this.applyFieldOperator(caseData[field], value, operator);
    }
    
    const updateData = {};
    updateData[field] = newValue;
    updateData.lastModified = new Date();
    
    const caseModel = new CaseModel();
    const result = await caseModel.updateCase(caseData.id, updateData);
    
    return {
      action: 'update_field',
      success: result.success,
      field: field,
      oldValue: caseData[field],
      newValue: newValue
    };
  }

  /**
   * Execute schedule followup action
   */
  async executeScheduleFollowup(caseData, parameters, context) {
    const { followupDate, followupType, assignee } = parameters;
    
    const followupData = {
      caseId: caseData.id,
      followupDate: new Date(followupDate),
      followupType: followupType,
      assignee: assignee || caseData.assignee,
      createdAt: new Date(),
      status: 'scheduled'
    };
    
    // Store followup in a followups sheet or trigger system
    const result = this.scheduleFollowup(followupData);
    
    return {
      action: 'schedule_followup',
      success: result,
      followupDate: followupDate,
      followupType: followupType
    };
  }

  /**
   * Periodic workflow check (triggered by time-based trigger)
   */
  workflowPeriodicCheck() {
    try {
      console.log('実行中: 定期ワークフローチェック...');
      
      const caseModel = new CaseModel();
      const activeCases = caseModel.getActiveCases();
      
      for (const caseData of activeCases) {
        // Check for time-based triggers
        this.checkTimeBasedTriggers(caseData);
      }
      
      console.log(`✅ ${activeCases.length} 件のケースの定期チェックが完了しました`);
      
    } catch (error) {
      console.error('❌ 定期ワークフローチェックに失敗:', error);
    }
  }

  /**
   * Escalation check (triggered daily)
   */
  workflowEscalationCheck() {
    try {
      console.log('実行中: エスカレーションチェック...');
      
      const caseModel = new CaseModel();
      const cases = caseModel.getCasesForEscalation();
      
      for (const caseData of cases) {
        this.checkEscalationRules(caseData);
      }
      
      console.log(`✅ ${cases.length} 件のケースのエスカレーションチェックが完了しました`);
      
    } catch (error) {
      console.error('❌ エスカレーションチェックに失敗:', error);
    }
  }

  /**
   * Check time-based triggers for a case
   */
  checkTimeBasedTriggers(caseData) {
    const now = new Date();
    const caseAge = now - new Date(caseData.createdAt);
    const caseAgeHours = caseAge / (1000 * 60 * 60);
    
    // Check response time escalation
    if (caseData.status === 'New' && caseAgeHours > WORKFLOW_CONFIG.ESCALATION_RULES.response_time.threshold) {
      this.processCaseWorkflow(caseData, 'response_time_exceeded');
    }
    
    // Check priority-based escalation
    if (caseData.priority === 'High' && caseAgeHours > WORKFLOW_CONFIG.ESCALATION_RULES.priority_high.threshold) {
      this.processCaseWorkflow(caseData, 'priority_escalation');
    }
    
    if (caseData.priority === 'Critical' && caseAgeHours > WORKFLOW_CONFIG.ESCALATION_RULES.priority_critical.threshold) {
      this.processCaseWorkflow(caseData, 'critical_escalation');
    }
  }

  /**
   * Check escalation rules for a case
   */
  checkEscalationRules(caseData) {
    // Implementation for escalation rule checking
    // This would evaluate various escalation criteria
    console.log(`Checking escalation rules for case ${caseData.id}`);
  }

  /**
   * Utility methods
   */
  
  isCacheValid() {
    if (!this.lastCacheUpdate) return false;
    const cacheAge = new Date() - this.lastCacheUpdate;
    return cacheAge < 10 * 60 * 1000; // 10 minutes
  }

  formatNotificationMessage(template, caseData, context) {
    let message = template;
    
    // Replace case data placeholders
    Object.keys(caseData).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), caseData[key] || '');
    });
    
    // Replace context placeholders
    Object.keys(context).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), context[key] || '');
    });
    
    return message;
  }

  async sendNotification(recipient, message, channel) {
    // Implementation would depend on available notification channels
    // For now, this is a placeholder
    console.log(`Sending ${channel} notification to ${recipient}: ${message}`);
    return true;
  }

  determineAssignee(caseData, assignmentRule) {
    // Implementation for dynamic assignee determination
    // Could be round-robin, skill-based, workload-based, etc.
    return assignmentRule.defaultAssignee || 'unassigned';
  }

  getEscalatedPriority(currentPriority, escalationLevel) {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const currentIndex = priorities.indexOf(currentPriority);
    const newIndex = Math.min(currentIndex + escalationLevel, priorities.length - 1);
    return priorities[newIndex];
  }

  applyFieldOperator(currentValue, operandValue, operator) {
    switch (operator) {
      case 'add':
        return Number(currentValue) + Number(operandValue);
      case 'subtract':
        return Number(currentValue) - Number(operandValue);
      case 'multiply':
        return Number(currentValue) * Number(operandValue);
      case 'append':
        return String(currentValue) + String(operandValue);
      case 'prepend':
        return String(operandValue) + String(currentValue);
      default:
        return operandValue;
    }
  }

  scheduleFollowup(followupData) {
    // Implementation for scheduling followups
    // Could use time-based triggers or external scheduling system
    console.log('Scheduling followup:', followupData);
    return true;
  }

  logWorkflowExecution(caseId, ruleId, result) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const historySheet = ss.getSheetByName(WORKFLOW_CONFIG.HISTORY_SHEET_NAME);
      
      if (historySheet) {
        const historyId = Utilities.getUuid();
        const row = [
          historyId,
          caseId,
          ruleId,
          result.action || 'unknown',
          result.oldValue || '',
          result.newValue || '',
          new Date(),
          'System',
          result.success ? 'Success' : 'Failed',
          result.error || JSON.stringify(result)
        ];
        
        historySheet.appendRow(row);
      }
    } catch (error) {
      console.error('Failed to log workflow execution:', error);
    }
  }
}

/**
 * Global functions for trigger handling
 */

function workflowPeriodicCheck() {
  const engine = new WorkflowEngine();
  engine.workflowPeriodicCheck();
}

function workflowEscalationCheck() {
  const engine = new WorkflowEngine();
  engine.workflowEscalationCheck();
}

/**
 * Public API functions
 */

function initializeWorkflowEngine() {
  const engine = new WorkflowEngine();
  return engine.initialize();
}

function processCaseWorkflow(caseData, triggerType, context) {
  const engine = new WorkflowEngine();
  return engine.processCaseWorkflow(caseData, triggerType, context);
}

function getWorkflowRules() {
  const engine = new WorkflowEngine();
  engine.loadWorkflowRules();
  return { success: true, data: engine.rulesCache };
}

function createWorkflowRule(ruleData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rulesSheet = ss.getSheetByName(WORKFLOW_CONFIG.RULES_SHEET_NAME);
    
    if (!rulesSheet) {
      throw new Error('Workflow rules sheet not found');
    }
    
    const ruleId = Utilities.getUuid();
    const row = [
      ruleId,
      ruleData.name,
      ruleData.triggerType,
      JSON.stringify(ruleData.conditions),
      JSON.stringify(ruleData.actions),
      ruleData.priority || 0,
      ruleData.enabled !== false,
      new Date(),
      new Date(),
      Session.getActiveUser().getEmail()
    ];
    
    rulesSheet.appendRow(row);
    
    // Clear cache to force reload
    const configManager = new ConfigManager();
    configManager.clearCache('workflow_rules_cache');
    
    return { success: true, ruleId: ruleId };
    
  } catch (error) {
    console.error('Failed to create workflow rule:', error);
    const errorHandler = new ErrorHandler();
    return errorHandler.handleError(error, 'create_workflow_rule');
  }
}

function updateWorkflowRule(ruleId, updateData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rulesSheet = ss.getSheetByName(WORKFLOW_CONFIG.RULES_SHEET_NAME);
    
    if (!rulesSheet) {
      throw new Error('Workflow rules sheet not found');
    }
    
    const data = rulesSheet.getDataRange().getValues();
    const headers = data[0];
    const ruleIdIndex = headers.indexOf('Rule ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][ruleIdIndex] === ruleId) {
        // Update the rule
        Object.keys(updateData).forEach(key => {
          const columnIndex = headers.indexOf(key);
          if (columnIndex !== -1) {
            if (key === 'conditions' || key === 'actions') {
              rulesSheet.getRange(i + 1, columnIndex + 1).setValue(JSON.stringify(updateData[key]));
            } else {
              rulesSheet.getRange(i + 1, columnIndex + 1).setValue(updateData[key]);
            }
          }
        });
        
        // Update last modified
        const lastModifiedIndex = headers.indexOf('Last Modified');
        if (lastModifiedIndex !== -1) {
          rulesSheet.getRange(i + 1, lastModifiedIndex + 1).setValue(new Date());
        }
        
        break;
      }
    }
    
    // Clear cache to force reload
    const configManager = new ConfigManager();
    configManager.clearCache('workflow_rules_cache');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to update workflow rule:', error);
    const errorHandler = new ErrorHandler();
    return errorHandler.handleError(error, 'update_workflow_rule');
  }
}

function deleteWorkflowRule(ruleId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rulesSheet = ss.getSheetByName(WORKFLOW_CONFIG.RULES_SHEET_NAME);
    
    if (!rulesSheet) {
      throw new Error('Workflow rules sheet not found');
    }
    
    const data = rulesSheet.getDataRange().getValues();
    const ruleIdIndex = data[0].indexOf('Rule ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][ruleIdIndex] === ruleId) {
        rulesSheet.deleteRow(i + 1);
        break;
      }
    }
    
    // Clear cache to force reload
    const configManager = new ConfigManager();
    configManager.clearCache('workflow_rules_cache');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to delete workflow rule:', error);
    const errorHandler = new ErrorHandler();
    return errorHandler.handleError(error, 'delete_workflow_rule');
  }
}

function getWorkflowHistory(caseId, limit = 50) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const historySheet = ss.getSheetByName(WORKFLOW_CONFIG.HISTORY_SHEET_NAME);
    
    if (!historySheet) {
      return { success: true, data: [] };
    }
    
    const data = historySheet.getDataRange().getValues();
    const headers = data[0];
    const history = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!caseId || row[headers.indexOf('Case ID')] === caseId) {
        const record = {};
        headers.forEach((header, index) => {
          record[header] = row[index];
        });
        history.push(record);
      }
    }
    
    // Sort by executed date descending and limit results
    history.sort((a, b) => new Date(b['Executed At']) - new Date(a['Executed At']));
    
    return {
      success: true,
      data: history.slice(0, limit)
    };
    
  } catch (error) {
    console.error('Failed to get workflow history:', error);
    const errorHandler = new ErrorHandler();
    return errorHandler.handleError(error, 'get_workflow_history');
  }
}
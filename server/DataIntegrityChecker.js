/**
 * Data Integrity Checker - Cross-Sheet Validation and Consistency System
 * Provides comprehensive data integrity verification, duplicate detection,
 * reference integrity checks, and automatic inconsistency correction
 * 
 * @author Claude Code - Phase 4 Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * DataIntegrityChecker class for comprehensive data consistency validation
 */
class DataIntegrityChecker {
  
  constructor() {
    this.spreadsheetId = ConfigManager.getSpreadsheetId();
    this.supportedSheets = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
    this.referenceFields = this.initializeReferenceFields();
    this.consistencyRules = this.initializeConsistencyRules();
    this.duplicateThresholds = this.initializeDuplicateThresholds();
    this.integrityCache = new Map();
    this.lastSyncTimestamp = null;
    this.autoCorrectEnabled = false;
  }
  
  /**
   * Initialize reference field mappings
   */
  initializeReferenceFields() {
    return {
      // Fields that should be consistent across sheets for the same case
      caseConsistency: [
        'caseId', 'incomingSegment', 'caseOpenDate', 'caseOpenTime',
        'firstAssignee', 'finalAssignee', 'channel'
      ],
      
      // Fields that must have valid references
      references: {
        assigneeEmail: {
          type: 'email',
          domain: '@google.com',
          required: false
        },
        caseStatus: {
          type: 'enum',
          values: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Deleted'],
          required: true
        },
        priority: {
          type: 'enum',
          values: ['Low', 'Medium', 'High', 'Critical'],
          required: false
        },
        channel: {
          type: 'enum',
          values: ['Email', 'Chat', 'Phone'],
          required: true
        }
      },
      
      // Cross-sheet relationships
      relationships: {
        escalations: {
          fromField: 'parentCaseId',
          toField: 'caseId',
          relationship: 'parent-child'
        },
        duplicates: {
          fromField: 'duplicateOf',
          toField: 'caseId',
          relationship: 'duplicate'
        }
      }
    };
  }
  
  /**
   * Initialize consistency rules
   */
  initializeConsistencyRules() {
    return [
      {
        name: 'caseIdUniqueness',
        description: 'Case IDs must be unique across all sheets',
        severity: 'critical',
        check: (data) => this.checkCaseIdUniqueness(data)
      },
      {
        name: 'assigneeConsistency',
        description: 'Assignee information must be consistent for the same case',
        severity: 'high',
        check: (data) => this.checkAssigneeConsistency(data)
      },
      {
        name: 'dateLogicalOrder',
        description: 'Dates must follow logical chronological order',
        severity: 'high',
        check: (data) => this.checkDateLogicalOrder(data)
      },
      {
        name: 'statusTransitionValidity',
        description: 'Status transitions must follow valid workflows',
        severity: 'medium',
        check: (data) => this.checkStatusTransitionValidity(data)
      },
      {
        name: 'channelSheetConsistency',
        description: 'Channel must match the sheet type',
        severity: 'high',
        check: (data) => this.checkChannelSheetConsistency(data)
      },
      {
        name: 'exclusionLogic',
        description: 'Exclusion flags must follow business logic',
        severity: 'medium',
        check: (data) => this.checkExclusionLogic(data)
      },
      {
        name: 'dataCompleteness',
        description: 'Required fields must be populated',
        severity: 'high',
        check: (data) => this.checkDataCompleteness(data)
      }
    ];
  }
  
  /**
   * Initialize duplicate detection thresholds
   */
  initializeDuplicateThresholds() {
    return {
      // Similarity thresholds for different field types
      caseId: 1.0,          // Exact match required
      email: 1.0,           // Exact match required
      text: 0.85,           // 85% similarity for text fields
      date: 0.95,           // 95% similarity for dates (allowing minor time differences)
      
      // Fuzzy matching for common typos
      fuzzyMatching: {
        enabled: true,
        threshold: 0.8,
        fields: ['customerEmail', 'description', 'issueDetails']
      },
      
      // Weight factors for different fields in duplicate scoring
      fieldWeights: {
        caseId: 0.4,
        customerEmail: 0.3,
        openDate: 0.1,
        description: 0.2
      }
    };
  }
  
  /**
   * Perform comprehensive data integrity check
   * @param {Object} options - Check options
   * @returns {Object} Integrity check result
   */
  async performIntegrityCheck(options = {}) {
    const operationId = Utilities.getUuid();
    const startTime = Date.now();
    
    try {
      const opts = {
        sheets: this.supportedSheets,
        includeHistory: false,
        checkDuplicates: true,
        checkReferences: true,
        checkConsistency: true,
        autoCorrect: this.autoCorrectEnabled,
        generateReport: true,
        ...options
      };
      
      console.log(`🔍 [DataIntegrityChecker] Starting comprehensive integrity check...`);
      
      // Collect data from all sheets
      const allData = await this.collectAllSheetData(opts.sheets);
      
      // Perform different types of checks
      const results = {
        operationId: operationId,
        timestamp: new Date().toISOString(),
        summary: {
          totalRecords: 0,
          issuesFound: 0,
          warningsFound: 0,
          correctionsMade: 0
        },
        checks: {
          consistency: null,
          duplicates: null,
          references: null,
          completeness: null
        },
        corrections: [],
        recommendations: []
      };
      
      // Count total records
      results.summary.totalRecords = Object.values(allData)
        .reduce((total, sheetData) => total + sheetData.length, 0);
      
      // 1. Consistency checks
      if (opts.checkConsistency) {
        console.log(`🔍 [DataIntegrityChecker] Running consistency checks...`);
        results.checks.consistency = await this.runConsistencyChecks(allData);
        results.summary.issuesFound += results.checks.consistency.issues.length;
        results.summary.warningsFound += results.checks.consistency.warnings.length;
      }
      
      // 2. Duplicate detection
      if (opts.checkDuplicates) {
        console.log(`🔍 [DataIntegrityChecker] Running duplicate detection...`);
        results.checks.duplicates = await this.runDuplicateDetection(allData);
        results.summary.issuesFound += results.checks.duplicates.exactDuplicates.length;
        results.summary.warningsFound += results.checks.duplicates.potentialDuplicates.length;
      }
      
      // 3. Reference integrity
      if (opts.checkReferences) {
        console.log(`🔍 [DataIntegrityChecker] Running reference integrity checks...`);
        results.checks.references = await this.runReferenceIntegrityChecks(allData);
        results.summary.issuesFound += results.checks.references.brokenReferences.length;
        results.summary.warningsFound += results.checks.references.warnings.length;
      }
      
      // 4. Data completeness
      console.log(`🔍 [DataIntegrityChecker] Running completeness checks...`);
      results.checks.completeness = await this.runCompletenessChecks(allData);
      results.summary.issuesFound += results.checks.completeness.incompleteRecords.length;
      
      // 5. Auto-corrections (if enabled)
      if (opts.autoCorrect) {
        console.log(`🔧 [DataIntegrityChecker] Applying auto-corrections...`);
        const corrections = await this.applyAutoCorrections(allData, results);
        results.corrections = corrections;
        results.summary.correctionsMade = corrections.length;
      }
      
      // 6. Generate recommendations
      results.recommendations = this.generateIntegrityRecommendations(results);
      
      // 7. Cache results
      this.integrityCache.set(`check_${operationId}`, {
        results: results,
        timestamp: Date.now(),
        ttl: 3600000 // 1 hour
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [DataIntegrityChecker] Integrity check completed in ${executionTime}ms`);
      
      results.executionTime = executionTime;
      return {
        success: true,
        data: results
      };
      
    } catch (error) {
      console.error(`❌ [DataIntegrityChecker] Integrity check failed:`, error);
      return {
        success: false,
        error: error.message,
        operationId: operationId,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Collect data from all sheets
   */
  async collectAllSheetData(sheetTypes) {
    const allData = {};
    
    for (const sheetType of sheetTypes) {
      try {
        console.log(`📊 [DataIntegrityChecker] Collecting data from ${sheetType}...`);
        
        const caseModel = new CaseModel(sheetType);
        const searchResult = await caseModel.search({
          limit: 10000, // Large limit to get all data
          includeDeleted: true // Include deleted records for integrity checks
        });
        
        if (searchResult.success) {
          allData[sheetType] = searchResult.data || [];
          console.log(`📊 [DataIntegrityChecker] Collected ${allData[sheetType].length} records from ${sheetType}`);
        } else {
          console.warn(`⚠️ [DataIntegrityChecker] Failed to collect data from ${sheetType}`);
          allData[sheetType] = [];
        }
        
      } catch (error) {
        console.error(`❌ [DataIntegrityChecker] Error collecting data from ${sheetType}:`, error);
        allData[sheetType] = [];
      }
    }
    
    return allData;
  }
  
  /**
   * Run consistency checks
   */
  async runConsistencyChecks(allData) {
    const results = {
      checksRun: [],
      issues: [],
      warnings: [],
      passed: []
    };
    
    for (const rule of this.consistencyRules) {
      try {
        console.log(`🔍 [ConsistencyCheck] Running ${rule.name}...`);
        
        const ruleResult = await rule.check(allData);
        results.checksRun.push(rule.name);
        
        if (ruleResult.issues && ruleResult.issues.length > 0) {
          ruleResult.issues.forEach(issue => {
            results.issues.push({
              rule: rule.name,
              severity: rule.severity,
              description: rule.description,
              ...issue
            });
          });
        }
        
        if (ruleResult.warnings && ruleResult.warnings.length > 0) {
          ruleResult.warnings.forEach(warning => {
            results.warnings.push({
              rule: rule.name,
              severity: 'warning',
              description: rule.description,
              ...warning
            });
          });
        }
        
        if (ruleResult.issues.length === 0 && ruleResult.warnings.length === 0) {
          results.passed.push(rule.name);
        }
        
      } catch (error) {
        console.error(`❌ [ConsistencyCheck] Error in ${rule.name}:`, error);
        results.issues.push({
          rule: rule.name,
          severity: 'critical',
          description: `Check failed: ${error.message}`,
          type: 'system_error'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Check case ID uniqueness
   */
  async checkCaseIdUniqueness(allData) {
    const issues = [];
    const warnings = [];
    const caseIdMap = new Map();
    
    // Collect all case IDs with their locations
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const caseId = record.caseId;
        if (caseId && caseId.trim() !== '') {
          if (!caseIdMap.has(caseId)) {
            caseIdMap.set(caseId, []);
          }
          caseIdMap.get(caseId).push({
            sheetType: sheetType,
            recordIndex: index,
            record: record
          });
        }
      });
    }
    
    // Find duplicates
    for (const [caseId, locations] of caseIdMap.entries()) {
      if (locations.length > 1) {
        issues.push({
          type: 'duplicate_case_id',
          caseId: caseId,
          message: `Case ID "${caseId}" appears in ${locations.length} locations`,
          locations: locations.map(loc => ({
            sheet: loc.sheetType,
            row: loc.recordIndex + 2 // +2 for header and 0-based index
          })),
          severity: 'critical'
        });
      }
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check assignee consistency
   */
  async checkAssigneeConsistency(allData) {
    const issues = [];
    const warnings = [];
    const caseAssigneeMap = new Map();
    
    // Collect assignee information by case ID
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const caseId = record.caseId;
        if (caseId && caseId.trim() !== '') {
          if (!caseAssigneeMap.has(caseId)) {
            caseAssigneeMap.set(caseId, []);
          }
          
          caseAssigneeMap.get(caseId).push({
            sheetType: sheetType,
            firstAssignee: record.firstAssignee,
            finalAssignee: record.finalAssignee,
            recordIndex: index
          });
        }
      });
    }
    
    // Check for inconsistencies
    for (const [caseId, assigneeRecords] of caseAssigneeMap.entries()) {
      if (assigneeRecords.length > 1) {
        const firstAssignees = [...new Set(assigneeRecords.map(r => r.firstAssignee).filter(a => a))];
        const finalAssignees = [...new Set(assigneeRecords.map(r => r.finalAssignee).filter(a => a))];
        
        if (firstAssignees.length > 1) {
          warnings.push({
            type: 'inconsistent_first_assignee',
            caseId: caseId,
            message: `Case "${caseId}" has inconsistent first assignees: ${firstAssignees.join(', ')}`,
            values: firstAssignees,
            locations: assigneeRecords.map(r => r.sheetType)
          });
        }
        
        if (finalAssignees.length > 1) {
          warnings.push({
            type: 'inconsistent_final_assignee',
            caseId: caseId,
            message: `Case "${caseId}" has inconsistent final assignees: ${finalAssignees.join(', ')}`,
            values: finalAssignees,
            locations: assigneeRecords.map(r => r.sheetType)
          });
        }
      }
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check date logical order
   */
  async checkDateLogicalOrder(allData) {
    const issues = [];
    const warnings = [];
    
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const openDate = record.caseOpenDate ? new Date(record.caseOpenDate) : null;
        const closeDate = record.closeDate ? new Date(record.closeDate) : null;
        const firstCloseDate = record.firstCloseDate ? new Date(record.firstCloseDate) : null;
        
        // Check open date vs close date
        if (openDate && closeDate && closeDate < openDate) {
          issues.push({
            type: 'invalid_date_order',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Close date (${closeDate.toISOString()}) is before open date (${openDate.toISOString()})`,
            openDate: openDate.toISOString(),
            closeDate: closeDate.toISOString()
          });
        }
        
        // Check open date vs first close date
        if (openDate && firstCloseDate && firstCloseDate < openDate) {
          issues.push({
            type: 'invalid_date_order',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `First close date (${firstCloseDate.toISOString()}) is before open date (${openDate.toISOString()})`,
            openDate: openDate.toISOString(),
            firstCloseDate: firstCloseDate.toISOString()
          });
        }
        
        // Check for future dates
        const now = new Date();
        if (openDate && openDate > now) {
          warnings.push({
            type: 'future_date',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Open date is in the future: ${openDate.toISOString()}`,
            date: openDate.toISOString()
          });
        }
      });
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check status transition validity
   */
  async checkStatusTransitionValidity(allData) {
    const issues = [];
    const warnings = [];
    
    const validTransitions = {
      'Open': ['Assigned', 'Closed'],
      'Assigned': ['In Progress', 'Closed', 'Open'],
      'In Progress': ['Assigned', 'Resolved', 'Closed'],
      'Resolved': ['Closed', 'Assigned'],
      'Closed': ['Assigned'] // Allow reopening
    };
    
    // This check would require historical data to see transitions
    // For now, we'll check for logical inconsistencies in current state
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const status = record.caseStatus;
        const assignee = record.firstAssignee || record.finalAssignee;
        
        // Check status-assignee consistency
        if (status === 'Open' && assignee) {
          warnings.push({
            type: 'status_assignee_mismatch',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Case has "Open" status but has assignee: ${assignee}`,
            status: status,
            assignee: assignee
          });
        }
        
        if ((status === 'Assigned' || status === 'In Progress') && !assignee) {
          issues.push({
            type: 'status_assignee_mismatch',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Case has "${status}" status but no assignee`,
            status: status
          });
        }
      });
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check channel-sheet consistency
   */
  async checkChannelSheetConsistency(allData) {
    const issues = [];
    const warnings = [];
    
    const expectedChannels = {
      'OT Email': 'Email',
      '3PO Email': 'Email',
      'OT Chat': 'Chat',
      '3PO Chat': 'Chat',
      'OT Phone': 'Phone',
      '3PO Phone': 'Phone'
    };
    
    for (const [sheetType, records] of Object.entries(allData)) {
      const expectedChannel = expectedChannels[sheetType];
      
      records.forEach((record, index) => {
        const recordChannel = record.channel;
        
        if (recordChannel && recordChannel !== expectedChannel) {
          issues.push({
            type: 'channel_sheet_mismatch',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Channel "${recordChannel}" does not match sheet type "${sheetType}" (expected: ${expectedChannel})`,
            actualChannel: recordChannel,
            expectedChannel: expectedChannel
          });
        }
      });
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check exclusion logic
   */
  async checkExclusionLogic(allData) {
    const issues = [];
    const warnings = [];
    
    const exclusionFields = ['bug', 'l2Consulted', 'tsConsulted', 'idtBlocked', 'payreqBlocked'];
    
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const activeExclusions = exclusionFields.filter(field => 
          record[field] === '1' || record[field] === 1 || record[field] === true
        );
        
        // Check for conflicting exclusions
        if (activeExclusions.includes('bug') && activeExclusions.includes('l2Consulted')) {
          warnings.push({
            type: 'conflicting_exclusions',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: 'Bug cases typically should not require L2 consultation',
            exclusions: ['bug', 'l2Consulted']
          });
        }
        
        // Check for excessive exclusions
        if (activeExclusions.length >= 4) {
          warnings.push({
            type: 'excessive_exclusions',
            caseId: record.caseId,
            sheet: sheetType,
            row: index + 2,
            message: `Case has ${activeExclusions.length} active exclusions - please verify`,
            exclusions: activeExclusions
          });
        }
      });
    }
    
    return { issues, warnings };
  }
  
  /**
   * Check data completeness
   */
  async checkDataCompleteness(allData) {
    const incompleteRecords = [];
    const warnings = [];
    
    const requiredFields = {
      'OT Email': ['caseId', 'caseStatus', 'caseOpenDate', 'channel'],
      '3PO Email': ['caseId', 'caseStatus', 'caseOpenDate', 'channel'],
      'OT Chat': ['caseId', 'caseStatus', 'caseOpenDate', 'channel'],
      '3PO Chat': ['caseId', 'caseStatus', 'caseOpenDate', 'channel'],
      'OT Phone': ['caseId', 'caseStatus', 'caseOpenDate', 'channel'],
      '3PO Phone': ['caseId', 'caseStatus', 'caseOpenDate', 'channel']
    };
    
    for (const [sheetType, records] of Object.entries(allData)) {
      const required = requiredFields[sheetType] || [];
      
      records.forEach((record, index) => {
        const missingFields = required.filter(field => 
          !record[field] || record[field] === '' || record[field] === null
        );
        
        if (missingFields.length > 0) {
          incompleteRecords.push({
            caseId: record.caseId || `Row ${index + 2}`,
            sheet: sheetType,
            row: index + 2,
            missingFields: missingFields,
            message: `Missing required fields: ${missingFields.join(', ')}`
          });
        }
      });
    }
    
    return { incompleteRecords, warnings };
  }
  
  /**
   * Run duplicate detection
   */
  async runDuplicateDetection(allData) {
    const exactDuplicates = [];
    const potentialDuplicates = [];
    const allRecords = [];
    
    // Flatten all records with source information
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        allRecords.push({
          ...record,
          _sourceSheet: sheetType,
          _sourceRow: index + 2
        });
      });
    }
    
    // Compare each record with every other record
    for (let i = 0; i < allRecords.length; i++) {
      for (let j = i + 1; j < allRecords.length; j++) {
        const record1 = allRecords[i];
        const record2 = allRecords[j];
        
        const similarity = this.calculateRecordSimilarity(record1, record2);
        
        if (similarity.score === 1.0) {
          // Exact duplicate
          exactDuplicates.push({
            type: 'exact_duplicate',
            records: [
              { caseId: record1.caseId, sheet: record1._sourceSheet, row: record1._sourceRow },
              { caseId: record2.caseId, sheet: record2._sourceSheet, row: record2._sourceRow }
            ],
            similarity: similarity,
            message: `Exact duplicate found between ${record1._sourceSheet} row ${record1._sourceRow} and ${record2._sourceSheet} row ${record2._sourceRow}`
          });
        } else if (similarity.score >= this.duplicateThresholds.text) {
          // Potential duplicate
          potentialDuplicates.push({
            type: 'potential_duplicate',
            records: [
              { caseId: record1.caseId, sheet: record1._sourceSheet, row: record1._sourceRow },
              { caseId: record2.caseId, sheet: record2._sourceSheet, row: record2._sourceRow }
            ],
            similarity: similarity,
            message: `Potential duplicate (${Math.round(similarity.score * 100)}% similar) between ${record1._sourceSheet} row ${record1._sourceRow} and ${record2._sourceSheet} row ${record2._sourceRow}`
          });
        }
      }
    }
    
    return {
      exactDuplicates: exactDuplicates,
      potentialDuplicates: potentialDuplicates.slice(0, 100), // Limit to first 100 for performance
      totalComparisons: (allRecords.length * (allRecords.length - 1)) / 2
    };
  }
  
  /**
   * Calculate similarity between two records
   */
  calculateRecordSimilarity(record1, record2) {
    const weights = this.duplicateThresholds.fieldWeights;
    let totalWeight = 0;
    let weightedScore = 0;
    const fieldComparisons = {};
    
    for (const [field, weight] of Object.entries(weights)) {
      if (record1[field] !== undefined && record2[field] !== undefined) {
        totalWeight += weight;
        
        const fieldSimilarity = this.calculateFieldSimilarity(
          record1[field], 
          record2[field], 
          field
        );
        
        weightedScore += fieldSimilarity * weight;
        fieldComparisons[field] = fieldSimilarity;
      }
    }
    
    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    return {
      score: overallScore,
      fieldComparisons: fieldComparisons,
      method: 'weighted_average'
    };
  }
  
  /**
   * Calculate similarity between two field values
   */
  calculateFieldSimilarity(value1, value2, fieldType) {
    // Convert to strings for comparison
    const str1 = String(value1 || '').toLowerCase().trim();
    const str2 = String(value2 || '').toLowerCase().trim();
    
    // Exact match
    if (str1 === str2) {
      return 1.0;
    }
    
    // Empty values
    if (str1 === '' || str2 === '') {
      return 0.0;
    }
    
    // Use Levenshtein distance for text similarity
    return this.calculateLevenshteinSimilarity(str1, str2);
  }
  
  /**
   * Calculate Levenshtein similarity (0-1 scale)
   */
  calculateLevenshteinSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    
    return (maxLength - distance) / maxLength;
  }
  
  /**
   * Run reference integrity checks
   */
  async runReferenceIntegrityChecks(allData) {
    const brokenReferences = [];
    const warnings = [];
    
    // Check email domain references
    const validDomains = ['@google.com'];
    
    for (const [sheetType, records] of Object.entries(allData)) {
      records.forEach((record, index) => {
        const emailFields = ['firstAssignee', 'finalAssignee', 'customerEmail'];
        
        emailFields.forEach(field => {
          const email = record[field];
          if (email && email.includes('@')) {
            const domain = '@' + email.split('@')[1];
            if (!validDomains.includes(domain)) {
              warnings.push({
                type: 'invalid_email_domain',
                caseId: record.caseId,
                sheet: sheetType,
                row: index + 2,
                field: field,
                value: email,
                message: `Email domain "${domain}" is not in allowed list: ${validDomains.join(', ')}`
              });
            }
          }
        });
      });
    }
    
    return { brokenReferences, warnings };
  }
  
  /**
   * Apply auto-corrections
   */
  async applyAutoCorrections(allData, integrityResults) {
    const corrections = [];
    
    if (!this.autoCorrectEnabled) {
      return corrections;
    }
    
    // Auto-correct simple issues
    const consistencyIssues = integrityResults.checks.consistency?.issues || [];
    
    for (const issue of consistencyIssues) {
      try {
        if (issue.type === 'channel_sheet_mismatch' && issue.expectedChannel) {
          const correction = await this.correctChannelMismatch(issue);
          if (correction.success) {
            corrections.push(correction);
          }
        }
      } catch (error) {
        console.error(`Failed to apply auto-correction for issue:`, issue, error);
      }
    }
    
    return corrections;
  }
  
  /**
   * Correct channel mismatch
   */
  async correctChannelMismatch(issue) {
    try {
      const caseModel = new CaseModel(issue.sheet);
      const updateResult = await caseModel.update(issue.caseId, {
        channel: issue.expectedChannel
      });
      
      return {
        success: updateResult.success,
        type: 'channel_correction',
        caseId: issue.caseId,
        sheet: issue.sheet,
        oldValue: issue.actualChannel,
        newValue: issue.expectedChannel,
        message: `Corrected channel from "${issue.actualChannel}" to "${issue.expectedChannel}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'channel_correction',
        caseId: issue.caseId
      };
    }
  }
  
  /**
   * Generate integrity recommendations
   */
  generateIntegrityRecommendations(integrityResults) {
    const recommendations = [];
    
    // Based on issue counts
    if (integrityResults.summary.issuesFound > 10) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        title: 'Urgent Data Quality Issues',
        description: `${integrityResults.summary.issuesFound} critical data integrity issues found`,
        action: 'Review and fix critical issues immediately to prevent data corruption'
      });
    }
    
    // Based on duplicate detection
    const duplicates = integrityResults.checks.duplicates;
    if (duplicates && duplicates.exactDuplicates.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'duplicates',
        title: 'Remove Duplicate Records',
        description: `${duplicates.exactDuplicates.length} exact duplicate records found`,
        action: 'Review and remove or merge duplicate records to maintain data integrity'
      });
    }
    
    // Based on completeness
    const completeness = integrityResults.checks.completeness;
    if (completeness && completeness.incompleteRecords.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'completeness',
        title: 'Complete Missing Data',
        description: `${completeness.incompleteRecords.length} records have missing required fields`,
        action: 'Fill in missing required fields to ensure data completeness'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get integrity check history
   */
  getIntegrityCheckHistory(limit = 10) {
    try {
      const history = [];
      
      for (const [key, cached] of this.integrityCache.entries()) {
        if (key.startsWith('check_') && Date.now() - cached.timestamp < cached.ttl) {
          history.push({
            operationId: cached.results.operationId,
            timestamp: cached.results.timestamp,
            totalRecords: cached.results.summary.totalRecords,
            issuesFound: cached.results.summary.issuesFound,
            warningsFound: cached.results.summary.warningsFound,
            correctionsMade: cached.results.summary.correctionsMade,
            executionTime: cached.results.executionTime
          });
        }
      }
      
      return history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting integrity check history:', error);
      return [];
    }
  }
  
  /**
   * Enable auto-correction
   */
  enableAutoCorrection() {
    this.autoCorrectEnabled = true;
    console.log('✅ Auto-correction enabled');
  }
  
  /**
   * Disable auto-correction
   */
  disableAutoCorrection() {
    this.autoCorrectEnabled = false;
    console.log('❌ Auto-correction disabled');
  }
  
  /**
   * Static methods for external use
   */
  static async performSystemIntegrityCheck(options) {
    const checker = new DataIntegrityChecker();
    return await checker.performIntegrityCheck(options);
  }
  
  static getSystemIntegrityHistory(limit) {
    const checker = new DataIntegrityChecker();
    return checker.getIntegrityCheckHistory(limit);
  }
}

console.log('✅ Data Integrity Checker loaded successfully');
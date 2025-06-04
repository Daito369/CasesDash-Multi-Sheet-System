/**
 * Enhanced Data Validator - Comprehensive Data Integrity and Validation System
 * Extends InputValidator with advanced data integrity, case ID format validation,
 * and cross-field validation rules for enterprise data reliability
 * 
 * @author Claude Code - Phase 4 Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * Enhanced Data Validator for comprehensive data integrity
 */
class EnhancedDataValidator {
  
  constructor() {
    this.inputValidator = new InputValidator();
    this.config = SecurityConfig.getInputValidationConfig();
    this.integrityChecks = new Map();
    this.crossFieldRules = this.initializeCrossFieldRules();
    this.caseIdPatterns = this.initializeCaseIdPatterns();
  }
  
  /**
   * Initialize case ID validation patterns for different systems
   */
  initializeCaseIdPatterns() {
    return {
      // Strict Google Support case ID format: X-XXXXXXXXXXXXX (1-13 digits)
      google: /^(\d{1}-\d{13})$/,
      // Alternative formats for different case management systems
      standard: /^[A-Z]{1,3}-\d{8,15}$/,
      // Legacy format for backward compatibility
      legacy: /^[A-Za-z0-9\-_]{5,20}$/,
      // Internal case format
      internal: /^(OTE|3PO|OTC|3PC|OTP|3PP)-\d{6,10}-\d{1,5}$/
    };
  }
  
  /**
   * Initialize cross-field validation rules
   */
  initializeCrossFieldRules() {
    return [
      {
        name: 'dateConsistency',
        description: 'Ensure close date is after open date',
        validate: (data) => this.validateDateConsistency(data)
      },
      {
        name: 'statusTransition',
        description: 'Validate status transition logic',
        validate: (data) => this.validateStatusTransition(data)
      },
      {
        name: 'assigneePermission',
        description: 'Validate assignee has required permissions',
        validate: (data) => this.validateAssigneePermission(data)
      },
      {
        name: 'exclusionLogic',
        description: 'Validate exclusion field combinations',
        validate: (data) => this.validateExclusionLogic(data)
      },
      {
        name: 'channelConsistency',
        description: 'Ensure channel matches sheet type',
        validate: (data) => this.validateChannelConsistency(data)
      }
    ];
  }
  
  /**
   * Validate case ID with strict format enforcement
   * @param {string} caseId - Case ID to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateCaseId(caseId, options = {}) {
    try {
      const opts = {
        format: 'google', // Default to Google format
        required: true,
        allowLegacy: false,
        autoCorrect: false,
        ...options
      };
      
      const result = {
        isValid: true,
        sanitized: null,
        errors: [],
        warnings: [],
        format: null,
        corrected: false
      };
      
      // Check if required
      if (opts.required && (!caseId || caseId.trim().length === 0)) {
        result.isValid = false;
        result.errors.push('Case ID is required');
        return result;
      }
      
      // Handle null/undefined
      if (caseId === null || caseId === undefined) {
        result.sanitized = opts.required ? '' : caseId;
        return result;
      }
      
      // Clean and normalize input
      const cleanCaseId = String(caseId).trim().toUpperCase();
      
      // Check against supported patterns
      const formatResults = this.checkCaseIdFormats(cleanCaseId, opts);
      
      if (!formatResults.isValid) {
        result.isValid = false;
        result.errors = formatResults.errors;
        
        // Attempt auto-correction if enabled
        if (opts.autoCorrect) {
          const corrected = this.attemptCaseIdCorrection(cleanCaseId);
          if (corrected.success) {
            result.corrected = true;
            result.sanitized = corrected.caseId;
            result.warnings.push(`Case ID auto-corrected from ${cleanCaseId} to ${corrected.caseId}`);
            result.format = corrected.format;
            result.isValid = true;
          }
        }
        
        return result;
      }
      
      result.sanitized = cleanCaseId;
      result.format = formatResults.format;
      
      // Additional business rule validation
      const businessValidation = this.validateCaseIdBusinessRules(cleanCaseId, opts);
      if (!businessValidation.isValid) {
        result.warnings.push(...businessValidation.warnings);
      }
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        sanitized: null,
        errors: [`Case ID validation error: ${error.message}`],
        warnings: [],
        format: null,
        corrected: false
      };
    }
  }
  
  /**
   * Check case ID against all supported formats
   */
  checkCaseIdFormats(caseId, options) {
    const patterns = this.caseIdPatterns;
    const errors = [];
    
    // Primary format check
    if (patterns[options.format]) {
      if (patterns[options.format].test(caseId)) {
        return { isValid: true, format: options.format };
      }
      errors.push(`Case ID does not match ${options.format} format: ${patterns[options.format]}`);
    }
    
    // Check alternative formats if primary fails
    for (const [formatName, pattern] of Object.entries(patterns)) {
      if (formatName !== options.format && pattern.test(caseId)) {
        if (options.allowLegacy || formatName !== 'legacy') {
          return { 
            isValid: true, 
            format: formatName,
            warnings: formatName === 'legacy' ? ['Using legacy case ID format'] : []
          };
        }
      }
    }
    
    errors.push(`Case ID "${caseId}" does not match any supported format`);
    return { isValid: false, errors };
  }
  
  /**
   * Attempt to auto-correct case ID format
   */
  attemptCaseIdCorrection(caseId) {
    try {
      // Remove invalid characters
      let corrected = caseId.replace(/[^A-Z0-9\-]/g, '');
      
      // Try to identify and fix common patterns
      if (/^\d{1}-\d+$/.test(corrected)) {
        // Looks like Google format but wrong length
        const parts = corrected.split('-');
        if (parts[1].length > 13) {
          corrected = `${parts[0]}-${parts[1].substring(0, 13)}`;
        } else if (parts[1].length < 13) {
          corrected = `${parts[0]}-${parts[1].padStart(13, '0')}`;
        }
        
        if (this.caseIdPatterns.google.test(corrected)) {
          return { success: true, caseId: corrected, format: 'google' };
        }
      }
      
      // Try to convert to standard format
      if (/^[A-Z0-9\-]+$/.test(corrected) && corrected.length >= 8) {
        const standardized = this.convertToStandardFormat(corrected);
        if (standardized) {
          return { success: true, caseId: standardized, format: 'standard' };
        }
      }
      
      return { success: false };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Convert case ID to standard format
   */
  convertToStandardFormat(caseId) {
    // Extract numbers and create standard format
    const numbers = caseId.replace(/[^0-9]/g, '');
    if (numbers.length >= 8) {
      return `CS-${numbers.substring(0, 12)}`;
    }
    return null;
  }
  
  /**
   * Validate case ID business rules
   */
  validateCaseIdBusinessRules(caseId, options) {
    const warnings = [];
    const sheetType = options.sheetType;
    
    // Check if case ID prefix matches sheet type
    if (sheetType && this.caseIdPatterns.internal.test(caseId)) {
      const prefix = caseId.split('-')[0];
      const expectedPrefixes = this.getExpectedPrefixes(sheetType);
      
      if (!expectedPrefixes.includes(prefix)) {
        warnings.push(`Case ID prefix "${prefix}" may not match sheet type "${sheetType}"`);
      }
    }
    
    // Check for duplicate or similar case IDs (would require database check)
    // This is a placeholder for future implementation
    
    return {
      isValid: true,
      warnings
    };
  }
  
  /**
   * Get expected case ID prefixes for sheet type
   */
  getExpectedPrefixes(sheetType) {
    const prefixMap = {
      'OT Email': ['OTE'],
      '3PO Email': ['3PO'],
      'OT Chat': ['OTC'],
      '3PO Chat': ['3PC'],
      'OT Phone': ['OTP'],
      '3PO Phone': ['3PP']
    };
    
    return prefixMap[sheetType] || [];
  }
  
  /**
   * Comprehensive data validation with cross-field rules
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateDataWithIntegrity(data, schema, options = {}) {
    try {
      const opts = {
        enableCrossFieldValidation: true,
        enableBusinessRules: true,
        enableIntegrityChecks: true,
        strictMode: false,
        ...options
      };
      
      const result = {
        isValid: true,
        sanitized: {},
        errors: [],
        warnings: [],
        fieldResults: {},
        crossFieldResults: [],
        integrityResults: []
      };
      
      // First pass: Individual field validation
      const fieldValidation = this.inputValidator.validateObject(data, schema);
      result.isValid = fieldValidation.isValid;
      result.sanitized = fieldValidation.sanitized;
      result.errors = fieldValidation.errors;
      result.warnings = fieldValidation.warnings;
      
      if (!result.isValid && opts.strictMode) {
        return result;
      }
      
      // Second pass: Cross-field validation
      if (opts.enableCrossFieldValidation) {
        const crossFieldResults = this.performCrossFieldValidation(result.sanitized);
        result.crossFieldResults = crossFieldResults;
        
        const crossFieldErrors = crossFieldResults
          .filter(r => !r.isValid)
          .map(r => r.error);
        
        if (crossFieldErrors.length > 0) {
          result.isValid = false;
          result.errors.push(...crossFieldErrors);
        }
        
        const crossFieldWarnings = crossFieldResults
          .filter(r => r.warnings && r.warnings.length > 0)
          .flatMap(r => r.warnings);
        
        result.warnings.push(...crossFieldWarnings);
      }
      
      // Third pass: Data integrity checks
      if (opts.enableIntegrityChecks) {
        const integrityResults = this.performIntegrityChecks(result.sanitized);
        result.integrityResults = integrityResults;
        
        const integrityErrors = integrityResults
          .filter(r => !r.isValid)
          .map(r => r.error);
        
        if (integrityErrors.length > 0) {
          result.isValid = false;
          result.errors.push(...integrityErrors);
        }
      }
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        sanitized: {},
        errors: [`Data validation error: ${error.message}`],
        warnings: [],
        fieldResults: {},
        crossFieldResults: [],
        integrityResults: []
      };
    }
  }
  
  /**
   * Perform cross-field validation
   */
  performCrossFieldValidation(data) {
    const results = [];
    
    this.crossFieldRules.forEach(rule => {
      try {
        const ruleResult = rule.validate(data);
        results.push({
          rule: rule.name,
          description: rule.description,
          isValid: ruleResult.isValid,
          error: ruleResult.error,
          warnings: ruleResult.warnings || []
        });
      } catch (error) {
        results.push({
          rule: rule.name,
          description: rule.description,
          isValid: false,
          error: `Cross-field validation error: ${error.message}`,
          warnings: []
        });
      }
    });
    
    return results;
  }
  
  /**
   * Validate date consistency
   */
  validateDateConsistency(data) {
    const errors = [];
    const warnings = [];
    
    const openDate = data.caseOpenDate ? new Date(data.caseOpenDate) : null;
    const closeDate = data.closeDate ? new Date(data.closeDate) : null;
    const firstCloseDate = data.firstCloseDate ? new Date(data.firstCloseDate) : null;
    
    // Close date must be after open date
    if (openDate && closeDate && closeDate < openDate) {
      errors.push('Close date cannot be before open date');
    }
    
    // First close date must be after open date
    if (openDate && firstCloseDate && firstCloseDate < openDate) {
      errors.push('First close date cannot be before open date');
    }
    
    // Check for dates in the future (business rule)
    const now = new Date();
    if (openDate && openDate > now) {
      warnings.push('Open date is in the future');
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.join('; '),
      warnings
    };
  }
  
  /**
   * Validate status transition logic
   */
  validateStatusTransition(data) {
    const validTransitions = {
      'Open': ['Assigned', 'Closed'],
      'Assigned': ['In Progress', 'Closed', 'Open'],
      'In Progress': ['Assigned', 'Resolved', 'Closed'],
      'Resolved': ['Closed', 'Assigned'],
      'Closed': ['Assigned'] // Allow reopening
    };
    
    const currentStatus = data.caseStatus;
    const previousStatus = data._previousStatus; // Would need to be provided
    
    if (!currentStatus) {
      return { isValid: true }; // No status to validate
    }
    
    if (previousStatus && validTransitions[previousStatus]) {
      const allowedTransitions = validTransitions[previousStatus];
      if (!allowedTransitions.includes(currentStatus)) {
        return {
          isValid: false,
          error: `Invalid status transition from "${previousStatus}" to "${currentStatus}"`
        };
      }
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate assignee permission
   */
  validateAssigneePermission(data) {
    const assignee = data.firstAssignee || data.finalAssignee;
    
    if (!assignee) {
      return { isValid: true }; // No assignee to validate
    }
    
    // Check email format and domain
    const emailValidation = this.inputValidator.validateEmail(assignee, {
      allowedDomains: ['@google.com'],
      required: false
    });
    
    if (!emailValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid assignee email: ${emailValidation.errors.join(', ')}`
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate exclusion logic
   */
  validateExclusionLogic(data) {
    const exclusionFields = ['bug', 'l2Consulted', 'tsConsulted', 'idtBlocked', 'payreqBlocked'];
    const errors = [];
    const warnings = [];
    
    // Check for conflicting exclusions
    const activeExclusions = exclusionFields.filter(field => 
      data[field] === '1' || data[field] === 1 || data[field] === true
    );
    
    // Business rule: Some exclusions are mutually exclusive
    if (activeExclusions.includes('bug') && activeExclusions.includes('l2Consulted')) {
      warnings.push('Bug cases typically should not require L2 consultation');
    }
    
    // All exclusions active might indicate data error
    if (activeExclusions.length >= 4) {
      warnings.push('Multiple exclusions active - please verify case details');
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.join('; '),
      warnings
    };
  }
  
  /**
   * Validate channel consistency
   */
  validateChannelConsistency(data) {
    const sheetType = data.sheetType || data._sheetType;
    const channel = data.channel;
    
    if (!sheetType || !channel) {
      return { isValid: true }; // Can't validate without both fields
    }
    
    const channelMapping = {
      'Email': ['OT Email', '3PO Email'],
      'Chat': ['OT Chat', '3PO Chat'],
      'Phone': ['OT Phone', '3PO Phone']
    };
    
    const expectedSheets = channelMapping[channel];
    if (expectedSheets && !expectedSheets.includes(sheetType)) {
      return {
        isValid: false,
        error: `Channel "${channel}" does not match sheet type "${sheetType}"`
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Perform data integrity checks
   */
  performIntegrityChecks(data) {
    const results = [];
    
    // Check for required field combinations
    results.push(this.checkRequiredFieldCombinations(data));
    
    // Check data format consistency
    results.push(this.checkDataFormatConsistency(data));
    
    // Check business rule compliance
    results.push(this.checkBusinessRuleCompliance(data));
    
    return results.filter(r => r !== null);
  }
  
  /**
   * Check required field combinations
   */
  checkRequiredFieldCombinations(data) {
    const errors = [];
    
    // If case is closed, must have close date and time
    if (data.caseStatus === 'Closed') {
      if (!data.closeDate) {
        errors.push('Closed cases must have a close date');
      }
      if (!data.closeTime) {
        errors.push('Closed cases must have a close time');
      }
    }
    
    // If case has assignee, must have assignment-related fields
    if (data.firstAssignee || data.finalAssignee) {
      if (!data.caseStatus || data.caseStatus === 'Open') {
        errors.push('Assigned cases cannot have "Open" status');
      }
    }
    
    return errors.length > 0 ? {
      check: 'requiredFieldCombinations',
      isValid: false,
      error: errors.join('; ')
    } : null;
  }
  
  /**
   * Check data format consistency
   */
  checkDataFormatConsistency(data) {
    const errors = [];
    
    // Check time format consistency
    const timeFields = ['caseOpenTime', 'closeTime', 'firstCloseTime'];
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    
    timeFields.forEach(field => {
      if (data[field] && !timePattern.test(data[field])) {
        errors.push(`Invalid time format for ${field}: ${data[field]}`);
      }
    });
    
    // Check numeric field formats
    const numericFields = ['is30', 'triage', 'preferEither', 'amInitiated'];
    numericFields.forEach(field => {
      if (data[field] !== null && data[field] !== undefined) {
        const value = String(data[field]);
        if (!['0', '1', ''].includes(value)) {
          errors.push(`Invalid numeric format for ${field}: ${data[field]} (expected 0 or 1)`);
        }
      }
    });
    
    return errors.length > 0 ? {
      check: 'dataFormatConsistency',
      isValid: false,
      error: errors.join('; ')
    } : null;
  }
  
  /**
   * Check business rule compliance
   */
  checkBusinessRuleCompliance(data) {
    const warnings = [];
    
    // Check for reasonable case duration
    if (data.caseOpenDate && data.closeDate) {
      const openDate = new Date(data.caseOpenDate);
      const closeDate = new Date(data.closeDate);
      const durationHours = (closeDate - openDate) / (1000 * 60 * 60);
      
      if (durationHours < 0.1) { // Less than 6 minutes
        warnings.push('Case resolved very quickly - please verify accuracy');
      } else if (durationHours > 720) { // More than 30 days
        warnings.push('Case open for extended period - consider reviewing status');
      }
    }
    
    return warnings.length > 0 ? {
      check: 'businessRuleCompliance',
      isValid: true,
      warnings
    } : null;
  }
  
  /**
   * Generate data integrity report
   * @param {Object} data - Data to analyze
   * @returns {Object} Integrity report
   */
  generateIntegrityReport(data) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        dataSize: Object.keys(data).length,
        validationResults: {},
        integrityScore: 0,
        recommendations: []
      };
      
      // Perform comprehensive validation
      const validation = this.validateDataWithIntegrity(data, {}, {
        enableCrossFieldValidation: true,
        enableBusinessRules: true,
        enableIntegrityChecks: true
      });
      
      report.validationResults = validation;
      
      // Calculate integrity score (0-100)
      const totalChecks = 1 + validation.crossFieldResults.length + validation.integrityResults.length;
      const passedChecks = (validation.isValid ? 1 : 0) +
        validation.crossFieldResults.filter(r => r.isValid).length +
        validation.integrityResults.filter(r => r.isValid).length;
      
      report.integrityScore = Math.round((passedChecks / totalChecks) * 100);
      
      // Generate recommendations
      if (!validation.isValid) {
        report.recommendations.push('Address field validation errors');
      }
      
      if (validation.warnings.length > 0) {
        report.recommendations.push('Review validation warnings');
      }
      
      if (report.integrityScore < 80) {
        report.recommendations.push('Improve data quality - integrity score below threshold');
      }
      
      return report;
      
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: `Failed to generate integrity report: ${error.message}`,
        integrityScore: 0,
        recommendations: ['Fix data validation system']
      };
    }
  }
  
  /**
   * Static validation methods for quick use
   */
  static validateCaseId(caseId, options) {
    const validator = new EnhancedDataValidator();
    return validator.validateCaseId(caseId, options);
  }
  
  static validateDataIntegrity(data, schema, options) {
    const validator = new EnhancedDataValidator();
    return validator.validateDataWithIntegrity(data, schema, options);
  }
  
  static generateIntegrityReport(data) {
    const validator = new EnhancedDataValidator();
    return validator.generateIntegrityReport(data);
  }
}

console.log('✅ Enhanced Data Validator loaded successfully');
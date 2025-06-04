/**
 * CasesDash - Sheet Mapper
 * Maps case data to spreadsheet columns and handles data validation
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

if (typeof window !== 'undefined') {
  window.CasesDashSheetMapper = (function() {
    'use strict';

    /**
     * SheetMapper class for handling sheet type mappings and validations
     */
    class SheetMapper {
      
      /**
       * Constructor
       * @param {string} sheetType - The sheet type to map
       */
      constructor(sheetType) {
        this.sheetType = sheetType;
        this.mappings = this.getSheetTypeMappings(sheetType);
        this.requiredFields = this.getRequiredFieldsForType(sheetType);
        this.validationRules = this.getValidationRulesForType(sheetType);
      }

      /**
       * Get all field mappings for the current sheet type
       * @returns {Object} Field mappings
       */
      getAllMappings() {
        return this.mappings;
      }

      /**
       * Get required fields for the current sheet type
       * @returns {Array<string>} Required field names
       */
      getRequiredFields() {
        return this.requiredFields;
      }

      /**
       * Get sheet-specific fields (fields unique to this sheet type)
       * @returns {Array<string>} Sheet-specific field names
       */
      getSheetSpecificFields() {
        const commonFields = [
          'caseId', 'caseOpenDate', 'caseOpenTime', 'incomingSegment', 
          'productCategory', 'triage', 'preferEither', 'is30',
          'firstAssignee', 'poolTransferDestination', 'poolTransferReason',
          'mcc', 'changeToChild', 'excludeFromTRT', 'excludeTRTP95', 'trtExclusionReason'
        ];
        
        return Object.keys(this.mappings).filter(field => !commonFields.includes(field));
      }

      /**
       * Get column mapping for a specific field
       * @param {string} fieldName - Field name
       * @returns {string|null} Column letter or null if not found
       */
      getColumn(fieldName) {
        return this.mappings[fieldName] || null;
      }

      /**
       * Validate a field value
       * @param {string} fieldName - Field name
       * @param {any} value - Value to validate
       * @returns {Object} Validation result {isValid: boolean, error?: string}
       */
      validateField(fieldName, value) {
        const rules = this.validationRules[fieldName];
        if (!rules) {
          return { isValid: true };
        }

        // Required field validation
        if (rules.required && (!value || String(value).trim() === '')) {
          return { isValid: false, error: `${fieldName} is required` };
        }

        // Type validation
        if (value && rules.type) {
          if (!this.validateFieldType(value, rules.type)) {
            return { isValid: false, error: `${fieldName} must be of type ${rules.type}` };
          }
        }

        // Pattern validation
        if (value && rules.pattern && !rules.pattern.test(String(value))) {
          return { isValid: false, error: rules.errorMessage || `${fieldName} format is invalid` };
        }

        // Min/Max length validation
        if (value && rules.minLength && String(value).length < rules.minLength) {
          return { isValid: false, error: `${fieldName} must be at least ${rules.minLength} characters` };
        }

        if (value && rules.maxLength && String(value).length > rules.maxLength) {
          return { isValid: false, error: `${fieldName} must be no more than ${rules.maxLength} characters` };
        }

        // Options validation
        if (value && rules.options && !rules.options.includes(value)) {
          return { isValid: false, error: `${fieldName} must be one of: ${rules.options.join(', ')}` };
        }

        return { isValid: true };
      }

      /**
       * Validate field type
       * @private
       * @param {any} value - Value to validate
       * @param {string} type - Expected type
       * @returns {boolean} Whether the value matches the type
       */
      validateFieldType(value, type) {
        switch (type) {
          case 'string':
            return typeof value === 'string';
          case 'number':
            return !isNaN(Number(value));
          case 'boolean':
            return typeof value === 'boolean' || value === 'true' || value === 'false';
          case 'date':
            return !isNaN(Date.parse(value));
          case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(value);
          default:
            return true;
        }
      }

      /**
       * Get sheet type mappings
       * @private
       * @param {string} sheetType - Sheet type
       * @returns {Object} Field to column mappings
       */
      getSheetTypeMappings(sheetType) {
        const baseMappings = {
          // Common fields across all sheet types
          caseId: 'A',
          caseOpenDate: 'B',
          caseOpenTime: 'C',
          incomingSegment: 'D',
          productCategory: 'E',
          triage: 'F',
          preferEither: 'G',
          is30: 'H',
          firstAssignee: 'I',
          poolTransferDestination: 'J',
          poolTransferReason: 'K',
          mcc: 'L',
          changeToChild: 'M',
          excludeFromTRT: 'N',
          excludeTRTP95: 'O',
          trtExclusionReason: 'P'
        };

        // Sheet-specific mappings
        const sheetSpecificMappings = {
          'OT Email': {
            ...baseMappings,
            amInitiated: 'Q'
          },
          '3PO Email': {
            ...baseMappings,
            issueCategory: 'Q',
            details: 'R'
          },
          'OT Chat': {
            ...baseMappings,
            chatDuration: 'Q',
            chatRating: 'R'
          },
          '3PO Chat': {
            ...baseMappings,
            issueCategory: 'Q',
            details: 'R',
            chatDuration: 'S'
          },
          'OT Phone': {
            ...baseMappings,
            callDuration: 'Q',
            callOutcome: 'R'
          },
          '3PO Phone': {
            ...baseMappings,
            issueCategory: 'Q',
            details: 'R',
            callDuration: 'S'
          }
        };

        return sheetSpecificMappings[sheetType] || baseMappings;
      }

      /**
       * Get required fields for sheet type
       * @private
       * @param {string} sheetType - Sheet type
       * @returns {Array<string>} Required field names
       */
      getRequiredFieldsForType(sheetType) {
        const baseRequired = [
          'caseOpenDate',
          'caseOpenTime',
          'incomingSegment',
          'productCategory'
        ];

        const sheetSpecificRequired = {
          '3PO Email': [...baseRequired, 'issueCategory', 'details'],
          '3PO Chat': [...baseRequired, 'issueCategory', 'details'],
          '3PO Phone': [...baseRequired, 'issueCategory', 'details']
        };

        return sheetSpecificRequired[sheetType] || baseRequired;
      }

      /**
       * Get validation rules for sheet type
       * @private
       * @param {string} sheetType - Sheet type
       * @returns {Object} Validation rules
       */
      getValidationRulesForType(sheetType) {
        return {
          caseId: {
            type: 'string',
            pattern: /^[A-Z0-9\-]+$/,
            maxLength: 50,
            errorMessage: 'Case ID must contain only uppercase letters, numbers, and hyphens'
          },
          caseOpenDate: {
            required: true,
            type: 'date',
            errorMessage: 'Please enter a valid date'
          },
          caseOpenTime: {
            required: true,
            type: 'string',
            pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            errorMessage: 'Please enter time in HH:MM format'
          },
          incomingSegment: {
            required: true,
            type: 'string',
            options: ['Platinum', 'Titanium', 'Gold', 'Silver', 'Bronze - Low', 'Bronze - High']
          },
          productCategory: {
            required: true,
            type: 'string',
            options: ['Search', 'Display', 'Video', 'Commerce', 'Apps', 'M&A', 'Policy', 'Billing', 'Other']
          },
          issueCategory: {
            required: sheetType.includes('3PO'),
            type: 'string',
            options: ['Technical', 'Account', 'Billing', 'Policy', 'General']
          },
          details: {
            required: sheetType.includes('3PO'),
            type: 'string',
            minLength: 10,
            maxLength: 1000,
            errorMessage: 'Details must be between 10 and 1000 characters'
          },
          firstAssignee: {
            type: 'email',
            errorMessage: 'Please enter a valid email address'
          },
          trtExclusionReason: {
            type: 'string',
            options: ['Technical Issue', 'Customer Request', 'Process Exception', 'Quality Issue', 'Other']
          }
        };
      }

      /**
       * Convert case data to row array for spreadsheet
       * @param {Object} caseData - Case data object
       * @returns {Array} Row data array
       */
      toRowData(caseData) {
        const row = [];
        const columnCount = Math.max(...Object.values(this.mappings).map(col => this.columnToIndex(col))) + 1;
        
        // Initialize array with empty values
        for (let i = 0; i < columnCount; i++) {
          row[i] = '';
        }

        // Fill in the data
        Object.keys(this.mappings).forEach(fieldName => {
          const columnLetter = this.mappings[fieldName];
          const columnIndex = this.columnToIndex(columnLetter);
          const value = caseData[fieldName];
          
          if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
              row[columnIndex] = value ? 'TRUE' : 'FALSE';
            } else {
              row[columnIndex] = String(value);
            }
          }
        });

        return row;
      }

      /**
       * Convert row array to case data object
       * @param {Array} rowData - Row data array
       * @returns {Object} Case data object
       */
      fromRowData(rowData) {
        const caseData = {};
        
        Object.keys(this.mappings).forEach(fieldName => {
          const columnLetter = this.mappings[fieldName];
          const columnIndex = this.columnToIndex(columnLetter);
          const value = rowData[columnIndex];
          
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            if (value === 'TRUE' || value === 'FALSE') {
              caseData[fieldName] = value === 'TRUE';
            } else {
              caseData[fieldName] = value;
            }
          }
        });

        return caseData;
      }

      /**
       * Convert column letter to index
       * @private
       * @param {string} column - Column letter (A, B, C, etc.)
       * @returns {number} Column index (0-based)
       */
      columnToIndex(column) {
        let index = 0;
        for (let i = 0; i < column.length; i++) {
          index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return index - 1;
      }

      /**
       * Convert column index to letter
       * @private
       * @param {number} index - Column index (0-based)
       * @returns {string} Column letter
       */
      indexToColumn(index) {
        let column = '';
        while (index >= 0) {
          column = String.fromCharCode((index % 26) + 'A'.charCodeAt(0)) + column;
          index = Math.floor(index / 26) - 1;
        }
        return column;
      }

      /**
       * Get header row for the sheet type
       * @returns {Array<string>} Header row
       */
      getHeaderRow() {
        const headers = [];
        const columnCount = Math.max(...Object.values(this.mappings).map(col => this.columnToIndex(col))) + 1;
        
        // Initialize with empty headers
        for (let i = 0; i < columnCount; i++) {
          headers[i] = '';
        }

        // Fill in the headers
        Object.keys(this.mappings).forEach(fieldName => {
          const columnLetter = this.mappings[fieldName];
          const columnIndex = this.columnToIndex(columnLetter);
          headers[columnIndex] = this.getFieldDisplayName(fieldName);
        });

        return headers;
      }

      /**
       * Get display name for field
       * @private
       * @param {string} fieldName - Field name
       * @returns {string} Display name
       */
      getFieldDisplayName(fieldName) {
        const displayNames = {
          caseId: 'Case ID',
          caseOpenDate: 'Case Open Date',
          caseOpenTime: 'Case Open Time',
          incomingSegment: 'Incoming Segment',
          productCategory: 'Product Category',
          issueCategory: 'Issue Category',
          details: 'Details',
          triage: 'Triage',
          preferEither: 'Prefer Either',
          amInitiated: 'AM Initiated',
          is30: '30 Day Case',
          firstAssignee: 'First Assignee',
          poolTransferDestination: 'Pool Transfer Destination',
          poolTransferReason: 'Pool Transfer Reason',
          mcc: 'MCC',
          changeToChild: 'Change to Child',
          excludeFromTRT: 'Exclude from TRT',
          excludeTRTP95: 'Exclude TRT P95',
          trtExclusionReason: 'TRT Exclusion Reason',
          chatDuration: 'Chat Duration',
          chatRating: 'Chat Rating',
          callDuration: 'Call Duration',
          callOutcome: 'Call Outcome'
        };

        return displayNames[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      }
    }

    // Export SheetMapper class
    return {
      SheetMapper: SheetMapper
    };

  })();

  // Global alias for backward compatibility
  if (typeof window.SheetMapper === 'undefined') {
    window.SheetMapper = window.CasesDashSheetMapper.SheetMapper;
  }
}
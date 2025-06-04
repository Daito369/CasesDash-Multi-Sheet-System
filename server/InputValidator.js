/**
 * InputValidator - Comprehensive Input Validation and Sanitization System
 * Provides robust protection against XSS, SQL injection, and other injection attacks
 * 
 * @author Claude Code Security Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * Input Validation and Sanitization Manager
 */
class InputValidator {
  
  constructor() {
    this.config = SecurityConfig.getInputValidationConfig();
  }
  
  /**
   * Validate and sanitize string input
   */
  validateString(input, options = {}) {
    try {
      const opts = {
        required: false,
        minLength: 0,
        maxLength: this.config.maxStringLength,
        pattern: null,
        allowHTML: false,
        allowSpecialChars: true,
        ...options
      };
      
      const result = {
        isValid: true,
        sanitized: null,
        errors: [],
        warnings: []
      };
      
      // Check if required
      if (opts.required && (!input || input.trim().length === 0)) {
        result.isValid = false;
        result.errors.push('Field is required');
        return result;
      }
      
      // Handle null/undefined
      if (input === null || input === undefined) {
        result.sanitized = opts.required ? '' : input;
        return result;
      }
      
      // Convert to string
      const stringInput = String(input);
      
      // Check length
      if (stringInput.length > opts.maxLength) {
        result.isValid = false;
        result.errors.push(`Input exceeds maximum length of ${opts.maxLength} characters`);
        return result;
      }
      
      if (stringInput.length < opts.minLength) {
        result.isValid = false;
        result.errors.push(`Input must be at least ${opts.minLength} characters`);
        return result;
      }
      
      // Check SQL injection patterns
      if (!SecurityUtils.validateSQLInput(stringInput)) {
        result.isValid = false;
        result.errors.push('Input contains potentially dangerous SQL patterns');
        return result;
      }
      
      // Check XSS patterns
      if (!opts.allowHTML) {
        try {
          result.sanitized = SecurityUtils.sanitizeInput(stringInput);
        } catch (error) {
          result.isValid = false;
          result.errors.push('Input contains potentially malicious content');
          return result;
        }
      } else {
        result.sanitized = stringInput;
        result.warnings.push('HTML content allowed - ensure proper output encoding');
      }
      
      // Validate pattern if provided
      if (opts.pattern && !opts.pattern.test(result.sanitized)) {
        result.isValid = false;
        result.errors.push('Input does not match required pattern');
        return result;
      }
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        sanitized: null,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Validate email address
   */
  validateEmail(email, options = {}) {
    const opts = {
      required: false,
      allowedDomains: ['@google.com'],
      ...options
    };
    
    const result = this.validateString(email, {
      required: opts.required,
      maxLength: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    
    if (!result.isValid) {
      return result;
    }
    
    // Check domain restrictions
    if (opts.allowedDomains && opts.allowedDomains.length > 0) {
      const isAllowedDomain = opts.allowedDomains.some(domain => 
        result.sanitized.endsWith(domain)
      );
      
      if (!isAllowedDomain) {
        result.isValid = false;
        result.errors.push(`Email domain not allowed. Allowed domains: ${opts.allowedDomains.join(', ')}`);
      }
    }
    
    return result;
  }
  
  /**
   * Validate case ID
   */
  validateCaseId(caseId, options = {}) {
    const opts = {
      required: true,
      ...options
    };
    
    return this.validateString(caseId, {
      required: opts.required,
      minLength: 1,
      maxLength: 100,
      pattern: /^[A-Za-z0-9\-_]+$/,
      allowHTML: false
    });
  }
  
  /**
   * Validate sheet type
   */
  validateSheetType(sheetType, options = {}) {
    const allowedSheetTypes = [
      'OT Email', '3PO Email', 'OT Chat', 
      '3PO Chat', 'OT Phone', '3PO Phone'
    ];
    
    const result = this.validateString(sheetType, {
      required: true,
      maxLength: 50
    });
    
    if (!result.isValid) {
      return result;
    }
    
    if (!allowedSheetTypes.includes(result.sanitized)) {
      result.isValid = false;
      result.errors.push(`Invalid sheet type. Allowed types: ${allowedSheetTypes.join(', ')}`);
    }
    
    return result;
  }
  
  /**
   * Validate user role
   */
  validateUserRole(role, options = {}) {
    const allowedRoles = ['user', 'teamLeader', 'admin'];
    
    const result = this.validateString(role, {
      required: true,
      maxLength: 20
    });
    
    if (!result.isValid) {
      return result;
    }
    
    if (!allowedRoles.includes(result.sanitized)) {
      result.isValid = false;
      result.errors.push(`Invalid user role. Allowed roles: ${allowedRoles.join(', ')}`);
    }
    
    return result;
  }
  
  /**
   * Validate object with schema
   */
  validateObject(obj, schema) {
    const result = {
      isValid: true,
      sanitized: {},
      errors: [],
      warnings: []
    };
    
    try {
      // Check required fields
      for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        const value = obj[fieldName];
        let fieldResult;
        
        switch (fieldSchema.type) {
          case 'string':
            fieldResult = this.validateString(value, fieldSchema);
            break;
          case 'email':
            fieldResult = this.validateEmail(value, fieldSchema);
            break;
          case 'caseId':
            fieldResult = this.validateCaseId(value, fieldSchema);
            break;
          case 'sheetType':
            fieldResult = this.validateSheetType(value, fieldSchema);
            break;
          case 'userRole':
            fieldResult = this.validateUserRole(value, fieldSchema);
            break;
          default:
            fieldResult = this.validateString(value, fieldSchema);
        }
        
        if (!fieldResult.isValid) {
          result.isValid = false;
          result.errors.push(...fieldResult.errors.map(err => `${fieldName}: ${err}`));
        } else {
          result.sanitized[fieldName] = fieldResult.sanitized;
          if (fieldResult.warnings.length > 0) {
            result.warnings.push(...fieldResult.warnings.map(warn => `${fieldName}: ${warn}`));
          }
        }
      }
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        sanitized: {},
        errors: [`Object validation error: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Validate case data
   */
  validateCaseData(caseData, isCreate = false) {
    const schema = {
      sheetType: { type: 'sheetType', required: true },
      caseId: { type: 'caseId', required: isCreate },
      assignee: { type: 'email', required: false },
      priority: { 
        type: 'string', 
        required: false, 
        pattern: /^(Low|Medium|High|Critical)$/i,
        maxLength: 20
      },
      status: {
        type: 'string',
        required: false,
        pattern: /^(Open|Assigned|In Progress|Resolved|Closed)$/i,
        maxLength: 20
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 5000,
        allowHTML: false
      },
      tags: {
        type: 'string',
        required: false,
        maxLength: 500,
        allowHTML: false
      }
    };
    
    return this.validateObject(caseData, schema);
  }
  
  /**
   * Validate search criteria
   */
  validateSearchCriteria(criteria) {
    const schema = {
      query: {
        type: 'string',
        required: false,
        maxLength: 1000,
        allowHTML: false
      },
      sheetType: { type: 'sheetType', required: false },
      assignee: { type: 'email', required: false },
      status: {
        type: 'string',
        required: false,
        pattern: /^(Open|Assigned|In Progress|Resolved|Closed)$/i
      },
      limit: {
        type: 'string',
        required: false,
        pattern: /^\d+$/,
        maxLength: 10
      }
    };
    
    return this.validateObject(criteria, schema);
  }
  
  /**
   * Validate form submission
   */
  validateFormSubmission(formData, formType) {
    try {
      const result = {
        isValid: true,
        sanitized: {},
        errors: [],
        warnings: []
      };
      
      // Common validation for all forms
      const commonValidation = this.validateObject(formData, {
        csrfToken: { type: 'string', required: true, minLength: 10 },
        sessionId: { type: 'string', required: true, minLength: 10 }
      });
      
      if (!commonValidation.isValid) {
        result.isValid = false;
        result.errors.push(...commonValidation.errors);
        return result;
      }
      
      // Form-specific validation
      switch (formType) {
        case 'createCase':
          const caseValidation = this.validateCaseData(formData, true);
          if (!caseValidation.isValid) {
            result.isValid = false;
            result.errors.push(...caseValidation.errors);
          } else {
            result.sanitized = { ...result.sanitized, ...caseValidation.sanitized };
          }
          break;
          
        case 'updateCase':
          const updateValidation = this.validateCaseData(formData, false);
          if (!updateValidation.isValid) {
            result.isValid = false;
            result.errors.push(...updateValidation.errors);
          } else {
            result.sanitized = { ...result.sanitized, ...updateValidation.sanitized };
          }
          break;
          
        case 'search':
          const searchValidation = this.validateSearchCriteria(formData);
          if (!searchValidation.isValid) {
            result.isValid = false;
            result.errors.push(...searchValidation.errors);
          } else {
            result.sanitized = { ...result.sanitized, ...searchValidation.sanitized };
          }
          break;
          
        default:
          result.warnings.push(`Unknown form type: ${formType}`);
      }
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        sanitized: {},
        errors: [`Form validation error: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Static validation methods for quick use
   */
  static validateInput(input, options) {
    const validator = new InputValidator();
    return validator.validateString(input, options);
  }
  
  static validateCaseData(caseData, isCreate = false) {
    const validator = new InputValidator();
    return validator.validateCaseData(caseData, isCreate);
  }
  
  static validateSearchCriteria(criteria) {
    const validator = new InputValidator();
    return validator.validateSearchCriteria(criteria);
  }
}

/**
 * Validation middleware for server functions
 */
class ValidationMiddleware {
  
  /**
   * Wrap function with input validation
   */
  static validate(validationSchema) {
    return function(target, propertyName, descriptor) {
      const method = descriptor.value;
      
      descriptor.value = function(...args) {
        try {
          const validator = new InputValidator();
          
          // Validate each argument according to schema
          for (let i = 0; i < args.length && i < validationSchema.length; i++) {
            const validation = validator.validateObject(args[i], validationSchema[i]);
            
            if (!validation.isValid) {
              console.warn(`❌ Validation failed for ${propertyName}:`, validation.errors);
              return {
                success: false,
                error: 'Input validation failed',
                details: validation.errors
              };
            }
            
            // Replace argument with sanitized version
            args[i] = validation.sanitized;
          }
          
          // Call original method with sanitized arguments
          return method.apply(this, args);
          
        } catch (error) {
          console.error(`❌ Validation middleware error in ${propertyName}:`, error.message);
          return {
            success: false,
            error: 'Validation error occurred'
          };
        }
      };
      
      return descriptor;
    };
  }
}

console.log('✅ Input Validation system loaded successfully');
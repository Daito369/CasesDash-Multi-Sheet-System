/**
 * Accessibility Manager - WCAG 2.1 AA Compliance System
 * Provides comprehensive accessibility features including screen reader support,
 * keyboard navigation, color vision support, and inclusive design features
 * 
 * @author Claude Code - Phase 4 Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * AccessibilityManager class for comprehensive WCAG 2.1 AA compliance
 */
class AccessibilityManager {
  
  constructor() {
    this.wcagLevel = 'AA'; // AA or AAA
    this.features = this.initializeAccessibilityFeatures();
    this.colorContrasts = this.initializeColorContrasts();
    this.keyboardNavigationMap = this.initializeKeyboardNavigation();
    this.screenReaderConfig = this.initializeScreenReaderConfig();
    this.focusManagement = this.initializeFocusManagement();
    this.announcements = [];
    this.isHighContrastMode = false;
    this.isLargeTextMode = false;
    this.isReducedMotionMode = false;
  }
  
  /**
   * Initialize accessibility features
   */
  initializeAccessibilityFeatures() {
    return {
      // WCAG 2.1 Principles
      perceivable: {
        textAlternatives: true,
        captionsSubtitles: true,
        adaptable: true,
        distinguishable: true
      },
      operable: {
        keyboardAccessible: true,
        noSeizures: true,
        navigable: true,
        inputModalities: true
      },
      understandable: {
        readable: true,
        predictable: true,
        inputAssistance: true
      },
      robust: {
        compatible: true,
        parsing: true
      },
      
      // Enhanced features
      enhanced: {
        voiceNavigation: false, // Future enhancement
        gestureSupport: false,  // Future enhancement
        cognitiveSupport: true,
        multilingual: true
      }
    };
  }
  
  /**
   * Initialize color contrast ratios for WCAG compliance
   */
  initializeColorContrasts() {
    return {
      // WCAG AA requirements
      normalText: 4.5,
      largeText: 3.0,    // 18pt+ or 14pt+ bold
      
      // WCAG AAA requirements (enhanced)
      normalTextAAA: 7.0,
      largeTextAAA: 4.5,
      
      // UI components
      uiComponents: 3.0,
      
      // Predefined accessible color pairs
      colorPairs: {
        highContrast: {
          background: '#000000',
          text: '#FFFFFF',
          accent: '#FFFF00',
          link: '#00FFFF',
          error: '#FF6B6B',
          success: '#51CF66',
          warning: '#FFD43B'
        },
        normalContrast: {
          background: '#FFFFFF',
          text: '#212529',
          accent: '#0066CC',
          link: '#0052A3',
          error: '#D63384',
          success: '#198754',
          warning: '#FFC107'
        },
        darkMode: {
          background: '#1A1A1A',
          text: '#E9ECEF',
          accent: '#66B3FF',
          link: '#80BFFF',
          error: '#FF8A8A',
          success: '#6BCF7F',
          warning: '#FFD93D'
        }
      }
    };
  }
  
  /**
   * Initialize keyboard navigation mappings
   */
  initializeKeyboardNavigation() {
    return {
      // Standard navigation
      standard: {
        'Tab': 'nextElement',
        'Shift+Tab': 'previousElement',
        'Enter': 'activate',
        'Space': 'select',
        'Escape': 'cancel',
        'Home': 'firstElement',
        'End': 'lastElement'
      },
      
      // Arrow key navigation
      arrows: {
        'ArrowUp': 'previousItem',
        'ArrowDown': 'nextItem',
        'ArrowLeft': 'previousColumn',
        'ArrowRight': 'nextColumn'
      },
      
      // Application-specific shortcuts
      application: {
        'Ctrl+S': 'save',
        'Ctrl+N': 'create',
        'Ctrl+E': 'edit',
        'Ctrl+D': 'delete',
        'Ctrl+F': 'search',
        'Ctrl+R': 'refresh',
        'Alt+H': 'help',
        'Alt+M': 'menu'
      },
      
      // Accessibility shortcuts
      accessibility: {
        'Alt+Shift+H': 'toggleHighContrast',
        'Alt+Shift+L': 'toggleLargeText',
        'Alt+Shift+M': 'toggleReducedMotion',
        'Alt+Shift+S': 'skipToMain',
        'Alt+Shift+N': 'skipToNav'
      }
    };
  }
  
  /**
   * Initialize screen reader configuration
   */
  initializeScreenReaderConfig() {
    return {
      // ARIA live regions
      liveRegions: {
        polite: 'aria-live="polite"',
        assertive: 'aria-live="assertive"',
        off: 'aria-live="off"'
      },
      
      // ARIA roles
      roles: {
        navigation: 'navigation',
        main: 'main',
        banner: 'banner',
        contentinfo: 'contentinfo',
        complementary: 'complementary',
        button: 'button',
        link: 'link',
        menuitem: 'menuitem',
        tab: 'tab',
        tabpanel: 'tabpanel',
        dialog: 'dialog',
        alert: 'alert',
        status: 'status'
      },
      
      // ARIA properties
      properties: {
        describedby: 'aria-describedby',
        labelledby: 'aria-labelledby',
        label: 'aria-label',
        expanded: 'aria-expanded',
        selected: 'aria-selected',
        checked: 'aria-checked',
        disabled: 'aria-disabled',
        hidden: 'aria-hidden',
        invalid: 'aria-invalid',
        required: 'aria-required'
      }
    };
  }
  
  /**
   * Initialize focus management
   */
  initializeFocusManagement() {
    return {
      // Focus indicators
      styles: {
        outline: '2px solid #0066CC',
        outlineOffset: '2px',
        backgroundColor: 'rgba(0, 102, 204, 0.1)'
      },
      
      // Focus trapping for modals
      trapStack: [],
      
      // Skip links
      skipLinks: [
        { href: '#main-content', text: 'Skip to main content' },
        { href: '#navigation', text: 'Skip to navigation' },
        { href: '#search', text: 'Skip to search' }
      ]
    };
  }
  
  /**
   * Generate ARIA labels for UI elements
   * @param {string} elementType - Type of element
   * @param {Object} context - Context information
   * @returns {Object} ARIA attributes
   */
  generateARIALabels(elementType, context = {}) {
    try {
      const labels = {};
      
      switch (elementType) {
        case 'button':
          labels['aria-label'] = context.action ? 
            `${context.action} ${context.target || ''}`.trim() : 
            context.text || 'Button';
          
          if (context.expanded !== undefined) {
            labels['aria-expanded'] = context.expanded.toString();
          }
          
          if (context.pressed !== undefined) {
            labels['aria-pressed'] = context.pressed.toString();
          }
          break;
          
        case 'link':
          labels['aria-label'] = context.text || 'Link';
          
          if (context.external) {
            labels['aria-label'] += ' (opens in new window)';
          }
          
          if (context.download) {
            labels['aria-label'] += ' (download file)';
          }
          break;
          
        case 'input':
          if (context.label) {
            labels['aria-label'] = context.label;
          }
          
          if (context.required) {
            labels['aria-required'] = 'true';
          }
          
          if (context.invalid) {
            labels['aria-invalid'] = 'true';
            labels['aria-describedby'] = `${context.id}-error`;
          }
          
          if (context.description) {
            labels['aria-describedby'] = `${context.id}-description`;
          }
          break;
          
        case 'table':
          labels['role'] = 'table';
          labels['aria-label'] = context.caption || 'Data table';
          
          if (context.sortable) {
            labels['aria-sort'] = context.sortDirection || 'none';
          }
          break;
          
        case 'dialog':
          labels['role'] = 'dialog';
          labels['aria-modal'] = 'true';
          labels['aria-labelledby'] = `${context.id}-title`;
          
          if (context.description) {
            labels['aria-describedby'] = `${context.id}-description`;
          }
          break;
          
        case 'status':
          labels['role'] = 'status';
          labels['aria-live'] = context.urgency === 'high' ? 'assertive' : 'polite';
          break;
          
        case 'navigation':
          labels['role'] = 'navigation';
          labels['aria-label'] = context.label || 'Navigation';
          break;
          
        case 'form':
          labels['role'] = 'form';
          labels['aria-labelledby'] = `${context.id}-title`;
          
          if (context.errorCount > 0) {
            labels['aria-invalid'] = 'true';
            labels['aria-describedby'] = `${context.id}-errors`;
          }
          break;
      }
      
      return labels;
    } catch (error) {
      console.error('Error generating ARIA labels:', error);
      return {};
    }
  }
  
  /**
   * Validate color contrast
   * @param {string} foreground - Foreground color (hex)
   * @param {string} background - Background color (hex)
   * @param {string} textSize - Text size ('normal', 'large')
   * @returns {Object} Contrast validation result
   */
  validateColorContrast(foreground, background, textSize = 'normal') {
    try {
      const contrast = this.calculateContrastRatio(foreground, background);
      const required = textSize === 'large' ? 
        this.colorContrasts.largeText : 
        this.colorContrasts.normalText;
      
      const requiredAAA = textSize === 'large' ? 
        this.colorContrasts.largeTextAAA : 
        this.colorContrasts.normalTextAAA;
      
      return {
        ratio: contrast,
        passesAA: contrast >= required,
        passesAAA: contrast >= requiredAAA,
        level: contrast >= requiredAAA ? 'AAA' : (contrast >= required ? 'AA' : 'Fail'),
        recommendation: contrast < required ? 
          this.suggestBetterColors(foreground, background, textSize) : null
      };
    } catch (error) {
      console.error('Color contrast validation error:', error);
      return {
        ratio: 0,
        passesAA: false,
        passesAAA: false,
        level: 'Error',
        recommendation: null
      };
    }
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrastRatio(color1, color2) {
    try {
      const lum1 = this.calculateRelativeLuminance(color1);
      const lum2 = this.calculateRelativeLuminance(color2);
      
      const brighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      
      return (brighter + 0.05) / (darker + 0.05);
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Calculate relative luminance of a color
   */
  calculateRelativeLuminance(color) {
    try {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      // Apply gamma correction
      const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      
      // Calculate luminance
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Suggest better color combinations
   */
  suggestBetterColors(foreground, background, textSize) {
    const required = textSize === 'large' ? 
      this.colorContrasts.largeText : 
      this.colorContrasts.normalText;
    
    const suggestions = [];
    
    // Try predefined accessible combinations
    for (const [name, colors] of Object.entries(this.colorContrasts.colorPairs)) {
      const contrast = this.calculateContrastRatio(colors.text, colors.background);
      if (contrast >= required) {
        suggestions.push({
          name: name,
          foreground: colors.text,
          background: colors.background,
          contrast: contrast
        });
      }
    }
    
    return suggestions.length > 0 ? suggestions[0] : null;
  }
  
  /**
   * Generate keyboard navigation instructions
   * @param {string} componentType - Type of component
   * @returns {Object} Navigation instructions
   */
  generateKeyboardInstructions(componentType) {
    const instructions = {
      general: [
        'Use Tab to navigate forward',
        'Use Shift+Tab to navigate backward',
        'Use Enter to activate buttons and links',
        'Use Space to select checkboxes and toggle buttons',
        'Use Escape to close dialogs and menus'
      ]
    };
    
    switch (componentType) {
      case 'table':
        instructions.specific = [
          'Use arrow keys to navigate between cells',
          'Use Home/End to go to first/last column',
          'Use Page Up/Page Down to scroll through rows',
          'Use Enter to sort columns (if sortable)'
        ];
        break;
        
      case 'menu':
        instructions.specific = [
          'Use arrow keys to navigate menu items',
          'Use Enter to select menu item',
          'Use Escape to close menu',
          'Use first letter to jump to item'
        ];
        break;
        
      case 'tabs':
        instructions.specific = [
          'Use arrow keys to navigate between tabs',
          'Use Enter or Space to activate tab',
          'Use Home/End to go to first/last tab'
        ];
        break;
        
      case 'form':
        instructions.specific = [
          'Use Tab to move between form fields',
          'Use arrow keys in radio button groups',
          'Use Space to toggle checkboxes',
          'Use Enter to submit form'
        ];
        break;
    }
    
    return instructions;
  }
  
  /**
   * Create accessible announcement
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level ('polite', 'assertive')
   * @param {Object} context - Additional context
   * @returns {Object} Announcement configuration
   */
  createAnnouncement(message, priority = 'polite', context = {}) {
    try {
      const announcement = {
        id: `announcement-${Date.now()}`,
        message: message,
        priority: priority,
        timestamp: new Date().toISOString(),
        context: context,
        spoken: false
      };
      
      this.announcements.push(announcement);
      
      // Clean up old announcements
      if (this.announcements.length > 10) {
        this.announcements = this.announcements.slice(-5);
      }
      
      return {
        id: announcement.id,
        ariaLive: priority,
        text: message,
        element: this.createLiveRegionElement(announcement)
      };
    } catch (error) {
      console.error('Error creating announcement:', error);
      return null;
    }
  }
  
  /**
   * Create live region element for screen readers
   */
  createLiveRegionElement(announcement) {
    return {
      tag: 'div',
      attributes: {
        'id': announcement.id,
        'aria-live': announcement.priority,
        'aria-atomic': 'true',
        'class': 'sr-only'
      },
      content: announcement.message
    };
  }
  
  /**
   * Validate form accessibility
   * @param {Object} formConfig - Form configuration
   * @returns {Object} Accessibility validation result
   */
  validateFormAccessibility(formConfig) {
    try {
      const issues = [];
      const warnings = [];
      const suggestions = [];
      
      // Check form-level accessibility
      if (!formConfig.title && !formConfig.ariaLabel) {
        issues.push('Form must have a title or aria-label');
      }
      
      if (!formConfig.id) {
        warnings.push('Form should have a unique ID');
      }
      
      // Check field-level accessibility
      if (formConfig.fields) {
        formConfig.fields.forEach((field, index) => {
          const fieldIssues = this.validateFieldAccessibility(field, index);
          issues.push(...fieldIssues.issues);
          warnings.push(...fieldIssues.warnings);
          suggestions.push(...fieldIssues.suggestions);
        });
      }
      
      // Check error handling
      if (!formConfig.errorSummary) {
        suggestions.push('Consider adding error summary for better accessibility');
      }
      
      return {
        isAccessible: issues.length === 0,
        issues: issues,
        warnings: warnings,
        suggestions: suggestions,
        score: this.calculateAccessibilityScore(issues, warnings)
      };
    } catch (error) {
      console.error('Form accessibility validation error:', error);
      return {
        isAccessible: false,
        issues: ['Validation error occurred'],
        warnings: [],
        suggestions: [],
        score: 0
      };
    }
  }
  
  /**
   * Validate individual field accessibility
   */
  validateFieldAccessibility(field, index) {
    const issues = [];
    const warnings = [];
    const suggestions = [];
    
    // Label requirements
    if (!field.label && !field.ariaLabel && !field.ariaLabelledBy) {
      issues.push(`Field ${index + 1}: Must have a label, aria-label, or aria-labelledby`);
    }
    
    // ID requirements
    if (!field.id) {
      warnings.push(`Field ${index + 1}: Should have a unique ID`);
    }
    
    // Required field indication
    if (field.required && !field.ariaRequired) {
      warnings.push(`Field ${index + 1}: Required fields should have aria-required="true"`);
    }
    
    // Error handling
    if (field.hasError && !field.ariaDescribedBy) {
      issues.push(`Field ${index + 1}: Error fields must be described by error message`);
    }
    
    // Input type validation
    if (field.type === 'password' && !field.passwordHelp) {
      suggestions.push(`Field ${index + 1}: Password fields should include format requirements`);
    }
    
    if (field.type === 'email' && !field.autocomplete) {
      suggestions.push(`Field ${index + 1}: Email fields should include autocomplete="email"`);
    }
    
    return { issues, warnings, suggestions };
  }
  
  /**
   * Calculate accessibility score
   */
  calculateAccessibilityScore(issues, warnings) {
    const baseScore = 100;
    const issueDeduction = issues.length * 20;
    const warningDeduction = warnings.length * 5;
    
    return Math.max(0, baseScore - issueDeduction - warningDeduction);
  }
  
  /**
   * Generate accessibility report
   * @param {Object} pageConfig - Page configuration to analyze
   * @returns {Object} Comprehensive accessibility report
   */
  generateAccessibilityReport(pageConfig) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        wcagLevel: this.wcagLevel,
        overallScore: 0,
        sections: {}
      };
      
      // Analyze different page sections
      const sections = ['navigation', 'main', 'forms', 'tables', 'media', 'interactions'];
      
      sections.forEach(section => {
        if (pageConfig[section]) {
          report.sections[section] = this.analyzeSectionAccessibility(section, pageConfig[section]);
        }
      });
      
      // Calculate overall score
      const sectionScores = Object.values(report.sections).map(s => s.score);
      report.overallScore = sectionScores.length > 0 ? 
        Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length) : 0;
      
      // Generate recommendations
      report.recommendations = this.generateAccessibilityRecommendations(report);
      
      return report;
    } catch (error) {
      console.error('Error generating accessibility report:', error);
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to generate report',
        overallScore: 0,
        sections: {},
        recommendations: []
      };
    }
  }
  
  /**
   * Analyze section accessibility
   */
  analyzeSectionAccessibility(sectionType, sectionConfig) {
    const analysis = {
      type: sectionType,
      score: 100,
      issues: [],
      warnings: [],
      suggestions: []
    };
    
    switch (sectionType) {
      case 'navigation':
        if (!sectionConfig.role || sectionConfig.role !== 'navigation') {
          analysis.issues.push('Navigation must have role="navigation"');
          analysis.score -= 20;
        }
        
        if (!sectionConfig.ariaLabel) {
          analysis.warnings.push('Navigation should have descriptive aria-label');
          analysis.score -= 5;
        }
        break;
        
      case 'forms':
        const formValidation = this.validateFormAccessibility(sectionConfig);
        analysis.issues.push(...formValidation.issues);
        analysis.warnings.push(...formValidation.warnings);
        analysis.suggestions.push(...formValidation.suggestions);
        analysis.score = formValidation.score;
        break;
        
      case 'tables':
        if (!sectionConfig.caption && !sectionConfig.ariaLabel) {
          analysis.issues.push('Tables must have caption or aria-label');
          analysis.score -= 20;
        }
        
        if (!sectionConfig.headers) {
          analysis.issues.push('Tables must have proper header structure');
          analysis.score -= 15;
        }
        break;
    }
    
    return analysis;
  }
  
  /**
   * Generate accessibility recommendations
   */
  generateAccessibilityRecommendations(report) {
    const recommendations = [];
    
    // Based on overall score
    if (report.overallScore < 80) {
      recommendations.push({
        priority: 'high',
        category: 'general',
        title: 'Improve Overall Accessibility',
        description: 'Your page has significant accessibility issues that need immediate attention.',
        action: 'Review and fix critical issues identified in each section.'
      });
    }
    
    // Based on specific issues
    Object.values(report.sections).forEach(section => {
      if (section.issues.length > 0) {
        recommendations.push({
          priority: 'high',
          category: section.type,
          title: `Fix ${section.type} Issues`,
          description: `Critical accessibility issues found in ${section.type} section.`,
          action: section.issues.join('; ')
        });
      }
    });
    
    return recommendations;
  }
  
  /**
   * Enable high contrast mode
   */
  enableHighContrastMode() {
    try {
      this.isHighContrastMode = true;
      
      const announcement = this.createAnnouncement(
        'High contrast mode enabled',
        'polite',
        { feature: 'highContrast', state: 'enabled' }
      );
      
      return {
        success: true,
        styles: this.colorContrasts.colorPairs.highContrast,
        announcement: announcement
      };
    } catch (error) {
      console.error('Error enabling high contrast mode:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Enable large text mode
   */
  enableLargeTextMode() {
    try {
      this.isLargeTextMode = true;
      
      const announcement = this.createAnnouncement(
        'Large text mode enabled',
        'polite',
        { feature: 'largeText', state: 'enabled' }
      );
      
      return {
        success: true,
        styles: {
          fontSize: '1.25em',
          lineHeight: '1.6'
        },
        announcement: announcement
      };
    } catch (error) {
      console.error('Error enabling large text mode:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Enable reduced motion mode
   */
  enableReducedMotionMode() {
    try {
      this.isReducedMotionMode = true;
      
      const announcement = this.createAnnouncement(
        'Reduced motion mode enabled',
        'polite',
        { feature: 'reducedMotion', state: 'enabled' }
      );
      
      return {
        success: true,
        styles: {
          animation: 'none',
          transition: 'none'
        },
        announcement: announcement
      };
    } catch (error) {
      console.error('Error enabling reduced motion mode:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get accessibility status
   * @returns {Object} Current accessibility settings
   */
  getAccessibilityStatus() {
    return {
      wcagLevel: this.wcagLevel,
      features: {
        highContrast: this.isHighContrastMode,
        largeText: this.isLargeTextMode,
        reducedMotion: this.isReducedMotionMode
      },
      announcements: this.announcements.length,
      lastReport: null // Would store last report timestamp
    };
  }
  
  /**
   * Static methods for easy access
   */
  static validateColorContrast(foreground, background, textSize) {
    const manager = new AccessibilityManager();
    return manager.validateColorContrast(foreground, background, textSize);
  }
  
  static generateARIALabels(elementType, context) {
    const manager = new AccessibilityManager();
    return manager.generateARIALabels(elementType, context);
  }
  
  static createAnnouncement(message, priority, context) {
    const manager = new AccessibilityManager();
    return manager.createAnnouncement(message, priority, context);
  }
  
  static validateFormAccessibility(formConfig) {
    const manager = new AccessibilityManager();
    return manager.validateFormAccessibility(formConfig);
  }
}

console.log('✅ Accessibility Manager loaded successfully');
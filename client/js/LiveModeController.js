/**
 * LiveModeController - Advanced Live Mode Client Controller
 * Manages 30-second auto-refresh, window state persistence, tab switching, and real-time updates
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * LiveModeController class for managing all Live Mode functionality
 */
class LiveModeController {
  /**
   * Create a LiveModeController instance
   */
  constructor() {
    /** @type {string} Session identifier */
    this.sessionId = null;
    
    /** @type {number} Auto-refresh interval ID */
    this.refreshIntervalId = null;
    
    /** @type {number} Timer countdown interval ID */
    this.timerIntervalId = null;
    
    /** @type {number} Seconds until next refresh */
    this.secondsUntilRefresh = 30;
    
    /** @type {string} Currently active tab */
    this.activeTab = 'dashboard';
    
    /** @type {Object} Window state for persistence */
    this.windowState = {
      width: 1200,
      height: 800,
      x: 100,
      y: 100,
      activeTab: 'dashboard'
    };
    
    /** @type {boolean} Auto-refresh enabled flag */
    this.autoRefreshEnabled = true;
    
    /** @type {number} Refresh failure count */
    this.refreshFailures = 0;
    
    /** @type {number} Maximum refresh failures before stopping */
    this.maxRefreshFailures = 3;
    
    /** @type {Object} Last dashboard data cache */
    this.lastDashboardData = null;
    
    /** @type {boolean} Initialization state */
    this.isInitialized = false;
    
    /** @type {Object} Form validation state */
    this.formValidation = {
      isValid: false,
      errors: {}
    };
    
    console.log('🚀 LiveModeController created');
  }

  /**
   * Initialize Live Mode with window state restoration
   * @param {Object} options - Initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      console.log('🔄 Initializing Live Mode...');
      
      // Restore window state from localStorage
      this._restoreWindowState();
      
      // Initialize session with server
      const sessionResult = await this._initializeSession();
      if (!sessionResult.success) {
        throw new Error(sessionResult.message || 'Failed to initialize session');
      }
      
      this.sessionId = sessionResult.sessionId;
      console.log(`✅ Session initialized: ${this.sessionId}`);
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Start auto-refresh timer
      this._startAutoRefresh();
      
      // Load initial data
      await this._refreshDashboard();
      
      // Setup form validation
      this._setupFormValidation();
      
      // Setup responsive design handlers
      this._setupResponsiveHandlers();
      
      this.isInitialized = true;
      console.log('✅ Live Mode initialized successfully');
      
    } catch (error) {
      console.error('❌ Live Mode initialization failed:', error);
      this._showError('Live Mode initialization failed: ' + error.message);
      throw error;
    }
  }

  /**
   * Switch between Dashboard and Add New Case tabs
   * @param {string} tabName - Tab to switch to
   * @param {Element} buttonElement - Tab button element
   */
  switchTab(tabName, buttonElement) {
    try {
      console.log(`📱 Switching to tab: ${tabName}`);
      
      // Check if we're in browser environment
      if (typeof document === 'undefined') {
        console.warn('switchTab called in non-browser environment');
        return;
      }
      
      // Validate tab name
      if (!['dashboard', 'add-case'].includes(tabName)) {
        throw new Error(`Invalid tab name: ${tabName}`);
      }
      
      // Update active tab state
      this.activeTab = tabName;
      this.windowState.activeTab = tabName;
      
      // Hide all tab contents
      const tabs = document.querySelectorAll('.tab-content');
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // Remove active class from all tab buttons
      const buttons = document.querySelectorAll('.simple-tab');
      buttons.forEach(button => button.classList.remove('active'));
      
      // Show selected tab
      const targetTab = document.getElementById(tabName);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      
      // Add active class to clicked button
      if (buttonElement) {
        buttonElement.classList.add('active');
      }
      
      // Update window state on server
      this._updateWindowState();
      
      // Refresh data if switching to dashboard
      if (tabName === 'dashboard') {
        this._refreshDashboard();
      }
      
      // Focus on first input if switching to add-case
      if (tabName === 'add-case') {
        setTimeout(() => {
          const firstInput = document.querySelector('#add-case input, #add-case select');
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Tab switch failed:', error);
      this._showError('Failed to switch tabs: ' + error.message);
    }
  }

  /**
   * Handle form submission for new case creation
   * @param {Event} event - Form submit event
   * @returns {Promise<boolean>}
   */
  async handleFormSubmit(event) {
    try {
      event.preventDefault();
      console.log('📋 Form submitted');
      
      const form = event.target;
      const formData = new FormData(form);
      const caseData = {};
      
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        caseData[key] = value;
      }
      
      // Validate form data
      const validation = this._validateCaseData(caseData);
      if (!validation.isValid) {
        this._showFormErrors(validation.errors);
        return false;
      }
      
      // Show loading state
      this._showFormLoading(true);
      
      // Create case via server API
      const result = await this._createCase(caseData);
      
      if (result.success) {
        this._showFormSuccess('Case created successfully!');
        form.reset();
        
        // Refresh dashboard data
        await this._refreshDashboard();
        
        // Switch to dashboard tab to show new case
        setTimeout(() => {
          this.switchTab('dashboard', document.querySelector('.simple-tab'));
        }, 1500);
        
      } else {
        this._showFormErrors({ general: result.message || 'Failed to create case' });
      }
      
      return result.success;
      
    } catch (error) {
      console.error('❌ Form submission failed:', error);
      this._showFormErrors({ general: 'An unexpected error occurred' });
      return false;
    } finally {
      this._showFormLoading(false);
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    try {
      const form = document.getElementById('newCaseForm');
      if (form) {
        form.reset();
        
        // Set default values
        const today = new Date();
        const dateField = document.getElementById('caseOpenDate');
        const timeField = document.getElementById('caseOpenTime');
        
        if (dateField) {
          dateField.value = today.toISOString().split('T')[0];
        }
        
        if (timeField) {
          timeField.value = today.toTimeString().split(' ')[0];
        }
      }
      
      // Clear messages
      this._clearFormMessages();
      
      console.log('📋 Form reset successfully');
      
    } catch (error) {
      console.error('❌ Form reset failed:', error);
    }
  }

  /**
   * Toggle auto-refresh on/off
   */
  toggleAutoRefresh() {
    try {
      this.autoRefreshEnabled = !this.autoRefreshEnabled;
      
      if (this.autoRefreshEnabled) {
        this._startAutoRefresh();
        console.log('⏰ Auto-refresh enabled');
      } else {
        this._stopAutoRefresh();
        console.log('⏸️ Auto-refresh disabled');
      }
      
      // Update UI indicator
      this._updateRefreshIndicator();
      
    } catch (error) {
      console.error('❌ Toggle auto-refresh failed:', error);
    }
  }

  /**
   * Manually refresh dashboard data
   * @returns {Promise<void>}
   */
  async manualRefresh() {
    try {
      console.log('🔄 Manual refresh triggered');
      
      // Reset refresh timer
      this.secondsUntilRefresh = 30;
      
      // Refresh data
      await this._refreshDashboard();
      
      // Restart auto-refresh timer
      if (this.autoRefreshEnabled) {
        this._startAutoRefresh();
      }
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      this._showError('Manual refresh failed: ' + error.message);
    }
  }

  /**
   * Close Live Mode and cleanup
   */
  async closeLiveMode() {
    try {
      console.log('🔚 Closing Live Mode...');
      
      // Stop all timers
      this._stopAutoRefresh();
      this._stopTimer();
      
      // Save window state
      this._saveWindowState();
      
      // Close session on server
      if (this.sessionId) {
        await this._closeSession();
      }
      
      // Close window
      window.close();
      
    } catch (error) {
      console.error('❌ Close Live Mode failed:', error);
      // Force close even if cleanup fails
      window.close();
    }
  }

  /**
   * Initialize session with server
   * @private
   * @returns {Promise<Object>}
   */
  async _initializeSession() {
    try {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .initializeLiveMode(this.windowState);
      });
    } catch (error) {
      console.error('❌ Session initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup all event listeners
   * @private
   */
  _setupEventListeners() {
    try {
      // Close button
      const closeButton = document.getElementById('closeButton');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.closeLiveMode());
      }
      
      // Window resize handler
      window.addEventListener('resize', () => this._handleWindowResize());
      
      // Window beforeunload handler
      window.addEventListener('beforeunload', () => this._saveWindowState());
      
      // Form submit handler
      const form = document.getElementById('newCaseForm');
      if (form) {
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
      }
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => this._handleKeyboard(e));
      
      // Visibility change handler (pause when tab is hidden)
      document.addEventListener('visibilitychange', () => this._handleVisibilityChange());
      
      console.log('🎯 Event listeners set up');
      
    } catch (error) {
      console.error('❌ Event listener setup failed:', error);
    }
  }

  /**
   * Start auto-refresh timer
   * @private
   */
  _startAutoRefresh() {
    try {
      // Clear existing timers
      this._stopAutoRefresh();
      this._stopTimer();
      
      if (!this.autoRefreshEnabled) return;
      
      // PERFORMANCE OPTIMIZATION: Intelligent refresh strategy
      // Light refresh every 30 seconds (change detection only)
      this.lightRefreshIntervalId = setInterval(async () => {
        await this._lightRefreshCheck();
      }, 30000);
      
      // Full refresh every 3 minutes (complete data reload)
      this.fullRefreshIntervalId = setInterval(async () => {
        await this._fullRefreshDashboard();
      }, 180000);
      
      // Start countdown timer for light refresh
      this.secondsUntilLightRefresh = 30;
      this.timerIntervalId = setInterval(() => {
        this.secondsUntilLightRefresh--;
        this._updateTimerDisplay();
        
        if (this.secondsUntilLightRefresh <= 0) {
          this.secondsUntilLightRefresh = 30;
        }
      }, 1000);
      
      // Initialize change detection
      this.lastChangeTimestamp = Date.now();
      this.changeDetectionCache = new Map();
      
      console.log('⏰ Auto-refresh started (30s interval)');
      
    } catch (error) {
      console.error('❌ Auto-refresh start failed:', error);
    }
  }

  /**
   * Stop auto-refresh timer
   * @private
   */
  _stopAutoRefresh() {
    // PERFORMANCE OPTIMIZATION: Clear both light and full refresh intervals
    if (this.lightRefreshIntervalId) {
      clearInterval(this.lightRefreshIntervalId);
      this.lightRefreshIntervalId = null;
    }
    
    if (this.fullRefreshIntervalId) {
      clearInterval(this.fullRefreshIntervalId);
      this.fullRefreshIntervalId = null;
    }
    
    // Legacy support
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  /**
   * Stop countdown timer
   * @private
   */
  _stopTimer() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  /**
   * Update timer display
   * @private
   */
  _updateTimerDisplay() {
    const timerElement = document.getElementById('refreshTimer');
    if (timerElement) {
      timerElement.textContent = `${this.secondsUntilRefresh}s`;
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION: Light refresh - only check for changes
   * @private
   * @returns {Promise<void>}
   */
  async _lightRefreshCheck() {
    try {
      if (!this.sessionId) {
        throw new Error('No active session');
      }
      
      console.log('🔍 Light refresh - checking for changes...');
      
      // Get lightweight change detection data
      const result = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getChangeDetectionData(this.sessionId, this.lastChangeTimestamp);
      });
      
      if (result.success && result.hasChanges) {
        console.log('🔄 Changes detected - triggering full refresh');
        await this._fullRefreshDashboard();
        this.lastChangeTimestamp = Date.now();
      } else {
        console.log('✅ No changes detected');
      }
      
    } catch (error) {
      console.warn('⚠️ Light refresh failed, will retry:', error);
      // Fallback to full refresh on error
      await this._fullRefreshDashboard();
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION: Full refresh - complete data reload
   * @private
   * @returns {Promise<void>}
   */
  async _fullRefreshDashboard() {
    try {
      if (!this.sessionId) {
        throw new Error('No active session');
      }
      
      console.log('🔄 Full dashboard refresh...');
      
      const result = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getLiveDashboard(this.sessionId);
      });
      
      if (result.success) {
        this._updateDashboardUI(result.data);
        this.lastDashboardData = result.data;
        this.lastChangeTimestamp = Date.now();
        this.refreshFailures = 0;
        console.log('✅ Full dashboard refresh completed');
      } else {
        throw new Error(result.message || 'Failed to get dashboard data');
      }
      
    } catch (error) {
      console.error('❌ Full dashboard refresh failed:', error);
      this.refreshFailures++;
      
      if (this.refreshFailures >= 3) {
        console.error('❌ Multiple refresh failures, stopping auto-refresh');
        this.stopAutoRefresh();
        this._showConnectionError();
      }
    }
  }

  /**
   * Legacy refresh method for backward compatibility
   * @private
   * @returns {Promise<void>}
   */
  async _refreshDashboard() {
    return this._fullRefreshDashboard();
  }

  /**
   * Update dashboard UI with new data
   * @private
   * @param {Object} data - Dashboard data
   */
  _updateDashboardUI(data) {
    try {
      // Update statistics cards
      this._updateStatCard('myCases', data.summary.myCases, 'My Cases', 'Active assignments');
      this._updateStatCard('openCases', data.summary.openCases, 'Open Cases', 'Currently in progress');
      this._updateStatCard('closedToday', data.summary.closedToday, 'Closed Today', 'Daily progress');
      this._updateStatCard('avgResponseTime', data.summary.avgResponseTime + 'h', 'Avg Response Time', 'Last 7 days');
      
      // Update urgent cases
      this._updateUrgentCases(data.sheetData);
      
      // Update recent activity
      this._updateRecentActivity(data.recentActivity);
      
      // Update sheet summary
      this._updateSheetSummary(data.sheetData);
      
      console.log('📊 Dashboard UI updated');
      
    } catch (error) {
      console.error('❌ Dashboard UI update failed:', error);
    }
  }

  /**
   * Update individual stat card
   * @private
   * @param {string} cardId - Card identifier
   * @param {string|number} value - Stat value
   * @param {string} label - Stat label
   * @param {string} change - Change description
   */
  _updateStatCard(cardId, value, label, change) {
    const cards = document.querySelectorAll('.stat-card');
    const cardIndex = { myCases: 0, openCases: 1, closedToday: 2, avgResponseTime: 3 }[cardId];
    
    if (cards[cardIndex]) {
      const valueEl = cards[cardIndex].querySelector('.stat-value');
      const labelEl = cards[cardIndex].querySelector('.stat-label');
      const changeEl = cards[cardIndex].querySelector('.stat-change');
      
      if (valueEl) valueEl.textContent = value;
      if (labelEl) labelEl.textContent = label;
      if (changeEl) changeEl.textContent = change;
    }
  }

  /**
   * Update urgent cases section
   * @private
   * @param {Object} sheetData - Sheet data object
   */
  _updateUrgentCases(sheetData) {
    const urgentSection = document.querySelector('.urgent-cases');
    if (!urgentSection) return;
    
    let urgentCases = [];
    Object.values(sheetData).forEach(sheet => {
      if (sheet.urgentCases) {
        urgentCases.push(...sheet.urgentCases);
      }
    });
    
    // Update count in title
    const title = urgentSection.querySelector('.section-title');
    if (title) {
      title.innerHTML = `<i class="material-icons">warning</i> Urgent Cases (${urgentCases.length})`;
    }
    
    // Update case items
    const existingItems = urgentSection.querySelectorAll('.case-item');
    existingItems.forEach(item => item.remove());
    
    urgentCases.slice(0, 5).forEach(caseData => {
      const caseItem = document.createElement('div');
      caseItem.className = 'case-item';
      caseItem.innerHTML = `
        <div class="case-id">${this._escapeHtml(caseData.caseId || 'N/A')}</div>
        <div class="case-details">
          Status: ${this._escapeHtml(caseData.caseStatus || 'Unknown')} | 
          Sheet: ${this._escapeHtml(caseData.sheetType || 'Unknown')} | 
          Open: ${this._escapeHtml(caseData.caseOpenDate || 'Unknown')}
        </div>
      `;
      urgentSection.appendChild(caseItem);
    });
  }

  /**
   * Update recent activity section
   * @private
   * @param {Array} activities - Recent activities
   */
  _updateRecentActivity(activities) {
    const activitySection = document.querySelector('.activity-section');
    if (!activitySection) return;
    
    const existingItems = activitySection.querySelectorAll('.activity-item');
    existingItems.forEach(item => item.remove());
    
    activities.slice(0, 5).forEach(activity => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      
      const icon = activity.type === 'case_opened' ? 'add_circle' : 'check_circle';
      const timeAgo = this._getTimeAgo(activity.timestamp);
      
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="material-icons">${icon}</i>
        </div>
        <div class="activity-content">
          <div class="activity-text">${this._escapeHtml(activity.description)}</div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      `;
      
      activitySection.appendChild(activityItem);
    });
  }

  /**
   * Update sheet summary section
   * @private
   * @param {Object} sheetData - Sheet data object
   */
  _updateSheetSummary(sheetData) {
    const summarySection = document.querySelector('.activity-section:last-child');
    if (!summarySection) return;
    
    const existingItems = summarySection.querySelectorAll('.activity-item');
    existingItems.forEach(item => item.remove());
    
    Object.entries(sheetData).forEach(([sheetType, data]) => {
      const summaryItem = document.createElement('div');
      summaryItem.className = 'activity-item';
      summaryItem.innerHTML = `
        <div class="activity-icon">
          <i class="material-icons">table_chart</i>
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${this._escapeHtml(sheetType)}</strong>: 
            ${data.totalCases} total, ${data.openCases} open, ${data.closedToday} closed today
          </div>
          <div class="activity-time">${data.urgentCases?.length || 0} urgent cases</div>
        </div>
      `;
      summarySection.appendChild(summaryItem);
    });
  }

  /**
   * Create new case via server API
   * @private
   * @param {Object} caseData - Case data
   * @returns {Promise<Object>}
   */
  async _createCase(caseData) {
    try {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .createCase(caseData.sheetType, caseData);
      });
    } catch (error) {
      console.error('❌ Case creation failed:', error);
      throw error;
    }
  }

  /**
   * Validate case data
   * @private
   * @param {Object} caseData - Case data to validate
   * @returns {Object} Validation result
   */
  _validateCaseData(caseData) {
    const errors = {};
    const requiredFields = ['sheetType', 'caseId', 'caseOpenDate', 'caseOpenTime', 'incomingSegment', 'productCategory', 'firstAssignee'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!caseData[field] || caseData[field].trim() === '') {
        errors[field] = `${field} is required`;
      }
    });
    
    // Validate email format
    if (caseData.firstAssignee && !this._isValidEmail(caseData.firstAssignee)) {
      errors.firstAssignee = 'Please enter a valid email address';
    }
    
    // Validate date format
    if (caseData.caseOpenDate && !this._isValidDate(caseData.caseOpenDate)) {
      errors.caseOpenDate = 'Please enter a valid date';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Show form validation errors
   * @private
   * @param {Object} errors - Validation errors
   */
  _showFormErrors(errors) {
    const messageContainer = document.getElementById('addCaseMessages');
    if (!messageContainer) return;
    
    const errorMessages = Object.values(errors).join(', ');
    messageContainer.innerHTML = `<div class="error-message">${this._escapeHtml(errorMessages)}</div>`;
    
    // Scroll to errors
    messageContainer.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Show form success message
   * @private
   * @param {string} message - Success message
   */
  _showFormSuccess(message) {
    const messageContainer = document.getElementById('addCaseMessages');
    if (!messageContainer) return;
    
    messageContainer.innerHTML = `<div class="success-message">${this._escapeHtml(message)}</div>`;
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      this._clearFormMessages();
    }, 3000);
  }

  /**
   * Show/hide form loading state
   * @private
   * @param {boolean} loading - Loading state
   */
  _showFormLoading(loading) {
    const submitButton = document.querySelector('#newCaseForm button[type="submit"]');
    if (submitButton) {
      if (loading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Case';
      }
    }
  }

  /**
   * Clear form messages
   * @private
   */
  _clearFormMessages() {
    const messageContainer = document.getElementById('addCaseMessages');
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }
  }

  /**
   * Setup form validation
   * @private
   */
  _setupFormValidation() {
    const form = document.getElementById('newCaseForm');
    if (!form) return;
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this._validateField(input);
      });
      
      input.addEventListener('input', () => {
        this._clearFieldError(input);
      });
    });
    
    console.log('📝 Form validation set up');
  }

  /**
   * Validate individual form field
   * @private
   * @param {Element} field - Form field to validate
   */
  _validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
      this._showFieldError(field, 'This field is required');
      return false;
    }
    
    if (field.type === 'email' && value && !this._isValidEmail(value)) {
      this._showFieldError(field, 'Please enter a valid email address');
      return false;
    }
    
    this._clearFieldError(field);
    return true;
  }

  /**
   * Show field-specific error
   * @private
   * @param {Element} field - Form field
   * @param {string} message - Error message
   */
  _showFieldError(field, message) {
    field.style.borderColor = '#f44336';
    
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#f44336';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '4px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
  }

  /**
   * Clear field-specific error
   * @private
   * @param {Element} field - Form field
   */
  _clearFieldError(field) {
    field.style.borderColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Setup responsive design handlers
   * @private
   */
  _setupResponsiveHandlers() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResponsive = (e) => {
      if (e.matches) {
        // Mobile view
        document.body.classList.add('mobile-view');
        this._adjustMobileLayout();
      } else {
        // Desktop view
        document.body.classList.remove('mobile-view');
        this._adjustDesktopLayout();
      }
    };
    
    mediaQuery.addListener(handleResponsive);
    handleResponsive(mediaQuery);
    
    console.log('📱 Responsive handlers set up');
  }

  /**
   * Adjust layout for mobile
   * @private
   */
  _adjustMobileLayout() {
    // Reduce refresh interval on mobile to save battery
    if (this.autoRefreshEnabled) {
      this._stopAutoRefresh();
      
      this.refreshIntervalId = setInterval(async () => {
        await this._refreshDashboard();
      }, 60000); // 60 seconds on mobile
    }
  }

  /**
   * Adjust layout for desktop
   * @private
   */
  _adjustDesktopLayout() {
    // Restore normal refresh interval on desktop
    if (this.autoRefreshEnabled) {
      this._startAutoRefresh();
    }
  }

  /**
   * Handle window resize
   * @private
   */
  _handleWindowResize() {
    this.windowState.width = window.innerWidth;
    this.windowState.height = window.innerHeight;
    this._updateWindowState();
  }

  /**
   * Handle keyboard shortcuts
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  _handleKeyboard(e) {
    // Ctrl/Cmd + R: Manual refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      this.manualRefresh();
    }
    
    // Ctrl/Cmd + 1: Switch to dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
      e.preventDefault();
      this.switchTab('dashboard', document.querySelector('.simple-tab'));
    }
    
    // Ctrl/Cmd + 2: Switch to add case
    if ((e.ctrlKey || e.metaKey) && e.key === '2') {
      e.preventDefault();
      this.switchTab('add-case', document.querySelectorAll('.simple-tab')[1]);
    }
    
    // Escape: Close Live Mode
    if (e.key === 'Escape') {
      this.closeLiveMode();
    }
  }

  /**
   * Handle visibility change (pause when tab is hidden)
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - pause auto-refresh
      this._stopAutoRefresh();
      console.log('⏸️ Auto-refresh paused (page hidden)');
    } else {
      // Page is visible - resume auto-refresh
      if (this.autoRefreshEnabled) {
        this._startAutoRefresh();
        console.log('▶️ Auto-refresh resumed (page visible)');
      }
    }
  }

  /**
   * Update window state on server
   * @private
   */
  async _updateWindowState() {
    try {
      if (!this.sessionId) return;
      
      await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .updateLiveModeWindowState(this.sessionId, this.windowState);
      });
      
      // Also save to localStorage
      this._saveWindowState();
      
    } catch (error) {
      console.warn('⚠️ Window state update failed:', error);
    }
  }

  /**
   * Save window state to localStorage
   * @private
   */
  _saveWindowState() {
    try {
      localStorage.setItem('liveModeWindowState', JSON.stringify(this.windowState));
    } catch (error) {
      console.warn('⚠️ Failed to save window state to localStorage:', error);
    }
  }

  /**
   * Restore window state from localStorage
   * @private
   */
  _restoreWindowState() {
    try {
      const saved = localStorage.getItem('liveModeWindowState');
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.windowState = { ...this.windowState, ...parsedState };
        
        // Restore active tab
        if (parsedState.activeTab) {
          this.activeTab = parsedState.activeTab;
        }
        
        console.log('💾 Window state restored from localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore window state from localStorage:', error);
    }
  }

  /**
   * Close session on server
   * @private
   */
  async _closeSession() {
    try {
      await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .closeLiveMode(this.sessionId);
      });
      console.log('✅ Session closed on server');
    } catch (error) {
      console.warn('⚠️ Failed to close session on server:', error);
    }
  }

  /**
   * Show error message
   * @private
   * @param {string} message - Error message
   */
  _showError(message) {
    // Could be enhanced with a toast notification system
    console.error('❌ Error:', message);
    alert('Error: ' + message);
  }

  /**
   * Update refresh indicator
   * @private
   */
  _updateRefreshIndicator() {
    const indicator = document.querySelector('.live-indicator');
    if (indicator) {
      if (this.autoRefreshEnabled) {
        indicator.style.opacity = '1';
      } else {
        indicator.style.opacity = '0.5';
      }
    }
  }

  /**
   * Get time ago string
   * @private
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Time ago string
   */
  _getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} Valid email
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format
   * @private
   * @param {string} date - Date to validate
   * @returns {boolean} Valid date
   */
  _isValidDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global instance and functions for HTML integration
let liveModeController = null;

/**
 * Initialize Live Mode when page loads (only in browser environment)
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async function() {
    try {
      console.log('🚀 DOM loaded, initializing Live Mode...');
      
      liveModeController = new LiveModeController();
      await liveModeController.initialize();
      
      console.log('✅ Live Mode ready!');
      
    } catch (error) {
      console.error('❌ Live Mode initialization failed:', error);
    }
  });
}

/**
 * Global function for tab switching (called from HTML)
 * @param {string} tabName - Tab name
 * @param {Element} buttonElement - Button element
 */
function showTab(tabName, buttonElement) {
  if (liveModeController) {
    liveModeController.switchTab(tabName, buttonElement);
  }
}

/**
 * Global function for form submission (called from HTML)
 * @param {Event} event - Form submit event
 * @returns {boolean} Success state
 */
function handleFormSubmit(event) {
  if (liveModeController) {
    return liveModeController.handleFormSubmit(event);
  }
  return false;
}

/**
 * Global function for form reset (called from HTML)
 */
function resetForm() {
  if (liveModeController) {
    liveModeController.resetForm();
  }
}

/**
 * Global function for manual refresh (called from HTML)
 */
function manualRefresh() {
  if (liveModeController) {
    liveModeController.manualRefresh();
  }
}

/**
 * Global function for toggling auto-refresh (called from HTML)
 */
function toggleAutoRefresh() {
  if (liveModeController) {
    liveModeController.toggleAutoRefresh();
  }
}

console.log('📁 LiveModeController.js loaded');
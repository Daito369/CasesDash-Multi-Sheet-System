/**
 * CasesDash - Configuration Management System
 * Properties Service-based configuration persistence and management
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-25
 */

/**
 * Configuration keys for Properties Service
 */
const ConfigKeys = {
  SPREADSHEET_ID: 'casesdash_spreadsheet_id',
  USER_SETTINGS: 'casesdash_user_settings',
  SYSTEM_SETTINGS: 'casesdash_system_settings',
  CACHE_SETTINGS: 'casesdash_cache_settings',
  PERFORMANCE_SETTINGS: 'casesdash_performance_settings',
  SECURITY_SETTINGS: 'casesdash_security_settings',
  NOTIFICATIONS_SETTINGS: 'casesdash_notifications_settings',
  LAST_UPDATE: 'casesdash_last_update',
  VERSION: 'casesdash_version',
  UI_SETTINGS: 'casesdash_ui_settings',
  THEME_SETTINGS: 'casesdash_theme_settings'
};

/**
 * Default configuration values
 */
const DefaultConfig = {
  system: {
    version: '1.0.0',
    timezone: 'Asia/Tokyo',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm:ss',
    language: 'en',
    theme: 'light',
    autoRefreshInterval: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
    logLevel: 'INFO'
  },
  
  cache: {
    enabled: true,
    defaultTTL: 300000, // 5 minutes
    maxEntries: 1000,
    enableMemoryCache: true,
    enablePropertiesCache: true
  },
  
  performance: {
    batchSize: 100,
    maxApiCallsPerMinute: 100,
    enableQuotaManagement: true,
    enablePerformanceMonitoring: true,
    responseTimeThreshold: 2000, // 2 seconds
    memoryThreshold: 50 // 50MB
  },
  
  security: {
    enableInputValidation: true,
    enableOutputEscaping: true,
    enableAuditLogging: true,
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 900000 // 15 minutes
  },
  
  notifications: {
    enabled: true,
    googleChatEnabled: false,
    webhookUrl: '',
    p95MonitoringEnabled: false,
    p95AlertThreshold: 2.0, // 2 hours SLA
    p95WarningThreshold: 0.9, // 90% of SLA (1.8 hours)
    duplicatePreventionTime: 3600000, // 1 hour in milliseconds
    enableBatchAlerts: true,
    enableSummaryAlerts: true,
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutMs: 10000,
    dailyTriggerHour: 9, // 9 AM daily monitoring
    teamLeaderNotifications: true,
    escalationEnabled: true
  },
  
  ui: {
    itemsPerPage: 25,
    enableInfiniteScroll: false,
    enableRealTimeUpdates: true,
    enableNotifications: true,
    materialDesignVersion: '3.0',
    enableDarkMode: false,
    theme: 'light'
  },

  themes: {
    light: {
      name: 'Light Theme',
      primary: '#1976d2',
      secondary: '#dc004e',
      surface: '#ffffff',
      background: '#fafafa',
      onPrimary: '#ffffff',
      onSecondary: '#ffffff',
      onSurface: '#000000',
      onBackground: '#000000'
    },
    dark: {
      name: 'Dark Theme',
      primary: '#90caf9',
      secondary: '#f48fb1',
      surface: '#121212',
      background: '#000000',
      onPrimary: '#000000',
      onSecondary: '#000000',
      onSurface: '#ffffff',
      onBackground: '#ffffff'
    }
  }
};

/**
 * ConfigManager class for centralized configuration management
 * Handles persistence, validation, and access control for all system settings
 */
class ConfigManager {
  
  /**
   * Initialize configuration system
   * @static
   */
  static initialize() {
    try {
      // Ensure default configurations exist
      this.ensureDefaultConfigurations();
      
      // Update version if needed
      this.updateVersionIfNeeded();
      
      // Log initialization
      console.log('ConfigManager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ConfigManager:', error);
      throw error;
    }
  }
  
  /**
   * Get spreadsheet ID
   * @static
   * @returns {string|null} Spreadsheet ID or null if not set
   */
  static getSpreadsheetId() {
    try {
      const properties = PropertiesService.getScriptProperties();
      return properties.getProperty(ConfigKeys.SPREADSHEET_ID);
    } catch (error) {
      console.error('Failed to get spreadsheet ID:', error);
      return null;
    }
  }
  
  /**
   * Set spreadsheet ID
   * @static
   * @param {string} spreadsheetId - Spreadsheet ID to set
   * @returns {boolean} True if successful
   */
  static setSpreadsheetId(spreadsheetId) {
    try {
      if (!spreadsheetId || typeof spreadsheetId !== 'string') {
        throw new Error('Invalid spreadsheet ID');
      }
      
      // Validate spreadsheet exists and is accessible
      const sheet = SpreadsheetApp.openById(spreadsheetId);
      if (!sheet) {
        throw new Error('Cannot access spreadsheet with provided ID');
      }
      
      const properties = PropertiesService.getScriptProperties();
      properties.setProperty(ConfigKeys.SPREADSHEET_ID, spreadsheetId);
      
      // Update last modified timestamp
      this.updateLastModified();
      
      console.log('Spreadsheet ID set successfully:', spreadsheetId);
      return true;
      
    } catch (error) {
      console.error('Failed to set spreadsheet ID:', error);
      return false;
    }
  }
  
  /**
   * Get user settings for current user
   * @static
   * @returns {Object} User settings object
   */
  static getUserSettings() {
    try {
      const userEmail = Session.getActiveUser().getEmail();
      const properties = PropertiesService.getUserProperties();
      const settingsJson = properties.getProperty(`${ConfigKeys.USER_SETTINGS}_${userEmail}`);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      // Return default user settings
      return this.getDefaultUserSettings();
      
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return this.getDefaultUserSettings();
    }
  }
  
  /**
   * Set user settings for current user
   * @static
   * @param {Object} settings - User settings to save
   * @returns {boolean} True if successful
   */
  static setUserSettings(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }
      
      const userEmail = Session.getActiveUser().getEmail();
      const properties = PropertiesService.getUserProperties();
      
      // Merge with existing settings
      const existingSettings = this.getUserSettings();
      const mergedSettings = { ...existingSettings, ...settings };
      
      properties.setProperty(
        `${ConfigKeys.USER_SETTINGS}_${userEmail}`,
        JSON.stringify(mergedSettings)
      );
      
      console.log('User settings saved successfully for:', userEmail);
      return true;
      
    } catch (error) {
      console.error('Failed to set user settings:', error);
      return false;
    }
  }
  
  /**
   * Get system settings
   * @static
   * @returns {Object} System settings object
   */
  static getSystemSettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.SYSTEM_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.system;
      
    } catch (error) {
      console.error('Failed to get system settings:', error);
      return DefaultConfig.system;
    }
  }
  
  /**
   * Set system settings
   * @static
   * @param {Object} settings - System settings to save
   * @returns {boolean} True if successful
   */
  static setSystemSettings(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }
      
      const properties = PropertiesService.getScriptProperties();
      const existingSettings = this.getSystemSettings();
      const mergedSettings = { ...existingSettings, ...settings };
      
      properties.setProperty(ConfigKeys.SYSTEM_SETTINGS, JSON.stringify(mergedSettings));
      this.updateLastModified();
      
      console.log('System settings saved successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to set system settings:', error);
      return false;
    }
  }
  
  /**
   * Get cache settings
   * @static
   * @returns {Object} Cache settings object
   */
  static getCacheSettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.CACHE_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.cache;
      
    } catch (error) {
      console.error('Failed to get cache settings:', error);
      return DefaultConfig.cache;
    }
  }
  
  /**
   * Get performance settings
   * @static
   * @returns {Object} Performance settings object
   */
  static getPerformanceSettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.PERFORMANCE_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.performance;
      
    } catch (error) {
      console.error('Failed to get performance settings:', error);
      return DefaultConfig.performance;
    }
  }
  
  /**
   * Get security settings
   * @static
   * @returns {Object} Security settings object
   */
  static getSecuritySettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.SECURITY_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.security;
      
    } catch (error) {
      console.error('Failed to get security settings:', error);
      return DefaultConfig.security;
    }
  }
  
  /**
   * Get notification settings
   * @static
   * @returns {Object} Notification settings object
   */
  static getNotificationSettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.NOTIFICATIONS_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.notifications;
      
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return DefaultConfig.notifications;
    }
  }

  /**
   * Get UI settings
   * @static
   * @returns {Object} UI settings object
   */
  static getUISettings() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const settingsJson = properties.getProperty(ConfigKeys.UI_SETTINGS);
      
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      return DefaultConfig.ui;
      
    } catch (error) {
      console.error('Failed to get UI settings:', error);
      return DefaultConfig.ui;
    }
  }

  /**
   * Get theme settings
   * @static
   * @param {string} themeName - Theme name (light/dark)
   * @returns {Object} Theme settings object
   */
  static getThemeSettings(themeName = 'light') {
    try {
      return DefaultConfig.themes[themeName] || DefaultConfig.themes.light;
    } catch (error) {
      console.error('Failed to get theme settings:', error);
      return DefaultConfig.themes.light;
    }
  }
  
  /**
   * Get specific configuration value
   * @static
   * @param {string} category - Configuration category (system, cache, performance, security)
   * @param {string} key - Configuration key
   * @returns {any} Configuration value
   */
  static get(category, key) {
    try {
      let settings;
      
      switch (category) {
        case 'system':
          settings = this.getSystemSettings();
          break;
        case 'cache':
          settings = this.getCacheSettings();
          break;
        case 'performance':
          settings = this.getPerformanceSettings();
          break;
        case 'security':
          settings = this.getSecuritySettings();
          break;
        case 'notifications':
          settings = this.getNotificationSettings();
          break;
        case 'user':
          settings = this.getUserSettings();
          break;
        case 'ui':
          settings = this.getUISettings();
          break;
        case 'themes':
          settings = DefaultConfig.themes;
          break;
        default:
          throw new Error(`Unknown configuration category: ${category}`);
      }
      
      return key ? settings[key] : settings;
      
    } catch (error) {
      console.error(`Failed to get config ${category}.${key}:`, error);
      return null;
    }
  }
  
  /**
   * Set user theme preference
   * @static
   * @param {string} themeName - Theme name to set
   * @returns {boolean} True if successful
   */
  static setUserTheme(themeName) {
    try {
      if (!themeName || !DefaultConfig.themes[themeName]) {
        throw new Error('Invalid theme name');
      }

      // Update user settings
      const userSettings = this.getUserSettings();
      userSettings.theme = themeName;
      userSettings.enableDarkMode = (themeName === 'dark');
      
      const success = this.setUserSettings(userSettings);
      
      if (success) {
        console.log(`User theme set to: ${themeName}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('Failed to set user theme:', error);
      return false;
    }
  }

  /**
   * Get user's current theme
   * @static
   * @returns {string} Current theme name
   */
  static getUserTheme() {
    try {
      const userSettings = this.getUserSettings();
      return userSettings.theme || 'light';
    } catch (error) {
      console.error('Failed to get user theme:', error);
      return 'light';
    }
  }

  /**
   * Toggle user theme between light and dark
   * @static
   * @returns {string} New theme name
   */
  static toggleUserTheme() {
    const currentTheme = this.getUserTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setUserTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific configuration value
   * @static
   * @param {string} category - Configuration category
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   * @returns {boolean} True if successful
   */
  static set(category, key, value) {
    try {
      const currentSettings = this.get(category);
      const updatedSettings = { ...currentSettings, [key]: value };
      
      switch (category) {
        case 'system':
          return this.setSystemSettings(updatedSettings);
        case 'user':
          return this.setUserSettings(updatedSettings);
        case 'ui':
          return this.setUISettings(updatedSettings);
        default:
          // For other categories, use generic setter
          const properties = PropertiesService.getScriptProperties();
          const configKey = ConfigKeys[category.toUpperCase() + '_SETTINGS'];
          if (configKey) {
            properties.setProperty(configKey, JSON.stringify(updatedSettings));
            this.updateLastModified();
            return true;
          }
          throw new Error(`Cannot set configuration for category: ${category}`);
      }
      
    } catch (error) {
      console.error(`Failed to set config ${category}.${key}:`, error);
      return false;
    }
  }

  /**
   * Set UI settings
   * @static
   * @param {Object} settings - UI settings to save
   * @returns {boolean} True if successful
   */
  static setUISettings(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }
      
      const properties = PropertiesService.getScriptProperties();
      properties.setProperty(ConfigKeys.UI_SETTINGS, JSON.stringify(settings));
      this.updateLastModified();
      
      console.log('UI settings saved successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to set UI settings:', error);
      return false;
    }
  }
  
  /**
   * Reset configuration to defaults
   * @static
   * @param {string} category - Category to reset (optional, resets all if not specified)
   * @returns {boolean} True if successful
   */
  static resetToDefaults(category = null) {
    try {
      const properties = PropertiesService.getScriptProperties();
      
      if (category) {
        // Reset specific category
        const configKey = ConfigKeys[category.toUpperCase() + '_SETTINGS'];
        if (configKey && DefaultConfig[category]) {
          properties.setProperty(configKey, JSON.stringify(DefaultConfig[category]));
        }
      } else {
        // Reset all categories
        Object.keys(DefaultConfig).forEach(cat => {
          const configKey = ConfigKeys[cat.toUpperCase() + '_SETTINGS'];
          if (configKey) {
            properties.setProperty(configKey, JSON.stringify(DefaultConfig[cat]));
          }
        });
      }
      
      this.updateLastModified();
      console.log(`Configuration reset to defaults: ${category || 'all'}`);
      return true;
      
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      return false;
    }
  }
  
  /**
   * Export all configurations
   * @static
   * @returns {Object} All configurations
   */
  static exportConfig() {
    try {
      return {
        system: this.getSystemSettings(),
        cache: this.getCacheSettings(),
        performance: this.getPerformanceSettings(),
        security: this.getSecuritySettings(),
        notifications: this.getNotificationSettings(),
        user: this.getUserSettings(),
        spreadsheetId: this.getSpreadsheetId(),
        lastUpdate: this.getLastUpdate(),
        version: this.getVersion()
      };
    } catch (error) {
      console.error('Failed to export configuration:', error);
      return {};
    }
  }
  
  /**
   * Get default user settings
   * @private
   * @static
   * @returns {Object} Default user settings
   */
  static getDefaultUserSettings() {
    return {
      ...DefaultConfig.ui,
      preferences: {
        defaultSheetType: 'OT Email',
        enableNotifications: true,
        autoSave: true,
        showAdvancedFeatures: false,
        theme: 'light'
      },
      lastLogin: new Date().toISOString(),
      loginCount: 0
    };
  }
  
  /**
   * Ensure default configurations exist
   * @private
   * @static
   */
  static ensureDefaultConfigurations() {
    try {
      const properties = PropertiesService.getScriptProperties();
      
      // Check and set defaults for each category
      Object.keys(DefaultConfig).forEach(category => {
        const configKey = ConfigKeys[category.toUpperCase() + '_SETTINGS'];
        if (configKey && !properties.getProperty(configKey)) {
          properties.setProperty(configKey, JSON.stringify(DefaultConfig[category]));
        }
      });
      
      // Set version if not exists
      if (!properties.getProperty(ConfigKeys.VERSION)) {
        properties.setProperty(ConfigKeys.VERSION, DefaultConfig.system.version);
      }
      
    } catch (error) {
      console.error('Failed to ensure default configurations:', error);
    }
  }
  
  /**
   * Update version if needed
   * @private
   * @static
   */
  static updateVersionIfNeeded() {
    try {
      const properties = PropertiesService.getScriptProperties();
      const currentVersion = properties.getProperty(ConfigKeys.VERSION);
      const newVersion = DefaultConfig.system.version;
      
      if (currentVersion !== newVersion) {
        properties.setProperty(ConfigKeys.VERSION, newVersion);
        this.updateLastModified();
        console.log(`Version updated from ${currentVersion} to ${newVersion}`);
      }
      
    } catch (error) {
      console.error('Failed to update version:', error);
    }
  }
  
  /**
   * Update last modified timestamp
   * @private
   * @static
   */
  static updateLastModified() {
    try {
      const properties = PropertiesService.getScriptProperties();
      properties.setProperty(ConfigKeys.LAST_UPDATE, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update last modified timestamp:', error);
    }
  }
  
  /**
   * Get last update timestamp
   * @static
   * @returns {string|null} Last update timestamp
   */
  static getLastUpdate() {
    try {
      const properties = PropertiesService.getScriptProperties();
      return properties.getProperty(ConfigKeys.LAST_UPDATE);
    } catch (error) {
      console.error('Failed to get last update:', error);
      return null;
    }
  }
  
  /**
   * Get current version
   * @static
   * @returns {string} Current version
   */
  static getVersion() {
    try {
      const properties = PropertiesService.getScriptProperties();
      return properties.getProperty(ConfigKeys.VERSION) || DefaultConfig.system.version;
    } catch (error) {
      console.error('Failed to get version:', error);
      return DefaultConfig.system.version;
    }
  }
}

/**
 * Server-side configuration functions for Google Apps Script
 * These functions are called from the client-side interface
 */

/**
 * Get system configuration for the admin interface
 * @returns {Object} Current system configuration
 */
function getSystemConfiguration() {
  try {
    console.log('Getting system configuration...');
    
    const config = {
      // Spreadsheet configuration
      spreadsheetId: ConfigManager.getSpreadsheetId(),
      
      // System settings
      timezone: ConfigManager.getSystemSetting('timezone'),
      language: ConfigManager.getSystemSetting('language'),
      autoRefresh: ConfigManager.getSystemSetting('autoRefreshInterval') > 0,
      refreshInterval: Math.floor((ConfigManager.getSystemSetting('autoRefreshInterval') || 30000) / 1000),
      
      // Notification settings
      emailNotifications: ConfigManager.getNotificationSetting('enabled'),
      desktopNotifications: ConfigManager.getUISetting('enableNotifications'),
      notificationEmail: ConfigManager.getNotificationSetting('webhookUrl') ? 
        extractEmailFromWebhook(ConfigManager.getNotificationSetting('webhookUrl')) : '',
      
      // Metadata
      version: ConfigManager.getVersion(),
      lastUpdate: ConfigManager.getLastUpdate()
    };
    
    console.log('System configuration retrieved successfully');
    return config;
    
  } catch (error) {
    console.error('Failed to get system configuration:', error);
    throw new Error(`Failed to retrieve configuration: ${error.message}`);
  }
}

/**
 * Save system configuration from the admin interface
 * @param {Object} configData - Configuration data to save
 * @returns {Object} Save result
 */
function saveSystemConfiguration(configData) {
  try {
    console.log('Saving system configuration...');
    
    if (!configData) {
      throw new Error('Configuration data is required');
    }
    
    // Validate required fields
    if (!configData.spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Validate spreadsheet access before saving
    const validationResult = validateSpreadsheet(configData.spreadsheetId);
    if (!validationResult.success) {
      throw new Error(`Invalid spreadsheet: ${validationResult.message}`);
    }
    
    // Save spreadsheet configuration
    ConfigManager.setSpreadsheetId(configData.spreadsheetId);
    
    // Save system settings
    if (configData.timezone) {
      ConfigManager.setSystemSetting('timezone', configData.timezone);
    }
    if (configData.language) {
      ConfigManager.setSystemSetting('language', configData.language);
    }
    if (typeof configData.autoRefresh === 'boolean') {
      const intervalMs = configData.autoRefresh ? 
        (configData.refreshInterval || 30) * 1000 : 0;
      ConfigManager.setSystemSetting('autoRefreshInterval', intervalMs);
    }
    
    // Save notification settings
    if (typeof configData.emailNotifications === 'boolean') {
      ConfigManager.setNotificationSetting('enabled', configData.emailNotifications);
    }
    if (typeof configData.desktopNotifications === 'boolean') {
      ConfigManager.setUISetting('enableNotifications', configData.desktopNotifications);
    }
    if (configData.notificationEmail) {
      // Convert email to webhook URL format if needed
      const webhookUrl = configData.notificationEmail.includes('@') ? 
        `mailto:${configData.notificationEmail}` : configData.notificationEmail;
      ConfigManager.setNotificationSetting('webhookUrl', webhookUrl);
    }
    
    // Update version and timestamp
    ConfigManager.updateVersion('1.0.0');
    
    console.log('System configuration saved successfully');
    
    return {
      success: true,
      message: 'Configuration saved successfully',
      spreadsheetId: configData.spreadsheetId
    };
    
  } catch (error) {
    console.error('Failed to save system configuration:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Validate spreadsheet access and required sheets
 * @param {string} spreadsheetId - Spreadsheet ID to validate
 * @returns {Object} Validation result
 */
function validateSpreadsheet(spreadsheetId) {
  try {
    console.log(`Validating spreadsheet: ${spreadsheetId}`);
    
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    // Try to open the spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      console.error('Failed to open spreadsheet:', error);
      throw new Error('Cannot access spreadsheet. Please check the ID and permissions.');
    }
    
    // Get all sheet names
    const sheets = spreadsheet.getSheets();
    const existingSheets = sheets.map(sheet => sheet.getName());
    
    console.log('Found sheets:', existingSheets);
    
    // Required sheets for CasesDash
    const requiredSheets = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
    
    // Check which required sheets are missing
    const missingSheets = requiredSheets.filter(required => 
      !existingSheets.includes(required)
    );
    
    // Check which required sheets exist
    const foundSheets = requiredSheets.filter(required => 
      existingSheets.includes(required)
    );
    
    const isValid = missingSheets.length === 0;
    
    const result = {
      success: isValid,
      spreadsheetId: spreadsheetId,
      spreadsheetName: spreadsheet.getName(),
      existingSheets: foundSheets,
      missingSheets: missingSheets,
      allSheets: existingSheets,
      message: isValid ? 
        'All required sheets found' : 
        `Missing required sheets: ${missingSheets.join(', ')}`
    };
    
    console.log('Spreadsheet validation result:', result);
    return result;
    
  } catch (error) {
    console.error('Spreadsheet validation failed:', error);
    return {
      success: false,
      message: error.message,
      existingSheets: [],
      missingSheets: ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone']
    };
  }
}

/**
 * Configure spreadsheet (used by setup.html)
 * @param {string} spreadsheetId - Spreadsheet ID to configure
 * @returns {Object} Configuration result
 */
function configureSpreadsheet(spreadsheetId) {
  try {
    console.log(`Configuring spreadsheet: ${spreadsheetId}`);
    
    // Validate the spreadsheet first
    const validationResult = validateSpreadsheet(spreadsheetId);
    
    if (validationResult.success) {
      // Save the spreadsheet ID if validation passed
      ConfigManager.setSpreadsheetId(spreadsheetId);
      ConfigManager.updateVersion('1.0.0');
      
      return {
        success: true,
        message: 'Spreadsheet configured successfully',
        spreadsheetId: spreadsheetId,
        availableSheets: validationResult.existingSheets
      };
    } else {
      return {
        success: false,
        message: validationResult.message,
        existingSheets: validationResult.existingSheets,
        missingSheets: validationResult.missingSheets
      };
    }
    
  } catch (error) {
    console.error('Failed to configure spreadsheet:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Helper function to extract email from webhook URL
 * @param {string} webhookUrl - Webhook URL
 * @returns {string} Extracted email or empty string
 */
function extractEmailFromWebhook(webhookUrl) {
  try {
    if (webhookUrl && webhookUrl.startsWith('mailto:')) {
      return webhookUrl.replace('mailto:', '');
    }
    return '';
  } catch (error) {
    console.error('Failed to extract email from webhook URL:', error);
    return '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfigManager, ConfigKeys, DefaultConfig };
}
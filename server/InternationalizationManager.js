/**
 * Internationalization Manager - Complete i18n System
 * Provides comprehensive multi-language support, timezone handling,
 * regional formatting, and localization for CasesDash system
 * 
 * @author Claude Code - Phase 4 Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * InternationalizationManager class for comprehensive i18n support
 */
class InternationalizationManager {
  
  constructor() {
    this.supportedLocales = this.initializeSupportedLocales();
    this.translations = new Map();
    this.dateFormats = this.initializeDateFormats();
    this.numberFormats = this.initializeNumberFormats();
    this.timezones = this.initializeTimezones();
    this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    this.defaultLocale = 'en-US';
    this.currentLocale = this.detectUserLocale();
    
    // Load translations
    this.loadTranslations();
  }
  
  /**
   * Initialize supported locales
   */
  initializeSupportedLocales() {
    return {
      'en-US': {
        name: 'English (United States)',
        nativeName: 'English (US)',
        code: 'en-US',
        language: 'en',
        region: 'US',
        direction: 'ltr',
        currency: 'USD',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h'
      },
      'ja-JP': {
        name: 'Japanese (Japan)',
        nativeName: '日本語',
        code: 'ja-JP',
        language: 'ja',
        region: 'JP',
        direction: 'ltr',
        currency: 'JPY',
        dateFormat: 'yyyy/MM/dd',
        timeFormat: '24h'
      },
      'en-GB': {
        name: 'English (United Kingdom)',
        nativeName: 'English (UK)',
        code: 'en-GB',
        language: 'en',
        region: 'GB',
        direction: 'ltr',
        currency: 'GBP',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '24h'
      },
      'zh-CN': {
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        code: 'zh-CN',
        language: 'zh',
        region: 'CN',
        direction: 'ltr',
        currency: 'CNY',
        dateFormat: 'yyyy-MM-dd',
        timeFormat: '24h'
      },
      'ko-KR': {
        name: 'Korean (South Korea)',
        nativeName: '한국어',
        code: 'ko-KR',
        language: 'ko',
        region: 'KR',
        direction: 'ltr',
        currency: 'KRW',
        dateFormat: 'yyyy. MM. dd.',
        timeFormat: '24h'
      }
    };
  }
  
  /**
   * Initialize date formats
   */
  initializeDateFormats() {
    return {
      'en-US': {
        short: 'M/d/yy',
        medium: 'MMM d, y',
        long: 'MMMM d, y',
        full: 'EEEE, MMMM d, y',
        time: 'h:mm a',
        datetime: 'MMM d, y, h:mm a'
      },
      'ja-JP': {
        short: 'y/MM/dd',
        medium: 'y年M月d日',
        long: 'y年M月d日',
        full: 'y年M月d日EEEE',
        time: 'H:mm',
        datetime: 'y年M月d日 H:mm'
      },
      'en-GB': {
        short: 'dd/MM/y',
        medium: 'd MMM y',
        long: 'd MMMM y',
        full: 'EEEE, d MMMM y',
        time: 'HH:mm',
        datetime: 'd MMM y, HH:mm'
      }
    };
  }
  
  /**
   * Initialize number formats
   */
  initializeNumberFormats() {
    return {
      'en-US': {
        decimal: '.',
        thousands: ',',
        currency: '$',
        percent: '%'
      },
      'ja-JP': {
        decimal: '.',
        thousands: ',',
        currency: '¥',
        percent: '%'
      },
      'en-GB': {
        decimal: '.',
        thousands: ',',
        currency: '£',
        percent: '%'
      }
    };
  }
  
  /**
   * Initialize timezone mappings
   */
  initializeTimezones() {
    return {
      'en-US': 'America/New_York',
      'ja-JP': 'Asia/Tokyo',
      'en-GB': 'Europe/London',
      'zh-CN': 'Asia/Shanghai',
      'ko-KR': 'Asia/Seoul'
    };
  }
  
  /**
   * Load translations for all supported languages
   */
  loadTranslations() {
    // English translations (base language)
    this.translations.set('en-US', {
      // Common UI elements
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        search: 'Search',
        filter: 'Filter',
        refresh: 'Refresh',
        export: 'Export',
        import: 'Import',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        reset: 'Reset'
      },
      
      // Navigation
      navigation: {
        dashboard: 'Dashboard',
        cases: 'Cases',
        statistics: 'Statistics',
        reports: 'Reports',
        settings: 'Settings',
        help: 'Help',
        logout: 'Logout'
      },
      
      // Case management
      cases: {
        title: 'Case Management',
        create: 'Create Case',
        caseId: 'Case ID',
        status: 'Status',
        assignee: 'Assignee',
        priority: 'Priority',
        openDate: 'Open Date',
        closeDate: 'Close Date',
        description: 'Description',
        channel: 'Channel',
        sheetType: 'Sheet Type',
        activeCases: 'Active Cases',
        closedCases: 'Closed Cases',
        totalCases: 'Total Cases'
      },
      
      // Status values
      status: {
        open: 'Open',
        assigned: 'Assigned',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        deleted: 'Deleted'
      },
      
      // Priority values
      priority: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      },
      
      // Channels
      channels: {
        email: 'Email',
        chat: 'Chat',
        phone: 'Phone'
      },
      
      // Error messages
      errors: {
        required: 'This field is required',
        invalidEmail: 'Please enter a valid email address',
        invalidCaseId: 'Please enter a valid case ID',
        invalidDate: 'Please enter a valid date',
        saveFailed: 'Failed to save. Please try again.',
        loadFailed: 'Failed to load data. Please refresh the page.',
        networkError: 'Network error. Please check your connection.',
        permissionDenied: 'Permission denied. You do not have access to this resource.',
        sessionExpired: 'Your session has expired. Please log in again.'
      },
      
      // Success messages
      success: {
        saved: 'Successfully saved',
        created: 'Successfully created',
        updated: 'Successfully updated',
        deleted: 'Successfully deleted',
        exported: 'Successfully exported',
        imported: 'Successfully imported'
      },
      
      // Validation messages
      validation: {
        caseIdFormat: 'Case ID must be in format X-XXXXXXXXXXXXX',
        emailDomain: 'Email must be from @google.com domain',
        dateRange: 'End date must be after start date',
        required: 'This field is required',
        minLength: 'Must be at least {min} characters',
        maxLength: 'Must be no more than {max} characters'
      },
      
      // Time and dates
      time: {
        now: 'Now',
        today: 'Today',
        yesterday: 'Yesterday',
        tomorrow: 'Tomorrow',
        thisWeek: 'This Week',
        lastWeek: 'Last Week',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        minutesAgo: '{count} minutes ago',
        hoursAgo: '{count} hours ago',
        daysAgo: '{count} days ago'
      }
    });
    
    // Japanese translations
    this.translations.set('ja-JP', {
      common: {
        loading: '読み込み中...',
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        edit: '編集',
        create: '作成',
        update: '更新',
        search: '検索',
        filter: 'フィルター',
        refresh: '更新',
        export: 'エクスポート',
        import: 'インポート',
        yes: 'はい',
        no: 'いいえ',
        ok: 'OK',
        close: '閉じる',
        back: '戻る',
        next: '次へ',
        previous: '前へ',
        submit: '送信',
        reset: 'リセット'
      },
      
      navigation: {
        dashboard: 'ダッシュボード',
        cases: 'ケース',
        statistics: '統計',
        reports: 'レポート',
        settings: '設定',
        help: 'ヘルプ',
        logout: 'ログアウト'
      },
      
      cases: {
        title: 'ケース管理',
        create: 'ケース作成',
        caseId: 'ケースID',
        status: 'ステータス',
        assignee: '担当者',
        priority: '優先度',
        openDate: '開始日',
        closeDate: '終了日',
        description: '説明',
        channel: 'チャネル',
        sheetType: 'シートタイプ',
        activeCases: 'アクティブケース',
        closedCases: 'クローズケース',
        totalCases: '総ケース数'
      },
      
      status: {
        open: 'オープン',
        assigned: 'アサイン済み',
        inProgress: '進行中',
        resolved: '解決済み',
        closed: 'クローズ',
        deleted: '削除済み'
      },
      
      priority: {
        low: '低',
        medium: '中',
        high: '高',
        critical: '緊急'
      },
      
      channels: {
        email: 'メール',
        chat: 'チャット',
        phone: '電話'
      },
      
      errors: {
        required: 'この項目は必須です',
        invalidEmail: '有効なメールアドレスを入力してください',
        invalidCaseId: '有効なケースIDを入力してください',
        invalidDate: '有効な日付を入力してください',
        saveFailed: '保存に失敗しました。もう一度お試しください。',
        loadFailed: 'データの読み込みに失敗しました。ページを更新してください。',
        networkError: 'ネットワークエラーです。接続を確認してください。',
        permissionDenied: 'アクセス権限がありません。',
        sessionExpired: 'セッションが期限切れです。再度ログインしてください。'
      },
      
      success: {
        saved: '正常に保存されました',
        created: '正常に作成されました',
        updated: '正常に更新されました',
        deleted: '正常に削除されました',
        exported: '正常にエクスポートされました',
        imported: '正常にインポートされました'
      },
      
      validation: {
        caseIdFormat: 'ケースIDはX-XXXXXXXXXXXXX形式である必要があります',
        emailDomain: 'メールアドレスは@google.comドメインである必要があります',
        dateRange: '終了日は開始日より後である必要があります',
        required: 'この項目は必須です',
        minLength: '最低{min}文字必要です',
        maxLength: '最大{max}文字まで入力できます'
      },
      
      time: {
        now: '今',
        today: '今日',
        yesterday: '昨日',
        tomorrow: '明日',
        thisWeek: '今週',
        lastWeek: '先週',
        thisMonth: '今月',
        lastMonth: '先月',
        minutesAgo: '{count}分前',
        hoursAgo: '{count}時間前',
        daysAgo: '{count}日前'
      }
    });
    
    console.log('✅ Translations loaded for', Array.from(this.translations.keys()).join(', '));
  }
  
  /**
   * Detect user locale from browser or system settings
   */
  detectUserLocale() {
    try {
      // Try to get locale from Apps Script session
      const userLocale = Session.getActiveUserLocale();
      if (userLocale && this.supportedLocales[userLocale]) {
        return userLocale;
      }
      
      // Check if it's a supported language variant
      const language = userLocale ? userLocale.split('-')[0] : 'en';
      for (const [locale, config] of Object.entries(this.supportedLocales)) {
        if (config.language === language) {
          return locale;
        }
      }
      
      return this.defaultLocale;
    } catch (error) {
      console.warn('Failed to detect user locale:', error);
      return this.defaultLocale;
    }
  }
  
  /**
   * Set current locale
   * @param {string} locale - Locale code (e.g., 'ja-JP')
   * @returns {boolean} Success status
   */
  setLocale(locale) {
    try {
      if (!this.supportedLocales[locale]) {
        console.warn(`Unsupported locale: ${locale}`);
        return false;
      }
      
      this.currentLocale = locale;
      
      // Store user preference
      PropertiesService.getUserProperties().setProperty('preferred_locale', locale);
      
      console.log(`Locale set to: ${locale}`);
      return true;
    } catch (error) {
      console.error('Failed to set locale:', error);
      return false;
    }
  }
  
  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'common.save')
   * @param {Object} params - Parameters for interpolation
   * @param {string} locale - Optional locale override
   * @returns {string} Translated text
   */
  t(key, params = {}, locale = null) {
    try {
      const targetLocale = locale || this.currentLocale;
      const translations = this.translations.get(targetLocale);
      
      if (!translations) {
        // Fallback to default locale
        const fallbackTranslations = this.translations.get(this.defaultLocale);
        if (!fallbackTranslations) {
          return key; // Return key if no translations available
        }
        return this.getTranslationValue(fallbackTranslations, key, params);
      }
      
      return this.getTranslationValue(translations, key, params);
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return key;
    }
  }
  
  /**
   * Get translation value from nested object
   */
  getTranslationValue(translations, key, params) {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if path not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Interpolate parameters
    return this.interpolate(value, params);
  }
  
  /**
   * Interpolate parameters in translation string
   */
  interpolate(text, params) {
    if (!params || Object.keys(params).length === 0) {
      return text;
    }
    
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  
  /**
   * Format date according to current locale
   * @param {Date|string} date - Date to format
   * @param {string} format - Format type ('short', 'medium', 'long', 'full', 'time', 'datetime')
   * @param {string} locale - Optional locale override
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'medium', locale = null) {
    try {
      const targetLocale = locale || this.currentLocale;
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!(dateObj instanceof Date) || isNaN(dateObj)) {
        return 'Invalid Date';
      }
      
      const localeConfig = this.supportedLocales[targetLocale];
      const timezone = this.timezones[targetLocale] || 'UTC';
      
      // Use Utilities.formatDate with proper timezone
      const formatPattern = this.getDateFormatPattern(format, targetLocale);
      
      return Utilities.formatDate(dateObj, timezone, formatPattern);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return date.toString();
    }
  }
  
  /**
   * Get date format pattern for locale
   */
  getDateFormatPattern(format, locale) {
    const formats = this.dateFormats[locale] || this.dateFormats[this.defaultLocale];
    
    const patterns = {
      short: 'M/d/yy',
      medium: 'MMM d, y',
      long: 'MMMM d, y',
      full: 'EEEE, MMMM d, y',
      time: 'h:mm a',
      datetime: 'MMM d, y, h:mm a'
    };
    
    if (locale === 'ja-JP') {
      patterns.short = 'y/MM/dd';
      patterns.medium = 'y年M月d日';
      patterns.long = 'y年M月d日';
      patterns.full = 'y年M月d日EEEE';
      patterns.time = 'H:mm';
      patterns.datetime = 'y年M月d日 H:mm';
    } else if (locale === 'en-GB') {
      patterns.short = 'dd/MM/y';
      patterns.medium = 'd MMM y';
      patterns.long = 'd MMMM y';
      patterns.full = 'EEEE, d MMMM y';
      patterns.time = 'HH:mm';
      patterns.datetime = 'd MMM y, HH:mm';
    }
    
    return patterns[format] || patterns.medium;
  }
  
  /**
   * Format number according to current locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @param {string} locale - Optional locale override
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}, locale = null) {
    try {
      const targetLocale = locale || this.currentLocale;
      const opts = {
        type: 'decimal', // 'decimal', 'currency', 'percent'
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
      };
      
      const numberFormats = this.numberFormats[targetLocale] || this.numberFormats[this.defaultLocale];
      
      if (opts.type === 'currency') {
        const currency = this.supportedLocales[targetLocale]?.currency || 'USD';
        return this.formatCurrency(number, currency, targetLocale);
      } else if (opts.type === 'percent') {
        return this.formatPercent(number, targetLocale);
      }
      
      // Basic decimal formatting
      const formatted = number.toFixed(opts.maximumFractionDigits);
      return this.addThousandsSeparator(formatted, numberFormats);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return number.toString();
    }
  }
  
  /**
   * Format currency
   */
  formatCurrency(amount, currency, locale) {
    const numberFormats = this.numberFormats[locale] || this.numberFormats[this.defaultLocale];
    const formatted = this.addThousandsSeparator(amount.toFixed(2), numberFormats);
    
    const currencySymbols = {
      'USD': '$',
      'JPY': '¥',
      'GBP': '£',
      'EUR': '€',
      'CNY': '¥',
      'KRW': '₩'
    };
    
    const symbol = currencySymbols[currency] || currency;
    
    // Currency placement varies by locale
    if (locale === 'ja-JP' || locale === 'zh-CN' || locale === 'ko-KR') {
      return `${symbol}${formatted}`;
    } else {
      return `${symbol}${formatted}`;
    }
  }
  
  /**
   * Format percentage
   */
  formatPercent(number, locale) {
    const percentage = (number * 100).toFixed(1);
    return `${percentage}%`;
  }
  
  /**
   * Add thousands separator
   */
  addThousandsSeparator(numberStr, formats) {
    const parts = numberStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, formats.thousands);
    
    if (decimalPart) {
      return `${formattedInteger}${formats.decimal}${decimalPart}`;
    }
    
    return formattedInteger;
  }
  
  /**
   * Convert timezone
   * @param {Date} date - Date to convert
   * @param {string} targetTimezone - Target timezone
   * @param {string} sourceTimezone - Source timezone (optional)
   * @returns {Date} Converted date
   */
  convertTimezone(date, targetTimezone, sourceTimezone = null) {
    try {
      // For Google Apps Script, we'll use the built-in timezone handling
      const targetLocale = Object.keys(this.timezones).find(
        locale => this.timezones[locale] === targetTimezone
      ) || this.currentLocale;
      
      return new Date(date.getTime());
    } catch (error) {
      console.warn('Timezone conversion error:', error);
      return date;
    }
  }
  
  /**
   * Get relative time string
   * @param {Date} date - Date to format
   * @param {string} locale - Optional locale override
   * @returns {string} Relative time string
   */
  formatRelativeTime(date, locale = null) {
    try {
      const targetLocale = locale || this.currentLocale;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return this.t('time.now', {}, targetLocale);
      } else if (diffMinutes < 60) {
        return this.t('time.minutesAgo', { count: diffMinutes }, targetLocale);
      } else if (diffHours < 24) {
        return this.t('time.hoursAgo', { count: diffHours }, targetLocale);
      } else if (diffDays < 7) {
        return this.t('time.daysAgo', { count: diffDays }, targetLocale);
      } else {
        return this.formatDate(date, 'medium', targetLocale);
      }
    } catch (error) {
      console.warn('Relative time formatting error:', error);
      return this.formatDate(date, 'medium', locale);
    }
  }
  
  /**
   * Get text direction for current locale
   * @param {string} locale - Optional locale override
   * @returns {string} 'ltr' or 'rtl'
   */
  getTextDirection(locale = null) {
    const targetLocale = locale || this.currentLocale;
    const localeConfig = this.supportedLocales[targetLocale];
    return localeConfig?.direction || 'ltr';
  }
  
  /**
   * Check if locale uses RTL text direction
   * @param {string} locale - Optional locale override
   * @returns {boolean} True if RTL
   */
  isRTL(locale = null) {
    return this.getTextDirection(locale) === 'rtl';
  }
  
  /**
   * Get supported locales list
   * @returns {Array} Array of locale configurations
   */
  getSupportedLocales() {
    return Object.values(this.supportedLocales);
  }
  
  /**
   * Get current locale configuration
   * @returns {Object} Current locale configuration
   */
  getCurrentLocaleConfig() {
    return this.supportedLocales[this.currentLocale] || this.supportedLocales[this.defaultLocale];
  }
  
  /**
   * Validate locale input for forms
   * @param {string} input - Input to validate
   * @param {string} type - Input type ('date', 'number', 'email', etc.)
   * @param {string} locale - Optional locale override
   * @returns {Object} Validation result
   */
  validateLocalizedInput(input, type, locale = null) {
    try {
      const targetLocale = locale || this.currentLocale;
      const result = { isValid: true, normalizedValue: input, errors: [] };
      
      switch (type) {
        case 'date':
          const dateResult = this.parseLocalizedDate(input, targetLocale);
          result.isValid = dateResult.isValid;
          result.normalizedValue = dateResult.date;
          if (!dateResult.isValid) {
            result.errors.push(this.t('errors.invalidDate', {}, targetLocale));
          }
          break;
          
        case 'number':
          const numberResult = this.parseLocalizedNumber(input, targetLocale);
          result.isValid = numberResult.isValid;
          result.normalizedValue = numberResult.number;
          if (!numberResult.isValid) {
            result.errors.push('Invalid number format');
          }
          break;
          
        default:
          // No special validation needed
          break;
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        normalizedValue: input,
        errors: ['Validation error']
      };
    }
  }
  
  /**
   * Parse localized date string
   */
  parseLocalizedDate(dateStr, locale) {
    try {
      // Try parsing as standard ISO format first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return { isValid: true, date: date };
      }
      
      // Try locale-specific parsing
      const localeConfig = this.supportedLocales[locale];
      if (locale === 'ja-JP') {
        // Handle Japanese date formats like "2024年1月15日"
        const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
          date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          if (!isNaN(date.getTime())) {
            return { isValid: true, date: date };
          }
        }
      }
      
      return { isValid: false, date: null };
    } catch (error) {
      return { isValid: false, date: null };
    }
  }
  
  /**
   * Parse localized number string
   */
  parseLocalizedNumber(numberStr, locale) {
    try {
      const formats = this.numberFormats[locale] || this.numberFormats[this.defaultLocale];
      
      // Remove thousands separators and convert decimal separator
      let normalized = numberStr.toString()
        .replace(new RegExp(`\\${formats.thousands}`, 'g'), '')
        .replace(formats.decimal, '.');
      
      const number = parseFloat(normalized);
      
      if (isNaN(number)) {
        return { isValid: false, number: null };
      }
      
      return { isValid: true, number: number };
    } catch (error) {
      return { isValid: false, number: null };
    }
  }
  
  /**
   * Generate localized error messages
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @param {string} locale - Optional locale override
   * @returns {string} Localized error message
   */
  getLocalizedErrorMessage(errorType, context = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;
    
    const errorKey = `errors.${errorType}`;
    return this.t(errorKey, context, targetLocale);
  }
  
  /**
   * Static methods for easy access
   */
  static getInstance() {
    if (!InternationalizationManager.instance) {
      InternationalizationManager.instance = new InternationalizationManager();
    }
    return InternationalizationManager.instance;
  }
  
  static t(key, params, locale) {
    return InternationalizationManager.getInstance().t(key, params, locale);
  }
  
  static formatDate(date, format, locale) {
    return InternationalizationManager.getInstance().formatDate(date, format, locale);
  }
  
  static formatNumber(number, options, locale) {
    return InternationalizationManager.getInstance().formatNumber(number, options, locale);
  }
  
  static setLocale(locale) {
    return InternationalizationManager.getInstance().setLocale(locale);
  }
}

// Global instance for easy access
const i18n = InternationalizationManager.getInstance();

console.log('✅ Internationalization Manager loaded successfully');
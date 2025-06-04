/**
 * Backup Manager - Comprehensive Backup and Restore System
 * Provides automated backups, point-in-time recovery, data integrity verification,
 * and disaster recovery capabilities for CasesDash system
 * 
 * @author Claude Code - Phase 4 Enhancement
 * @version 1.0.0
 * @since 2025-06-04
 */

/**
 * BackupManager class for comprehensive data backup and restoration
 */
class BackupManager {
  
  constructor() {
    this.spreadsheetId = ConfigManager.getSpreadsheetId();
    this.backupConfig = this.initializeBackupConfig();
    this.compressionEnabled = true;
    this.encryptionEnabled = true;
    this.retentionDays = 90; // Keep backups for 90 days
    this.maxBackupSize = 50 * 1024 * 1024; // 50MB limit
  }
  
  /**
   * Initialize backup configuration
   */
  initializeBackupConfig() {
    return {
      // Backup types
      types: {
        FULL: 'full',
        INCREMENTAL: 'incremental',
        DIFFERENTIAL: 'differential'
      },
      
      // Backup schedules
      schedules: {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        ON_DEMAND: 'on_demand'
      },
      
      // Storage locations
      storage: {
        DRIVE: 'google_drive',
        PROPERTIES: 'script_properties',
        CACHE: 'cache_service'
      },
      
      // Supported sheet types
      supportedSheets: [
        'OT Email', '3PO Email', 'OT Chat', 
        '3PO Chat', 'OT Phone', '3PO Phone'
      ]
    };
  }
  
  /**
   * Create comprehensive backup
   * @param {Object} options - Backup options
   * @returns {Object} Backup result
   */
  async createBackup(options = {}) {
    const operationId = Utilities.getUuid();
    const startTime = Date.now();
    
    try {
      const opts = {
        type: this.backupConfig.types.FULL,
        includeSheets: this.backupConfig.supportedSheets,
        includeMeta: true,
        includeConfig: true,
        compression: this.compressionEnabled,
        encryption: this.encryptionEnabled,
        description: '',
        ...options
      };
      
      console.log(`🔄 [BackupManager] Starting ${opts.type} backup...`);
      
      // Validate backup prerequisites
      const validation = await this.validateBackupPrerequisites(opts);
      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Generate backup metadata
      const backupMetadata = this.generateBackupMetadata(operationId, opts);
      
      // Collect data from all specified sheets
      const backupData = await this.collectBackupData(opts.includeSheets, opts);
      
      // Calculate data integrity checksums
      const integrityChecks = this.calculateDataIntegrity(backupData);
      
      // Create backup package
      const backupPackage = {
        metadata: backupMetadata,
        data: backupData,
        integrity: integrityChecks,
        version: '1.0',
        created: new Date().toISOString()
      };
      
      // Compress if enabled
      if (opts.compression) {
        backupPackage.data = this.compressData(backupPackage.data);
        backupPackage.compressed = true;
      }
      
      // Encrypt if enabled
      if (opts.encryption) {
        backupPackage.data = this.encryptData(backupPackage.data);
        backupPackage.encrypted = true;
      }
      
      // Store backup
      const storageResult = await this.storeBackup(backupPackage, opts);
      
      // Update backup registry
      await this.updateBackupRegistry(backupMetadata, storageResult);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ [BackupManager] Backup completed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        backupId: operationId,
        metadata: backupMetadata,
        storageLocation: storageResult.location,
        size: this.calculateBackupSize(backupPackage),
        executionTime: executionTime,
        integrity: {
          checksum: integrityChecks.globalChecksum,
          sheetChecksums: integrityChecks.sheetChecksums
        }
      };
      
    } catch (error) {
      console.error(`❌ [BackupManager] Backup failed:`, error);
      
      return {
        success: false,
        error: error.message,
        backupId: operationId,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Restore data from backup
   * @param {string} backupId - Backup ID to restore
   * @param {Object} options - Restore options
   * @returns {Object} Restore result
   */
  async restoreFromBackup(backupId, options = {}) {
    const operationId = Utilities.getUuid();
    const startTime = Date.now();
    
    try {
      const opts = {
        targetSheets: [], // Empty means restore all
        verifyIntegrity: true,
        createBackupBeforeRestore: true,
        dryRun: false,
        ...options
      };
      
      console.log(`🔄 [BackupManager] Starting restore from backup ${backupId}...`);
      
      // Create safety backup before restore
      if (opts.createBackupBeforeRestore) {
        console.log(`🔄 [BackupManager] Creating safety backup before restore...`);
        const safetyBackup = await this.createBackup({
          type: this.backupConfig.types.FULL,
          description: `Safety backup before restore from ${backupId}`
        });
        
        if (!safetyBackup.success) {
          throw new Error('Failed to create safety backup before restore');
        }
        
        console.log(`✅ [BackupManager] Safety backup created: ${safetyBackup.backupId}`);
      }
      
      // Retrieve backup package
      const backupPackage = await this.retrieveBackup(backupId);
      if (!backupPackage) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Verify backup integrity
      if (opts.verifyIntegrity) {
        const integrityCheck = this.verifyBackupIntegrity(backupPackage);
        if (!integrityCheck.isValid) {
          throw new Error(`Backup integrity verification failed: ${integrityCheck.errors.join(', ')}`);
        }
        console.log(`✅ [BackupManager] Backup integrity verified`);
      }
      
      // Decrypt if encrypted
      if (backupPackage.encrypted) {
        backupPackage.data = this.decryptData(backupPackage.data);
      }
      
      // Decompress if compressed
      if (backupPackage.compressed) {
        backupPackage.data = this.decompressData(backupPackage.data);
      }
      
      // Determine sheets to restore
      const sheetsToRestore = opts.targetSheets.length > 0 
        ? opts.targetSheets 
        : Object.keys(backupPackage.data.sheets || {});
      
      console.log(`🔄 [BackupManager] Restoring ${sheetsToRestore.length} sheets...`);
      
      // Perform restore operations
      const restoreResults = {};
      for (const sheetType of sheetsToRestore) {
        if (opts.dryRun) {
          restoreResults[sheetType] = { success: true, message: 'Dry run - no changes made' };
        } else {
          restoreResults[sheetType] = await this.restoreSheetData(sheetType, backupPackage.data.sheets[sheetType]);
        }
      }
      
      // Verify restore success
      const failedRestores = Object.entries(restoreResults)
        .filter(([, result]) => !result.success)
        .map(([sheetType]) => sheetType);
      
      if (failedRestores.length > 0) {
        throw new Error(`Failed to restore sheets: ${failedRestores.join(', ')}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ [BackupManager] Restore completed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        restoreId: operationId,
        backupId: backupId,
        restoredSheets: sheetsToRestore,
        restoreResults: restoreResults,
        executionTime: executionTime,
        dryRun: opts.dryRun
      };
      
    } catch (error) {
      console.error(`❌ [BackupManager] Restore failed:`, error);
      
      return {
        success: false,
        error: error.message,
        restoreId: operationId,
        backupId: backupId,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Validate backup prerequisites
   */
  async validateBackupPrerequisites(options) {
    const errors = [];
    const warnings = [];
    
    try {
      // Check spreadsheet access
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      if (!spreadsheet) {
        errors.push('Cannot access source spreadsheet');
      }
      
      // Check sheet availability
      for (const sheetType of options.includeSheets) {
        const sheet = spreadsheet.getSheetByName(sheetType);
        if (!sheet) {
          warnings.push(`Sheet "${sheetType}" not found - will be skipped`);
        }
      }
      
      // Check storage capacity
      const estimatedSize = await this.estimateBackupSize(options.includeSheets);
      if (estimatedSize > this.maxBackupSize) {
        warnings.push(`Estimated backup size (${estimatedSize} bytes) exceeds recommended limit`);
      }
      
      // Check permissions
      const hasWritePermission = this.checkWritePermissions();
      if (!hasWritePermission) {
        errors.push('Insufficient permissions for backup storage');
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Generate backup metadata
   */
  generateBackupMetadata(backupId, options) {
    return {
      id: backupId,
      type: options.type,
      timestamp: new Date().toISOString(),
      description: options.description,
      creator: Session.getActiveUser().getEmail(),
      source: {
        spreadsheetId: this.spreadsheetId,
        sheets: options.includeSheets
      },
      options: {
        compression: options.compression,
        encryption: options.encryption,
        includeMeta: options.includeMeta,
        includeConfig: options.includeConfig
      },
      version: '1.0'
    };
  }
  
  /**
   * Collect backup data from sheets
   */
  async collectBackupData(sheetTypes, options) {
    const backupData = {
      sheets: {},
      metadata: {},
      config: {}
    };
    
    try {
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      
      // Collect sheet data
      for (const sheetType of sheetTypes) {
        try {
          const sheet = spreadsheet.getSheetByName(sheetType);
          if (!sheet) {
            console.warn(`⚠️ [BackupManager] Sheet "${sheetType}" not found, skipping...`);
            continue;
          }
          
          console.log(`📊 [BackupManager] Backing up sheet: ${sheetType}`);
          
          // Get all data from sheet
          const lastRow = sheet.getLastRow();
          const lastCol = sheet.getLastColumn();
          
          if (lastRow > 0 && lastCol > 0) {
            const sheetData = {
              values: sheet.getRange(1, 1, lastRow, lastCol).getValues(),
              lastRow: lastRow,
              lastColumn: lastCol,
              name: sheetType
            };
            
            // Include formatting if requested
            if (options.includeFormatting) {
              sheetData.formats = this.captureSheetFormatting(sheet, lastRow, lastCol);
            }
            
            backupData.sheets[sheetType] = sheetData;
          }
          
        } catch (sheetError) {
          console.error(`❌ [BackupManager] Error backing up sheet ${sheetType}:`, sheetError);
          // Continue with other sheets
        }
      }
      
      // Collect metadata if requested
      if (options.includeMeta) {
        backupData.metadata = await this.collectSystemMetadata();
      }
      
      // Collect configuration if requested
      if (options.includeConfig) {
        backupData.config = await this.collectSystemConfiguration();
      }
      
      return backupData;
      
    } catch (error) {
      console.error(`❌ [BackupManager] Error collecting backup data:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate data integrity checksums
   */
  calculateDataIntegrity(backupData) {
    const integrityChecks = {
      sheetChecksums: {},
      metadataChecksum: null,
      configChecksum: null,
      globalChecksum: null
    };
    
    try {
      // Calculate checksum for each sheet
      for (const [sheetType, sheetData] of Object.entries(backupData.sheets || {})) {
        const dataString = JSON.stringify(sheetData.values || []);
        integrityChecks.sheetChecksums[sheetType] = this.calculateChecksum(dataString);
      }
      
      // Calculate metadata checksum
      if (backupData.metadata) {
        const metadataString = JSON.stringify(backupData.metadata);
        integrityChecks.metadataChecksum = this.calculateChecksum(metadataString);
      }
      
      // Calculate config checksum
      if (backupData.config) {
        const configString = JSON.stringify(backupData.config);
        integrityChecks.configChecksum = this.calculateChecksum(configString);
      }
      
      // Calculate global checksum
      const globalDataString = JSON.stringify(backupData);
      integrityChecks.globalChecksum = this.calculateChecksum(globalDataString);
      
      return integrityChecks;
      
    } catch (error) {
      console.error(`❌ [BackupManager] Error calculating integrity checksums:`, error);
      return integrityChecks;
    }
  }
  
  /**
   * Calculate simple checksum for data integrity
   */
  calculateChecksum(data) {
    try {
      let hash = 0;
      const str = String(data);
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
    } catch (error) {
      return '0';
    }
  }
  
  /**
   * Compress data using simple compression
   */
  compressData(data) {
    try {
      // Simple compression by removing whitespace and compacting JSON
      const jsonString = JSON.stringify(data);
      const compressed = jsonString.replace(/\s+/g, ' ').trim();
      
      return {
        compressed: true,
        originalSize: jsonString.length,
        compressedSize: compressed.length,
        data: compressed
      };
    } catch (error) {
      console.error('❌ [BackupManager] Compression failed:', error);
      return data;
    }
  }
  
  /**
   * Decompress data
   */
  decompressData(compressedData) {
    try {
      if (compressedData.compressed) {
        return JSON.parse(compressedData.data);
      }
      return compressedData;
    } catch (error) {
      console.error('❌ [BackupManager] Decompression failed:', error);
      return compressedData;
    }
  }
  
  /**
   * Encrypt data (simple encryption for demo purposes)
   */
  encryptData(data) {
    try {
      // In production, use proper encryption
      const jsonString = JSON.stringify(data);
      const encrypted = Utilities.base64Encode(jsonString);
      
      return {
        encrypted: true,
        data: encrypted,
        algorithm: 'base64' // Simple encoding for demo
      };
    } catch (error) {
      console.error('❌ [BackupManager] Encryption failed:', error);
      return data;
    }
  }
  
  /**
   * Decrypt data
   */
  decryptData(encryptedData) {
    try {
      if (encryptedData.encrypted) {
        const decrypted = Utilities.base64Decode(encryptedData.data);
        return JSON.parse(decrypted);
      }
      return encryptedData;
    } catch (error) {
      console.error('❌ [BackupManager] Decryption failed:', error);
      return encryptedData;
    }
  }
  
  /**
   * Store backup using Properties Service
   */
  async storeBackup(backupPackage, options) {
    try {
      const backupId = backupPackage.metadata.id;
      const backupKey = `backup_${backupId}`;
      
      // Store in Properties Service (with size limitations)
      const backupString = JSON.stringify(backupPackage);
      const maxPropertySize = 9000; // Properties Service limit
      
      if (backupString.length > maxPropertySize) {
        // Split into chunks
        const chunks = this.splitIntoChunks(backupString, maxPropertySize);
        
        // Store chunks
        const properties = PropertiesService.getScriptProperties();
        properties.setProperty(`${backupKey}_chunks`, chunks.length.toString());
        
        for (let i = 0; i < chunks.length; i++) {
          properties.setProperty(`${backupKey}_chunk_${i}`, chunks[i]);
        }
        
        return {
          success: true,
          location: 'script_properties_chunked',
          chunks: chunks.length,
          totalSize: backupString.length
        };
      } else {
        // Store as single property
        PropertiesService.getScriptProperties().setProperty(backupKey, backupString);
        
        return {
          success: true,
          location: 'script_properties',
          totalSize: backupString.length
        };
      }
      
    } catch (error) {
      console.error('❌ [BackupManager] Storage failed:', error);
      throw new Error(`Failed to store backup: ${error.message}`);
    }
  }
  
  /**
   * Retrieve backup from storage
   */
  async retrieveBackup(backupId) {
    try {
      const backupKey = `backup_${backupId}`;
      const properties = PropertiesService.getScriptProperties();
      
      // Check if backup is chunked
      const chunkCount = properties.getProperty(`${backupKey}_chunks`);
      
      if (chunkCount) {
        // Retrieve chunked backup
        const chunks = [];
        for (let i = 0; i < parseInt(chunkCount); i++) {
          const chunk = properties.getProperty(`${backupKey}_chunk_${i}`);
          if (!chunk) {
            throw new Error(`Missing backup chunk ${i}`);
          }
          chunks.push(chunk);
        }
        
        const backupString = chunks.join('');
        return JSON.parse(backupString);
      } else {
        // Retrieve single backup
        const backupString = properties.getProperty(backupKey);
        if (!backupString) {
          return null;
        }
        
        return JSON.parse(backupString);
      }
      
    } catch (error) {
      console.error(`❌ [BackupManager] Failed to retrieve backup ${backupId}:`, error);
      return null;
    }
  }
  
  /**
   * Split string into chunks
   */
  splitIntoChunks(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Verify backup integrity
   */
  verifyBackupIntegrity(backupPackage) {
    const errors = [];
    const warnings = [];
    
    try {
      // Check basic structure
      if (!backupPackage.metadata) {
        errors.push('Missing backup metadata');
      }
      
      if (!backupPackage.data) {
        errors.push('Missing backup data');
      }
      
      if (!backupPackage.integrity) {
        warnings.push('Missing integrity checksums');
        return { isValid: errors.length === 0, errors, warnings };
      }
      
      // Verify checksums
      const currentChecksums = this.calculateDataIntegrity(backupPackage.data);
      
      // Compare global checksum
      if (currentChecksums.globalChecksum !== backupPackage.integrity.globalChecksum) {
        errors.push('Global data integrity check failed');
      }
      
      // Compare sheet checksums
      for (const [sheetType, expectedChecksum] of Object.entries(backupPackage.integrity.sheetChecksums || {})) {
        const currentChecksum = currentChecksums.sheetChecksums[sheetType];
        if (currentChecksum !== expectedChecksum) {
          errors.push(`Data integrity check failed for sheet: ${sheetType}`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Integrity verification error: ${error.message}`],
        warnings: []
      };
    }
  }
  
  /**
   * Restore sheet data
   */
  async restoreSheetData(sheetType, sheetData) {
    try {
      console.log(`🔄 [BackupManager] Restoring sheet: ${sheetType}`);
      
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      let sheet = spreadsheet.getSheetByName(sheetType);
      
      // Create sheet if it doesn't exist
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetType);
        console.log(`📝 [BackupManager] Created new sheet: ${sheetType}`);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Restore data
      if (sheetData.values && sheetData.values.length > 0) {
        const range = sheet.getRange(1, 1, sheetData.values.length, sheetData.values[0].length);
        range.setValues(sheetData.values);
        
        console.log(`✅ [BackupManager] Restored ${sheetData.values.length} rows to ${sheetType}`);
      }
      
      return {
        success: true,
        rowsRestored: sheetData.values ? sheetData.values.length : 0,
        message: `Successfully restored sheet ${sheetType}`
      };
      
    } catch (error) {
      console.error(`❌ [BackupManager] Failed to restore sheet ${sheetType}:`, error);
      return {
        success: false,
        error: error.message,
        message: `Failed to restore sheet ${sheetType}`
      };
    }
  }
  
  /**
   * Update backup registry
   */
  async updateBackupRegistry(metadata, storageResult) {
    try {
      const registryKey = 'backup_registry';
      const properties = PropertiesService.getScriptProperties();
      
      // Get existing registry
      let registry = [];
      const existingRegistry = properties.getProperty(registryKey);
      if (existingRegistry) {
        registry = JSON.parse(existingRegistry);
      }
      
      // Add new backup entry
      const registryEntry = {
        id: metadata.id,
        timestamp: metadata.timestamp,
        type: metadata.type,
        description: metadata.description,
        creator: metadata.creator,
        storage: storageResult,
        sheetsIncluded: metadata.source.sheets
      };
      
      registry.push(registryEntry);
      
      // Keep only recent entries (based on retention policy)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      registry = registry.filter(entry => new Date(entry.timestamp) > cutoffDate);
      
      // Store updated registry
      properties.setProperty(registryKey, JSON.stringify(registry));
      
    } catch (error) {
      console.error('❌ [BackupManager] Failed to update backup registry:', error);
    }
  }
  
  /**
   * Get backup registry
   */
  getBackupRegistry() {
    try {
      const registryKey = 'backup_registry';
      const registryData = PropertiesService.getScriptProperties().getProperty(registryKey);
      
      if (!registryData) {
        return [];
      }
      
      return JSON.parse(registryData);
    } catch (error) {
      console.error('❌ [BackupManager] Failed to get backup registry:', error);
      return [];
    }
  }
  
  /**
   * Cleanup old backups
   */
  async cleanupOldBackups() {
    try {
      const registry = this.getBackupRegistry();
      const properties = PropertiesService.getScriptProperties();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let cleanedCount = 0;
      
      for (const entry of registry) {
        if (new Date(entry.timestamp) < cutoffDate) {
          // Remove backup data
          const backupKey = `backup_${entry.id}`;
          
          if (entry.storage.chunks) {
            // Remove chunked backup
            properties.deleteProperty(`${backupKey}_chunks`);
            for (let i = 0; i < entry.storage.chunks; i++) {
              properties.deleteProperty(`${backupKey}_chunk_${i}`);
            }
          } else {
            // Remove single backup
            properties.deleteProperty(backupKey);
          }
          
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 [BackupManager] Cleaned up ${cleanedCount} old backups`);
      }
      
    } catch (error) {
      console.error('❌ [BackupManager] Cleanup failed:', error);
    }
  }
  
  /**
   * Estimate backup size
   */
  async estimateBackupSize(sheetTypes) {
    try {
      let totalSize = 0;
      const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
      
      for (const sheetType of sheetTypes) {
        const sheet = spreadsheet.getSheetByName(sheetType);
        if (sheet) {
          const lastRow = sheet.getLastRow();
          const lastCol = sheet.getLastColumn();
          
          // Rough estimation: 50 bytes per cell
          totalSize += lastRow * lastCol * 50;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check write permissions
   */
  checkWritePermissions() {
    try {
      // Test write access to Properties Service
      const testKey = 'backup_permission_test';
      PropertiesService.getScriptProperties().setProperty(testKey, 'test');
      PropertiesService.getScriptProperties().deleteProperty(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Calculate backup size
   */
  calculateBackupSize(backupPackage) {
    try {
      return JSON.stringify(backupPackage).length;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Collect system metadata
   */
  async collectSystemMetadata() {
    try {
      return {
        timestamp: new Date().toISOString(),
        spreadsheetId: this.spreadsheetId,
        user: Session.getActiveUser().getEmail(),
        version: '1.0',
        timezone: Session.getScriptTimeZone(),
        locale: Session.getActiveUserLocale()
      };
    } catch (error) {
      console.error('❌ [BackupManager] Failed to collect metadata:', error);
      return {};
    }
  }
  
  /**
   * Collect system configuration
   */
  async collectSystemConfiguration() {
    try {
      // Collect non-sensitive configuration
      return {
        retentionDays: this.retentionDays,
        maxBackupSize: this.maxBackupSize,
        supportedSheets: this.backupConfig.supportedSheets,
        features: {
          compression: this.compressionEnabled,
          encryption: this.encryptionEnabled
        }
      };
    } catch (error) {
      console.error('❌ [BackupManager] Failed to collect configuration:', error);
      return {};
    }
  }
  
  /**
   * Export backup to external format
   * @param {string} backupId - Backup ID to export
   * @param {string} format - Export format ('json', 'csv')
   * @returns {Object} Export result
   */
  async exportBackup(backupId, format = 'json') {
    try {
      const backupPackage = await this.retrieveBackup(backupId);
      if (!backupPackage) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Decrypt and decompress if needed
      let data = backupPackage.data;
      if (backupPackage.encrypted) {
        data = this.decryptData(data);
      }
      if (backupPackage.compressed) {
        data = this.decompressData(data);
      }
      
      switch (format.toLowerCase()) {
        case 'json':
          return {
            success: true,
            format: 'json',
            data: JSON.stringify(data, null, 2),
            filename: `backup_${backupId}.json`
          };
          
        case 'csv':
          const csvData = this.convertToCSV(data);
          return {
            success: true,
            format: 'csv',
            data: csvData,
            filename: `backup_${backupId}.csv`
          };
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Convert backup data to CSV format
   */
  convertToCSV(data) {
    try {
      const csvLines = [];
      
      // Add header
      csvLines.push('Sheet,Row,Column,Value');
      
      // Convert each sheet
      for (const [sheetType, sheetData] of Object.entries(data.sheets || {})) {
        if (sheetData.values) {
          sheetData.values.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
              csvLines.push(`"${sheetType}",${rowIndex + 1},${colIndex + 1},"${String(value).replace(/"/g, '""')}"`);
            });
          });
        }
      }
      
      return csvLines.join('\n');
    } catch (error) {
      throw new Error(`CSV conversion failed: ${error.message}`);
    }
  }
  
  /**
   * Static methods for external use
   */
  static async createSystemBackup(options) {
    const manager = new BackupManager();
    return await manager.createBackup(options);
  }
  
  static async restoreSystemBackup(backupId, options) {
    const manager = new BackupManager();
    return await manager.restoreFromBackup(backupId, options);
  }
  
  static getSystemBackups() {
    const manager = new BackupManager();
    return manager.getBackupRegistry();
  }
}

console.log('✅ Backup Manager loaded successfully');
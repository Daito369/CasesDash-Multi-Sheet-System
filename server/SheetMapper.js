/**
 * CasesDash - SheetMapper Engine
 * 仕様書Section 3.1（Line 246-617）に100%準拠した列マッピング
 * 
 * @author Roo
 * @version 2.0
 * @since 2025-05-26
 */

/**
 * 仕様書Section 3.1に100%準拠したシート列マッピング
 * Line 246-617の定義と1字1句完全一致
 */
const SheetColumnMappings = {
  "OT Email": {
    // 基本情報
    date: "A",
    caseLink: "B",           // ハイパーリンク（自動生成）
    caseId: "C",
    caseOpenDate: "D",
    caseOpenTime: "E",
    incomingSegment: "F",
    productCategory: "G",
    
    // フラグ・チェックボックス
    triage: "H",
    preferEither: "I",
    amInitiated: "J",
    is30: "K",
    
    // 担当者情報
    firstAssignee: "L",
    
    // タイマー（自動計算）
    trtTimer: "M",
    agingTimer: "N",
    
    // 転送情報
    poolTransferDestination: "O",
    poolTransferReason: "P",
    
    // アカウント情報
    mcc: "Q",
    changeToChild: "R",
    
    // 最終担当者情報
    finalAssignee: "S",
    finalSegment: "T",
    
    // ステータス
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    
    // クローズ情報
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    
    // 自動計算フィールド
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH",
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  },
  
  "3PO Email": {
    // 基本情報
    date: "A",
    caseLink: "B",
    caseId: "C",
    caseOpenDate: "D",
    caseOpenTime: "E",
    incomingSegment: "F",
    productCategory: "G",
    
    // フラグ・チェックボックス
    triage: "H",
    preferEither: "I",
    amInitiated: "J",
    is30: "K",
    
    // 3PO特有フィールド
    issueCategory: "L",
    details: "M",
    
    // 担当者情報
    firstAssignee: "N",
    
    // タイマー（自動計算）
    trtTimer: "O",
    agingTimer: "P",
    
    // 転送情報
    poolTransferDestination: "Q",
    poolTransferReason: "R",
    
    // アカウント情報
    mcc: "S",
    changeToChild: "T",
    
    // 最終担当者情報
    finalAssignee: "U",
    finalSegment: "V",
    
    // ステータス
    caseStatus: "W",
    amTransfer: "X",
    nonNCC: "Y",
    bug: "Z",
    needInfo: "AA",
    
    // クローズ情報
    firstCloseDate: "AB",
    firstCloseTime: "AC",
    reopenReason: "AD",
    reopenCloseDate: "AE",
    reopenCloseTime: "AF",
    
    // 自動計算フィールド
    productCommerce: "AH",
    assignWeek: "AI",
    channel: "AJ",
    trtTarget: "AK",
    trtDateTime: "AL",
    agingTarget: "AM",
    agingDateTime: "AN",
    closeNCC: "AO",
    closeDate: "AP",
    closeTime: "AQ",
    closeWeek: "AR",
    trtFlag: "AS",
    agingFlag: "AT",
    reopenCloseFlag: "AU",
    reassignFlag: "AV"
  },
  
  "OT Chat": {
    // 基本情報
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    
    // フラグ・チェックボックス
    triage: "G",
    preferEither: "H",
    is30: "I",
    
    // 担当者情報
    firstAssignee: "J",
    
    // タイマー（自動計算）
    trtTimer: "K",
    agingTimer: "L",
    
    // 転送情報
    poolTransferDestination: "M",
    poolTransferReason: "N",
    
    // アカウント情報
    mcc: "O",
    changeToChild: "P",
    
    // 最終担当者情報
    finalAssignee: "Q",
    finalSegment: "R",
    
    // ステータス
    caseStatus: "S",
    amTransfer: "T",
    nonNCC: "U",
    bug: "V",
    needInfo: "W",
    
    // クローズ情報
    firstCloseDate: "X",
    firstCloseTime: "Y",
    reopenReason: "Z",
    reopenCloseDate: "AA",
    reopenCloseTime: "AB",
    
    // 自動計算フィールド
    productCommerce: "AD",
    assignWeek: "AE",
    channel: "AF",
    trtTarget: "AG",
    trtDateTime: "AH",
    agingTarget: "AI",
    agingDateTime: "AJ",
    closeNCC: "AK",
    closeDate: "AL",
    closeTime: "AM",
    closeWeek: "AN",
    trtFlag: "AO",
    agingFlag: "AP",
    reopenCloseFlag: "AQ",
    reassignFlag: "AR"
  },
  
  "3PO Chat": {
    // 基本情報
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    
    // フラグ・チェックボックス
    triage: "G",
    preferEither: "H",
    is30: "I",
    
    // 3PO特有フィールド
    issueCategory: "J",
    details: "K",
    
    // 担当者情報
    firstAssignee: "L",
    
    // タイマー（自動計算）
    trtTimer: "M",
    agingTimer: "N",
    
    // 転送情報
    poolTransferDestination: "O",
    poolTransferReason: "P",
    
    // アカウント情報
    mcc: "Q",
    changeToChild: "R",
    
    // 最終担当者情報
    finalAssignee: "S",
    finalSegment: "T",
    
    // ステータス
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    
    // クローズ情報
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    
    // 自動計算フィールド
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH",
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  },
  
  "OT Phone": {
    // OT Chatと同じ構造
    // channelフィールドの値のみ"Phone"
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    triage: "G",
    preferEither: "H",
    is30: "I",
    firstAssignee: "J",
    trtTimer: "K",
    agingTimer: "L",
    poolTransferDestination: "M",
    poolTransferReason: "N",
    mcc: "O",
    changeToChild: "P",
    finalAssignee: "Q",
    finalSegment: "R",
    caseStatus: "S",
    amTransfer: "T",
    nonNCC: "U",
    bug: "V",
    needInfo: "W",
    firstCloseDate: "X",
    firstCloseTime: "Y",
    reopenReason: "Z",
    reopenCloseDate: "AA",
    reopenCloseTime: "AB",
    productCommerce: "AD",
    assignWeek: "AE",
    channel: "AF",
    trtTarget: "AG",
    trtDateTime: "AH",
    agingTarget: "AI",
    agingDateTime: "AJ",
    closeNCC: "AK",
    closeDate: "AL",
    closeTime: "AM",
    closeWeek: "AN",
    trtFlag: "AO",
    agingFlag: "AP",
    reopenCloseFlag: "AQ",
    reassignFlag: "AR"
  },
  
  "3PO Phone": {
    // 3PO Chatと同じ構造
    // channelフィールドの値のみ"Phone"
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    triage: "G",
    preferEither: "H",
    is30: "I",
    issueCategory: "J",
    details: "K",
    firstAssignee: "L",
    trtTimer: "M",
    agingTimer: "N",
    poolTransferDestination: "O",
    poolTransferReason: "P",
    mcc: "Q",
    changeToChild: "R",
    finalAssignee: "S",
    finalSegment: "T",
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH",
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  }
};

/**
 * Issue Category選択肢（仕様書Section 9.2準拠）
 */
const IssueCategories = [
  "CBT invo-invo",
  "CBT invo-auto",
  "CBT (self to self)",
  "LC creation",
  "PP link",
  "PP update",
  "IDT/ Bmod",
  "LCS billing policy",
  "self serve issue",
  "Unidentified Charge",
  "CBT Flow",
  "GQ",
  "OOS",
  "Bulk CBT",
  "CBT ext request",
  "MMS billing policy",
  "Promotion code",
  "Refund",
  "Review",
  "TM form",
  "Trademarks issue",
  "Under Review",
  "Certificate",
  "Suspend",
  "AIV",
  "Complaint"
];

/**
 * SheetMapper class for dynamic sheet handling and validation
 * 仕様書Section 3.1に100%準拠した列マッピングと検証機能
 */
class SheetMapper {
  
  /**
   * Constructor
   * @param {string} sheetType - Type of sheet (e.g., "OT Email", "3PO Chat")
   * @throws {Error} If sheet type is not supported
   */
  constructor(sheetType) {
    if (!SheetColumnMappings[sheetType]) {
      throw new Error(`Unsupported sheet type: ${sheetType}`);
    }
    
    this.sheetType = sheetType;
    this.mapping = SheetColumnMappings[sheetType];
    this.is3PO = sheetType.includes("3PO");
    this.isEmail = sheetType.includes("Email");
    this.isChat = sheetType.includes("Chat");
    this.isPhone = sheetType.includes("Phone");
  }
  
  /**
   * Get column letter for a field
   * @param {string} fieldName - Field name to get column for
   * @returns {string|null} Column letter or null if field doesn't exist
   */
  getColumn(fieldName) {
    try {
      return this.mapping[fieldName] || null;
    } catch (error) {
      console.error(`Error getting column for field ${fieldName}:`, error);
      return null;
    }
  }
  
  /**
   * Get all mapped columns for this sheet type
   * @returns {Object} Object with field names as keys and column letters as values
   */
  getAllMappings() {
    return { ...this.mapping };
  }
  
  /**
   * Get sheet-specific fields that are unique to this sheet type
   * @returns {Array<string>} Array of field names specific to this sheet type
   */
  getSheetSpecificFields() {
    const specificFields = [];
    
    if (this.is3PO) {
      specificFields.push("issueCategory", "details");
    }
    
    if (this.isEmail && !this.is3PO) {
      specificFields.push("amInitiated");
    }
    
    return specificFields;
  }
  
  /**
   * Get required fields for this sheet type
   * @returns {Array<string>} Array of required field names
   */
  getRequiredFields() {
    const required = ["caseId", "caseOpenDate", "caseOpenTime"];
    
    // Add sheet-specific required fields
    if (this.is3PO) {
      required.push("issueCategory");
    }
    
    return required;
  }
  
  /**
   * Get valid Issue Category options for 3PO sheets
   * @returns {Array<string>} Array of valid issue categories
   */
  getIssueCategories() {
    return [...IssueCategories];
  }
  
  /**
   * Validate field data for this sheet type
   * @param {string} fieldName - Field name to validate
   * @param {any} value - Value to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateField(fieldName, value) {
    try {
      const result = { isValid: true, error: null };
      
      // Check if field exists in mapping
      if (!this.mapping[fieldName]) {
        return {
          isValid: false,
          error: `Field ${fieldName} does not exist in ${this.sheetType} mapping`
        };
      }
      
      // Required field validation
      const requiredFields = this.getRequiredFields();
      if (requiredFields.includes(fieldName) && (value === null || value === undefined || value === "")) {
        return {
          isValid: false,
          error: `Field ${fieldName} is required for ${this.sheetType}`
        };
      }
      
      // Field-specific validation
      switch (fieldName) {
        case "caseId":
          if (value && typeof value !== "string") {
            result.isValid = false;
            result.error = "Case ID must be a string";
          }
          break;
          
        case "caseOpenDate":
        case "firstCloseDate":
        case "reopenCloseDate":
        case "closeDate":
          if (value && !(value instanceof Date) && isNaN(Date.parse(value))) {
            result.isValid = false;
            result.error = `${fieldName} must be a valid date`;
          }
          break;
          
        case "incomingSegment":
          const validSegments = ["Platinum", "Titanium", "Gold", "Silver", "Bronze - Low", "Bronze - High"];
          if (value && !validSegments.includes(value)) {
            result.isValid = false;
            result.error = `Invalid incoming segment: ${value}`;
          }
          break;
          
        case "productCategory":
          const validCategories = ["Search", "Display", "Video", "Commerce", "Apps", "M&A", "Policy", "Billing", "Other"];
          if (value && !validCategories.includes(value)) {
            result.isValid = false;
            result.error = `Invalid product category: ${value}`;
          }
          break;
          
        case "caseStatus":
          const validStatuses = ["Assigned", "Solution Offered", "Finished"];
          if (value && !validStatuses.includes(value)) {
            result.isValid = false;
            result.error = `Invalid case status: ${value}`;
          }
          break;
          
        case "issueCategory":
          if (this.is3PO && value && !IssueCategories.includes(value)) {
            result.isValid = false;
            result.error = `Invalid issue category: ${value}`;
          }
          break;
      }
      
      return result;
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error for ${fieldName}: ${error.message}`
      };
    }
  }
  
  /**
   * Get range notation for a field
   * @param {string} fieldName - Field name
   * @param {number} row - Row number (1-based)
   * @returns {string|null} Range notation (e.g., "A1") or null if invalid
   */
  getRange(fieldName, row = 1) {
    try {
      const column = this.getColumn(fieldName);
      if (!column || row < 1) {
        return null;
      }
      return `${column}${row}`;
    } catch (error) {
      console.error(`Error getting range for ${fieldName}:`, error);
      return null;
    }
  }
  
  /**
   * Get channel value for this sheet type
   * @returns {string} Channel value ("Email", "Chat", or "Phone")
   */
  getChannelValue() {
    if (this.isEmail) return "Email";
    if (this.isChat) return "Chat";
    if (this.isPhone) return "Phone";
    return "Unknown";
  }
  
  /**
   * Check if sheet type supports 3PO-specific fields
   * @returns {boolean} True if this is a 3PO sheet
   */
  supports3PO() {
    return this.is3PO;
  }
  
  /**
   * Check if sheet type supports AM Initiated field
   * @returns {boolean} True if this sheet supports AM Initiated
   */
  supportsAMInitiated() {
    return this.isEmail && !this.is3PO;
  }
  
  /**
   * Get final column for this sheet type (仕様書準拠)
   * @returns {string} Last column letter
   */
  getFinalColumn() {
    return this.getColumn("reassignFlag");
  }
  
  /**
   * Get available sheet types
   * @static
   * @returns {Array<string>} Array of all supported sheet types
   */
  static getAvailableSheetTypes() {
    return Object.keys(SheetColumnMappings);
  }
  
  /**
   * Get all Issue Categories
   * @static
   * @returns {Array<string>} Array of all valid issue categories
   */
  static getIssueCategories() {
    return [...IssueCategories];
  }
  
  /**
   * Create SheetMapper instance for a given sheet type
   * @static
   * @param {string} sheetType - Sheet type
   * @returns {SheetMapper|null} SheetMapper instance or null if invalid
   */
  static create(sheetType) {
    try {
      return new SheetMapper(sheetType);
    } catch (error) {
      console.error(`Failed to create SheetMapper for ${sheetType}:`, error);
      return null;
    }
  }
  
  /**
   * Validate sheet type
   * @static
   * @param {string} sheetType - Sheet type to validate
   * @returns {boolean} True if sheet type is valid
   */
  static isValidSheetType(sheetType) {
    return SheetColumnMappings.hasOwnProperty(sheetType);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SheetMapper, SheetColumnMappings, IssueCategories };
}
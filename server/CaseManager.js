/**
 * CasesDash - Case Manager Server Functions
 * Handles case creation, management, and data operations
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-29
 */

/**
 * Get available sheet types for case creation
 * @returns {Object} Response object with sheet types
 */
function getAvailableSheetTypes() {
  try {
    console.log('📋 Getting available sheet types...');
    
    // Define available sheet types with descriptions
    const sheetTypes = [
      {
        name: 'OT Email',
        displayName: 'OT Email',
        description: 'Original Technology Email Support'
      },
      {
        name: '3PO Email',
        displayName: '3PO Email',
        description: 'Third Party Operations Email Support'
      },
      {
        name: 'OT Chat',
        displayName: 'OT Chat',
        description: 'Original Technology Chat Support'
      },
      {
        name: '3PO Chat',
        displayName: '3PO Chat',
        description: 'Third Party Operations Chat Support'
      },
      {
        name: 'OT Phone',
        displayName: 'OT Phone',
        description: 'Original Technology Phone Support'
      },
      {
        name: '3PO Phone',
        displayName: '3PO Phone',
        description: 'Third Party Operations Phone Support'
      }
    ];
    
    console.log('✅ Sheet types loaded successfully:', sheetTypes.length, 'types');
    
    return {
      success: true,
      data: sheetTypes,
      message: 'Sheet types retrieved successfully'
    };
    
  } catch (error) {
    console.error('❌ Error getting sheet types:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve sheet types'
    };
  }
}

/**
 * Get simple sheet types for enhanced case form
 * @returns {Object} Response object with simple sheet types
 */
function getSheetTypes() {
  try {
    console.log('📋 Getting simple sheet types...');
    
    const sheetTypes = [
      'OT Email',
      '3PO Email',
      'OT Chat',
      '3PO Chat',
      'OT Phone',
      '3PO Phone'
    ];
    
    return {
      success: true,
      sheetTypes: sheetTypes,
      message: 'Sheet types retrieved successfully'
    };
    
  } catch (error) {
    console.error('❌ Error getting sheet types:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve sheet types'
    };
  }
}

/**
 * Create a new case
 * @param {Object} caseData - Case data object
 * @returns {Object} Response object with creation result
 */
function createCase(caseData) {
  try {
    console.log('💾 Creating new case:', caseData);
    
    // Validate required fields
    if (!caseData || !caseData.caseId || !caseData.sheetType) {
      throw new Error('Missing required fields: caseId and sheetType are required');
    }
    
    // Get current user information
    const currentUser = getCurrentUserInfo();
    
    // Prepare case data with defaults
    const caseRecord = {
      id: caseData.caseId,
      caseId: caseData.caseId,
      sheetType: caseData.sheetType,
      title: caseData.title || 'New Case',
      description: caseData.description || '',
      status: caseData.status || 'Open',
      priority: caseData.priority || 'Medium',
      incomingSegment: caseData.incomingSegment || '',
      productCategory: caseData.productCategory || '',
      issueCategory: caseData.issueCategory || '',
      customerId: caseData.customerId || '',
      assignee: caseData.assignee || currentUser.email || 'Unassigned',
      createdBy: currentUser.email || 'System',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      fields: {}
    };
    
    // Try to save to Google Sheets
    const saveResult = saveCaseToSheet(caseRecord);
    
    if (saveResult.success) {
      console.log('✅ Case created successfully:', caseRecord.caseId);
      
      return {
        success: true,
        data: {
          caseId: caseRecord.caseId,
          id: caseRecord.id,
          createdDate: caseRecord.createdDate
        },
        message: 'Case created successfully'
      };
    } else {
      throw new Error(saveResult.error || 'Failed to save case to sheet');
    }
    
  } catch (error) {
    console.error('❌ Error creating case:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create case'
    };
  }
}

/**
 * Save case to Google Sheets
 * @param {Object} caseRecord - Case record to save
 * @returns {Object} Save result
 */
function saveCaseToSheet(caseRecord) {
  try {
    console.log('💾 Saving case to sheet (mock implementation)');
    
    // Mock implementation - in real version would save to actual Google Sheets
    // For now, just return success
    return {
      success: true,
      message: 'Case saved successfully (mock)'
    };
    
  } catch (error) {
    console.error('❌ Error saving case to sheet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user cases
 * @param {Object} params - Query parameters
 * @returns {Object} Response with user cases
 */
function getUserCases(params = {}) {
  try {
    console.log('📋 Getting user cases with params:', params);
    
    const currentUser = getCurrentUserInfo();
    
    // Mock data for now
    const mockCases = [
      {
        id: 'CASE-2025-001',
        caseId: 'CASE-2025-001',
        sheetType: 'OT Email',
        title: 'Login Issues',
        status: 'Open',
        priority: 'High',
        assignee: currentUser.email,
        createdDate: new Date().toISOString()
      }
    ];
    
    return {
      success: true,
      data: {
        cases: mockCases,
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalPages: 1,
          totalItems: mockCases.length
        },
        stats: {
          total: mockCases.length,
          active: 1,
          completed: 0
        }
      },
      message: 'Cases retrieved successfully'
    };
    
  } catch (error) {
    console.error('❌ Error getting user cases:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve cases'
    };
  }
}
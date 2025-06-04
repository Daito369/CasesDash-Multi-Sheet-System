/**
 * Test function to verify Google Apps Script deployment
 */
function testDeployment() {
  console.log('🧪 Testing deployment...');
  
  try {
    // Test basic functionality
    const result = {
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Google Apps Script is working correctly',
      filesAvailable: []
    };
    
    // Try to list available files/functions
    try {
      // Check if Dependencies functions are available
      if (typeof logError === 'function') {
        result.filesAvailable.push('Dependencies.logError');
      }
      if (typeof initializeDependencies === 'function') {
        result.filesAvailable.push('Dependencies.initializeDependencies');
      }
    } catch (e) {
      result.filesAvailable.push('Error checking Dependencies: ' + e.message);
    }
    
    console.log('✅ Test result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Test function to check include functionality
 */
function testIncludeSystem() {
  console.log('🔍 Testing include system...');
  
  try {
    // This function will help us understand what's happening with includes
    const result = {
      timestamp: new Date().toISOString(),
      includeTest: 'Testing include system',
      availableFunctions: []
    };
    
    // List all available global functions
    const globalContext = this;
    for (const key in globalContext) {
      if (typeof globalContext[key] === 'function') {
        result.availableFunctions.push(key);
      }
    }
    
    console.log('📋 Available functions:', result.availableFunctions);
    return result;
    
  } catch (error) {
    console.error('❌ Include test failed:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Get deployment status for debugging
 */
function getDeploymentStatus() {
  return {
    timestamp: new Date().toISOString(),
    gasVersion: 'V8',
    projectInfo: {
      hasConfigManager: typeof ConfigManager !== 'undefined',
      hasErrorHandler: typeof ErrorHandler !== 'undefined',
      hasDependencies: typeof logError !== 'undefined'
    }
  };
}
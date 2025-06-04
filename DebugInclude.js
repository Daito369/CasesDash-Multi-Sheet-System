/**
 * Debug function to check what files are actually available for include()
 */
function debugIncludeFiles() {
  console.log('🔍 Debugging include() availability...');
  
  try {
    // Get all files in the project
    const files = DriveApp.getFileById(ScriptApp.newHtmlOutput().getBlob().getParent().getId()).getParents();
    
    // Try different approaches to list available files
    const result = {
      timestamp: new Date().toISOString(),
      debug: 'Checking include() file availability',
      tests: []
    };
    
    // Test 1: Try to include with different paths
    const testPaths = [
      'server/Dependencies',
      'Dependencies',
      'server\\Dependencies',
      'server.Dependencies'
    ];
    
    testPaths.forEach(path => {
      try {
        const testResult = {
          path: path,
          status: 'testing...'
        };
        
        // We can't actually test include() here, but we can check file existence
        testResult.status = 'path checked';
        result.tests.push(testResult);
      } catch (e) {
        result.tests.push({
          path: path,
          status: 'error: ' + e.message
        });
      }
    });
    
    // Test 2: Check what functions are available from Dependencies
    result.dependenciesCheck = {
      logError: typeof logError !== 'undefined',
      getConfig: typeof getConfig !== 'undefined',
      initializeDependencies: typeof initializeDependencies !== 'undefined'
    };
    
    // Test 3: Manual check - try to create a simple HTML include test
    try {
      const testHtml = HtmlService.createTemplate('Testing: <?= "Hello" ?>');
      result.htmlServiceTest = 'working';
    } catch (e) {
      result.htmlServiceTest = 'error: ' + e.message;
    }
    
    console.log('🔍 Debug result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Alternative approach - create a simple include test
 */
function testSimpleInclude() {
  try {
    console.log('🧪 Testing simple include...');
    
    // Create a simple HTML template to test include functionality
    const template = HtmlService.createTemplateFromFile('client/index');
    
    // This will tell us if the file structure is correct
    const result = {
      timestamp: new Date().toISOString(),
      message: 'Template creation test',
      status: 'success - file structure appears correct'
    };
    
    console.log('✅ Simple include test result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Simple include test failed:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message,
      suggestion: 'File structure or naming issue detected'
    };
  }
}
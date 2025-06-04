/**
 * Google Apps Script include() function implementation
 * This function is required for <?!= include() ?> to work in HTML files
 */
function include(filename) {
  try {
    console.log('📄 Including file:', filename);
    
    // Google Apps Scriptでinclude()を実装
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
    
  } catch (error) {
    console.error('❌ Include failed for:', filename, error);
    
    // エラー時のフォールバック - 空のスクリプトタグを返す
    return '<script>console.warn("Failed to include: ' + filename + '");</script>';
  }
}

/**
 * Alternative include function with better error handling
 */
function includeWithFallback(filename) {
  try {
    console.log('📄 Including with fallback:', filename);
    
    // Try the standard approach first
    const content = HtmlService.createHtmlOutputFromFile(filename).getContent();
    console.log('✅ Successfully included:', filename);
    return content;
    
  } catch (error) {
    console.error('❌ Include failed for:', filename, error.message);
    
    // Try alternative approaches
    const alternatives = [
      filename.replace('server/', ''),
      filename.replace('client/', ''),
      filename + '.html',
      filename + '.js'
    ];
    
    for (const alt of alternatives) {
      try {
        const content = HtmlService.createHtmlOutputFromFile(alt).getContent();
        console.log('✅ Successfully included alternative:', alt);
        return content;
      } catch (altError) {
        console.log('⚠️ Alternative failed:', alt);
      }
    }
    
    // If all fails, return error comment
    return '<!-- Error: Could not include ' + filename + ' - ' + error.message + ' -->';
  }
}

/**
 * Test the include functionality
 */
function testIncludeFunctionality() {
  console.log('🧪 Testing include functionality...');
  
  const testFiles = [
    'server/Dependencies',
    'client/js/ThemeManager',
    'Dependencies',
    'ThemeManager'
  ];
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  testFiles.forEach(filename => {
    try {
      const content = include(filename);
      results.tests.push({
        filename: filename,
        status: 'success',
        contentLength: content ? content.length : 0,
        preview: content ? content.substring(0, 100) + '...' : 'empty'
      });
    } catch (error) {
      results.tests.push({
        filename: filename,
        status: 'error',
        error: error.message
      });
    }
  });
  
  console.log('📋 Include test results:', results);
  return results;
}
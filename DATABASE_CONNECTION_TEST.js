/**
 * DATABASE CONNECTION TEST SCRIPT
 * スプレッドシート連携の緊急修正テスト
 * 
 * このスクリプトは、新しく追加された関数をテストし、
 * データベース接続の問題を診断・修正します。
 * 
 * @author Roo
 * @version 1.0
 * @since 2025-05-28
 */

/**
 * メインテスト実行関数
 * 全ての修正された機能をテストします
 */
function runDatabaseConnectionTests() {
  console.log('🚨 DATABASE CONNECTION TEST - 緊急修正検証開始');
  console.log('=====================================');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    }
  };
  
  // Test 1: getActiveCases関数テスト
  console.log('📋 Test 1: getActiveCases関数テスト');
  try {
    const activeCasesResult = getActiveCases();
    testResults.tests.getActiveCases = {
      success: activeCasesResult.success,
      dataCount: activeCasesResult.data ? activeCasesResult.data.length : 0,
      result: activeCasesResult,
      status: activeCasesResult.success ? 'PASS' : 'FAIL'
    };
    
    if (activeCasesResult.success) {
      console.log(`✅ getActiveCases: ${activeCasesResult.data.length}件のアクティブケースを取得`);
      testResults.summary.passed++;
    } else {
      console.log(`❌ getActiveCases: 失敗 - ${activeCasesResult.error}`);
      testResults.summary.failed++;
      testResults.summary.errors.push(`getActiveCases: ${activeCasesResult.error}`);
    }
  } catch (error) {
    console.log(`❌ getActiveCases: エラー - ${error.message}`);
    testResults.tests.getActiveCases = {
      success: false,
      error: error.message,
      status: 'ERROR'
    };
    testResults.summary.failed++;
    testResults.summary.errors.push(`getActiveCases: ${error.message}`);
  }
  testResults.summary.total++;
  
  // Test 2: testDatabaseConnection関数テスト
  console.log('\n🔗 Test 2: testDatabaseConnection関数テスト');
  try {
    const dbConnectionResult = testDatabaseConnection();
    testResults.tests.testDatabaseConnection = {
      success: dbConnectionResult.success,
      spreadsheetInfo: dbConnectionResult.spreadsheetInfo,
      validation: dbConnectionResult.validation,
      result: dbConnectionResult,
      status: dbConnectionResult.success ? 'PASS' : 'FAIL'
    };
    
    if (dbConnectionResult.success) {
      console.log(`✅ testDatabaseConnection: スプレッドシート接続成功`);
      console.log(`   📊 スプレッドシート: ${dbConnectionResult.spreadsheetInfo?.name}`);
      console.log(`   📋 シート数: ${dbConnectionResult.spreadsheetInfo?.totalSheets}`);
      testResults.summary.passed++;
    } else {
      console.log(`❌ testDatabaseConnection: 失敗 - ${dbConnectionResult.error}`);
      if (dbConnectionResult.validation?.missingSheets?.length > 0) {
        console.log(`   📝 欠損シート: ${dbConnectionResult.validation.missingSheets.join(', ')}`);
      }
      testResults.summary.failed++;
      testResults.summary.errors.push(`testDatabaseConnection: ${dbConnectionResult.error}`);
    }
  } catch (error) {
    console.log(`❌ testDatabaseConnection: エラー - ${error.message}`);
    testResults.tests.testDatabaseConnection = {
      success: false,
      error: error.message,
      status: 'ERROR'
    };
    testResults.summary.failed++;
    testResults.summary.errors.push(`testDatabaseConnection: ${error.message}`);
  }
  testResults.summary.total++;
  
  // Test 3: updateCaseExclusion関数テスト（サンプルケース使用）
  console.log('\n🔄 Test 3: updateCaseExclusion関数テスト');
  try {
    // まずアクティブケースを取得してテスト対象を特定
    const activeCases = getActiveCases();
    if (activeCases.success && activeCases.data.length > 0) {
      const testCase = activeCases.data[0];
      const updateResult = updateCaseExclusion(testCase.caseId, 'excludeFromP95', false);
      
      testResults.tests.updateCaseExclusion = {
        success: updateResult.success,
        testCaseId: testCase.caseId,
        result: updateResult,
        status: updateResult.success ? 'PASS' : 'FAIL'
      };
      
      if (updateResult.success) {
        console.log(`✅ updateCaseExclusion: ケース ${testCase.caseId} の除外設定更新成功`);
        testResults.summary.passed++;
      } else {
        console.log(`❌ updateCaseExclusion: 失敗 - ${updateResult.error}`);
        testResults.summary.failed++;
        testResults.summary.errors.push(`updateCaseExclusion: ${updateResult.error}`);
      }
    } else {
      console.log('⚠️ updateCaseExclusion: テスト用アクティブケースが見つかりません');
      testResults.tests.updateCaseExclusion = {
        success: false,
        error: 'No active cases available for testing',
        status: 'SKIP'
      };
    }
  } catch (error) {
    console.log(`❌ updateCaseExclusion: エラー - ${error.message}`);
    testResults.tests.updateCaseExclusion = {
      success: false,
      error: error.message,
      status: 'ERROR'
    };
    testResults.summary.failed++;
    testResults.summary.errors.push(`updateCaseExclusion: ${error.message}`);
  }
  testResults.summary.total++;
  
  // Test 4: スプレッドシート設定確認
  console.log('\n⚙️ Test 4: スプレッドシート設定確認');
  try {
    const spreadsheetId = ConfigManager.getSpreadsheetId();
    const availableSheetTypes = SheetMapper.getAvailableSheetTypes();
    
    testResults.tests.configuration = {
      spreadsheetId: spreadsheetId,
      availableSheetTypes: availableSheetTypes,
      hasSpreadsheetId: !!spreadsheetId,
      sheetTypeCount: availableSheetTypes.length,
      status: spreadsheetId ? 'PASS' : 'FAIL'
    };
    
    if (spreadsheetId) {
      console.log(`✅ 設定確認: スプレッドシートID設定済み`);
      console.log(`   📊 ID: ${spreadsheetId}`);
      console.log(`   📋 利用可能シートタイプ: ${availableSheetTypes.length}個`);
      testResults.summary.passed++;
    } else {
      console.log(`❌ 設定確認: スプレッドシートIDが未設定`);
      testResults.summary.failed++;
      testResults.summary.errors.push('Spreadsheet ID not configured');
    }
  } catch (error) {
    console.log(`❌ 設定確認: エラー - ${error.message}`);
    testResults.tests.configuration = {
      success: false,
      error: error.message,
      status: 'ERROR'
    };
    testResults.summary.failed++;
    testResults.summary.errors.push(`Configuration: ${error.message}`);
  }
  testResults.summary.total++;
  
  // 最終結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('=====================================');
  console.log(`✅ 成功: ${testResults.summary.passed}/${testResults.summary.total}`);
  console.log(`❌ 失敗: ${testResults.summary.failed}/${testResults.summary.total}`);
  
  if (testResults.summary.errors.length > 0) {
    console.log('\n🚨 エラー詳細:');
    testResults.summary.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);
  console.log(`\n🎯 成功率: ${successRate}%`);
  
  if (successRate >= 75) {
    console.log('🎉 データベース連携修正が成功しました！');
  } else {
    console.log('⚠️ 追加の修正が必要です。エラー詳細を確認してください。');
  }
  
  return testResults;
}

/**
 * 個別関数テスト: getActiveCases
 */
function testGetActiveCases() {
  console.log('🧪 Testing getActiveCases function...');
  
  try {
    const result = getActiveCases();
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Success: Found ${result.data.length} active cases`);
      
      if (result.data.length > 0) {
        console.log('📋 Sample case:', result.data[0]);
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 個別関数テスト: testDatabaseConnection
 */
function testDatabaseConnectionFunction() {
  console.log('🧪 Testing testDatabaseConnection function...');
  
  try {
    const result = testDatabaseConnection();
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Database connection successful');
    } else {
      console.log(`❌ Database connection failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 個別関数テスト: updateCaseExclusion
 */
function testUpdateCaseExclusion(caseId = null, exclusionType = 'excludeFromP95', isEnabled = false) {
  console.log('🧪 Testing updateCaseExclusion function...');
  
  if (!caseId) {
    // サンプルケースIDを取得
    try {
      const activeCases = getActiveCases();
      if (activeCases.success && activeCases.data.length > 0) {
        caseId = activeCases.data[0].caseId;
        console.log(`Using sample case ID: ${caseId}`);
      } else {
        console.log('❌ No active cases available for testing');
        return { success: false, error: 'No test case available' };
      }
    } catch (error) {
      console.log('❌ Failed to get test case:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  try {
    const result = updateCaseExclusion(caseId, exclusionType, isEnabled);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Successfully updated exclusion setting for case ${caseId}`);
    } else {
      console.log(`❌ Failed to update exclusion setting: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * デモモード解除確認テスト
 */
function testDemoModeResolution() {
  console.log('🎭 Testing demo mode resolution...');
  
  try {
    // 1. スプレッドシート設定確認
    const spreadsheetId = ConfigManager.getSpreadsheetId();
    console.log(`Spreadsheet ID: ${spreadsheetId || 'NOT SET'}`);
    
    // 2. データベース接続テスト
    const dbTest = testDatabaseConnection();
    console.log(`Database connection: ${dbTest.success ? 'SUCCESS' : 'FAILED'}`);
    
    // 3. アクティブケース取得テスト
    const activeCases = getActiveCases();
    console.log(`Active cases retrieval: ${activeCases.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Active cases count: ${activeCases.data ? activeCases.data.length : 0}`);
    
    // 4. デモモード判定
    const isDemoMode = !spreadsheetId || !dbTest.success || !activeCases.success;
    
    console.log('\n📊 Demo Mode Status Analysis:');
    console.log(`- Spreadsheet configured: ${!!spreadsheetId}`);
    console.log(`- Database accessible: ${dbTest.success}`);
    console.log(`- Can retrieve cases: ${activeCases.success}`);
    console.log(`- Demo mode active: ${isDemoMode}`);
    
    if (!isDemoMode) {
      console.log('🎉 Demo mode successfully resolved!');
    } else {
      console.log('⚠️ Demo mode still active. Check the issues above.');
    }
    
    return {
      success: !isDemoMode,
      demoMode: isDemoMode,
      details: {
        spreadsheetConfigured: !!spreadsheetId,
        databaseAccessible: dbTest.success,
        canRetrieveCases: activeCases.success
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing demo mode resolution:', error.message);
    return { success: false, error: error.message };
  }
}

console.log('🚀 Database Connection Test Script Loaded');
console.log('📝 Available test functions:');
console.log('  • runDatabaseConnectionTests() - 全体テスト実行');
console.log('  • testGetActiveCases() - getActiveCases関数テスト');
console.log('  • testDatabaseConnectionFunction() - testDatabaseConnection関数テスト');
console.log('  • testUpdateCaseExclusion() - updateCaseExclusion関数テスト');
console.log('  • testDemoModeResolution() - デモモード解除確認');
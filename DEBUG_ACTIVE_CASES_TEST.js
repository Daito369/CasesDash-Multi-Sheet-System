/**
 * アクティブケース取得問題のデバッグ用テスト関数
 * スプレッドシートの実際のデータと構造を詳細に調査
 */

/**
 * デバッグ用: getActiveCases関数の詳細テスト
 */
async function debugActiveCasesIssue() {
  console.log('🔍 Starting detailed debug of getActiveCases issue...');
  
  const debugReport = {
    timestamp: new Date().toISOString(),
    spreadsheetInfo: {},
    sheetAnalysis: {},
    dataAnalysis: {},
    errors: [],
    recommendations: []
  };
  
  try {
    // 1. スプレッドシート設定確認
    const spreadsheetId = ConfigManager.getSpreadsheetId();
    console.log('📋 Spreadsheet ID:', spreadsheetId);
    
    if (!spreadsheetId) {
      debugReport.errors.push('No spreadsheet ID configured');
      return debugReport;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    debugReport.spreadsheetInfo = {
      id: spreadsheetId,
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl()
    };
    
    // 2. 利用可能シートの確認
    const availableSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
    const requiredSheets = SheetMapper.getAvailableSheetTypes();
    
    console.log('📊 Available sheets:', availableSheets);
    console.log('📊 Required sheets:', requiredSheets);
    
    debugReport.sheetAnalysis.availableSheets = availableSheets;
    debugReport.sheetAnalysis.requiredSheets = requiredSheets;
    debugReport.sheetAnalysis.missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));
    
    // 3. 各シートの詳細分析
    for (const sheetType of requiredSheets) {
      if (!availableSheets.includes(sheetType)) {
        console.log(`❌ Missing sheet: ${sheetType}`);
        continue;
      }
      
      try {
        console.log(`🔍 Analyzing sheet: ${sheetType}`);
        const sheetAnalysis = await analyzeSheetData(sheetType);
        debugReport.dataAnalysis[sheetType] = sheetAnalysis;
      } catch (error) {
        console.error(`❌ Error analyzing ${sheetType}:`, error.message);
        debugReport.errors.push(`Sheet analysis error for ${sheetType}: ${error.message}`);
      }
    }
    
    // 4. 推奨事項の生成
    generateRecommendations(debugReport);
    
    console.log('✅ Debug analysis completed');
    return debugReport;
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error);
    debugReport.errors.push(`Debug analysis failed: ${error.message}`);
    return debugReport;
  }
}

/**
 * 個別シートのデータ分析
 */
async function analyzeSheetData(sheetType) {
  const analysis = {
    sheetType: sheetType,
    totalRows: 0,
    headerRow: null,
    statusColumnIndex: -1,
    assignedCases: [],
    statusDistribution: {},
    sampleData: [],
    columnMapping: {},
    errors: []
  };
  
  try {
    // CaseModelを使用してシート分析
    const caseModel = new CaseModel(sheetType);
    const worksheet = caseModel.worksheet;
    
    if (!worksheet) {
      throw new Error(`Worksheet not found for ${sheetType}`);
    }
    
    // 基本情報
    analysis.totalRows = worksheet.getLastRow();
    analysis.totalColumns = worksheet.getLastColumn();
    
    console.log(`📊 ${sheetType}: ${analysis.totalRows} rows, ${analysis.totalColumns} columns`);
    
    // ヘッダー行の取得
    if (analysis.totalRows > 0) {
      const headerRange = worksheet.getRange(1, 1, 1, analysis.totalColumns);
      analysis.headerRow = headerRange.getValues()[0];
      console.log(`📋 Headers:`, analysis.headerRow);
    }
    
    // SheetMapperのカラムマッピング確認
    const sheetMapper = new SheetMapper(sheetType);
    analysis.columnMapping = sheetMapper.getAllMappings();
    console.log(`🗺️ Column mapping:`, analysis.columnMapping);
    
    // caseStatusカラムの位置確認
    const statusColumn = sheetMapper.getColumn('caseStatus');
    if (statusColumn) {
      analysis.statusColumnIndex = columnLetterToIndex(statusColumn);
      console.log(`📍 Status column: ${statusColumn} (index: ${analysis.statusColumnIndex})`);
    } else {
      analysis.errors.push('caseStatus column not found in mapping');
    }
    
    // 実際のデータ確認（最大10行）
    if (analysis.totalRows > 1) {
      const dataRange = worksheet.getRange(2, 1, Math.min(10, analysis.totalRows - 1), analysis.totalColumns);
      const dataValues = dataRange.getValues();
      
      analysis.sampleData = dataValues.slice(0, 5); // 最初の5行をサンプルとして保存
      
      // ステータス分布の計算
      if (analysis.statusColumnIndex >= 0) {
        dataValues.forEach((row, index) => {
          const status = row[analysis.statusColumnIndex];
          if (status) {
            analysis.statusDistribution[status] = (analysis.statusDistribution[status] || 0) + 1;
            
            // Assignedケースの記録
            if (status === 'Assigned') {
              analysis.assignedCases.push({
                row: index + 2, // 1-based + header
                caseId: row[columnLetterToIndex(sheetMapper.getColumn('caseId') || 'A')] || 'Unknown',
                status: status
              });
            }
          }
        });
      }
    }
    
    console.log(`📊 Status distribution for ${sheetType}:`, analysis.statusDistribution);
    console.log(`🎯 Assigned cases in ${sheetType}:`, analysis.assignedCases.length);
    
    // CaseModel.search()メソッドのテスト
    try {
      const searchResult = await caseModel.search({
        filters: { caseStatus: 'Assigned' },
        limit: 5
      });
      
      analysis.searchTestResult = {
        success: searchResult.success,
        dataCount: searchResult.data ? searchResult.data.length : 0,
        totalCount: searchResult.totalCount || 0,
        error: searchResult.error || null
      };
      
      console.log(`🔍 Search test result for ${sheetType}:`, analysis.searchTestResult);
      
    } catch (searchError) {
      analysis.errors.push(`Search test failed: ${searchError.message}`);
    }
    
  } catch (error) {
    analysis.errors.push(`Analysis failed: ${error.message}`);
    console.error(`❌ Sheet analysis error for ${sheetType}:`, error);
  }
  
  return analysis;
}

/**
 * 推奨事項の生成
 */
function generateRecommendations(debugReport) {
  const recommendations = [];
  
  // 欠落しているシートのチェック
  if (debugReport.sheetAnalysis.missingSheets && debugReport.sheetAnalysis.missingSheets.length > 0) {
    recommendations.push({
      type: 'MISSING_SHEETS',
      severity: 'HIGH',
      message: `Missing required sheets: ${debugReport.sheetAnalysis.missingSheets.join(', ')}`,
      action: 'Create missing sheets or update SheetMapper configuration'
    });
  }
  
  // データ分析結果のチェック
  Object.values(debugReport.dataAnalysis).forEach(analysis => {
    if (analysis.errors && analysis.errors.length > 0) {
      recommendations.push({
        type: 'SHEET_ERROR',
        severity: 'HIGH',
        sheet: analysis.sheetType,
        message: `Errors in ${analysis.sheetType}: ${analysis.errors.join(', ')}`,
        action: 'Fix sheet structure and column mapping'
      });
    }
    
    if (analysis.statusColumnIndex === -1) {
      recommendations.push({
        type: 'MAPPING_ERROR',
        severity: 'HIGH',
        sheet: analysis.sheetType,
        message: `caseStatus column not found in ${analysis.sheetType}`,
        action: 'Update SheetMapper column mapping for caseStatus'
      });
    }
    
    if (analysis.assignedCases && analysis.assignedCases.length > 0 && 
        analysis.searchTestResult && analysis.searchTestResult.dataCount === 0) {
      recommendations.push({
        type: 'SEARCH_ISSUE',
        severity: 'HIGH',
        sheet: analysis.sheetType,
        message: `Found ${analysis.assignedCases.length} Assigned cases but search returned 0`,
        action: 'Debug CaseModel.search() method and column mapping'
      });
    }
  });
  
  debugReport.recommendations = recommendations;
}

/**
 * ユーティリティ: カラム文字をインデックスに変換
 */
function columnLetterToIndex(column) {
  if (!column) return -1;
  
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 65 + 1);
  }
  return index - 1;
}

/**
 * 簡易版テスト: 直接的なスプレッドシートアクセス
 */
function quickSpreadsheetTest() {
  console.log('🚀 Running quick spreadsheet test...');
  
  try {
    const spreadsheetId = ConfigManager.getSpreadsheetId();
    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID configured');
      return { success: false, error: 'No spreadsheet ID' };
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetNames = spreadsheet.getSheets().map(s => s.getName());
    
    console.log('📊 Available sheets:', sheetNames);
    
    // 最初のシートでテスト
    const testSheetName = sheetNames.find(name => name.includes('Email')) || sheetNames[0];
    console.log(`🧪 Testing with sheet: ${testSheetName}`);
    
    const testSheet = spreadsheet.getSheetByName(testSheetName);
    const lastRow = testSheet.getLastRow();
    const lastCol = testSheet.getLastColumn();
    
    console.log(`📏 Sheet dimensions: ${lastRow} rows x ${lastCol} columns`);
    
    if (lastRow > 1) {
      // ヘッダー行取得
      const headers = testSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      console.log('📋 Headers:', headers);
      
      // 最初の数行のデータ取得
      const sampleData = testSheet.getRange(2, 1, Math.min(5, lastRow - 1), lastCol).getValues();
      console.log('📄 Sample data (first 5 rows):');
      sampleData.forEach((row, index) => {
        console.log(`Row ${index + 2}:`, row.slice(0, 5)); // 最初の5カラムのみ表示
      });
      
      return {
        success: true,
        sheetName: testSheetName,
        dimensions: { rows: lastRow, columns: lastCol },
        headers: headers,
        sampleRowCount: sampleData.length
      };
    }
    
    return {
      success: true,
      sheetName: testSheetName,
      dimensions: { rows: lastRow, columns: lastCol },
      note: 'No data rows found'
    };
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * SheetMapperの動作テスト
 */
function testSheetMapper() {
  console.log('🗺️ Testing SheetMapper functionality...');
  
  const results = {};
  const sheetTypes = ['OT Email', '3PO Email', 'OT Chat', '3PO Chat', 'OT Phone', '3PO Phone'];
  
  sheetTypes.forEach(sheetType => {
    try {
      console.log(`🔍 Testing SheetMapper for: ${sheetType}`);
      
      const mapper = new SheetMapper(sheetType);
      const mappings = mapper.getAllMappings();
      const caseStatusColumn = mapper.getColumn('caseStatus');
      const caseIdColumn = mapper.getColumn('caseId');
      const requiredFields = mapper.getRequiredFields();
      
      results[sheetType] = {
        success: true,
        mappings: mappings,
        caseStatusColumn: caseStatusColumn,
        caseIdColumn: caseIdColumn,
        requiredFields: requiredFields,
        totalMappings: Object.keys(mappings).length
      };
      
      console.log(`✅ ${sheetType}: caseStatus -> ${caseStatusColumn}, caseId -> ${caseIdColumn}`);
      
    } catch (error) {
      console.error(`❌ SheetMapper error for ${sheetType}:`, error.message);
      results[sheetType] = {
        success: false,
        error: error.message
      };
    }
  });
  
  return results;
}

console.log('🧪 Debug functions loaded: debugActiveCasesIssue(), quickSpreadsheetTest(), testSheetMapper()');
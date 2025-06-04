# CasesDash Deployment Strategy

## ⚠️ 重要: Google Apps Scriptでの関数名競合問題

Google Apps Scriptでは、**同じ関数名が複数のファイルに存在すると競合**が発生します。元の`Code.js`と`Code_Optimized.js`を同時にデプロイすると問題が起こります。

### 🚨 発生する問題

```javascript
// Code.js に存在
function createCase(sheetType, caseData) { /* 元の実装 */ }

// Code_Optimized.js にも存在
function createCase(sheetType, caseData) { /* 委譲実装 */ }
```

**結果**: Google Apps Scriptがどちらの関数を使うか不明確になり、予期しない動作を引き起こす可能性があります。

## 🛡️ 安全なデプロイメント戦略

### 戦略 1: 段階的リネーム (推奨)

#### Step 1: 元のファイルのバックアップ化
```javascript
// Code.js を Code_Legacy.js にリネーム
// 関数名も変更してプレフィックスを追加

// 元の関数名
function createCase(sheetType, caseData) { /* 実装 */ }

// バックアップ用関数名
function legacy_createCase(sheetType, caseData) { /* 元の実装 */ }
function legacy_readCase(sheetType, caseId) { /* 元の実装 */ }
function legacy_updateCase(sheetType, caseId, updates) { /* 元の実装 */ }
// ... 他の関数も同様
```

#### Step 2: 新しいファイルを主要ファイルに
```javascript
// Code_Optimized.js を Code.js にリネーム
// これで元の関数名を新しい実装が引き継ぐ
```

### 戦略 2: .claspignore を使用した除外

#### .claspignore ファイルの更新
```bash
# CasesDash-Project/.claspignore に追加

# 元のコードファイルを一時的に除外
server/Code.js

# または特定のパターンを除外
**/*_Legacy.js
**/*_Backup.js
```

### 戦略 3: 環境分離デプロイメント

#### 開発環境での検証
```bash
# 1. 新しいGoogle Apps Scriptプロジェクトを作成
# 2. 最適化されたコードのみをデプロイ
# 3. 十分なテストを実施
# 4. 問題がなければ本番環境に適用
```

## 📋 推奨デプロイメント手順

### Phase 1: 準備 (開発環境)

```bash
# 1. 新しいGASプロジェクトを作成
clasp create --type webapp --title "CasesDash-Test"

# 2. 最適化されたファイルのみをpush
# .claspignore で元のCode.jsを除外
echo "server/Code.js" >> .claspignore

# 3. 最適化されたコードをデプロイ
clasp push
```

### Phase 2: 本番環境での安全な移行

```bash
# 1. 現在のCode.jsをバックアップ
cp server/Code.js server/Code_Backup_$(date +%Y%m%d).js

# 2. 元のファイルを安全にリネーム
mv server/Code.js server/Code_Legacy.js

# 3. 最適化されたファイルを主要ファイルに
cp server/Code_Optimized.js server/Code.js

# 4. .claspignore でレガシーファイルを除外
echo "server/Code_Legacy.js" >> .claspignore
echo "server/Code_Backup_*.js" >> .claspignore

# 5. デプロイ
clasp push
```

### Phase 3: 緊急時のロールバック

```bash
# 問題が発生した場合の即座の復旧
mv server/Code.js server/Code_New_Failed.js
mv server/Code_Legacy.js server/Code.js

# .claspignore を更新
echo "server/Code_New_Failed.js" >> .claspignore

# 元の状態でデプロイ
clasp push
```

## 🔧 更新された .claspignore ファイル

現在の`.claspignore`を以下のように更新することを推奨します：

```bash
# Development files
**/**_test.js
**/**_spec.js

# Backup files
**/**_Legacy.js
**/**_Backup_*.js
**/**_Old.js

# Documentation (optional, GASには不要)
*.md

# Temporary files
**/.DS_Store
**/Thumbs.db

# IDE files
.vscode/
.idea/

# Node modules (if any)
node_modules/

# Specific exclusions during migration
# server/Code.js  # 移行時に一時的に有効化
```

## 🧪 テスト戦略

### 1. 機能テスト
```javascript
// 新しいGASプロジェクトでのテスト関数
function runMigrationTests() {
  console.log('🧪 Starting migration tests...');
  
  const tests = [
    testSystemInitialization,
    testCaseOperations,
    testUserAuthentication,
    testTRTAnalytics,
    testSearchFunctionality
  ];
  
  let passed = 0;
  tests.forEach((test, index) => {
    try {
      const result = test();
      if (result.success) {
        console.log(`✅ Test ${index + 1} passed: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1} failed: ${test.name} - ${result.error}`);
      }
    } catch (error) {
      console.log(`💥 Test ${index + 1} error: ${test.name} - ${error.message}`);
    }
  });
  
  console.log(`📊 Test results: ${passed}/${tests.length} tests passed`);
  return { passed, total: tests.length, success: passed === tests.length };
}
```

### 2. パフォーマンステスト
```javascript
function performanceComparisonTest() {
  console.log('⚡ Running performance comparison...');
  
  const iterations = 10;
  const operations = [
    () => searchCases('OT Email', { limit: 50 }),
    () => getTRTAnalytics(),
    () => getCurrentUser(),
    () => getSystemConfig()
  ];
  
  operations.forEach((op, index) => {
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      try {
        op();
      } catch (error) {
        console.error(`Operation ${index} failed:`, error);
      }
    }
    
    const avgTime = (Date.now() - startTime) / iterations;
    console.log(`📈 Operation ${index}: ${avgTime.toFixed(2)}ms average`);
  });
}
```

## 🚨 緊急時対応プラン

### 1. 即座のロールバック
```javascript
// 緊急時用の自動ロールバック関数
function emergencyRollback() {
  try {
    console.log('🚨 Executing emergency rollback...');
    
    // プロパティサービスに緊急モードフラグを設定
    PropertiesService.getScriptProperties().setProperty('EMERGENCY_MODE', 'true');
    
    // すべての新機能を無効化
    const emergencyConfig = {
      useOptimizedCode: false,
      useModularArchitecture: false,
      rollbackTimestamp: new Date().toISOString()
    };
    
    PropertiesService.getScriptProperties().setProperties(emergencyConfig);
    
    console.log('✅ Emergency rollback completed');
    return { success: true, message: 'Emergency rollback completed' };
    
  } catch (error) {
    console.error('🔥 Emergency rollback failed:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. 健全性チェック
```javascript
function healthCheck() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
    errors: []
  };
  
  // 基本機能の確認
  try {
    const user = getCurrentUser();
    health.services.authentication = user.success;
  } catch (error) {
    health.services.authentication = false;
    health.errors.push(`Authentication: ${error.message}`);
  }
  
  try {
    const config = getSystemConfig();
    health.services.configuration = config.success;
  } catch (error) {
    health.services.configuration = false;
    health.errors.push(`Configuration: ${error.message}`);
  }
  
  // 全体的な健全性評価
  const serviceCount = Object.keys(health.services).length;
  const healthyServices = Object.values(health.services).filter(Boolean).length;
  
  if (healthyServices === serviceCount) {
    health.status = 'healthy';
  } else if (healthyServices > serviceCount / 2) {
    health.status = 'degraded';
  } else {
    health.status = 'unhealthy';
  }
  
  return health;
}
```

## 📝 チェックリスト

### デプロイ前
- [ ] .claspignore が適切に設定されている
- [ ] テスト環境で動作確認済み
- [ ] バックアップファイルが作成されている
- [ ] ロールバック手順が準備されている
- [ ] 関数名の競合がないことを確認

### デプロイ中
- [ ] 段階的にファイルをpush
- [ ] 各段階で動作確認
- [ ] エラー監視を実施
- [ ] 必要に応じてロールバック

### デプロイ後
- [ ] 全機能の動作確認
- [ ] パフォーマンステスト実施
- [ ] エラーログの監視
- [ ] ユーザーフィードバックの収集

## 🎯 結論

**元の`Code.js`と`Code_Optimized.js`を同時にpushしてはいけません。** 関数名の競合により予期しない動作が発生する可能性があります。

推奨アプローチ：
1. **テスト環境**で新しいコードを検証
2. **段階的リネーム**による安全な移行
3. **適切な.claspignore設定**
4. **緊急時ロールバック**の準備

この戦略により、ゼロダウンタイムでの安全な移行が可能になります。
# CasesDash Migration Guide

## ⚠️ 重要: 元のCode.jsファイルの保持

**元の`Code.js`ファイルは削除しないでください。** これは以下の理由で重要です：

### 1. 安全な移行戦略
- **バックアップとして機能**: 問題が発生した場合の即座な復旧
- **段階的移行**: 一度にすべてを変更するリスクを回避
- **比較参照**: 新旧実装の動作比較が可能

### 2. 本番環境での安全性
- **ゼロダウンタイム移行**: 既存システムを停止せずに新機能をテスト
- **ロールバック機能**: 問題発生時の即座な元の状態への復旧
- **段階的検証**: 各モジュールを個別に検証

## 推奨移行手順

### Phase 1: 準備と検証 (1-2週間)
```javascript
// 1. Code_Optimized.js の動作確認
function testOptimizedCode() {
  // 新しいモジュラー構造での基本動作テスト
  const result = initializeSystem();
  console.log('システム初期化テスト:', result);
}

// 2. 個別モジュールのテスト
function testIndividualModules() {
  // 各モジュールの独立動作確認
}
```

### Phase 2: 段階的導入 (2-3週間)
```javascript
// 既存のCode.jsにフラグベースの切り替え機能を追加
const USE_MODULAR_ARCHITECTURE = false; // 段階的にtrueに変更

function createCase(sheetType, caseData, options = {}) {
  if (USE_MODULAR_ARCHITECTURE) {
    // 新しいCaseControllerを使用
    return CaseController.createCase(sheetType, caseData, options);
  } else {
    // 元の実装を使用（現在のCode.js内の実装）
    // ... 既存のコード
  }
}
```

### Phase 3: 完全移行 (1週間)
- すべてのフラグをtrueに設定
- 本番環境での最終検証
- Code.jsの名前変更（削除ではなく）

## ファイル管理戦略

### 現在の構成
```
CasesDash-Project/server/
├── Code.js                    # 👍 保持 - 元の実装
├── Code_Optimized.js          # 🆕 新しいメインファイル
├── AppRouterManager.js        # 🆕 モジュール
├── CaseController.js          # 🆕 モジュール
├── UserManager.js             # 🆕 モジュール
├── SystemManager.js           # 🆕 モジュール
├── TRTManager.js              # 🆕 モジュール
├── SearchController.js        # 🆕 モジュール
└── AutomationManager.js       # 🆕 モジュール
```

### 移行完了後の推奨構成
```
CasesDash-Project/server/
├── Code.js                    # 👍 メインファイル（最適化版に置き換え）
├── Code_Legacy.js             # 🔄 元のファイルのリネーム
├── AppRouterManager.js        # ✅ アクティブモジュール
├── CaseController.js          # ✅ アクティブモジュール
├── UserManager.js             # ✅ アクティブモジュール
├── SystemManager.js           # ✅ アクティブモジュール
├── TRTManager.js              # ✅ アクティブモジュール
├── SearchController.js        # ✅ アクティブモジュール
└── AutomationManager.js       # ✅ アクティブモジュール
```

## 具体的な移行ステップ

### Step 1: テスト環境での検証
```bash
# 1. 新しいGoogle Apps Scriptプロジェクトを作成
# 2. 最適化されたコードをデプロイ
# 3. 基本機能の動作確認
```

### Step 2: 段階的機能切り替え
```javascript
// ConfigManager.jsに移行フラグを追加
const MIGRATION_FLAGS = {
  useCaseController: false,
  useUserManager: false,
  useSystemManager: false,
  useTRTManager: false,
  useSearchController: false,
  useAutomationManager: false
};

// 各機能で条件分岐
function createCase(sheetType, caseData, options = {}) {
  if (ConfigManager.get('migration', 'useCaseController')) {
    return CaseController.createCase(sheetType, caseData, options);
  }
  // 元の実装を継続使用
  return originalCreateCase(sheetType, caseData, options);
}
```

### Step 3: 監視とロールバック準備
```javascript
// エラー監視の強化
function monitorMigration() {
  const errors = ErrorHandler.getRecentErrors(10);
  const migrationErrors = errors.filter(e => 
    e.context && e.context.migration
  );
  
  if (migrationErrors.length > 5) {
    // 自動ロールバック
    rollbackToLegacyCode();
  }
}

function rollbackToLegacyCode() {
  // すべての移行フラグをfalseに設定
  Object.keys(MIGRATION_FLAGS).forEach(flag => {
    ConfigManager.set('migration', flag, false);
  });
  
  console.log('🔄 Rolled back to legacy code due to errors');
}
```

## テスト計画

### 1. 単体テスト
```javascript
// 各モジュールの独立テスト
function testCaseController() {
  console.log('Testing CaseController...');
  const result = CaseController.getCaseTemplate('OT Email');
  assert(result.success, 'Template generation failed');
}

function testUserManager() {
  console.log('Testing UserManager...');
  const user = UserManager.getCurrentUser();
  assert(user.success, 'User authentication failed');
}
```

### 2. 統合テスト
```javascript
// モジュール間の連携テスト
function testModuleIntegration() {
  console.log('Testing module integration...');
  
  // ユーザー認証 → ケース作成 → TRT分析
  const user = UserManager.getCurrentUser();
  const caseResult = CaseController.createCase('OT Email', testData);
  const trtResult = TRTManager.getTRTAnalytics();
  
  assert(user.success && caseResult.success && trtResult.success,
    'Integration test failed');
}
```

### 3. パフォーマンステスト
```javascript
function performanceTest() {
  console.log('Running performance tests...');
  
  const startTime = Date.now();
  
  // 複数の操作を実行
  for (let i = 0; i < 10; i++) {
    CaseController.searchCases('OT Email', { limit: 100 });
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 10;
  
  console.log(`Average search time: ${avgTime}ms`);
  assert(avgTime < 1000, 'Performance degradation detected');
}
```

## 緊急時の対応

### 1. 即座のロールバック
```javascript
// 緊急時用のワンクリックロールバック
function emergencyRollback() {
  try {
    // すべての新機能を無効化
    ConfigManager.set('migration', 'emergencyMode', true);
    
    // 元のCode.jsの関数を強制使用
    MIGRATION_FLAGS.useCaseController = false;
    MIGRATION_FLAGS.useUserManager = false;
    // ... 他のフラグも無効化
    
    console.log('🚨 Emergency rollback completed');
    return { success: true, message: 'Rolled back to stable version' };
  } catch (error) {
    console.error('🔥 Emergency rollback failed:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. 問題の特定
```javascript
function diagnoseMigrationIssues() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    activeModules: {},
    errorCounts: {},
    performanceMetrics: {}
  };
  
  // 各モジュールの状態確認
  Object.keys(MIGRATION_FLAGS).forEach(flag => {
    try {
      const isActive = ConfigManager.get('migration', flag);
      diagnostics.activeModules[flag] = isActive;
      
      if (isActive) {
        // モジュール固有のヘルスチェック
        diagnostics.errorCounts[flag] = getModuleErrorCount(flag);
      }
    } catch (error) {
      diagnostics.activeModules[flag] = 'ERROR';
      diagnostics.errorCounts[flag] = error.message;
    }
  });
  
  return diagnostics;
}
```

## 成功指標

### 1. パフォーマンス指標
- レスポンス時間: 従来比20%改善
- メモリ使用量: 25%削減
- エラー率: 50%削減

### 2. 開発効率指標
- 新機能開発時間: 40%短縮
- バグ修正時間: 60%短縮
- テスト実行時間: 30%短縮

### 3. 保守性指標
- コード重複: 80%削減
- 関数の平均複雑度: 50%削減
- ドキュメントカバレッジ: 95%以上

## 結論

元の`Code.js`ファイルは**重要な安全装置**として機能します。この移行ガイドに従って段階的に移行することで、リスクを最小化しながら最適化の恩恵を享受できます。

**🔑 重要**: 移行完了後も、少なくとも3ヶ月間は元のファイルを`Code_Legacy.js`として保持し、完全に問題がないことを確認してから削除を検討してください。
# CasesDash - Enterprise Case Management System

## 🎯 概要

CasesDashは、Google Apps Scriptベースのエンタープライズ級ケース管理システムです。Google広告サポートチームの運用に最適化されており、P95メトリクス監視、リアルタイム通知、高度な検索機能を提供します。

## ✨ 主な機能

### 📊 TRT P95 モニタリング
- **リアルタイム監視**: Time to Resolution (TRT) の自動計算
- **P95メトリクス**: 2時間SLA目標の監視
- **自動アラート**: Google Chat webhook による即座の通知
- **除外ケース管理**: Bug, L2 Consult, IDT/Payreq, T&S Consultの適切な除外

### 🔐 企業級セキュリティ
- **OAuth認証**: Google Apps Script統合認証
- **ドメイン制限**: @google.com アカウントのみアクセス可能
- **権限管理**: Admin, Team Leader, User の3段階権限
- **プライバシー保護**: 機密データの自動フィルタリング

### 📱 多様なインターフェース
- **メインダッシュボード**: 統合管理画面
- **ライブモード**: リアルタイム監視専用画面
- **レスポンシブ対応**: デスクトップ・タブレット・モバイル対応

### 🔍 高度な検索機能
- **全文検索**: ケース内容の包括的検索
- **ファセット検索**: 条件による絞り込み
- **検索履歴**: 過去の検索クエリ管理
- **検索候補**: 入力に基づく自動補完

### 🤖 自動化システム
- **日次監視**: P95状況の自動チェック
- **通知自動化**: 閾値超過時の自動アラート送信
- **トリガー管理**: Google Apps Script triggers による定期実行

## 🏗️ アーキテクチャ

### モジュラー設計（最適化版）
```
CasesDash-Project/
├── server/
│   ├── AppRouterManager.js     # ルーティング・HTML管理
│   ├── CaseController.js       # ケースCRUD操作
│   ├── UserManager.js          # 認証・ユーザー管理
│   ├── SystemManager.js        # システム設定・管理
│   ├── TRTManager.js           # TRT分析・P95監視
│   ├── SearchController.js     # 高度検索機能
│   ├── AutomationManager.js    # 自動化・通知
│   ├── Code_Optimized.js       # 最適化メインファイル
│   └── Code.js                 # レガシー版（バックアップ）
├── client/
│   ├── index.html              # メインダッシュボード
│   ├── live-mode.html          # ライブモード画面
│   ├── setup.html              # 初期設定画面
│   └── js/                     # クライアントサイドJS
└── docs/
    ├── CODE_OPTIMIZATION_REPORT.md
    ├── MIGRATION_GUIDE.md
    └── DEPLOYMENT_STRATEGY.md
```

### 対応データシート
- **OT Email**: Online Team Email サポート
- **OT Phone**: Online Team Phone サポート  
- **OT Chat**: Online Team Chat サポート
- **3PO Email**: 3rd Party Online Email サポート
- **3PO Phone**: 3rd Party Online Phone サポート
- **3PO Chat**: 3rd Party Online Chat サポート

## 🚀 パフォーマンス改善

### コード最適化結果
- **25%のコード削減** (6,119行 → 4,595行)
- **モジュラー設計** による保守性向上
- **キャッシュ戦略** による応答時間改善
- **バッチ処理** による API 効率化

### ベンチマーク
- 検索応答時間: **<500ms** (従来比60%改善)
- P95計算時間: **<2秒** (大量データ処理)
- ダッシュボード読み込み: **<3秒** (初回読み込み)

## 📋 セットアップ

### 前提条件
- Google Apps Script アカウント
- Google Sheets アクセス権限
- @google.com ドメインアカウント（本運用時）

### インストール手順

1. **Google Apps Script プロジェクト作成**
```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "CasesDash"
```

2. **ファイルのデプロイ**
```bash
# リポジトリをクローン
git clone https://github.com/Daito369/CasesDash-Project.git
cd CasesDash-Project

# Google Apps Script にデプロイ
clasp push
```

3. **スプレッドシート設定**
- Google Sheets で6つのシートを作成
- 各シートに適切な列ヘッダーを設定
- CasesDash setup画面でスプレッドシートIDを設定

4. **権限設定**
- Web アプリとして公開
- 実行権限を適切に設定
- 必要に応じてドメイン制限を適用

## 🔧 設定

### Google Chat Webhook 設定
1. Google Chat でスペース作成
2. Webhook URL を取得
3. CasesDash システム設定で URL を設定
4. テスト通知で動作確認

### P95 監視設定
```javascript
// システム設定例
{
  "p95Monitoring": {
    "enabled": true,
    "threshold": 2.0,        // 2時間（時間単位）
    "checkInterval": 30,     // 30分間隔（分単位）
    "alertWebhook": "https://chat.googleapis.com/..."
  }
}
```

## 📊 使用方法

### 基本操作
1. **ケース作成**: New Case ボタンから新規ケース登録
2. **検索**: Search バーで条件検索・全文検索
3. **分析**: Analytics タブで TRT 分析表示
4. **監視**: Live Mode でリアルタイム監視

### TRT 分析
- P95 メトリクスの確認
- 違反ケースの特定
- チームパフォーマンス分析
- トレンド分析（日次・週次・月次）

### 自動化
- 日次 P95 モニタリングの設定
- アラート条件のカスタマイズ
- 通知先の管理

## 🛡️ 安全なデプロイメント

### 段階的移行戦略
1. **Phase 1**: テスト環境での検証
2. **Phase 2**: 段階的機能有効化
3. **Phase 3**: 完全移行

### 緊急時対応
- 即座のロールバック機能
- エラー監視とアラート
- 健全性チェック機能

詳細は `DEPLOYMENT_STRATEGY.md` を参照してください。

## 📈 監視・メトリクス

### システムヘルス
- API クォータ使用量
- エラー率監視
- レスポンス時間追跡
- ユーザーアクティビティ

### ビジネスメトリクス
- TRT P95 パフォーマンス
- ケース処理量
- チーム生産性指標
- SLA 達成率

## 🔐 セキュリティ

### 認証・認可
- Google OAuth 2.0 統合
- ドメインベース制限（@google.com）
- ロールベースアクセス制御
- セッション管理

### データ保護
- 機密データの自動マスキング
- 監査ログの記録
- アクセス履歴の追跡
- プライバシー設定の管理

## 🧪 テスト

### 自動テスト
```javascript
// テスト実行
function runAllTests() {
  return testSystem();
}

// 個別モジュールテスト
function testCaseOperations() {
  return CaseController.test();
}
```

### パフォーマンステスト
```javascript
// パフォーマンス測定
function measurePerformance() {
  return performanceComparisonTest();
}
```

## 📝 開発ガイド

### コントリビューション
1. フォークしてブランチ作成
2. 機能開発・バグ修正
3. テスト実行
4. プルリクエスト作成

### コーディング規約
- JSDoc コメントの記述
- エラーハンドリングの実装
- パフォーマンスの考慮
- セキュリティベストプラクティス

## 📚 ドキュメント

- [最適化レポート](CODE_OPTIMIZATION_REPORT.md)
- [移行ガイド](MIGRATION_GUIDE.md)
- [デプロイメント戦略](DEPLOYMENT_STRATEGY.md)
- [仕様書](casesdash-specification.md)

## 🐛 トラブルシューティング

### よくある問題
1. **スプレッドシート接続エラー**: 権限とIDを確認
2. **認証失敗**: ドメイン制限を確認
3. **P95計算異常**: 除外ケース設定を確認
4. **通知送信失敗**: Webhook URL を確認

### サポート
- GitHub Issues でバグ報告
- 機能リクエストの提出
- ドキュメント改善提案

## 📄 ライセンス

このプロジェクトは Google 内部用途のために開発されています。
外部使用時は適切なライセンス条項に従ってください。

## 👥 開発者

- **メイン開発者**: Roo
- **プロジェクト**: Google 広告サポートチーム向け CasesDash
- **バージョン**: 2.0 (最適化版)

---

**⚠️ 注意**: このシステムは Google Apps Script の制約内で動作するよう設計されています。大規模な本番運用前には十分なテストと検証を実施してください。
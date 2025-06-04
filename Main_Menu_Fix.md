# CasesDash メインメニュー機能修正計画書

## 📋 概要

## ⚠️ 重要な注意事項

**実装前の必須確認**: 各機能を実装する前に、必ず[`casesdash-specification.md`](casesdash-specification.md:1)を確認してください。UI上のラベル、項目名、フィールド名は必ずスプレッドシートのヘッダーや値と一致させる必要があります。不整合があると機能が正常に動作しません。

ユーザーがデプロイ後のUIを確認した結果、showDashboard()、showCaseList()、showCreateCase()、showAdvancedSearch()、showReports()の機能が仕様書の内容と異なることが判明しました。本計画書では、仕様書（casesdash-specification.md）に基づいた段階的な修正計画を示します。

## 🎯 修正対象機能

### 1. Dashboard（ダッシュボード）機能
- [ ] **Backend修正**: showDashboard()の仕様書準拠実装
- [ ] **Frontend修正**: index.htmlダッシュボード表示部分の修正
- [ ] **連携完了**: バックエンド・フロントエンド連携確認

### 2. Case List（マイケース）機能  
- [ ] **Backend修正**: showCaseList()の仕様書準拠実装
- [ ] **Frontend修正**: ケース一覧表示UIの修正
- [ ] **連携完了**: バックエンド・フロントエンド連携確認

### 3. Create Case（ケース作成）機能
- [ ] **Backend修正**: showCreateCase()の仕様書準拠実装
- [ ] **Frontend修正**: ケース作成フォームUIの修正
- [ ] **連携完了**: バックエンド・フロントエンド連携確認

### 4. Advanced Search（高度検索）機能
- [ ] **Backend修正**: showAdvancedSearch()の仕様書準拠実装
- [ ] **Frontend修正**: 検索UI・フィルター機能の修正
- [ ] **連携完了**: バックエンド・フロントエンド連携確認

### 5. Reports（レポート）機能
- [ ] **Backend修正**: showReports()の仕様書準拠実装
- [ ] **Frontend修正**: 統計分析・レポートUIの修正
- [ ] **連携完了**: バックエンド・フロントエンド連携確認

## 🔧 各機能の詳細修正内容

### 📊 1. Dashboard（ダッシュボード）修正

#### Backend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Dashboard機能」セクションとシート別列マッピング（A-AU列）を確認

- [ ] アクティブケース一覧（Case Status = "Assigned"）フィルタリング実装
- [ ] 6シート統合表示（OT Email, 3PO Email, OT Chat, 3PO Chat, OT Phone, 3PO Phone）
- [ ] シート別カラーコーディング実装
- [ ] リアルタイムタイマー（TRT Timer, P95 Timer）計算実装
- [ ] P95除外ケース（Bug, L2, IDT/Payreq, T&S）判定実装
- [ ] 色分け警告システム（緑/黄/赤/グレー）実装

#### Frontend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)のUIレイアウト、フィールド名、ボタンラベルを確認

- [ ] ケースカード表示レイアウト修正
- [ ] シート別カラーコーディング適用
- [ ] リアルタイムタイマー表示（1秒更新）
- [ ] T&S/Bug/L2切り替えボタン実装
- [ ] Edit/Deleteボタン機能実装
- [ ] フィルター機能UI実装

### 📋 2. Case List（マイケース）修正

#### Backend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Case List機能」セクションとステータス値を確認

- [ ] 全ケース取得（本人LDAP関連）実装
- [ ] ステータス別タブ対応（Assigned/Solution Offered/Finished/Closed）
- [ ] 検索機能（Case ID、キーワード）実装
- [ ] ソート機能（日付、優先度、ステータス）実装
- [ ] ページネーション実装

#### Frontend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)のタブ名、検索フィールド名、ソート項目名を確認

- [ ] ステータス別タブUI実装
- [ ] 検索ボックス・フィルター実装
- [ ] ソート機能UI実装
- [ ] ページネーション表示実装
- [ ] CSVエクスポート機能実装

### ➕ 3. Create Case（ケース作成）修正

#### Backend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)のシート別列マッピング（OT: A-AS列、3PO: A-AU列）とフィールド名を確認

- [ ] シート選択による動的フォーム生成
- [ ] シート別列マッピング実装（仕様書の完全なマッピング）
- [ ] 3PO特有フィールド（Issue Category, Details）対応
- [ ] TRT(P95)除外設定実装
- [ ] 重複チェック機能実装
- [ ] 自動計算フィールド実装（TRT Target, Aging Target等）

#### Frontend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)のフォーム項目名、ドロップダウン値、バリデーションルールを確認

- [ ] シート選択ドロップダウン実装
- [ ] 動的フォーム生成UI実装
- [ ] 3PO専用フィールド表示/非表示制御
- [ ] P95除外設定UI実装（セグメント別）
- [ ] リアルタイム入力検証実装
- [ ] Case ID形式検証実装

### 🔍 4. Advanced Search（高度検索）修正

#### Backend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Advanced Search機能」セクションと検索対象フィールドを確認

- [ ] 全6シート統合検索実装
- [ ] Case ID即座検索実装
- [ ] 複数条件検索実装
- [ ] 日付範囲検索実装
- [ ] 担当者検索実装

#### Frontend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の検索フィールド名、フィルター項目、表示列名を確認

- [ ] 統合検索ボックス実装
- [ ] 高度なフィルター UI実装
- [ ] 検索結果表示（シート別カラーコーディング）
- [ ] 検索結果からの直接編集機能
- [ ] オートコンプリート機能実装

### 📈 5. Reports（レポート）修正

#### Backend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Reports機能」セクションとメトリック計算式を確認

- [ ] 期間選択機能（Daily/Weekly/Monthly/Quarterly/Custom）実装
- [ ] TRT(P95)メトリック計算実装
- [ ] 除外ケース処理実装
- [ ] セグメント別・チャネル別分析実装
- [ ] NCC計算ロジック実装
- [ ] Sentiment Score管理実装（月次、本人分のみ）

#### Frontend修正項目：
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)のレポート項目名、グラフラベル、期間選択肢を確認

- [ ] 期間選択UI実装
- [ ] 統計グラフ表示（Chart.js利用）
- [ ] TRT(P95)達成率表示
- [ ] Sentiment Score編集UI実装
- [ ] レポートエクスポート機能

## 🛠️ 技術仕様に基づく実装要件

**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「技術仕様詳細」セクションを必ず参照

### シート別列マッピング（完全対応）
- [ ] OT Email: A-AT列の完全マッピング
- [ ] 3PO Email: A-AV列の完全マッピング  
- [ ] OT Chat: A-AR列の完全マッピング
- [ ] 3PO Chat: A-AT列の完全マッピング
- [ ] OT Phone: OT Chatと同構造（Channel = "Phone"）
- [ ] 3PO Phone: 3PO Chatと同構造（Channel = "Phone"）

### TRT(P95)除外ケース管理
- [ ] 全セグメント共通: Bug Case, L2 Consulted
- [ ] Billing固有: IDT Blocked by, Payreq Blocked by
- [ ] Policy固有: T&S Consulted

### Google Chat通知システム
- [ ] P95タイマー2時間以下での自動通知
- [ ] チームリーダーWebhook設定
- [ ] 通知内容のカード形式実装

### Live Mode対応
- [ ] ポップアップウィンドウでの独立動作
- [ ] リアルタイム同期機能
- [ ] ウィンドウサイズ記憶機能

## 🔄 実装順序

### フェーズ1: showDashboard()修正（優先度: 最高）
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Dashboard機能」とシート構造を確認

1. Backend: アクティブケース取得・フィルタリング
2. Backend: リアルタイムタイマー計算
3. Frontend: ケースカード表示
4. Frontend: シート別カラーコーディング
5. Frontend: リアルタイム更新機能

### フェーズ2: showCreateCase()修正（優先度: 高）
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Create Case機能」とフィールドマッピングを確認

1. Backend: シート別列マッピング完全実装
2. Backend: 動的フォーム生成
3. Frontend: シート選択UI
4. Frontend: 3PO専用フィールド制御
5. Frontend: P95除外設定UI

### フェーズ3: showCaseList()修正（優先度: 中）
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Case List機能」とステータス管理を確認

1. Backend: 全ケース取得・フィルタリング
2. Backend: 検索・ソート機能
3. Frontend: ステータス別タブ
4. Frontend: 検索・フィルターUI

### フェーズ4: showAdvancedSearch()修正（優先度: 中）
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Advanced Search機能」と検索仕様を確認

1. Backend: 統合検索エンジン
2. Backend: 複数条件検索
3. Frontend: 高度検索UI
4. Frontend: 検索結果表示

### フェーズ5: showReports()修正（優先度: 中）
**📋 実装前確認**: [`casesdash-specification.md`](casesdash-specification.md:1)の「Reports機能」と統計計算仕様を確認

1. Backend: 統計計算エンジン
2. Backend: Sentiment Score管理
3. Frontend: レポートUI
4. Frontend: グラフ・可視化

## ✅ 完了確認基準

各機能について以下を満たした時点で完了とします：

**📋 品質確認**: 実装完了時に[`casesdash-specification.md`](casesdash-specification.md:1)との整合性を再確認すること

### 機能完了基準
- [ ] 仕様書の要件を100%満たしている
- [ ] バックエンド・フロントエンド連携が正常動作
- [ ] エラーハンドリングが適切に実装されている
- [ ] Material Design準拠のUI/UX
- [ ] レスポンス時間が2秒以内
- [ ] 手動テストで全機能が正常動作

### 品質確認基準
- [ ] JSDocコメントが完備されている
- [ ] 入力検証とセキュリティ対策が実装されている
- [ ] パフォーマンス最適化が適用されている
- [ ] 例外処理とロールバック機能が動作する

## 📝 進捗管理

- 作成日: 2025年5月27日
- 最終更新: 2025年5月27日（仕様書確認指示追加）
- 修正予定期間: 2週間
- 担当: Roo (Elite GAS Engineer)

---

**重要な注記**:
- 各チェックボックスは対応する修正が完了した時点でチェックマーク（✅）を付けること
- 実装前・実装後には必ず[`casesdash-specification.md`](casesdash-specification.md:1)との整合性確認を行うこと
- UI上のすべてのラベル・項目名はスプレッドシートのヘッダーと完全一致させること
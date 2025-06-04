# CasesDash - マルチシート対応ケース管理システム

## 概要

CasesDashは、Google Sheetsベースのケース管理システムです。複数のシート（OT Email, 3PO Email, OT Chat, 3PO Chat, OT Phone, 3PO Phone）に対応し、リアルタイムのケース追跡とSLA管理を提供します。

## 主な機能

### メインメニュー
1. **Dashboard（ダッシュボード）**
   - アクティブケースの一覧表示
   - リアルタイムタイマー（TRT Timer & P95 Timer）
   - シート別カラーコーディング
   - フィルタリング機能

2. **My Cases（マイケース）**
   - 担当したすべてのケースの管理
   - ステータス別表示
   - 検索・ソート機能

3. **Create Case（ケース作成）**
   - 新規ケース作成フォーム
   - シート別動的フィールド
   - 入力支援機能

## シート構造

### 対応シート
- **OT Email**: 一般的なEメールケース
- **3PO Email**: 3POプロセスのEメールケース  
- **OT Chat**: 一般的なチャットケース
- **3PO Chat**: 3POプロセスのチャットケース
- **OT Phone**: 一般的な電話ケース
- **3PO Phone**: 3POプロセスの電話ケース

### タイマー仕様
- **TRTタイマー**: Email (36時間), Chat/Phone (8時間)
- **P95タイマー**: 標準 72時間（3日）
- 色分け警告システム（緑/黄/赤/グレー）

## 技術仕様

- **プラットフォーム**: Google Apps Script
- **フロントエンド**: HTML/CSS/JavaScript
- **バックエンド**: Google Apps Script
- **データストレージ**: Google Sheets
- **認証**: Google OAuth

## セットアップ

1. Google Apps Scriptプロジェクトを作成
2. ファイルをアップロード
3. Google Sheetsでケース管理スプレッドシートを作成
4. 設定ファイルでシートIDを設定

## ライセンス

このプロジェクトは内部使用向けに開発されています。

## バージョン

2.0.0（マルチシート対応版）

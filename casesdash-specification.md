# CasesDash - マルチシート対応 ケース管理システム（完全版仕様書）

## 1. プロジェクト概要

### 1.1 概要と目的

CasesDashは、Google 広告サポートチームのケース管理を効率化するためのウェブベースのツールです。Google スプレッドシートと連携し、6つの異なるシート（OT Email, 3PO Email, OT Chat, 3PO Chat, OT Phone, 3PO Phone）にわたるケース割り当て、追跡、期限管理、統計分析を一元化します。

### 1.2 対象シートと構造

本システムは以下の6つのシートに対応します：

| シート名 | ケースタイプ | チャネル | ケースID開始列 | 特殊フィールド |
|---------|------------|----------|---------------|---------------|
| OT Email | OT | Email | C列 | AM Initiated |
| 3PO Email | 3PO | Email | C列 | Issue Category, Details |
| OT Chat | OT | Chat | B列 | - |
| 3PO Chat | 3PO | Chat | B列 | Issue Category, Details |
| OT Phone | OT | Phone | B列 | - |
| 3PO Phone | 3PO | Phone | B列 | Issue Category, Details |

### 1.3 解決する主要課題

- **複数シート対応の必要性**: 単一シート対応から6シート対応への拡張
- **TRT(P95)メトリック管理**: Google要求のメイン指標の正確な計算と追跡
- **除外ケース管理**: Bug Case、L2コンサル、IDT/Payreq、T&Sコンサルトの適切な除外処理
- **リアルタイム通知**: P95タイマー2時間以下での自動Google Chat通知
- **統合ユーザー管理**: 認証、プロファイル、権限管理の一元化

## 2. 実際のスプレッドシート構造に基づく詳細マッピング

### 2.1 OT Email シート構造（正確版）

**ヘッダー構造（1行目+2行目の組み合わせ）:**

```
A: Date
B: Case (ハイパーリンク - 自動生成)
C: Case ID
D: Case Open Date  
E: Time (Case Open Time)
F: Incoming Segment
G: Product Category
H: Triage
I: Prefer Either
J: AM Initiated
K: Is 3.0
L: 1st Assignee
M: TRT Timer (リアルタイム計算)
N: Aging Timer (リアルタイム計算)
O: Pool Transfer Destination
P: Pool Transfer Reason  
Q: MCC
R: Change to Child
S: Final Assignee
T: Final Segment
U: Case Status
V: AM Transfer
W: non NCC
X: Bug
Y: Need Info
Z: 1st Close Date
AA: 1st Close Time
AB: Reopen Reason
AC: Reopen Close Date
AD: Reopen Close Time
AF: Product Commerce (自動計算)
AG: Assign Week (自動計算)
AH: Channel (固定値: "Email")
AI: TRT Target (自動計算)
AJ: TRT Date+Time (自動計算)
AK: Aging Target (自動計算)
AL: Aging Date+Time (自動計算)
AM: Close NCC (自動計算)
AN: Close Date
AO: Close Time
AP: Close Week (自動計算)
AQ: TRT (SLA違反フラグ - 自動計算)
AR: Aging (エージング違反フラグ - 自動計算)
AS: Reopen Close (再オープンフラグ - 自動計算)
AT: Reassign (再アサインフラグ - 自動計算)
```

### 2.2 3PO Email シート構造（正確版）

```
A: Date
B: Cases (ハイパーリンク - 自動生成)
C: Case ID
D: Case Open Date
E: Time (Case Open Time)
F: Incoming Segment
G: Product Category
H: Triage
I: Prefer Either
J: AM Initiated
K: Is 3.0
L: Issue Category (3PO特有)
M: Details (3PO特有)
N: 1st Assignee
O: TRT Timer (リアルタイム計算)
P: Aging Timer (リアルタイム計算)
Q: Pool Transfer Destination
R: Pool Transfer Reason
S: MCC
T: Change to Child
U: Final Assignee
V: Final Segment
W: Case Status
X: AM Transfer
Y: non NCC
Z: Bug
AA: Need Info
AB: 1st Close Date
AC: 1st Close Time
AD: Reopen Reason
AE: Reopen Close Date
AF: Reopen Close Time
AH: Product Commerce (自動計算)
AI: Assign Week (自動計算)
AJ: Channel (固定値: "Email")
AK: TRT Target (自動計算)
AL: TRT Date+Time (自動計算)
AM: Aging Target (自動計算)
AN: Aging Date+Time (自動計算)
AO: Close NCC (自動計算)
AP: Close Date
AQ: Close Time
AR: Close Week (自動計算)
AS: TRT (SLA違反フラグ - 自動計算)
AT: Aging (エージング違反フラグ - 自動計算)
AU: Reopen Close (再オープンフラグ - 自動計算)
AV: Reassign (再アサインフラグ - 自動計算)
```

### 2.3 OT Chat シート構造（正確版）

```
A: Cases (ハイパーリンク - 自動生成)
B: Case ID
C: Case Open Date
D: Time (Case Open Time)
E: Incoming Segment
F: Product Category
G: Triage
H: Prefer Either
I: Is 3.0
J: 1st Assignee
K: TRT Timer (リアルタイム計算)
L: Aging Timer (リアルタイム計算)
M: Pool Transfer Destination
N: Pool Transfer Reason
O: MCC
P: Change to Child
Q: Final Assignee
R: Final Segment
S: Case Status
T: AM Transfer
U: non NCC
V: Bug
W: Need Info
X: 1st Close Date
Y: 1st Close Time
Z: Reopen Reason
AA: Reopen Close Date
AB: Reopen Close Time
AD: Product Commerce (自動計算)
AE: Assign Week (自動計算)
AF: Channel (固定値: "Chat")
AG: TRT Target (自動計算)
AH: TRT Date+Time (自動計算)
AI: Aging Target (自動計算)
AJ: Aging Date+Time (自動計算)
AK: Close NCC (自動計算)
AL: Close Date
AM: Close Time
AN: Close Week (自動計算)
AO: TRT (SLA違反フラグ - 自動計算)
AP: Aging (エージング違反フラグ - 自動計算)
AQ: Reopen Close (再オープンフラグ - 自動計算)
AR: Reassign (再アサインフラグ - 自動計算)
```

### 2.4 3PO Chat シート構造（正確版）

```
A: Cases (ハイパーリンク - 自動生成)
B: Case ID
C: Case Open Date
D: Time (Case Open Time)
E: Incoming Segment
F: Product Category
G: Triage
H: Prefer Either
I: Is 3.0
J: Issue Category (3PO特有)
K: Details (3PO特有)
L: 1st Assignee
M: TRT Timer (リアルタイム計算)
N: Aging Timer (リアルタイム計算)
O: Pool Transfer Destination
P: Pool Transfer Reason
Q: MCC
R: Change to Child
S: Final Assignee
T: Final Segment
U: Case Status
V: AM Transfer
W: non NCC
X: Bug
Y: Need Info
Z: 1st Close Date
AA: 1st Close Time
AB: Reopen Reason
AC: Reopen Close Date
AD: Reopen Close Time
AF: Product Commerce (自動計算)
AG: Assign Week (自動計算)
AH: Channel (固定値: "Chat")
AI: TRT Target (自動計算)
AJ: TRT Date+Time (自動計算)
AK: Aging Target (自動計算)
AL: Aging Date+Time (自動計算)
AM: Close NCC (自動計算)
AN: Close Date
AO: Close Time
AP: Close Week (自動計算)
AQ: TRT (SLA違反フラグ - 自動計算)
AR: Aging (エージング違反フラグ - 自動計算)
AS: Reopen Close (再オープンフラグ - 自動計算)
AT: Reassign (再アサインフラグ - 自動計算)
```

### 2.5 OT Phone シート構造（正確版）

OT Chatと同じ構造ですが、Channel列の固定値が"Phone"になります。

### 2.6 3PO Phone シート構造（正確版）

3PO Chatと同じ構造ですが、Channel列の固定値が"Phone"になります。

## 3. 正確な列マッピングシステム

### 3.1 完全なシート別列マッピング定義

```javascript
const SheetColumnMappings = {
  "OT Email": {
    // 基本情報
    date: "A",
    caseLink: "B",           // ハイパーリンク（自動生成）
    caseId: "C",
    caseOpenDate: "D",
    caseOpenTime: "E",
    incomingSegment: "F",
    productCategory: "G",
    
    // フラグ・チェックボックス
    triage: "H",
    preferEither: "I",
    amInitiated: "J",
    is30: "K",
    
    // 担当者情報
    firstAssignee: "L",
    
    // タイマー（自動計算）
    trtTimer: "M",
    agingTimer: "N",
    
    // 転送情報
    poolTransferDestination: "O",
    poolTransferReason: "P",
    
    // アカウント情報
    mcc: "Q",
    changeToChild: "R",
    
    // 最終担当者情報
    finalAssignee: "S",
    finalSegment: "T",
    
    // ステータス
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    
    // クローズ情報
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    
    // 自動計算フィールド
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH,
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  },
  
  "3PO Email": {
    // 基本情報
    date: "A",
    caseLink: "B",
    caseId: "C",
    caseOpenDate: "D",
    caseOpenTime: "E",
    incomingSegment: "F",
    productCategory: "G",
    
    // フラグ・チェックボックス
    triage: "H",
    preferEither: "I",
    amInitiated: "J",
    is30: "K",
    
    // 3PO特有フィールド
    issueCategory: "L",
    details: "M",
    
    // 担当者情報
    firstAssignee: "N",
    
    // タイマー（自動計算）
    trtTimer: "O",
    agingTimer: "P",
    
    // 転送情報
    poolTransferDestination: "Q",
    poolTransferReason: "R",
    
    // アカウント情報
    mcc: "S",
    changeToChild: "T",
    
    // 最終担当者情報
    finalAssignee: "U",
    finalSegment: "V",
    
    // ステータス
    caseStatus: "W",
    amTransfer: "X",
    nonNCC: "Y",
    bug: "Z",
    needInfo: "AA",
    
    // クローズ情報
    firstCloseDate: "AB",
    firstCloseTime: "AC",
    reopenReason: "AD",
    reopenCloseDate: "AE",
    reopenCloseTime: "AF",
    
    // 自動計算フィールド
    productCommerce: "AH",
    assignWeek: "AI",
    channel: "AJ",
    trtTarget: "AK",
    trtDateTime: "AL",
    agingTarget: "AM",
    agingDateTime: "AN",
    closeNCC: "AO",
    closeDate: "AP",
    closeTime: "AQ",
    closeWeek: "AR",
    trtFlag: "AS",
    agingFlag: "AT",
    reopenCloseFlag: "AU",
    reassignFlag: "AV"
  },
  
  "OT Chat": {
    // 基本情報
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    
    // フラグ・チェックボックス
    triage: "G",
    preferEither: "H",
    is30: "I",
    
    // 担当者情報
    firstAssignee: "J",
    
    // タイマー（自動計算）
    trtTimer: "K",
    agingTimer: "L",
    
    // 転送情報
    poolTransferDestination: "M",
    poolTransferReason: "N",
    
    // アカウント情報
    mcc: "O",
    changeToChild: "P",
    
    // 最終担当者情報
    finalAssignee: "Q",
    finalSegment: "R",
    
    // ステータス
    caseStatus: "S",
    amTransfer: "T",
    nonNCC: "U",
    bug: "V",
    needInfo: "W",
    
    // クローズ情報
    firstCloseDate: "X",
    firstCloseTime: "Y",
    reopenReason: "Z",
    reopenCloseDate: "AA",
    reopenCloseTime: "AB",
    
    // 自動計算フィールド
    productCommerce: "AD",
    assignWeek: "AE",
    channel: "AF",
    trtTarget: "AG",
    trtDateTime: "AH",
    agingTarget: "AI",
    agingDateTime: "AJ",
    closeNCC: "AK",
    closeDate: "AL",
    closeTime: "AM",
    closeWeek: "AN",
    trtFlag: "AO",
    agingFlag: "AP",
    reopenCloseFlag: "AQ",
    reassignFlag: "AR"
  },
  
  "3PO Chat": {
    // 基本情報
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    
    // フラグ・チェックボックス
    triage: "G",
    preferEither: "H",
    is30: "I",
    
    // 3PO特有フィールド
    issueCategory: "J",
    details: "K",
    
    // 担当者情報
    firstAssignee: "L",
    
    // タイマー（自動計算）
    trtTimer: "M",
    agingTimer: "N",
    
    // 転送情報
    poolTransferDestination: "O",
    poolTransferReason: "P",
    
    // アカウント情報
    mcc: "Q",
    changeToChild: "R",
    
    // 最終担当者情報
    finalAssignee: "S",
    finalSegment: "T",
    
    // ステータス
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    
    // クローズ情報
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    
    // 自動計算フィールド
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH",
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  },
  
  "OT Phone": {
    // OT Chatと同じ構造
    // channelフィールドの値のみ"Phone"
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    triage: "G",
    preferEither: "H",
    is30: "I",
    firstAssignee: "J",
    trtTimer: "K",
    agingTimer: "L",
    poolTransferDestination: "M",
    poolTransferReason: "N",
    mcc: "O",
    changeToChild: "P",
    finalAssignee: "Q",
    finalSegment: "R",
    caseStatus: "S",
    amTransfer: "T",
    nonNCC: "U",
    bug: "V",
    needInfo: "W",
    firstCloseDate: "X",
    firstCloseTime: "Y",
    reopenReason: "Z",
    reopenCloseDate: "AA",
    reopenCloseTime: "AB",
    productCommerce: "AD",
    assignWeek: "AE",
    channel: "AF",
    trtTarget: "AG",
    trtDateTime: "AH",
    agingTarget: "AI",
    agingDateTime: "AJ",
    closeNCC: "AK",
    closeDate: "AL",
    closeTime: "AM",
    closeWeek: "AN",
    trtFlag: "AO",
    agingFlag: "AP",
    reopenCloseFlag: "AQ",
    reassignFlag: "AR"
  },
  
  "3PO Phone": {
    // 3PO Chatと同じ構造
    // channelフィールドの値のみ"Phone"
    caseLink: "A",
    caseId: "B",
    caseOpenDate: "C",
    caseOpenTime: "D",
    incomingSegment: "E",
    productCategory: "F",
    triage: "G",
    preferEither: "H",
    is30: "I",
    issueCategory: "J",
    details: "K",
    firstAssignee: "L",
    trtTimer: "M",
    agingTimer: "N",
    poolTransferDestination: "O",
    poolTransferReason: "P",
    mcc: "Q",
    changeToChild: "R",
    finalAssignee: "S",
    finalSegment: "T",
    caseStatus: "U",
    amTransfer: "V",
    nonNCC: "W",
    bug: "X",
    needInfo: "Y",
    firstCloseDate: "Z",
    firstCloseTime: "AA",
    reopenReason: "AB",
    reopenCloseDate: "AC",
    reopenCloseTime: "AD",
    productCommerce: "AF",
    assignWeek: "AG",
    channel: "AH",
    trtTarget: "AI",
    trtDateTime: "AJ",
    agingTarget: "AK",
    agingDateTime: "AL",
    closeNCC: "AM",
    closeDate: "AN",
    closeTime: "AO",
    closeWeek: "AP",
    trtFlag: "AQ",
    agingFlag: "AR",
    reopenCloseFlag: "AS",
    reassignFlag: "AT"
  }
};
```

## 4. メインメニュー機能詳細仕様

### 4.1 Dashboard（ダッシュボード）

#### 4.1.1 概要と目的
ダッシュボードは、担当中の全アクティブケースの一覧表示と管理を行うメイン画面です。ユーザーが最初にログインした際に表示され、日常的なケース管理業務の中心となります。

#### 4.1.2 表示機能
- **アクティブケース一覧**: Case Status が "Assigned" の自分が担当するケースのみ表示
- **シート別カラーコーディング**: 6つのシート（OT Email, 3PO Email, OT Chat, 3PO Chat, OT Phone, 3PO Phone）を視覚的に区別
- **リアルタイムタイマー表示**:
  - **TRT Timer**: 残り応答時間のカウントダウン（HH:MM:SS形式）
  - **P95 Timer**: ケース解決期限までのカウントダウン（DD:HH:MM:SS形式）
  - **色分け警告システム**:
    - 緑: 十分な時間がある状態
    - 黄: 注意が必要な状態
    - 赤: 緊急対応が必要な状態（2時間以下で点滅）
    - グレー: 期限切れ（"Missed"表示）

#### 4.1.3 インタラクション機能
- **ケースカードクリック**: ケースの詳細情報をモーダルで表示
- **Edit（編集）ボタン**: ケース情報の編集モーダルを開く
- **Delete（削除）ボタン**: ケースを削除（確認ダイアログ付き）
- **T&S Consulted 切り替え**: クリックでT&S Consult状態をON/OFF切り替え
- **自動更新**: 1秒間隔でタイマー情報を更新

#### 4.1.4 フィルタリング機能
- **シート別フィルター**: 特定のシートのケースのみ表示
- **チャネル別フィルター**: Email/Chat/Phone別でフィルタリング
- **セグメント別フィルター**: Platinum/Titanium/Gold/Silver/Bronze別
- **緊急度フィルター**: TRTタイマーの残り時間別

### 4.2 My Cases（マイケース）

#### 4.2.1 概要と目的
自分が担当したすべてのケース（アクティブ・非アクティブ問わず）の総合管理画面です。過去のケース履歴の確認と、非アクティブケースの再アクティブ化を行います。

#### 4.2.2 表示機能
- **全ケース一覧**: 自分のLDAPに関連するすべてのケース
- **ステータス別タブ**: Assigned / Solution Offered / Finished / Closed別の表示
- **検索機能**: Case ID、顧客情報、キーワードでの検索
- **ソート機能**: 日付、優先度、ステータス別のソート
- **ページネーション**: 大量データの効率的な表示

#### 4.2.3 ケース管理機能
- **詳細表示**: ケースの全履歴と詳細情報
- **再アクティブ化**: Solution Offered/Finishedケースの再オープン
- **一括操作**: 複数ケースの一括ステータス変更
- **エクスポート**: CSV形式でのデータエクスポート

## ダッシュボード表示仕様

### ケースカード表示

各ケースカードには以下の情報を表示：

```
┌─────────────────────────────────────┐
│ [シートバッジ] [チャネルアイコン]        │
│ Case ID: 0-1234567890123            │
│ Assignee: username                  │
│ Segment: Gold | Category: Search    │
│ Status: Assigned 　　　　　　　　　　　 │
│ TRT Timer: 12:34:56                 │
│ P95 Timer: 2日 08:15:30              │
│ [T&S切替] [L2切替][Bug切替]（P95除外）  │
│ 　　　　　　　　　　　　　　　[編集][削除] │
└─────────────────────────────────────┘
```
[T&S 切替] 箇所は「Policy」の場合の仕様であり、Billingの場合は、Blocked by [IDT/Payreq]の切り替えでP95タイマーから除外

### シート別カラーコーディング

| シート | カラー | ボーダー |
|--------|--------|----------|
| OT Email | #4285F4 (Google Blue) | 実線 |
| 3PO Email | #34A853 (Google Green) | 破線 |
| OT Chat | #FBBC05 (Google Yellow) | 実線 |
| 3PO Chat | #EA4335 (Google Red) | 破線 |
| OT Phone | #8430CE (Google Purple) | 実線 |
| 3PO Phone | #F57C00 (Google Orange) | 破線 |

### リアルタイムタイマー仕様

**TRTタイマー:**
- Email: 36時間
- Chat/Phone: 8時間
- 表示形式: HH:MM:SS
- 残り3時間未満: 点滅表示
- 期限切れ: "Missed"表示

**P95タイマー:**
- 標準: 72時間（3日）
- 表示形式: X日 HH:MM:SS
- 期限切れ: "Missed"表示
- P95除外対象：Excluded!!


### 4.3 Create Case（ケース作成）

#### 4.3.1 概要と目的
新規ケースを作成するための専用フォーム画面です。シート選択により動的にフォームが変化し、適切なデータ入力を支援します。

#### 4.3.2 シート選択機能
- **動的フォーム生成**: 選択したシートに応じてフィールドが変化
- **シート別必須項目**: 各シートの要求に応じた必須フィールド設定
- **3PO特有フィールド**: 3POシート選択時に "Issue Category" と "Details" フィールドを表示
- **チャネル別デフォルト**: SLA時間などのチャネル固有設定を自動適用

#### 4.3.3 入力支援機能
- **ドロップダウン選択**: Incoming Segment、Product Category、Issue Categoryの選択
- **日付時間ピッカー**: Case Open Date/Timeの正確な入力
- **自動入力**: LDAPユーザー名の自動設定
- **リアルタイム検証**: 入力中のフィールド検証とエラー表示
- **Case ID検証**: フォーマットチェック（3-4505000031234形式）

#### 4.3.4 TRT(P95)除外ケース設定
除外対象ケースの設定機能（セグメントに応じて表示）：

**全セグメント共通**:
- Bug Case (Blocked by) フラグ
- L2 Consulted フラグ

**Billing セグメント特有**:
- IDT Blocked by フラグ
- Payreq Blocked by フラグ

**Policy セグメント特有**:
- T&S Consulted フラグ

## 新規ケース追加フォーム仕様（シート別動的対応）

- 共通フィールド（全シート）

| フィールド名 | フィールドタイプ | 選択肢/形式 | デフォルト値 | 必須 |
|-------------|-----------------|------------|-------------|------|
| Case ID | 入力フォーム | X-XXXXXXXXXXXXX (Xは任意の数字) | - | ✓ |
| Case Open Date | 日付入力 | YYYY/MM/DD | 今日 | ✓ |
| Case Open Time | 時間入力 | HH:MM:SS | 現在時刻 | ✓ |
| Incoming Segment | セレクトボックス | Gold, Platinum, Titanium, Silver, Bronze - Low, Bronze - High | Gold | ✓ |
| Product Category | セレクトボックス | Search, Display, Video, Commerce, Apps, M&A, Policy, Billing, Other | Search | ✓ |
| Triage | チェックボックス | 0/1 | 0 | - |
| Prefer Either | チェックボックス | 0/1 | 0 | - |
| Is 3.0 | チェックボックス | 0/1 | 0 | - |
| 1st Assignee | 入力フォーム | LDAP ID | 現在のユーザー | ✓ |
| MCC | チェックボックス | 0/1 | 0 | - |
| Change to Child | チェックボックス | 0/1 | 0 | - |
| Case Status | セレクトボックス | Assigned, Solution Offered, Finished | Assigned | ✓ |
| Bug | チェックボックス | 0/1 | 0 | - |
| Need Info | チェックボックス | 0/1 | 0 | - |

### OT Email特有フィールド

| フィールド名 | フィールドタイプ | 選択肢/形式 | デフォルト値 | 必須 |
|-------------|-----------------|------------|-------------|------|
| AM Initiated | チェックボックス | 0/1 | 0 | - |

### 3POシート特有フィールド（3PO Email, 3PO Chat, 3PO Phone）

| フィールド名 | フィールドタイプ | 選択肢/形式 | デフォルト値 | 必須 |
|-------------|-----------------|------------|-------------|------|
| Issue Category | セレクトボックス | CBT invo-invo, CBT invo-auto, CBT (self to self), LC creation, PP link, PP update, IDT/ Bmod, LCS billing policy, self serve issue, Unidentified Charge, CBT Flow, GQ, OOS, Bulk CBT, CBT ext request, MMS billing policy, Promotion code, Refund, Review, TM form, Trademarks issue, Under Review, Certificate, Suspend, AIV, Complaint | - | ✓ |
| Details | テキストエリア | 自由記述 | - | - |

### 選択肢詳細定義

**AM Transfer選択肢:**
- Request to AM contact
- Optimize request
- β product inquiry
- Trouble shooting scope but we don't have access to the resource
- Tag team request (LCS customer)
- Data analysis
- Allowlist request
- Other

**non NCC選択肢:**
- Policy issue
- Account setup issue
- Feature request
- Billing dispute
- Other

## データ追加・更新機能仕様（NEW）

### 新規ケース追加処理フロー

```javascript
const CaseAdditionSpec = {
  // 基本設定
  insertPosition: "lastRow",              // 常に最終行に追加
  skipHeaderRows: 2,                      // ヘッダー行をスキップ
  duplicateCheck: true,                   // Case ID重複チェック
  transactional: true,                    // トランザクション処理
  
  // 処理順序
  processFlow: [
    "validateInput",                      // 入力データ検証
    "checkDuplicates",                   // 重複チェック
    "calculateFields",                   // 自動計算フィールド
    "insertData",                        // データ挿入
    "updateFormulas",                    // 数式更新
    "validateResult"                     // 結果検証
  ]
};
```

### データ挿入位置の決定ロジック

```javascript
function getInsertRowPosition(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  
  // ヘッダー行（1-2行目）をスキップして最終行の次に追加
  const insertRow = Math.max(lastRow + 1, 3); // 最低でも3行目から
  
  return {
    insertRow: insertRow,
    lastDataRow: lastRow,
    hasData: lastRow >= 3
  };
}
```

### 重複チェック機能

```javascript
const DuplicateCheckSpec = {
  // チェック対象
  checkFields: ["caseId"],                // Case IDでの重複チェック
  searchScope: "entireSheet",             // シート全体を検索
  caseSensitive: false,                   // 大文字小文字を区別しない
  
  // エラー処理
  onDuplicate: {
    action: "reject",                     // 重複時は追加を拒否
    showDialog: true,                     // エラーダイアログ表示
    suggestAlternative: true              // 代替案を提示
  },
  
  // パフォーマンス
  batchCheck: true,                       // バッチ処理でチェック
  cacheResults: true                      // 結果をキャッシュ
};
```

### 自動計算フィールド処理

```javascript
const AutoCalculatedFields = {
  // 即座に計算されるフィールド
  immediate: [
    {
      field: "date",
      formula: () => new Date().toLocaleDateString("ja-JP")
    },
    {
      field: "caseLink",
      formula: (caseId) => `=HYPERLINK("https://support.google.com/google-ads/contact/${caseId}", "${caseId}")`
    },
    {
      field: "assignWeek", 
      formula: (openDate) => `=WEEKNUM("${openDate}")`
    },
    {
      field: "channel",
      value: (sheetName) => {
        if (sheetName.includes("Email")) return "Email";
        if (sheetName.includes("Chat")) return "Chat";
        if (sheetName.includes("Phone")) return "Phone";
      }
    }
  ],
  
  // リアルタイム計算フィールド（数式として設定）
  realtime: [
    {
      field: "trtTimer",
      formula: (openDate, openTime) => `=IF(AND(${openDate}<>"", ${openTime}<>""), NOW()-${openDate}-${openTime}, "")`
    },
    {
      field: "agingTimer", 
      formula: (openDate, openTime) => `=IF(AND(${openDate}<>"", ${openTime}<>""), NOW()-${openDate}-${openTime}, "")`
    },
    {
      field: "trtTarget",
      formula: (channel) => {
        return channel === "Email" ? 
          `=IF(${channel}="Email", 1.5, 0.33)` : // 36時間 or 8時間
          `=IF(${channel}="Email", 1.5, 0.33)`;
      }
    },
    {
      field: "agingTarget",
      formula: () => `=3` // 固定3日（72時間）
    }
  ]
};
```

### データ整合性検証

```javascript
const DataValidationSpec = {
  // 必須フィールド検証
  requiredFields: {
    all: ["caseId", "caseOpenDate", "caseOpenTime", "incomingSegment", "productCategory", "firstAssignee", "caseStatus"],
    "3PO": ["issueCategory"] // 3POシートの追加必須フィールド
  },
  
  // フォーマット検証
  formatValidation: {
    caseId: /^\d-\d{13}$/,                 // 任意の数字-で始まる13桁の数字
    caseOpenDate: /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    caseOpenTime: /^\d{2}:\d{2}:\d{2}$/,   // HH:MM:SS
    firstAssignee: /^[a-zA-Z0-9._-]+$/     // LDAP ID形式
  },
  
  // 値の範囲検証
  valueValidation: {
    incomingSegment: ["Gold", "Platinum", "Titanium", "Silver", "Bronze - Low", "Bronze - High"],
    productCategory: ["Search", "Display", "Video", "Commerce", "Apps", "M&A", "Policy", "Billing", "Other"],
    caseStatus: ["Assigned", "Solution Offered", "Finished"]
  }
};
```

### エラーハンドリング・ロールバック機能

```javascript
const ErrorHandlingSpec = {
  // エラータイプ別処理
  errorTypes: {
    validation: {
      action: "showErrors",               // エラー詳細を表示
      allowPartialSave: false             // 部分保存は不可
    },
    duplicate: {
      action: "showDialog",               // 確認ダイアログ
      options: ["overwrite", "cancel", "edit"] // 選択肢提示
    },
    permission: {
      action: "redirect",                 // 権限エラー時は適切な画面に誘導
      message: "スプレッドシートへの書き込み権限がありません"
    },
    network: {
      action: "retry",                    // ネットワークエラー時は再試行
      maxRetries: 3,
      backoffInterval: 1000               // 1秒間隔で再試行
    }
  },
  
  // ロールバック機能
  rollback: {
    enabled: true,                        // ロールバック有効
    saveSnapshot: true,                   // 変更前スナップショット保存
    timeoutMs: 30000,                     // 30秒でタイムアウト
    
    // ロールバック条件
    conditions: [
      "formulaError",                     // 数式エラー
      "dataCorruption",                   // データ破損検出
      "incompleteInsert"                  // 不完全な挿入
    ]
  }
};
```

### バッチ処理・パフォーマンス最適化

```javascript
const PerformanceOptimization = {
  // バッチ処理
  batchOperations: {
    enabled: true,
    maxBatchSize: 100,                    // 最大100行まで一括処理
    batchInterval: 500,                   // 500ms間隔
    
    // バッチ対象操作
    operations: [
      "dataInsertion",                    // データ挿入
      "formulaUpdate",                    // 数式更新
      "formatApply"                       // 書式適用
    ]
  },
  
  // キャッシュ戦略
  caching: {
    sheetData: {
      ttl: 300000,                        // 5分間キャッシュ
      maxSize: 1000                       // 最大1000行
    },
    validationResults: {
      ttl: 600000,                        // 10分間キャッシュ
      maxSize: 500
    }
  },
  
  // 非同期処理
  async: {
    enableAsync: true,                    // 非同期処理有効
    progressCallback: true,               // 進捗コールバック
    chunkSize: 50                         // 50行ずつ処理
  }
};
```

### 監査ログ・操作履歴

```javascript
const AuditLogSpec = {
  // ログ対象操作
  loggedOperations: [
    "caseInsert",                         // ケース追加
    "caseUpdate",                         // ケース更新
    "caseDelete",                         // ケース削除
    "statusChange",                       // ステータス変更
    "assigneeChange"                      // 担当者変更
  ],
  
  // ログ項目
  logFields: {
    timestamp: "操作日時",
    userId: "操作者LDAP ID",
    operation: "操作種別", 
    sheetName: "対象シート",
    caseId: "ケースID",
    changedFields: "変更フィールド",
    oldValues: "変更前値",
    newValues: "変更後値",
    ipAddress: "IPアドレス",
    userAgent: "ユーザーエージェント"
  },
  
  // ログ保存先
  storage: {
    location: "AuditLog",                 // 専用シート
    retention: "12months",                // 12ヶ月保持
    compression: true,                    // ログ圧縮
    encryption: true                      // ログ暗号化
  }
};
```

#### 4.3.5 Live Mode対応
- **別ウィンドウ表示**: ポップアップウィンドウでの独立動作
- **リアルタイム同期**: メインダッシュボードとの自動同期
- **ウィンドウサイズ記憶**: ユーザー設定のウィンドウサイズ保持

### 4.4 Analytics（統計分析）

#### 4.4.1 概要と目的
チーム全体およびユーザー個人のパフォーマンス分析を行う統計機能です。Googleが要求するSLAメトリックの追跡と可視化を提供します。

#### 4.4.2 メイン統計機能（showReports）

**期間選択機能**:
- **Daily**: 日次データの表示
- **Weekly**: 週次データの表示
- **Monthly**: 月次データの表示
- **Quarterly**: 四半期データの表示
- **カスタム期間**: 開始日と終了日を指定した任意期間

**TRT(P95)メトリック**（最重要指標）:
- **P95達成率**: 72時間以内解決率
- **除外ケース管理**: Bug Case、L2コンサル、IDT/Payreq、T&Sコンサルトの除外処理
- **セグメント別分析**: Platinum/Titanium/Gold/Silver/Bronze別の達成率
- **チャネル別分析**: Email/Chat/Phone別の達成率

**その他のメトリック**:
- **Total Cases**: 総ケース数
- **Solution Offered**: 解決提案済みケース数
- **NCC (Non-Contact Complete)**: 算出条件に基づく自動計算
- **SLA Achievement Rate**: SLA達成率
- **Average Handling Time**: 平均処理時間

#### 4.4.3 統計分析機能の詳細

**NCC計算ロジック**:
```javascript
NCC_CONDITIONS = {
  caseId_notEmpty: true,        // Case IDが空欄でない
  caseStatus_notAssigned: true, // Case Statusが"Assigned"以外
  nonNCC_empty: true,          // non NCC列が空欄
  bug_unchecked: true          // Bug列にチェックが入っていない（値が0）
};
```

**シート別分析**:
- 6つのシート個別の統計
- シート間の比較分析
- チャネル横断分析

**可視化機能**:
- 折れ線グラフ（時系列トレンド）
- 円グラフ（ステータス分布）
- 棒グラフ（期間比較）
- ヒートマップ（パフォーマンス分布）

#### 4.4.4 Sentiment Score管理（showReports内オプション）

**基本仕様**:
- **評価範囲**: 1.0 - 10.0（0.5刻み）
- **管理単位**: 月次
- **編集権限**: 本人分のみ編集可能（当月のみ）
- **表示権限**: 本人分のみ表示可能

**UI設計**:
```html
<!-- Reports画面内のSentiment Score編集セクション -->
<div class="sentiment-section" style="margin-top: 20px;">
  <h4>Monthly Sentiment Score</h4>
  <div class="sentiment-input">
    <label>2025年5月のSentiment Score:</label>
    <input type="number" min="1" max="10" step="0.5" value="5.0">
    <button>Save</button>
  </div>
  <div class="sentiment-history">
    <h5>過去のスコア履歴:</h5>
    <ul>
      <li>2025年4月: 7.5</li>
      <li>2025年3月: 8.0</li>
    </ul>
  </div>
</div>
```

### 4.5 Search（検索）

#### 4.5.1 概要と目的
全シートを対象とした統合検索機能です。Case IDによる即座検索と、詳細条件による絞り込み検索を提供します。

#### 4.5.2 検索機能
- **Case ID検索**: 即座検索（autocomplete対応）
- **担当者検索**: LDAP名での検索
- **日付範囲検索**: 期間指定での検索
- **ステータス検索**: 複数ステータスでの絞り込み
- **シート横断検索**: 全6シートを対象とした統合検索

#### 4.5.3 検索結果表示
- **結果リスト**: シート別カラーコーディング
- **詳細表示**: 検索結果からの直接詳細表示
- **編集機能**: 検索結果からの直接編集
- **エクスポート**: 検索結果のCSVエクスポート

### 4.6 Settings（設定）

#### 4.6.1 概要と目的
システム全体の設定とカスタマイズを行う管理画面です。スプレッドシート接続、ユーザー設定、システム設定を統合管理します。

#### 4.6.2 スプレッドシート設定
- **スプレッドシートID入力**: 接続対象スプレッドシートの指定
- **接続テスト**: スプレッドシートとの接続確認
- **シート検証**: 6つのシートの存在と構造確認
- **権限確認**: 読み取り/書き込み権限の確認

**スプレッドシート設定UI**:
```html
<div class="spreadsheet-settings">
  <h3>Spreadsheet Configuration</h3>
  <div class="input-group">
    <label>Spreadsheet ID:</label>
    <input type="text" id="spreadsheetId" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms">
    <button onclick="testConnection()">Test Connection</button>
  </div>
  <div class="status-display">
    <div class="connection-status">Status: <span id="connection-status">Not Connected</span></div>
    <div class="sheets-validation">
      <h4>Sheet Validation:</h4>
      <ul id="sheet-validation-list">
        <li>OT Email: <span class="status pending">Checking...</span></li>
        <li>3PO Email: <span class="status pending">Checking...</span></li>
        <li>OT Chat: <span class="status pending">Checking...</span></li>
        <li>3PO Chat: <span class="status pending">Checking...</span></li>
        <li>OT Phone: <span class="status pending">Checking...</span></li>
        <li>3PO Phone: <span class="status pending">Checking...</span></li>
      </ul>
    </div>
  </div>
</div>
```

#### 4.6.3 UI設定
- **テーマ切り替え**: ダークモード / ライトモード
- **表示言語**: UI言語の選択（日本語/英語）
- **タイムゾーン**: 時間表示のタイムゾーン設定
- **通知設定**: Google Chat通知の有効/無効

#### 4.6.4 チーム設定
- **チームリーダー設定**: P95アラート通知先の設定
- **Google Chat Webhook**: 通知先チャットルームの設定
- **通知条件**: アラート送信条件の詳細設定

### 4.7 User Profile（ユーザープロファイル）

#### 4.7.1 概要と目的
ユーザー認証とプロファイル管理を行う機能です。Google認証による安全なログインと、個人設定の管理を提供します。

#### 4.7.2 認証機能
- **Google OAuth認証**: セキュアなGoogleアカウント認証
- **LDAP情報取得**: 社内LDAP情報の自動取得
- **権限レベル管理**: 一般ユーザー/チームリーダー/管理者の権限分離
- **セッション管理**: 自動ログアウトとセッション継続

#### 4.7.3 プロファイル表示
```html
<div class="user-profile-modal">
  <h3>User Profile</h3>
  <div class="profile-info">
    <div class="avatar">
      <img src="user-avatar-url" alt="User Avatar">
    </div>
    <div class="user-details">
      <p><strong>Name:</strong> <span id="user-name">tanaka</span></p>
      <p><strong>LDAP:</strong> <span id="user-ldap">tanaka@google.com</span></p>
      <p><strong>Team:</strong> <span id="user-team">Support Team A</span></p>
      <p><strong>Role:</strong> <span id="user-role">Team Member</span></p>
      <p><strong>Join Date:</strong> <span id="join-date">2024-01-15</span></p>
    </div>
  </div>
  <div class="personal-settings">
    <h4>Personal Settings</h4>
    <div class="setting-item">
      <label>Language Preference:</label>
      <select id="language-select">
        <option value="ja">日本語</option>
        <option value="en">English</option>
      </select>
    </div>
    <div class="setting-item">
      <label>Timezone:</label>
      <select id="timezone-select">
        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
        <option value="UTC">UTC</option>
      </select>
    </div>
  </div>
</div>
```

## 検索・フィルター機能

### 基本検索

- **全シート統合検索**: すべてのシートを対象
- **シート指定検索**: 特定シートのみ
- **ケースID検索**: 即座に該当ケースを表示
- **担当者検索**: LDAP IDによる検索
- **ステータス検索**: ケースステータス別

### 高度なフィルター

| フィルター項目 | タイプ | 選択肢 |
|---------------|-------|--------|
| Sheet | マルチセレクト | 6つのシート |
| Channel | マルチセレクト | Email, Chat, Phone |
| Case Type | マルチセレクト | OT, 3PO |
| Segment | マルチセレクト | Platinum, Titanium, Gold, Silver, Bronze |
| Category | マルチセレクト | Search, Display, Video等 |
| Case Status | マルチセレクト | Assigned, Solution Offered, Finished |
| SLA Status | マルチセレクト | 正常, 警告（3時間未満）, 違反 |


### 5.1 統計分析機能のアクセス制御仕様

#### 5.1.1 ユーザー別データ表示権限

```javascript
const UserDataAccessControl = {
  // 基本原則：本人データのみ表示
  dataVisibility: {
    ownData: "full",           // 本人データ：全項目表示可能
    othersData: "restricted",  // 他者データ：制限あり
    aggregatedData: "allowed"  // 集計データ：匿名化された全体統計のみ
  },
  
  // 表示可能データの詳細
  allowedViews: {
    selfOnly: [
      "Cases by Assignee (Own)",
      "NCC by Assignee (Own)", 
      "SLA Achievement by Assignee (Own)",
      "Personal Performance Trend",
      "Own Monthly Sentiment Score"
    ],
    
    aggregatedOnly: [
      "Team Average Performance",
      "Overall SLA Achievement Rate",
      "Total Cases Distribution",
      "Channel Usage Statistics"
    ],
    
    restricted: [
      "Individual Performance Comparison", // 管理者権限のみ
      "Other Users' Case Details",        // アクセス不可
      "Personal Sentiment Scores"         // 本人のみ
    ]
  }
};
```

#### 5.1.2 権限レベル別機能制限

| 権限レベル | 本人データ | 他者個人データ | 集計データ | Sentiment編集 |
|------------|------------|---------------|------------|---------------|
| **一般ユーザー** | ✅ 全表示 | ❌ 非表示 | ✅ 匿名集計のみ | ✅ 本人分のみ |
| **チームリーダー** | ✅ 全表示 | ✅ チームメンバーのみ | ✅ チーム集計 | ✅ チームメンバー分 |
| **管理者** | ✅ 全表示 | ✅ 全ユーザー | ✅ 全集計 | ✅ 全ユーザー分 |

## 6. TRT(P95)メトリック管理システム

### 6.1 TRT(P95)の定義と重要性

TRT(P95)は、Googleから要求される最重要指標で、ケースの95%を72時間以内に解決することを目標とします。

### 6.2 TRT(P95)算出対象から除外されるケース

#### 6.2.1 全セグメント共通の除外条件
- **Bug Case (Blocked by)**: システムバグにより進行が阻まれているケース
- **L2 Consulted**: レベル2サポートに相談が必要なケース

#### 6.2.2 セグメント固有の除外条件

**Billing セグメント**:
- **IDT Blocked by**: Identity verification issues
- **Payreq Blocked by**: Payment request processing issues

**Policy セグメント**:
- **T&S Consulted**: Trust and Safty team consultation required

### 6.3 除外ケース設定UI

#### 6.3.1 Create New Case フォーム内の除外設定
```html
<div class="exclusion-settings">
  <h4>TRT(P95) Exclusion Settings</h4>
  
  <!-- 全セグメント共通 -->
  <div class="common-exclusions">
    <label>
      <input type="checkbox" name="bugBlocked" value="1">
      Bug Case (Blocked by)
    </label>
    <label>
      <input type="checkbox" name="l2Consulted" value="1">
      L2 Consulted
    </label>
  </div>
  
  <!-- Billing セグメント専用 -->
  <div class="billing-exclusions" style="display: none;">
    <h5>Billing Specific Exclusions:</h5>
    <label>
      <input type="checkbox" name="idtBlocked" value="1">
      IDT Blocked by
    </label>
    <label>
      <input type="checkbox" name="payreqBlocked" value="1">
      Payreq Blocked by
    </label>
  </div>
  
  <!-- Policy セグメント専用 -->
  <div class="policy-exclusions" style="display: none;">
    <h5>Policy Specific Exclusions:</h5>
    <label>
      <input type="checkbox" name="tsConsulted" value="1">
    </label>
  </div>
</div>
```

#### 6.3.2 Case Edit モーダル内の除外設定
```html
<div class="case-edit-exclusions">
  <h4>Update Exclusion Status</h4>
  <div class="exclusion-grid">
    <div class="exclusion-item">
      <label>Bug Case (Blocked by):</label>
      <input type="checkbox" id="edit-bug-blocked">
    </div>
    <div class="exclusion-item">
      <label>L2 Consulted:</label>
      <input type="checkbox" id="edit-l2-consulted">
    </div>
    <div class="exclusion-item billing-only">
      <label>IDT Blocked by:</label>
      <input type="checkbox" id="edit-idt-blocked">
    </div>
    <div class="exclusion-item billing-only">
      <label>Payreq Blocked by:</label>
      <input type="checkbox" id="edit-payreq-blocked">
    </div>
    <div class="exclusion-item policy-only">
      <label>T&S Consulted:</label>
      <input type="checkbox" id="edit-ts-consulted">
    </div>
  </div>
</div>
```

## 7. Google Chat通知システム

### 7.1 概要と目的
P95タイマーが2時間以下になったケースについて、該当ユーザーのチームリーダーに自動的にGoogle Chat通知を送信します。

### 7.2 通知トリガー条件
- P95タイマーが2時間（7200秒）以下になった時点
- TRT(P95)算出対象外ケースは通知対象外
- Case Status が "Assigned" のケースのみ
- 既に通知済みのケースは重複通知しない

### 7.3 通知内容
```javascript
const createChatNotification = (caseData) => {
  return {
    text: `⚠️ TRT(P95) Alert`,
    cards: [{
      header: {
        title: "TRT(P95) Timer Warning",
        subtitle: "Immediate attention required",
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "LDAP",
              content: caseData.finalAssignee
            }
          },
          {
            keyValue: {
              topLabel: "Case ID",
              content: caseData.caseId
            }
          },
          {
            keyValue: {
              topLabel: "Remaining Time",
              content: caseData.p95Timer
            }
          },
          {
            keyValue: {
              topLabel: "Message",
              content: "⚠️ TRT(P95) timer has fallen below 2 hours. Immediate action required."
            }
          }
        ]
      }]
    }]
  };
};
```

### 7.4 通知設定管理
```html
<div class="notification-settings">
  <h4>Google Chat Notification Settings</h4>
  <div class="webhook-settings">
    <label>Team Leader Chat Webhook URL:</label>
    <input type="url" id="teamLeaderWebhook" placeholder="https://chat.googleapis.com/v1/spaces/...">
    <button onclick="testWebhook()">Test Notification</button>
  </div>
  <div class="notification-conditions">
    <h5>Notification Conditions:</h5>
    <label>
      <input type="checkbox" checked> P95 Timer ≤ 2 hours
    </label>
    <label>
      <input type="checkbox" checked> Assigned cases only
    </label>
    <label>
      <input type="checkbox" checked> Exclude TRT(P95) exempt cases
    </label>
  </div>
</div>
```

## 8. Live Mode機能仕様

### 8.1 基本仕様

Live Modeは、メインアプリケーションとは独立したポップアップウィンドウで動作する軽量版のケース管理システムです。

```javascript
const LiveModeSpec = {
  window: {
    type: "popup",
    resizable: true,
    defaultSize: { width: 1200, height: 800 },
    minSize: { width: 800, height: 600 }
  },
  content: {
    tabs: ["Dashboard", "Add New Case"],
    autoRefresh: 30000, // 30秒間隔
    realTimeUpdates: true
  },
  features: [
    "Window size persistence",
    "Tab state persistence", 
    "Mode toggle (Live/Standard)",
    "Notification system"
  ]
};
```

### 8.2 実装仕様

```javascript
const LiveModeImplementation = {
  windowCreation: {
    method: "window.open()",
    features: "resizable=yes,scrollbars=yes,status=yes",
    communication: "postMessage API"
  },
  layout: {
    header: "minimal with mode indicator",
    tabs: ["Dashboard", "Add New Case"],
    content: "responsive to window size"
  },
  features: {
    autoRefresh: "30 second intervals",
    realTimeTimers: "1 second updates",
    notifications: "browser notifications API",
    persistence: "window state in localStorage"
  }
};
```

### 8.3 Live Mode UI構造
```html
<!DOCTYPE html>
<html>
<head>
  <title>CasesDash - Live Mode</title>
  <style>
    .live-mode-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family: 'Google Sans', Arial, sans-serif;
    }
    .live-header {
      background: #1976d2;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .live-tabs {
      display: flex;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }
    .live-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="live-mode-container">
    <div class="live-header">
      <h1>CasesDash - Live Mode</h1>
      <div class="live-controls">
        <span id="last-update">Last update: --:--:--</span>
        <button onclick="window.close()">Close</button>
      </div>
    </div>
    <div class="live-tabs">
      <button class="tab-button active" onclick="showTab('dashboard')">Dashboard</button>
      <button class="tab-button" onclick="showTab('create')">Add New Case</button>
    </div>
    <div class="live-content">
      <div id="dashboard-tab" class="tab-content active">
        <!-- Dashboard content -->
      </div>
      <div id="create-tab" class="tab-content">
        <!-- Create case form -->
      </div>
    </div>
  </div>
</body>
</html>
```

## 9. UI表示言語統一仕様

### 9.1 UI表記の基本方針

すべてのメインメニュー機能（統計分析、検索・フィルター、ケース管理等）において、UI項目はスプレッドシートのヘッダーと完全一致する英語表記を使用します。これにより、ユーザーがスプレッドシートとUIの間で混乱することなく、直感的な操作が可能になります。

### 9.2 主要UI表記（英語統一）

**基本指標（英語表記）:**
- Total Cases
- Solution Offered
- NCC
- SLA Achievement Rate
- Average Handling Time

**共通フィールド（英語表記）:**

| スプレッドシートヘッダー | UI表示 | 説明 |
|------------------------|--------|------|
| Case ID | Case ID | ケース識別子 |
| Case Open Date | Case Open Date | ケース開始日 |
| Time | Case Open Time | ケース開始時刻 |
| Incoming Segment | Incoming Segment | 顧客セグメント |
| Product Category | Product Category | 製品カテゴリ |
| Triage | Triage | トリアージフラグ |
| Prefer Either | Prefer Either | どちらでも可フラグ |
| Is 3.0 | Is 3.0 | 3.0対応フラグ |
| 1st Assignee | 1st Assignee | 初回担当者 |
| Case Status | Case Status | ケースステータス |

**選択肢（英語表記）:**

**Incoming Segment選択肢:**
- Platinum
- Titanium  
- Gold
- Silver
- Bronze - Low
- Bronze - High

**Product Category選択肢:**
- Search
- Display
- Video
- Commerce
- Apps
- M&A
- Policy
- Billing
- Other

**Case Status選択肢:**
- Assigned
- Solution Offered
- Finished

**Issue Category選択肢（3PO）:**
- CBT invo-invo
- CBT invo-auto
- CBT (self to self)
- LC creation
- PP link
- PP update
- IDT/ Bmod
- LCS billing policy
- self serve issue
- Unidentified Charge
- CBT Flow
- GQ
- OOS
- Bulk CBT
- CBT ext request
- MMS billing policy
- Promotion code
- Refund
- Review
- TM form
- Trademarks issue
- Under Review
- Certificate
- Suspend
- AIV
- Complaint

## 10. 技術実装と構成

### 10.1 フロントエンド構成

#### コア技術スタック
- **HTML5**: セマンティックマークアップとアクセシビリティ対応
- **CSS3**: Grid Layout, Flexbox, CSS Variables, Animations
- **JavaScript (ES6+)**: Modern JavaScript features, Async/Await, Modules

#### UIライブラリ
- **Material Design Components for Web**: 
  - MDC Tab Bar, Dialog, Select, TextField, Button, Checkbox
  - Material Icons & Symbols
- **Chart.js**: 統計データ可視化
- **Flatpickr**: 日付時間選択
- **Google Fonts**: Google Sans, Roboto

#### 状態管理
```javascript
// シンプルな状態管理システム
class AppState {
  constructor() {
    this.state = {
      user: null,
      cases: [],
      selectedSheet: null,
      filters: {},
      settings: {}
    };
    this.listeners = [];
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### 10.2 バックエンド（Google Apps Script）

#### メイン構成
```javascript
// Code.gs - メインエントリーポイント
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('CasesDash - Multi-Sheet Case Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// スプレッドシート操作関数
function getSpreadsheetData(sheetName, range) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID not configured');
  }
  
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  return sheet.getRange(range).getValues();
}
```

#### ユーザー認証システム
```javascript
// UserAuth.gs
function getCurrentUser() {
  const user = Session.getActiveUser();
  const email = user.getEmail();
  
  if (!email.includes('@google.com')) {
    throw new Error('Access restricted to Google employees only');
  }
  
  return {
    email: email,
    ldap: email.split('@')[0],
    name: user.getName(),
    role: getUserRole(email)
  };
}

function getUserRole(email) {
  // プロパティサービスから役割情報を取得
  const teamLeaders = PropertiesService.getScriptProperties()
    .getProperty('TEAM_LEADERS')?.split(',') || [];
  const admins = PropertiesService.getScriptProperties()
    .getProperty('ADMINS')?.split(',') || [];
  
  if (admins.includes(email)) return 'admin';
  if (teamLeaders.includes(email)) return 'team_leader';
  return 'user';
}
```

#### 通知システム
```javascript
// NotificationSystem.gs
function sendChatNotification(caseData, webhookUrl) {
  const payload = {
    text: "⚠️ TRT(P95) Alert",
    cards: [{
      header: {
        title: "TRT(P95) Timer Warning",
        subtitle: "Immediate attention required"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "LDAP",
              content: caseData.finalAssignee
            }
          },
          {
            keyValue: {
              topLabel: "Case ID", 
              content: caseData.caseId
            }
          },
          {
            keyValue: {
              topLabel: "Message",
              content: "⚠️ TRT(P95) timer has fallen below 2 hours. Immediate action required."
            }
          }
        ]
      }]
    }]
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
    Logger.log(`Notification sent for case ${caseData.caseId}`);
  } catch (error) {
    Logger.log(`Failed to send notification: ${error.toString()}`);
  }
}
```

### 10.3 データストレージ

#### スプレッドシート構造
- **プライマリデータ**: 6つのシートでのケースデータ
- **設定情報**: Properties Service での設定保存
- **キャッシュ**: CacheService での一時データ保存

#### 設定管理
```javascript
// Settings.gs
function saveSettings(settings) {
  const properties = PropertiesService.getScriptProperties();
  Object.keys(settings).forEach(key => {
    properties.setProperty(key, JSON.stringify(settings[key]));
  });
}

function getSettings() {
  const properties = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: properties.getProperty('SPREADSHEET_ID'),
    teamLeaderWebhook: properties.getProperty('TEAM_LEADER_WEBHOOK'),
    theme: properties.getProperty('THEME') || 'light',
    language: properties.getProperty('LANGUAGE') || 'en'
  };
}
```

## 11. セキュリティとコンプライアンス

### 11.1 認証・認可
- **Google OAuth**: セキュアなGoogle認証
- **ドメイン制限**: @google.comドメインのみアクセス許可
- **役割ベースアクセス制御**: user/team_leader/admin の権限分離

### 11.2 データプライバシー
- **個人データ保護**: 本人データのみ表示原則
- **匿名化統計**: チーム集計での個人情報匿名化
- **アクセスログ**: 機密データアクセスの記録

### 11.3 エラーハンドリング
```javascript
// ErrorHandler.js
class ErrorHandler {
  static handle(error, context) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      user: Session.getActiveUser().getEmail()
    };
    
    // ログ記録
    Logger.log(JSON.stringify(errorInfo));
    
    // ユーザーフレンドリーなエラーメッセージを表示
    this.showUserError(error);
  }
  
  static showUserError(error) {
    const userMessage = this.getUserFriendlyMessage(error);
    // UIにエラーメッセージを表示
    document.getElementById('error-display').textContent = userMessage;
  }
  
  static getUserFriendlyMessage(error) {
    if (error.message.includes('Spreadsheet ID not configured')) {
      return 'スプレッドシートが設定されていません。設定画面から設定してください。';
    }
    if (error.message.includes('Sheet not found')) {
      return '指定されたシートが見つかりません。スプレッドシートの構造を確認してください。';
    }
    return '予期しないエラーが発生しました。しばらく待ってから再試行してください。';
  }
}
```

## 12. パフォーマンス最適化

### 12.1 読み込み速度最適化
- **遅延読み込み**: 必要な時点でのデータ取得
- **キャッシュ戦略**: 頻繁にアクセスするデータのキャッシュ
- **バッチ処理**: 複数のスプレッドシート操作の一括実行

### 12.2 リアルタイム更新
```javascript
// RealtimeUpdater.js
class RealtimeUpdater {
  constructor() {
    this.updateInterval = null;
    this.isUpdating = false;
  }
  
  start() {
    this.updateInterval = setInterval(() => {
      this.updateTimers();
    }, 1000); // 1秒間隔
  }
  
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  updateTimers() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    const caseElements = document.querySelectorAll('.case-card');
    caseElements.forEach(element => {
      const trtTimer = element.querySelector('.trt-timer');
      const p95Timer = element.querySelector('.p95-timer');
      
      if (trtTimer) {
        this.updateTimer(trtTimer);
      }
      if (p95Timer) {
        this.updateTimer(p95Timer);
      }
    });
    
    this.isUpdating = false;
  }
  
  updateTimer(timerElement) {
    const deadline = new Date(timerElement.dataset.deadline);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) {
      timerElement.textContent = 'Missed';
      timerElement.className = 'timer missed';
    } else {
      const timeString = this.formatTime(diff);
      timerElement.textContent = timeString;
      timerElement.className = this.getTimerClass(diff);
    }
  }
  
  formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  getTimerClass(milliseconds) {
    const hours = milliseconds / (1000 * 60 * 60);
    if (hours <= 2) return 'timer critical';
    if (hours <= 8) return 'timer warning';
    return 'timer normal';
  }
}
```

## 13. 今後の開発ロードマップ

### 13.1 フェーズ1: 基盤強化（2週間）
- [ ] ユーザー認証システムの実装
- [ ] スプレッドシート接続機能の修正
- [ ] 基本的なケース作成機能の実装
- [ ] ダークモード/ライトモード切り替えの実装

### 13.2 フェーズ2: 核心機能（3週間）
- [ ] TRT(P95)除外ケース管理機能
- [ ] Google Chat通知システム
- [ ] Live Mode機能の実装
- [ ] Analytics レポート機能の強化

### 13.3 フェーズ3: 統計とUI強化（2週間）
- [ ] Sentiment Score管理のReports内組み込み
- [ ] 期間選択機能の実装
- [ ] UI/UXの洗練
- [ ] レスポンシブデザインの最適化

### 13.4 フェーズ4: テストと最適化（1週間）
- [ ] 全機能の統合テスト
- [ ] パフォーマンス最適化
- [ ] セキュリティ検証
- [ ] ユーザー受け入れテスト

## 14. 付録

### 14.1 用語集

- **SLA (Service Level Agreement)**: サービス品質保証のための応答時間枠
- **TRT (Turnaround Time)**: ケース解決目標時間
- **P95**: ケースの95%を72時間以内に解決する目標指標
- **T&S Consulted**: Trust and Safty consultation flag
- **NCC**: Non-Contact Complete（通常のクローズフロー以外）
- **AM Transfer**: Account Manager移管フラグ
- **LDAP**: Lightweight Directory Access Protocol（社内ユーザー識別子）
- **Live Mode**: ポップアップウィンドウでの独立動作モード

### 14.2 設定ファイル例

```javascript
// config.js
const CONFIG = {
  SPREADSHEET: {
    SHEETS: [
      'OT Email', '3PO Email', 'OT Chat', 
      '3PO Chat', 'OT Phone', '3PO Phone'
    ],
    DATA_START_ROW: 3
  },
  TIMERS: {
    UPDATE_INTERVAL: 1000, // 1秒
    CRITICAL_THRESHOLD: 2 * 60 * 60 * 1000, // 2時間
    WARNING_THRESHOLD: 8 * 60 * 60 * 1000   // 8時間
  },
  SLA: {
    EMAIL: {
      PLATINUM: 24,
      TITANIUM: 36,
      GOLD: 36
    },
    CHAT: {
      PLATINUM: 6,
      TITANIUM: 8,
      GOLD: 8
    },
    PHONE: {
      PLATINUM: 6,
      TITANIUM: 8,
      GOLD: 8
    }
  },
  NOTIFICATIONS: {
    GOOGLE_CHAT: {
      ENABLED: true,
      RETRY_COUNT: 3
    }
  }
};
```

---

**技術仕様**: Google Apps Script (ES6+), Material Design Components, Google Spreadsheets  
**対象シート**: 6シート完全対応  
**セキュリティ**: プライバシー保護対応、Google OAuth認証  
**パフォーマンス**: サブ2秒レスポンス目標、リアルタイム更新対応  
**通知**: Google Chat API連携  
**アクセシビリティ**: WCAG 2.1 AA準拠

**最終更新**: 2025年5月25日  
**バージョン**: 2.0.0（マルチシート対応版）
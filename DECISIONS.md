# Decision Log

最終更新日: 2026-07-27

## Decision一覧

| ID | 日付 | 判断 | 状態 | 置換対象 |
|---|---|---|---|---|
| D-001 | 2026-07-14 | Google Workspace個人業務OSを独立プロジェクトとしてContext Hubへ追加する | 置換済み | D-034 |
| D-002 | 2026-07-14 | Workspace Studioを使用せず、Apps Script中心で構築する | 採用 | - |
| D-003 | 2026-07-14 | Google Sheetsをタスク管理の正本とする | 採用 | - |
| D-004 | 2026-07-14 | Google Calendarは重要期限の可視化に限定する | 採用 | - |
| D-005 | 2026-07-14 | AIなしでも動くManualモードを優先する | 置換済み | D-019 |
| D-006 | 2026-07-14 | 正式情報とAI推測を分離し、重要操作は人の承認を必要とする | 採用 | - |
| D-007 | 2026-07-14 | NotebookLMは検索・利用者支援に使用し、自動化エンジンにしない | 採用 | - |
| D-008 | 2026-07-14 | メールスレッドの永続キーにStable Thread Keyを使用する | 採用 | - |
| D-009 | 2026-07-14 | 自動処理は冪等性、排他制御、ログおよび再実行性を必須とする | 採用 | - |
| D-010 | 2026-07-22 | Apps Scriptだけで空のGoogle Sheetsからシステムを構築する | 採用 | - |
| D-011 | 2026-07-22 | OAuth権限は各利用者が自分で承認する | 採用 | - |
| D-012 | 2026-07-22 | 利用者向けUIは日本語、内部ID等は英語で固定する | 採用 | - |
| D-013 | 2026-07-22 | 未処理メールはGmail Message IDで判定する | 採用 | - |
| D-014 | 2026-07-22 | AI自動ラベルと人間の補正ラベルを併用し、人間の判断を優先する | 採用 | - |
| D-015 | 2026-07-22 | 初回セットアップでシート、ラベル、Calendar、設定等を自動生成する | 修正採用 | D-025～D-027で制約追加 |
| D-016 | 2026-07-22 | 個人PCではダミーデータで開発し、会社環境へコードと非機密手引書だけを移す | 採用 | - |
| D-017 | 2026-07-22 | Google Docsを手引書の正本、NotebookLMを利用者支援窓口とする | 採用 | - |
| D-018 | 2026-07-22 | Gmail処理は原則5分ごとのポーリングとする | 採用 | - |
| D-019 | 2026-07-22 | 独立したManualモードを設けず、AI自動分類と人間補正の単一設計とする | 採用 | D-005 |
| D-020 | 2026-07-22 | 専用Calendar名を`自動期日管理`とする | 採用 | - |
| D-021 | 2026-07-22 | 正式Gmailラベルを短い7ラベルに限定する | 採用 | 旧ラベル案 |
| D-022 | 2026-07-23 | 要確認専用タブを廃止し、日常操作をタスク一覧へ集約する | 採用 | 旧2タブ設計 |
| D-023 | 2026-07-23 | v1.xプロトタイプへのパッチを停止し、v2をゼロから再構築する | 採用 | v1.x継続改修 |
| D-024 | 2026-07-23 | v2初期版はv1との後方互換Migrationを持たない | 採用 | v1→v2直接更新案 |
| D-025 | 2026-07-23 | 初期セットアップは最小行数・段階処理とし、大量の事前書式設定を禁止する | 採用 | D-015の無制約実装 |
| D-026 | 2026-07-23 | Task追記位置は主キー列の論理空行で判定し、`getLastRow()`を使用しない | 採用 | 物理最終行依存 |
| D-027 | 2026-07-23 | Setup、Runtime、Diagnostic、Migrationの責務を分離する | 採用 | 横断処理混在 |
| D-028 | 2026-07-23 | v2はPhaseごとの最小縦フローと受入テストで段階実装する | 採用 | 全機能一括実装 |
| D-029 | 2026-07-23 | v1.xは技術検証用プロトタイプとして保存し、本番利用しない | 採用 | v1.x本番昇格 |
| D-030 | 2026-07-26 | Phase 8はSandbox準備、TEST_MODE Sandbox、実接続Sandbox、個人パイロットの順に分割する | 採用 | Phase 8の即時配布案 |
| D-031 | 2026-07-26 | 個人パイロットと反復改善を経てから少人数・部内展開を判断する | 採用 | 完成直後の部内展開案 |
| D-032 | 2026-07-26 | 利用者の日常作業を例外処理へ限定し、内部の複雑性をUIへ露出させない | 採用 | 手動中心の運用案 |
| D-033 | 2026-07-26 | 実装コードと案件コンテキストを別Repositoryで管理する | 置換済み | D-034 |
| D-034 | 2026-07-27 | `Tanukitsune-hub/GAS-Project-Schedule`をcontext、implementation、test、tool、release、audit、instructionの唯一のGitHub正本とする | 採用 | D-001、D-033 |
| D-035 | 2026-07-27 | Source Commit AとRelease Commit Bを分離し、release manifestを実在Source SHAへ結び付ける | 採用 | provenance未確定release |

## Decision詳細

### D-001～D-004: 基本アーキテクチャ

- D-001のRepository配置判断はD-034により置換済み
- Apps Scriptを自動化の中核とする
- Google Sheetsをタスク・期限・状態の正本とする
- Calendarは失念時の影響が大きい重要期限だけを可視化する

### D-005 / D-019: Manualモード

- D-005はD-019により置換済み
- 独立したManualモードは設けない
- `手動/取込`と`手動/除外`はAI自動処理を補正する例外操作とする
- AI接続前の状態もManualモードとは呼ばない

### D-006: 正式情報とAI推測の分離

- 明示期限とAI推測期限を別項目で管理する
- AI推測だけの期限はCalendarへ自動登録しない
- 完了、取消、重要な既存タスク変更は人間確認を必要とする

### D-007: NotebookLM

NotebookLMは手引書・仕様書に基づく検索と利用者支援に使用し、自動実行エンジンにはしない。

### D-008: Stable Thread Key

Gmail Thread IDだけに依存せず、スレッド先頭メッセージID等からStable Thread Keyを保持する。

### D-009: 信頼性要件

- Message ID、origin key、Task IDによる冪等性
- LockService、claim、CASによる競合防止
- Logs、Retry、Dead Letter、再実行経路
- Apps Scriptクォータと実行時間上限への対応
- 長時間のGmail、AI、Calendar外部I/Oをmain Script Lock内へ置かない

### D-010～D-012: 配布とUI

- 空のGoogle SheetsへApps Scriptを導入する
- OAuthは利用者本人が承認する
- 利用者表示は日本語、内部ID・設定キー・状態コードは英語で固定する

### D-013: 未処理判定

- 既読・未読を使用しない
- Gmail Message IDで処理済みを管理する
- 厳密な短時間窓だけに依存しない

### D-014: AIラベルと人間補正

- AIは`AI/`配下を管理する
- `手動/除外`、`手動/取込`をAIより優先する
- AIは人間ラベルを削除しない

### D-015 / D-025～D-027: セットアップと責務分離

`setupSystem()`による自動構築は維持するが、v1で判明した制約を強制する。

- 初期行数は50～100行程度
- 大量のチェックボックス、入力規則、Protectionを事前生成しない
- 必要時だけ行を拡張する
- Bootstrapは管理シートの存在を前提にしない
- Schema作成、Seed、外部サービス作成を段階化する
- Setupにsoft execution budgetを設ける
- RuntimeやDiagnosticからレイアウト修復を呼ばない

責務。

- Setup: 新規構築と明示的なv2内upgrade
- Runtime: Gmail、AI、Task、Calendar処理
- Diagnostic: 読取中心の構成確認
- Migration: v2リリース後の明示的Schema変更
- Dashboard: 軽量集計専用。Worker処理経路から直接更新しない

### D-016: 情報管理

個人PCでは非機密のダミーデータだけを使用し、会社環境へはコードと非機密文書だけを移す。

### D-017: DocsとNotebookLM

- Google Docsを手引書、FAQ、仕様書、保守資料、変更履歴の正本とする
- NotebookLMを利用者向け質問窓口とする
- Sheetsから関連資料へリンクする

### D-018: 5分ポーリング

Gmail新着専用トリガーに依存せず、時間主導トリガーを使用する。処理量は小さなバッチへ制限し、残件は次回へ繰り越す。自動処理は初期停止とし、実環境受入後に明示的に有効化する。

### D-020: Calendar名

専用サブカレンダーの正式名称は`自動期日管理`とする。

### D-021: 正式Gmailラベル

```text
AI/要対応
AI/期限
AI/返信待
AI/要確認
手動/取込
手動/除外
SYS/失敗
```

処理済み、判定済み、完了、対象外ラベルは作成しない。

### D-022: タスク一覧へ集約

- 要確認専用タブを作らない
- 新規の曖昧候補はタスク一覧へ`status=REVIEW`で登録する
- 受入・却下は同じ行で行う
- 既存タスクの変更候補はpending項目に保存し、現在状態を維持する
- 日常的に確認する操作画面を1つにする

理由: 2タブ運用は見逃しの原因となり、v1実地テストでも候補の発見性が低かったため。

### D-023 / D-024 / D-029: v1の扱い

- v1.xコードを継ぎ足さない
- v2の仕様を先に固定し、新しいApps Scriptプロジェクトとして実装する
- v2は新しい空のGoogle Sheetsへ構築する
- 初期版でv1既存シートを直接変換しない
- v1.xは技術検証記録として保存し、本番利用しない

### D-026: 論理空行

TaskやReview候補の追加位置は、`task_id`または`origin_key`列の最初の論理空行で決定する。`getLastRow()`はTask追記位置に使用しない。

### D-028: Phase gate

最初に最小縦フローを完成させ、各Phaseの受入テスト完了後に次へ進む。一括実装や未検証の機能拡張を行わない。

### D-030 / D-031: Phase 8と展開順序

Phase 8は次の段階へ分割する。

```text
Phase 8A: 非本番Sandboxのrelease package・手順・証跡準備
Phase 8B: TEST_MODE=true、Automation OFF、非機密データでの実Workspace受入
Phase 8C: 実Provider・会社承認・credential方針確定後のTEST_MODE=false受入
Phase 8D: Repository owner本人による実業務パイロット
改善・安定運用
少人数限定展開
部内展開
```

完成直後に部内展開せず、本人が実際に使い、誤判定、操作量、速度、復旧性、UIを修正・ブラッシュアップしてから展開範囲を広げる。

### D-032: 利用者作業の最小化

通常利用者の作業は、原則として次へ限定する。

- 曖昧候補の受入・却下
- 完了・対象外
- 誤った期限・優先度等の修正

Message State、Retry、Dead Letter、内部ID等のシステム複雑性は通常利用者へ過度に露出させない。導入、設定、復旧も可能な限り推奨初期値と自動処理で簡素化する。

### D-033 / D-034: Repository正本

D-033の分割管理は置換済みである。現在は`Tanukitsune-hub/GAS-Project-Schedule`だけを、context、implementation、test、tool、release、audit、instructionのGitHub正本とする。旧配置はhistorical audit/reportの参照としてのみ残し、現行の参照・更新・同期先にしない。

### D-035: Source／Release commit分離

- Commit A: Source、tests、tools、canonical docs、CHANGELOG
- Commit B: Commit Aから生成・検証したrelease packageとRound 3 implementation report
- manifestにはGAS Repository名、実在Source commit SHA、manifest自身を含むrelease content commit、生成日時、TEST_MODE、Automation状態を記録する
- Git commitの自己SHAを同じcommit内へ埋め込めないため、release content commitは`SELF (the Git commit containing this manifest)`と記載し、確定したCommit B SHAをimplementation reportとGitHub証跡で示す

API key、password、token、実メール本文、個人情報、未公表情報、実Google Workspace ID・URLはGitHubへ保存しない。

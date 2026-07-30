# Phase 8B Dashboard surface blocker — 安全な復旧ガイド

`PHASE8B-DASHBOARD-01` は、S00～S80完了後のread-only S90で検出された
High findingです。修正版の実Google Workspace再検証は`NOT_EXECUTED`です。

- 現在のSandboxはS00～S80 complete、S90/S99 incompleteとして保持する。
- T7を再実行せず、v2.8.8固定transfer refの検証完了まで停止する。
- Task、Ledger、Dashboard、Protection、named range、値、数式、note、書式を
  手動修復しない。
- Gmail labels、専用Calendar、Properties、owner edit triggerを重複・削除・
  上書きしない。
- Automationと5分triggerはOFFのまま維持する。

将来の別途承認後は、会社PC patch manifestの旧SHA-256を確認して指定ファイル
だけを指定順に差し替え、新SHA-256を再確認します。不一致なら停止します。
通常のSetup resumeだけがS00～S80を再確認し、read-only S90、成功後のS99へ
進めます。真正なFAILがあればS90/S99未完了のまま停止します。

Workspace ID、URL、アカウント名、ユーザー識別情報、メール本文、credential、
実データ、スクリーンショットを記録しないでください。

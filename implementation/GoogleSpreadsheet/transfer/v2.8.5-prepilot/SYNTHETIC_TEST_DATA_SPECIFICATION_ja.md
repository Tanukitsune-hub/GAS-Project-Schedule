# Phase 8B 用 Synthetic Test Data 仕様

状態: `PENDING_R5_CHECKSUM_PORTABILITY_CORRECTION`

## 許可されるデータ

- 架空の Task title、期限、label、review decision、コメント。
- 自分宛てで、内容を完全に自作した synthetic email 相当の最小テキスト。
- 架空の calendar summary と、承認済み専用 test sub-calendar のみ。
- safe error code、テスト case 名、相対 package path、SHA-256。

## 禁止されるデータ

- 実メール本文、実 sender/recipient、実 thread/message ID、実 Calendar ID、
  実 Spreadsheet ID/URL。
- 個人情報、顧客情報、案件情報、未公表情報、会社の機密、画像・screenshot を
  含む実データ。
- credential、API key、OAuth token、cookie、実 Provider endpoint/configuration。

## 最小 synthetic cases

| Case | Synthetic input | 期待する安全な結果 |
|---|---|---|
| S-01 | 新規 Task 一件 | ledger-backed Task projection。実 Gmail/Calendar は使わない。 |
| S-02 | 一つの valid manual edit | controlled business edit、authority remains valid。 |
| S-03 | invalid authority marker | row is isolated; snapshot/raw-row fallback はない。 |
| S-04 | multi-row edit with one invalid row | valid peer restore; invalid row isolate。 |
| S-05 | synthetic calendar reconcile intent | Outbox intent が durable。外部 I/O は承認済み test sub-calendar のみ。 |
| S-06 | authority exclusion before I/O | `CANCELLED`、Calendar call なし。 |
| S-07 | foreign-event safety simulation | delete なし、safe failure を記録。 |
| S-08 | R5 compensation marker and later forced re-enqueue | `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` の target、deterministic Event ID、`DELETE` / `PENDING` が残り、Task patch は 0 件。foreign / unowned Event は delete しない。 |

## 記録規則

入力値は識別不能な短い synthetic label にとどめ、結果 template には hash、safe
error code、PASS/FAIL/NOT EXECUTED、時刻、reviewer、redacted observation だけを
残します。実メールや実 Workspace からの copy/paste はしません。

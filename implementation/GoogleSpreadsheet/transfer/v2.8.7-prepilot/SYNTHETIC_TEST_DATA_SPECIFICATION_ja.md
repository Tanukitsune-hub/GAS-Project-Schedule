# Phase 8B v2.8.7 Sandbox — 合成テストデータ仕様

許可されるのは最小限のsynthetic dataだけです。

| Kind | Allowed example | Forbidden |
|---|---|---|
| Task title | `Synthetic task A` | 実案件、人名、顧客名 |
| Body | `Synthetic body.` | 実メール、実添付 |
| Date | `2030-01-02 09:00` | 実予定 |
| Address-like value | `synthetic.user@example.invalid` | 実address |
| Identifier | `synthetic-task-001` | 実Workspace ID |

S00–S80が既にrecordedの場合、Task row、Ledger、Dashboard、Protectionを手作業で
normalizationしない。checkbox `false`、Task header、Dashboard seedの正規性は修正版の
read-only diagnostic contractで評価する。実Google Workspace操作、OAuth、Provider、
Gmail、Calendar、deployment、Automationをこの仕様から許可しない。

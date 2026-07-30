# Phase 8B v2.8.10 Sandbox — 合成テストデータ仕様

使用できるのは最小限のsynthetic dataだけです。

| Kind | Allowed example | Forbidden |
|---|---|---|
| Task title | `Synthetic task A` | 実案件名、個人名、顧客名 |
| Body | `Synthetic body.` | 実メール、実添付 |
| Date | `2030-01-02 09:00` | 実予定 |
| Address-like value | `synthetic.user@example.invalid` | 実address |
| Identifier | `synthetic-task-001` | 実Workspace ID |

S00～S80が既にrecordedの場合、Task row、Ledger、Dashboard、Protectionを手動で
normalizationしません。canonical checkbox `false`、Task header、Dashboard
seed/marker/Protectionは修正版のread-only diagnostic contractで評価します。
実Google Workspace操作、OAuth、Provider、Gmail、Calendar、deployment、
Automationをこの仕様から許可しません。


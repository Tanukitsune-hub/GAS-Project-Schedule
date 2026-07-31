# T11 synthetic-data boundary

No synthetic Task, Gmail, Calendar, or Dashboard data is needed for this
visibility-only retransfer. The only permitted T1-01 observation is the
existing completed Sandbox's Quick Diagnostic output, recorded through the
bounded closed fields in `RESULTS_TEMPLATE_ja.md`.

Do not enter real or newly fabricated business data.

## Historical copied T10 material (nonoperative)

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


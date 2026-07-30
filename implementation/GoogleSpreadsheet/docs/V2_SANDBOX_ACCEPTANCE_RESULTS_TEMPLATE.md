# HISTORICAL TEMPLATE — DO NOT USE FOR 2.8.5 PHASE 8B

This retained historical template describes `2.8.1-prepilot` / Schema `2.2` /
Migration `0`, 10 Sheets, and 44 Task columns. It is not an acceptance record
or checklist for the current Code `2.8.8-prepilot` / Schema `2.6` / AI Schema
`2.0` / Migration `3` contract (11 Sheets, 5 hidden, 50 Task columns, and a
21-column Task Authority Ledger).

Do not use the failed historical `../transfer/v2.8.5-prepilot/` envelope.
Fixed T8 `69f843f6ea426ccb45d721a40508a35b0a59795d` is the separately verified
v2.8.8 carriage reference, but this retained v2.8.1 template remains
historical and must not be used as its current result template. T6.1 and T7
are historical evidence; do not copy any historical version values into a
current result record.

# Google Workspace Personal Work OS v2
# Sandbox Acceptance Results

> このfileへ実Spreadsheet / Script / Gmail / Calendar / Event ID、内部URL、
> OAuth token、credential、メール本文、件名、送信者、添付、個人情報、会社情報を
> 貼らないでください。証跡は非機密のscreen名、実行時刻、所要時間、safe error
> code、redaction済み画像の参照だけにします。

## 1. Environment

| Field | Entry |
|---|---|
| Environment name |  |
| Account type | Non-production personal Sandbox / Other |
| Test classification | Synthetic / self-data only |
| Date |  |
| Reviewer |  |
| Code Version | `2.8.1-prepilot` |
| Schema Version | `2.2` |
| AI Schema Version | `2.0` |
| Migration Version | `0` |
| TEST_MODE | `true` |
| Automation status | `OFF` expected |
| Provider | None expected |
| OAuth scopes observed | Record scope names only; no token or internal URL |
| Advanced Services observed | Gmail API v1 / Calendar API v3 expected |
| Package payload checksum |  |
| Package checksums verified | PASS / FAIL / NOT EXECUTED |

## 2. OAuth and Services

| Check | Result | Evidence reference | Safe notes |
|---|---|---|---|
| OAuth scopes exactly match Deployment Manifest | PASS / FAIL / NOT EXECUTED |  |  |
| Gmail API v1 enabled | PASS / FAIL / NOT EXECUTED |  |  |
| Calendar API v3 enabled | PASS / FAIL / NOT EXECUTED |  |  |
| `script.external_request` absent | PASS / FAIL / NOT EXECUTED |  |  |
| Drive / mail-send / broad Calendar absent | PASS / FAIL / NOT EXECUTED |  |  |
| OAuth prompts observed | PASS / FAIL / NOT EXECUTED |  | Record count only |

## 3. Setup and Phase 1

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| Setup result | PASS / FAIL / NOT EXECUTED |  |  |  |
| Setup resume result | PASS / FAIL / NOT EXECUTED |  |  |  |
| 10 Sheet / visibility / order | PASS / FAIL / NOT EXECUTED |  |  |  |
| `タスク一覧` 44 columns | PASS / FAIL / NOT EXECUTED |  |  |  |
| Validation / Checkbox / date format | PASS / FAIL / NOT EXECUTED |  |  |  |
| Protection / management columns | PASS / FAIL / NOT EXECUTED |  |  |  |
| Version metadata | PASS / FAIL / NOT EXECUTED |  |  |  |
| Gmail labels 7 | PASS / FAIL / NOT EXECUTED |  |  |  |
| Dedicated Calendar 1 | PASS / FAIL / NOT EXECUTED |  |  |  |
| Setup rerun / idempotency | PASS / FAIL / NOT EXECUTED |  |  |  |
| Unknown environment fail-closed | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| v1-like environment fail-closed | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| Phase 1 Harness | PASS / FAIL / NOT EXECUTED |  |  |  |

## 4. Phase 2 Gmail

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| `手動/取込` synthetic email | PASS / FAIL / NOT EXECUTED |  |  |  |
| `手動/除外` precedence | PASS / FAIL / NOT EXECUTED |  |  |  |
| Bounded search / one new Message | PASS / FAIL / NOT EXECUTED |  |  |  |
| Read/unread independence | PASS / FAIL / NOT EXECUTED |  |  |  |
| Message ID dedup | PASS / FAIL / NOT EXECUTED |  |  | Do not record ID |
| Stable Thread Key behavior | PASS / FAIL / NOT EXECUTED |  |  | Do not record raw key |
| Source link behavior | PASS / FAIL / NOT EXECUTED |  |  | Do not capture URL |
| Raw ID hidden | PASS / FAIL / NOT EXECUTED |  |  |  |
| Phase 2 Harness | PASS / FAIL / NOT EXECUTED |  |  |  |

## 5. Phase 3 Mock AI and Task Review

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| High-confidence Mock Task | PASS / FAIL / NOT EXECUTED |  |  |  |
| Review Task | PASS / FAIL / NOT EXECUTED |  |  |  |
| Accept / reject | PASS / FAIL / NOT EXECUTED |  |  |  |
| Pending change | PASS / FAIL / NOT EXECUTED |  |  |  |
| `manual_fields` preservation | PASS / FAIL / NOT EXECUTED |  |  |  |
| Installable edit Trigger | PASS / FAIL / NOT EXECUTED |  |  |  |
| Bulk paste | PASS / FAIL / NOT EXECUTED |  |  |  |
| Completion / exclusion | PASS / FAIL / NOT EXECUTED |  |  |  |
| Due date / priority / status edit | PASS / FAIL / NOT EXECUTED |  |  |  |
| Prompt-injection fixture | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| Invalid JSON / schema fixture | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| Phase 3 Harness | PASS / FAIL / NOT EXECUTED |  |  |  |

## 6. Phase 4 Calendar

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| Dedicated Calendar only | PASS / FAIL / NOT EXECUTED |  |  |  |
| Primary Calendar unchanged | PASS / FAIL / NOT EXECUTED |  |  |  |
| Foreign Event unchanged | PASS / FAIL / NOT EXECUTED |  |  |  |
| Event CREATE | PASS / FAIL / NOT EXECUTED |  |  |  |
| Event UPDATE | PASS / FAIL / NOT EXECUTED |  |  |  |
| Event DELETE | PASS / FAIL / NOT EXECUTED |  |  |  |
| Event NOOP | PASS / FAIL / NOT EXECUTED |  |  |  |
| Duplicate prevention | PASS / FAIL / NOT EXECUTED |  |  |  |
| Calendar Outbox | PASS / FAIL / NOT EXECUTED |  |  |  |
| Calendar CAS conflict | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| Phase 4 Harness | PASS / FAIL / NOT EXECUTED |  |  |  |

## 7. Phase 5–7 Mock / Local path

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| Phase 5 Harness | PASS / FAIL / NOT EXECUTED |  |  | Real Provider remains skipped |
| Phase 6 Harness | PASS / FAIL / NOT EXECUTED |  |  | Real Trigger/Gmail remain skipped |
| Phase 7 Harness | PASS / FAIL / NOT EXECUTED |  |  | Real recovery remains skipped |
| Provider registry empty / fail-closed | PASS / FAIL / NOT EXECUTED |  |  |  |
| TEST_MODE enable refusal | PASS / FAIL / NOT EXECUTED |  |  |  |
| Automation OFF | PASS / FAIL / NOT EXECUTED |  |  |  |
| Time-driven Trigger absent | PASS / FAIL / NOT EXECUTED |  |  |  |
| Retry structure | PASS / FAIL / NOT EXECUTED |  |  |  |
| Dead Letter structure | PASS / FAIL / NOT EXECUTED |  |  |  |
| Manual retry | PASS / FAIL / NOT EXECUTED |  |  | Conditional |
| Provider suppression synthetic path | PASS / FAIL / NOT EXECUTED |  |  |  |
| Run History safe output | PASS / FAIL / NOT EXECUTED |  |  |  |

## 8. Dashboard and Diagnostics

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| Dashboard 17 metrics | PASS / FAIL / NOT EXECUTED |  |  |  |
| Dashboard source read-only | PASS / FAIL / NOT EXECUTED |  |  |  |
| Dashboard layout conflict | PASS / FAIL / NOT EXECUTED |  |  | Advanced |
| Quick Diagnostic | PASS / FAIL / NOT EXECUTED |  |  |  |
| Quick Diagnostic duration | PASS / FAIL / NOT EXECUTED |  |  | Target 60 sec |
| Deep Diagnostic | PASS / FAIL / NOT EXECUTED |  |  |  |
| Deep Diagnostic duration | PASS / FAIL / NOT EXECUTED |  |  | Target 180 sec |
| Diagnostic read-only | PASS / FAIL / NOT EXECUTED |  |  |  |

## 9. Runtime and Trigger evidence

| Check | Result | Duration | Evidence reference | Safe notes |
|---|---|---:|---|---|
| Worker duration | PASS / FAIL / NOT EXECUTED |  |  |  |
| Trigger list: edit 1 / time-driven 0 | PASS / FAIL / NOT EXECUTED |  |  | No UID screenshot |
| Lock contention | PASS / FAIL / NOT EXECUTED |  |  | Conditional |
| Setup duration | PASS / FAIL / NOT EXECUTED |  |  |  |
| Menu fallback | PASS / FAIL / NOT EXECUTED |  |  |  |

## 10. Phase result summary

| Result group | Result | Evidence reference | Safe notes |
|---|---|---|---|
| Setup result | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 1 result | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 2 result | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 3 result | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 4 result | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 5 Harness | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 6 Harness | PASS / FAIL / NOT EXECUTED |  |  |
| Phase 7 Harness | PASS / FAIL / NOT EXECUTED |  |  |
| Dashboard | PASS / FAIL / NOT EXECUTED |  |  |

## 11. Skipped / blocked

| Boundary | Status | Reason / decision reference |
|---|---|---|
| Real Provider connection | NOT EXECUTED | Provider not confirmed |
| Company approval | NOT CONFIRMED |  |
| Credential storage approval | NOT CONFIRMED |  |
| TEST_MODE=false | NOT EXECUTED | Out of Phase 8B scope |
| Normal Inbox automatic polling | NOT EXECUTED | Automation OFF |
| Time-driven production Trigger | NOT EXECUTED | Automation OFF |
| Real work email / company data | NOT EXECUTED | Prohibited |
| Personal real-work pilot | NOT EXECUTED | Phase 8D not started |

## 12. Failures

| Failure no. | Part / check | Safe error code | Time | Non-confidential summary | Stopped? | Cleanup |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 13. Screenshots / evidence index

| Evidence reference | What it proves | Redaction checked | Storage location |
|---|---|---|---|
|  |  | YES / NO |  |

Do not embed or link to a Google Workspace internal URL here.

## 14. Final decision

| Stage | Decision | Basis |
|---|---|---|
| Package integrity | GO / CONDITIONAL GO / NO-GO |  |
| TEST_MODE=true Sandbox acceptance | GO / CONDITIONAL GO / NO-GO |  |
| TEST_MODE=false Sandbox | NO-GO |  |
| Personal real-work pilot | NO-GO |  |

```text
Critical failures:
High failures:
Medium failures:
Unresolved external items:
Required remediation:
Decision owner:
Decision date:
```

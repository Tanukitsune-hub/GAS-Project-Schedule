# Google Workspace Personal Work OS v2
# Prepilot Readiness Checklist

- Assessment date: 2026-07-26 JST
- Code Version: `2.8.1-prepilot`
- Schema Version: `2.2`
- AI Schema Version: `2.0`
- Migration Version: `0`
- Current mode: `TEST_MODE=true`
- Automation default: `OFF`
- Phase 8A: local package and Sandbox procedure prepared
- Phase 8B / 8C / 8D: not started

Status vocabulary:

```text
PASS_LOCAL
PARTIAL
READY_FOR_TEST_MODE_TRUE_SANDBOX
NOT_EXECUTED
BLOCKED
REQUIRED_BEFORE_TEST_MODE_FALSE
REQUIRED_BEFORE_PILOT
NOT_APPLICABLE
```

## 1. Git and release boundary

| Check | Status | Evidence / required action |
|---|---|---|
| Repository root is `GoogleSpreadsheet` | PASS_LOCAL | `git rev-parse --show-toplevel` |
| Audited Phase 1–7 baseline boundary identified | PASS_LOCAL | staged 24-suite `2.7.0-phase7` boundary: 384 PASS / 0 FAIL / 10 SKIPPED |
| Baseline candidate contains no real secret | PASS_LOCAL | staged extraction and Archive scan |
| Task-only Codex prompt excluded from baseline | PASS_LOCAL | current index and working-tree inventory |
| Baseline local paths removed | PASS_LOCAL | placeholder paths; high-confidence absolute-path scan 0 |
| Cached and working whitespace | PASS_LOCAL | `git diff --cached --check`; `git diff --check` |
| Codex Git write attempt | NOT_EXECUTED | one index write attempt was denied at `.git/index.lock`; no bypass was attempted |
| Git author identity | BLOCKED | repository/global `user.name` and `user.email` are not configured; Codex did not invent them |
| Baseline commit | NOT_EXECUTED | no commits exist; run the documented safe normal-terminal procedure |
| Phase 8A branch | NOT_EXECUTED | create only after the truthful baseline commit |
| Remediation / Phase 8A commits | NOT_EXECUTED | Git closeout required in a normal terminal |
| Push / PR | NOT_APPLICABLE | explicitly out of scope |

## 2. Phase 8A deployment package

| Check | Status | Evidence / required action |
|---|---|---|
| Deterministic package path | PASS_LOCAL | `release/v2.8.1-prepilot/` |
| Source/package parity | PASS_LOCAL | 22 `.gs` + `appsscript.json`; SHA-256 parity 23/23 |
| Package inventory/checksums | PASS_LOCAL | 26 files; 25 checksum records; read-only validator PASS |
| Canonical payload-list hash | PASS_LOCAL | `8fc8084126ea09ecea79cf0fb7c5d297e0cb6859894576cb9656d72f787fe9fa` |
| Secret / actual ID / absolute-path scan | PASS_LOCAL | actual findings 0; three reviewed synthetic fixtures confined to `99_TestHarness.gs` |
| `.clasp.json` and credential files absent | PASS_LOCAL | exact package inventory and filename scan |
| Quickstart local links | PASS_LOCAL | Manual Guide and Results Template 2/2 |
| Real deployment | NOT_EXECUTED | Phase 8B only; this checklist records preparation, not Workspace acceptance |

## 3. Version and source inventory

| Check | Status | Evidence / required action |
|---|---|---|
| Code Version | PASS_LOCAL | `2.8.1-prepilot` |
| Schema Version | PASS_LOCAL | `2.2` |
| AI Schema Version | PASS_LOCAL | `2.0` |
| Migration Version | PASS_LOCAL | `0` |
| `.gs` inventory | PASS_LOCAL | 22 files |
| Manifest | PASS_LOCAL | V8, `Asia/Tokyo`, 7 OAuth scopes |
| External-request scope absent | PASS_LOCAL | static scan |
| `UrlFetchApp` absent | PASS_LOCAL | static scan |
| Phase 8A product-code changes absent | PASS_LOCAL | Phase 8A changes are package, validation tooling and documentation only |

## 4. TEST_MODE and automation

| Check | Status | Evidence / required action |
|---|---|---|
| `TEST_MODE=true` retained | PASS_LOCAL | `00_Config.gs` |
| Automation default OFF | PASS_LOCAL | config, Setup and Trigger review |
| Setup creates no five-minute production Trigger | PASS_LOCAL | static/local tests |
| Production enable is rejected while `TEST_MODE=true` | PASS_LOCAL | shared readiness and negative tests |
| Owner installable edit Trigger implementation | PASS_LOCAL | local VM/static tests |
| Real installable edit event | NOT_EXECUTED | non-confidential Workspace required |
| Real time-driven Trigger | NOT_EXECUTED | `TEST_MODE=false`, Provider readiness and Workspace required |
| Kill switch and canonical Trigger lifecycle | PASS_LOCAL | local failure-injection tests |

## 5. Provider and approval

| Check | Status | Evidence / required action |
|---|---|---|
| Empty production Provider registry | PASS_LOCAL | fail-closed implementation |
| Production factory boundary | PASS_LOCAL | registry/component validation |
| Lock-free external classification boundary | PASS_LOCAL | Gmail search/body/label、AI transport、Calendar list/CRUDは短時間claim Lockの外側。Mock Lockで呼出時の非保持を直接検証（F-001/F-007 closure） |
| Production Provider failure suppression / Run History | PASS_LOCAL | transient Provider失敗をbounded suppression accountingへ接続し、設定失敗を含む全run outcomeをrun_id冪等で処理履歴へ記録（F-014 closure） |
| CAS conflict failure injection | PASS_LOCAL | claim ownership、stage、input hash、Task row_version、二重Worker、Calendar副作用後Task/Outbox競合を直接注入（F-015 closure） |
| Provider selected | BLOCKED | external decision |
| Endpoint and model selected | BLOCKED | external decision |
| Provider-specific Adapter | BLOCKED | implement after decision |
| Network transport | BLOCKED | implement after decision |
| Credential loader | BLOCKED | implement after storage decision |
| Company approval | BLOCKED | not confirmed |
| Data-policy approval | BLOCKED | not confirmed |
| Credential-storage approval | BLOCKED | not confirmed |
| Real Provider connection | NOT_EXECUTED | do not execute before all preceding items |

## 6. OAuth and deployment

| Check | Status | Evidence / required action |
|---|---|---|
| Current OAuth scope allow-list | PASS_LOCAL | 7 scopes, no Drive/Mail-send/external-request |
| Actual OAuth consent | NOT_EXECUTED | Workspace/admin validation |
| Advanced Gmail API v1 enabled | NOT_EXECUTED | deployment check |
| Advanced Calendar API v3 enabled | NOT_EXECUTED | deployment check |
| Real `.clasp.json` excluded | PASS_LOCAL | `.gitignore` and `git check-ignore` |
| Script deployment to non-confidential Sheet | NOT_EXECUTED | TEST_MODE=true Sandbox step |

## 7. Setup and Sheets

| Check | Status | Evidence / required action |
|---|---|---|
| Empty-Sheet Setup safety | PASS_LOCAL | Phase 1 regression |
| Existing-v2 rerun and metadata update | PASS_LOCAL | baseline upgrade tests |
| Unknown/v1 environment fail-closed | PASS_LOCAL | Phase 1 negative tests |
| Setup budget propagation | PASS_LOCAL | local/static negative tests |
| Setup consent and next-stage explanation | PASS_LOCAL | text and flow tests |
| Real Data Validation / Protection / hidden Sheets | NOT_EXECUTED | TEST_MODE=true Sandbox |
| Real Setup time and resume | NOT_EXECUTED | TEST_MODE=true Sandbox |

## 8. Gmail

| Check | Status | Evidence / required action |
|---|---|---|
| Formal seven-label contract | PASS_LOCAL | schema and tests |
| `手動/除外` precedence | PASS_LOCAL | local tests |
| Message-scoped `手動/取込` priority in automatic path | PASS_LOCAL | local tests |
| Spam / Trash / promotions / social exclusion | PASS_LOCAL | production-code VM tests |
| Newsletter policy | BLOCKED | product decision; enable Gate remains closed |
| Calendar-notification policy | BLOCKED | product decision; enable Gate remains closed |
| Manual/automatic Gmail call caps | PASS_LOCAL | 20 / 160 call boundaries |
| Message-ID deduplication | PASS_LOCAL | Worker/Gateway tests |
| Real Gmail labels/search/filter/quota | NOT_EXECUTED | TEST_MODE=true/false Sandbox as applicable |

## 9. Calendar

| Check | Status | Evidence / required action |
|---|---|---|
| Dedicated Calendar ownership boundary | PASS_LOCAL | local/static tests |
| CalendarList pagination | PASS_LOCAL | 250/page, 10-page cap, token-cycle guard |
| Event CRUD/retry idempotency | PASS_LOCAL | local Worker/Calendar tests |
| Primary Calendar unchanged | NOT_EXECUTED | TEST_MODE=true Sandbox |
| Real Calendar pagination / Event CRUD | NOT_EXECUTED | TEST_MODE=true Sandbox |

## 10. Task edit

| Check | Status | Evidence / required action |
|---|---|---|
| Owner-only installable edit Trigger | PASS_LOCAL | implementation and 10/10 remediation tests |
| Canonical source/UID enforcement | PASS_LOCAL | missing/mismatch negative tests |
| Bulk/multiple-cell bound | PASS_LOCAL | bounded edit handler |
| Management fields protected | PASS_LOCAL | local/static checks |
| Manual fallback | PASS_LOCAL | menu path |
| Real edit event, recursion and ownership | NOT_EXECUTED | TEST_MODE=true Sandbox |

## 11. Dashboard

| Check | Status | Evidence / required action |
|---|---|---|
| `15_Dashboard.gs` exists | PASS_LOCAL | source inventory |
| Seventeen aggregate indicators | PASS_LOCAL | metric order and tests |
| Explicit refresh only | PASS_LOCAL | menu/static test |
| Worker non-coupling | PASS_LOCAL | call graph/static test |
| Source-Sheet read-only aggregation | PASS_LOCAL | no source write path |
| Custom row/formula preservation | PASS_LOCAL | system markerで所有する連続3列blockだけを更新し、blank-key行の値、formula、note、validation、merge、protection、named range、formatをfail closedで保護（F-005 closure） |
| Corrupt Dashboard / failed Quick Diagnostic write prevention | PASS_LOCAL | refresh前のQuick Diagnosticとlayout ownership検査が失敗した場合はwrite前に`E_DASHBOARD_LAYOUT_CONFLICT`で停止（F-005 closure） |
| 100 / 1,000 / 10,000 rows | PASS_LOCAL | local linear checks |
| Direct `E_DASHBOARD_LAYOUT_CONFLICT` negative test | PASS_LOCAL | blank-key value/formula、metadata、foreign marker、diagnostic failureを直接注入し、値・formula・行数・source Sheet不変を検証（F-013 closure） |
| Real Dashboard UI/runtime | NOT_EXECUTED | TEST_MODE=true Sandbox |

## 12. Diagnostic, retry and Dead Letter

| Check | Status | Evidence / required action |
|---|---|---|
| Quick Diagnostic read-only boundary | PASS_LOCAL | local/static tests |
| Deep Diagnostic read-only boundary | PASS_LOCAL | local/static tests |
| Retry schedule and attempt cap | PASS_LOCAL | 5/15/60 minutes, fourth failure DEAD |
| Manual Dead Letter retry | PASS_LOCAL | internal-ID, maximum-five boundary |
| Quick 60-second runtime | NOT_EXECUTED | Workspace measurement |
| Deep 180-second runtime | NOT_EXECUTED | Workspace measurement |
| Real retry / label / Calendar recovery | NOT_EXECUTED | controlled failure Sandbox |

## 13. Security and information handling

| Check | Status | Evidence / required action |
|---|---|---|
| Working-tree high-confidence secret scan | PASS_LOCAL | real secret 0; one synthetic fixture marker |
| Staged Baseline secret scan | PASS_LOCAL | real secret 0 |
| Archive secret scan | PASS_LOCAL | 15 entries, secret shape 0 |
| Credential redaction | PASS_LOCAL | synthetic standalone/header/URI/JSON/query/multiline tests |
| Persistent sink sanitization | PASS_LOCAL | Task/AI/Calendar/error/log tests |
| Raw Gmail/Calendar IDs absent from Dashboard | PASS_LOCAL | source and output tests |
| Prompt-injection boundary | PASS_LOCAL | strict schema and synthetic fixtures |
| Real credential handling | NOT_EXECUTED | blocked until approved design |

## 14. Sandbox and rollout evidence

| Stage | Status | Exit condition |
|---|---|---|
| Local/Mock regression execution | PASS_LOCAL | 34 suites、471 PASS / 0 FAIL / 11 SKIPPED。SKIPPEDは実Google Workspace／実Providerのみ |
| Local remediation completion | PASS_LOCAL | F-001/F-005/F-007/F-013/F-014/F-015のcode-remediable安全性範囲を閉鎖。Phase 8A UX reviewのpilot-deferred Medium 3件は下記に分離 |
| Phase 8A package preparation | PASS_LOCAL | package、checksum、Quickstart、Manual Guide、results template、read-only validator完成 |
| TEST_MODE=true non-confidential Sandbox | CONDITIONAL_GO | checksum照合後、新規clean Sheet、synthetic/self data、Automation OFF、実Providerなし。実LockService競合と実Calendar CRUDはまだNOT EXECUTED |
| TEST_MODE=false Sandbox | NO_GO | Provider/model/endpoint/auth、会社承認、credential保管承認、manifest scope判断、実Provider／実Workspace Gateが未確定・未実施 |
| Personal real-work pilot | BLOCKED | Git closeout, TEST_MODE=false Sandbox, all external approvals and Workspace acceptance |
| Limited-user rollout | BLOCKED | successful personal pilot and operational evidence |
| Department rollout | BLOCKED | company governance, credential/deployment controls, retention and rollout evidence |

Phase 8A UX reviewで、TEST_MODE=true Sandbox開始を妨げないが個人pilot前に再評価する
code-level Findingを3件記録しています: 平坦な21項目menu、`REFUSED`結果の汎用next
action、最大10,500文字の内部stage JSON dialog。Phase 8Aでは新機能・product codeを
変更せず、QuickstartとPart A-L Guideで通常経路と高度なfailure testを分離しました。

## 15. Final sign-off fields

```text
Git baseline commit:
Phase 8A branch:
Remediation code/test commit:
Documentation commit:
Release package commit:
Package CHECKSUMS.sha256:
Sandbox Spreadsheet classification:
Workspace acceptance date:
Provider decision reference:
Company approval reference:
Credential-storage approval reference:
TEST_MODE=false authorization:
Personal pilot decision:
Reviewer:
```

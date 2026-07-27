## Step 7: Calendar intent／Outboxを再監査する

次を確認してください。

- Task commit時にCalendar intentがdurable stateへ入る
- Outbox enqueue失敗時もintentが残る
- Outbox enqueue成功後のTask ack失敗時もintentが残る
- recovery enqueueがdeterministic keyで重複しない
- stale ackが新generation／新intentをclearしない
- NOOP、CREATE、UPDATE、DELETEの全actionで同じcontract
- quarantine／orphaned Taskが通常reconciliationへ入らない
- Calendar external I/Oはmain Script Lock外
- Event markerとinstance markerの既存安全性を維持する
- foreign／duplicate marker Eventを推測操作しない

---

## Step 8: test traceabilityを作る

Round 4 suiteが`20 PASS`であっても、元指示の必須項目は33 categoryあり、複数write routeへ適用されます。PASS数だけではcoverageを判断しません。

`docs/R4_VERIFICATION_MATRIX.md`またはRound 4 reportへ、少なくとも次の列を持つmatrixを作ってください。

```text
Requirement ID
Finding
Failure boundary / scenario
Write route
Test file
Test name
Assertion
Pre-fix reproduction
Post-fix result
Real Workspace dependency
Status
```

対象route:

```text
new Task insert
existing Task update
manual edit
Review ACCEPT
Review REJECT
Review restage
Calendar patch
Calendar intent acknowledge
Migration 2.5 -> 2.6
multi-row restore
header restore
diagnostics
repair
```

元指示の1～33をすべてmappingしてください。  
1つのtestが複数要件を満たす場合も、各要件行からtest名へ明示的にlinkしてください。

追加必須test:

1. canonical pathにroot-level duplicateがない
2. 11 Sheets／hidden 5／Task 50 columns
3. all current docsのCode／Schema／Migration／Gate一致
4. Source／Release self-reference rule
5. B5 diff boundary
6. shared validator caller inventory
7. raw rowがauthority validation前にindex化されない
8. duplicate ID／origin keyとquarantine
9. row move／delete／orphan policy
10. hash canonicalization
11. cross-boundary header/data paste
12. first insert uncertain write
13. outbox enqueue success／ack failure
14. migration partial stateからのresume
15. diagnostic read-only
16. secret scan

---

## Step 9: local full verification

最終candidate sourceで、既存testと新規testをすべて実行してください。

最低限:

```bash
node tests/remediation_round4_test.js
node tests/remediation_round3_test.js
node tests/phase3_independent_test.js
node tools/validate_apps_script_v2.js
```

加えて、Repositoryにある`tests/*.js`をすべて実行してください。

期待条件:

```text
all suites executed
FAIL: 0
unexpected SKIPPED: 0
real Provider / real Workspace only remain SKIPPED or NOT EXECUTED
static validation: 10/10 PASS
```

PASS数は実測値を報告し、過去の`582 PASS`を固定期待値として捏造しないでください。test追加により増えることは正常です。

---

## Step 10: releaseをSource commitから再生成する

最終Source commitを固定してから、release buildを実行してください。

確認項目:

```text
Phase 8B:
  TEST_MODE=true
  Automation OFF
  Test Harness included
  source parity
  checksum
  scope allow-list
  Advanced Service allow-list
  secret scan
  provenance

Phase 8C candidate:
  TEST_MODE=false
  Automation OFF
  Test Harness excluded
  only audited TEST_MODE transform
  source parity except transform
  checksum
  scope allow-list
  Advanced Service allow-list
  secret scan
  provenance
```

manifest:

- canonical Repository名
- exact Source commit SHA
- release content commitは`SELF`
- build timestamp
- Code／Schema／AI Schema／Migration
- TEST_MODE
- Automation state
- package file count
- payload hash

B5自身の確定SHAをB5内へ事前埋込みしないでください。

---

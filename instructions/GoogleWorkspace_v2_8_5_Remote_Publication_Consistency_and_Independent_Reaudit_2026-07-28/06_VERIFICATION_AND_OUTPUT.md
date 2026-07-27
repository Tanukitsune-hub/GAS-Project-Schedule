## Local startup

この作業はApps Scriptの実deploymentを行いません。

local verificationはNode.jsで実行します。Repository既存のpackage manager／scriptがある場合はそれを優先し、ない場合は各`.js` testを直接実行してください。

例:

```bash
node tests/remediation_round4_test.js
node tools/validate_apps_script_v2.js
```

HTML visualizationの確認はlocal fileまたはlocal HTTP serverで行います。

```bash
python -m http.server 8000
```

その場合も外部CDN、外部font、external APIを追加しないでください。

---

## Verification

最終報告には、少なくとも次の実測結果を含めてください。

### Git

```text
git top-level
local branch
local HEAD
origin URL
origin/main SHA
origin/codex/r4-authority-protocol start SHA
original A5 SHA
original B5 SHA
final Source SHA
final Release SHA
publication evidence SHA
B5 parent validation
remote ancestor validation
push result
remote branch final SHA
fresh clone HEAD
working tree cleanliness
```

### Diff boundary

```text
remote base -> Source
Source -> Release
Release -> Publication Evidence
root-level duplicate path count
canonical subtree file count
```

### Architecture

```text
Sheet count
hidden Sheet count
Task column count
authority ledger schema
authority control fields
hash algorithm
shared validator callers
quarantine exclusions
migration state machine
header restore
Calendar intent recovery
```

### Tests

```text
suite count
PASS
FAIL
SKIPPED
Round 4 targeted
Round 3 regression
Phase 3 independent
static validator
fresh clone rerun
verification matrix coverage
```

### Release

```text
Phase 8B build
Phase 8B checksum
Phase 8B source parity
Phase 8B secret scan
Phase 8C build
Phase 8C audited transform parity
Phase 8C scope allow-list
Phase 8C secret scan
manifest Source SHA
manifest release commit marker
```

### Not executed

```text
OAuth consent
real Gmail mutation
real Calendar CRUD
installable edit Trigger real event
time-driven Trigger
LockService real contention
Apps Script quota/runtime
real Provider
deployment
clasp push
```

---

## Done when

次がすべて満たされたときだけ完了です。

1. local A5／B5の存在と系譜を確認した。
2. canonical Repository pathを確認した。
3. root-level duplicateを排除または不在確認した。
4. 既存A5／B5をrewriteしていない。
5. 必要な場合、補正Source／Release pairを追加した。
6. Task Authority Ledgerの実装をtest数ではなくcode pathで再監査した。
7. source of truthのbusiness層とtechnical authority層を正本へ明文化した。
8. Decisionを追加した。
9. 11 Sheets／hidden 5／50 Task columnsをcurrent artifacts全体で統一した。
10. 元R4指示1～33と全write routeのtraceabilityを作成した。
11. all testsとstatic validationがFAIL 0。
12. fresh cloneから再現した。
13. release packageがfinal Sourceから生成されている。
14. Source／Release commitがGitHub上で解決可能。
15. normal pushだけを使用した。
16. AutomationがOFF。
17. secret／実Workspace情報を保存していない。
18. 最高statusを`READY_FOR_INDEPENDENT_REAUDIT`に留めた。

---

## Output required from Codex

最終報告は次の順で出してください。

```markdown
# Conclusion

- Status:
- Reason:
- Highest gate reached:
- Independent re-audit status:

## Changed files

## Diff summary

## Git lineage

- Repository top-level:
- Branch:
- Remote:
- Remote base SHA:
- Original Source A5:
- Original Release B5:
- Original B5 parent:
- Corrected Source SHA:
- Corrected Release SHA:
- Publication evidence SHA:
- Remote final SHA:
- Fresh clone HEAD:

## Repository topology

- Canonical implementation path:
- Root-level duplicate paths:
- Source file count:
- Release file count:

## Canonical consistency

- Code:
- Schema:
- AI Schema:
- Migration:
- Overall status:
- Sheet count:
- Hidden Sheet count:
- Task columns:
- Decision added:
- Business source of record:
- Technical recovery authority:

## Authority protocol verification

- Shared validator callers:
- Two-slot failure boundaries:
- First insert recovery:
- Quarantine:
- Row move/delete:
- Hash canonicalization:
- Migration:
- Header restore:
- Diagnostic purity:
- Calendar intent recovery:

## Test traceability

- Matrix file:
- R4 requirements covered:
- Write routes covered:
- Gaps:

## Local startup

## Verification performed

- Total suites:
- PASS:
- FAIL:
- SKIPPED:
- Static:
- Fresh clone:
- Phase 8B release:
- Phase 8C candidate:
- Secret scan:

## Remote publication

- Push command:
- Push result:
- Remote reachability:
- Divergence check:
- Force push used: NO

## Remaining risks / unverified points

## Not executed

## Guardrails

- context-hub accessed: NO
- reset/clean/rebase/amend: NO
- force push: NO
- deployment/clasp push: NO
- Automation enabled: NO
- real Workspace data stored: NO
- Phase 8B GO/PASS declared: NO
- Phase 8C GO declared: NO
- Production/Pilot ready declared: NO

## Execution metrics

- Elapsed time:
- Token usage:
```

---

# Codexチャット欄用の短い指示

次の文をCodexのチャット欄へ貼り付け、GitHub上のindexと全6分割ファイルを順番に読ませてください。

```text
次のGitHub上の指示書を唯一の作業指示として読み込み、indexに記載された全6ファイルを番号順に確認したうえで、Tanukitsune-hub/GAS-Project-Scheduleだけを対象に実行してください。

参照URL: https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/codex/r4-authority-protocol/instructions/GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_Prompt_2026-07-28.md

対象index: `instructions/GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_Prompt_2026-07-28.md`

報告済みlocal Source A5 `9705def085b66b5e521c7ec93804c228eb60e7ba`／Release B5 `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf`を最初に検証し、GitHub canonical path、commit lineage、正本4文書、Task Authority Ledger、11 Sheets／hidden 5／50 Task columns、test traceability、release provenanceを完全に確認してください。

既存A5／B5、stage済み・untracked・historical artifactを破棄せず、reset、clean、amend、rebase、force push、unrelated revertを行わないでください。問題があれば別worktreeまたは追加の補正Source／Release commit pairで直してください。

全local test、static validation、fresh clone verification、release checksum/parity/secret scanがPASSし、normal fast-forward push後にfinal Source／Release SHAがGitHubから解決できる場合だけ、最高statusをREADY_FOR_INDEPENDENT_REAUDITとしてください。Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyは宣言しないでください。
```
